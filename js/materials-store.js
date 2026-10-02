/* ------------------------------ Materials Used store ------------------------------
   Which inventory items, and how many of each, a job used — Supabase's
   job_materials_used (job_id, inventory_item_id → inventory_items.id,
   quantity). Loaded on the two pages that use it, right after
   js/inventory-store.js: the job page (its Materials Used list) and Boards
   (dragging a job to Completed deducts its materials from inventory). Once
   jobs and inventory are loaded it:
     1. Runs the one-time migration: if job_materials_used has no rows yet,
        copies this browser's Materials Used from localStorage into it.
     2. Fetches every row into JOB_MATERIALS.
   Page scripts start rendering through whenAppReady(), which waits for this
   (window.materialsReady). One row per item per job: adding an item a job
   already has adds to that row's quantity. Names and prices aren't stored —
   they're read live from the inventory item every time. */
const JOB_MATERIALS = [];

/* ----------- Legacy localStorage Materials Used (read by the migration only) -----------
   { jobId: [{ inventory_id, quantity }] }, where inventory_id is an item's
   OLD app id ("inv2") — or, for items added after Inventory moved to
   Supabase, its uuid. getInventoryItem() resolves either (via legacy_id).
   Only ever READ now, once; nothing writes it anymore. Left in place as a
   backup. */
const LEGACY_JOB_MATERIALS_KEY = "foreman-job-materials";

function legacyLocalMaterials() {
  try {
    const stored = JSON.parse(localStorage.getItem(LEGACY_JOB_MATERIALS_KEY));
    if (stored && typeof stored === "object") return stored;
  } catch (e) {}
  return {};
}

// Runs only while job_materials_used is empty — later loads skip it. A line
// whose job or item can't be found is skipped with a warning naming both,
// never the whole migration. The same item listed twice on one job (once by
// old id, once by uuid) becomes one row with the quantities added up.
async function migrateLocalMaterialsIfNeeded(client) {
  const { count, error } = await client.from("job_materials_used").select("id", { count: "exact", head: true });
  if (error) throw error;
  if (count > 0) return;

  const legacy = legacyLocalMaterials();
  const merged = new Map(); // "jobId|itemUuid" → row
  const start = Date.now();
  let skipped = 0;
  Object.keys(legacy).forEach(jobId => {
    (Array.isArray(legacy[jobId]) ? legacy[jobId] : []).forEach(line => {
      const job = getJob(jobId);
      const item = getInventoryItem(line.inventory_id);
      if (!job || !item) {
        skipped++;
        console.warn(`[materials] Migration: job ${jobId}${job ? " (#" + job.job_number + ")" : " (no such job in Supabase)"} lists inventory item "${line.inventory_id}"${item ? "" : ", which doesn't match any inventory_items row (by legacy_id or id)"} — that line was skipped.`);
        return;
      }
      const key = jobId + "|" + item.id;
      const quantity = Math.round(Number(line.quantity) || 0);
      if (merged.has(key)) merged.get(key).quantity += quantity;
      else merged.set(key, {
        id: newLabelId(),
        job_id: jobId,
        inventory_item_id: item.id,
        quantity,
        // One millisecond apart so each job's lines keep their order.
        created_at: new Date(start + merged.size).toISOString(),
      });
    });
  });

  const rows = [...merged.values()];
  if (!rows.length) return;
  const { error: insertError } = await client.from("job_materials_used").insert(rows);
  if (insertError) throw insertError;
  console.info(`[materials] Migrated ${rows.length} Materials Used line(s) from localStorage to Supabase` + (skipped ? ` (${skipped} skipped — see warnings above).` : "."));
}

async function loadMaterials() {
  const client = window.supabaseClient;
  if (!client) throw new Error("Supabase client unavailable (see the [supabase] error above).");
  await migrateLocalMaterialsIfNeeded(client);
  const { data, error } = await client.from("job_materials_used").select("*").order("created_at");
  if (error) throw error;
  JOB_MATERIALS.splice(0, JOB_MATERIALS.length, ...data.map(r => ({
    id: r.id, job_id: r.job_id, inventory_item_id: r.inventory_item_id, quantity: Number(r.quantity) || 0, created_at: r.created_at,
  })));
}

// Old ids resolve to inventory uuids, so jobs and inventory load first. If
// Supabase can't be reached the lists show empty and say why — and
// completing a job won't mark its materials deducted (see
// materialsAvailableForDeduction), so the deduction can still happen later.
window.materialsReady = Promise.all([jobsReady, window.inventoryReady])
  .then(loadMaterials)
  .catch(err => {
    console.error("[materials] Couldn't load Materials Used from Supabase.", err);
    window.materialsLoadError = err;
  });

/* -------------------------------- Reads / writes ------------------------------- */

// A job's lines, oldest first, as { id, inventory_id (the item's uuid), quantity }.
function getMaterialsForJob(jobId) {
  return JOB_MATERIALS
    .filter(m => m.job_id === jobId)
    .map(m => ({ id: m.id, inventory_id: m.inventory_item_id, quantity: m.quantity }));
}

// Only true once this page has actually loaded the Materials Used rows —
// setJobStatus() checks it before marking a job's materials deducted.
function materialsAvailableForDeduction() {
  return !window.materialsLoadError;
}

async function runMaterialsWrite(apply, write) {
  const before = JOB_MATERIALS.map(m => Object.assign({}, m));
  apply();
  const client = window.supabaseClient;
  const { error } = client ? await write(client) : { error: new Error("Supabase client unavailable") };
  if (error) {
    JOB_MATERIALS.splice(0, JOB_MATERIALS.length, ...before);
    console.error("[materials] Save failed:", error);
    alert("Couldn't save this Materials Used change: " + (error.message || error) + "\n\nNothing was changed.");
  }
  return { error: error || null };
}

// Adding the same item twice adds to its one line rather than creating a
// second. `inventoryId` may be the item's uuid or old id. Resolves to { error }.
function addMaterialToJob(jobId, inventoryId, quantity) {
  const item = getInventoryItem(inventoryId);
  if (!item) return Promise.resolve({ error: new Error("Unknown inventory item " + inventoryId) });
  const existing = JOB_MATERIALS.find(m => m.job_id === jobId && m.inventory_item_id === item.id);
  if (existing) {
    const next = existing.quantity + quantity;
    return runMaterialsWrite(
      () => { existing.quantity = next; },
      client => client.from("job_materials_used").update({ quantity: next }).eq("id", existing.id)
    );
  }
  const row = { id: newLabelId(), job_id: jobId, inventory_item_id: item.id, quantity, created_at: new Date().toISOString() };
  return runMaterialsWrite(
    () => { JOB_MATERIALS.push(row); },
    client => client.from("job_materials_used").insert(row)
  );
}

// Removes the item's line from the job. Resolves to { error }.
function removeMaterialFromJob(jobId, inventoryId) {
  const item = getInventoryItem(inventoryId);
  const uuid = item ? item.id : inventoryId; // an item deleted from inventory can still be removed
  const lines = JOB_MATERIALS.filter(m => m.job_id === jobId && m.inventory_item_id === uuid);
  if (!lines.length) return Promise.resolve({ error: null });
  return runMaterialsWrite(
    () => { lines.forEach(m => JOB_MATERIALS.splice(JOB_MATERIALS.indexOf(m), 1)); },
    client => client.from("job_materials_used").delete().in("id", lines.map(m => m.id))
  );
}

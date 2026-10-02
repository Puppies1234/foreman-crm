/* --------------------------- Estimate templates store ---------------------------
   Settings → Estimates templates live in Supabase: public.estimate_templates
   (one row per template) and public.estimate_template_items (its line items,
   linked by template_id, ordered by sort_order). Loaded on the two pages
   that use templates — Settings (to manage them) and the job page (its
   Estimate tab's "start from template" dropdown) — right after
   js/jobs-store.js. On load it:
     1. Runs the one-time migration: if estimate_templates has no rows yet,
        copies this browser's templates from localStorage into both tables.
     2. Fetches every template with its items into ESTIMATE_TEMPLATES.
   Page scripts start rendering through whenAppReady(), which waits for this
   (window.estimateTemplatesReady).

   Only the TEMPLATES live here. A job's own estimates are untouched: still
   localStorage, and starting one from a template still deep-copies the
   template's items in as a one-time starting point
   (estimateLineItemsFromTemplate in js/data.js). */
const ESTIMATE_TEMPLATES = [];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function templateFromRows(row, itemRows) {
  return {
    id: row.id,
    name: row.name || "",
    created_at: row.created_at,
    lineItems: itemRows
      .filter(i => i.template_id === row.id)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map(i => ({
        id: i.id,
        name: i.item_name || "",
        description: i.description || "",
        quantity: Number(i.quantity) || 0,
        price: Number(i.price) || 0,
      })),
  };
}

function itemRowsForTemplate(template) {
  return template.lineItems.map((li, i) => ({
    id: li.id,
    template_id: template.id,
    item_name: li.name || "",
    description: li.description || "",
    quantity: Number(li.quantity) || 0,
    price: Number(li.price) || 0,
    sort_order: i,
  }));
}

// Line items made in the editor (or in old localStorage templates) carry
// ids like "li-…"; Supabase needs uuids, so any such id is swapped for one.
function withUuidItemIds(template) {
  return Object.assign({}, template, {
    lineItems: template.lineItems.map(li => (UUID_PATTERN.test(li.id) ? li : Object.assign({}, li, { id: newLabelId() }))),
  });
}

/* ----------- Legacy localStorage templates (read by the migration only) -----------
   Only ever READ now, once, by the migration; nothing writes it anymore.
   Left in place as a backup. Its ids ("template-…") aren't uuids, so each
   template gets a new one in Supabase. */
const LEGACY_ESTIMATE_TEMPLATES_KEY = "foreman-estimate-templates";

function legacyLocalTemplates() {
  try {
    const stored = JSON.parse(localStorage.getItem(LEGACY_ESTIMATE_TEMPLATES_KEY));
    if (Array.isArray(stored)) return stored;
  } catch (e) {}
  return [];
}

// Runs only while estimate_templates is empty — later loads skip it.
async function migrateLocalTemplatesIfNeeded(client) {
  const { count, error } = await client.from("estimate_templates").select("id", { count: "exact", head: true });
  if (error) throw error;
  if (count > 0) return;

  const legacy = legacyLocalTemplates();
  if (!legacy.length) return;
  // Stamped one millisecond apart so the templates keep their original order.
  const start = Date.now();
  const templates = legacy.map((t, i) => withUuidItemIds({
    id: newLabelId(),
    name: (t.name || "").trim() || "Template " + (i + 1),
    created_at: new Date(start + i).toISOString(),
    lineItems: Array.isArray(t.lineItems) ? t.lineItems : [],
  }));

  const { error: tError } = await client.from("estimate_templates")
    .insert(templates.map(t => ({ id: t.id, name: t.name, created_at: t.created_at })));
  if (tError) throw tError;
  const items = [].concat(...templates.map(itemRowsForTemplate));
  if (items.length) {
    const { error: iError } = await client.from("estimate_template_items").insert(items);
    if (iError) {
      // Don't leave templates behind without their items — undo, so the
      // next load can try the whole migration again.
      await client.from("estimate_templates").delete().in("id", templates.map(t => t.id));
      throw iError;
    }
  }
  console.info(`[estimate templates] Migrated ${templates.length} template(s) with ${items.length} line item(s) from localStorage to Supabase.`);
}

async function fetchEstimateTemplates(client) {
  const [{ data: rows, error: tError }, { data: itemRows, error: iError }] = await Promise.all([
    client.from("estimate_templates").select("*").order("created_at"),
    client.from("estimate_template_items").select("*").order("sort_order"),
  ]);
  if (tError) throw tError;
  if (iError) throw iError;
  ESTIMATE_TEMPLATES.splice(0, ESTIMATE_TEMPLATES.length, ...rows.map(r => templateFromRows(r, itemRows)));
}

async function loadEstimateTemplates() {
  const client = window.supabaseClient;
  if (!client) throw new Error("Supabase client unavailable (see the [supabase] error above).");
  await migrateLocalTemplatesIfNeeded(client);
  await fetchEstimateTemplates(client);
}

// If Supabase can't be reached, both pages show no templates (rather than a
// stale local copy that edits couldn't save back to) and say why.
window.estimateTemplatesReady = loadEstimateTemplates().catch(err => {
  console.error("[estimate templates] Couldn't load estimate templates from Supabase.", err);
  window.estimateTemplatesLoadError = err;
});

/* -------------------------------- Reads / writes ------------------------------- */

// Every template, oldest first, each with its line items in order. A deep
// copy, so editing a draft never touches the loaded templates.
function getEstimateTemplates() {
  return JSON.parse(JSON.stringify(ESTIMATE_TEMPLATES));
}

async function runTemplateWrite(apply, write) {
  const before = JSON.parse(JSON.stringify(ESTIMATE_TEMPLATES));
  apply();
  const client = window.supabaseClient;
  let error = null;
  try {
    if (!client) throw new Error("Supabase client unavailable");
    await write(client);
  } catch (err) {
    error = err;
  }
  if (error) {
    ESTIMATE_TEMPLATES.splice(0, ESTIMATE_TEMPLATES.length, ...before);
    console.error("[estimate templates] Save failed:", error);
    alert("Couldn't save this template change: " + (error.message || error) + "\n\nNothing was changed.");
    // A failure partway through could leave Supabase half-updated; re-read
    // it so what's shown matches what's stored.
    if (client) await fetchEstimateTemplates(client).catch(() => {});
  }
  return { error };
}

// Creates the template if it has no id yet, otherwise updates its name and
// line items (added, edited, removed and reordered — sort_order is each
// item's position). Items are upserted BEFORE removed ones are deleted, so
// a failure never leaves a template with fewer items than it had.
// Resolves to { error }.
function saveEstimateTemplate(draft) {
  const isNew = !draft.id;
  const template = withUuidItemIds(Object.assign({}, draft, {
    id: draft.id || newLabelId(),
    created_at: draft.created_at || new Date().toISOString(),
  }));
  const previous = ESTIMATE_TEMPLATES.find(t => t.id === template.id);
  const keptIds = new Set(template.lineItems.map(li => li.id));
  const removedIds = previous ? previous.lineItems.map(li => li.id).filter(id => !keptIds.has(id)) : [];

  return runTemplateWrite(
    () => {
      const idx = ESTIMATE_TEMPLATES.findIndex(t => t.id === template.id);
      if (idx === -1) ESTIMATE_TEMPLATES.push(template);
      else ESTIMATE_TEMPLATES[idx] = template;
    },
    async client => {
      const head = isNew
        ? await client.from("estimate_templates").insert({ id: template.id, name: template.name, created_at: template.created_at })
        : await client.from("estimate_templates").update({ name: template.name, updated_at: new Date().toISOString() }).eq("id", template.id);
      if (head.error) throw head.error;
      const items = itemRowsForTemplate(template);
      if (items.length) {
        const res = await client.from("estimate_template_items").upsert(items, { onConflict: "id" });
        if (res.error) throw res.error;
      }
      if (removedIds.length) {
        const res = await client.from("estimate_template_items").delete().in("id", removedIds);
        if (res.error) throw res.error;
      }
    }
  );
}

// Deletes the template and its line items. Resolves to { error }.
function deleteEstimateTemplate(id) {
  return runTemplateWrite(
    () => {
      const idx = ESTIMATE_TEMPLATES.findIndex(t => t.id === id);
      if (idx !== -1) ESTIMATE_TEMPLATES.splice(idx, 1);
    },
    async client => {
      const items = await client.from("estimate_template_items").delete().eq("template_id", id);
      if (items.error) throw items.error;
      const head = await client.from("estimate_templates").delete().eq("id", id);
      if (head.error) throw head.error;
    }
  );
}

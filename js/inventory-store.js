/* -------------------------------- Inventory store --------------------------------
   Inventory items live in Supabase (public.inventory_items). Loaded on every
   page right after js/jobs-store.js: the Inventory page shows them, the job
   page's Materials Used searches and prices them, and completing a job (Boards
   or the job page) deducts from them. On load it:
     1. Runs the one-time migration: if inventory_items has no rows yet,
        copies this browser's inventory from localStorage into it.
     2. Fetches every item into INVENTORY. Only the Inventory page shows photos,
        so every other page skips photo_data and stays light.
   Page scripts start rendering through whenAppReady(), which waits for this.

   IDs: inventory_items.id is a uuid; each migrated item also keeps its OLD
   app id ("inv2", "inv1727…") in legacy_id, and getInventoryItem() finds an
   item by either one. Materials Used's own migration maps the old ids it
   had saved to uuids this way (js/materials-store.js). */
const INVENTORY = [];
const LOW_STOCK_THRESHOLD = 3;

const INVENTORY_PAGE_NEEDS_PHOTOS = /\/inventory(\.html)?\/?$/.test(window.location.pathname);
const INVENTORY_COLUMNS = INVENTORY_PAGE_NEEDS_PHOTOS
  ? "id, legacy_id, name, description, quantity, unit_price, photo_data, created_at"
  : "id, legacy_id, name, description, quantity, unit_price, created_at";

// The starting inventory a browser had before it ever saved its own — only
// the migration reads this.
const INVENTORY_SEED = [
  { id: "inv1", name: "Water Heater — 50 Gal Gas", description: "Standard 50-gallon gas water heater, 6-year warranty.", quantity: 4, unit_price: 850, photo: null },
  { id: "inv2", name: "PEX Fittings — 1/2\" (10-pack)", description: "Half-inch PEX crimp fittings, brass, box of 10.", quantity: 22, unit_price: 18, photo: null },
  { id: "inv3", name: "Shutoff Valve — 1/4 Turn", description: "Quarter-turn ball valve, 1/2\" compression.", quantity: 15, unit_price: 12, photo: null },
  { id: "inv4", name: "Copper Pipe — 3/4\" (10ft)", description: "Type L copper pipe, 3/4 inch, 10-foot length.", quantity: 8, unit_price: 34, photo: null },
  { id: "inv5", name: "Garbage Disposal — 1/2 HP", description: "Standard 1/2 HP continuous-feed disposal unit.", quantity: 3, unit_price: 95, photo: null },
  { id: "inv6", name: "Wax Toilet Ring", description: "Standard wax ring with flange, for toilet installation.", quantity: 30, unit_price: 5, photo: null },
];

function inventoryItemFromRow(row) {
  return {
    id: row.id,
    legacy_id: row.legacy_id || null,
    name: row.name || "",
    description: row.description || "",
    quantity: Number(row.quantity) || 0,
    unit_price: Number(row.unit_price) || 0,
    // undefined (not null) on pages that didn't load photos, so a save from
    // one of those pages can never blank out a photo it never saw.
    photo: INVENTORY_PAGE_NEEDS_PHOTOS ? (row.photo_data || null) : undefined,
    created_at: row.created_at,
  };
}

/* ------------ Legacy localStorage inventory (read by the migration only) ------------
   Only ever READ now, once, by the migration; nothing writes it anymore.
   Left in place as a backup. A browser that never saved inventory had the
   seed above. */
const LEGACY_INVENTORY_KEY = "foreman-inventory";

function legacyLocalInventory() {
  try {
    const stored = JSON.parse(localStorage.getItem(LEGACY_INVENTORY_KEY));
    if (Array.isArray(stored)) return stored;
  } catch (e) {}
  return INVENTORY_SEED.map(item => Object.assign({}, item));
}

// Runs only while inventory_items is empty — later loads skip it.
async function migrateLocalInventoryIfNeeded(client) {
  const { count, error } = await client.from("inventory_items").select("id", { count: "exact", head: true });
  if (error) throw error;
  if (count > 0) return;

  // Without legacy_id the old ids would be lost and every saved Materials
  // Used line would stop resolving — so refuse instead.
  const probe = await client.from("inventory_items").select("legacy_id").limit(1);
  if (probe.error) {
    throw new Error("inventory_items has no legacy_id column yet — run sql/inventory-legacy-id.sql in the Supabase SQL Editor. (" + probe.error.message + ")");
  }

  const start = Date.now();
  const rows = legacyLocalInventory().map((item, i) => ({
    id: newLabelId(),
    legacy_id: String(item.id),
    name: item.name || "Untitled item",
    description: item.description || "",
    quantity: Math.round(Number(item.quantity) || 0),
    unit_price: Number(item.unit_price) || 0,
    photo_data: typeof item.photo === "string" ? item.photo : null,
    // One millisecond apart so the items keep their original order.
    created_at: new Date(start + i).toISOString(),
  }));
  if (!rows.length) return;
  const { error: insertError } = await client.from("inventory_items").insert(rows);
  if (insertError) throw insertError;
  console.info(`[inventory] Migrated ${rows.length} inventory item(s) from localStorage to Supabase (old ids kept in legacy_id).`);
}

async function loadInventory() {
  const client = window.supabaseClient;
  if (!client) throw new Error("Supabase client unavailable (see the [supabase] error above).");
  await migrateLocalInventoryIfNeeded(client);
  const { data, error } = await client.from("inventory_items").select(INVENTORY_COLUMNS).order("created_at");
  if (error) throw error;
  INVENTORY.splice(0, INVENTORY.length, ...data.map(inventoryItemFromRow));
}

// If Supabase can't be reached, pages fall back to this browser's last local
// copy so Materials Used still shows names and prices — any inventory change
// made in that state fails to save and says so.
window.inventoryReady = loadInventory().catch(err => {
  console.error("[inventory] Couldn't load inventory from Supabase — showing this browser's local copy instead. Inventory changes won't save until it's reachable.", err);
  INVENTORY.splice(0, INVENTORY.length, ...legacyLocalInventory().map(item => Object.assign({ legacy_id: null }, item)));
});

/* -------------------------------- Reads / writes ------------------------------- */

// By uuid, or by the old app id Materials Used may still hold.
function getInventoryItem(id) {
  return INVENTORY.find(item => item.id === id || (item.legacy_id && item.legacy_id === id));
}

function isLowStock(item) {
  return item.quantity <= LOW_STOCK_THRESHOLD;
}

async function runInventoryWrite(apply, write) {
  const before = INVENTORY.map(item => Object.assign({}, item));
  const result = apply();
  const client = window.supabaseClient;
  const { error } = client ? await write(client) : { error: new Error("Supabase client unavailable") };
  if (error) {
    INVENTORY.splice(0, INVENTORY.length, ...before);
    console.error("[inventory] Save failed:", error);
    alert("Couldn't save this inventory change: " + (error.message || error) + "\n\nNothing was changed.");
  }
  return { error: error || null, item: result };
}

// Each resolves to { error } (plus { item } for addInventoryItem). The
// change shows at once; a rejected save is rolled back.
function addInventoryItem(details) {
  const item = {
    id: newLabelId(),
    legacy_id: null,
    name: details.name,
    description: details.description,
    quantity: details.quantity,
    unit_price: details.unit_price,
    photo: details.photo || null,
    created_at: new Date().toISOString(),
  };
  return runInventoryWrite(
    () => { INVENTORY.push(item); return item; },
    client => client.from("inventory_items").insert({
      id: item.id, name: item.name, description: item.description, quantity: item.quantity,
      unit_price: item.unit_price, photo_data: item.photo, created_at: item.created_at,
    })
  );
}

function updateInventoryItem(id, details) {
  const item = getInventoryItem(id);
  if (!item) return Promise.resolve({ error: null });
  const changes = {
    name: details.name,
    description: details.description,
    quantity: details.quantity,
    unit_price: details.unit_price,
    updated_at: new Date().toISOString(),
  };
  if (details.photo !== undefined) changes.photo_data = details.photo;
  return runInventoryWrite(
    () => Object.assign(item, details),
    client => client.from("inventory_items").update(changes).eq("id", item.id)
  );
}

function deleteInventoryItem(id) {
  const item = getInventoryItem(id);
  if (!item) return Promise.resolve({ error: null });
  return runInventoryWrite(
    () => { INVENTORY.splice(INVENTORY.indexOf(item), 1); },
    client => client.from("inventory_items").delete().eq("id", item.id)
  );
}

// The ONLY sanctioned way to change quantity on hand — both manual
// restocking (js/inventory.js) and automatic Completed-job deduction
// (deductMaterialsForJob in js/data.js) go through this. No floor at zero:
// a job completing with more material used than is on hand still deducts
// and shows the resulting negative, rather than silently clamping.
function adjustInventoryQuantity(id, delta) {
  const item = getInventoryItem(id);
  if (!item) return Promise.resolve({ error: null });
  return runInventoryWrite(
    () => { item.quantity += delta; },
    client => client.from("inventory_items")
      .update({ quantity: item.quantity, updated_at: new Date().toISOString() })
      .eq("id", item.id)
  );
}

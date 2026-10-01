/* ------------------------------ Contacts store --------------------------------
   Contacts live in Supabase (public.contacts). Everything else — jobs,
   appointments, estimates, inventory — is still localStorage, and still
   points at contacts by the same ids ("c1", "c2", …) it always has.

   Loaded right after js/data.js on every page. On load it:
     1. Runs the one-time migration: if the Supabase table has no rows yet,
        copies this browser's contacts (the mock seed plus any edits saved
        in localStorage) into it, keeping each contact's exact id.
     2. Fetches every contact from Supabase into CONTACTS (js/data.js), the
        in-memory list every page reads synchronously via getContact().
   Page scripts start rendering through whenAppReady(), which waits for
   step 2, so nothing renders against an empty or stale contact list.

   Writes (setContactDetails, setContactSalesRep) update CONTACTS right
   away so the UI responds instantly, then save to Supabase; if Supabase
   rejects the save, the in-memory change is rolled back and the caller
   is told so it can re-render. */

// Supabase stores the address split into parts; the app has always shown
// and edited it as one line ("412 Willow Creek Rd, Austin, TX"). These two
// convert between the forms. A line that doesn't look like
// "street, city, ST[ zip]" is kept whole in street_address, never dropped.
function splitContactAddress(address) {
  const empty = { street_address: "", city: "", state: "", zip: "" };
  const text = String(address || "").trim();
  if (!text) return empty;
  const parts = text.split(",").map(p => p.trim());
  if (parts.length >= 3) {
    const stateZip = /^([A-Za-z]{2})(?:\s+(\d{5}(?:-\d{4})?))?$/.exec(parts[parts.length - 1]);
    if (stateZip) {
      return {
        street_address: parts.slice(0, -2).join(", "),
        city: parts[parts.length - 2],
        state: stateZip[1].toUpperCase(),
        zip: stateZip[2] || "",
      };
    }
  }
  return Object.assign(empty, { street_address: text });
}

function joinContactAddress(row) {
  const stateZip = [row.state, row.zip].filter(Boolean).join(" ");
  return [row.street_address, row.city, stateZip].filter(Boolean).join(", ");
}

function contactFromRow(row) {
  return {
    id: row.id,
    full_name: row.full_name || "",
    phone: row.phone || "",
    email: row.email || "",
    address: joinContactAddress(row),
    preferred_contact: row.preferred_contact || "",
    source: row.source || "",
    sales_rep: row.sales_rep || "Unassigned",
    custom_fields: Array.isArray(row.custom_fields) ? row.custom_fields : [],
  };
}

function rowFromContact(contact) {
  return Object.assign({
    id: contact.id,
    full_name: contact.full_name,
    phone: contact.phone,
    email: contact.email,
    preferred_contact: contact.preferred_contact,
    source: contact.source,
    sales_rep: contact.sales_rep,
    custom_fields: Array.isArray(contact.custom_fields) ? contact.custom_fields : [],
  }, splitContactAddress(contact.address));
}

/* ----- Legacy localStorage contacts (read by the migration only) -----
   The two keys contact edits used to be saved under. They're only ever
   READ now, once, by the migration; nothing writes them anymore. They're
   left in place rather than deleted, as a backup of the pre-Supabase data. */
const LEGACY_CONTACT_DETAILS_KEY = "foreman-contact-details";
const LEGACY_CONTACT_SALES_REP_KEY = "foreman-contact-sales-rep";

function readLegacyStore(key) {
  try {
    const stored = JSON.parse(localStorage.getItem(key));
    if (stored && typeof stored === "object") return stored;
  } catch (e) {}
  return {};
}

// The contacts as this browser had them before Supabase: the mock seed with
// any saved edits layered on — the same merge the app used to do at load.
function legacyLocalContacts() {
  const details = readLegacyStore(LEGACY_CONTACT_DETAILS_KEY);
  const reps = readLegacyStore(LEGACY_CONTACT_SALES_REP_KEY);
  return LOCAL_CONTACT_SEED.map(seed => {
    const contact = JSON.parse(JSON.stringify(seed));
    const saved = details[contact.id];
    if (saved) {
      ["phone", "email", "address", "preferred_contact", "source"].forEach(field => {
        if (saved[field] !== undefined) contact[field] = saved[field];
      });
      if (Array.isArray(saved.custom_fields)) contact.custom_fields = saved.custom_fields;
    }
    if (reps[contact.id]) contact.sales_rep = reps[contact.id];
    return contact;
  });
}

// Runs only while the Supabase table is empty. ignoreDuplicates makes it
// safe if two tabs both see an empty table and race each other: the second
// insert just skips ids the first one already wrote.
async function migrateLocalContactsIfNeeded(client) {
  const { count, error } = await client.from("contacts").select("id", { count: "exact", head: true });
  if (error) throw error;
  if (count > 0) return;

  const rows = legacyLocalContacts().map(rowFromContact);
  const { error: insertError } = await client
    .from("contacts")
    .upsert(rows, { onConflict: "id", ignoreDuplicates: true });
  if (insertError) throw insertError;
  console.info(`[contacts] Migrated ${rows.length} contacts from localStorage to Supabase.`);
}

async function loadContactsFromSupabase() {
  const client = window.supabaseClient;
  if (!client) throw new Error("Supabase client unavailable (see the [supabase] error above).");
  await migrateLocalContactsIfNeeded(client);
  const { data, error } = await client.from("contacts").select("*").order("full_name");
  if (error) throw error;
  CONTACTS.splice(0, CONTACTS.length, ...data.map(contactFromRow));
}

// If Supabase can't be reached, pages still need contacts to render jobs
// against, so they get this browser's last-known local copy — read-only in
// spirit: any edit made in this state will fail to save and say so.
const contactsReady = loadContactsFromSupabase().catch(err => {
  console.error("[contacts] Couldn't load contacts from Supabase — showing this browser's local copy instead. Edits won't save until it's reachable.", err);
  CONTACTS.splice(0, CONTACTS.length, ...legacyLocalContacts());
});

// Every page script's entry point: the DOM is parsed AND contacts, the
// Pipeline & Labels lists (js/labels.js) and jobs (js/jobs-store.js) are all
// loaded from Supabase. Replaces the plain DOMContentLoaded listener each page used to use.
function whenAppReady(fn) {
  const domReady = document.readyState === "loading"
    ? new Promise(resolve => document.addEventListener("DOMContentLoaded", resolve, { once: true }))
    : Promise.resolve();
  Promise.all([domReady, contactsReady, labelsReady, jobsReady]).then(() => fn());
}

/* ------------------------------- Contact writes -------------------------------- */

// Applies `changes` to the in-memory contact at once, then saves them to
// Supabase. Resolves to { error } — null on success. On failure the
// in-memory contact is restored, so the next render shows what's really
// stored.
async function saveContactChanges(contactId, changes) {
  const contact = getContact(contactId);
  if (!contact) return { error: new Error("Unknown contact " + contactId) };
  const before = JSON.parse(JSON.stringify(contact));
  Object.assign(contact, changes);

  const row = rowFromContact(contact);
  delete row.id;
  row.updated_at = new Date().toISOString();

  const client = window.supabaseClient;
  const { error } = client
    ? await client.from("contacts").update(row).eq("id", contactId)
    : { error: new Error("Supabase client unavailable") };

  if (error) {
    Object.assign(contact, before);
    console.error("[contacts] Save failed for " + contactId + ":", error);
    alert("Couldn't save this contact change: " + (error.message || error) + "\n\nNothing was changed.");
  }
  return { error: error || null };
}

// The Contact card's Edit/Save — one atomic save of the whole bundle,
// including Source and the custom fields.
function setContactDetails(contactId, details) {
  return saveContactChanges(contactId, {
    phone: details.phone,
    email: details.email,
    address: details.address,
    preferred_contact: details.preferred_contact,
    source: details.source,
    custom_fields: details.custom_fields,
  });
}

// Who owns this contact's account — separate from any job's own sales_rep;
// changing one never touches the other.
function setContactSalesRep(contactId, rep) {
  const contact = getContact(contactId);
  if (!contact || contact.sales_rep === rep) return Promise.resolve({ error: null });
  return saveContactChanges(contactId, { sales_rep: rep });
}

// The rule a new job must follow at creation time: its sales_rep starts as
// a one-time COPY of its contact's *current* sales_rep — read fresh from
// Supabase, not a live link. There's no job-creation form in this preview
// yet; whenever one exists, it must seed sales_rep through this.
async function defaultSalesRepForNewJob(contactId) {
  const { data, error } = await window.supabaseClient
    .from("contacts").select("sales_rep").eq("id", contactId).single();
  if (error) throw error;
  return data.sales_rep;
}

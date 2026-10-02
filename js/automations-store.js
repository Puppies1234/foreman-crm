/* ------------------------------ Automations store ------------------------------
   Settings → Automations rules live in Supabase (public.automations). Loaded
   on the Settings page only (nothing else reads automations), after
   js/jobs-store.js. On load it:
     1. Runs the one-time migration: if the Supabase table has no rows yet,
        copies this browser's rules from localStorage into it.
     2. Fetches every rule into AUTOMATIONS, oldest first.
   js/settings.js starts rendering through whenAppReady(), which waits for
   this (window.automationsReady).

   A rule's conditions are stored as LABEL IDS (status_ids, job_type_ids,
   appointment_type_ids). In memory each rule also gets `conditions` — the
   same ids turned into the labels' current NAMES — which is what the
   editor, the summaries and the job matching read. So renaming a label
   reaches every rule with no rule being rewritten, and a deleted label
   simply drops out of a rule's conditions. */
const AUTOMATIONS = [];

const AUTOMATION_CONDITION_COLUMNS = [
  { key: "status", kind: "status", column: "status_ids" },
  { key: "jobType", kind: "job_type", column: "job_type_ids" },
  { key: "appointmentType", kind: "appointment_type", column: "appointment_type_ids" },
];

function automationFromRow(row) {
  const rule = {
    id: row.id,
    name: row.name || "",
    enabled: row.enabled !== false,
    created_at: row.created_at,
    timing: {
      amount: Number(row.timing_amount) || 0,
      unit: row.timing_unit || "hours",
      direction: row.timing_direction || "before",
    },
    action: row.action_type || "text",
    message: row.message_template || "",
  };
  AUTOMATION_CONDITION_COLUMNS.forEach(({ column }) => {
    rule[column] = Array.isArray(row[column]) ? row[column] : [];
  });
  return rule;
}

// Fills in rule.conditions (names) from the rule's label ids, skipping any
// id whose label no longer exists.
function withConditionNames(rule) {
  const conditions = {};
  AUTOMATION_CONDITION_COLUMNS.forEach(({ key, kind, column }) => {
    conditions[key] = rule[column]
      .map(id => (LABELS_CACHE[kind].find(e => e.id === id) || {}).name)
      .filter(Boolean);
  });
  return Object.assign({}, rule, { conditions });
}

// Label NAMES → ids, for saving. A name with no matching label is left out
// (with a warning naming the rule), never the whole rule.
function conditionIdsFromNames(rule) {
  const ids = {};
  AUTOMATION_CONDITION_COLUMNS.forEach(({ key, kind, column }) => {
    ids[column] = [];
    ((rule.conditions && rule.conditions[key]) || []).forEach(name => {
      const entry = findLabel(kind, name);
      if (entry) ids[column].push(entry.id);
      else console.warn(`[automations] Rule "${rule.name}": ${LABEL_KINDS[kind].noun} "${name}" doesn't match any ${LABEL_KINDS[kind].category} label in Supabase — that condition was left out.`);
    });
  });
  return ids;
}

function rowFromAutomation(rule) {
  return Object.assign({
    id: rule.id,
    name: rule.name,
    enabled: !!rule.enabled,
    timing_amount: Math.max(0, parseInt(rule.timing.amount, 10) || 0),
    timing_unit: rule.timing.unit,
    timing_direction: rule.timing.direction,
    action_type: rule.action,
    message_template: rule.message || "",
  }, conditionIdsFromNames(rule));
}

/* ------------- Legacy localStorage rules (read by the migration only) -------------
   Only ever READ now, once, by the migration; nothing writes it anymore.
   Left in place as a backup. Its rules stored their conditions as plain
   label names, and ids like "auto-…" that aren't uuids, so each gets a new
   uuid in Supabase. */
const LEGACY_AUTOMATIONS_KEY = "foreman-automations";

function legacyLocalAutomations() {
  try {
    const stored = JSON.parse(localStorage.getItem(LEGACY_AUTOMATIONS_KEY));
    if (Array.isArray(stored)) return stored;
  } catch (e) {}
  return [];
}

// Runs only while the Supabase table is empty — later loads skip it.
async function migrateLocalAutomationsIfNeeded(client) {
  const { count, error } = await client.from("automations").select("id", { count: "exact", head: true });
  if (error) throw error;
  if (count > 0) return;

  const legacy = legacyLocalAutomations();
  if (!legacy.length) return;
  // Stamped one millisecond apart so the rules keep their original order.
  const start = Date.now();
  const rows = legacy.map((rule, i) => Object.assign(rowFromAutomation({
    id: newLabelId(),
    name: rule.name || "Automation " + (i + 1),
    enabled: rule.enabled !== false,
    timing: Object.assign({ amount: 24, unit: "hours", direction: "before" }, rule.timing),
    action: rule.action || "text",
    message: rule.message || "",
    conditions: rule.conditions || {},
  }), { created_at: new Date(start + i).toISOString() }));

  const { error: insertError } = await client.from("automations").insert(rows);
  if (insertError) throw insertError;
  console.info(`[automations] Migrated ${rows.length} automation rule(s) from localStorage to Supabase.`);
}

async function fetchAutomations(client) {
  const { data, error } = await client.from("automations").select("*").order("created_at");
  if (error) throw error;
  AUTOMATIONS.splice(0, AUTOMATIONS.length, ...data.map(automationFromRow));
}

async function loadAutomations() {
  const client = window.supabaseClient;
  if (!client) throw new Error("Supabase client unavailable (see the [supabase] error above).");
  await migrateLocalAutomationsIfNeeded(client);
  await fetchAutomations(client);
}

// Label names are needed to read conditions, so labels load first. If
// Supabase can't be reached, the tab shows an empty list (rather than a
// stale local copy that edits couldn't save back to) and says why.
window.automationsReady = labelsReady.then(loadAutomations).catch(err => {
  console.error("[automations] Couldn't load automation rules from Supabase.", err);
  window.automationsLoadError = err;
});

/* -------------------------------- Reads / writes ------------------------------- */

// Every rule, oldest first, each with its conditions as current label names.
function getAutomations() {
  return AUTOMATIONS.map(withConditionNames);
}

async function runAutomationWrite(apply, write) {
  const before = AUTOMATIONS.slice();
  apply();
  const client = window.supabaseClient;
  const { error } = client ? await write(client) : { error: new Error("Supabase client unavailable") };
  if (error) {
    AUTOMATIONS.splice(0, AUTOMATIONS.length, ...before);
    console.error("[automations] Save failed:", error);
    alert("Couldn't save this automation change: " + (error.message || error) + "\n\nNothing was changed.");
  }
  return { error: error || null };
}

// Creates the rule if it has no id yet, otherwise updates it. Resolves to
// { error }. `rule.conditions` holds label NAMES, as the editor builds them.
function saveAutomation(rule) {
  const isNew = !rule.id;
  const row = rowFromAutomation(Object.assign({}, rule, { id: rule.id || newLabelId() }));
  const saved = automationFromRow(Object.assign({}, row, { created_at: isNew ? new Date().toISOString() : rule.created_at }));
  return runAutomationWrite(
    () => {
      const idx = AUTOMATIONS.findIndex(r => r.id === row.id);
      if (idx === -1) AUTOMATIONS.push(saved);
      else AUTOMATIONS[idx] = saved;
    },
    client => isNew
      ? client.from("automations").insert(Object.assign({}, row, { created_at: saved.created_at }))
      : client.from("automations").update(row).eq("id", row.id)
  );
}

function setAutomationEnabled(id, enabled) {
  const rule = AUTOMATIONS.find(r => r.id === id);
  if (!rule) return Promise.resolve({ error: null });
  return runAutomationWrite(
    () => {
      const idx = AUTOMATIONS.indexOf(rule);
      AUTOMATIONS[idx] = Object.assign({}, rule, { enabled: !!enabled });
    },
    client => client.from("automations").update({ enabled: !!enabled }).eq("id", id)
  );
}

function deleteAutomation(id) {
  return runAutomationWrite(
    () => {
      const idx = AUTOMATIONS.findIndex(r => r.id === id);
      if (idx !== -1) AUTOMATIONS.splice(idx, 1);
    },
    client => client.from("automations").delete().eq("id", id)
  );
}

// A label was deleted in Pipeline & Labels: drop its id from every rule
// that used it, so the stored rules stay clean.
async function removeLabelFromAutomations(kind, labelId) {
  const spec = AUTOMATION_CONDITION_COLUMNS.find(c => c.kind === kind);
  if (!spec) return;
  const affected = AUTOMATIONS.filter(r => r[spec.column].includes(labelId));
  for (const rule of affected) {
    const ids = rule[spec.column].filter(id => id !== labelId);
    await runAutomationWrite(
      () => {
        const idx = AUTOMATIONS.findIndex(r => r.id === rule.id);
        if (idx !== -1) AUTOMATIONS[idx] = Object.assign({}, AUTOMATIONS[idx], { [spec.column]: ids });
      },
      client => client.from("automations").update({ [spec.column]: ids }).eq("id", rule.id)
    );
  }
}

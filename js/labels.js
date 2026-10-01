// Pipeline & Labels (Settings → Pipeline & Labels) — the single shared
// source of truth for the four option lists a job's fields draw from: its
// status (the pipeline stages Boards and the status pills walk through),
// job type, appointment type, and urgency. Every dropdown, picker, Boards
// column and badge color in the app reads from here.
//
// The lists live in Supabase (public.labels, one row per entry: category,
// name, color, sort_order, enabled, protected). What each JOB is set to is
// still stored per job in localStorage, by label NAME — this file only
// owns the list of possible options.
//
// Loaded in <head> right after js/supabase-client.js. On load it runs the
// one-time migration from localStorage (if the Supabase table is empty),
// then fetches every label into LABELS_CACHE and injects each entry's
// badge colors. Page scripts start rendering through whenAppReady()
// (js/contacts-store.js), which waits for this, so nothing renders against
// an empty option list.

// The pine/gold family new entries draw their color from, rotating through
// whichever shades that list isn't already using.
const LABEL_PALETTE = [
  "#1F5C4C", // pine
  "#C9A227", // gold
  "#2E7D66", // light pine
  "#A87F22", // deep gold
  "#143D32", // deep pine
  "#D9B547", // bright gold
  "#4F7F6E", // sage pine
  "#8C6A1E", // bronze
  "#74804A", // moss
  "#3B6E5E", // spruce
];

// `category` is the Supabase labels.category value for each list.
// `defaults` only matter to the migration, for a browser that never
// customized a list.
const LABEL_KINDS = {
  status: {
    title: "Pipeline Stages",
    noun: "stage",
    jobField: "status",
    cssKey: "status",
    category: "pipeline_stage",
    defaults: [
      { name: "New Lead", color: "#6E695C" },
      { name: "Qualified", color: "#C9A227" },
      { name: "Scheduled", color: "#1F5C4C" },
      { name: "Estimating", color: "#1B5042" },
      { name: "Proposal Sent", color: "#174337" },
      { name: "Proposal Signed", color: "#12372D" },
      { name: "Completed", color: "#0E2A22" },
    ],
  },
  job_type: {
    title: "Job Type Labels",
    noun: "job type",
    jobField: "job_type",
    cssKey: "job-type",
    category: "job_type",
    defaults: [
      { name: "Repair", color: "#74804A" },
      { name: "New Install", color: "#74804A" },
      { name: "Warranty", color: "#74804A" },
    ],
  },
  appointment_type: {
    title: "Appointment Type Labels",
    noun: "appointment type",
    jobField: "appointment_type",
    cssKey: "appt-type",
    category: "appointment_type",
    defaults: [
      { name: "Initial Appointment", color: "#7D5170" },
      { name: "Appointment", color: "#7D5170" },
    ],
  },
  urgency: {
    title: "Urgency Levels",
    noun: "urgency level",
    jobField: "urgency",
    cssKey: "urgency",
    category: "urgency",
    defaults: [
      { name: "Low", color: "#6F6A5D" },
      { name: "Medium", color: "#C9A227" },
      { name: "High", color: "#AF5636" },
    ],
  },
};

// The two pipeline stages that carry behavior, by their names at migration
// time. From then on they're recognized by `protected` (see
// statusNameForRole below), so renaming them doesn't break anything.
const PROTECTED_STAGE_NAMES = ["New Lead", "Completed"];

// Name arrays the rest of the app iterates (Boards columns, the job page's
// pipeline, picker options, automation conditions). They're kept as the
// same array objects for the life of the page and refilled in place on
// every change, so anything holding a reference sees the change.
const STATUS_PIPELINE = [];
const JOB_TYPES = [];
const APPOINTMENT_TYPES = [];
const URGENCY_LEVELS = [];
const LABEL_NAME_ARRAYS = {
  status: STATUS_PIPELINE,
  job_type: JOB_TYPES,
  appointment_type: APPOINTMENT_TYPES,
  urgency: URGENCY_LEVELS,
};

// Each entry: { id (Supabase uuid), name, color, enabled, protected },
// in sort_order.
const LABELS_CACHE = { status: [], job_type: [], appointment_type: [], urgency: [] };

function cloneLabelList(list) {
  return list.map(e => ({ id: e.id, name: e.name, color: e.color, enabled: e.enabled !== false, protected: !!e.protected }));
}

function getLabels(kind) {
  return cloneLabelList(LABELS_CACHE[kind]);
}

function findLabel(kind, name) {
  return LABELS_CACHE[kind].find(e => e.name === name) || null;
}

// Options offered for picking a value: enabled entries in order, plus the
// job's current value even if it's been disabled (a disabled label never
// vanishes from a job that already carries it).
function labelOptions(kind, currentValue) {
  return LABELS_CACHE[kind]
    .filter(e => e.enabled !== false || e.name === currentValue)
    .map(e => e.name);
}

// Badge class for a value of any kind — `lbl-{kind}-{id}`, whose colors are
// injected by applyLabels() below. A value that isn't in its list falls
// back to neutral grey.
function labelBadgeClass(kind, name) {
  const entry = findLabel(kind, name);
  return entry ? `lbl-${LABEL_KINDS[kind].cssKey}-${entry.id}` : "lbl-unknown";
}

// Next color for a newly added entry: the first palette shade this list
// isn't using yet, or — once every shade is taken — the one used least.
function nextLabelColor(list) {
  const counts = {};
  list.forEach(e => { counts[e.color.toUpperCase()] = (counts[e.color.toUpperCase()] || 0) + 1; });
  let best = LABEL_PALETTE[0];
  let bestCount = Infinity;
  LABEL_PALETTE.forEach(hex => {
    const n = counts[hex.toUpperCase()] || 0;
    if (n < bestCount) { best = hex; bestCount = n; }
  });
  return best;
}

function newLabelId() {
  if (window.crypto && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // RFC 4122 v4 fallback for browsers without randomUUID.
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));
}

// The two stages that carry app behavior are the protected ones: the first
// protected stage in pipeline order is where new leads land (it feeds the
// Review queue), the last is "done" (arriving there deducts the job's
// materials from Inventory). Matched this way rather than by name, so
// renaming either one in Settings doesn't break that behavior.
function statusNameForRole(role) {
  const protectedStages = LABELS_CACHE.status.filter(e => e.protected);
  if (!protectedStages.length) return null;
  return (role === "lead" ? protectedStages[0] : protectedStages[protectedStages.length - 1]).name;
}

function applyLabels() {
  const theme = window.ForemanTheme;
  const root = document.documentElement.style;
  const rules = [".lbl-unknown { background-image: var(--gloss), var(--gray-grad); color: #FBFAF6; }"];

  Object.keys(LABEL_KINDS).forEach(kind => {
    const names = LABEL_NAME_ARRAYS[kind];
    names.splice(0, names.length, ...LABELS_CACHE[kind].map(e => e.name));

    LABELS_CACHE[kind].forEach(e => {
      const hsl = theme.hexToHsl(e.color);
      const grad = theme.gradCss(hsl);
      const ink = theme.inkOn(theme.hslToHex(hsl.h, hsl.s, hsl.l));
      if (kind === "status") {
        root.setProperty(`--status-${e.id}-grad`, grad);
        root.setProperty(`--status-${e.id}-fg`, ink);
      }
      rules.push(`.lbl-${LABEL_KINDS[kind].cssKey}-${e.id} { background-image: var(--gloss), ${grad}; color: ${ink}; }`);
    });
  });

  let styleEl = document.getElementById("label-colors");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "label-colors";
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = rules.join("\n");

  // Lets js/jobs-store.js re-derive each job's label names from its label
  // ids, so a rename or deletion reaches every job without rewriting any.
  if (typeof window.onLabelsApplied === "function") window.onLabelsApplied();
}

/* ------------------- Legacy localStorage labels (migration only) -------------------
   Where the lists lived before Supabase. Only ever READ now, once, by the
   migration; nothing writes them anymore. Left in place as a backup. */
const LEGACY_LABELS_STORAGE_KEY = "foreman-labels";

function readLegacyJson(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    if (parsed && typeof parsed === "object") return parsed;
  } catch (e) {}
  return null;
}

function isValidLegacyList(list) {
  return Array.isArray(list) && list.length > 0 && list.every(e =>
    e && typeof e.name === "string" && e.name.trim() && /^#[0-9a-f]{6}$/i.test(e.color));
}

// Each list as this browser had it: the saved Pipeline & Labels lists if
// any, else the defaults (stage colors seeded from the even older Design →
// Contact Status Colors store). Enabled state comes from the old Settings →
// Features → Job & Appointment Labels toggles, where a browser still has them.
function legacyLocalLabels() {
  const stored = readLegacyJson(LEGACY_LABELS_STORAGE_KEY) || {};
  const legacyStatusColors = readLegacyJson("foreman-status-colors") || {};
  const legacyToggles = (readLegacyJson("foreman-features") || {}).jobAppointmentLabels || {};

  const all = {};
  Object.keys(LABEL_KINDS).forEach(kind => {
    let list;
    if (isValidLegacyList(stored[kind])) {
      list = stored[kind].map(e => ({ name: e.name.trim(), color: e.color }));
    } else {
      list = LABEL_KINDS[kind].defaults.map(e => ({
        name: e.name,
        color: kind === "status" && typeof legacyStatusColors[e.name] === "string" ? legacyStatusColors[e.name] : e.color,
      }));
    }
    const toggles = legacyToggles[kind] || {};
    all[kind] = list.map(e => ({
      id: newLabelId(),
      name: e.name,
      color: e.color.toUpperCase(),
      enabled: toggles[e.name] !== false,
      protected: kind === "status" && PROTECTED_STAGE_NAMES.includes(e.name),
    }));
  });
  return all;
}

function labelRow(kind, entry, index) {
  return {
    id: entry.id,
    category: LABEL_KINDS[kind].category,
    name: entry.name,
    color: entry.color,
    sort_order: index,
    enabled: entry.enabled !== false,
    protected: !!entry.protected,
  };
}

// Runs only while the Supabase table is empty — later loads skip it.
async function migrateLocalLabelsIfNeeded(client) {
  const { count, error } = await client.from("labels").select("id", { count: "exact", head: true });
  if (error) throw error;
  if (count > 0) return;

  const legacy = legacyLocalLabels();
  const rows = [];
  Object.keys(LABEL_KINDS).forEach(kind => {
    legacy[kind].forEach((entry, i) => rows.push(labelRow(kind, entry, i)));
  });
  const { error: insertError } = await client.from("labels").insert(rows);
  if (insertError) throw insertError;
  console.info(`[labels] Migrated ${rows.length} labels from localStorage to Supabase.`);
}

const CATEGORY_TO_KIND = {};
Object.keys(LABEL_KINDS).forEach(kind => { CATEGORY_TO_KIND[LABEL_KINDS[kind].category] = kind; });

// Two saves in quick succession trigger two refetches; their responses can
// arrive out of order. Only the most recently started fetch is applied, so
// an older response can never overwrite a newer one.
let labelsFetchSeq = 0;

async function fetchLabelsFromSupabase() {
  const seq = ++labelsFetchSeq;
  const { data, error } = await window.supabaseClient
    .from("labels")
    .select("id, category, name, color, sort_order, enabled, protected")
    .order("sort_order");
  if (error) throw error;
  if (seq !== labelsFetchSeq) return;
  const next = { status: [], job_type: [], appointment_type: [], urgency: [] };
  data.forEach(row => {
    const kind = CATEGORY_TO_KIND[row.category];
    if (kind) next[kind].push({ id: row.id, name: row.name, color: row.color, enabled: row.enabled !== false, protected: !!row.protected });
  });
  Object.keys(next).forEach(kind => { LABELS_CACHE[kind] = next[kind]; });
}

async function loadLabels() {
  if (!window.supabaseClient) throw new Error("Supabase client unavailable (see the [supabase] error above).");
  await migrateLocalLabelsIfNeeded(window.supabaseClient);
  await fetchLabelsFromSupabase();
}

// If Supabase can't be reached, pages still need option lists to render
// jobs against, so they fall back to this browser's last local copy —
// any edit made in that state fails to save and says so.
const labelsReady = loadLabels()
  .catch(err => {
    console.error("[labels] Couldn't load labels from Supabase — showing this browser's local copy instead. Label edits won't save until it's reachable.", err);
    const legacy = legacyLocalLabels();
    Object.keys(legacy).forEach(kind => { LABELS_CACHE[kind] = legacy[kind]; });
  })
  .then(applyLabels);

/* ------------------------------- Label writes -------------------------------- */

// Tells this app's other open tabs to refetch, so a rename/recolor saved
// here shows up there too.
const labelsChannel = typeof BroadcastChannel === "function" ? new BroadcastChannel("foreman-labels") : null;
if (labelsChannel) {
  labelsChannel.onmessage = () => {
    fetchLabelsFromSupabase().then(applyLabels).catch(err => console.error("[labels] Refresh failed:", err));
  };
}

// The ONLY sanctioned way to change a list (add, reorder, recolor, enable/
// disable, delete — renames go through renameLabel() in js/data.js, which
// calls this and then moves jobs over to the new name). Applies the new
// list at once so the UI responds immediately, then saves it: every entry
// is upserted with sort_order = its position, and anything no longer in
// the list is deleted. Resolves to { error } — null on success. If
// Supabase rejects it, the lists are re-read from Supabase so what's shown
// matches what's stored, and the caller should re-render.
async function setLabels(kind, list) {
  const previousIds = LABELS_CACHE[kind].map(e => e.id);
  LABELS_CACHE[kind] = cloneLabelList(list);
  applyLabels();

  const client = window.supabaseClient;
  let error = null;
  try {
    if (!client) throw new Error("Supabase client unavailable");
    const keptIds = new Set(list.map(e => e.id));
    const removedIds = previousIds.filter(id => !keptIds.has(id));
    if (removedIds.length) {
      const res = await client.from("labels").delete().in("id", removedIds);
      if (res.error) throw res.error;
    }
    const res = await client.from("labels").upsert(list.map((e, i) => labelRow(kind, e, i)), { onConflict: "id" });
    if (res.error) throw res.error;
  } catch (err) {
    error = err;
  }

  if (error) {
    console.error("[labels] Save failed:", error);
    try { await fetchLabelsFromSupabase(); } catch (e) {}
    applyLabels();
    alert("Couldn't save this label change: " + (error.message || error) + "\n\nNothing was changed.");
  } else if (labelsChannel) {
    labelsChannel.postMessage("changed");
  }
  return { error };
}

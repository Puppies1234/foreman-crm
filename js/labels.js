// Pipeline & Labels (Settings → Pipeline & Labels) — the single shared
// source of truth for the four editable value lists a job carries: its
// status (the pipeline stages Boards and the status pills walk through),
// job type, appointment type, and urgency. Every dropdown, picker, Boards
// column and badge color in the app reads from here.
//
// Loaded in <head> right after js/theme.js on every page (it needs theme's
// gradient/ink helpers) so each label's badge color is in place before
// first paint, same reasoning as theme.js itself.
//
// Each entry is { id, name, color }. Jobs store the *name* (that's what the
// mock data and every per-job override store already hold), so `id` exists
// only to give an entry a stable CSS hook and role that survives renames —
// the seven default stage ids deliberately match the original status slugs
// (lead, qualified, …), so the --status-{id}-grad custom properties and
// .badge-{slug} classes css/styles.css already uses keep working untouched.
const LABELS_STORAGE_KEY = "foreman-labels";

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

const LABEL_KINDS = {
  status: {
    title: "Pipeline Stages",
    noun: "stage",
    jobField: "status",
    cssKey: "status",
    defaults: [
      { id: "lead", name: "New Lead", color: "#6E695C" },
      { id: "qualified", name: "Qualified", color: "#C9A227" },
      { id: "scheduled", name: "Scheduled", color: "#1F5C4C" },
      { id: "estimating", name: "Estimating", color: "#1B5042" },
      { id: "proposal-sent", name: "Proposal Sent", color: "#174337" },
      { id: "proposal-signed", name: "Proposal Signed", color: "#12372D" },
      { id: "completed", name: "Completed", color: "#0E2A22" },
    ],
  },
  job_type: {
    title: "Job Type Labels",
    noun: "job type",
    jobField: "job_type",
    cssKey: "job-type",
    defaults: [
      { id: "repair", name: "Repair", color: "#74804A" },
      { id: "new-install", name: "New Install", color: "#74804A" },
      { id: "warranty", name: "Warranty", color: "#74804A" },
    ],
  },
  appointment_type: {
    title: "Appointment Type Labels",
    noun: "appointment type",
    jobField: "appointment_type",
    cssKey: "appt-type",
    defaults: [
      { id: "initial-appointment", name: "Initial Appointment", color: "#7D5170" },
      { id: "appointment", name: "Appointment", color: "#7D5170" },
    ],
  },
  urgency: {
    title: "Urgency Levels",
    noun: "urgency level",
    jobField: "urgency",
    cssKey: "urgency",
    defaults: [
      { id: "low", name: "Low", color: "#6F6A5D" },
      { id: "medium", name: "Medium", color: "#C9A227" },
      { id: "high", name: "High", color: "#AF5636" },
    ],
  },
};

// Name arrays the rest of the app iterates (Boards columns, the job page's
// pipeline, picker options, automation conditions). They're kept as the
// same array objects for the life of the page and refilled in place on
// every save, so anything holding a reference sees the change immediately.
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

let inMemoryLabels = null; // fallback if localStorage throws/unavailable

function cloneLabelList(list) {
  return list.map(e => ({ id: e.id, name: e.name, color: e.color }));
}

function isValidLabelList(list) {
  return Array.isArray(list) && list.length > 0 && list.every(e =>
    e && typeof e.id === "string" && typeof e.name === "string" && e.name.trim() && /^#[0-9a-f]{6}$/i.test(e.color));
}

// First-ever load seeds status colors from the old Design → Contact Status
// Colors store, so anyone who customized those keeps their colors.
function legacyStatusColors() {
  try {
    const parsed = JSON.parse(localStorage.getItem("foreman-status-colors"));
    if (parsed && typeof parsed === "object") return parsed;
  } catch (e) {}
  return {};
}

function readAllLabels() {
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(LABELS_STORAGE_KEY));
  } catch (e) {}
  if (!stored || typeof stored !== "object") stored = inMemoryLabels || {};

  const all = {};
  Object.keys(LABEL_KINDS).forEach(kind => {
    if (isValidLabelList(stored[kind])) {
      all[kind] = cloneLabelList(stored[kind]);
    } else {
      all[kind] = cloneLabelList(LABEL_KINDS[kind].defaults);
      if (kind === "status") {
        const legacy = legacyStatusColors();
        all[kind].forEach(e => { if (typeof legacy[e.name] === "string") e.color = legacy[e.name]; });
      }
    }
  });
  return all;
}

function getLabels(kind) {
  return readAllLabels()[kind];
}

// The ONLY sanctioned way to change a list. Renames must go through
// renameLabel() in js/data.js instead, which also moves every job carrying
// the old name over to the new one.
function setLabels(kind, list) {
  const all = readAllLabels();
  all[kind] = cloneLabelList(list);
  inMemoryLabels = all;
  try {
    localStorage.setItem(LABELS_STORAGE_KEY, JSON.stringify(all));
  } catch (e) {}
  applyLabels(all);
}

function findLabel(kind, name) {
  return getLabels(kind).find(e => e.name === name) || null;
}

// Badge class for a value of any kind — `lbl-{kind}-{id}`, whose colors are
// injected by applyLabels() below. A value that isn't in its list (which
// deletion protection should make impossible) falls back to neutral grey.
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
  return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Stage roles that drive behavior, looked up by the entry's stable id so a
// rename doesn't break them: "lead" feeds the Review queue's new-lead list,
// "completed" triggers materials deduction.
function statusNameForRole(id) {
  const entry = getLabels("status").find(e => e.id === id);
  return entry ? entry.name : null;
}

function applyLabels(all) {
  all = all || readAllLabels();
  const theme = window.ForemanTheme;
  const root = document.documentElement.style;
  const rules = [".lbl-unknown { background-image: var(--gloss), var(--gray-grad); color: #FBFAF6; }"];

  Object.keys(LABEL_KINDS).forEach(kind => {
    const names = LABEL_NAME_ARRAYS[kind];
    names.splice(0, names.length, ...all[kind].map(e => e.name));

    all[kind].forEach(e => {
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
}

applyLabels();

// A change saved from Settings in another open tab (a recolor, a rename)
// re-applies here too, so badge colors already on screen update in place.
// Names in already-rendered markup refresh on that page's next render.
window.addEventListener("storage", e => {
  if (e.key === LABELS_STORAGE_KEY) applyLabels();
});

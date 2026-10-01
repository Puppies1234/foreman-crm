// Feature toggles (Settings → Features) — controls which optional parts of
// the app are shown. Everything defaults to true (on), so an app that's
// never touched Settings → Features looks exactly as it always has.
// Runs immediately at load, not wrapped in DOMContentLoaded, same reasoning
// as js/brand.js: this tag sits after the sidebar markup, so it can hide
// nav links before first paint reaches them — no flash of a link that's
// about to disappear.
const FEATURES_STORAGE_KEY = "foreman-features";

const DEFAULT_FEATURES = {
  modules: { boards: true, inventory: true },
  dashboardWidgets: {
    quickActions: true,
    statCards: true,
    recentlyViewed: true,
    todaysSchedule: true,
    aiActivityFeed: true,
  },
  jobActivityTabs: { messages: true, calls: true, documents: true, photos: true, estimate: true },
  aiAssistant: true,
  salesRepTracking: true,
};

function getFeatures() {
  try {
    const stored = JSON.parse(localStorage.getItem(FEATURES_STORAGE_KEY));
    if (stored && typeof stored === "object") {
      return {
        modules: Object.assign({}, DEFAULT_FEATURES.modules, stored.modules),
        dashboardWidgets: Object.assign({}, DEFAULT_FEATURES.dashboardWidgets, stored.dashboardWidgets),
        jobActivityTabs: Object.assign({}, DEFAULT_FEATURES.jobActivityTabs, stored.jobActivityTabs),
        aiAssistant: typeof stored.aiAssistant === "boolean" ? stored.aiAssistant : true,
        salesRepTracking: typeof stored.salesRepTracking === "boolean" ? stored.salesRepTracking : true,
      };
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_FEATURES));
}

function setFeatures(features) {
  try {
    localStorage.setItem(FEATURES_STORAGE_KEY, JSON.stringify(features));
  } catch (e) {}
  applyFeatures(features);
}

// Sidebar nav is the one part of Features that's identical on every page,
// so it's the one thing this shared module applies directly. Everything
// else a toggle affects (dashboard widgets, job activity tabs, sales rep
// fields) is page-specific rendering, checked straight from getFeatures()
// by the page's own script (dashboard.js, contact.js, contacts.js, boards.js).
function applyFeatures(features) {
  features = features || getFeatures();
  document.querySelectorAll('.nav-link[href="boards.html"]').forEach(el => { el.hidden = !features.modules.boards; });
  document.querySelectorAll('.nav-link[href="inventory.html"]').forEach(el => { el.hidden = !features.modules.inventory; });
}

applyFeatures();

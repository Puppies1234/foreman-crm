// Feature toggles (Settings → Features) — controls which optional parts of
// the app are shown. Everything defaults to true (on), so an app that's
// never touched Settings → Features looks exactly as it always has.
// Saved in Supabase's app_settings.feature_flags (js/settings-store.js),
// which re-applies the nav toggles once that row has loaded and keeps the
// page hidden until then — so a hidden nav link is never seen flashing in.

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
  const stored = appSetting("feature_flags", null);
  if (stored && typeof stored === "object") {
    return {
      modules: Object.assign({}, DEFAULT_FEATURES.modules, stored.modules),
      dashboardWidgets: Object.assign({}, DEFAULT_FEATURES.dashboardWidgets, stored.dashboardWidgets),
      jobActivityTabs: Object.assign({}, DEFAULT_FEATURES.jobActivityTabs, stored.jobActivityTabs),
      aiAssistant: typeof stored.aiAssistant === "boolean" ? stored.aiAssistant : true,
      salesRepTracking: typeof stored.salesRepTracking === "boolean" ? stored.salesRepTracking : true,
    };
  }
  return JSON.parse(JSON.stringify(DEFAULT_FEATURES));
}

// Applies at once; resolves to { error } once saved to Supabase.
function setFeatures(features) {
  applyFeatures(features);
  return saveAppSettings({ feature_flags: features });
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

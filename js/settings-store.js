/* ------------------------------- Settings store --------------------------------
   Settings → General / Design / Features / Notifications / Estimate Defaults
   live in Supabase: the single app_settings row (id = 1). Payments stays in
   localStorage; Automations and Estimate Templates aren't migrated yet.

   Loaded in <head> right after js/supabase-client.js (it needs js/theme.js's
   color helpers too). On load it:
     1. Runs the one-time migration: while app_settings.migrated_at is still
        null, copies this browser's saved settings from localStorage into the
        row and stamps migrated_at — so it happens once, ever, no matter how
        many browsers or devices open the app afterwards.
     2. Keeps the row in window.APP_SETTINGS, which every getter in the app
        reads (getAccent, getTechColors, getBrand, getFeatures,
        getNotificationSettings, getBusinessSettings, getEstimateDefaults).

   The accent color, logo and nav toggles must be in place before anything
   is seen, and Supabase answers asynchronously, so the page stays invisible
   (html.settings-pending) until the row has arrived and been applied —
   instead of flashing the default green and "Foreman" first. A safety timer
   shows the page anyway if Supabase is slow. */
const APP_SETTINGS_ROW_ID = 1;
window.APP_SETTINGS = null;

document.documentElement.classList.add("settings-pending");
const SETTINGS_REVEAL_TIMEOUT_MS = 4000;
const settingsRevealTimer = setTimeout(() => {
  document.documentElement.classList.remove("settings-pending");
}, SETTINGS_REVEAL_TIMEOUT_MS);

/* --------- Legacy localStorage settings (read by the migration only) ---------
   Where each tab used to save. Only ever READ now, once, by the migration;
   nothing writes them anymore. Left in place as a backup. */
const LEGACY_SETTINGS_KEYS = {
  accent: "foreman-accent-color",
  techColors: "foreman-tech-colors",
  brand: "foreman-brand",
  features: "foreman-features",
  notifications: "foreman-notification-settings",
  business: "foreman-business-settings",
  estimateDefaults: "foreman-estimate-defaults",
};

function readLegacySetting(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    if (parsed && typeof parsed === "object") return parsed;
  } catch (e) {}
  return null;
}

// The columns to write for whatever this browser has saved. A setting this
// browser never saved is left out, so the row keeps its current value —
// except the accent color, which is always written, because the row's
// stock accent_brightness (50) doesn't match its stock accent_color.
function legacySettingsChanges() {
  const theme = window.ForemanTheme;
  const changes = {};

  const accent = readLegacySetting(LEGACY_SETTINGS_KEYS.accent);
  const hsl = accent && ["h", "s", "l"].every(k => typeof accent[k] === "number") ? accent : theme.defaultAccent;
  changes.accent_color = theme.hslToHex(hsl.h, hsl.s, hsl.l).toUpperCase();
  changes.accent_brightness = hsl.l;

  const tech = readLegacySetting(LEGACY_SETTINGS_KEYS.techColors);
  if (tech) {
    const colors = {};
    Object.keys(tech).forEach(name => { if (typeof tech[name] === "string") colors[name] = tech[name]; });
    changes.calendar_colors = colors;
  }

  const brand = readLegacySetting(LEGACY_SETTINGS_KEYS.brand);
  if (brand) {
    changes.company_name = (typeof brand.name === "string" && brand.name.trim()) || "Foreman";
    changes.logo_data = typeof brand.logo === "string" ? brand.logo : null;
    if (typeof brand.shape === "string") changes.logo_shape = brand.shape;
    changes.logo_position = {
      zoom: typeof brand.logoZoom === "number" ? brand.logoZoom : 1,
      offsetX: typeof brand.logoOffsetX === "number" ? brand.logoOffsetX : 0,
      offsetY: typeof brand.logoOffsetY === "number" ? brand.logoOffsetY : 0,
      naturalWidth: typeof brand.logoNaturalWidth === "number" ? brand.logoNaturalWidth : null,
      naturalHeight: typeof brand.logoNaturalHeight === "number" ? brand.logoNaturalHeight : null,
    };
  }

  const features = readLegacySetting(LEGACY_SETTINGS_KEYS.features);
  if (features) {
    const flags = Object.assign({}, features);
    delete flags.jobAppointmentLabels; // replaced by Pipeline & Labels' enabled switches
    changes.feature_flags = flags;
  }

  const notifications = readLegacySetting(LEGACY_SETTINGS_KEYS.notifications);
  if (notifications) changes.notification_settings = notifications;

  const business = readLegacySetting(LEGACY_SETTINGS_KEYS.business);
  if (business) {
    const address = business.address || {};
    changes.business_phone = business.phone || null;
    changes.business_email = business.email || null;
    changes.business_street = address.street || null;
    changes.business_city = address.city || null;
    changes.business_state = address.state || null;
    changes.business_zip = address.zip || null;
    if (business.hours && typeof business.hours === "object") changes.business_hours = business.hours;
    if (Array.isArray(business.serviceArea)) changes.service_area = business.serviceArea;
    if (Number.isFinite(business.defaultAppointmentMinutes)) changes.default_appointment_duration_minutes = business.defaultAppointmentMinutes;
  }

  const est = readLegacySetting(LEGACY_SETTINGS_KEYS.estimateDefaults);
  if (est) {
    if (Number.isFinite(est.taxRate)) changes.estimate_default_tax_rate = est.taxRate;
    if (typeof est.terms === "string") changes.estimate_default_terms = est.terms;
    if (Number.isFinite(est.markup)) changes.estimate_default_markup = est.markup;
  }
  return changes;
}

// Runs only while migrated_at is null. The update itself also requires
// migrated_at to still be null, so if two tabs race, only the first writes.
async function migrateLocalSettingsIfNeeded(client, row) {
  if (row.migrated_at) return row;
  const changes = Object.assign(legacySettingsChanges(), {
    migrated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  const { data, error } = await client
    .from("app_settings")
    .update(changes)
    .eq("id", APP_SETTINGS_ROW_ID)
    .is("migrated_at", null)
    .select();
  if (error) throw error;
  if (data && data.length) {
    console.info("[settings] Migrated this browser's settings from localStorage to Supabase:", Object.keys(changes).join(", "));
    return data[0];
  }
  // Another tab got there first — use what it wrote.
  return fetchAppSettingsRow(client);
}

async function fetchAppSettingsRow(client) {
  const { data, error } = await client.from("app_settings").select("*").eq("id", APP_SETTINGS_ROW_ID).single();
  if (error) throw error;
  return data;
}

async function loadAppSettings() {
  const client = window.supabaseClient;
  if (!client) throw new Error("Supabase client unavailable (see the [supabase] error above).");
  let row = await fetchAppSettingsRow(client);
  // Without the marker column the migration can't know it already ran and
  // would overwrite the row on every load — so refuse instead.
  if (!("migrated_at" in row)) {
    throw new Error("app_settings has no migrated_at column yet — run sql/app-settings-migrated-at.sql in the Supabase SQL Editor.");
  }
  row = await migrateLocalSettingsIfNeeded(client, row);
  window.APP_SETTINGS = row;
}

// If Supabase can't be reached, the app still needs settings to draw with,
// so it falls back to this browser's last local copy — any change made in
// that state fails to save and says so.
const settingsReady = loadAppSettings().catch(err => {
  console.error("[settings] Couldn't load settings from Supabase — showing this browser's local copy instead. Settings changes won't save until it's reachable.", err);
  window.APP_SETTINGS = Object.assign({ id: APP_SETTINGS_ROW_ID }, legacySettingsChanges());
});

// Once the row is here and the page's own scripts have run, re-apply
// everything that was first drawn with defaults, then show the page.
Promise.all([
  settingsReady,
  document.readyState === "loading"
    ? new Promise(resolve => document.addEventListener("DOMContentLoaded", resolve, { once: true }))
    : Promise.resolve(),
]).then(() => {
  const theme = window.ForemanTheme;
  theme.apply(theme.getAccent());
  theme.applyTechColors(theme.getTechColors());
  if (typeof applyBrand === "function") applyBrand();
  if (typeof applyFeatures === "function") applyFeatures();
  clearTimeout(settingsRevealTimer);
  document.documentElement.classList.remove("settings-pending");
});

// The ONE way any setting is saved: merges `changes` (app_settings column →
// value) into the in-memory row at once, then writes them to Supabase.
// Resolves to { error } — null on success. On failure the in-memory row is
// restored and the user is told, so what's shown matches what's stored.
async function saveAppSettings(changes) {
  const before = Object.assign({}, window.APP_SETTINGS);
  window.APP_SETTINGS = Object.assign({}, window.APP_SETTINGS, changes);

  const client = window.supabaseClient;
  const { error } = client
    ? await client.from("app_settings")
        .update(Object.assign({}, changes, { updated_at: new Date().toISOString() }))
        .eq("id", APP_SETTINGS_ROW_ID)
    : { error: new Error("Supabase client unavailable") };

  if (error) {
    window.APP_SETTINGS = before;
    console.error("[settings] Save failed:", error);
    alert("Couldn't save these settings: " + (error.message || error) + "\n\nNothing was changed.");
  }
  return { error: error || null };
}

// A column's value from the loaded row, or `fallback` before it's loaded
// (or when the column is empty).
function appSetting(column, fallback) {
  const row = window.APP_SETTINGS;
  if (!row || row[column] === null || row[column] === undefined) return fallback;
  return row[column];
}

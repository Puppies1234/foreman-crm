// Company branding (logo + name) — applied to every page's sidebar
// wordmark, logo mark, and <title>. Saved in Supabase's app_settings row
// (company_name, logo_data, logo_shape, logo_position — js/settings-store.js);
// js/settings-store.js re-applies it once that row has loaded, and keeps
// the page hidden until then, so the default branding is never seen.
// Falls back to the default (no logo mark shown, "Foreman" wordmark,
// Square shape) when nothing's been customized (getBrand() always returns
// that shape either way, so every caller can use it unconditionally).
const DEFAULT_BRAND_NAME = "Foreman";
const DEFAULT_LOGO_SHAPE = "square";

// Pixel frame size per shape — Settings' interactive fit-frame (js/settings.js)
// uses these exact same dimensions for its preview, so a position/zoom saved
// there renders pixel-identical on every real .brand-mark: no per-context
// scale conversion, because there's nothing to convert.
const LOGO_SHAPES = {
  square: { width: 80, height: 80 },
  circle: { width: 80, height: 80 },
  rectangle: { width: 120, height: 60 },
};

function getBrand() {
  const name = appSetting("company_name", "");
  const shape = appSetting("logo_shape", DEFAULT_LOGO_SHAPE);
  const pos = appSetting("logo_position", {});
  const num = (v, fallback) => (typeof v === "number" ? v : fallback);
  return {
    name: (typeof name === "string" && name.trim()) ? name.trim() : DEFAULT_BRAND_NAME,
    logo: typeof appSetting("logo_data", null) === "string" ? appSetting("logo_data", null) : null,
    logoNaturalWidth: num(pos.naturalWidth, null),
    logoNaturalHeight: num(pos.naturalHeight, null),
    shape: LOGO_SHAPES[shape] ? shape : DEFAULT_LOGO_SHAPE,
    logoZoom: num(pos.zoom, 1),
    logoOffsetX: num(pos.offsetX, 0),
    logoOffsetY: num(pos.offsetY, 0),
  };
}

// The app_settings columns a brand is saved as.
function brandSettingsChanges(brand) {
  return {
    company_name: brand.name,
    logo_data: brand.logo || null,
    logo_shape: brand.shape,
    logo_position: {
      zoom: brand.logoZoom,
      offsetX: brand.logoOffsetX,
      offsetY: brand.logoOffsetY,
      naturalWidth: brand.logoNaturalWidth,
      naturalHeight: brand.logoNaturalHeight,
    },
  };
}

// Applies at once; resolves to { error } once saved to Supabase.
function setBrand(brand) {
  applyBrand(brand);
  return saveAppSettings(brandSettingsChanges(brand));
}

// Computes the exact background-size/position for a logo inside a given
// pixel frame — the one function both Settings' fit-frame preview and
// every real .brand-mark call, so as long as they're handed the same
// frame size for a shape (LOGO_SHAPES guarantees that), the visible result
// is identical. At the untouched default (zoom 1, never dragged) this
// just uses CSS's own "contain" keyword — centered, whole image visible,
// no cropping — which needs no knowledge of the image's natural size at
// all, so it also works for a logo saved before this fit system existed.
function computeLogoBackground(brand, frame) {
  const zoom = brand.logoZoom || 1;
  const offsetX = brand.logoOffsetX || 0;
  const offsetY = brand.logoOffsetY || 0;

  if (zoom === 1 && offsetX === 0 && offsetY === 0) {
    return { backgroundSize: "contain", backgroundPosition: "center" };
  }
  if (!brand.logoNaturalWidth || !brand.logoNaturalHeight) {
    return { backgroundSize: "contain", backgroundPosition: "center" };
  }

  const baseScale = Math.min(frame.width / brand.logoNaturalWidth, frame.height / brand.logoNaturalHeight);
  const scale = baseScale * zoom;
  const renderedW = brand.logoNaturalWidth * scale;
  const renderedH = brand.logoNaturalHeight * scale;
  const posX = (frame.width - renderedW) / 2 + offsetX;
  const posY = (frame.height - renderedH) / 2 + offsetY;

  return {
    backgroundSize: `${renderedW}px ${renderedH}px`,
    backgroundPosition: `${posX}px ${posY}px`,
  };
}

function applyBrand(brand) {
  brand = brand || getBrand();
  const customized = brand.name !== DEFAULT_BRAND_NAME;

  document.querySelectorAll(".brand-name").forEach(el => { el.textContent = brand.name; });
  document.title = document.title.replace(/Foreman$/, brand.name);

  // The sidebar footer's default text is "Foreman Home Services" — a
  // custom name replaces it outright (no more "Home Services" suffix,
  // since the custom value is meant to be the whole business identity),
  // but until one's actually set, this stays exactly as authored.
  if (customized) {
    document.querySelectorAll(".sidebar-footer-name").forEach(el => { el.textContent = brand.name; });
  }

  // Only shown once a logo's actually been uploaded, so a default/
  // uncustomized sidebar has no empty mark or reserved gap where one
  // would go.
  document.querySelectorAll(".brand-mark").forEach(el => {
    const shape = brand.shape || DEFAULT_LOGO_SHAPE;
    el.classList.remove("shape-circle", "shape-square", "shape-rectangle");
    el.classList.add("shape-" + shape);

    if (brand.logo) {
      const frame = LOGO_SHAPES[shape] || LOGO_SHAPES[DEFAULT_LOGO_SHAPE];
      const bg = computeLogoBackground(brand, frame);
      el.style.backgroundImage = `url("${brand.logo}")`;
      el.style.backgroundSize = bg.backgroundSize;
      el.style.backgroundPosition = bg.backgroundPosition;
      el.classList.add("has-logo");
      el.hidden = false;
    } else {
      el.style.backgroundImage = "";
      el.style.backgroundSize = "";
      el.style.backgroundPosition = "";
      el.classList.remove("has-logo");
      el.hidden = true;
    }
  });
}

applyBrand();

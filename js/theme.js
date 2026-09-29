// Shared accent-color theming. Loaded early (in <head>) on every page so the
// saved accent applies before first paint.
(function () {
  var STORAGE_KEY = 'foreman-accent-color';
  var TECH_STORAGE_KEY = 'foreman-tech-colors';
  var STATUS_STORAGE_KEY = 'foreman-status-colors';
  var DEFAULT_ACCENT = { h: 164, s: 50, l: 24 }; // matches #1F5C4C

  // Foreman's mock data only has three technicians (Ray Dunmore, Kim Osei,
  // Nia Brackett) — matches js/data.js and js/calendar.js's tech slugs.
  var TECH_DEFAULTS = {
    "Ray Dunmore": "#1F5C4C",
    "Kim Osei": "#C9A227",
    "Nia Brackett": "#AF5636"
  };

  // Scheduled -> Completed deepens through the same pine ramp as before,
  // just with two more evenly-spaced stops for Proposal Sent/Signed between
  // Estimating (was "Quoted") and Completed — same progression, not a new
  // palette.
  var STATUS_DEFAULTS = {
    "New Lead": "#6E695C",
    "Qualified": "#C9A227",
    "Scheduled": "#1F5C4C",
    "Estimating": "#1B5042",
    "Proposal Sent": "#174337",
    "Proposal Signed": "#12372D",
    "Completed": "#0E2A22"
  };

  // Matches the existing badge-* class suffixes in css/styles.css.
  var STATUS_SLUGS = {
    "New Lead": "lead",
    "Qualified": "qualified",
    "Scheduled": "scheduled",
    "Estimating": "estimating",
    "Proposal Sent": "proposal-sent",
    "Proposal Signed": "proposal-signed",
    "Completed": "completed"
  };

  // Text colours layered on top of a gradient surface. Gold and other light
  // accents take the dark pine ink; deep accents take the paper tone.
  var INK_DARK = '#17301F';
  var INK_LIGHT = '#FBFAF6';

  function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    var k = function (n) { return (n + h / 30) % 12; };
    var a = s * Math.min(l, 1 - l);
    var f = function (n) {
      var c = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return Math.round(255 * c);
    };
    var toHex = function (x) { return x.toString(16).padStart(2, '0'); };
    return '#' + toHex(f(0)) + toHex(f(8)) + toHex(f(4));
  }

  function hexToHsl(hex) {
    hex = hex.replace('#', '');
    var r = parseInt(hex.substring(0, 2), 16) / 255;
    var g = parseInt(hex.substring(2, 4), 16) / 255;
    var b = parseInt(hex.substring(4, 6), 16) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4; break;
      }
      h *= 60;
    }
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function deriveShades(hsl) {
    return {
      base: hslToHex(hsl.h, hsl.s, hsl.l),
      dark: hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 8, 6)),
      tint: hslToHex(hsl.h, Math.min(hsl.s, 22), 92)
    };
  }

  // Gradient stops for any accent: a lifted top, the colour itself, a
  // deepened foot. Mirrors the proportions of the default gold ramp
  // (#E8C96E -> #C9A227 -> #A87F22) so custom colours read the same way.
  function gradStops(hsl) {
    return {
      top: hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 16, 96)),
      mid: hslToHex(hsl.h, hsl.s, hsl.l),
      bottom: hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 8, 5))
    };
  }

  function gradCss(hsl) {
    var g = gradStops(hsl);
    return 'linear-gradient(180deg, ' + g.top + ' 0%, ' + g.mid + ' 52%, ' + g.bottom + ' 100%)';
  }

  // The dark pine gradient behind the sidebar. At the default accent this
  // resolves to #174539 -> #0E2A23, i.e. the intended #17453A -> #0E2A22.
  function sidebarStops(hsl) {
    return {
      top: hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 6, 6)),
      bottom: hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 13, 3))
    };
  }

  function srgbToLinear(channel) {
    var c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  function luminance(hex) {
    hex = hex.replace('#', '');
    return 0.2126 * srgbToLinear(parseInt(hex.substring(0, 2), 16)) +
           0.7152 * srgbToLinear(parseInt(hex.substring(2, 4), 16)) +
           0.0722 * srgbToLinear(parseInt(hex.substring(4, 6), 16));
  }

  function contrast(a, b) {
    var la = luminance(a), lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }

  // Whichever ink reads better on this surface, so no accent ends up as
  // low-contrast text - and gold never lands on a light background.
  function inkOn(hex) {
    return contrast(hex, INK_DARK) >= contrast(hex, INK_LIGHT) ? INK_DARK : INK_LIGHT;
  }

  function applyAccent(hsl) {
    var shades = deriveShades(hsl);
    var stops = gradStops(hsl);
    var bar = sidebarStops(hsl);
    var root = document.documentElement.style;
    root.setProperty('--pine', shades.base);
    root.setProperty('--pine-dark', shades.dark);
    root.setProperty('--pine-tint', shades.tint);
    root.setProperty('--pine-lift', stops.top);
    root.setProperty('--pine-deep', stops.bottom);
    root.setProperty('--pine-ink', inkOn(shades.base));
    root.setProperty('--sidebar-top', bar.top);
    root.setProperty('--sidebar-bottom', bar.bottom);
  }

  function getAccent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (typeof parsed.h === 'number' && typeof parsed.s === 'number' && typeof parsed.l === 'number') {
          return parsed;
        }
      }
    } catch (e) {}
    return DEFAULT_ACCENT;
  }

  function saveAccent(hsl) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hsl));
    applyAccent(hsl);
  }

  function techSlug(name) {
    return name.split(' ')[0].toLowerCase();
  }

  function readColorMap(key, defaults) {
    var merged = Object.assign({}, defaults);
    try {
      var raw = localStorage.getItem(key);
      if (raw) {
        var parsed = JSON.parse(raw);
        Object.keys(merged).forEach(function (k) {
          if (typeof parsed[k] === 'string') merged[k] = parsed[k];
        });
      }
    } catch (e) {}
    return merged;
  }

  function getTechColors() {
    return readColorMap(TECH_STORAGE_KEY, TECH_DEFAULTS);
  }

  function getStatusColors() {
    return readColorMap(STATUS_STORAGE_KEY, STATUS_DEFAULTS);
  }

  function applyTechColors(map) {
    var root = document.documentElement.style;
    Object.keys(TECH_DEFAULTS).forEach(function (name) {
      var hex = (map && map[name]) || TECH_DEFAULTS[name];
      var shades = deriveShades(hexToHsl(hex));
      var slug = techSlug(name);
      root.setProperty('--tech-' + slug + '-base', shades.base);
      root.setProperty('--tech-' + slug + '-tint', shades.tint);
      root.setProperty('--tech-' + slug + '-grad', gradCss(hexToHsl(hex)));
      root.setProperty('--tech-' + slug + '-fg', inkOn(shades.base));
    });
  }

  function applyStatusColors(map) {
    var root = document.documentElement.style;
    Object.keys(STATUS_DEFAULTS).forEach(function (status) {
      var hex = (map && map[status]) || STATUS_DEFAULTS[status];
      var hsl = hexToHsl(hex);
      var slug = STATUS_SLUGS[status];
      root.setProperty('--status-' + slug + '-grad', gradCss(hsl));
      root.setProperty('--status-' + slug + '-fg', inkOn(hslToHex(hsl.h, hsl.s, hsl.l)));
    });
  }

  function saveTechColors(map) {
    localStorage.setItem(TECH_STORAGE_KEY, JSON.stringify(map));
    applyTechColors(map);
  }

  function saveStatusColors(map) {
    localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(map));
    applyStatusColors(map);
  }

  window.ForemanTheme = {
    defaultAccent: DEFAULT_ACCENT,
    techDefaults: TECH_DEFAULTS,
    statusDefaults: STATUS_DEFAULTS,
    hslToHex: hslToHex,
    hexToHsl: hexToHsl,
    deriveShades: deriveShades,
    gradStops: gradStops,
    gradCss: gradCss,
    sidebarStops: sidebarStops,
    inkOn: inkOn,
    getAccent: getAccent,
    saveAccent: saveAccent,
    getTechColors: getTechColors,
    saveTechColors: saveTechColors,
    getStatusColors: getStatusColors,
    saveStatusColors: saveStatusColors,
    apply: applyAccent
  };

  applyAccent(getAccent());
  applyTechColors(getTechColors());
  applyStatusColors(getStatusColors());
})();

// Settings → Notifications. Scoped to this page only (unlike Features/
// Brand, nothing elsewhere in the app reads this yet — there's no live
// notification system to gate on it), so it lives here rather than its own
// shared module.
const NOTIFICATION_SETTINGS_STORAGE_KEY = "foreman-notification-settings";
const DEFAULT_NOTIFICATION_SETTINGS = {
  alsoEmail: false,
  alsoText: false,
  leadsScheduling: {
    newLead: true,
    appointmentConfirmed: true,
    appointmentCancelled: true,
    appointmentReminder: true,
  },
  aiAssistant: {
    followUpDrafted: true,
    missedCall: true,
    autoQualified: true,
  },
  jobsPipeline: {
    statusChanged: true,
    assignedToYou: true,
    quoteSent: true,
    overduePriority: true,
  },
  inventory: {
    lowStock: true,
  },
  payments: {
    paymentReceived: true,
    paymentOverdue: true,
  },
};

function getNotificationSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(NOTIFICATION_SETTINGS_STORAGE_KEY));
    if (stored && typeof stored === "object") {
      return {
        alsoEmail: typeof stored.alsoEmail === "boolean" ? stored.alsoEmail : false,
        alsoText: typeof stored.alsoText === "boolean" ? stored.alsoText : false,
        leadsScheduling: Object.assign({}, DEFAULT_NOTIFICATION_SETTINGS.leadsScheduling, stored.leadsScheduling),
        aiAssistant: Object.assign({}, DEFAULT_NOTIFICATION_SETTINGS.aiAssistant, stored.aiAssistant),
        jobsPipeline: Object.assign({}, DEFAULT_NOTIFICATION_SETTINGS.jobsPipeline, stored.jobsPipeline),
        inventory: Object.assign({}, DEFAULT_NOTIFICATION_SETTINGS.inventory, stored.inventory),
        payments: Object.assign({}, DEFAULT_NOTIFICATION_SETTINGS.payments, stored.payments),
      };
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_NOTIFICATION_SETTINGS));
}

function setNotificationSettings(settings) {
  try {
    localStorage.setItem(NOTIFICATION_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {}
}

// Settings → Automations. Same page-scoped reasoning as Notifications above
// — condition-matching and the Upcoming Automations preview are computed
// fresh from JOBS/APPOINTMENTS every time this tab renders, so there's
// nothing here for any other page to read.
const AUTOMATIONS_STORAGE_KEY = "foreman-automations";

function getAutomations() {
  try {
    const stored = JSON.parse(localStorage.getItem(AUTOMATIONS_STORAGE_KEY));
    if (Array.isArray(stored)) return stored;
  } catch (e) {}
  return [];
}

function setAutomations(rules) {
  try {
    localStorage.setItem(AUTOMATIONS_STORAGE_KEY, JSON.stringify(rules));
  } catch (e) {}
}

(function () {
  var theme = window.ForemanTheme;
  var current = Object.assign({}, theme.getAccent());

  // --- Company branding (name + logo shape/fit) ---
  var savedBrand = getBrand();
  var brandDraft = {
    name: savedBrand.name,
    logo: savedBrand.logo,
    logoNaturalWidth: savedBrand.logoNaturalWidth,
    logoNaturalHeight: savedBrand.logoNaturalHeight,
    shape: savedBrand.shape,
    logoZoom: savedBrand.logoZoom,
    logoOffsetX: savedBrand.logoOffsetX,
    logoOffsetY: savedBrand.logoOffsetY,
  };

  var brandNameInput = document.getElementById('brand-name-input');
  var brandLogoInput = document.getElementById('brand-logo-input');
  var brandLogoRemoveBtn = document.getElementById('brand-logo-remove-btn');
  var themePreviewName = document.getElementById('theme-preview-name');
  var shapeWrap = document.getElementById('logo-shape-wrap');
  var shapeButtons = document.querySelectorAll('.logo-shape-btn');
  var fitWrap = document.getElementById('logo-fit-wrap');
  var fitFrame = document.getElementById('logo-fit-frame');
  var zoomSlider = document.getElementById('brand-logo-zoom');

  // Only shows a real value when it's actually been customized — the
  // input's own placeholder ("Foreman") covers the untouched default,
  // same rule js/brand.js's applyBrand() uses for the sidebar footer.
  brandNameInput.value = savedBrand.name === DEFAULT_BRAND_NAME ? '' : savedBrand.name;

  // Updates the small accent-color "Live preview" mockup's name text only
  // — that widget is for previewing color, not logo fit, so it doesn't
  // track shape/position; the fit frame below is the real logo preview.
  function updateNamePreview() {
    themePreviewName.textContent = brandDraft.name || DEFAULT_BRAND_NAME;
  }
  updateNamePreview();

  // Renders the fit frame at the exact same pixel size js/brand.js uses
  // for the real sidebar mark (LOGO_SHAPES), so what's shown here is
  // exactly what Save will produce live — same computeLogoBackground(),
  // same numbers in, same pixels out.
  function renderFitFrame() {
    var hasLogo = !!brandDraft.logo;
    shapeWrap.hidden = !hasLogo;
    fitWrap.hidden = !hasLogo;
    if (!hasLogo) {
      refreshOpenAccordionHeight(document.querySelector('.accordion-section[data-accordion="branding"]'));
      return;
    }

    var shape = brandDraft.shape || DEFAULT_LOGO_SHAPE;
    shapeButtons.forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-shape') === shape);
    });

    var frame = LOGO_SHAPES[shape] || LOGO_SHAPES[DEFAULT_LOGO_SHAPE];
    fitFrame.className = 'logo-fit-frame shape-' + shape;
    fitFrame.style.width = frame.width + 'px';
    fitFrame.style.height = frame.height + 'px';
    fitFrame.style.borderRadius = shape === 'circle' ? '50%' : (shape === 'rectangle' ? '14px' : '20px');
    fitFrame.style.backgroundImage = 'url("' + brandDraft.logo + '")';

    var bg = computeLogoBackground(brandDraft, frame);
    fitFrame.style.backgroundSize = bg.backgroundSize;
    fitFrame.style.backgroundPosition = bg.backgroundPosition;

    zoomSlider.value = brandDraft.logoZoom || 1;
    refreshOpenAccordionHeight(document.querySelector('.accordion-section[data-accordion="branding"]'));
  }
  renderFitFrame();

  brandNameInput.addEventListener('input', function () {
    brandDraft.name = brandNameInput.value.trim();
    updateNamePreview();
    saveConfirm.hidden = true;
  });

  brandLogoInput.addEventListener('change', function () {
    var file = brandLogoInput.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        brandDraft.logo = reader.result;
        brandDraft.logoNaturalWidth = img.naturalWidth;
        brandDraft.logoNaturalHeight = img.naturalHeight;
        // A fresh upload always starts centered and fully contained — no
        // stretching, no auto-crop — and keeps whatever shape was already
        // chosen (or Square, the default, for a first-ever upload).
        brandDraft.logoZoom = 1;
        brandDraft.logoOffsetX = 0;
        brandDraft.logoOffsetY = 0;
        brandDraft.shape = brandDraft.shape || DEFAULT_LOGO_SHAPE;
        renderFitFrame();
        saveConfirm.hidden = true;
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  brandLogoRemoveBtn.addEventListener('click', function () {
    brandDraft.logo = null;
    brandDraft.logoNaturalWidth = null;
    brandDraft.logoNaturalHeight = null;
    brandDraft.logoZoom = 1;
    brandDraft.logoOffsetX = 0;
    brandDraft.logoOffsetY = 0;
    brandLogoInput.value = '';
    renderFitFrame();
    saveConfirm.hidden = true;
  });

  shapeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      brandDraft.shape = btn.getAttribute('data-shape');
      renderFitFrame();
      saveConfirm.hidden = true;
    });
  });

  zoomSlider.addEventListener('input', function () {
    brandDraft.logoZoom = parseFloat(zoomSlider.value);
    renderFitFrame();
    saveConfirm.hidden = true;
  });

  // Drag-to-reposition: 1px of mouse movement = 1px of offset, since the
  // fit frame is rendered at the same pixel size the live mark uses.
  var fitDragging = false;
  var fitDragStartX = 0, fitDragStartY = 0, fitDragStartOffsetX = 0, fitDragStartOffsetY = 0;

  fitFrame.addEventListener('mousedown', function (e) {
    if (!brandDraft.logo) return;
    fitDragging = true;
    fitDragStartX = e.clientX;
    fitDragStartY = e.clientY;
    fitDragStartOffsetX = brandDraft.logoOffsetX || 0;
    fitDragStartOffsetY = brandDraft.logoOffsetY || 0;
    e.preventDefault();
  });

  document.addEventListener('mousemove', function (e) {
    if (!fitDragging) return;
    brandDraft.logoOffsetX = fitDragStartOffsetX + (e.clientX - fitDragStartX);
    brandDraft.logoOffsetY = fitDragStartOffsetY + (e.clientY - fitDragStartY);
    renderFitFrame();
    saveConfirm.hidden = true;
  });

  document.addEventListener('mouseup', function () {
    fitDragging = false;
  });

  // --- Tabs ---
  var tabButtons = document.querySelectorAll('.settings-tab-btn');
  var panels = document.querySelectorAll('.settings-panel');

  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tabButtons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var target = btn.getAttribute('data-tab');
      panels.forEach(function (panel) {
        panel.hidden = panel.getAttribute('data-panel') !== target;
      });
      // Ava/Inventory sections depend on Features toggles that can change
      // without a page reload (both tabs live on this same page) — recheck
      // every time Notifications becomes the visible tab, not just once.
      if (target === 'notifications') refreshNotificationSectionVisibility();
      if (target === 'automations') refreshAutomationsTab();
      if (target === 'estimates') refreshEstimatesTab();
    });
  });

  // --- Design tab elements ---
  var wheel = document.getElementById('hue-wheel');
  var handle = document.getElementById('hue-handle');
  var slider = document.getElementById('shade-slider');
  var preview = document.getElementById('theme-preview');
  var saveBtn = document.getElementById('save-all-btn');
  var saveConfirm = document.getElementById('save-confirm');
  var swatchButtons = document.querySelectorAll('#swatch-row .swatch-btn');

  var WHEEL_RADIUS = 100;
  var HANDLE_RADIUS = 86; // midpoint of the ring band (outer 100, inner hole 72)

  function positionHandle(hue) {
    var theta = (hue * Math.PI) / 180;
    var dx = HANDLE_RADIUS * Math.sin(theta);
    var dy = -HANDLE_RADIUS * Math.cos(theta);
    handle.style.left = (WHEEL_RADIUS + dx) + 'px';
    handle.style.top = (WHEEL_RADIUS + dy) + 'px';
  }

  function updatePreview() {
    var shades = theme.deriveShades(current);
    var bar = theme.sidebarStops(current);
    preview.style.setProperty('--preview-pine', shades.base);
    preview.style.setProperty('--preview-pine-dark', shades.dark);
    preview.style.setProperty('--preview-pine-tint', shades.tint);
    // The preview sidebar shows the picked accent as the dark pine gradient it
    // becomes in the app; the active nav item stays gold, as it is everywhere.
    preview.style.setProperty('--preview-sidebar-top', bar.top);
    preview.style.setProperty('--preview-sidebar-bottom', bar.bottom);
    handle.style.background = shades.base;
    saveConfirm.hidden = true;
  }

  function syncControls() {
    positionHandle(current.h);
    slider.value = current.l;
    updatePreview();
  }

  function hueFromPointer(clientX, clientY) {
    var rect = wheel.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var dx = clientX - cx;
    var dy = clientY - cy;
    var deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
    if (deg < 0) deg += 360;
    return Math.round(deg);
  }

  var dragging = false;

  function handlePointerDown(e) {
    dragging = true;
    handle.style.cursor = 'grabbing';
    handlePointerMove(e);
    e.preventDefault();
  }

  function handlePointerMove(e) {
    if (!dragging) return;
    var point = e.touches ? e.touches[0] : e;
    current.h = hueFromPointer(point.clientX, point.clientY);
    syncControls();
  }

  function handlePointerUp() {
    dragging = false;
    handle.style.cursor = 'grab';
  }

  wheel.addEventListener('mousedown', handlePointerDown);
  wheel.addEventListener('touchstart', handlePointerDown, { passive: false });
  window.addEventListener('mousemove', handlePointerMove);
  window.addEventListener('touchmove', handlePointerMove, { passive: false });
  window.addEventListener('mouseup', handlePointerUp);
  window.addEventListener('touchend', handlePointerUp);

  slider.addEventListener('input', function () {
    current.l = parseInt(slider.value, 10);
    updatePreview();
  });

  swatchButtons.forEach(function (btn) {
    var hsl = theme.hexToHsl(btn.getAttribute('data-hex'));
    btn.style.backgroundColor = btn.getAttribute('data-hex');
    btn.addEventListener('click', function () {
      current = { h: hsl.h, s: hsl.s, l: hsl.l };
      syncControls();
    });
  });

  // --- Calendar colors / contact status colors ---
  var PRESET_SWATCHES = [
    { hex: '#1F5C4C', title: 'Pine Green' },
    { hex: '#C9A227', title: 'Gold' },
    { hex: '#AF5636', title: 'Terracotta' },
    { hex: '#1E3A5F', title: 'Navy' },
    { hex: '#3E5C76', title: 'Slate Blue' },
    { hex: '#6D2436', title: 'Burgundy' }
  ];

  var techColors = Object.assign({}, theme.getTechColors());
  var statusColors = Object.assign({}, theme.getStatusColors());

  function buildColorRow(label, currentHex, onChange) {
    var row = document.createElement('div');
    row.className = 'color-picker-row';

    var labelEl = document.createElement('div');
    labelEl.className = 'picker-label';
    labelEl.textContent = label;
    row.appendChild(labelEl);

    var swatchRow = document.createElement('div');
    swatchRow.className = 'swatch-row';

    var colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'color-input';
    colorInput.value = currentHex;
    colorInput.addEventListener('input', function () {
      onChange(colorInput.value);
    });

    PRESET_SWATCHES.forEach(function (preset) {
      var swatchBtn = document.createElement('button');
      swatchBtn.type = 'button';
      swatchBtn.className = 'swatch-btn';
      swatchBtn.style.backgroundColor = preset.hex;
      swatchBtn.title = preset.title;
      swatchBtn.addEventListener('click', function () {
        colorInput.value = preset.hex;
        onChange(preset.hex);
      });
      swatchRow.appendChild(swatchBtn);
    });

    row.appendChild(swatchRow);
    row.appendChild(colorInput);
    return row;
  }

  var techList = document.getElementById('tech-color-list');
  Object.keys(theme.techDefaults).forEach(function (name) {
    var row = buildColorRow(name, techColors[name], function (hex) {
      techColors[name] = hex;
      saveConfirm.hidden = true;
    });
    techList.appendChild(row);
  });

  var statusList = document.getElementById('status-color-list');
  Object.keys(theme.statusDefaults).forEach(function (status) {
    var row = buildColorRow(status, statusColors[status], function (hex) {
      statusColors[status] = hex;
      saveConfirm.hidden = true;
    });
    statusList.appendChild(row);
  });

  // --- Accordion sections (Design and Features tabs) ---
  // Independent — each header only toggles its own section, and every
  // section starts collapsed (no section opens by default). Height is
  // driven by an explicit pixel max-height (see css/styles.css's note on
  // .accordion-body) rather than a pure-CSS trick, so it's recomputed here
  // in JS instead of left to a CSS transition alone.
  function setAccordionOpen(section, open) {
    var body = section.querySelector('.accordion-body');
    var inner = section.querySelector('.accordion-body-inner');
    section.classList.toggle('open', open);
    body.style.maxHeight = open ? inner.scrollHeight + 'px' : '0px';
  }

  // Re-measures an already-open section's height after its content's own
  // size changes — the only case that happens here is Company branding's
  // shape/fit controls appearing once a logo is uploaded.
  function refreshOpenAccordionHeight(section) {
    if (!section || !section.classList.contains('open')) return;
    var body = section.querySelector('.accordion-body');
    var inner = section.querySelector('.accordion-body-inner');
    body.style.maxHeight = inner.scrollHeight + 'px';
  }

  document.querySelectorAll('.accordion-header').forEach(function (header) {
    header.addEventListener('click', function () {
      var section = header.closest('.accordion-section');
      setAccordionOpen(section, !section.classList.contains('open'));
    });
  });

  // --- Features tab ---
  // Every toggle applies immediately via setFeatures(), same "saves as you
  // go" behavior as the picker components elsewhere in the app (Urgency,
  // Sales rep, Assigned to) — there's no separate Save button for this tab.
  var featuresState = getFeatures();

  function buildToggleRow(label, checked, onChange) {
    var row = document.createElement('div');
    row.className = 'feature-toggle-row';

    var labelEl = document.createElement('span');
    labelEl.className = 'feature-toggle-label';
    labelEl.textContent = label;
    row.appendChild(labelEl);

    var switchLabel = document.createElement('label');
    switchLabel.className = 'switch';
    var input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    var track = document.createElement('span');
    track.className = 'switch-track';
    var thumb = document.createElement('span');
    thumb.className = 'switch-thumb';
    track.appendChild(thumb);
    switchLabel.appendChild(input);
    switchLabel.appendChild(track);
    row.appendChild(switchLabel);

    input.addEventListener('change', function () {
      onChange(input.checked);
      setFeatures(featuresState);
    });

    return row;
  }

  function renderFeatureGroup(containerId, labels, group, key) {
    var container = document.getElementById(containerId);
    container.innerHTML = '';
    labels.forEach(function (pair) {
      var itemKey = pair[0];
      var label = pair[1];
      var row = group
        ? buildToggleRow(label, featuresState[group][itemKey], function (checked) { featuresState[group][itemKey] = checked; })
        : buildToggleRow(label, featuresState[key], function (checked) { featuresState[key] = checked; });
      container.appendChild(row);
    });
  }

  // Label toggles (Job Type / Appointment Type) are keyed by the label
  // value itself rather than a fixed camelCase key, and carry a rule the
  // generic renderFeatureGroup doesn't: a field can never end with zero
  // enabled values. Turning off the last one on is silently ignored — the
  // state never changes, and re-rendering just snaps that switch back on.
  function renderJobAppointmentLabelGroup(containerId, field, allValues) {
    var container = document.getElementById(containerId);
    container.innerHTML = '';
    allValues.forEach(function (value) {
      var checked = featuresState.jobAppointmentLabels[field][value] !== false;
      var row = buildToggleRow(value, checked, function (nextChecked) {
        var enabledCount = allValues.filter(function (v) {
          return featuresState.jobAppointmentLabels[field][v] !== false;
        }).length;
        if (!nextChecked && enabledCount <= 1) {
          renderJobAppointmentLabelGroup(containerId, field, allValues);
          return;
        }
        featuresState.jobAppointmentLabels[field][value] = nextChecked;
      });
      container.appendChild(row);
    });
  }

  function renderAllFeatureGroups() {
    renderFeatureGroup('feature-list-modules', [
      ['boards', 'Boards'],
      ['inventory', 'Inventory'],
    ], 'modules');

    renderFeatureGroup('feature-list-dashboard-widgets', [
      ['quickActions', 'Quick Actions'],
      ['statCards', 'Stat Cards'],
      ['recentlyViewed', 'Recently Viewed'],
      ['todaysSchedule', "Today's Schedule"],
      ['aiActivityFeed', 'AI Activity Feed'],
    ], 'dashboardWidgets');

    renderFeatureGroup('feature-list-job-activity-tabs', [
      ['messages', 'Messages'],
      ['calls', 'Calls & Transcripts'],
      ['documents', 'Documents'],
      ['photos', 'Photos'],
      ['estimate', 'Estimate'],
    ], 'jobActivityTabs');

    renderFeatureGroup('feature-list-ai-assistant', [
      ['aiAssistant', 'AI Assistant (Ava)'],
    ], null, 'aiAssistant');

    renderFeatureGroup('feature-list-sales-rep-tracking', [
      ['salesRepTracking', 'Sales Rep Tracking'],
    ], null, 'salesRepTracking');

    renderJobAppointmentLabelGroup('feature-list-appointment-type', 'appointment_type', APPOINTMENT_TYPES);
    renderJobAppointmentLabelGroup('feature-list-job-type', 'job_type', JOB_TYPES);
  }
  renderAllFeatureGroups();

  var featuresResetBtn = document.getElementById('features-reset-btn');
  var featuresResetConfirm = document.getElementById('features-reset-confirm');
  featuresResetBtn.addEventListener('click', function () {
    featuresState = JSON.parse(JSON.stringify(DEFAULT_FEATURES));
    setFeatures(featuresState);
    renderAllFeatureGroups();
    featuresResetConfirm.hidden = false;
    setTimeout(function () { featuresResetConfirm.hidden = true; }, 2500);
  });

  // --- Notifications tab ---
  // Unlike Features (each toggle saves instantly), this tab batches
  // everything into one draft object and only persists it on Save — same
  // pattern as the Design tab's accent/colors/branding. Nothing here
  // actually sends a notification; there's no live email/SMS/push
  // integration yet, so this only ever persists the toggle state itself.
  var notificationsDraft = getNotificationSettings();

  function renderNotificationToggleGroup(containerId, group, labels) {
    var container = document.getElementById(containerId);
    container.innerHTML = '';
    labels.forEach(function (pair) {
      var key = pair[0];
      var label = pair[1];
      var row = buildToggleRowDraft(label, notificationsDraft[group][key], function (checked) {
        notificationsDraft[group][key] = checked;
      });
      container.appendChild(row);
    });
  }

  // Same visual row as Features' buildToggleRow, but never saves on its
  // own — every notification toggle is draft-only until the Save button
  // below commits the whole object at once.
  function buildToggleRowDraft(label, checked, onChange) {
    var row = document.createElement('div');
    row.className = 'feature-toggle-row';

    var labelEl = document.createElement('span');
    labelEl.className = 'feature-toggle-label';
    labelEl.textContent = label;
    row.appendChild(labelEl);

    var switchLabel = document.createElement('label');
    switchLabel.className = 'switch';
    var input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    var track = document.createElement('span');
    track.className = 'switch-track';
    var thumb = document.createElement('span');
    thumb.className = 'switch-thumb';
    track.appendChild(thumb);
    switchLabel.appendChild(input);
    switchLabel.appendChild(track);
    row.appendChild(switchLabel);

    input.addEventListener('change', function () {
      onChange(input.checked);
      notifSaveConfirm.hidden = true;
    });

    return row;
  }

  function renderNotificationTopToggles() {
    var container = document.getElementById('notif-top-toggles');
    container.innerHTML = '';
    container.appendChild(buildToggleRowDraft('Also Email Me', notificationsDraft.alsoEmail, function (checked) {
      notificationsDraft.alsoEmail = checked;
    }));
    container.appendChild(buildToggleRowDraft('Also Text Me', notificationsDraft.alsoText, function (checked) {
      notificationsDraft.alsoText = checked;
    }));
  }

  function renderAllNotificationGroups() {
    renderNotificationTopToggles();

    renderNotificationToggleGroup('notif-list-leads-scheduling', 'leadsScheduling', [
      ['newLead', 'New Lead Captured'],
      ['appointmentConfirmed', 'Appointment Confirmed'],
      ['appointmentCancelled', 'Appointment Cancelled/Rescheduled'],
      ['appointmentReminder', 'Appointment Reminder (1 Hour Before)'],
    ]);

    renderNotificationToggleGroup('notif-list-ai-assistant', 'aiAssistant', [
      ['followUpDrafted', 'Follow-Up Drafted Needs Review'],
      ['missedCall', 'Missed Call/Voicemail From Ava'],
      ['autoQualified', 'Job Auto-Qualified By Ava'],
    ]);

    renderNotificationToggleGroup('notif-list-jobs-pipeline', 'jobsPipeline', [
      ['statusChanged', 'Job Status Changed'],
      ['assignedToYou', 'Job Assigned To You'],
      ['quoteSent', 'Quote/Estimate Sent'],
      ['overduePriority', 'Overdue/Priority Item'],
    ]);

    renderNotificationToggleGroup('notif-list-inventory', 'inventory', [
      ['lowStock', 'Low Stock Alert'],
    ]);

    renderNotificationToggleGroup('notif-list-payments', 'payments', [
      ['paymentReceived', 'Payment Received'],
      ['paymentOverdue', 'Payment Overdue'],
    ]);
  }
  renderAllNotificationGroups();

  // The Ava and Inventory sections only make sense when those Features are
  // themselves on — both tabs live on the same page, so a Features toggle
  // flipped without a reload needs to be reflected here too (see the tab
  // click handler above, which calls this every time Notifications becomes
  // the active tab).
  function refreshNotificationSectionVisibility() {
    document.getElementById('notif-section-ai-assistant').hidden = !getFeatures().aiAssistant;
    document.getElementById('notif-section-inventory').hidden = !getFeatures().modules.inventory;
  }
  refreshNotificationSectionVisibility();

  var notifSaveBtn = document.getElementById('notif-save-btn');
  var notifSaveConfirm = document.getElementById('notif-save-confirm');
  notifSaveBtn.addEventListener('click', function () {
    setNotificationSettings(notificationsDraft);
    notifSaveConfirm.hidden = false;
    setTimeout(function () { notifSaveConfirm.hidden = true; }, 2500);
  });

  // --- Automations tab ---
  // Rules save immediately (Save button per-rule, like the Job card's own
  // Edit/Save/Cancel — not batched like Notifications). The Upcoming
  // Automations list is never stored; it's recomputed from the current
  // rules + the real JOBS/APPOINTMENTS data on every render, which is what
  // "preview only" actually means here — nothing about it persists.
  var AUTOMATION_ACTIONS = [
    { value: 'text', label: 'Text Message' },
    { value: 'email', label: 'Email' },
    { value: 'call', label: 'Call Reminder' },
  ];
  var AUTOMATION_TIMING_UNITS = [
    { value: 'minutes', label: 'Minutes' },
    { value: 'hours', label: 'Hours' },
    { value: 'days', label: 'Days' },
  ];
  var AUTOMATION_UNIT_MS = { minutes: 60000, hours: 3600000, days: 86400000 };

  var automationEditingId = null; // null = editor closed, 'new' = creating, else the rule id being edited
  var automationDraft = null;

  function newAutomationDraft() {
    return {
      id: null,
      name: '',
      enabled: true,
      conditions: { status: [], jobType: [], appointmentType: [] },
      timing: { amount: 24, unit: 'hours', direction: 'before' },
      action: 'text',
      message: '',
    };
  }

  function actionLabel(action) {
    var found = AUTOMATION_ACTIONS.find(function (a) { return a.value === action; });
    return found ? found.label : action;
  }

  // Empty group = "any" for that group; groups AND together, values within
  // a group OR together — exactly the rule the conditions UI describes.
  function summarizeConditions(conditions) {
    return [
      'Status: ' + (conditions.status.length ? conditions.status.join(' or ') : 'Any'),
      'Job Type: ' + (conditions.jobType.length ? conditions.jobType.join(' or ') : 'Any'),
      'Appointment Type: ' + (conditions.appointmentType.length ? conditions.appointmentType.join(' or ') : 'Any'),
    ].join(' · ');
  }

  function summarizeTiming(timing) {
    var unit = AUTOMATION_TIMING_UNITS.find(function (u) { return u.value === timing.unit; });
    var dir = timing.direction === 'before' ? 'Before' : 'After';
    return timing.amount + ' ' + (unit ? unit.label : timing.unit) + ' ' + dir + ' Appointment';
  }

  function jobMatchesAutomationConditions(job, conditions) {
    if (conditions.status.length && conditions.status.indexOf(job.status) === -1) return false;
    if (conditions.jobType.length && conditions.jobType.indexOf(job.job_type) === -1) return false;
    if (conditions.appointmentType.length && conditions.appointmentType.indexOf(job.appointment_type) === -1) return false;
    return true;
  }

  var yourAutomationsSection = document.querySelector('.accordion-section[data-accordion="your-automations"]');
  var upcomingAutomationsSection = document.querySelector('.accordion-section[data-accordion="upcoming-automations"]');

  function renderAutomationEditor() {
    var wrap = document.getElementById('automation-editor-wrap');
    if (!automationDraft) {
      wrap.innerHTML = '';
      refreshOpenAccordionHeight(yourAutomationsSection);
      return;
    }
    var d = automationDraft;

    function checkboxGroupHtml(groupKey, values) {
      return values.map(function (v) {
        var checked = d.conditions[groupKey].indexOf(v) !== -1;
        var inputId = 'auto-cond-' + groupKey + '-' + v.replace(/[^a-zA-Z0-9]/g, '');
        return '<label class="automation-checkbox-row" for="' + inputId + '">'
          + '<input type="checkbox" id="' + inputId + '" data-group="' + groupKey + '" data-value="' + escapeHtml(v) + '" ' + (checked ? 'checked' : '') + '>'
          + '<span>' + escapeHtml(v) + '</span></label>';
      }).join('');
    }

    var unitOptionsHtml = AUTOMATION_TIMING_UNITS.map(function (u) {
      return '<option value="' + u.value + '" ' + (u.value === d.timing.unit ? 'selected' : '') + '>' + u.label + '</option>';
    }).join('');
    var actionOptionsHtml = AUTOMATION_ACTIONS.map(function (a) {
      return '<option value="' + a.value + '" ' + (a.value === d.action ? 'selected' : '') + '>' + a.label + '</option>';
    }).join('');

    wrap.innerHTML = ''
      + '<div class="card automation-editor-card">'
      + '  <div class="edit-field">'
      + '    <span class="info-label">Name</span>'
      + '    <input type="text" class="text-input" id="auto-name-input" placeholder="Automation ' + (getAutomations().length + 1) + '" value="' + escapeHtml(d.name) + '">'
      + '  </div>'
      + '  <div class="feature-toggle-row">'
      + '    <span class="feature-toggle-label">Enabled</span>'
      + '    <label class="switch"><input type="checkbox" id="auto-enabled-input" ' + (d.enabled ? 'checked' : '') + '><span class="switch-track"><span class="switch-thumb"></span></span></label>'
      + '  </div>'
      + '  <span class="info-label">Conditions</span>'
      + '  <div class="automation-conditions">'
      + '    <div class="automation-condition-group"><div class="feature-toggle-subhead">Status</div><div class="automation-checkbox-list">' + checkboxGroupHtml('status', STATUS_PIPELINE) + '</div></div>'
      + '    <div class="automation-condition-group"><div class="feature-toggle-subhead">Job Type</div><div class="automation-checkbox-list">' + checkboxGroupHtml('jobType', JOB_TYPES) + '</div></div>'
      + '    <div class="automation-condition-group"><div class="feature-toggle-subhead">Appointment Type</div><div class="automation-checkbox-list">' + checkboxGroupHtml('appointmentType', APPOINTMENT_TYPES) + '</div></div>'
      + '  </div>'
      + '  <div class="automation-timing-row">'
      + '    <span class="info-label">Timing</span>'
      + '    <input type="number" class="text-input automation-timing-amount" id="auto-timing-amount" min="0" step="1" value="' + d.timing.amount + '">'
      + '    <select class="select-input" id="auto-timing-unit">' + unitOptionsHtml + '</select>'
      + '    <select class="select-input" id="auto-timing-direction">'
      + '      <option value="before" ' + (d.timing.direction === 'before' ? 'selected' : '') + '>Before</option>'
      + '      <option value="after" ' + (d.timing.direction === 'after' ? 'selected' : '') + '>After</option>'
      + '    </select>'
      + '    <span class="automation-timing-suffix">Appointment</span>'
      + '  </div>'
      + '  <div class="edit-field">'
      + '    <span class="info-label">Action</span>'
      + '    <select class="select-input" id="auto-action-input">' + actionOptionsHtml + '</select>'
      + '  </div>'
      + '  <div class="edit-field automation-message-field">'
      + '    <span class="info-label">Message Template</span>'
      + '    <textarea class="text-input" id="auto-message-input" rows="4" placeholder="Hi {{contact_name}}, this is a reminder about your {{appointment_date}} appointment.">' + escapeHtml(d.message) + '</textarea>'
      + '    <div class="automation-variables-hint">Insert variables: {{contact_name}}, {{appointment_date}}, {{appointment_time}}, {{job_type}}, {{tech_name}}</div>'
      + '  </div>'
      + '  <div class="btn-row">'
      + '    <button type="button" class="btn btn-primary" id="auto-save-btn">Save</button>'
      + '    <button type="button" class="btn btn-secondary" id="auto-cancel-btn">Cancel</button>'
      + '  </div>'
      + '</div>';

    wrap.querySelectorAll('.automation-checkbox-list input[type=checkbox]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var group = cb.getAttribute('data-group');
        var value = cb.getAttribute('data-value');
        var list = d.conditions[group];
        var idx = list.indexOf(value);
        if (cb.checked && idx === -1) list.push(value);
        if (!cb.checked && idx !== -1) list.splice(idx, 1);
      });
    });

    document.getElementById('auto-cancel-btn').addEventListener('click', function () {
      automationEditingId = null;
      automationDraft = null;
      renderAutomationEditor();
    });

    document.getElementById('auto-save-btn').addEventListener('click', function () {
      var rules = getAutomations();
      d.name = document.getElementById('auto-name-input').value.trim() || ('Automation ' + (rules.length + 1));
      d.enabled = document.getElementById('auto-enabled-input').checked;
      d.timing.amount = Math.max(0, parseInt(document.getElementById('auto-timing-amount').value, 10) || 0);
      d.timing.unit = document.getElementById('auto-timing-unit').value;
      d.timing.direction = document.getElementById('auto-timing-direction').value;
      d.action = document.getElementById('auto-action-input').value;
      d.message = document.getElementById('auto-message-input').value;

      if (d.id) {
        var idx = rules.findIndex(function (r) { return r.id === d.id; });
        if (idx !== -1) rules[idx] = d;
      } else {
        d.id = 'auto-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
        rules.push(d);
      }
      setAutomations(rules);
      automationEditingId = null;
      automationDraft = null;
      refreshAutomationsTab();
    });

    refreshOpenAccordionHeight(yourAutomationsSection);
  }

  function renderAutomationList() {
    var container = document.getElementById('automation-list');
    var rules = getAutomations();
    if (rules.length === 0) {
      container.innerHTML = '<div class="empty-note">No automations yet.</div>';
      refreshOpenAccordionHeight(yourAutomationsSection);
      return;
    }
    container.innerHTML = rules.map(function (rule) {
      return ''
        + '<div class="card automation-card">'
        + '  <div class="automation-card-header">'
        + '    <div class="automation-card-name">' + escapeHtml(rule.name) + '</div>'
        + '    <label class="switch"><input type="checkbox" class="automation-enabled-toggle" data-id="' + rule.id + '" ' + (rule.enabled ? 'checked' : '') + '><span class="switch-track"><span class="switch-thumb"></span></span></label>'
        + '  </div>'
        + '  <div class="automation-card-meta">' + escapeHtml(summarizeConditions(rule.conditions)) + '</div>'
        + '  <div class="automation-card-meta">' + escapeHtml(summarizeTiming(rule.timing)) + '</div>'
        + '  <div class="automation-card-footer">'
        + '    <span class="badge badge-automation-action">' + escapeHtml(actionLabel(rule.action)) + '</span>'
        + '    <div class="btn-row" style="margin:0;">'
        + '      <button type="button" class="btn btn-secondary automation-edit-btn" data-id="' + rule.id + '">Edit</button>'
        + '      <button type="button" class="btn btn-secondary automation-delete-btn" data-id="' + rule.id + '">Delete</button>'
        + '    </div>'
        + '  </div>'
        + '</div>';
    }).join('');

    container.querySelectorAll('.automation-enabled-toggle').forEach(function (input) {
      input.addEventListener('change', function () {
        var rules = getAutomations();
        var rule = rules.find(function (r) { return r.id === input.getAttribute('data-id'); });
        if (rule) rule.enabled = input.checked;
        setAutomations(rules);
        renderUpcomingAutomations();
      });
    });

    container.querySelectorAll('.automation-edit-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var rule = getAutomations().find(function (r) { return r.id === btn.getAttribute('data-id'); });
        if (!rule) return;
        automationEditingId = rule.id;
        automationDraft = JSON.parse(JSON.stringify(rule));
        renderAutomationEditor();
        document.getElementById('automation-editor-wrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    container.querySelectorAll('.automation-delete-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        setAutomations(getAutomations().filter(function (r) { return r.id !== id; }));
        if (automationEditingId === id) {
          automationEditingId = null;
          automationDraft = null;
          renderAutomationEditor();
        }
        refreshAutomationsTab();
      });
    });

    refreshOpenAccordionHeight(yourAutomationsSection);
  }

  // Recomputed from scratch every time — every enabled rule against every
  // job in JOBS, matched against real current status/job type/appointment
  // type, with a fire time derived from that job's real appointment. A job
  // with no appointment yet can't produce a computed time, so it's skipped
  // rather than guessed at.
  function renderUpcomingAutomations() {
    var container = document.getElementById('automation-upcoming-list');
    var rules = getAutomations().filter(function (r) { return r.enabled; });

    var entries = [];
    rules.forEach(function (rule) {
      JOBS.forEach(function (job) {
        if (!jobMatchesAutomationConditions(job, rule.conditions)) return;
        var appt = getAppointmentForJob(job.id);
        if (!appt) return;
        var baseTime = new Date(appt.start_time).getTime();
        var offsetMs = rule.timing.amount * (AUTOMATION_UNIT_MS[rule.timing.unit] || 0) * (rule.timing.direction === 'before' ? -1 : 1);
        var contact = getContact(job.contact_id);
        entries.push({
          ruleName: rule.name,
          action: actionLabel(rule.action),
          contactName: contact.full_name,
          jobTitle: job.service_type,
          fireTime: new Date(baseTime + offsetMs),
        });
      });
    });

    entries.sort(function (a, b) { return a.fireTime - b.fireTime; });

    if (entries.length === 0) {
      container.innerHTML = '<div class="empty-note">No upcoming automations — add a rule above, or check that its conditions match a job with an appointment.</div>';
      refreshOpenAccordionHeight(upcomingAutomationsSection);
      return;
    }

    container.innerHTML = '<div class="doc-list">' + entries.map(function (e) {
      return ''
        + '<div class="doc-row">'
        + '  <div class="doc-body">'
        + '    <div class="doc-name">' + escapeHtml(e.ruleName) + ' · ' + escapeHtml(e.action) + '</div>'
        + '    <div class="doc-meta">' + escapeHtml(e.contactName) + ' — ' + escapeHtml(e.jobTitle) + '</div>'
        + '  </div>'
        + '  <div class="automation-upcoming-time">' + formatDateTime(e.fireTime.toISOString()) + '</div>'
        + '</div>';
    }).join('') + '</div>';
    refreshOpenAccordionHeight(upcomingAutomationsSection);
  }

  function refreshAutomationsTab() {
    renderAutomationEditor();
    renderAutomationList();
    renderUpcomingAutomations();
  }
  refreshAutomationsTab();

  document.getElementById('automation-new-btn').addEventListener('click', function () {
    automationEditingId = 'new';
    automationDraft = newAutomationDraft();
    renderAutomationEditor();
    document.getElementById('automation-editor-wrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // --- Estimates tab (templates) ---
  // Templates save immediately via their own Save button, same shape as
  // Automations. Line-item add/remove re-renders the editor (a structural
  // change); typing in a field mutates the draft in place and only updates
  // the total span, so focus never jumps mid-keystroke.
  var estimatesSection = document.querySelector('.accordion-section[data-accordion="estimate-templates"]');
  var estimateEditingId = null; // null closed, 'new', or the template id being edited
  var estimateDraft = null;

  function newEstimateTemplateDraft() {
    return { id: null, name: '', lineItems: [] };
  }

  function wireEstimateLineItemInputs(containerId, lineItems, onFieldChange) {
    document.querySelectorAll('#' + containerId + ' .estimate-line-item-row').forEach(function (row) {
      var li = lineItems.find(function (l) { return l.id === row.getAttribute('data-line-id'); });
      row.querySelectorAll('input').forEach(function (input) {
        input.addEventListener('input', function () {
          var field = input.getAttribute('data-field');
          li[field] = (field === 'quantity' || field === 'price') ? (parseFloat(input.value) || 0) : input.value;
          onFieldChange();
        });
      });
    });
  }

  function renderEstimateTemplateEditor() {
    var wrap = document.getElementById('estimate-template-editor-wrap');
    if (!estimateDraft) {
      wrap.innerHTML = '';
      refreshOpenAccordionHeight(estimatesSection);
      return;
    }
    var d = estimateDraft;

    var rowsHtml = d.lineItems.map(function (li) {
      return '<div class="estimate-line-item-row" data-line-id="' + li.id + '">'
        + '<input type="text" class="text-input" data-field="name" placeholder="Item Name" value="' + escapeHtml(li.name) + '">'
        + '<input type="text" class="text-input" data-field="description" placeholder="Description" value="' + escapeHtml(li.description) + '">'
        + '<input type="number" class="text-input" data-field="quantity" min="0" step="1" value="' + li.quantity + '">'
        + '<input type="number" class="text-input" data-field="price" min="0" step="0.01" value="' + li.price + '">'
        + '<button type="button" class="materials-remove estimate-remove-line-btn" data-line-id="' + li.id + '" aria-label="Remove line item">&times;</button>'
        + '</div>';
    }).join('');

    wrap.innerHTML = ''
      + '<div class="card automation-editor-card">'
      + '  <div class="edit-field"><span class="info-label">Template Name</span>'
      + '    <input type="text" class="text-input" id="est-tpl-name-input" placeholder="Template ' + (getEstimateTemplates().length + 1) + '" value="' + escapeHtml(d.name) + '"></div>'
      + '  <span class="info-label">Line Items</span>'
      + '  <div class="estimate-line-items-header"><span>Item Name</span><span>Description</span><span>Qty</span><span>Price</span><span></span></div>'
      + '  <div class="estimate-line-items-list" id="est-tpl-line-items">' + rowsHtml + '</div>'
      + '  <button type="button" class="btn btn-secondary" id="est-tpl-add-line-btn">+ Add Line Item</button>'
      + '  <div class="estimate-total-row"><span>Total</span><span id="est-tpl-total">' + formatMoney(estimateLineItemsTotal(d.lineItems)) + '</span></div>'
      + '  <div class="btn-row" style="margin-top:16px;">'
      + '    <button type="button" class="btn btn-primary" id="est-tpl-save-btn">Save</button>'
      + '    <button type="button" class="btn btn-secondary" id="est-tpl-cancel-btn">Cancel</button>'
      + '  </div>'
      + '</div>';

    // Add/Remove Line Item re-render the whole editor from `d`, so the name
    // field's typed value has to be synced into the draft on every
    // keystroke too — otherwise adding a row would silently wipe out
    // whatever the user had just typed as the template name.
    document.getElementById('est-tpl-name-input').addEventListener('input', function () {
      d.name = document.getElementById('est-tpl-name-input').value;
    });

    var totalEl = document.getElementById('est-tpl-total');
    wireEstimateLineItemInputs('est-tpl-line-items', d.lineItems, function () {
      totalEl.textContent = formatMoney(estimateLineItemsTotal(d.lineItems));
    });

    document.getElementById('est-tpl-add-line-btn').addEventListener('click', function () {
      d.lineItems.push(newEstimateLineItem());
      renderEstimateTemplateEditor();
    });

    document.querySelectorAll('#est-tpl-line-items .estimate-remove-line-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        d.lineItems = d.lineItems.filter(function (l) { return l.id !== btn.getAttribute('data-line-id'); });
        renderEstimateTemplateEditor();
      });
    });

    document.getElementById('est-tpl-cancel-btn').addEventListener('click', function () {
      estimateEditingId = null;
      estimateDraft = null;
      renderEstimateTemplateEditor();
    });

    document.getElementById('est-tpl-save-btn').addEventListener('click', function () {
      var templates = getEstimateTemplates();
      d.name = document.getElementById('est-tpl-name-input').value.trim() || ('Template ' + (templates.length + 1));
      if (d.id) {
        var idx = templates.findIndex(function (t) { return t.id === d.id; });
        if (idx !== -1) templates[idx] = d;
      } else {
        d.id = 'template-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
        templates.push(d);
      }
      setEstimateTemplates(templates);
      estimateEditingId = null;
      estimateDraft = null;
      refreshEstimatesTab();
    });

    refreshOpenAccordionHeight(estimatesSection);
  }

  function renderEstimateTemplateList() {
    var container = document.getElementById('estimate-template-list');
    var templates = getEstimateTemplates();
    if (templates.length === 0) {
      container.innerHTML = '<div class="empty-note">No estimate templates yet.</div>';
      refreshOpenAccordionHeight(estimatesSection);
      return;
    }
    container.innerHTML = templates.map(function (t) {
      return ''
        + '<div class="card automation-card">'
        + '  <div class="automation-card-header"><div class="automation-card-name">' + escapeHtml(t.name) + '</div></div>'
        + '  <div class="automation-card-meta">' + t.lineItems.length + ' item' + (t.lineItems.length === 1 ? '' : 's') + ' · ' + formatMoney(estimateLineItemsTotal(t.lineItems)) + '</div>'
        + '  <div class="automation-card-footer" style="justify-content:flex-end;">'
        + '    <div class="btn-row" style="margin:0;">'
        + '      <button type="button" class="btn btn-secondary estimate-template-edit-btn" data-id="' + t.id + '">Edit</button>'
        + '      <button type="button" class="btn btn-secondary estimate-template-delete-btn" data-id="' + t.id + '">Delete</button>'
        + '    </div>'
        + '  </div>'
        + '</div>';
    }).join('');

    container.querySelectorAll('.estimate-template-edit-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var t = getEstimateTemplates().find(function (x) { return x.id === btn.getAttribute('data-id'); });
        if (!t) return;
        estimateEditingId = t.id;
        estimateDraft = JSON.parse(JSON.stringify(t));
        renderEstimateTemplateEditor();
        document.getElementById('estimate-template-editor-wrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    container.querySelectorAll('.estimate-template-delete-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        setEstimateTemplates(getEstimateTemplates().filter(function (t) { return t.id !== id; }));
        if (estimateEditingId === id) {
          estimateEditingId = null;
          estimateDraft = null;
        }
        refreshEstimatesTab();
      });
    });

    refreshOpenAccordionHeight(estimatesSection);
  }

  function refreshEstimatesTab() {
    renderEstimateTemplateEditor();
    renderEstimateTemplateList();
  }
  refreshEstimatesTab();

  document.getElementById('estimate-template-new-btn').addEventListener('click', function () {
    estimateEditingId = 'new';
    estimateDraft = newEstimateTemplateDraft();
    renderEstimateTemplateEditor();
    document.getElementById('estimate-template-editor-wrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  saveBtn.addEventListener('click', function () {
    theme.saveAccent(current);
    theme.saveTechColors(techColors);
    theme.saveStatusColors(statusColors);
    setBrand({
      name: brandDraft.name || DEFAULT_BRAND_NAME,
      logo: brandDraft.logo,
      logoNaturalWidth: brandDraft.logoNaturalWidth,
      logoNaturalHeight: brandDraft.logoNaturalHeight,
      shape: brandDraft.shape || DEFAULT_LOGO_SHAPE,
      logoZoom: brandDraft.logoZoom || 1,
      logoOffsetX: brandDraft.logoOffsetX || 0,
      logoOffsetY: brandDraft.logoOffsetY || 0,
    });
    saveConfirm.hidden = false;
  });

  syncControls();
})();

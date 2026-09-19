(function () {
  var theme = window.ForemanTheme;
  var current = Object.assign({}, theme.getAccent());

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
    { hex: '#1F5C4C', title: 'Pine green' },
    { hex: '#C9A227', title: 'Gold' },
    { hex: '#AF5636', title: 'Terracotta' },
    { hex: '#1E3A5F', title: 'Navy' },
    { hex: '#3E5C76', title: 'Slate blue' },
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

  saveBtn.addEventListener('click', function () {
    theme.saveAccent(current);
    theme.saveTechColors(techColors);
    theme.saveStatusColors(statusColors);
    saveConfirm.hidden = false;
  });

  syncControls();
})();

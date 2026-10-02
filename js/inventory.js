// Inventory grid: view, add, edit, delete, and restock items — all saved to
// Supabase (js/inventory-store.js). Quantity deducted automatically when a
// job completes (js/data.js's deductMaterialsForJob) uses the exact same
// adjustInventoryQuantity as the manual +/- steppers here — one source of
// truth either way. Each change shows at once; if Supabase rejects it, it's
// rolled back and the grid redraws with what's actually stored.
const PACKAGE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 8.5v7a1 1 0 0 1-.5.87l-8 4.5a1 1 0 0 1-1 0l-8-4.5A1 1 0 0 1 3 15.5v-7a1 1 0 0 1 .5-.87l8-4.5a1 1 0 0 1 1 0l8 4.5a1 1 0 0 1 .5.87z"/><path d="M3.27 7.96 12 13l8.73-5.04M12 22V13"/></svg>`;

// Which item (if any) is mid-edit, or "new" while the add form is open —
// only one editor open at a time, matching the rest of the app's inline
// edit pattern (Contact/Job cards).
let inventoryEditingId = null;
let inventoryAddingNew = false;

whenAppReady(() => {
  document.getElementById("add-item-btn").addEventListener("click", () => {
    if (inventoryAddingNew) return;
    inventoryAddingNew = true;
    inventoryEditingId = null;
    render();
  });
  render();
});

function render() {
  document.getElementById("inventory-subtitle").textContent =
    `${INVENTORY.length} item${INVENTORY.length === 1 ? "" : "s"} on hand`;

  const grid = document.getElementById("inventory-grid");
  const cards = [];
  if (inventoryAddingNew) cards.push(renderItemEditor(null));
  INVENTORY.forEach(item => {
    cards.push(item.id === inventoryEditingId ? renderItemEditor(item) : renderItemCard(item));
  });

  grid.innerHTML = cards.length > 0 ? cards.join("") : `<div class="empty-note">No inventory items yet.</div>`;
  wireCards();
}

function renderItemCard(item) {
  const low = isLowStock(item);
  return `
    <div class="inventory-card" data-id="${item.id}">
      <div class="inventory-photo">
        ${item.photo ? `<img src="${item.photo}" alt="">` : `<div class="inventory-photo-placeholder">${PACKAGE_ICON}</div>`}
      </div>
      <div class="inventory-card-body">
        <div class="inventory-card-name">${escapeHtml(item.name)}</div>
        <div class="inventory-card-desc">${escapeHtml(item.description)}</div>

        <div class="inventory-card-row">
          <div class="qty-stepper">
            <button type="button" class="qty-btn" data-id="${item.id}" data-delta="-1" aria-label="Decrease quantity">−</button>
            <span class="qty-value">${item.quantity}</span>
            <button type="button" class="qty-btn" data-id="${item.id}" data-delta="1" aria-label="Increase quantity">+</button>
          </div>
          <div class="inventory-price">${formatMoney(item.unit_price)} / unit</div>
        </div>

        ${low ? `<span class="badge badge-urgent inventory-low-stock">Low Stock</span>` : ""}

        <div class="btn-row">
          <button type="button" class="btn btn-secondary inventory-edit-btn" data-id="${item.id}">Edit</button>
          <button type="button" class="btn btn-secondary inventory-delete-btn" data-id="${item.id}">Delete</button>
        </div>
      </div>
    </div>
  `;
}

function renderItemEditor(item) {
  const isNew = !item;
  const name = item ? item.name : "";
  const description = item ? item.description : "";
  const quantity = item ? item.quantity : 0;
  const unitPrice = item ? item.unit_price : "";
  const photo = item ? item.photo : null;
  const formId = item ? item.id : "new";

  return `
    <div class="inventory-card inventory-card-editing" data-form-id="${formId}">
      <div class="inventory-photo" id="inv-photo-preview-${formId}">
        ${photo ? `<img src="${photo}" alt="">` : `<div class="inventory-photo-placeholder">${PACKAGE_ICON}</div>`}
      </div>
      <div class="inventory-card-body">
        <div class="edit-field">
          <span class="info-label">Photo</span>
          <input type="file" accept="image/*" class="inv-photo-input" data-form-id="${formId}">
        </div>
        <div class="edit-field">
          <span class="info-label">Name</span>
          <input type="text" class="text-input inv-name" value="${escapeHtml(name)}">
        </div>
        <div class="edit-field">
          <span class="info-label">Description</span>
          <input type="text" class="text-input inv-desc" value="${escapeHtml(description)}">
        </div>
        <div class="edit-field">
          <span class="info-label">${isNew ? "Starting Qty" : "Quantity"}</span>
          <input type="number" class="text-input inv-qty" value="${quantity}" min="0" step="1">
        </div>
        <div class="edit-field">
          <span class="info-label">Unit Price</span>
          <input type="number" class="text-input inv-price" value="${unitPrice}" min="0" step="0.01">
        </div>
        <div class="btn-row">
          <button type="button" class="btn btn-primary inv-save-btn" data-form-id="${formId}">Save</button>
          <button type="button" class="btn btn-secondary inv-cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  `;
}

function wireCards() {
  // Manual restock/use — separate from the automatic Completed deduction.
  document.querySelectorAll(".qty-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      adjustInventoryQuantity(btn.getAttribute("data-id"), parseInt(btn.getAttribute("data-delta"), 10))
        .then(r => { if (r.error) render(); });
      render();
    });
  });

  document.querySelectorAll(".inventory-edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      inventoryEditingId = btn.getAttribute("data-id");
      inventoryAddingNew = false;
      render();
    });
  });

  document.querySelectorAll(".inventory-delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = getInventoryItem(btn.getAttribute("data-id"));
      if (item && confirm(`Delete "${item.name}"?`)) {
        deleteInventoryItem(item.id).then(r => { if (r.error) render(); });
        render();
      }
    });
  });

  document.querySelectorAll(".inv-photo-input").forEach(input => {
    input.addEventListener("change", () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const preview = document.getElementById(`inv-photo-preview-${input.getAttribute("data-form-id")}`);
        preview.innerHTML = `<img src="${reader.result}" alt="">`;
        preview.dataset.photo = reader.result;
      };
      reader.readAsDataURL(file);
    });
  });

  document.querySelectorAll(".inv-cancel-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      inventoryEditingId = null;
      inventoryAddingNew = false;
      render();
    });
  });

  document.querySelectorAll(".inv-save-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const formId = btn.getAttribute("data-form-id");
      const card = btn.closest(".inventory-card-editing");
      const preview = document.getElementById(`inv-photo-preview-${formId}`);
      const existing = formId === "new" ? null : getInventoryItem(formId);

      const details = {
        name: card.querySelector(".inv-name").value.trim() || "Untitled item",
        description: card.querySelector(".inv-desc").value.trim(),
        quantity: parseInt(card.querySelector(".inv-qty").value, 10) || 0,
        unit_price: parseFloat(card.querySelector(".inv-price").value) || 0,
        photo: preview.dataset.photo || (existing ? existing.photo : null),
      };

      // The editor closes once Supabase confirms; if the save fails it stays
      // open with everything as typed, so Save can be retried.
      (existing ? updateInventoryItem(existing.id, details) : addInventoryItem(details)).then(r => {
        if (r.error) return;
        inventoryEditingId = null;
        inventoryAddingNew = false;
        render();
      });
    });
  });
}

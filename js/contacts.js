// Contacts directory: a plain, browsable list of every contact on file,
// alphabetical by name. Search lives globally in the shared topbar
// (js/search.js) now, not on this page.
document.addEventListener("DOMContentLoaded", () => {
  renderContactsList();
});

function renderContactsList() {
  const contacts = [...CONTACTS].sort((a, b) => a.full_name.localeCompare(b.full_name));

  document.getElementById("contacts-subtitle").textContent =
    `${contacts.length} contact${contacts.length === 1 ? "" : "s"} on file`;

  const list = document.getElementById("contacts-list");
  list.innerHTML = contacts.map(renderContactRow).join("");
  wirePickers(list, renderContactsList);
}

function renderContactRow(contact) {
  const jobCount = getJobsForContact(contact.id).length;
  return `
    <a class="contact-row" href="contact.html?contact=${contact.id}">
      <span class="avatar">${initials(contact.full_name)}</span>
      <div class="contact-row-body">
        <div class="contact-row-name">${escapeHtml(contact.full_name)}</div>
        <div class="contact-row-meta">${escapeHtml(contact.phone)} · ${escapeHtml(contact.email)}</div>
        <div class="contact-row-address">${escapeHtml(contact.address)}</div>
      </div>
      ${contactSalesRepPickerHtml(contact)}
      <span class="contact-row-jobcount">${jobCount} job${jobCount === 1 ? "" : "s"}</span>
      ${chevronIcon()}
    </a>
  `;
}

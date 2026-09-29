// Contacts directory: a browsable, filterable, sortable list of every
// contact on file. Search lives globally in the shared topbar (js/search.js),
// not on this page.
const contactsState = { repFilter: "all", sort: "name" };

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("contacts-rep-filter-group").hidden = !getFeatures().salesRepTracking;
  populateRepFilter();
  document.getElementById("contacts-sort").addEventListener("change", e => {
    contactsState.sort = e.target.value;
    renderContactsList();
  });
  renderContactsList();
});

function populateRepFilter() {
  const select = document.getElementById("contacts-rep-filter");
  select.innerHTML = `<option value="all">All Reps</option>` +
    SALES_REPS.map(rep => `<option value="${escapeHtml(rep)}">${escapeHtml(rep)}</option>`).join("");
  select.value = contactsState.repFilter;
  select.addEventListener("change", () => {
    contactsState.repFilter = select.value;
    renderContactsList();
  });
}

// "Recently active" needs one timestamp per contact to sort by — the
// latest of any job's open date, call, message, or drafted follow-up
// across all of that contact's jobs. Job dates are plain "YYYY-MM-DD" and
// everything else is a full ISO timestamp; string comparison still orders
// them correctly since a date is always a prefix of same-day timestamps.
function lastActivityForContact(contact) {
  let latest = "";
  getJobsForContact(contact.id).forEach(job => {
    [
      job.date,
      getCallForJob(job.id) && getCallForJob(job.id).timestamp,
      getFollowUpForJob(job.id) && getFollowUpForJob(job.id).created_at,
      ...getMessagesForJob(job.id).map(m => m.timestamp),
    ].forEach(ts => {
      if (ts && ts > latest) latest = ts;
    });
  });
  return latest;
}

// Last name = everything after the final space in the full name — handles
// "Marta Alvarez" -> "Alvarez" the same way it'd handle a middle name or
// suffix, since only the last space-separated word counts.
function lastName(fullName) {
  const idx = fullName.lastIndexOf(" ");
  return idx === -1 ? fullName : fullName.slice(idx + 1);
}

function filteredSortedContacts() {
  let contacts = [...CONTACTS];
  if (contactsState.repFilter !== "all") {
    contacts = contacts.filter(c => c.sales_rep === contactsState.repFilter);
  }
  if (contactsState.sort === "recent") {
    contacts.sort((a, b) => lastActivityForContact(b).localeCompare(lastActivityForContact(a)));
  } else {
    contacts.sort((a, b) => lastName(a.full_name).localeCompare(lastName(b.full_name)));
  }
  return contacts;
}

function renderContactsList() {
  const contacts = filteredSortedContacts();

  document.getElementById("contacts-subtitle").textContent =
    `${contacts.length} contact${contacts.length === 1 ? "" : "s"} on file`;

  const list = document.getElementById("contacts-list");
  if (contacts.length === 0) {
    list.innerHTML = `<div class="empty-note">No contacts match this filter.</div>`;
  } else {
    list.innerHTML = contacts.map(renderContactRow).join("");
  }
  renderAzRail(contacts);
}

// Call/Text -> phone, Email -> email — one line instead of both stacked.
function preferredContactValue(contact) {
  return contact.preferred_contact === "Email" ? contact.email : contact.phone;
}

// Addresses are consistently "street, city, state" — everything after the
// first comma is the city/state part the list line wants; the full street
// address stays on the contact's own profile page only.
function cityState(address) {
  const idx = address.indexOf(",");
  return idx === -1 ? address : address.slice(idx + 1).trim();
}

function renderContactRow(contact) {
  const jobCount = getJobsForContact(contact.id).length;
  const letter = lastName(contact.full_name).charAt(0).toUpperCase();
  return `
    <a class="contact-row" href="contact.html?contact=${contact.id}" data-name-letter="${letter}">
      <span class="avatar">${initials(contact.full_name)}</span>
      <div class="contact-row-body">
        <div class="contact-row-name">${escapeHtml(contact.full_name)}</div>
        <div class="contact-row-meta">${escapeHtml(preferredContactValue(contact))} · ${escapeHtml(cityState(contact.address))}</div>
      </div>
      ${getFeatures().salesRepTracking ? `<span class="badge ${salesRepBadgeClass(contact.sales_rep)}" title="Sales Rep">${escapeHtml(contact.sales_rep)}</span>` : ""}
      <span class="contact-row-jobcount">${jobCount} job${jobCount === 1 ? "" : "s"}</span>
      ${chevronIcon()}
    </a>
  `;
}

// Every letter always renders (so the rail's shape never shifts as the
// list grows past today's 8 contacts) — letters with no match in the
// *currently filtered* list are just disabled, not hidden. Keyed by last
// name, matching the default sort and each row's data-name-letter.
function renderAzRail(contacts) {
  const present = new Set(contacts.map(c => lastName(c.full_name).charAt(0).toUpperCase()));
  const rail = document.getElementById("az-rail");
  rail.innerHTML = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(letter => `
    <button type="button" class="az-rail-letter" data-letter="${letter}" ${present.has(letter) ? "" : "disabled"}>${letter}</button>
  `).join("");

  rail.querySelectorAll(".az-rail-letter:not(:disabled)").forEach(btn => {
    btn.addEventListener("click", () => {
      const row = document.querySelector(`.contact-row[data-name-letter="${btn.getAttribute("data-letter")}"]`);
      if (row) row.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

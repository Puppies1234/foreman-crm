// Wires the one global search input that lives in the shared topbar markup
// on every page (#global-search-input / #global-search-results). Typing
// live-filters via searchDirectory() (js/data.js) and shows a dropdown
// grouped into "Jobs" then "Contacts" right under the input; clicking a
// result opens that job or that contact's profile.
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("global-search-input");
  const resultsEl = document.getElementById("global-search-results");
  const clearBtn = document.getElementById("global-search-clear");
  if (!input || !resultsEl) return;

  const MAX_PER_SECTION = 4;

  function renderDropdown(rawQuery) {
    const q = rawQuery.trim().toLowerCase();
    if (clearBtn) clearBtn.classList.toggle("visible", rawQuery.length > 0);

    if (!q) {
      resultsEl.hidden = true;
      resultsEl.innerHTML = "";
      return;
    }

    const matches = searchDirectory(rawQuery);
    const jobResults = matches.filter(m => m.job);
    const contactResults = matches.filter(m => !m.job);

    resultsEl.hidden = false;

    if (jobResults.length === 0 && contactResults.length === 0) {
      resultsEl.innerHTML = `<div class="topbar-search-empty">No results for "${escapeHtml(rawQuery.trim())}"</div>`;
      return;
    }

    resultsEl.innerHTML =
      renderSection("Jobs", jobResults, renderJobRow, q) +
      renderSection("Contacts", contactResults, renderContactRow, q);
  }

  function renderSection(label, items, rowFn, q) {
    if (items.length === 0) return "";
    const shown = items.slice(0, MAX_PER_SECTION).map(item => rowFn(item, q)).join("");
    // No page enumerates every job/contact by itself yet, so "View all"
    // sends the owner to the one directory the app has — Contacts.
    const viewAll = items.length > MAX_PER_SECTION
      ? `<a class="result-viewall" href="contacts.html">View all →</a>` : "";
    return `<div class="result-section"><div class="result-section-label">${label}</div>${shown}${viewAll}</div>`;
  }

  function clearSearch() {
    input.value = "";
    if (clearBtn) clearBtn.classList.remove("visible");
    resultsEl.hidden = true;
    resultsEl.innerHTML = "";
  }

  input.addEventListener("input", () => renderDropdown(input.value));

  input.addEventListener("focus", () => {
    if (input.value.trim()) renderDropdown(input.value);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      clearSearch();
      input.blur();
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      clearSearch();
      input.focus();
    });
  }

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".topbar-search")) resultsEl.hidden = true;
  });
});

const JOB_RESULT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="4" width="12" height="16" rx="2"/><path d="M9 9h6M9 13h6M9 17h4"/></svg>`;

function renderJobRow({ contact, job }, q) {
  return `
    <a class="result-row" href="contact.html?job=${job.id}">
      <span class="result-icon-box">${JOB_RESULT_ICON}</span>
      <div class="result-row-body">
        <div class="result-row-title">${highlightMatch(`Job #${job.job_number} — ${job.service_type}`, q)}</div>
        <div class="result-row-meta">${escapeHtml(job.status)} · ${escapeHtml(contact.address)}</div>
      </div>
      ${chevronIcon()}
    </a>
  `;
}

function renderContactRow({ contact }, q) {
  return `
    <a class="result-row" href="contact.html?contact=${contact.id}">
      <span class="avatar avatar-sm">${initials(contact.full_name)}</span>
      <div class="result-row-body">
        <div class="result-row-title">${highlightMatch(contact.full_name, q)}</div>
        <div class="result-row-meta">${highlightMatch(contact.phone, q)} · ${highlightMatch(contact.email, q)}</div>
      </div>
      ${chevronIcon()}
    </a>
  `;
}

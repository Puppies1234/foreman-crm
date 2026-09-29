document.addEventListener("DOMContentLoaded", () => {
  renderTodayStrip();
  applyDashboardWidgetVisibility();
  renderQuickActions();
  renderStats();
  renderRecentlyViewed();
  renderSchedule();
  renderActivityFeed();
});

// Settings → Features → Dashboard Widgets. Hides each widget's whole
// container up front — the individual render*() functions below still run
// unconditionally (cheap, and keeps them simple), they just write into a
// container nobody sees. The two-col row is special-cased so hiding one or
// both of its two cards doesn't leave a lopsided gap.
function applyDashboardWidgetVisibility() {
  const w = getFeatures().dashboardWidgets;
  document.getElementById("quick-actions").hidden = !w.quickActions;
  document.getElementById("stats-row").hidden = !w.statCards;
  document.getElementById("widget-recently-viewed").hidden = !w.recentlyViewed;
  document.getElementById("widget-schedule").hidden = !w.todaysSchedule;
  document.getElementById("widget-activity-feed").hidden = !w.aiActivityFeed;

  const twoCol = document.getElementById("dashboard-two-col");
  if (!w.todaysSchedule && !w.aiActivityFeed) {
    twoCol.hidden = true;
  } else {
    twoCol.hidden = false;
    twoCol.style.gridTemplateColumns = (w.todaysSchedule && w.aiActivityFeed) ? "" : "1fr";
  }
}

// Stroke icons, drawn in currentColor so each one inherits the ink of
// whatever pine/gold surface it sits on.
const ICONS = {
  leads: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  approve: '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3a8.5 8.5 0 0 1 8.5 8.5z"/><path d="M9 11.5l2.2 2.2L15.5 9.5"/>',
  alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 16.5h.01"/>',
  plus: '<circle cx="12" cy="12" r="9.5"/><path d="M12 8v8M8 12h8"/>',
  contacts: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  estimate: '<path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path d="M14 2v5h5M9 13h6M9 17h6M9 9h2"/>',
  photo: '<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><circle cx="8.5" cy="10" r="1.75"/><path d="M21.5 16.5l-5.5-5-9 8"/>',
  followup: '<path d="M21 11.5a8.5 8.5 0 0 1-12.44 7.54L3 21l1.97-5.4a8.5 8.5 0 1 1 16.03-4.1z"/>',
};

function icon(name, cls) {
  return `<svg class="${cls || ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"` +
         ` stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

function placeholderAction(label) {
  // This string becomes both an HTML attribute (onclick="...") and a JS
  // string literal (alert('...')) at once — stripping quotes/brackets from
  // the brand name here (only for this one inline string) sidesteps having
  // to double-escape for both contexts at once.
  const safeBrand = getBrand().name.replace(/['"<>\\]/g, "");
  return `alert('${label} isn\\u2019t wired up yet in this preview \\u2014 it will connect once ${safeBrand}\\u2019s live tools are in place.')`;
}

function renderTodayStrip() {
  const todaysAppts = APPOINTMENTS.filter(a => a.start_time.startsWith(TODAY));
  const confirmed = todaysAppts.filter(a => a.status === "Confirmed").length;
  const pending = todaysAppts.length - confirmed;

  const pill = document.getElementById("today-pill");
  if (todaysAppts.length === 0) {
    pill.className = "today-pill";
    pill.innerHTML = `<span class="today-pill-dot"></span>Nothing scheduled today`;
  } else if (pending === 0) {
    pill.className = "today-pill";
    pill.innerHTML = `<span class="today-pill-dot"></span>${todaysAppts.length} appointment${todaysAppts.length > 1 ? "s" : ""} · All confirmed`;
  } else {
    pill.className = "today-pill attention";
    pill.innerHTML = `<span class="today-pill-dot"></span>${todaysAppts.length} appointment${todaysAppts.length > 1 ? "s" : ""} · ${pending} pending confirmation`;
  }
}

function renderQuickActions() {
  const actions = [
    // Jobs are created from within an existing contact, not standalone from
    // the Dashboard — this is the contact-creation entry point instead, same
    // honest-placeholder pattern as Estimates/Photos/Follow-Ups below since
    // there's no contact-creation form wired up yet either.
    { label: "New Contact", iconName: "plus", primary: true, onclick: placeholderAction("Adding a new contact") },
    { label: "Contacts", iconName: "contacts", href: "contact.html?contact=c1" },
    { label: "Calendar", iconName: "calendar", href: "calendar.html" },
    { label: "Estimates", iconName: "estimate", onclick: placeholderAction("Estimates") },
    { label: "Photos", iconName: "photo", onclick: placeholderAction("Photos") },
    { label: "Follow-Ups", iconName: "followup", onclick: placeholderAction("The follow-ups list") },
  ];

  document.getElementById("quick-actions").innerHTML = actions.map(a => {
    const cls = `quick-action ${a.primary ? "primary" : ""}`;
    const inner = `<span class="quick-action-icon">${icon(a.iconName)}</span><span>${a.label}</span>`;
    return a.href
      ? `<a class="${cls}" href="${a.href}">${inner}</a>`
      : `<button type="button" class="${cls}" onclick="${a.onclick}">${inner}</button>`;
  }).join("");
}

// Each card is a live count of that review list's unchecked items
// (js/data.js's reviewRemainingCount) and links to the shared drill-down
// page — checking items off there is what brings these numbers down.
function renderStats() {
  const stats = [
    { type: "leads", iconName: "leads", tone: "pine" },
    { type: "appointments", iconName: "calendar", tone: "pine" },
    { type: "followups", iconName: "approve", tone: "gold" },
    { type: "priority", iconName: "alert", tone: "rust" },
  ];

  const row = document.getElementById("stats-row");
  row.innerHTML = stats.map(s => {
    const label = REVIEW_LISTS[s.type].title;
    const value = reviewRemainingCount(s.type);
    return `
      <a class="stat-card" href="review.html?type=${s.type}">
        <div class="stat-icon ${s.tone !== "pine" ? s.tone : ""}">${icon(s.iconName)}</div>
        <div class="stat-card-body">
          <div class="stat-value ${s.tone === "rust" ? "rust" : ""}">${value}</div>
          <div class="stat-label">${label}</div>
        </div>
      </a>
    `;
  }).join("");
}

function renderRecentlyViewed() {
  // Real visit history now (js/data.js's recordRecentlyViewed(), written
  // to from every contact.html load) — not mock/proxy data.
  const jobs = getRecentlyViewedJobs();
  const el = document.getElementById("recent-scroll");

  if (jobs.length === 0) {
    el.innerHTML = `<div class="empty-note">Nothing viewed yet.</div>`;
    return;
  }

  el.innerHTML = jobs.map(job => {
    const contact = getContact(job.contact_id);
    return `
      <a class="recent-card" href="contact.html?job=${job.id}">
        <div class="recent-card-band" style="background-image: var(--gloss-soft), var(--status-${statusSlug(job.status)}-grad, var(--pine-grad));"></div>
        <div class="recent-card-body">
          <div class="recent-card-name">${contact.full_name}</div>
          <div class="recent-card-badges">
            <span class="badge ${jobTypeBadgeClass()}">${job.job_type}</span>
            <span class="badge ${appointmentTypeBadgeClass()}">${job.appointment_type}</span>
            <span class="badge ${statusBadgeClass(job.status)}">${job.status}</span>
          </div>
          <div class="recent-card-address">${job.job_location}</div>
        </div>
        ${chevronIcon()}
      </a>
    `;
  }).join("");
}

function renderSchedule() {
  const todaysAppts = APPOINTMENTS
    .filter(a => a.start_time.startsWith(TODAY))
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const list = document.getElementById("schedule-list");

  if (todaysAppts.length === 0) {
    list.innerHTML = `<div class="empty-note">Nothing on the books for today.</div>`;
    return;
  }

  list.innerHTML = todaysAppts.map(appt => {
    const job = getJob(appt.job_id);
    const contact = getContact(job.contact_id);
    // Same shared store review.html?type=appointments reads/writes — this
    // is the one place "completed" for a given job's appointment lives.
    const completed = isChecked(REVIEW_LISTS.appointments.storageKey, job.id);
    return `
      <a class="schedule-item ${completed ? "completed" : ""}" href="contact.html?job=${job.id}">
        <input type="checkbox" class="review-checkbox schedule-checkbox" data-job-id="${job.id}" ${completed ? "checked" : ""} aria-label="Mark appointment completed">
        <span class="row-dot" style="background-image: var(--gloss), var(--tech-${techSlug(job.assigned_to)}-grad, var(--pine-grad));"></span>
        <div class="schedule-time">${formatTime(appt.start_time)}</div>
        <div class="schedule-details">
          <div class="schedule-title">${job.service_type}</div>
          <div class="schedule-meta">${contact.full_name} · ${job.assigned_to} · ${appt.status}</div>
        </div>
        <span class="badge ${jobTypeBadgeClass()}">${job.job_type}</span>
        <span class="badge ${appointmentTypeBadgeClass()}">${job.appointment_type}</span>
        <span class="badge ${statusBadgeClass(job.status)}">${job.status}</span>
        ${chevronIcon()}
      </a>
    `;
  }).join("");

  // Unlike review.html, a checked row stays put (struck through) — this is
  // a schedule, not a to-do inbox. The anchor wraps the whole row, so the
  // checkbox needs preventDefault (not just stopPropagation) to keep a
  // click on it from also following the row's own link.
  list.querySelectorAll(".schedule-checkbox").forEach(checkbox => {
    checkbox.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
    });
    checkbox.addEventListener("change", () => {
      setChecked(REVIEW_LISTS.appointments.storageKey, checkbox.getAttribute("data-job-id"), checkbox.checked);
      renderSchedule();
      renderStats();
    });
  });
}

function renderActivityFeed() {
  const sorted = [...ACTIVITY_LOG]
    .filter(item => !isActivityItemHandled(item))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const feed = document.getElementById("activity-feed");

  if (sorted.length === 0) {
    feed.innerHTML = `<div class="empty-note">All caught up.</div>`;
    return;
  }

  feed.innerHTML = sorted.map(item => {
    const job = item.related_job_id ? getJob(item.related_job_id) : null;
    const contact = job ? getContact(job.contact_id) : null;
    return `
      <div class="activity-item ${item.requires_review ? "needs-review" : ""}">
        <input type="checkbox" class="review-checkbox activity-checkbox" data-log-id="${item.id}" aria-label="Mark handled">
        <div class="activity-dot"></div>
        <div class="activity-body">
          <div class="activity-type">${item.type}${job ? ` · <a href="contact.html?job=${job.id}">${contact.full_name}</a>` : ""}</div>
          <div class="activity-desc">${item.description}</div>
          <div class="activity-time">
            ${formatDateTime(item.timestamp)}
            ${item.requires_review && job ? `<a class="review-flag" href="contact.html?job=${job.id}">&nbsp;· Needs your review</a>` : ""}
          </div>
        </div>
      </div>
    `;
  }).join("");

  // Checking marks it handled (via the shared review-list store when one
  // applies, otherwise the feed's own dismissed flag) and drops it from
  // the feed on re-render — either way is "checked", one shared idea.
  feed.querySelectorAll(".activity-checkbox").forEach(checkbox => {
    checkbox.addEventListener("change", () => {
      const item = ACTIVITY_LOG.find(i => i.id === checkbox.getAttribute("data-log-id"));
      setActivityItemHandled(item, checkbox.checked);
      renderActivityFeed();
      renderStats();
    });
  });
}

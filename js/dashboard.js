document.addEventListener("DOMContentLoaded", () => {
  renderStats();
  renderSchedule();
  renderActivityFeed();
});

function renderStats() {
  const todaysAppts = APPOINTMENTS.filter(a => a.start_time.startsWith(TODAY));
  const newLeads = JOBS.filter(j => j.status === "New Lead").length;
  const pendingApproval = FOLLOW_UPS.filter(f => f.status === "drafted").length;
  const quotedValue = JOBS
    .filter(j => j.status === "Quoted" || j.status === "Scheduled")
    .reduce((sum, j) => sum + (j.quote_amount || 0), 0);

  const stats = [
    { value: newLeads, label: "New leads this week" },
    { value: todaysAppts.length, label: "Appointments today" },
    { value: pendingApproval, label: "Follow-ups awaiting your approval" },
    { value: formatMoney(quotedValue), label: "Quoted value in pipeline" },
  ];

  const row = document.getElementById("stats-row");
  row.innerHTML = stats.map(s => `
    <div class="stat-card">
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
    </div>
  `).join("");
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
    return `
      <div class="schedule-item">
        <div class="schedule-time">${formatTime(appt.start_time)}</div>
        <div class="schedule-details">
          <div class="schedule-title">
            <a href="contact.html?job=${job.id}">${job.service_type}</a>
          </div>
          <div class="schedule-meta">${contact.full_name} · ${appt.assigned_tech} · ${appt.status}</div>
        </div>
        <span class="badge ${statusBadgeClass(job.status)}">${job.status}</span>
      </div>
    `;
  }).join("");
}

function renderActivityFeed() {
  const sorted = [...ACTIVITY_LOG].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const feed = document.getElementById("activity-feed");

  feed.innerHTML = sorted.map(item => {
    const job = item.related_job_id ? getJob(item.related_job_id) : null;
    const contact = job ? getContact(job.contact_id) : null;
    return `
      <div class="activity-item ${item.requires_review ? "needs-review" : ""}">
        <div class="activity-dot"></div>
        <div class="activity-body">
          <div class="activity-type">${item.type}${job ? ` · <a href="contact.html?job=${job.id}">${contact.full_name}</a>` : ""}</div>
          <div class="activity-desc">${item.description}</div>
          <div class="activity-time">
            ${formatDateTime(item.timestamp)}
            ${item.requires_review ? `<span class="review-flag">&nbsp;· Needs your review</span>` : ""}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  renderLegend();
  renderWeek();
  renderUnscheduled();
});

function techSlug(name) {
  return name.split(" ")[0].toLowerCase();
}

function getWeekdays() {
  const today = new Date(TODAY + "T00:00");
  const day = today.getDay(); // 0 = Sun ... 5 = Fri
  const monday = new Date(today);
  const diffToMonday = day === 0 ? -6 : 1 - day;
  monday.setDate(today.getDate() + diffToMonday);

  const days = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function renderLegend() {
  const techs = [
    { name: "Ray Dunmore", slug: "ray" },
    { name: "Kim Osei", slug: "kim" },
    { name: "Nia Brackett", slug: "nia" },
  ];
  document.getElementById("tech-legend").innerHTML = techs.map(t => `
    <div class="tech-legend-item">
      <span class="tech-dot tech-${t.slug}"></span>
      ${t.name}
    </div>
  `).join("");
}

function renderWeek() {
  const days = getWeekdays();
  const grid = document.getElementById("week-grid");

  grid.innerHTML = days.map(d => {
    const dateStr = isoDate(d);
    const isToday = dateStr === TODAY;
    const dayAppts = APPOINTMENTS
      .filter(a => a.start_time.startsWith(dateStr))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    const apptsHtml = dayAppts.length
      ? dayAppts.map(appt => {
          const job = getJob(appt.job_id);
          const contact = getContact(job.contact_id);
          return `
            <a href="contact.html?job=${job.id}" style="display:block;">
              <div class="appt-card tech-${techSlug(appt.assigned_tech)}">
                <div class="appt-time">${formatTime(appt.start_time)} – ${formatTime(appt.end_time)}</div>
                <div class="appt-title">${job.service_type}</div>
                <div class="appt-tech">${contact.full_name} · ${appt.assigned_tech}</div>
              </div>
            </a>
          `;
        }).join("")
      : `<div class="empty-note">No appointments</div>`;

    return `
      <div class="day-column">
        <div class="day-column-header ${isToday ? "today" : ""}">
          ${d.toLocaleDateString("en-US", { weekday: "long" })}
          <span class="day-date">${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}${isToday ? " · Today" : ""}</span>
        </div>
        ${apptsHtml}
      </div>
    `;
  }).join("");
}

function renderUnscheduled() {
  const scheduledJobIds = new Set(APPOINTMENTS.map(a => a.job_id));
  const unscheduled = JOBS.filter(j => !scheduledJobIds.has(j.id));
  const el = document.getElementById("unscheduled-list");

  if (unscheduled.length === 0) {
    el.innerHTML = `<div class="empty-note">Every open job has an appointment.</div>`;
    return;
  }

  el.innerHTML = unscheduled.map(job => {
    const contact = getContact(job.contact_id);
    return `
      <a href="contact.html?job=${job.id}" style="display:block;">
        <div class="unscheduled-item">
          <div class="unscheduled-title">${job.service_type}</div>
          <div class="unscheduled-meta">${contact.full_name} · ${job.category}</div>
          <span class="badge ${statusBadgeClass(job.status)}">${job.status}</span>
        </div>
      </a>
    `;
  }).join("");
}

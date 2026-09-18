const HOUR_START = 7;   // 7 AM
const HOUR_END = 18;    // 6 PM
const HOUR_HEIGHT = 64;  // px per hour

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
  const day = today.getDay(); // 0 = Sun ... 6 = Sat
  const monday = new Date(today);
  const diffToMonday = day === 0 ? -6 : 1 - day;
  monday.setDate(today.getDate() + diffToMonday);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function hourDecimal(iso) {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60;
}

function formatHourLabel(hour) {
  const period = hour >= 12 ? "PM" : "AM";
  let h12 = hour % 12;
  if (h12 === 0) h12 = 12;
  return `${h12} ${period}`;
}

function formatTimeCompact(d) {
  const h12 = d.getHours() % 12 === 0 ? 12 : d.getHours() % 12;
  const m = d.getMinutes();
  return m === 0 ? `${h12}` : `${h12}:${String(m).padStart(2, "0")}`;
}

function formatApptTimeRange(startIso, endIso) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const samePeriod = (start.getHours() < 12) === (end.getHours() < 12);
  if (samePeriod) {
    return `${formatTimeCompact(start)}–${formatTime(endIso)}`;
  }
  return `${formatTime(startIso)} – ${formatTime(endIso)}`;
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

function renderHourMarks() {
  let html = "";
  for (let h = HOUR_START; h <= HOUR_END; h++) {
    const top = (h - HOUR_START) * HOUR_HEIGHT;
    html += `
      <div class="hour-mark" style="top:${top}px;">
        <span class="hour-label">${formatHourLabel(h)}</span>
        <span class="hour-line"></span>
      </div>
    `;
  }
  return html;
}

function renderWeek() {
  const days = getWeekdays();
  const grid = document.getElementById("week-grid");
  const gridHeight = (HOUR_END - HOUR_START) * HOUR_HEIGHT;

  grid.innerHTML = days.map(d => {
    const dateStr = isoDate(d);
    const isToday = dateStr === TODAY;
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const dayAppts = APPOINTMENTS
      .filter(a => a.start_time.startsWith(dateStr))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    const apptsHtml = dayAppts.map(appt => {
      const job = getJob(appt.job_id);
      const contact = getContact(job.contact_id);
      const top = (hourDecimal(appt.start_time) - HOUR_START) * HOUR_HEIGHT;
      const height = (hourDecimal(appt.end_time) - hourDecimal(appt.start_time)) * HOUR_HEIGHT;
      return `
        <a href="contact.html?job=${job.id}" class="appt-block tech-${techSlug(appt.assigned_tech)}" style="top:${top}px; height:${height}px;" title="${contact.full_name} · ${appt.assigned_tech}">
          <div class="appt-time">${formatApptTimeRange(appt.start_time, appt.end_time)}</div>
          <div class="appt-title">${job.service_type}</div>
        </a>
      `;
    }).join("");

    const emptyHtml = dayAppts.length === 0 ? `<div class="empty-note day-empty-note">No appointments</div>` : "";

    return `
      <div class="day-column ${isWeekend ? "weekend" : ""}">
        <div class="day-column-header ${isToday ? "today" : ""}">
          ${d.toLocaleDateString("en-US", { weekday: "long" })}
          <span class="day-date">${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}${isToday ? " · Today" : ""}</span>
        </div>
        <div class="day-time-grid" style="height:${gridHeight}px;">
          ${renderHourMarks()}
          ${emptyHtml}
          ${apptsHtml}
        </div>
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

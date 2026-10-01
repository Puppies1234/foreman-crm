const HOUR_START = 7;   // 7 AM
const HOUR_END = 18;    // 6 PM
const HOUR_HEIGHT_WEEK = 80; // px per hour, week view
const HOUR_HEIGHT_DAY = 96;  // px per hour, day view

const state = {
  view: "week",
  refDate: new Date(TODAY + "T00:00"),
};

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".view-toggle-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      state.view = btn.dataset.view;
      render();
    });
  });
  document.getElementById("nav-prev").addEventListener("click", () => navigate(-1));
  document.getElementById("nav-next").addEventListener("click", () => navigate(1));
  document.getElementById("nav-today").addEventListener("click", () => navigate(0));

  renderLegend();
  renderUnscheduled();
  render();
});

function navigate(direction) {
  if (direction === 0) {
    state.refDate = new Date(TODAY + "T00:00");
    render();
    return;
  }
  const d = new Date(state.refDate);
  if (state.view === "day") d.setDate(d.getDate() + direction);
  else if (state.view === "week") d.setDate(d.getDate() + direction * 7);
  else if (state.view === "month") d.setMonth(d.getMonth() + direction);
  state.refDate = d;
  render();
}

function render() {
  document.querySelectorAll(".view-toggle-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.view === state.view);
  });
  document.getElementById("period-label").textContent = periodLabel();

  const container = document.getElementById("calendar-view");
  if (state.view === "day") renderDayView(container);
  else if (state.view === "month") renderMonthView(container);
  else renderWeekView(container);
}

function periodLabel() {
  if (state.view === "day") {
    return state.refDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) +
      (isoDate(state.refDate) === TODAY ? " · Today" : "");
  }
  if (state.view === "month") {
    return state.refDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  const days = getWeekdays(state.refDate);
  const start = days[0], end = days[6];
  const startStr = start.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const endStr = start.getMonth() === end.getMonth()
    ? end.toLocaleDateString("en-US", { day: "numeric" })
    : end.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  return `Week of ${startStr} – ${endStr}`;
}

/* --- Shared helpers --- */
// techSlug/statusSlug/chevronIcon now live in js/data.js, shared with
// dashboard.js and contact.js.

function getWeekdays(refDate) {
  const day = refDate.getDay(); // 0 = Sun ... 6 = Sat
  const monday = new Date(refDate);
  const diffToMonday = day === 0 ? -6 : 1 - day;
  monday.setDate(refDate.getDate() + diffToMonday);

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

function fullTimeRange(startIso, endIso) {
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

function renderHourMarks(hourHeight) {
  let html = "";
  for (let h = HOUR_START; h <= HOUR_END; h++) {
    const top = (h - HOUR_START) * hourHeight;
    html += `
      <div class="hour-mark" style="top:${top}px;">
        <span class="hour-label">${formatHourLabel(h)}</span>
        <span class="hour-line"></span>
      </div>
    `;
  }
  return html;
}

function renderDayColumn(dateObj, { big = false } = {}) {
  const hourHeight = big ? HOUR_HEIGHT_DAY : HOUR_HEIGHT_WEEK;
  const dateStr = isoDate(dateObj);
  const isToday = dateStr === TODAY;
  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
  const gridHeight = (HOUR_END - HOUR_START) * hourHeight;

  const dayAppts = APPOINTMENTS
    .filter(a => a.start_time.startsWith(dateStr))
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const apptsHtml = dayAppts.map(appt => {
    const job = getJob(appt.job_id);
    const contact = getContact(job.contact_id);
    const top = (hourDecimal(appt.start_time) - HOUR_START) * hourHeight;
    const height = (hourDecimal(appt.end_time) - hourDecimal(appt.start_time)) * hourHeight;
    return `
      <a href="contact.html?job=${job.id}" class="appt-block ${big ? "big" : ""} tech-${techSlug(job.assigned_to)}" style="top:${top}px; height:${height}px;">
        <div class="appt-time">${fullTimeRange(appt.start_time, appt.end_time)}</div>
        <div class="appt-title">${job.service_type}</div>
        <div class="appt-customer">${contact.full_name}</div>
        <div class="appt-badges">
          <span class="badge ${jobTypeBadgeClass(job.job_type)}">${escapeHtml(job.job_type)}</span>
          <span class="badge ${appointmentTypeBadgeClass(job.appointment_type)}">${escapeHtml(job.appointment_type)}</span>
        </div>
      </a>
    `;
  }).join("");

  const emptyHtml = dayAppts.length === 0 ? `<div class="empty-note day-empty-note">No appointments</div>` : "";

  return `
    <div class="day-column ${isWeekend ? "weekend" : ""} ${big ? "big" : ""}">
      <div class="day-column-header ${isToday ? "today" : ""}">
        ${dateObj.toLocaleDateString("en-US", { weekday: "long" })}
        <span class="day-date">${dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}${isToday ? " · Today" : ""}</span>
      </div>
      <div class="day-time-grid" style="height:${gridHeight}px;">
        ${renderHourMarks(hourHeight)}
        ${emptyHtml}
        ${apptsHtml}
      </div>
    </div>
  `;
}

/* --- Views --- */

function renderWeekView(container) {
  const days = getWeekdays(state.refDate);
  container.innerHTML = `
    <div class="week-scroll">
      <div class="week-grid">
        ${days.map(d => renderDayColumn(d, { big: false })).join("")}
      </div>
    </div>
  `;
}

function renderDayView(container) {
  container.innerHTML = `
    <div class="day-view">
      ${renderDayColumn(state.refDate, { big: true })}
    </div>
  `;
}

function renderMonthView(container) {
  const year = state.refDate.getFullYear();
  const month = state.refDate.getMonth();
  const first = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const firstWeekday = first.getDay(); // 0 = Sun
  const startOffset = firstWeekday === 0 ? 6 : firstWeekday - 1; // days before the 1st to reach Monday

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const dowRow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    .map(n => `<div class="month-dow">${n}</div>`).join("");

  const cellsHtml = cells.map(d => {
    if (!d) return `<div class="month-cell empty"></div>`;
    const dateStr = isoDate(d);
    const isToday = dateStr === TODAY;
    const count = APPOINTMENTS.filter(a => a.start_time.startsWith(dateStr)).length;
    return `
      <div class="month-cell ${isToday ? "today" : ""}" data-date="${dateStr}">
        <div class="month-cell-date">${d.getDate()}</div>
        ${count > 0 ? `<div class="month-count"><span class="month-dot"></span>${count} appt${count > 1 ? "s" : ""}</div>` : ""}
      </div>
    `;
  }).join("");

  container.innerHTML = `
    <div class="month-grid-wrap">
      <div class="month-dow-row">${dowRow}</div>
      <div class="month-grid">${cellsHtml}</div>
    </div>
  `;

  container.querySelectorAll(".month-cell[data-date]").forEach(cell => {
    cell.addEventListener("click", () => {
      state.refDate = new Date(cell.getAttribute("data-date") + "T00:00");
      state.view = "day";
      render();
    });
  });
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
          <div class="unscheduled-title">
            <span class="row-dot" style="background-image: var(--gloss), var(--status-${statusSlug(job.status)}-grad, var(--pine-grad));"></span>
            ${job.service_type}
          </div>
          <div class="unscheduled-meta">${contact.full_name} · ${escapeHtml(job.job_type)}</div>
          <span class="badge ${statusBadgeClass(job.status)}">${escapeHtml(job.status)}</span>
          ${chevronIcon()}
        </div>
      </a>
    `;
  }).join("");
}

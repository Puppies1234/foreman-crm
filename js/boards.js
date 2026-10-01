// Sales board: one column per pipeline stage (Settings → Pipeline & Labels), every job from the mock
// data placed by its current status. Dragging a card to another column
// writes through setJobStatus() (js/jobs-store.js) — the same store the job
// detail page's pipeline reads and writes — then the whole board re-renders
// from JOBS so the column counts and card positions stay in sync.
//
// The rep filter is on each job's own Sales Rep (js/data.js's SALES_REPS
// roster), not the technician (assigned_to) — a sales board filters by who
// owns the deal. It only narrows which cards *render* per column — it never
// touches JOBS or the status store, so dragging a card while filtered still
// updates that job's real status, same as an unfiltered drag.
const boardState = { repFilter: "all" };

whenAppReady(() => {
  document.getElementById("board-rep-filter-group").hidden = !getFeatures().salesRepTracking;
  populateRepFilter();
  renderBoard();
});

function populateRepFilter() {
  const select = document.getElementById("board-rep-filter");
  select.innerHTML = `<option value="all">All Reps</option>` +
    SALES_REPS.map(rep => `<option value="${escapeHtml(rep)}">${escapeHtml(rep)}</option>`).join("");
  select.value = boardState.repFilter;
  select.addEventListener("change", () => {
    boardState.repFilter = select.value;
    renderBoard();
  });
}

function renderBoard() {
  const container = document.getElementById("board-columns");
  // Enabled stages in order; a disabled stage still gets its column while
  // any job is sitting in it, so no card ever disappears from the board.
  const columns = getLabels("status")
    .filter(stage => stage.enabled || JOBS.some(job => job.status === stage.name))
    .map(stage => stage.name);
  container.innerHTML = columns.map(renderColumn).join("");
  wireDragAndDrop();
}

function jobsForColumn(status) {
  return JOBS.filter(job =>
    job.status === status &&
    (boardState.repFilter === "all" || job.sales_rep === boardState.repFilter)
  );
}

function renderColumn(status) {
  const jobs = jobsForColumn(status);
  return `
    <div class="board-column">
      <div class="board-column-header">
        <div class="board-column-name">${escapeHtml(status)}</div>
        <span class="board-column-count">${jobs.length}</span>
      </div>
      <div class="board-column-body" data-status="${escapeHtml(status)}">
        ${jobs.length > 0 ? jobs.map(renderCard).join("") : `<div class="empty-note">No jobs here.</div>`}
      </div>
    </div>
  `;
}

// Job Type, Appointment Type, Urgency and Sales Rep are all display-only
// tags here — plain badges, not the click-to-open-dropdown picker those
// same four fields use on the job detail page (contact.html). Boards is a
// read-only view of them; editing lives in exactly one place.
function renderCard(job) {
  const contact = getContact(job.contact_id);
  const slug = techSlug(job.assigned_to);
  const techLabel = job.assigned_to === "Unassigned" ? "—" : initials(job.assigned_to);
  return `
    <div class="board-card" draggable="true" data-job-id="${job.id}">
      <div class="board-card-top">
        <div class="board-card-title">Job #${job.job_number} — ${job.service_type}</div>
        <span class="avatar avatar-sm avatar-tech tech-${slug}" title="${job.assigned_to}">${techLabel}</span>
      </div>
      <div class="board-card-meta">${contact.full_name} · ${job.job_location}</div>
      <div class="board-card-badges">
        <span class="badge ${jobTypeBadgeClass(job.job_type)}">${escapeHtml(job.job_type)}</span>
        <span class="badge ${appointmentTypeBadgeClass(job.appointment_type)}">${escapeHtml(job.appointment_type)}</span>
        <span class="badge ${urgencyBadgeClass(job.urgency)}">${escapeHtml(job.urgency)}</span>
        ${getFeatures().salesRepTracking ? `<span class="badge ${salesRepBadgeClass(job.sales_rep)}">${job.sales_rep}</span>` : ""}
      </div>
    </div>
  `;
}

function wireDragAndDrop() {
  document.querySelectorAll(".board-card").forEach(card => {
    // Browsers don't normally fire click after a real drag, but the flag
    // (cleared a tick after dragend, not immediately) covers any that do —
    // so only a plain click/tap, never the click tail-end of a drag, opens
    // the job.
    let dragged = false;
    card.addEventListener("dragstart", e => {
      dragged = true;
      card.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", card.getAttribute("data-job-id"));
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      setTimeout(() => { dragged = false; }, 0);
    });
    card.addEventListener("click", () => {
      if (dragged) return;
      window.location.href = `contact.html?job=${card.getAttribute("data-job-id")}`;
    });

    // Tags are display-only here (Job Type/Appointment Type/Urgency/Sales
    // Rep are only ever editable on the job's own page) — a click on one
    // still shouldn't fall through and navigate like the rest of the card
    // does, so it does nothing at all rather than something unintended.
    card.querySelectorAll(".board-card-badges .badge").forEach(badge => {
      badge.addEventListener("click", e => e.stopPropagation());
    });
  });

  document.querySelectorAll(".board-column-body").forEach(body => {
    body.addEventListener("dragover", e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      body.classList.add("drag-over");
    });
    body.addEventListener("dragleave", () => body.classList.remove("drag-over"));
    body.addEventListener("drop", e => {
      e.preventDefault();
      body.classList.remove("drag-over");
      const jobId = e.dataTransfer.getData("text/plain");
      setJobStatus(jobId, body.getAttribute("data-status")).then(r => { if (r.error) renderBoard(); });
      renderBoard();
    });
  });
}

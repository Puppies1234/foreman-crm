// Sales board: one column per STATUS_PIPELINE step, every job from the mock
// data placed by its current status. Dragging a card to another column
// writes through setJobStatus() (js/data.js) — the same store the job
// detail page's pipeline reads and writes — then the whole board re-renders
// from JOBS so the column counts and card positions stay in sync.
//
// The rep filter is on each job's own Sales Rep (js/data.js's SALES_REPS
// roster), not the technician (assigned_to) — a sales board filters by who
// owns the deal. It only narrows which cards *render* per column — it never
// touches JOBS or the status store, so dragging a card while filtered still
// updates that job's real status, same as an unfiltered drag.
const boardState = { repFilter: "all" };

document.addEventListener("DOMContentLoaded", () => {
  populateRepFilter();
  renderBoard();
});

function populateRepFilter() {
  const select = document.getElementById("board-rep-filter");
  select.innerHTML = `<option value="all">All reps</option>` +
    SALES_REPS.map(rep => `<option value="${escapeHtml(rep)}">${escapeHtml(rep)}</option>`).join("");
  select.value = boardState.repFilter;
  select.addEventListener("change", () => {
    boardState.repFilter = select.value;
    renderBoard();
  });
}

function renderBoard() {
  const container = document.getElementById("board-columns");
  container.innerHTML = STATUS_PIPELINE.map(renderColumn).join("");
  wireDragAndDrop();
  wirePickers(container, renderBoard);
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
        <div class="board-column-name">${status}</div>
        <span class="board-column-count">${jobs.length}</span>
      </div>
      <div class="board-column-body" data-status="${status}">
        ${jobs.length > 0 ? jobs.map(renderCard).join("") : `<div class="empty-note">No jobs here.</div>`}
      </div>
    </div>
  `;
}

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
        ${urgencyPickerHtml(job)}
        ${salesRepPickerHtml(job)}
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
      setJobStatus(jobId, body.getAttribute("data-status"));
      renderBoard();
    });
  });
}

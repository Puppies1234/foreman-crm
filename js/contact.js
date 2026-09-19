// Two views share this one page:
//   ?contact=<id>  → profile view (contact info + a Jobs index, nothing more)
//   ?job=<id>      → job detail view (that job's own info + its own
//                     Messages / Calls & Transcripts / Documents / Photos)
// Every render function below is handed the specific job or contact it
// should draw from — none of them reach across to a different job's data.
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const jobId = params.get("job");
  const contactParam = params.get("contact");
  const job = jobId ? getJob(jobId) : null;

  if (job) {
    renderJobView(job);
  } else {
    const contact = (contactParam && getContact(contactParam)) || CONTACTS[0];
    renderProfileView(contact);
  }
});

const DOC_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path d="M14 2v5h5M9 13h6M9 17h6M9 9h2"/></svg>`;
const PHOTO_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="4.5" width="19" height="15" rx="2"/><circle cx="8.5" cy="10" r="1.75"/><path d="M21.5 16.5l-5.5-5-9 8"/></svg>`;

/* ============================== Profile view ============================= */

function renderProfileView(contact) {
  document.getElementById("job-view").hidden = true;
  document.getElementById("profile-view").hidden = false;

  const jobs = [...getJobsForContact(contact.id)].sort((a, b) => b.date.localeCompare(a.date));

  document.title = `${contact.full_name} — Foreman`;
  document.getElementById("profile-name").textContent = contact.full_name;
  document.getElementById("profile-subtitle").textContent =
    `${contact.address} · ${jobs.length} job${jobs.length === 1 ? "" : "s"} on file`;

  renderContactCard(contact, "profile-contact-body");
  renderJobsIndex(jobs);
}

// The Jobs index is deliberately thin — just enough to identify and open a
// job (number, service type, status, date). No messages, calls or
// transcripts belong here; that's all scoped to the job detail view below.
function renderJobsIndex(jobs) {
  const el = document.getElementById("profile-jobs-list");
  if (jobs.length === 0) {
    el.innerHTML = `<div class="empty-note">No jobs on file for this contact.</div>`;
    return;
  }
  el.innerHTML = jobs.map(job => `
    <a class="schedule-item" href="contact.html?job=${job.id}">
      <span class="row-dot" style="background-image: var(--gloss), var(--status-${statusSlug(job.status)}-grad, var(--pine-grad));"></span>
      <div class="schedule-details">
        <div class="schedule-title">Job #${job.job_number} — ${job.service_type}</div>
        <div class="schedule-meta">${formatDateOnly(job.date)}</div>
      </div>
      <span class="badge ${statusBadgeClass(job.status)}">${job.status}</span>
      ${chevronIcon()}
    </a>
  `).join("");
}

/* =============================== Job view ================================ */

function renderJobView(job) {
  document.getElementById("profile-view").hidden = true;
  document.getElementById("job-view").hidden = false;

  const contact = getContact(job.contact_id);
  const siblingJobs = getJobsForContact(contact.id);

  document.title = `${job.service_type} · ${contact.full_name} — Foreman`;

  const breadcrumb = document.getElementById("job-breadcrumb");
  breadcrumb.href = `contact.html?contact=${contact.id}`;
  breadcrumb.textContent = `← ${contact.full_name} · ${siblingJobs.length} job${siblingJobs.length === 1 ? "" : "s"}`;

  document.getElementById("job-title").textContent = job.service_type;
  document.getElementById("job-subtitle").textContent =
    `Job #${job.job_number} · ${job.category} · ${formatDateOnly(job.date)}`;

  renderContactCard(contact, "job-contact-body");
  renderJobInfoCard(job);
  renderJobTabs(job);
}

function renderJobInfoCard(job) {
  const pipelineEl = document.getElementById("pipeline");
  const currentIndex = STATUS_PIPELINE.indexOf(job.status);
  pipelineEl.innerHTML = STATUS_PIPELINE.map((step, i) => {
    let cls = "pipeline-step";
    if (i < currentIndex) cls += " done";
    if (i === currentIndex) cls += " current";
    return `<div class="${cls}">${step}</div>`;
  }).join("");

  const rows = [
    ["Category", job.category],
    ["Urgency", `<span class="badge ${urgencyBadgeClass(job.urgency)}">${job.urgency}</span>`],
    ["Assigned to", job.assigned_to],
    ["Quote amount", formatMoney(job.quote_amount)],
  ];
  document.getElementById("job-card-body").innerHTML = rows.map(([label, value]) => `
    <div class="info-row">
      <span class="info-label">${label}</span>
      <span class="info-value">${value}</span>
    </div>
  `).join("");

  document.getElementById("intake-notes").textContent = job.intake_notes;

  const appt = getAppointmentForJob(job.id);
  const apptEl = document.getElementById("appt-summary");
  if (appt) {
    apptEl.innerHTML = `${formatDateTime(appt.start_time)} – ${formatTime(appt.end_time)} with ${appt.assigned_tech} · <span class="badge ${appt.status === "Confirmed" ? "badge-scheduled" : "badge-qualified"}">${appt.status}</span>`;
  } else {
    apptEl.innerHTML = `<span class="empty-note">Not yet scheduled.</span>`;
  }
}

/* ------------------------------ Job tabs ---------------------------------
   All four panels are rendered fresh for the single `job` passed in, from
   its own id only — switching jobs re-runs this from scratch, so nothing
   from a previously viewed job can linger. */

function renderJobTabs(job) {
  const tabButtons = document.querySelectorAll("#job-tabs .tab-btn");
  const panels = document.querySelectorAll(".job-tab-panel");

  tabButtons.forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-tab") === "messages");
    btn.onclick = () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.getAttribute("data-tab");
      panels.forEach(p => { p.hidden = p.getAttribute("data-panel") !== target; });
    };
  });
  panels.forEach(p => { p.hidden = p.getAttribute("data-panel") !== "messages"; });

  renderMessagesPanel(job);
  renderCallsPanel(job);
  renderDocumentsPanel(job);
  renderPhotosPanel(job);
}

// Merges this job's actual SMS thread with its drafted/approved/sent
// follow-up (if any) into one chronological conversation.
function renderMessagesPanel(job) {
  const thread = getThreadForJob(job.id);
  const el = document.getElementById("panel-messages");

  if (thread.length === 0) {
    el.innerHTML = `<div class="empty-note">No messages yet for this job.</div>`;
    return;
  }

  el.innerHTML = `
    <div class="transcript">
      ${thread.map(item => {
        if (item.kind === "message") {
          const isAi = item.sender === "ai";
          return `
            <div class="transcript-line ${isAi ? "ai" : ""}">
              <div class="transcript-speaker">${isAi ? "Foreman" : "Contact"}</div>
              <div class="transcript-bubble">
                ${item.text}
                <div class="activity-time" style="margin-top:6px;">${formatDateTime(item.timestamp)}</div>
              </div>
            </div>
          `;
        }
        const statusLabel = { drafted: "Drafted", approved: "Approved", sent: "Sent" }[item.status];
        const statusClass = { drafted: "badge-qualified", approved: "badge-scheduled", sent: "badge-completed" }[item.status];
        return `
          <div class="transcript-line ai">
            <div class="transcript-speaker">Foreman</div>
            <div class="transcript-bubble">
              <div style="margin-bottom:8px;"><span class="badge ${statusClass}">${statusLabel} · ${item.channel}</span></div>
              ${item.content}
              ${item.status === "drafted" ? `
                <div class="btn-row" style="margin-top:12px;">
                  <button class="btn btn-primary" onclick="alert('This would approve and send the follow-up. Wire this up once live AI drafting is connected.')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12l5 5L20 6"/></svg>
                    Approve &amp; send
                  </button>
                  <button class="btn btn-secondary" onclick="alert('This would open the draft for editing.')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
                    Edit draft
                  </button>
                </div>
              ` : `<div class="activity-time" style="margin-top:6px;">${formatDateTime(item.timestamp)}</div>`}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderCallsPanel(job) {
  const call = getCallForJob(job.id);
  const el = document.getElementById("panel-calls");
  if (!call) {
    el.innerHTML = `<div class="empty-note">No calls logged for this job.</div>`;
    return;
  }
  el.innerHTML = `
    <div class="card-header" style="margin-bottom:12px;">
      <h2 style="font-size:1rem;">Call — ${formatDateTime(call.timestamp)}</h2>
      <span class="badge badge-scheduled">${call.duration}</span>
    </div>
    <div class="notes-block"><strong>Summary:</strong> ${call.summary}<br><strong>Outcome:</strong> ${call.outcome}</div>
    <div style="margin-top:16px;">
      <div class="card-eyebrow" style="margin-bottom:10px;">Transcript</div>
      <div class="transcript">
        ${call.transcript.map(line => `
          <div class="transcript-line ${line.speaker === "AI" ? "ai" : ""}">
            <div class="transcript-speaker">${line.speaker}</div>
            <div class="transcript-bubble">${line.text}</div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderDocumentsPanel(job) {
  const docs = getDocumentsForJob(job.id);
  const el = document.getElementById("panel-documents");
  if (docs.length === 0) {
    el.innerHTML = `<div class="empty-note">No documents uploaded for this job.</div>`;
    return;
  }
  el.innerHTML = `
    <div class="doc-list">
      ${docs.map(doc => `
        <div class="doc-row">
          <span class="doc-icon">${DOC_ICON}</span>
          <div class="doc-body">
            <div class="doc-name">${doc.name}</div>
            <div class="doc-meta">${doc.size} · Uploaded ${formatDateTime(doc.uploaded_at)}</div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderPhotosPanel(job) {
  const photos = getPhotosForJob(job.id);
  const el = document.getElementById("panel-photos");
  if (photos.length === 0) {
    el.innerHTML = `<div class="empty-note">No photos uploaded for this job.</div>`;
    return;
  }
  el.innerHTML = `
    <div class="photo-grid">
      ${photos.map(photo => `
        <div class="photo-tile">
          <div class="photo-tile-placeholder">${PHOTO_ICON}</div>
          <div class="photo-tile-caption">
            <div class="doc-name">${photo.caption}</div>
            <div class="doc-meta">${formatDateTime(photo.uploaded_at)}</div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

/* ------------------------------ Shared -----------------------------------
   Used by both views — the contact-info card is identical on the profile
   page and pinned atop the job detail page. */

function renderContactCard(contact, elId) {
  const el = document.getElementById(elId);
  const rows = [
    ["Phone", contact.phone],
    ["Email", contact.email],
    ["Address", contact.address],
    ["Preferred contact", contact.preferred_contact],
    ["Source", contact.source],
  ];
  el.innerHTML = rows.map(([label, value]) => `
    <div class="info-row">
      <span class="info-label">${label}</span>
      <span class="info-value">${value}</span>
    </div>
  `).join("");
}

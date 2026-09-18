document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const jobId = params.get("job") || "j1";
  const job = getJob(jobId) || JOBS[0];
  const contact = getContact(job.contact_id);

  renderHeader(job, contact);
  renderContactCard(contact);
  renderJobCard(job);
  renderOtherJobs(contact, job);
  renderCall(job);
  renderFollowUp(job);
});

function renderHeader(job, contact) {
  document.title = `${contact.full_name} · ${job.service_type} — Foreman`;
  document.getElementById("page-title").textContent = contact.full_name;
  document.getElementById("page-subtitle").textContent = `${job.service_type} · ${job.category}`;
}

function renderContactCard(contact) {
  const el = document.getElementById("contact-card-body");
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

function renderOtherJobs(contact, currentJob) {
  const jobs = getJobsForContact(contact.id);
  const el = document.getElementById("other-jobs");
  if (jobs.length <= 1) {
    el.innerHTML = `<div class="empty-note">No other jobs for this contact.</div>`;
    return;
  }
  el.innerHTML = jobs.map(j => `
    <a href="contact.html?job=${j.id}" class="${j.id === currentJob.id ? "current" : ""}">
      <span>${j.service_type}</span>
      <span class="badge ${statusBadgeClass(j.status)}">${j.status}</span>
    </a>
  `).join("");
}

function renderJobCard(job) {
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

function renderCall(job) {
  const call = getCallForJob(job.id);
  const section = document.getElementById("call-section");
  if (!call) {
    section.innerHTML = `<div class="card-header"><h2>Call</h2></div><div class="empty-note">No calls logged for this job.</div>`;
    return;
  }
  section.innerHTML = `
    <div class="card-header">
      <h2>Call — ${formatDateTime(call.timestamp)}</h2>
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

function renderFollowUp(job) {
  const followUp = getFollowUpForJob(job.id);
  const section = document.getElementById("followup-section");
  if (!followUp) {
    section.innerHTML = `<div class="card-header"><h2>Follow-up</h2></div><div class="empty-note">No follow-up drafted for this job.</div>`;
    return;
  }

  const statusLabel = { drafted: "Drafted", approved: "Approved", sent: "Sent" }[followUp.status];
  const statusClass = { drafted: "badge-qualified", approved: "badge-scheduled", sent: "badge-completed" }[followUp.status];

  section.innerHTML = `
    <div class="card-header">
      <h2>Follow-up · ${followUp.channel}</h2>
      <span class="badge ${statusClass}">${statusLabel}</span>
    </div>
    <div class="followup-content">${followUp.content}</div>
    ${followUp.status === "drafted" ? `
      <div class="btn-row">
        <button class="btn btn-primary" onclick="alert('This would approve and send the follow-up. Wire this up once live AI drafting is connected.')">Approve &amp; send</button>
        <button class="btn btn-secondary" onclick="alert('This would open the draft for editing.')">Edit draft</button>
      </div>
    ` : followUp.sent_at ? `<div class="schedule-meta" style="margin-top:10px;">Sent ${formatDateTime(followUp.sent_at)}</div>` : ""}
  `;
}

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

  // Editing lives only on the profile view's Contact card, per the design —
  // the same card pinned atop a job's page (renderJobView below) stays
  // read-only. onChange re-renders the whole profile view, not just the
  // card, so the "N jobs on file" subtitle line picks up an edited address.
  renderContactCard(contact, "profile-contact-body", { editable: true, onChange: () => renderProfileView(contact) });
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
    `Job #${job.job_number} · ${job.job_type} · ${formatDateOnly(job.date)}`;

  renderContactCard(contact, "job-contact-body");
  renderJobInfoCard(job);
  renderJobTabs(job);
}

// Draft state for the Job card's Edit/Save/Cancel flow — mirrors
// contactEditDraft above (own variable, since a job and a contact card can
// both be on screen at once and edit independently). null outside of edit
// mode; discarded (not saved) on Cancel. Status/Urgency/Sales rep/Assigned
// to are NOT part of this — they keep their own always-on pickers/pipeline,
// untouched by Edit mode.
let jobEditDraft = null;

function renderJobInfoCard(job) {
  const pipelineEl = document.getElementById("pipeline");
  const currentIndex = STATUS_PIPELINE.indexOf(job.status);
  pipelineEl.innerHTML = STATUS_PIPELINE.map((step, i) => {
    let cls = "pipeline-step";
    if (i < currentIndex) cls += " done";
    if (i === currentIndex) cls += " current";
    return `<button type="button" class="${cls}" data-status="${step}">${step}</button>`;
  }).join("");

  // Clicking a step writes through the same shared status store the Boards
  // page drags into — re-rendering this card is enough to reflect it here.
  pipelineEl.querySelectorAll(".pipeline-step").forEach(btn => {
    btn.addEventListener("click", () => {
      setJobStatus(job.id, btn.getAttribute("data-status"));
      renderJobInfoCard(job);
    });
  });

  if (jobEditDraft) {
    renderJobInfoCardEditor(job);
    return;
  }

  const rows = [
    ["Job Type", job.job_type],
    ["Location", escapeHtml(job.job_location)],
    ["Urgency", urgencyPickerHtml(job)],
    ["Sales rep", salesRepPickerHtml(job)],
    ["Assigned to", assignedToPickerHtml(job)],
    ["Quote amount", formatMoney(job.quote_amount)],
  ];
  const jobCardBody = document.getElementById("job-card-body");
  jobCardBody.innerHTML = rows.map(([label, value]) => `
    <div class="info-row">
      <span class="info-label">${label}</span>
      <span class="info-value">${value}</span>
    </div>
  `).join("") + `<button type="button" class="btn btn-secondary card-edit-btn" id="job-edit-btn">Edit</button>`;
  wirePickers(jobCardBody, () => renderJobInfoCard(job));

  document.getElementById("job-edit-btn").addEventListener("click", () => {
    const appt = getAppointmentForJob(job.id);
    jobEditDraft = {
      job_type: job.job_type,
      job_location: job.job_location,
      quote_amount: job.quote_amount,
      intake_notes: job.intake_notes,
      appt_date: appt ? appt.start_time.slice(0, 10) : "",
      appt_start: appt ? appt.start_time.slice(11, 16) : "",
      appt_end: appt ? appt.end_time.slice(11, 16) : "",
    };
    renderJobInfoCard(job);
  });

  document.getElementById("intake-notes").textContent = job.intake_notes;

  const appt = getAppointmentForJob(job.id);
  const apptEl = document.getElementById("appt-summary");
  if (appt) {
    apptEl.innerHTML = `${formatDateTime(appt.start_time)} – ${formatTime(appt.end_time)} with ${job.assigned_to} · <span class="badge ${appt.status === "Confirmed" ? "badge-scheduled" : "badge-qualified"}">${appt.status}</span>`;
  } else {
    apptEl.innerHTML = `<span class="empty-note">Not yet scheduled.</span>`;
  }
}

// The Edit form spans three regions of the Job card that read-mode also
// fills independently (job-card-body / intake-notes / appt-summary) — Save
// and Cancel live at the end of the last one (Appointment), so they land at
// the bottom of the card same as the read-mode Edit button did.
function renderJobInfoCardEditor(job) {
  const draft = jobEditDraft;

  const jobCardBody = document.getElementById("job-card-body");
  jobCardBody.innerHTML = `
    <div class="edit-field">
      <span class="info-label">Job Type</span>
      <select class="select-input" id="edit-job-type">
        ${JOB_TYPES.map(t => `<option value="${t}" ${t === draft.job_type ? "selected" : ""}>${t}</option>`).join("")}
      </select>
    </div>
    <div class="edit-field">
      <span class="info-label">Location</span>
      <input type="text" class="text-input" id="edit-job-location" value="${escapeHtml(draft.job_location)}">
    </div>
    <div class="edit-field">
      <span class="info-label">Quote amount</span>
      <input type="number" class="text-input" id="edit-quote-amount" min="0" step="1" placeholder="No quote yet" value="${draft.quote_amount != null ? draft.quote_amount : ""}">
    </div>
  `;

  document.getElementById("intake-notes").innerHTML =
    `<textarea class="text-input" id="edit-intake-notes" rows="4">${escapeHtml(draft.intake_notes)}</textarea>`;

  document.getElementById("appt-summary").innerHTML = `
    <div class="edit-field">
      <span class="info-label">Date</span>
      <input type="date" class="text-input" id="edit-appt-date" value="${draft.appt_date}">
    </div>
    <div class="edit-field">
      <span class="info-label">Start time</span>
      <input type="time" class="text-input" id="edit-appt-start" value="${draft.appt_start}">
    </div>
    <div class="edit-field">
      <span class="info-label">End time</span>
      <input type="time" class="text-input" id="edit-appt-end" value="${draft.appt_end}">
    </div>
    <div class="btn-row">
      <button type="button" class="btn btn-primary" id="save-job-btn">Save</button>
      <button type="button" class="btn btn-secondary" id="cancel-job-btn">Cancel</button>
    </div>
  `;

  document.getElementById("save-job-btn").addEventListener("click", () => {
    const quoteRaw = document.getElementById("edit-quote-amount").value.trim();

    setJobDetails(job.id, {
      job_type: document.getElementById("edit-job-type").value,
      job_location: document.getElementById("edit-job-location").value.trim(),
      quote_amount: quoteRaw === "" ? null : Number(quoteRaw),
      intake_notes: document.getElementById("edit-intake-notes").value.trim(),
    });

    // Only commit a time change if all three pieces are present — a
    // half-filled date/time isn't a valid appointment to save.
    const date = document.getElementById("edit-appt-date").value;
    const start = document.getElementById("edit-appt-start").value;
    const end = document.getElementById("edit-appt-end").value;
    if (date && start && end) {
      setAppointmentTime(job.id, `${date}T${start}`, `${date}T${end}`);
    }

    jobEditDraft = null;
    renderJobInfoCard(job);
  });

  document.getElementById("cancel-job-btn").addEventListener("click", () => {
    jobEditDraft = null;
    renderJobInfoCard(job);
  });
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
   page and pinned atop the job detail page, except only the profile view
   passes { editable: true }, which is the only thing that turns on the Edit
   button and everything under it (now including Source — one field among
   Phone/Email/Address/Preferred contact/custom fields, saved or discarded
   together by the same Save/Cancel, not an independent click-to-edit
   badge). Outside of edit mode Source is always plain text, same as the
   other fields. */

const PREFERRED_CONTACT_OPTIONS = ["Call", "Text", "Email"];
const SOURCE_OPTIONS = ["Google", "Referral", "Website", "Phone", "Facebook/Social", "Yelp", "Repeat Customer", "Other"];

// Draft state for whichever Contact card is currently mid-edit — only ever
// one at a time, since editing only exists on the single card the profile
// view renders. null outside of edit mode; discarded (not saved) on Cancel.
let contactEditDraft = null;

function renderContactCard(contact, elId, opts) {
  const options = opts || {};
  const el = document.getElementById(elId);

  if (options.editable && contactEditDraft) {
    renderContactCardEditor(contact, elId, options);
    return;
  }

  const rows = [
    ["Phone", escapeHtml(contact.phone)],
    ["Email", escapeHtml(contact.email)],
    ["Address", escapeHtml(contact.address)],
    ["Preferred contact", escapeHtml(contact.preferred_contact)],
    ["Source", escapeHtml(contact.source)],
    ["Sales rep", contactSalesRepPickerHtml(contact)],
  ];
  contact.custom_fields.forEach(f => rows.push([escapeHtml(f.label), escapeHtml(f.value)]));

  el.innerHTML = `
    ${rows.map(([label, value]) => `
      <div class="info-row">
        <span class="info-label">${label}</span>
        <span class="info-value">${value}</span>
      </div>
    `).join("")}
    ${options.editable ? `<button type="button" class="btn btn-secondary card-edit-btn">Edit</button>` : ""}
  `;
  wirePickers(el, () => renderContactCard(contact, elId, options));

  if (options.editable) {
    el.querySelector(".card-edit-btn").addEventListener("click", () => {
      // A deep-ish copy so edits made in the form (including add/remove of
      // custom fields) never touch the real contact until Save commits it.
      contactEditDraft = {
        phone: contact.phone,
        email: contact.email,
        address: contact.address,
        preferred_contact: contact.preferred_contact,
        source: contact.source,
        custom_fields: contact.custom_fields.map(f => ({ label: f.label, value: f.value })),
      };
      renderContactCard(contact, elId, options);
    });
  }
}

function renderContactCardEditor(contact, elId, options) {
  const el = document.getElementById(elId);
  const draft = contactEditDraft;

  // A saved source might be one of the presets, or custom text typed in
  // previously — either way it's "Other" selected in the dropdown with the
  // custom box showing whatever that text was; a real preset just selects
  // itself and leaves the custom box empty/hidden.
  const sourceIsPreset = SOURCE_OPTIONS.includes(draft.source);
  const selectedSource = sourceIsPreset ? draft.source : "Other";
  const showCustomSource = selectedSource === "Other";
  const customSourceValue = showCustomSource && draft.source !== "Other" ? draft.source : "";

  el.innerHTML = `
    <div class="edit-field">
      <span class="info-label">Phone</span>
      <input type="text" class="text-input" id="edit-contact-phone" value="${escapeHtml(draft.phone)}">
    </div>
    <div class="edit-field">
      <span class="info-label">Email</span>
      <input type="email" class="text-input" id="edit-contact-email" value="${escapeHtml(draft.email)}">
    </div>
    <div class="edit-field">
      <span class="info-label">Address</span>
      <input type="text" class="text-input" id="edit-contact-address" value="${escapeHtml(draft.address)}">
    </div>
    <div class="edit-field">
      <span class="info-label">Preferred contact</span>
      <select class="select-input" id="edit-contact-preferred">
        ${PREFERRED_CONTACT_OPTIONS.map(opt => `<option value="${opt}" ${opt === draft.preferred_contact ? "selected" : ""}>${opt}</option>`).join("")}
      </select>
    </div>
    <div class="edit-field">
      <span class="info-label">Source</span>
      <select class="select-input" id="edit-contact-source">
        ${SOURCE_OPTIONS.map(opt => `<option value="${opt}" ${opt === selectedSource ? "selected" : ""}>${opt}</option>`).join("")}
      </select>
    </div>
    <div class="edit-field" id="source-custom-field" ${showCustomSource ? "" : "hidden"}>
      <span class="info-label">Custom source</span>
      <input type="text" class="text-input" id="edit-contact-source-custom" placeholder="Type a source…" value="${escapeHtml(customSourceValue)}">
    </div>

    <div class="card-eyebrow" style="margin-top:16px;">Custom fields</div>
    <div id="custom-fields-editor">
      ${draft.custom_fields.map((f, i) => `
        <div class="custom-field-row" data-index="${i}">
          <input type="text" class="text-input custom-field-label" placeholder="Label" value="${escapeHtml(f.label)}">
          <input type="text" class="text-input custom-field-value" placeholder="Value" value="${escapeHtml(f.value)}">
          <button type="button" class="custom-field-remove" data-index="${i}" aria-label="Remove field">&times;</button>
        </div>
      `).join("")}
    </div>
    <button type="button" class="btn btn-secondary" id="add-custom-field-btn">+ Add custom field</button>

    <div class="btn-row">
      <button type="button" class="btn btn-primary" id="save-contact-btn">Save</button>
      <button type="button" class="btn btn-secondary" id="cancel-contact-btn">Cancel</button>
    </div>
  `;

  el.querySelector("#edit-contact-source").addEventListener("change", e => {
    el.querySelector("#source-custom-field").hidden = e.target.value !== "Other";
  });

  // Typing doesn't touch the draft object directly — Save reads the DOM
  // once at commit time, same as every other form in this app. Add/remove
  // re-render immediately since the row list itself changes.
  el.querySelector("#add-custom-field-btn").addEventListener("click", () => {
    draft.custom_fields.push({ label: "", value: "" });
    renderContactCardEditor(contact, elId, options);
  });

  el.querySelectorAll(".custom-field-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      draft.custom_fields.splice(parseInt(btn.getAttribute("data-index"), 10), 1);
      renderContactCardEditor(contact, elId, options);
    });
  });

  el.querySelector("#save-contact-btn").addEventListener("click", () => {
    const customFields = [...el.querySelectorAll(".custom-field-row")].map(row => ({
      label: row.querySelector(".custom-field-label").value.trim(),
      value: row.querySelector(".custom-field-value").value.trim(),
    })).filter(f => f.label || f.value); // drop rows left fully blank

    const sourceSelected = el.querySelector("#edit-contact-source").value;
    const source = sourceSelected === "Other"
      ? (el.querySelector("#edit-contact-source-custom").value.trim() || "Other")
      : sourceSelected;

    setContactDetails(contact.id, {
      phone: el.querySelector("#edit-contact-phone").value.trim(),
      email: el.querySelector("#edit-contact-email").value.trim(),
      address: el.querySelector("#edit-contact-address").value.trim(),
      preferred_contact: el.querySelector("#edit-contact-preferred").value,
      source,
      custom_fields: customFields,
    });
    contactEditDraft = null;
    if (options.onChange) options.onChange();
    else renderContactCard(contact, elId, options);
  });

  el.querySelector("#cancel-contact-btn").addEventListener("click", () => {
    contactEditDraft = null;
    renderContactCard(contact, elId, options);
  });
}

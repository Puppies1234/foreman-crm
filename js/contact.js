// Two views share this one page:
//   ?contact=<id>  → profile view (contact info + a Jobs index, nothing more)
//   ?job=<id>      → job detail view (that job's own info + its own
//                     Messages / Calls & Transcripts / Documents / Photos)
// Every render function below is handed the specific job or contact it
// should draw from — none of them reach across to a different job's data.
whenAppReady(() => {
  const params = new URLSearchParams(window.location.search);
  const jobId = params.get("job");
  const contactParam = params.get("contact");
  const job = jobId ? getJob(jobId) : null;

  if (job) {
    recordRecentlyViewed("job", job.id);
    renderJobView(job);
  } else {
    const contact = (contactParam && getContact(contactParam)) || CONTACTS[0];
    recordRecentlyViewed("contact", contact.id);
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

  document.title = `${contact.full_name} — ${getBrand().name}`;
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
      <span class="badge ${jobTypeBadgeClass(job.job_type)}">${escapeHtml(job.job_type)}</span>
      <span class="badge ${appointmentTypeBadgeClass(job.appointment_type)}">${escapeHtml(job.appointment_type)}</span>
      <span class="badge ${statusBadgeClass(job.status)}">${escapeHtml(job.status)}</span>
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

  document.title = `${job.service_type} · ${contact.full_name} — ${getBrand().name}`;

  const breadcrumb = document.getElementById("job-breadcrumb");
  breadcrumb.href = `contact.html?contact=${contact.id}`;
  breadcrumb.textContent = `← ${contact.full_name} · ${siblingJobs.length} job${siblingJobs.length === 1 ? "" : "s"}`;

  document.getElementById("job-title").textContent = job.service_type;
  updateJobSubtitle(job);

  renderContactCard(contact, "job-contact-body");
  renderJobInfoCard(job);
  // Its own render call, independent of renderJobInfoCard's Edit/Save/
  // Cancel toggle — Materials Used stays live (adds/removes save
  // immediately) no matter what state the rest of the Job card is in.
  renderMaterialsUsed(job);
  renderJobTabs(job);
}

// One listener for the whole page, registered once (not per render) —
// closes any open materials search dropdown on an outside click, same
// idea as data.js's closeAllPickerMenus for the badge pickers.
document.addEventListener("click", e => {
  if (!e.target.closest(".materials-search-wrap")) {
    document.querySelectorAll(".materials-search-results").forEach(el => { el.hidden = true; });
  }
});

function renderMaterialsUsed(job) {
  const el = document.getElementById("materials-used");
  const materials = getMaterialsForJob(job.id);
  const total = materials.reduce((sum, m) => {
    const item = getInventoryItem(m.inventory_id);
    return sum + (item ? item.unit_price * m.quantity : 0);
  }, 0);

  el.innerHTML = `
    <div class="materials-search-row">
      <div class="materials-search-wrap">
        <input type="text" class="text-input" id="materials-search-input" placeholder="Search inventory by name…" autocomplete="off">
        <div class="materials-search-results" id="materials-search-results" hidden></div>
      </div>
      <input type="number" class="text-input materials-qty-input" id="materials-add-qty" value="1" min="1" step="1">
      <button type="button" class="btn btn-secondary" id="materials-add-btn" disabled>Add</button>
    </div>
    ${materials.length > 0 ? `
      <div class="materials-list">
        ${materials.map(m => {
          const item = getInventoryItem(m.inventory_id);
          const lineCost = item ? item.unit_price * m.quantity : 0;
          return `
            <div class="materials-row">
              <div class="materials-row-name">${item ? escapeHtml(item.name) : "(item no longer in inventory)"}</div>
              <div class="materials-row-qty">×${m.quantity}</div>
              <div class="materials-row-cost">${formatMoney(lineCost)}</div>
              <button type="button" class="materials-remove" data-inv-id="${m.inventory_id}" aria-label="Remove">&times;</button>
            </div>
          `;
        }).join("")}
      </div>
      <div class="materials-total"><span>Total</span><span>${formatMoney(total)}</span></div>
    ` : `<div class="empty-note">No materials added yet.</div>`}
  `;

  let selectedItemId = null;
  const searchInput = document.getElementById("materials-search-input");
  const resultsEl = document.getElementById("materials-search-results");
  const addBtn = document.getElementById("materials-add-btn");

  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    selectedItemId = null;
    addBtn.disabled = true;
    if (!q) {
      resultsEl.hidden = true;
      return;
    }
    const matches = INVENTORY.filter(i => i.name.toLowerCase().includes(q)).slice(0, 8);
    resultsEl.innerHTML = matches.length > 0
      // An item's old id when it has one (inventoryMaterialsId), so a job
      // never gets a second Materials Used line for an item it already has.
      ? matches.map(i => `<div class="materials-search-result" data-id="${escapeHtml(inventoryMaterialsId(i))}">${escapeHtml(i.name)} <span class="materials-search-result-qty">(${i.quantity} on hand)</span></div>`).join("")
      : `<div class="materials-search-empty">No matching items</div>`;
    resultsEl.hidden = false;
  });

  resultsEl.addEventListener("click", e => {
    const row = e.target.closest(".materials-search-result");
    if (!row) return;
    selectedItemId = row.getAttribute("data-id");
    searchInput.value = getInventoryItem(selectedItemId).name;
    resultsEl.hidden = true;
    addBtn.disabled = false;
  });

  addBtn.addEventListener("click", () => {
    if (!selectedItemId) return;
    const qty = Math.max(1, parseInt(document.getElementById("materials-add-qty").value, 10) || 1);
    addMaterialToJob(job.id, selectedItemId, qty);
    renderMaterialsUsed(job);
  });

  el.querySelectorAll(".materials-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      removeMaterialFromJob(job.id, btn.getAttribute("data-inv-id"));
      renderMaterialsUsed(job);
    });
  });
}

// Draft state for the Job card's Edit/Save/Cancel flow — mirrors
// contactEditDraft above (own variable, since a job and a contact card can
// both be on screen at once and edit independently). null outside of edit
// mode; discarded (not saved) on Cancel. Status/Urgency/Sales rep/Assigned
// to/Job Type/Appointment Type are NOT part of this — they keep their own
// always-on pickers/pipeline, untouched by Edit mode.
let jobEditDraft = null;

// Job Type shows up in one place outside the Job card itself — this
// breadcrumb-area subtitle — so its picker's re-render (renderJobInfoCard,
// not the full renderJobView) needs to keep this in sync too, or picking a
// new value here would save instantly everywhere else while this one line
// silently went stale.
function updateJobSubtitle(job) {
  document.getElementById("job-subtitle").textContent =
    `Job #${job.job_number} · ${job.job_type} · ${formatDateOnly(job.date)}`;
}

function renderJobInfoCard(job) {
  updateJobSubtitle(job);
  const pipelineEl = document.getElementById("pipeline");
  // Enabled stages in order, plus this job's own stage if it's disabled.
  const stages = labelOptions("status", job.status);
  const currentIndex = stages.indexOf(job.status);
  pipelineEl.innerHTML = stages.map((step, i) => {
    let cls = "pipeline-step";
    if (i < currentIndex) cls += " done";
    if (i === currentIndex) cls += " current";
    return `<button type="button" class="${cls}" data-status="${escapeHtml(step)}">${escapeHtml(step)}</button>`;
  }).join("");

  // Clicking a step writes through the same shared status store the Boards
  // page drags into — re-rendering this card is enough to reflect it here.
  pipelineEl.querySelectorAll(".pipeline-step").forEach(btn => {
    btn.addEventListener("click", () => {
      setJobStatus(job.id, btn.getAttribute("data-status")).then(r => { if (r.error) renderJobInfoCard(job); });
      renderJobInfoCard(job);
    });
  });

  if (jobEditDraft) {
    renderJobInfoCardEditor(job);
    return;
  }

  const rows = [
    ["Job Type", jobTypePickerHtml(job)],
    ["Appointment Type", appointmentTypePickerHtml(job)],
    ["Location", escapeHtml(job.job_location)],
    ["Urgency", urgencyPickerHtml(job)],
    getFeatures().salesRepTracking && ["Sales Rep", salesRepPickerHtml(job)],
    ["Assigned To", assignedToPickerHtml(job)],
    ["Quote Amount", formatMoney(job.quote_amount)],
  ].filter(Boolean);
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
    apptEl.innerHTML = `${formatDateTime(appt.start_time)} – ${formatTime(appt.end_time)} with ${job.assigned_to} · <span class="badge ${appointmentStatusBadgeClass(appt.status)}">${appt.status}</span>`;
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
      <span class="info-label">Location</span>
      <input type="text" class="text-input" id="edit-job-location" value="${escapeHtml(draft.job_location)}">
    </div>
    <div class="edit-field">
      <span class="info-label">Quote Amount</span>
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
      <span class="info-label">Start Time</span>
      <input type="time" class="text-input" id="edit-appt-start" value="${draft.appt_start}">
    </div>
    <div class="edit-field">
      <span class="info-label">End Time</span>
      <input type="time" class="text-input" id="edit-appt-end" value="${draft.appt_end}">
    </div>
    <div class="btn-row">
      <button type="button" class="btn btn-primary" id="save-job-btn">Save</button>
      <button type="button" class="btn btn-secondary" id="cancel-job-btn">Cancel</button>
    </div>
  `;

  // Setting/changing the start time fills in the end time as start + the
  // default appointment length (Settings → General) — but only until the
  // owner edits the end time by hand in this Edit session; after that, the
  // end time is theirs and a start change leaves it alone.
  const startInput = document.getElementById("edit-appt-start");
  const endInput = document.getElementById("edit-appt-end");
  endInput.addEventListener("input", () => { draft.appt_end_touched = true; });
  startInput.addEventListener("input", () => {
    if (draft.appt_end_touched || !startInput.value) return;
    endInput.value = addMinutesToTime(startInput.value, getBusinessSettings().defaultAppointmentMinutes);
  });

  document.getElementById("save-job-btn").addEventListener("click", () => {
    const quoteRaw = document.getElementById("edit-quote-amount").value.trim();

    // Only commit a time change if all three pieces are present — a
    // half-filled date/time isn't a valid appointment to save.
    const date = document.getElementById("edit-appt-date").value;
    const start = document.getElementById("edit-appt-start").value;
    const end = document.getElementById("edit-appt-end").value;

    // One save to Supabase for everything in the form. It shows at once;
    // if Supabase rejects it the job is rolled back and this re-renders.
    const saved = setJobDetails(job.id, {
      job_location: document.getElementById("edit-job-location").value.trim(),
      quote_amount: quoteRaw === "" ? null : Number(quoteRaw),
      intake_notes: document.getElementById("edit-intake-notes").value.trim(),
    }, date && start && end ? { date, start, end } : null);

    jobEditDraft = null;
    renderJobInfoCard(job);
    saved.then(r => { if (r.error) renderJobInfoCard(job); });
  });

  document.getElementById("cancel-job-btn").addEventListener("click", () => {
    jobEditDraft = null;
    renderJobInfoCard(job);
  });
}

/* ------------------------------ Job tabs ---------------------------------
   All five panels are rendered fresh for the single `job` passed in, from
   its own id only — switching jobs re-runs this from scratch, so nothing
   from a previously viewed job can linger. */

function renderJobTabs(job) {
  const tabButtons = document.querySelectorAll("#job-tabs .tab-btn");
  const panels = document.querySelectorAll(".job-tab-panel");
  const enabled = getFeatures().jobActivityTabs;

  // A tab this business has turned off is hidden outright (button and
  // panel), not just unreachable — the active tab defaults to the first
  // one still enabled instead of always "messages", in case that's the
  // one that's off.
  tabButtons.forEach(btn => {
    btn.hidden = !enabled[btn.getAttribute("data-tab")];
  });
  panels.forEach(p => {
    p.hidden = true;
  });
  const firstEnabledBtn = Array.from(tabButtons).find(btn => !btn.hidden);
  const defaultTab = firstEnabledBtn ? firstEnabledBtn.getAttribute("data-tab") : null;

  tabButtons.forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-tab") === defaultTab);
    btn.onclick = () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.getAttribute("data-tab");
      panels.forEach(p => { p.hidden = p.getAttribute("data-panel") !== target; });
    };
  });
  panels.forEach(p => { p.hidden = p.getAttribute("data-panel") !== defaultTab; });

  renderMessagesPanel(job);
  renderCallsPanel(job);
  renderDocumentsPanel(job);
  renderPhotosPanel(job);
  renderEstimatePanel(job);
}

// Merges this job's actual SMS thread with its drafted/approved/sent
// follow-up (if any) into one chronological conversation. Settings →
// Features → AI Assistant (Ava) off means Ava isn't drafting or sending on
// this business's behalf, so its composed messages and follow-up drafts
// drop out of the thread — the contact's own incoming texts still show.
function renderMessagesPanel(job) {
  let thread = getThreadForJob(job.id);
  const el = document.getElementById("panel-messages");

  if (!getFeatures().aiAssistant) {
    thread = thread.filter(item => item.kind === "message" && item.sender !== "ai");
  }

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
              <div class="transcript-speaker">${isAi ? escapeHtml(getBrand().name) : "Contact"}</div>
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
            <div class="transcript-speaker">${escapeHtml(getBrand().name)}</div>
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

// Reads a File, gated by the same 5MB cap (js/data.js's MAX_UPLOAD_BYTES)
// no matter which tab called it — shows an inline error and never even
// attempts to read a file that's too large, rather than letting
// FileReader/localStorage fail later with a much less useful error.
function readUploadedFile(file, errorEl, onDone) {
  errorEl.hidden = true;
  if (file.size > MAX_UPLOAD_BYTES) {
    errorEl.textContent = `"${file.name}" is ${formatFileSize(file.size)} — the limit is ${formatFileSize(MAX_UPLOAD_BYTES)}. Choose a smaller file.`;
    errorEl.hidden = false;
    return;
  }
  const reader = new FileReader();
  reader.onload = () => onDone(reader.result);
  reader.onerror = () => {
    errorEl.textContent = `Couldn't read "${file.name}". Try again.`;
    errorEl.hidden = false;
  };
  reader.readAsDataURL(file);
}

const DOC_ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];

function isAllowedDocumentFile(file) {
  if (file.type.startsWith("image/")) return true;
  const lower = file.name.toLowerCase();
  return DOC_ALLOWED_EXTENSIONS.some(ext => lower.endsWith(ext));
}

function renderDocumentsPanel(job) {
  const docs = [...getDocumentsForJob(job.id), ...getUploadedDocumentsForJob(job.id)]
    .sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));
  const el = document.getElementById("panel-documents");

  el.innerHTML = `
    <div class="upload-toolbar-row">
      <label class="btn btn-secondary" for="doc-upload-input">Upload Document</label>
      <input type="file" id="doc-upload-input" accept=".pdf,.doc,.docx,image/*" hidden>
    </div>
    <div class="upload-error" id="doc-upload-error" hidden></div>
    ${docs.length === 0 ? `<div class="empty-note">No documents uploaded for this job.</div>` : `
      <div class="doc-list">
        ${docs.map(doc => {
          const isUploaded = !!doc.dataUrl;
          const nameHtml = isUploaded
            ? `<a href="${doc.dataUrl}" target="_blank" rel="noopener" download="${escapeHtml(doc.name)}">${escapeHtml(doc.name)}</a>`
            : escapeHtml(doc.name);
          return `
            <div class="doc-row">
              <span class="doc-icon">${DOC_ICON}</span>
              <div class="doc-body">
                <div class="doc-name">${nameHtml}</div>
                <div class="doc-meta">${doc.size} · Uploaded ${formatDateTime(doc.uploaded_at)}</div>
              </div>
              ${isUploaded ? `<button type="button" class="materials-remove" data-doc-id="${doc.id}" aria-label="Remove document">&times;</button>` : ""}
            </div>
          `;
        }).join("")}
      </div>
    `}
  `;

  const errorEl = document.getElementById("doc-upload-error");
  document.getElementById("doc-upload-input").addEventListener("change", e => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!isAllowedDocumentFile(file)) {
      errorEl.textContent = `"${file.name}" isn't a supported type — upload a PDF, DOC/DOCX, or image.`;
      errorEl.hidden = false;
      return;
    }
    readUploadedFile(file, errorEl, dataUrl => {
      const ok = addUploadedDocumentToJob(job.id, {
        id: `doc-upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        size: formatFileSize(file.size),
        dataUrl,
        uploaded_at: new Date().toISOString(),
      });
      if (!ok) {
        errorEl.textContent = "Couldn't save that file — storage is full. Try removing an existing upload first.";
        errorEl.hidden = false;
        return;
      }
      renderDocumentsPanel(job);
    });
  });

  el.querySelectorAll(".doc-list .materials-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      removeUploadedDocumentFromJob(job.id, btn.getAttribute("data-doc-id"));
      renderDocumentsPanel(job);
    });
  });
}

function renderPhotosPanel(job) {
  const photos = [...getPhotosForJob(job.id), ...getUploadedPhotosForJob(job.id)]
    .sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));
  const el = document.getElementById("panel-photos");

  el.innerHTML = `
    <div class="upload-toolbar-row">
      <input type="text" class="text-input" id="photo-caption-input" placeholder="Caption (optional)">
      <label class="btn btn-secondary" for="photo-upload-input">Upload Photo</label>
      <input type="file" id="photo-upload-input" accept="image/*" hidden>
    </div>
    <div class="upload-error" id="photo-upload-error" hidden></div>
    ${photos.length === 0 ? `<div class="empty-note">No photos uploaded for this job.</div>` : `
      <div class="photo-grid">
        ${photos.map(photo => {
          const isUploaded = !!photo.dataUrl;
          return `
            <div class="photo-tile">
              ${isUploaded
                ? `<button type="button" class="photo-tile-img-btn" data-photo-id="${photo.id}"><img class="photo-tile-img" src="${photo.dataUrl}" alt="${escapeHtml(photo.caption || "")}"></button>`
                : `<div class="photo-tile-placeholder">${PHOTO_ICON}</div>`}
              <div class="photo-tile-caption">
                <div class="doc-name">${escapeHtml(photo.caption || "Untitled")}</div>
                <div class="doc-meta">${formatDateTime(photo.uploaded_at)}</div>
              </div>
              ${isUploaded ? `<button type="button" class="materials-remove photo-remove-btn" data-photo-id="${photo.id}" aria-label="Remove photo">&times;</button>` : ""}
            </div>
          `;
        }).join("")}
      </div>
    `}
  `;

  const errorEl = document.getElementById("photo-upload-error");
  document.getElementById("photo-upload-input").addEventListener("change", e => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      errorEl.textContent = `"${file.name}" isn't an image.`;
      errorEl.hidden = false;
      return;
    }
    const caption = document.getElementById("photo-caption-input").value.trim();
    readUploadedFile(file, errorEl, dataUrl => {
      const ok = addUploadedPhotoToJob(job.id, {
        id: `photo-upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        caption,
        dataUrl,
        uploaded_at: new Date().toISOString(),
      });
      if (!ok) {
        errorEl.textContent = "Couldn't save that photo — storage is full. Try removing an existing upload first.";
        errorEl.hidden = false;
        return;
      }
      renderPhotosPanel(job);
    });
  });

  el.querySelectorAll(".photo-tile-img-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const photo = photos.find(p => p.id === btn.getAttribute("data-photo-id"));
      openPhotoLightbox(photo);
    });
  });

  el.querySelectorAll(".photo-remove-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      removeUploadedPhotoFromJob(job.id, btn.getAttribute("data-photo-id"));
      renderPhotosPanel(job);
    });
  });
}

// One lightbox element, created once and reused for every tile on every
// job page — closes on clicking the backdrop or the × control.
function openPhotoLightbox(photo) {
  let overlay = document.getElementById("photo-lightbox");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "photo-lightbox";
    overlay.className = "photo-lightbox";
    overlay.innerHTML = `
      <button type="button" class="photo-lightbox-close" aria-label="Close">&times;</button>
      <img class="photo-lightbox-img">
      <div class="photo-lightbox-caption"></div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", e => {
      if (e.target === overlay || e.target.classList.contains("photo-lightbox-close")) {
        overlay.hidden = true;
      }
    });
  }
  overlay.querySelector(".photo-lightbox-img").src = photo.dataUrl;
  overlay.querySelector(".photo-lightbox-caption").textContent = photo.caption || "";
  overlay.hidden = false;
}

function estimateLineItemRowHtml(li) {
  return `
    <div class="estimate-line-item-row" data-line-id="${li.id}">
      <input type="text" class="text-input" data-field="name" placeholder="Item Name" value="${escapeHtml(li.name)}">
      <input type="text" class="text-input" data-field="description" placeholder="Description" value="${escapeHtml(li.description)}">
      <input type="number" class="text-input" data-field="quantity" min="0" step="1" value="${li.quantity}">
      <input type="number" class="text-input" data-field="price" min="0" step="0.01" value="${li.price}">
      <button type="button" class="materials-remove estimate-remove-line-btn" data-line-id="${li.id}" aria-label="Remove line item">&times;</button>
    </div>
  `;
}

// Three mutually exclusive things the Estimate tab can be showing right
// now. A real page navigation between jobs reinitializes this module from
// scratch, so none of this is ever stale across jobs.
//   selectedEstimateId — id of an already-SAVED estimate open for editing
//   draftEstimate      — a brand-new estimate, populated from a template or
//                        blank, not yet added to the job's saved list —
//                        that only happens when Save Estimate is clicked
let selectedEstimateId = null;
let draftEstimate = null;
let estimateChooserOpen = false;

function estimateTemplateChooserHtml(templates, showCancel) {
  const promptText = templates.length > 0
    ? "Choose a template to get started, or start blank."
    : "No templates yet — create one in Settings → Estimates, or start blank.";
  return `
    <div class="estimate-start-prompt">${promptText}</div>
    <div class="estimate-start-row">
      <select class="select-input" id="estimate-template-select">
        <option value="">Blank estimate</option>
        ${templates.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join("")}
      </select>
      <button type="button" class="btn btn-primary" id="estimate-start-btn">Start Estimate</button>
      ${showCancel ? `<button type="button" class="btn btn-secondary" id="estimate-chooser-cancel-btn">Cancel</button>` : ""}
    </div>
    <label class="estimate-markup-option" id="estimate-markup-option" hidden>
      <input type="checkbox" id="estimate-markup-checkbox">
      Apply default markup (${getEstimateDefaults().markup}%)
    </label>
  `;
}

// List view: every SAVED estimate this job has, plus the template-or-blank
// chooser — shown directly when there are zero estimates yet, or on demand
// via "+ New Estimate" once there's at least one.
function renderEstimateList(job) {
  const el = document.getElementById("panel-estimate");
  const estimates = getEstimatesForJob(job.id);
  const templates = getEstimateTemplates();
  const showChooser = estimates.length === 0 || estimateChooserOpen;

  const listHtml = estimates.length > 0 ? `
    <div class="doc-list" style="margin-bottom:16px;">
      ${estimates.map(e => `
        <a class="doc-row estimate-list-row" href="#" data-estimate-id="${e.id}">
          <div class="doc-body">
            <div class="doc-name">${escapeHtml(e.name)}</div>
            <div class="doc-meta">${e.lineItems.length} item${e.lineItems.length === 1 ? "" : "s"} · ${formatMoneyCents(estimateTotals(e).total)}</div>
          </div>
          <button type="button" class="materials-remove estimate-delete-btn" data-estimate-id="${e.id}" aria-label="Delete estimate">&times;</button>
        </a>
      `).join("")}
    </div>
  ` : "";

  const chooserHtml = showChooser ? estimateTemplateChooserHtml(templates, estimates.length > 0) : "";
  const newBtnHtml = (estimates.length > 0 && !showChooser)
    ? `<button type="button" class="btn btn-secondary" id="estimate-new-btn">+ New Estimate</button>`
    : "";
  const emptyNoteHtml = (estimates.length === 0 && !showChooser)
    ? `<div class="empty-note">No estimate started for this job yet.</div>`
    : "";

  el.innerHTML = listHtml + chooserHtml + newBtnHtml + emptyNoteHtml;

  el.querySelectorAll(".estimate-list-row").forEach(row => {
    row.addEventListener("click", e => {
      e.preventDefault();
      if (e.target.closest(".estimate-delete-btn")) return;
      selectedEstimateId = row.getAttribute("data-estimate-id");
      renderEstimatePanel(job);
    });
  });

  el.querySelectorAll(".estimate-delete-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      if (!confirm("Delete this estimate? This can't be undone.")) return;
      deleteEstimateFromJob(job.id, btn.getAttribute("data-estimate-id"));
      renderEstimatePanel(job);
    });
  });

  if (showChooser) {
    // Matched by id, not name — the dropdown's own option values are each
    // template's real id (set where the <option> tags are built above), so
    // this is exactly the same id the templates array itself is keyed by.
    // The markup option only means something when copying from a template
    // — a blank estimate has no prices to scale — so it shows only then.
    const templateSelect = document.getElementById("estimate-template-select");
    const markupOption = document.getElementById("estimate-markup-option");
    const syncMarkupOption = () => { markupOption.hidden = !templateSelect.value; };
    templateSelect.addEventListener("change", syncMarkupOption);
    syncMarkupOption();

    document.getElementById("estimate-start-btn").addEventListener("click", () => {
      const templateId = templateSelect.value || null;
      const defaults = getEstimateDefaults();
      const applyMarkup = !!templateId && document.getElementById("estimate-markup-checkbox").checked;
      estimateChooserOpen = false;
      // Tax rate and terms are copied from Settings → Estimates right now,
      // at creation — later changes to those defaults never reach this
      // estimate. Markup is baked into the copied prices the same way.
      draftEstimate = {
        id: null,
        name: "",
        lineItems: estimateLineItemsFromTemplate(templateId, applyMarkup ? defaults.markup : 0),
        started_from_template_id: templateId,
        tax_rate: defaults.taxRate,
        terms: defaults.terms,
      };
      renderEstimatePanel(job);
    });
    const cancelBtn = document.getElementById("estimate-chooser-cancel-btn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        estimateChooserOpen = false;
        renderEstimatePanel(job);
      });
    }
  }

  if (newBtnHtml) {
    document.getElementById("estimate-new-btn").addEventListener("click", () => {
      estimateChooserOpen = true;
      renderEstimatePanel(job);
    });
  }
}

// Editor view — shared by a brand-new (unsaved) draft and an existing
// saved estimate being reopened. Line item and name edits only touch the
// in-memory object until Save Estimate is clicked: that button is the one
// and only thing that ever writes this estimate to storage, so it's a
// real, meaningful save rather than a no-op next to auto-saving fields.
// isNew controls whether Save creates a new entry (and Cancel discards the
// draft outright) or updates an existing one (and the back arrow just
// closes the editor, nothing to discard).
function renderEstimateEditor(job, estimate, isNew) {
  const el = document.getElementById("panel-estimate");

  el.innerHTML = `
    <button type="button" class="card-eyebrow estimate-back-btn" id="estimate-back-btn">&larr; All Estimates</button>
    <div class="edit-field" style="margin-top:10px;">
      <span class="info-label">Estimate Name</span>
      <input type="text" class="text-input" id="job-estimate-name-input" placeholder="Optional — auto-named when saved" value="${escapeHtml(estimate.name)}">
    </div>
    <div class="estimate-line-items-header">
      <span>Item Name</span><span>Description</span><span>Qty</span><span>Price</span><span></span>
    </div>
    <div class="estimate-line-items-list" id="job-estimate-line-items">
      ${estimate.lineItems.map(estimateLineItemRowHtml).join("")}
    </div>
    <button type="button" class="btn btn-secondary" id="job-estimate-add-line-btn">+ Add Line Item</button>
    <div class="estimate-summary">
      <div class="estimate-summary-row"><span>Subtotal</span><span id="job-estimate-subtotal"></span></div>
      <div class="estimate-summary-row">
        <span class="estimate-tax-label">Tax
          <input type="number" class="text-input estimate-tax-input" id="job-estimate-tax-rate" min="0" step="0.01" value="${Number(estimate.tax_rate) || 0}" aria-label="Tax rate percent">%
        </span>
        <span id="job-estimate-tax"></span>
      </div>
    </div>
    <div class="estimate-total-row"><span>Estimate Total</span><span id="job-estimate-total"></span></div>
    <div class="estimate-terms-field">
      <label class="info-label" for="job-estimate-terms">Terms &amp; Conditions</label>
      <textarea class="text-input" id="job-estimate-terms" rows="4" placeholder="No terms on this estimate.">${escapeHtml(estimate.terms || "")}</textarea>
    </div>
    <div class="btn-row" style="margin-top:16px;">
      <button type="button" class="btn btn-primary" id="job-estimate-save-btn">Save Estimate</button>
      ${isNew ? `<button type="button" class="btn btn-secondary" id="job-estimate-discard-btn">Cancel</button>` : ""}
      <span class="save-confirm" id="job-estimate-save-confirm" hidden>Saved.</span>
    </div>
  `;

  document.getElementById("estimate-back-btn").addEventListener("click", () => {
    selectedEstimateId = null;
    draftEstimate = null;
    renderEstimatePanel(job);
  });

  const discardBtn = document.getElementById("job-estimate-discard-btn");
  if (discardBtn) {
    discardBtn.addEventListener("click", () => {
      draftEstimate = null;
      renderEstimatePanel(job);
    });
  }

  document.getElementById("job-estimate-name-input").addEventListener("input", e => {
    estimate.name = e.target.value;
    document.getElementById("job-estimate-save-confirm").hidden = true;
  });

  const saveConfirmEl = document.getElementById("job-estimate-save-confirm");
  const renderTotals = () => {
    const totals = estimateTotals(estimate);
    document.getElementById("job-estimate-subtotal").textContent = formatMoneyCents(totals.subtotal);
    document.getElementById("job-estimate-tax").textContent = formatMoneyCents(totals.tax);
    document.getElementById("job-estimate-total").textContent = formatMoneyCents(totals.total);
  };
  const updateTotal = () => {
    renderTotals();
    saveConfirmEl.hidden = true;
  };
  renderTotals();

  document.getElementById("job-estimate-tax-rate").addEventListener("input", e => {
    estimate.tax_rate = Math.max(0, parseFloat(e.target.value) || 0);
    updateTotal();
  });

  document.getElementById("job-estimate-terms").addEventListener("input", e => {
    estimate.terms = e.target.value;
    saveConfirmEl.hidden = true;
  });

  document.querySelectorAll("#job-estimate-line-items .estimate-line-item-row").forEach(row => {
    const li = estimate.lineItems.find(l => l.id === row.getAttribute("data-line-id"));
    row.querySelectorAll("input").forEach(input => {
      input.addEventListener("input", () => {
        const field = input.getAttribute("data-field");
        li[field] = (field === "quantity" || field === "price") ? (parseFloat(input.value) || 0) : input.value;
        updateTotal();
      });
    });
  });

  document.querySelectorAll("#job-estimate-line-items .estimate-remove-line-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      estimate.lineItems = estimate.lineItems.filter(l => l.id !== btn.getAttribute("data-line-id"));
      renderEstimateEditor(job, estimate, isNew);
    });
  });

  document.getElementById("job-estimate-add-line-btn").addEventListener("click", () => {
    estimate.lineItems.push(newEstimateLineItem());
    renderEstimateEditor(job, estimate, isNew);
  });

  document.getElementById("job-estimate-save-btn").addEventListener("click", () => {
    const currentEstimates = getEstimatesForJob(job.id);
    if (!estimate.name.trim()) {
      // Excluding this estimate itself matters for a re-save (isNew=false)
      // with the name cleared back out — it shouldn't count as "in use"
      // against its own old name.
      estimate.name = nextAvailableEstimateName(currentEstimates.filter(e => e.id !== estimate.id));
    }
    if (isNew) {
      estimate.id = "est-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
      estimate.created_at = new Date().toISOString();
      saveNewEstimateForJob(job.id, estimate);
      draftEstimate = null;
      selectedEstimateId = estimate.id;
    } else {
      updateEstimateForJob(job.id, estimate);
    }
    renderEstimatePanel(job);
  });
}

function renderEstimatePanel(job) {
  if (draftEstimate) {
    renderEstimateEditor(job, draftEstimate, true);
    return;
  }
  if (selectedEstimateId) {
    const existing = getEstimatesForJob(job.id).find(e => e.id === selectedEstimateId);
    if (existing) {
      renderEstimateEditor(job, existing, false);
      return;
    }
    selectedEstimateId = null; // stale reference (deleted elsewhere) — fall through to the list
  }
  renderEstimateList(job);
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
    ["Preferred Contact", escapeHtml(contact.preferred_contact)],
    ["Source", escapeHtml(contact.source)],
    getFeatures().salesRepTracking && ["Sales Rep", contactSalesRepPickerHtml(contact)],
  ].filter(Boolean);
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

function customFieldRowHtml(field) {
  return `
    <div class="custom-field-row">
      <input type="text" class="text-input custom-field-label" placeholder="Label" value="${escapeHtml(field.label)}">
      <input type="text" class="text-input custom-field-value" placeholder="Value" value="${escapeHtml(field.value)}">
      <button type="button" class="custom-field-remove" aria-label="Remove field">&times;</button>
    </div>
  `;
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
      <span class="info-label">Preferred Contact</span>
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
      <span class="info-label">Custom Source</span>
      <input type="text" class="text-input" id="edit-contact-source-custom" placeholder="Type a source…" value="${escapeHtml(customSourceValue)}">
    </div>

    <div class="card-eyebrow" style="margin-top:16px;">Custom Fields</div>
    <div id="custom-fields-editor">
      ${draft.custom_fields.map(customFieldRowHtml).join("")}
    </div>
    <button type="button" class="btn btn-secondary" id="add-custom-field-btn">+ Add Custom Field</button>

    <div class="btn-row">
      <button type="button" class="btn btn-primary" id="save-contact-btn">Save</button>
      <button type="button" class="btn btn-secondary" id="cancel-contact-btn">Cancel</button>
    </div>
  `;

  el.querySelector("#edit-contact-source").addEventListener("change", e => {
    el.querySelector("#source-custom-field").hidden = e.target.value !== "Other";
  });

  // While editing, the form itself holds every in-progress value — Save
  // reads the DOM once at commit time, same as every other form in this
  // app. So adding or removing a custom field only touches that one row in
  // #custom-fields-editor and never redraws the form: re-rendering from
  // `draft` would throw away anything typed since Edit was clicked.
  const customFieldsEditor = el.querySelector("#custom-fields-editor");
  customFieldsEditor.addEventListener("click", e => {
    const removeBtn = e.target.closest(".custom-field-remove");
    if (removeBtn) removeBtn.closest(".custom-field-row").remove();
  });

  el.querySelector("#add-custom-field-btn").addEventListener("click", () => {
    customFieldsEditor.insertAdjacentHTML("beforeend", customFieldRowHtml({ label: "", value: "" }));
    customFieldsEditor.lastElementChild.querySelector(".custom-field-label").focus();
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

    const saved = setContactDetails(contact.id, {
      phone: el.querySelector("#edit-contact-phone").value.trim(),
      email: el.querySelector("#edit-contact-email").value.trim(),
      address: el.querySelector("#edit-contact-address").value.trim(),
      preferred_contact: el.querySelector("#edit-contact-preferred").value,
      source,
      custom_fields: customFields,
    });
    contactEditDraft = null;
    const rerender = () => {
      if (options.onChange) options.onChange();
      else renderContactCard(contact, elId, options);
    };
    rerender();
    // The change shows immediately; if Supabase rejects it, the contact is
    // rolled back (js/contacts-store.js) and this re-renders the real values.
    saved.then(r => { if (r.error) rerender(); });
  });

  el.querySelector("#cancel-contact-btn").addEventListener("click", () => {
    contactEditDraft = null;
    renderContactCard(contact, elId, options);
  });
}

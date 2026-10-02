/* -------------------------------- Jobs store ----------------------------------
   Jobs live in Supabase (public.jobs) — the core fields only. A job's
   Messages, Calls, Documents, Photos, Estimates and Materials Used are still
   localStorage, keyed by the same job id ("j1", "j2", …) as always.

   Loaded right after js/contacts-store.js on every page. Once the Pipeline
   & Labels lists are loaded (js/labels.js) it:
     1. Runs the one-time migration: if the Supabase table has no rows yet,
        copies this browser's jobs (the mock seed plus every edit saved in
        localStorage) into it, keeping each job's exact id and job_number.
     2. Fetches every job into JOBS (js/data.js) and rebuilds APPOINTMENTS
        from them, the in-memory lists every page reads synchronously.
   Page scripts start rendering through whenAppReady(), which waits for
   this, so nothing renders against an empty job list.

   In Supabase a job points at its status / job type / appointment type /
   urgency by LABEL ID. In memory each job also carries the label's current
   NAME in its old field (job.status, job.job_type, …) so the rest of the
   app can keep reading names — those names are re-derived from the ids
   whenever the label lists change, so a rename shows up on every job with
   no job ever being rewritten.

   Writes update JOBS right away so the UI responds instantly, then save to
   Supabase; if Supabase rejects a save, the in-memory change is rolled back
   and the caller is told so it can re-render. */

// job field (in memory, a label NAME) ↔ Supabase column (a label ID)
const JOB_LABEL_FIELDS = [
  { kind: "status", field: "status", column: "status_id" },
  { kind: "job_type", field: "job_type", column: "job_type_id" },
  { kind: "appointment_type", field: "appointment_type", column: "appointment_type_id" },
  { kind: "urgency", field: "urgency", column: "urgency_id" },
];

function labelNameById(kind, id) {
  const entry = LABELS_CACHE[kind].find(e => e.id === id);
  return entry ? entry.name : "";
}

// Re-derives every job's label names from its label ids. Runs after every
// labels change (js/labels.js calls window.onLabelsApplied), including a
// rename saved in another tab.
function refreshJobLabelNames() {
  JOBS.forEach(job => {
    JOB_LABEL_FIELDS.forEach(({ kind, field, column }) => {
      if (job[column]) job[field] = labelNameById(kind, job[column]);
    });
  });
}
window.onLabelsApplied = refreshJobLabelNames;

// An appointment's state lives in jobs.appointment_status: 'pending' (not
// yet confirmed), 'confirmed' or 'completed'. (The older yes/no
// appointment_confirmed column is left in the table but no longer read or
// written.) These are the labels the app has always displayed for each.
const APPOINTMENT_STATUS_LABELS = {
  pending: "Pending confirmation",
  confirmed: "Confirmed",
  completed: "Completed",
};

function normalizeAppointmentStatus(value) {
  return APPOINTMENT_STATUS_LABELS[value] ? value : "pending";
}

// "09:00:00" (Postgres time) → "09:00"
function hhmm(time) {
  return time ? String(time).slice(0, 5) : "";
}

// APPOINTMENTS isn't stored anywhere: a job's appointment is part of its
// own row (appointment_date/start/end/confirmed), and this rebuilds the
// list the calendar, schedule and review code read, after every change.
function rebuildAppointments() {
  const appts = JOBS
    .filter(job => job.appointment_date && job.appointment_start && job.appointment_end)
    .map(job => ({
      id: "appt-" + job.id,
      job_id: job.id,
      start_time: job.appointment_date + "T" + hhmm(job.appointment_start),
      end_time: job.appointment_date + "T" + hhmm(job.appointment_end),
      assigned_tech: job.assigned_to,
      // A completed appointment had been confirmed before it happened.
      confirmed: job.appointment_status !== "pending",
      status: APPOINTMENT_STATUS_LABELS[job.appointment_status],
    }));
  APPOINTMENTS.splice(0, APPOINTMENTS.length, ...appts);
}

function jobFromRow(row) {
  const job = {
    id: row.id,
    job_number: row.job_number,
    contact_id: row.contact_id,
    service_type: row.service_type || "",
    date: row.created_at ? String(row.created_at).slice(0, 10) : "",
    assigned_to: row.assigned_to || "Unassigned",
    sales_rep: row.sales_rep || "Unassigned",
    quote_amount: row.quote_amount === null || row.quote_amount === undefined ? null : Number(row.quote_amount),
    intake_notes: row.intake_notes || "",
    job_location: row.location_address || "",
    appointment_date: row.appointment_date || null,
    appointment_start: hhmm(row.appointment_start) || null,
    appointment_end: hhmm(row.appointment_end) || null,
    appointment_status: normalizeAppointmentStatus(row.appointment_status),
    lead_reviewed: !!row.lead_reviewed,
    appointment_completed: !!row.appointment_completed,
    priority_resolved: !!row.priority_resolved,
    materials_deducted: !!row.materials_deducted,
  };
  JOB_LABEL_FIELDS.forEach(({ kind, field, column }) => {
    job[column] = row[column] || null;
    job[field] = labelNameById(kind, row[column]);
  });
  return job;
}

// The Supabase columns a job write touches (everything but id/created_at).
function rowFromJob(job) {
  const row = {
    job_number: job.job_number,
    contact_id: job.contact_id,
    service_type: job.service_type,
    assigned_to: job.assigned_to,
    sales_rep: job.sales_rep,
    quote_amount: job.quote_amount,
    intake_notes: job.intake_notes,
    location_address: job.job_location,
    appointment_date: job.appointment_date || null,
    appointment_start: job.appointment_start || null,
    appointment_end: job.appointment_end || null,
    appointment_status: normalizeAppointmentStatus(job.appointment_status),
    lead_reviewed: !!job.lead_reviewed,
    appointment_completed: !!job.appointment_completed,
    priority_resolved: !!job.priority_resolved,
    materials_deducted: !!job.materials_deducted,
  };
  JOB_LABEL_FIELDS.forEach(({ column }) => { row[column] = job[column] || null; });
  return row;
}

/* ------------- Legacy localStorage jobs (read by the migration only) -------------
   Every key job edits used to be saved under. They're only ever READ now,
   once, by the migration; nothing writes them anymore. They're left in
   place rather than deleted, as a backup of the pre-Supabase data. */
const LEGACY_JOB_KEYS = {
  status: "foreman-job-status",
  urgency: "foreman-job-urgency",
  appointment_type: "foreman-job-appointment-type",
  job_type: "foreman-job-type",
  sales_rep: "foreman-job-sales-rep",
  assigned_to: "foreman-job-assigned-to",
  details: "foreman-job-details",
  appointmentTime: "foreman-appointment-time",
  lead_reviewed: "foreman-leads-reviewed",
  appointment_completed: "foreman-appointments-completed",
  priority_resolved: "foreman-priority-resolved",
  materials_deducted: "foreman-job-materials-deducted",
};

function readLegacyJobStore(key) {
  try {
    const stored = JSON.parse(localStorage.getItem(key));
    if (stored && typeof stored === "object") return stored;
  } catch (e) {}
  return {};
}

// The jobs as this browser had them before Supabase: the mock seed with
// every saved edit layered on — the same merge the app used to do at load —
// plus each job's appointment and review/deduction flags folded in.
function legacyLocalJobs() {
  const stores = {};
  Object.keys(LEGACY_JOB_KEYS).forEach(k => { stores[k] = readLegacyJobStore(LEGACY_JOB_KEYS[k]); });

  return LOCAL_JOB_SEED.map(seed => {
    const job = JSON.parse(JSON.stringify(seed));
    ["status", "urgency", "appointment_type", "job_type", "sales_rep", "assigned_to"].forEach(field => {
      if (stores[field][job.id]) job[field] = stores[field][job.id];
    });
    const details = stores.details[job.id];
    if (details) {
      if (details.quote_amount !== undefined) job.quote_amount = details.quote_amount;
      if (details.intake_notes !== undefined) job.intake_notes = details.intake_notes;
      if (details.job_location !== undefined) job.job_location = details.job_location;
    }

    // Appointment: the seed appointment, with a saved time edit on top (an
    // edit could also have created one for a job that had none).
    const seedAppt = LOCAL_APPOINTMENT_SEED.find(a => a.job_id === job.id);
    const savedTime = stores.appointmentTime[job.id];
    const start = (savedTime && savedTime.start_time) || (seedAppt && seedAppt.start_time) || null;
    const end = (savedTime && savedTime.end_time) || (seedAppt && seedAppt.end_time) || null;
    job.appointment_date = start ? start.slice(0, 10) : null;
    job.appointment_start = start ? start.slice(11, 16) : null;
    job.appointment_end = end ? end.slice(11, 16) : null;
    job.appointment_status = !seedAppt ? "pending"
      : seedAppt.status === "Completed" ? "completed"
      : seedAppt.status === "Confirmed" ? "confirmed"
      : "pending";

    ["lead_reviewed", "appointment_completed", "priority_resolved", "materials_deducted"].forEach(flag => {
      job[flag] = !!stores[flag][job.id];
    });
    return job;
  });
}

// Label NAME → Supabase label ID, warning (never failing silently) when a
// job's value has no matching label.
function labelIdForMigration(kind, name, job) {
  const entry = findLabel(kind, name);
  if (entry) return entry.id;
  console.warn(`[jobs] Migration: job ${job.id} (#${job.job_number}) has ${LABEL_KINDS[kind].noun} "${name}", which doesn't match any ${LABEL_KINDS[kind].category} label in Supabase — saved with no ${LABEL_KINDS[kind].noun}.`);
  return null;
}

// Runs only while the Supabase table is empty — later loads skip it.
// ignoreDuplicates makes it safe if two tabs race: the second insert skips
// ids the first one already wrote.
async function migrateLocalJobsIfNeeded(client) {
  const { count, error } = await client.from("jobs").select("id", { count: "exact", head: true });
  if (error) throw error;
  if (count > 0) return;

  const rows = legacyLocalJobs().map(job => {
    JOB_LABEL_FIELDS.forEach(({ kind, field, column }) => { job[column] = labelIdForMigration(kind, job[field], job); });
    // created_at holds the job's open date. Noon UTC, so the calendar date
    // reads back the same in any US timezone.
    return Object.assign({ id: job.id, created_at: job.date + "T12:00:00Z" }, rowFromJob(job));
  });
  const { error: insertError } = await client.from("jobs").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
  if (insertError) throw insertError;
  console.info(`[jobs] Migrated ${rows.length} jobs from localStorage to Supabase.`);
}

async function loadJobsFromSupabase() {
  const client = window.supabaseClient;
  if (!client) throw new Error("Supabase client unavailable (see the [supabase] error above).");
  await migrateLocalJobsIfNeeded(client);
  const { data, error } = await client.from("jobs").select("*").order("job_number");
  if (error) throw error;
  JOBS.splice(0, JOBS.length, ...data.map(jobFromRow));
  rebuildAppointments();
}

// Labels first: a job's status/type/urgency names come from the label lists.
// If Supabase can't be reached, pages fall back to this browser's last local
// copy so they still render — and any edit made in that state fails to save
// and says so.
const jobsReady = labelsReady
  .then(loadJobsFromSupabase)
  .catch(err => {
    console.error("[jobs] Couldn't load jobs from Supabase — showing this browser's local copy instead. Job edits won't save until it's reachable.", err);
    const local = legacyLocalJobs();
    local.forEach(job => JOB_LABEL_FIELDS.forEach(({ kind, field, column }) => {
      const entry = findLabel(kind, job[field]);
      job[column] = entry ? entry.id : null;
    }));
    JOBS.splice(0, JOBS.length, ...local);
    rebuildAppointments();
  });

/* --------------------------------- Job writes ---------------------------------- */

// Applies `changes` to the in-memory job at once, then saves the whole job
// row to Supabase. Resolves to { error } — null on success. On failure the
// in-memory job is restored, so the next render shows what's really stored.
async function saveJobChanges(jobId, changes) {
  const job = getJob(jobId);
  if (!job) return { error: new Error("Unknown job " + jobId) };
  const before = JSON.parse(JSON.stringify(job));
  Object.assign(job, changes);
  rebuildAppointments();

  const row = rowFromJob(job);
  row.updated_at = new Date().toISOString();
  const client = window.supabaseClient;
  const { error } = client
    ? await client.from("jobs").update(row).eq("id", jobId)
    : { error: new Error("Supabase client unavailable") };

  if (error) {
    Object.keys(job).forEach(k => { delete job[k]; });
    Object.assign(job, before);
    rebuildAppointments();
    console.error("[jobs] Save failed for " + jobId + ":", error);
    alert("Couldn't save this job change: " + (error.message || error) + "\n\nNothing was changed.");
  }
  return { error: error || null };
}

// A label-backed field (status / job type / appointment type / urgency):
// the job stores the label's ID; its NAME is kept alongside for display.
function setJobLabel(jobId, kind, name) {
  const job = getJob(jobId);
  const spec = JOB_LABEL_FIELDS.find(f => f.kind === kind);
  if (!job || job[spec.field] === name) return Promise.resolve({ error: null });
  const entry = findLabel(kind, name);
  if (!entry) return Promise.resolve({ error: new Error(`No ${kind} label called "${name}"`) });
  return saveJobChanges(jobId, { [spec.field]: name, [spec.column]: entry.id });
}

// Every path that changes status — the job page's pills, a Boards drag —
// funnels through here, so this is the one place arriving at Completed (the
// last protected stage, see statusNameForRole in js/labels.js) can trigger
// Materials Used → Inventory deduction. materials_deducted is saved in the
// SAME update as the status change, and Inventory is only touched once
// that save succeeds — so it can never deduct twice, and a failed save
// never deducts at all.
async function setJobStatus(jobId, status) {
  const job = getJob(jobId);
  if (!job || job.status === status) return { error: null };
  const entry = findLabel("status", status);
  if (!entry) return { error: new Error(`No stage called "${status}"`) };

  // Only if this page has the job's Materials Used loaded — otherwise the
  // job would be marked deducted with nothing actually deducted, and the
  // once-only flag would stop it ever happening.
  const materialsLoaded = typeof materialsAvailableForDeduction === "function" && materialsAvailableForDeduction();
  const deductNow = status === statusNameForRole("completed") && !job.materials_deducted && materialsLoaded;
  const changes = { status, status_id: entry.id };
  if (deductNow) changes.materials_deducted = true;

  const result = await saveJobChanges(jobId, changes);
  if (!result.error && deductNow) deductMaterialsForJob(jobId);
  return result;
}

function setJobUrgency(jobId, urgency) { return setJobLabel(jobId, "urgency", urgency); }
function setJobType(jobId, jobType) { return setJobLabel(jobId, "job_type", jobType); }
function setJobAppointmentType(jobId, appointmentType) { return setJobLabel(jobId, "appointment_type", appointmentType); }

// Who's working this job's deal — distinct from assigned_to (the field
// tech) and from the contact's own sales_rep (whose account it is).
function setJobSalesRep(jobId, rep) {
  const job = getJob(jobId);
  if (!job || job.sales_rep === rep) return Promise.resolve({ error: null });
  return saveJobChanges(jobId, { sales_rep: rep });
}

function setJobAssignedTo(jobId, tech) {
  const job = getJob(jobId);
  if (!job || job.assigned_to === tech) return Promise.resolve({ error: null });
  return saveJobChanges(jobId, { assigned_to: tech });
}

// The Job card's Edit/Save: quote, intake notes, location — and, when all
// three pieces are given, the appointment time — in ONE save.
function setJobDetails(jobId, details, appointment) {
  const changes = {
    quote_amount: details.quote_amount,
    intake_notes: details.intake_notes,
    job_location: details.job_location,
  };
  if (appointment) {
    changes.appointment_date = appointment.date;
    changes.appointment_start = appointment.start;
    changes.appointment_end = appointment.end;
    // A job getting its FIRST appointment starts unconfirmed, as it always
    // has; rescheduling an existing one keeps its current state.
    const job = getJob(jobId);
    if (job && !job.appointment_date) changes.appointment_status = "pending";
  }
  return saveJobChanges(jobId, changes);
}

// lead_reviewed / appointment_completed / priority_resolved (the review
// checklists — see isReviewChecked in js/data.js).
function setJobFlag(jobId, field, value) {
  const job = getJob(jobId);
  if (!job || !!job[field] === !!value) return Promise.resolve({ error: null });
  return saveJobChanges(jobId, { [field]: !!value });
}

function jobsUsingLabel(kind, name) {
  const field = LABEL_KINDS[kind].jobField;
  return JOBS.filter(job => job[field] === name);
}

// Resolves to an error message, or null on success. Names must be non-empty
// and unique within their list (case-insensitively). Jobs point at labels
// by id, so a rename is just a label save — every job carrying it shows the
// new name as soon as the lists re-apply (refreshJobLabelNames above).
async function renameLabel(kind, id, rawName) {
  const name = String(rawName || "").trim();
  if (!name) return "Name can't be empty.";
  const list = getLabels(kind);
  const entry = list.find(e => e.id === id);
  if (!entry || entry.name === name) return null;
  if (list.some(e => e.id !== id && e.name.toLowerCase() === name.toLowerCase())) {
    return `There's already a ${LABEL_KINDS[kind].noun} called "${name}".`;
  }
  entry.name = name;
  const { error } = await setLabels(kind, list);
  return error ? "Couldn't save the new name: " + (error.message || error) : null;
}

/* ------------------------------- New jobs -------------------------------------- */

// Creates a job for a contact and returns it (or throws). Its job_number
// comes from Supabase's job_number_seq via next_job_number(), so it's unique
// across every browser and device; its sales_rep starts as a one-time copy
// of the contact's CURRENT rep, read fresh from Supabase; its location
// starts as a copy of the contact's address. No form calls this yet — it's
// the one sanctioned way a future "New Job" form must create a job.
async function createJobForContact(contactId, fields) {
  const client = window.supabaseClient;
  const contact = getContact(contactId);
  if (!client || !contact) throw new Error("Can't create a job: Supabase or contact " + contactId + " unavailable.");
  fields = fields || {};

  const { data: jobNumber, error: numberError } = await client.rpc("next_job_number");
  if (numberError) throw numberError;
  const salesRep = await defaultSalesRepForNewJob(contactId);

  const today = new Date();
  const localDate = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
  const firstEnabled = kind => (LABELS_CACHE[kind].find(e => e.enabled) || LABELS_CACHE[kind][0] || {}).name;

  const job = {
    id: "j" + jobNumber,
    job_number: jobNumber,
    contact_id: contactId,
    service_type: fields.service_type || "",
    date: localDate,
    status: fields.status || statusNameForRole("lead") || firstEnabled("status"),
    job_type: fields.job_type || firstEnabled("job_type"),
    appointment_type: fields.appointment_type || firstEnabled("appointment_type"),
    urgency: fields.urgency || firstEnabled("urgency"),
    assigned_to: fields.assigned_to || "Unassigned",
    sales_rep: salesRep,
    quote_amount: null,
    intake_notes: fields.intake_notes || "",
    job_location: defaultJobLocationForNewJob(contact),
    appointment_date: null,
    appointment_start: null,
    appointment_end: null,
    appointment_status: "pending",
    lead_reviewed: false,
    appointment_completed: false,
    priority_resolved: false,
    materials_deducted: false,
  };
  JOB_LABEL_FIELDS.forEach(({ kind, field, column }) => {
    const entry = findLabel(kind, job[field]);
    job[column] = entry ? entry.id : null;
  });

  const { error } = await client.from("jobs").insert(Object.assign({ id: job.id, created_at: job.date + "T12:00:00Z" }, rowFromJob(job)));
  if (error) throw error;
  JOBS.push(job);
  rebuildAppointments();
  return job;
}

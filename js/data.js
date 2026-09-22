/* Foreman — mock data layer. Mirrors the data model in CLAUDE.md. */

const TODAY = "2026-09-18";

// sales_rep here is the contact's account owner — independent of, and not
// to be confused with, a job's own sales_rep (see JOBS below). custom_fields
// is always an array (empty until the owner adds one from the Contact
// card's editor) so render code never has to guard for it being undefined.
const CONTACTS = [
  { id: "c1", full_name: "Marta Alvarez", phone: "(512) 555-0148", email: "marta.alvarez@gmail.com", address: "412 Willow Creek Rd, Austin, TX", preferred_contact: "Text", source: "Google", sales_rep: "Mike Reyes", custom_fields: [] },
  { id: "c2", full_name: "Denny Okafor", phone: "(512) 555-0117", email: "d.okafor@outlook.com", address: "88 Ridgeline Dr, Austin, TX", preferred_contact: "Call", source: "Referral", sales_rep: "Dana Ferris", custom_fields: [] },
  { id: "c3", full_name: "Priya Chandran", phone: "(737) 555-0192", email: "priya.chandran@yahoo.com", address: "215 Sunview Ln, Round Rock, TX", preferred_contact: "Email", source: "Website", sales_rep: "Unassigned", custom_fields: [] },
  { id: "c4", full_name: "Wes Trammell", phone: "(512) 555-0176", email: "wes.trammell@gmail.com", address: "3309 Oakhaven Blvd, Austin, TX", preferred_contact: "Text", source: "Facebook", sales_rep: "Mike Reyes", custom_fields: [] },
  { id: "c5", full_name: "Loretta Fenn", phone: "(512) 555-0163", email: "lfenn@icloud.com", address: "77 Cedar Park Cir, Cedar Park, TX", preferred_contact: "Call", source: "Referral", sales_rep: "Dana Ferris", custom_fields: [] },
  { id: "c6", full_name: "Sam Iturbide", phone: "(737) 555-0140", email: "sam.iturbide@gmail.com", address: "560 Barton Springs Rd, Austin, TX", preferred_contact: "Email", source: "Google", sales_rep: "Kim Osei", custom_fields: [] },
  { id: "c7", full_name: "Yolanda Briggs", phone: "(512) 555-0185", email: "yolanda.briggs@gmail.com", address: "902 Mesa Verde Trl, Austin, TX", preferred_contact: "Call", source: "Google", sales_rep: "Mike Reyes", custom_fields: [] },
  { id: "c8", full_name: "Sarah Mitchell", phone: "(512) 555-0129", email: "sarah.mitchell@gmail.com", address: "245 Travis Heights Blvd, Austin, TX", preferred_contact: "Text", source: "Referral", sales_rep: "Ray Dunmore", custom_fields: [] },
];

// job_number is the customer-facing "Job #1042" id shown on the contact
// profile's Jobs index; date is when the job was opened (used for sorting
// and display there). Neither is used internally — id remains the join key.
// sales_rep is the person who owns the deal (quoting/closing) — a distinct
// role from assigned_to (the field technician doing the work); a job's rep
// and tech can be the same person or different people.
const JOBS = [
  { id: "j1", contact_id: "c1", service_type: "Water heater replacement", job_type: "New Install", urgency: "High", status: "Scheduled", assigned_to: "Ray Dunmore", sales_rep: "Dana Ferris", quote_amount: 1850, intake_notes: "No hot water since yesterday morning. Tank is original to the house, ~14 years old, visible rust at base.", job_number: 1041, date: "2026-09-17" },
  { id: "j2", contact_id: "c2", service_type: "AC not cooling", job_type: "Repair", urgency: "High", status: "Quoted", assigned_to: "Kim Osei", sales_rep: "Ray Dunmore", quote_amount: 640, intake_notes: "Upstairs unit blowing warm air, outdoor fan not spinning. Thermostat reads 82°F.", job_number: 1036, date: "2026-09-16" },
  { id: "j3", contact_id: "c3", service_type: "Panel upgrade estimate", job_type: "New Install", urgency: "Low", status: "New Lead", assigned_to: "Unassigned", sales_rep: "Mike Reyes", quote_amount: null, intake_notes: "Wants to upgrade from 100A to 200A ahead of EV charger install. Flexible on timing.", job_number: 1035, date: "2026-09-16" },
  { id: "j4", contact_id: "c4", service_type: "Clogged main line", job_type: "Repair", urgency: "Medium", status: "Qualified", assigned_to: "Ray Dunmore", sales_rep: "Kim Osei", quote_amount: null, intake_notes: "Slow drainage at all fixtures, backing up in basement floor drain during heavy use.", job_number: 1033, date: "2026-09-15" },
  { id: "j5", contact_id: "c5", service_type: "Seasonal HVAC tune-up", job_type: "Warranty", urgency: "Low", status: "Scheduled", assigned_to: "Kim Osei", sales_rep: "Ray Dunmore", quote_amount: 189, intake_notes: "Annual maintenance, repeat customer. No known issues.", job_number: 1028, date: "2026-09-10" },
  { id: "j6", contact_id: "c6", service_type: "Outlet not working", job_type: "Repair", urgency: "Medium", status: "Completed", assigned_to: "Nia Brackett", sales_rep: "Mike Reyes", quote_amount: 220, intake_notes: "Kitchen GFCI tripped and won't reset. Two downstream outlets also dead.", job_number: 1040, date: "2026-09-17" },
  { id: "j7", contact_id: "c1", service_type: "Leaky faucet, guest bath", job_type: "Repair", urgency: "Low", status: "New Lead", assigned_to: "Unassigned", sales_rep: "Kim Osei", quote_amount: null, intake_notes: "Steady drip at cold handle, worsening over the last week.", job_number: 1044, date: "2026-09-17" },
  { id: "j8", contact_id: "c4", service_type: "Circuit breaker tripping", job_type: "Warranty", urgency: "Medium", status: "Qualified", assigned_to: "Nia Brackett", sales_rep: "Dana Ferris", quote_amount: null, intake_notes: "Breaker for garage trips within minutes of using table saw. Suspect undersized circuit.", job_number: 1032, date: "2026-09-14" },
  { id: "j9", contact_id: "c7", service_type: "Emergency pipe burst", job_type: "Repair", urgency: "High", status: "Scheduled", assigned_to: "Ray Dunmore", sales_rep: "Dana Ferris", quote_amount: null, intake_notes: "Burst supply line under kitchen sink, water shut off at the main. Needs same-weekend repair.", job_number: 1039, date: "2026-09-17" },
  // Sarah Mitchell has two separate jobs, months apart — the case that proves
  // job-scoped data (messages/calls/documents/photos) never bleeds between them.
  { id: "j10", contact_id: "c8", service_type: "Water heater replacement", job_type: "New Install", urgency: "High", status: "Scheduled", assigned_to: "Ray Dunmore", sales_rep: "Dana Ferris", quote_amount: 1780, intake_notes: "No hot water since this morning, slight moisture at the tank valve. Unit is original to the house.", job_number: 1042, date: "2026-09-16" },
  { id: "j11", contact_id: "c8", service_type: "Kitchen faucet install", job_type: "New Install", urgency: "Low", status: "Completed", assigned_to: "Ray Dunmore", sales_rep: "Kim Osei", quote_amount: 310, intake_notes: "Customer purchased a new pull-down faucet; needs the old one removed and the new one installed and tested.", job_number: 1038, date: "2026-08-10" },
];

// job_location is the address work actually happens at — its own field on
// the Job, independent of the contact's own address (same principle as
// Sales Rep: a one-time copy at creation, never a live link either way).
// These jobs were authored before the field existed, so each one is seeded
// here from its contact's address at this moment — the same rule any real
// job-creation flow must follow (see defaultJobLocationForNewJob below).
JOBS.forEach(job => {
  if (job.job_location === undefined) {
    const contact = CONTACTS.find(c => c.id === job.contact_id);
    job.job_location = contact ? contact.address : "";
  }
});

const APPOINTMENTS = [
  { id: "a1", job_id: "j1", start_time: "2026-09-18T09:00", end_time: "2026-09-18T11:00", assigned_tech: "Ray Dunmore", status: "Confirmed" },
  { id: "a2", job_id: "j5", start_time: "2026-09-18T11:30", end_time: "2026-09-18T12:30", assigned_tech: "Kim Osei", status: "Confirmed" },
  { id: "a3", job_id: "j6", start_time: "2026-09-17T14:00", end_time: "2026-09-17T15:00", assigned_tech: "Nia Brackett", status: "Completed" },
  { id: "a4", job_id: "j2", start_time: "2026-09-16T08:30", end_time: "2026-09-16T10:00", assigned_tech: "Kim Osei", status: "Pending confirmation" },
  { id: "a5", job_id: "j4", start_time: "2026-09-15T13:00", end_time: "2026-09-15T15:00", assigned_tech: "Ray Dunmore", status: "Confirmed" },
  { id: "a6", job_id: "j8", start_time: "2026-09-14T10:00", end_time: "2026-09-14T11:30", assigned_tech: "Nia Brackett", status: "Pending confirmation" },
  { id: "a7", job_id: "j9", start_time: "2026-09-19T10:00", end_time: "2026-09-19T12:00", assigned_tech: "Ray Dunmore", status: "Confirmed" },
  { id: "a8", job_id: "j7", start_time: "2026-09-20T13:00", end_time: "2026-09-20T14:00", assigned_tech: "Kim Osei", status: "Pending confirmation" },
  { id: "a9", job_id: "j10", start_time: "2026-09-19T13:00", end_time: "2026-09-19T15:00", assigned_tech: "Ray Dunmore", status: "Confirmed" },
  { id: "a10", job_id: "j11", start_time: "2026-08-12T09:00", end_time: "2026-08-12T12:00", assigned_tech: "Ray Dunmore", status: "Completed" },
];

const CALLS = [
  {
    id: "call1", job_id: "j1", timestamp: "2026-09-17T16:42", duration: "4m 12s",
    summary: "Caller reports no hot water since yesterday. Tank visibly rusted at base, unit is 14 years old. Recommended same-week replacement over repair given age. Caller agreed to a next-day morning slot.",
    outcome: "Booked appointment",
    transcript: [
      { speaker: "AI", text: "Foreman Home Services, this is Ava — how can I help today?" },
      { speaker: "Caller", text: "Hi, our water heater just stopped working, no hot water at all since yesterday." },
      { speaker: "AI", text: "Sorry to hear that. Can you tell me the age of the unit, and whether you're seeing any leaking or rust around the base?" },
      { speaker: "Caller", text: "It's original to the house so probably 13, 14 years old. There is some rust near the bottom, yeah." },
      { speaker: "AI", text: "Got it — at that age, with visible rust, replacement is usually the more cost-effective path versus repair. I can get a technician out tomorrow morning between 9 and 11, does that work?" },
      { speaker: "Caller", text: "Yes, that works." },
      { speaker: "AI", text: "Great, you're booked for tomorrow 9-11 AM with Ray. You'll get a text confirmation shortly." },
    ],
  },
  {
    id: "call2", job_id: "j2", timestamp: "2026-09-16T10:15", duration: "3m 05s",
    summary: "Upstairs AC blowing warm, outdoor fan not spinning, thermostat at 82°F. Likely capacitor or fan motor failure. Quote provided pending on-site diagnosis; caller wants firm number before booking.",
    outcome: "Quote sent, awaiting approval",
    transcript: [
      { speaker: "AI", text: "Foreman Home Services, this is Ava — what's going on with your system?" },
      { speaker: "Caller", text: "Our upstairs AC isn't cooling, it's just blowing warm air." },
      { speaker: "AI", text: "Is the outdoor unit's fan spinning when the system is running?" },
      { speaker: "Caller", text: "I checked and no, it's not moving at all." },
      { speaker: "AI", text: "That points to a capacitor or fan motor issue. I'll flag this as a priority diagnostic — I can have a rough estimate sent over today and get you scheduled this week." },
      { speaker: "Caller", text: "Okay, send the estimate first, I want to see the number." },
    ],
  },
  {
    id: "call3", job_id: "j6", timestamp: "2026-09-17T13:20", duration: "2m 40s",
    summary: "Kitchen GFCI tripped, two downstream outlets dead. Straightforward reset/replace job, same-day slot offered and accepted.",
    outcome: "Booked appointment",
    transcript: [
      { speaker: "AI", text: "Foreman Home Services, this is Ava — how can I help?" },
      { speaker: "Caller", text: "My kitchen outlet stopped working and won't reset." },
      { speaker: "AI", text: "Are any other outlets nearby also out?" },
      { speaker: "Caller", text: "Yeah, two more on the same wall." },
      { speaker: "AI", text: "Sounds like the GFCI itself may need replacing. I have Nia available at 2 PM today if that works." },
      { speaker: "Caller", text: "Perfect, see her then." },
    ],
  },
  {
    id: "call4", job_id: "j10", timestamp: "2026-09-16T11:20", duration: "3m 40s",
    summary: "Caller reports no hot water since this morning and slight moisture at the tank valve. Unit is original to the house. Recommended replacement given age; booked for Sep 19.",
    outcome: "Booked appointment",
    transcript: [
      { speaker: "AI", text: "Foreman Home Services, this is Ava — how can I help today?" },
      { speaker: "Caller", text: "Hi, we have no hot water since this morning, and I noticed a little water pooling near the base of the tank." },
      { speaker: "AI", text: "Got it — how old is the unit, and is the leak steady or just a little moisture?" },
      { speaker: "Caller", text: "It's the original tank from when we bought the house, so at least 12 years. Just a little moisture, not a steady drip." },
      { speaker: "AI", text: "At that age with a valve leak starting, replacement is usually the safer call. I can get Ray out Friday between 1 and 3 PM — does that work?" },
      { speaker: "Caller", text: "Yes, that works great." },
      { speaker: "AI", text: "Perfect, you're booked for Friday 1–3 PM with Ray. I'll text a confirmation shortly." },
    ],
  },
  {
    id: "call5", job_id: "j11", timestamp: "2026-08-09T09:05", duration: "2m 20s",
    summary: "Caller wants a new pull-down kitchen faucet installed; faucet already purchased. Straightforward swap, booked for Aug 12 morning.",
    outcome: "Booked appointment",
    transcript: [
      { speaker: "AI", text: "Foreman Home Services, this is Ava — what can we help with?" },
      { speaker: "Caller", text: "I bought a new kitchen faucet and need someone to install it." },
      { speaker: "AI", text: "Happy to help — do you have the faucet on hand already, and is this a straight swap for your existing one?" },
      { speaker: "Caller", text: "Yes, it's already here, just need the old one removed and the new one put in." },
      { speaker: "AI", text: "Great, that's a quick job. I have Ray available Wednesday morning, 9 AM to noon — does that work?" },
      { speaker: "Caller", text: "That works perfectly." },
      { speaker: "AI", text: "You're all set for Wednesday 9 AM with Ray." },
    ],
  },
];

// created_at is when the AI drafted the message — needed to place drafted
// follow-ups (which have no sent_at yet) in chronological order alongside
// MESSAGES in a job's Messages thread.
const FOLLOW_UPS = [
  { id: "f1", job_id: "j2", channel: "Email", status: "drafted", content: "Hi Denny, following up on your AC diagnosis — we've attached a firm estimate of $640 for capacitor + fan motor replacement, parts and labor included. Reply here or call us to schedule. — Foreman Home Services", created_at: "2026-09-16T10:20", sent_at: null },
  { id: "f2", job_id: "j3", channel: "SMS", status: "approved", content: "Hi Priya, thanks for reaching out about your panel upgrade! We'd love to get you scheduled for a free on-site estimate — what does next week look like for you?", created_at: "2026-09-16T08:10", sent_at: null },
  { id: "f3", job_id: "j5", channel: "SMS", status: "sent", content: "Hi Loretta, this is a reminder your seasonal HVAC tune-up is scheduled for tomorrow, 11:30 AM–12:30 PM with Kim. Reply CONFIRM to confirm.", created_at: "2026-09-16T18:00", sent_at: "2026-09-17T09:00" },
  { id: "f4", job_id: "j7", channel: "Email", status: "drafted", content: "Hi Marta, thanks for letting us know about the guest bath faucet leak. We can pair this with your water heater appointment tomorrow if you'd like — just reply yes and we'll add it on at no extra visit fee.", created_at: "2026-09-17T17:02", sent_at: null },
];

// SMS/text thread per job — distinct from FOLLOW_UPS (an AI-drafted message
// awaiting approval); these are the actual back-and-forth once a message has
// gone out. getThreadForJob() below merges both into one timeline per job.
const MESSAGES = [
  { id: "m1", job_id: "j10", sender: "ai", text: "Hi Sarah, this is Foreman Home Services confirming your water heater replacement Friday, 1–3 PM with Ray. Reply YES to confirm.", timestamp: "2026-09-17T17:00" },
  { id: "m2", job_id: "j10", sender: "contact", text: "Yes, confirmed. Thank you!", timestamp: "2026-09-17T17:04" },
  { id: "m3", job_id: "j10", sender: "ai", text: "Great, see you then. Ray will text when he's on his way.", timestamp: "2026-09-17T17:05" },

  { id: "m4", job_id: "j11", sender: "ai", text: "Hi Sarah, your kitchen faucet install is confirmed for Aug 12, 9 AM–12 PM with Ray.", timestamp: "2026-08-11T14:00" },
  { id: "m5", job_id: "j11", sender: "contact", text: "Perfect, I'll be home all morning.", timestamp: "2026-08-11T14:05" },
  { id: "m6", job_id: "j11", sender: "ai", text: "All done! Your new faucet is installed and tested. Invoice is attached — let us know if you have any questions.", timestamp: "2026-08-12T13:45" },
];

// Uploaded files per job — mocked, no real file storage yet.
const DOCUMENTS = [
  { id: "doc1", job_id: "j10", name: "Signed estimate.pdf", size: "184 KB", uploaded_at: "2026-09-17T18:10" },
  { id: "doc2", job_id: "j10", name: "Water heater spec sheet.pdf", size: "412 KB", uploaded_at: "2026-09-17T18:12" },
  { id: "doc3", job_id: "j11", name: "Signed estimate.pdf", size: "156 KB", uploaded_at: "2026-08-10T09:30" },
  { id: "doc4", job_id: "j11", name: "Invoice #1038.pdf", size: "98 KB", uploaded_at: "2026-08-12T16:45" },
];

// Job-site photos — mocked placeholders, no real image files yet.
const PHOTOS = [
  { id: "photo1", job_id: "j10", caption: "Water heater — before", uploaded_at: "2026-09-17T09:15" },
  { id: "photo2", job_id: "j10", caption: "Rust at tank base", uploaded_at: "2026-09-17T09:16" },
  { id: "photo3", job_id: "j11", caption: "Old faucet — before", uploaded_at: "2026-08-12T10:05" },
  { id: "photo4", job_id: "j11", caption: "New faucet — installed", uploaded_at: "2026-08-12T13:40" },
];

const ACTIVITY_LOG = [
  { id: "log1", type: "Call handled", related_job_id: "j1", description: "Ava answered inbound call from Marta Alvarez, diagnosed water heater issue, and booked a next-day appointment.", requires_review: false, timestamp: "2026-09-17T16:46" },
  { id: "log2", type: "Follow-up drafted", related_job_id: "j2", description: "Drafted repair estimate email to Denny Okafor for AC capacitor/fan motor replacement — awaiting your approval to send.", requires_review: true, timestamp: "2026-09-16T10:20" },
  { id: "log3", type: "Call handled", related_job_id: "j6", description: "Ava answered inbound call from Sam Iturbide and booked a same-day electrical appointment.", requires_review: false, timestamp: "2026-09-17T13:24" },
  { id: "log4", type: "Lead captured", related_job_id: "j3", description: "New lead captured from website contact form — panel upgrade estimate request from Priya Chandran.", requires_review: false, timestamp: "2026-09-16T08:05" },
  { id: "log5", type: "Follow-up sent", related_job_id: "j5", description: "Sent appointment reminder SMS to Loretta Fenn for tomorrow's HVAC tune-up.", requires_review: false, timestamp: "2026-09-17T09:00" },
  { id: "log6", type: "Follow-up drafted", related_job_id: "j7", description: "Drafted a message to Marta Alvarez offering to bundle the guest bath faucet repair with her existing appointment — awaiting your approval to send.", requires_review: true, timestamp: "2026-09-17T17:02" },
  { id: "log7", type: "Job qualified", related_job_id: "j4", description: "Flagged Wes Trammell's clogged main line as likely needing a camera inspection based on symptoms described in intake.", requires_review: true, timestamp: "2026-09-16T15:40" },
];

const STATUS_PIPELINE = ["New Lead", "Qualified", "Scheduled", "Quoted", "Completed"];

/* ------------------------------ Job status ---------------------------------
   Status can change from two places — dragging a card on the Boards page, or
   clicking a pipeline step on the job detail page — so it lives in ONE
   shared store, keyed by job id, following the same localStorage-with-
   in-memory-fallback pattern as the job-number counter above. JOBS is
   patched from that store as soon as it's read below, so every existing
   getJob()/JOBS read across the app already sees the latest status with no
   other code needing to know the store exists. setJobStatus() is the ONLY
   sanctioned way to change a job's status afterward. */
const JOB_STATUS_STORAGE_KEY = "foreman-job-status";
let inMemoryStatusOverrides = null; // fallback if localStorage throws/unavailable

function readStatusOverrides() {
  try {
    const stored = JSON.parse(localStorage.getItem(JOB_STATUS_STORAGE_KEY));
    if (stored && typeof stored === "object") return stored;
  } catch (e) {}
  return inMemoryStatusOverrides || {};
}

function writeStatusOverrides(overrides) {
  inMemoryStatusOverrides = overrides;
  try {
    localStorage.setItem(JOB_STATUS_STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) {}
}

(function applyStatusOverrides() {
  const overrides = readStatusOverrides();
  JOBS.forEach(job => {
    if (overrides[job.id] && STATUS_PIPELINE.includes(overrides[job.id])) {
      job.status = overrides[job.id];
    }
  });
})();

function setJobStatus(jobId, status) {
  const job = getJob(jobId);
  if (!job || job.status === status) return;
  job.status = status;
  const overrides = readStatusOverrides();
  overrides[jobId] = status;
  writeStatusOverrides(overrides);
}

/* ------------------------------ Job urgency ---------------------------------
   Same shape as the status store above, for the same reason: urgency shows
   up wherever a job does — the job detail page and Boards cards today,
   anywhere else it gets added later — and a change from any one of them
   must show up in all the others. setJobUrgency() is the ONLY sanctioned
   way to change it. */
const URGENCY_LEVELS = ["Low", "Medium", "High"];
const JOB_URGENCY_STORAGE_KEY = "foreman-job-urgency";
let inMemoryUrgencyOverrides = null; // fallback if localStorage throws/unavailable

function readUrgencyOverrides() {
  try {
    const stored = JSON.parse(localStorage.getItem(JOB_URGENCY_STORAGE_KEY));
    if (stored && typeof stored === "object") return stored;
  } catch (e) {}
  return inMemoryUrgencyOverrides || {};
}

function writeUrgencyOverrides(overrides) {
  inMemoryUrgencyOverrides = overrides;
  try {
    localStorage.setItem(JOB_URGENCY_STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) {}
}

(function applyUrgencyOverrides() {
  const overrides = readUrgencyOverrides();
  JOBS.forEach(job => {
    if (overrides[job.id] && URGENCY_LEVELS.includes(overrides[job.id])) {
      job.urgency = overrides[job.id];
    }
  });
})();

function setJobUrgency(jobId, urgency) {
  const job = getJob(jobId);
  if (!job || job.urgency === urgency) return;
  job.urgency = urgency;
  const overrides = readUrgencyOverrides();
  overrides[jobId] = urgency;
  writeUrgencyOverrides(overrides);
}

/* ------------------------------ Sales reps ----------------------------------
   The roster options for every Sales Rep dropdown in the app: the per-job
   field below, the per-contact field further down, and the Boards page's
   rep filter. One shared list so those three can never drift apart. */
const SALES_REPS = ["Dana Ferris", "Kim Osei", "Mike Reyes", "Ray Dunmore", "Unassigned"];

/* ------------------------- Job sales rep (per job) --------------------------
   Who's currently working this job's deal — distinct from assigned_to (the
   field technician) and from the *contact's* sales_rep further down (whose
   account this is). Same shape as the status/urgency stores: JOBS is
   patched from this store as soon as it's read below, and setJobSalesRep()
   is the ONLY sanctioned way to change it afterward. */
const JOB_SALES_REP_STORAGE_KEY = "foreman-job-sales-rep";
let inMemoryJobSalesRepOverrides = null; // fallback if localStorage throws/unavailable

function readJobSalesRepOverrides() {
  try {
    const stored = JSON.parse(localStorage.getItem(JOB_SALES_REP_STORAGE_KEY));
    if (stored && typeof stored === "object") return stored;
  } catch (e) {}
  return inMemoryJobSalesRepOverrides || {};
}

function writeJobSalesRepOverrides(overrides) {
  inMemoryJobSalesRepOverrides = overrides;
  try {
    localStorage.setItem(JOB_SALES_REP_STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) {}
}

(function applyJobSalesRepOverrides() {
  const overrides = readJobSalesRepOverrides();
  JOBS.forEach(job => {
    if (overrides[job.id]) job.sales_rep = overrides[job.id];
  });
})();

function setJobSalesRep(jobId, rep) {
  const job = getJob(jobId);
  if (!job || job.sales_rep === rep) return;
  job.sales_rep = rep;
  const overrides = readJobSalesRepOverrides();
  overrides[jobId] = rep;
  writeJobSalesRepOverrides(overrides);
}

/* ------------------------ Job assigned-to (per job) --------------------------
   The field technician doing the work — distinct from sales_rep above (who
   sold it), same principle as the contact-rep/job-rep split further down:
   two independent fields that happen to share a UI pattern (a click-to-open
   picker off the same SALES_REPS roster), never one field in two places.
   Own key, own setter; setJobAssignedTo() never touches the sales-rep
   store, and vice versa. */
const JOB_ASSIGNED_TO_STORAGE_KEY = "foreman-job-assigned-to";
let inMemoryJobAssignedToOverrides = null; // fallback if localStorage throws/unavailable

function readJobAssignedToOverrides() {
  try {
    const stored = JSON.parse(localStorage.getItem(JOB_ASSIGNED_TO_STORAGE_KEY));
    if (stored && typeof stored === "object") return stored;
  } catch (e) {}
  return inMemoryJobAssignedToOverrides || {};
}

function writeJobAssignedToOverrides(overrides) {
  inMemoryJobAssignedToOverrides = overrides;
  try {
    localStorage.setItem(JOB_ASSIGNED_TO_STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) {}
}

(function applyJobAssignedToOverrides() {
  const overrides = readJobAssignedToOverrides();
  JOBS.forEach(job => {
    if (overrides[job.id]) job.assigned_to = overrides[job.id];
  });
})();

function setJobAssignedTo(jobId, tech) {
  const job = getJob(jobId);
  if (!job || job.assigned_to === tech) return;
  job.assigned_to = tech;
  const overrides = readJobAssignedToOverrides();
  overrides[jobId] = tech;
  writeJobAssignedToOverrides(overrides);
}

/* ----------------------- Contact sales rep (per contact) ---------------------
   Who owns this contact's account — a completely separate field from any
   job's own sales_rep above, stored under its own key and keyed by CONTACT
   id, not job id. Changing one never touches the other: setContactSalesRep()
   only ever writes to this store, and setJobSalesRep() above only ever
   writes to the job store — there is no code path that lets a contact-rep
   change ripple into any of that contact's jobs, past or future. */
const CONTACT_SALES_REP_STORAGE_KEY = "foreman-contact-sales-rep";
let inMemoryContactSalesRepOverrides = null; // fallback if localStorage throws/unavailable

function readContactSalesRepOverrides() {
  try {
    const stored = JSON.parse(localStorage.getItem(CONTACT_SALES_REP_STORAGE_KEY));
    if (stored && typeof stored === "object") return stored;
  } catch (e) {}
  return inMemoryContactSalesRepOverrides || {};
}

function writeContactSalesRepOverrides(overrides) {
  inMemoryContactSalesRepOverrides = overrides;
  try {
    localStorage.setItem(CONTACT_SALES_REP_STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) {}
}

(function applyContactSalesRepOverrides() {
  const overrides = readContactSalesRepOverrides();
  CONTACTS.forEach(contact => {
    if (overrides[contact.id]) contact.sales_rep = overrides[contact.id];
  });
})();

function setContactSalesRep(contactId, rep) {
  const contact = getContact(contactId);
  if (!contact || contact.sales_rep === rep) return;
  contact.sales_rep = rep;
  const overrides = readContactSalesRepOverrides();
  overrides[contactId] = rep;
  writeContactSalesRepOverrides(overrides);
}

// The rule a new job must follow at creation time: its sales_rep starts as
// a one-time COPY of its contact's *current* sales_rep, not a live link —
// after this, editing the contact's rep never touches the job, and editing
// the job's rep never touches the contact. There's no job-creation form
// wired up in this preview yet — jobs are created from within an existing
// contact, not standalone — but whenever one exists, it must seed
// sales_rep this way rather than leaving it blank or copying assigned_to.
function defaultSalesRepForNewJob(contact) {
  return contact.sales_rep;
}

/* --------------------------- Contact details (editable) ---------------------
   The manually-editable part of a contact's own info — phone, email,
   address, preferred_contact, source, plus any custom label/value fields
   the owner adds — all saved together as one bundle per contact id, all
   through the Contact card's single Edit/Save/Cancel flow. Its own key,
   fully separate from status/urgency/sales-rep above: setContactDetails()
   never touches those stores, and none of them ever touch this one. */
const CONTACT_DETAILS_STORAGE_KEY = "foreman-contact-details";
let inMemoryContactDetailsOverrides = null; // fallback if localStorage throws/unavailable

function readContactDetailsOverrides() {
  try {
    const stored = JSON.parse(localStorage.getItem(CONTACT_DETAILS_STORAGE_KEY));
    if (stored && typeof stored === "object") return stored;
  } catch (e) {}
  return inMemoryContactDetailsOverrides || {};
}

function writeContactDetailsOverrides(overrides) {
  inMemoryContactDetailsOverrides = overrides;
  try {
    localStorage.setItem(CONTACT_DETAILS_STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) {}
}

(function applyContactDetailsOverrides() {
  const overrides = readContactDetailsOverrides();
  CONTACTS.forEach(contact => {
    const saved = overrides[contact.id];
    if (!saved) return;
    contact.phone = saved.phone;
    contact.email = saved.email;
    contact.address = saved.address;
    contact.preferred_contact = saved.preferred_contact;
    // Guarded (unlike the fields above): a bundle saved before this build
    // added Source to the Edit form won't have it, and undefined would
    // otherwise blank out a perfectly good existing contact.source.
    if (saved.source !== undefined) contact.source = saved.source;
    contact.custom_fields = Array.isArray(saved.custom_fields) ? saved.custom_fields : [];
  });
})();

// The ONLY sanctioned way to change a contact's editable details — commits
// the whole bundle (Save is one atomic action, not five separate ones).
function setContactDetails(contactId, details) {
  const contact = getContact(contactId);
  if (!contact) return;
  contact.phone = details.phone;
  contact.email = details.email;
  contact.address = details.address;
  contact.preferred_contact = details.preferred_contact;
  contact.source = details.source;
  contact.custom_fields = details.custom_fields;

  const overrides = readContactDetailsOverrides();
  overrides[contactId] = {
    phone: details.phone,
    email: details.email,
    address: details.address,
    preferred_contact: details.preferred_contact,
    source: details.source,
    custom_fields: details.custom_fields,
  };
  writeContactDetailsOverrides(overrides);
}

/* ---------------------------- Job details (editable) -------------------------
   job_type, quote_amount, intake_notes, and job_location — plain fields
   directly on the Job object, edited together via the Job card's own
   Edit/Save/Cancel flow. Mirrors the Contact card's foreman-contact-details
   store above, one key per record, but this one's keyed by job id and
   fully separate from it (and from status/urgency/sales-rep). The card's
   Edit form also edits the job's appointment time, but that's a different
   entity — see setAppointmentTime() below, its own store. */
const JOB_TYPES = ["Repair", "New Install", "Warranty"];
const JOB_DETAILS_STORAGE_KEY = "foreman-job-details";
let inMemoryJobDetailsOverrides = null; // fallback if localStorage throws/unavailable

function readJobDetailsOverrides() {
  try {
    const stored = JSON.parse(localStorage.getItem(JOB_DETAILS_STORAGE_KEY));
    if (stored && typeof stored === "object") return stored;
  } catch (e) {}
  return inMemoryJobDetailsOverrides || {};
}

function writeJobDetailsOverrides(overrides) {
  inMemoryJobDetailsOverrides = overrides;
  try {
    localStorage.setItem(JOB_DETAILS_STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) {}
}

(function applyJobDetailsOverrides() {
  const overrides = readJobDetailsOverrides();
  JOBS.forEach(job => {
    const saved = overrides[job.id];
    if (!saved) return;
    if (saved.job_type !== undefined) job.job_type = saved.job_type;
    if (saved.quote_amount !== undefined) job.quote_amount = saved.quote_amount;
    if (saved.intake_notes !== undefined) job.intake_notes = saved.intake_notes;
    if (saved.job_location !== undefined) job.job_location = saved.job_location;
  });
})();

function setJobDetails(jobId, details) {
  const job = getJob(jobId);
  if (!job) return;
  job.job_type = details.job_type;
  job.quote_amount = details.quote_amount;
  job.intake_notes = details.intake_notes;
  job.job_location = details.job_location;

  const overrides = readJobDetailsOverrides();
  overrides[jobId] = {
    job_type: details.job_type,
    quote_amount: details.quote_amount,
    intake_notes: details.intake_notes,
    job_location: details.job_location,
  };
  writeJobDetailsOverrides(overrides);
}

// The rule a new job must follow at creation time: its job_location starts
// as a one-time COPY of its contact's *current* address, not a live link —
// after this, editing the job's location never touches the contact's
// address, and editing the contact's address never touches the job's
// location. Same principle as defaultSalesRepForNewJob() above; same
// caveat too — no job-creation form is wired up in this preview yet, but
// whenever one exists, it must seed job_location this way.
function defaultJobLocationForNewJob(contact) {
  return contact.address;
}

/* -------------------------- Appointment time (editable) ----------------------
   An appointment is its own entity (APPOINTMENTS), not a field on Job, but
   the Job card's Edit form edits its date/start/end time alongside
   job_type/quote_amount/intake_notes. This app assumes at most one
   appointment per job — same assumption getAppointmentForJob() already
   makes with .find() — so this store is keyed by job id, not appointment
   id. Saving for a job with no existing appointment creates one
   (assigned_tech defaults to the job's own assigned_to, status defaults to
   "Pending confirmation"); those two fields aren't otherwise touched by
   this form. */
const APPOINTMENT_TIME_STORAGE_KEY = "foreman-appointment-time";
let inMemoryAppointmentTimeOverrides = null; // fallback if localStorage throws/unavailable

function readAppointmentTimeOverrides() {
  try {
    const stored = JSON.parse(localStorage.getItem(APPOINTMENT_TIME_STORAGE_KEY));
    if (stored && typeof stored === "object") return stored;
  } catch (e) {}
  return inMemoryAppointmentTimeOverrides || {};
}

function writeAppointmentTimeOverrides(overrides) {
  inMemoryAppointmentTimeOverrides = overrides;
  try {
    localStorage.setItem(APPOINTMENT_TIME_STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) {}
}

function findOrCreateAppointment(jobId) {
  let appt = getAppointmentForJob(jobId);
  if (appt) return appt;
  const job = getJob(jobId);
  if (!job) return null;
  appt = { id: "appt-" + jobId, job_id: jobId, assigned_tech: job.assigned_to, status: "Pending confirmation" };
  APPOINTMENTS.push(appt);
  return appt;
}

(function applyAppointmentTimeOverrides() {
  const overrides = readAppointmentTimeOverrides();
  Object.keys(overrides).forEach(jobId => {
    const appt = findOrCreateAppointment(jobId);
    if (!appt) return;
    appt.start_time = overrides[jobId].start_time;
    appt.end_time = overrides[jobId].end_time;
  });
})();

function setAppointmentTime(jobId, startTimeIso, endTimeIso) {
  const appt = findOrCreateAppointment(jobId);
  if (!appt) return;
  appt.start_time = startTimeIso;
  appt.end_time = endTimeIso;

  const overrides = readAppointmentTimeOverrides();
  overrides[jobId] = { start_time: startTimeIso, end_time: endTimeIso };
  writeAppointmentTimeOverrides(overrides);
}

/* ----------------------------- Job numbering ------------------------------
   Job numbers (the "Job #1042" shown throughout the app) must be globally
   unique and never reused — including after a job is deleted or archived.
   A persisted counter, not a scan of the current JOBS array, is what makes
   that true: JOBS is just today's snapshot of mock data and could shrink if
   a job were ever removed, but the counter only ever moves forward. It's
   seeded once — above the highest job_number already used in the mock data
   — then persisted in localStorage, following the same pattern js/theme.js
   uses for its own saved settings.

   reserveJobNumber() is the ONLY sanctioned way anything gets a job_number:
   nothing in the app should compute or reuse one another way. */
const JOB_NUMBER_STORAGE_KEY = "foreman-next-job-number";
let inMemoryNextJobNumber = null; // fallback if localStorage throws/unavailable

function highestExistingJobNumber() {
  return JOBS.reduce((max, j) => Math.max(max, j.job_number), 0);
}

function readNextJobNumber() {
  try {
    const stored = parseInt(localStorage.getItem(JOB_NUMBER_STORAGE_KEY), 10);
    if (Number.isFinite(stored)) return stored;
  } catch (e) {}
  if (inMemoryNextJobNumber !== null) return inMemoryNextJobNumber;
  return highestExistingJobNumber() + 1;
}

function writeNextJobNumber(value) {
  inMemoryNextJobNumber = value;
  try {
    localStorage.setItem(JOB_NUMBER_STORAGE_KEY, String(value));
  } catch (e) {}
}

// Hands out the next job number and advances the counter so it can never be
// handed out again, even if the job that received it is later deleted.
function reserveJobNumber() {
  const number = readNextJobNumber();
  writeNextJobNumber(number + 1);
  return number;
}

function getContact(id) { return CONTACTS.find(c => c.id === id); }
function getJob(id) { return JOBS.find(j => j.id === id); }
function getJobsForContact(contactId) { return JOBS.filter(j => j.contact_id === contactId); }
function getCallForJob(jobId) { return CALLS.find(c => c.job_id === jobId); }
function getFollowUpForJob(jobId) { return FOLLOW_UPS.find(f => f.job_id === jobId); }
function getAppointmentForJob(jobId) { return APPOINTMENTS.find(a => a.job_id === jobId); }
function getMessagesForJob(jobId) { return MESSAGES.filter(m => m.job_id === jobId); }
function getDocumentsForJob(jobId) { return DOCUMENTS.filter(d => d.job_id === jobId); }
function getPhotosForJob(jobId) { return PHOTOS.filter(p => p.job_id === jobId); }

// The Messages tab shows one merged, chronological timeline: actual sent
// texts (MESSAGES) plus this job's drafted/approved/sent follow-up, if any.
// Scoped strictly by job_id, same as every other getXForJob helper — nothing
// here can pull in another job's activity.
function getThreadForJob(jobId) {
  const messages = getMessagesForJob(jobId).map(m => ({ kind: "message", timestamp: m.timestamp, ...m }));
  const followUp = getFollowUpForJob(jobId);
  const followUps = followUp ? [{ kind: "followup", timestamp: followUp.created_at, ...followUp }] : [];
  return [...messages, ...followUps].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function formatMoney(n) {
  if (n === null || n === undefined) return "—";
  return "$" + n.toLocaleString();
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", " + formatTime(iso);
}

// Date-only formatting for the Jobs index (job.date is a plain "YYYY-MM-DD",
// not a timestamp) — e.g. "Aug 12, 2026".
function formatDateOnly(dateStr) {
  const d = new Date(dateStr + "T00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function statusBadgeClass(status) {
  const map = {
    "New Lead": "badge-lead",
    "Qualified": "badge-qualified",
    "Scheduled": "badge-scheduled",
    "Quoted": "badge-quoted",
    "Completed": "badge-completed",
  };
  return map[status] || "badge-lead";
}

function urgencyBadgeClass(urgency) {
  const map = { High: "badge-urgent", Medium: "badge-medium", Low: "badge-low" };
  return map[urgency] || "badge-low";
}

// Ray/Kim's chips reuse their existing tech-avatar colour, for identity
// consistency when the same person is both the field tech and the rep on a
// job; Mike/Dana (sales-only people, no tech avatar) get two more colours
// from the same swatch set already offered in Settings' color pickers.
// Unassigned falls back to the neutral grey used for "no one" everywhere
// else (New Lead's status badge, Low urgency).
function salesRepBadgeClass(rep) {
  const map = {
    ray: "badge-rep-ray",
    kim: "badge-rep-kim",
    mike: "badge-rep-mike",
    dana: "badge-rep-dana",
  };
  return map[techSlug(rep)] || "badge-rep-unassigned";
}

/* -------------------------------- Picker ------------------------------------
   Turns any rendered badge into a click-to-open dropdown — shared by the job
   detail page's Urgency, per-job Sales Rep and per-contact Sales Rep rows,
   by both badges on Boards cards, and by the Sales Rep badge on Contacts
   rows. pickerHtml() renders one instance (a value trigger + a menu that
   starts hidden, tagged with which field it edits and which record — job or
   contact — it belongs to); wirePickers() must be called on the containing
   element right after that HTML is inserted, same as every other
   post-innerHTML wiring step in this app (the pipeline steps,
   drag-and-drop) — one call wires every picker of every field inside that
   container. */
const PICKER_FIELDS = {
  urgency: { setValue: (id, v) => setJobUrgency(id, v), badgeClass: urgencyBadgeClass },
  sales_rep: { setValue: (id, v) => setJobSalesRep(id, v), badgeClass: salesRepBadgeClass },
  contact_sales_rep: { setValue: (id, v) => setContactSalesRep(id, v), badgeClass: salesRepBadgeClass },
  // Same roster/badge colors as Sales Rep (same people, same identity
  // colors) — a different field on the job entirely, own store above.
  assigned_to: { setValue: (id, v) => setJobAssignedTo(id, v), badgeClass: salesRepBadgeClass },
};

function pickerHtml(field, entityId, options, currentValue) {
  const badgeClass = PICKER_FIELDS[field].badgeClass;
  const rows = options.map(opt => `
    <button type="button" class="picker-option ${opt === currentValue ? "active" : ""}" data-value="${opt}">
      <span class="row-dot ${badgeClass(opt)}"></span>${opt}
    </button>
  `).join("");
  return `
    <span class="picker" data-entity-id="${entityId}" data-field="${field}">
      <button type="button" class="badge ${badgeClass(currentValue)} picker-trigger">${currentValue}</button>
      <div class="picker-menu" hidden>${rows}</div>
    </span>
  `;
}

function urgencyPickerHtml(job) {
  return pickerHtml("urgency", job.id, URGENCY_LEVELS, job.urgency);
}

function salesRepPickerHtml(job) {
  return pickerHtml("sales_rep", job.id, SALES_REPS, job.sales_rep);
}

function assignedToPickerHtml(job) {
  return pickerHtml("assigned_to", job.id, SALES_REPS, job.assigned_to);
}

function contactSalesRepPickerHtml(contact) {
  return pickerHtml("contact_sales_rep", contact.id, SALES_REPS, contact.sales_rep);
}

// Closing on an outside click/scroll is one listener shared by every picker
// on the page, rather than one per picker — cheap even on pages with none.
// Scroll is captured (not bubbled) so it also fires for scrolling inside a
// Boards column, which doesn't bubble to document on its own.
function closeAllPickerMenus() {
  document.querySelectorAll(".picker-menu:not([hidden])").forEach(menu => { menu.hidden = true; });
}
document.addEventListener("click", closeAllPickerMenus);
document.addEventListener("scroll", closeAllPickerMenus, true);

// `onChange` runs after a pick is made — the caller's own re-render, so the
// new value shows up immediately everywhere on that page.
//
// The menu is positioned in the fixed viewport (not flowed under the badge)
// so it isn't clipped by a scrolling ancestor — Boards columns scroll their
// own card list independently, and a card near the bottom of one would
// otherwise cut the dropdown off.
function wirePickers(root, onChange) {
  root.querySelectorAll(".picker").forEach(picker => {
    const entityId = picker.getAttribute("data-entity-id");
    const setValue = PICKER_FIELDS[picker.getAttribute("data-field")].setValue;
    const trigger = picker.querySelector(".picker-trigger");
    const menu = picker.querySelector(".picker-menu");

    trigger.addEventListener("click", e => {
      // preventDefault, not just stopPropagation: a picker can sit inside a
      // native <a> (Contacts rows) whose "navigate" default action isn't
      // stopped by stopPropagation alone.
      e.preventDefault();
      e.stopPropagation();
      const wasOpen = !menu.hidden;
      closeAllPickerMenus();
      if (!wasOpen) {
        const rect = trigger.getBoundingClientRect();
        menu.style.top = `${rect.bottom + 6}px`;
        menu.style.left = `${rect.left}px`;
      }
      menu.hidden = wasOpen;
    });

    menu.querySelectorAll(".picker-option").forEach(option => {
      option.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        setValue(entityId, option.getAttribute("data-value"));
        onChange();
      });
    });
  });
}

// Slug used for both the --tech-{slug}-* and tech-{slug} CSS hooks that
// js/theme.js and css/styles.css key off of (calendar.js originally defined
// this locally; shared here so dashboard.js can match tech dot colors too).
function techSlug(name) {
  return name.split(" ")[0].toLowerCase();
}

// Slug used for the --status-{slug}-grad / -fg custom properties js/theme.js
// publishes per job status.
const STATUS_SLUGS = {
  "New Lead": "lead",
  "Qualified": "qualified",
  "Scheduled": "scheduled",
  "Quoted": "quoted",
  "Completed": "completed",
};
function statusSlug(status) {
  return STATUS_SLUGS[status] || "lead";
}

// Shared trailing chevron for clickable rows (schedule rows, list rows in
// Calendar/Contacts) — one glyph so every "this row is a link" affordance
// in the app matches.
function chevronIcon(cls) {
  return `<svg class="${cls || "row-chevron"}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>`;
}

/* ------------------------------ Search -------------------------------
   Backs the global search dropdown (js/search.js, wired into the shared
   topbar on every page) and the plain Contacts directory list — one
   matching rule so results are identical everywhere text search happens. */

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function textIncludes(value, q) {
  return String(value ?? "").toLowerCase().includes(q);
}

// Lets phone-number/job-number queries match regardless of formatting, e.g.
// typing "5550148" still finds "(512) 555-0148".
function digitsInclude(value, q) {
  const digitsQ = q.replace(/\D/g, "");
  if (!digitsQ) return false;
  return String(value ?? "").replace(/\D/g, "").includes(digitsQ);
}

function jobNumberMatches(job, q) {
  return textIncludes(`job #${job.job_number}`, q) || digitsInclude(job.job_number, q);
}

// Wraps the first literal match of `q` inside `text` in <mark>. Digit-only
// matches (formatting-insensitive phone/job-number hits) have no literal
// substring to wrap, so they fall back to plain escaped text.
function highlightMatch(text, q) {
  const str = String(text ?? "");
  const safe = escapeHtml(str);
  if (!q) return safe;
  const idx = str.toLowerCase().indexOf(q);
  if (idx === -1) return safe;
  return escapeHtml(str.slice(0, idx)) +
    `<mark class="search-hit">${escapeHtml(str.slice(idx, idx + q.length))}</mark>` +
    escapeHtml(str.slice(idx + q.length));
}

function initials(name) {
  return name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// One row per contact, or per matching job when the match is job-specific
// (a job number) — the job is *why* that row matched, so the result points
// straight at it instead of the contact's profile. Empty query returns no
// results (the dropdown that consumes this hides itself on empty input).
function searchDirectory(rawQuery) {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return [];

  const contactsByName = [...CONTACTS].sort((a, b) => a.full_name.localeCompare(b.full_name));
  const results = [];
  contactsByName.forEach(contact => {
    const matchedJobs = getJobsForContact(contact.id)
      .filter(job => jobNumberMatches(job, q))
      .sort((a, b) => a.job_number - b.job_number);

    if (matchedJobs.length > 0) {
      matchedJobs.forEach(job => results.push({ contact, job }));
      return;
    }

    const contactMatch =
      textIncludes(contact.full_name, q) ||
      textIncludes(contact.address, q) ||
      textIncludes(contact.email, q) ||
      textIncludes(contact.phone, q) ||
      digitsInclude(contact.phone, q);

    if (contactMatch) results.push({ contact, job: null });
  });
  return results;
}

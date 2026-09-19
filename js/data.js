/* Foreman — mock data layer. Mirrors the data model in CLAUDE.md. */

const TODAY = "2026-09-18";

const CONTACTS = [
  { id: "c1", full_name: "Marta Alvarez", phone: "(512) 555-0148", email: "marta.alvarez@gmail.com", address: "412 Willow Creek Rd, Austin, TX", preferred_contact: "SMS", source: "Google" },
  { id: "c2", full_name: "Denny Okafor", phone: "(512) 555-0117", email: "d.okafor@outlook.com", address: "88 Ridgeline Dr, Austin, TX", preferred_contact: "Phone", source: "Referral" },
  { id: "c3", full_name: "Priya Chandran", phone: "(737) 555-0192", email: "priya.chandran@yahoo.com", address: "215 Sunview Ln, Round Rock, TX", preferred_contact: "Email", source: "Website" },
  { id: "c4", full_name: "Wes Trammell", phone: "(512) 555-0176", email: "wes.trammell@gmail.com", address: "3309 Oakhaven Blvd, Austin, TX", preferred_contact: "SMS", source: "Facebook" },
  { id: "c5", full_name: "Loretta Fenn", phone: "(512) 555-0163", email: "lfenn@icloud.com", address: "77 Cedar Park Cir, Cedar Park, TX", preferred_contact: "Phone", source: "Referral" },
  { id: "c6", full_name: "Sam Iturbide", phone: "(737) 555-0140", email: "sam.iturbide@gmail.com", address: "560 Barton Springs Rd, Austin, TX", preferred_contact: "Email", source: "Google" },
  { id: "c7", full_name: "Yolanda Briggs", phone: "(512) 555-0185", email: "yolanda.briggs@gmail.com", address: "902 Mesa Verde Trl, Austin, TX", preferred_contact: "Phone", source: "Google" },
  { id: "c8", full_name: "Sarah Mitchell", phone: "(512) 555-0129", email: "sarah.mitchell@gmail.com", address: "245 Travis Heights Blvd, Austin, TX", preferred_contact: "SMS", source: "Referral" },
];

// job_number is the customer-facing "Job #1042" id shown on the contact
// profile's Jobs index; date is when the job was opened (used for sorting
// and display there). Neither is used internally — id remains the join key.
const JOBS = [
  { id: "j1", contact_id: "c1", service_type: "Water heater replacement", category: "Plumbing", urgency: "High", status: "Scheduled", assigned_to: "Ray Dunmore", quote_amount: 1850, intake_notes: "No hot water since yesterday morning. Tank is original to the house, ~14 years old, visible rust at base.", job_number: 1041, date: "2026-09-17" },
  { id: "j2", contact_id: "c2", service_type: "AC not cooling", category: "HVAC", urgency: "High", status: "Quoted", assigned_to: "Kim Osei", quote_amount: 640, intake_notes: "Upstairs unit blowing warm air, outdoor fan not spinning. Thermostat reads 82°F.", job_number: 1036, date: "2026-09-16" },
  { id: "j3", contact_id: "c3", service_type: "Panel upgrade estimate", category: "Electrical", urgency: "Low", status: "New Lead", assigned_to: "Unassigned", quote_amount: null, intake_notes: "Wants to upgrade from 100A to 200A ahead of EV charger install. Flexible on timing.", job_number: 1035, date: "2026-09-16" },
  { id: "j4", contact_id: "c4", service_type: "Clogged main line", category: "Plumbing", urgency: "Medium", status: "Qualified", assigned_to: "Ray Dunmore", quote_amount: null, intake_notes: "Slow drainage at all fixtures, backing up in basement floor drain during heavy use.", job_number: 1033, date: "2026-09-15" },
  { id: "j5", contact_id: "c5", service_type: "Seasonal HVAC tune-up", category: "HVAC", urgency: "Low", status: "Scheduled", assigned_to: "Kim Osei", quote_amount: 189, intake_notes: "Annual maintenance, repeat customer. No known issues.", job_number: 1028, date: "2026-09-10" },
  { id: "j6", contact_id: "c6", service_type: "Outlet not working", category: "Electrical", urgency: "Medium", status: "Completed", assigned_to: "Nia Brackett", quote_amount: 220, intake_notes: "Kitchen GFCI tripped and won't reset. Two downstream outlets also dead.", job_number: 1040, date: "2026-09-17" },
  { id: "j7", contact_id: "c1", service_type: "Leaky faucet, guest bath", category: "Plumbing", urgency: "Low", status: "New Lead", assigned_to: "Unassigned", quote_amount: null, intake_notes: "Steady drip at cold handle, worsening over the last week.", job_number: 1044, date: "2026-09-17" },
  { id: "j8", contact_id: "c4", service_type: "Circuit breaker tripping", category: "Electrical", urgency: "Medium", status: "Qualified", assigned_to: "Nia Brackett", quote_amount: null, intake_notes: "Breaker for garage trips within minutes of using table saw. Suspect undersized circuit.", job_number: 1032, date: "2026-09-14" },
  { id: "j9", contact_id: "c7", service_type: "Emergency pipe burst", category: "Plumbing", urgency: "High", status: "Scheduled", assigned_to: "Ray Dunmore", quote_amount: null, intake_notes: "Burst supply line under kitchen sink, water shut off at the main. Needs same-weekend repair.", job_number: 1039, date: "2026-09-17" },
  // Sarah Mitchell has two separate jobs, months apart — the case that proves
  // job-scoped data (messages/calls/documents/photos) never bleeds between them.
  { id: "j10", contact_id: "c8", service_type: "Water heater replacement", category: "Plumbing", urgency: "High", status: "Scheduled", assigned_to: "Ray Dunmore", quote_amount: 1780, intake_notes: "No hot water since this morning, slight moisture at the tank valve. Unit is original to the house.", job_number: 1042, date: "2026-09-16" },
  { id: "j11", contact_id: "c8", service_type: "Kitchen faucet install", category: "Plumbing", urgency: "Low", status: "Completed", assigned_to: "Ray Dunmore", quote_amount: 310, intake_notes: "Customer purchased a new pull-down faucet; needs the old one removed and the new one installed and tested.", job_number: 1038, date: "2026-08-10" },
];

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

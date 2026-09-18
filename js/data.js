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
];

const JOBS = [
  { id: "j1", contact_id: "c1", service_type: "Water heater replacement", category: "Plumbing", urgency: "High", status: "Scheduled", assigned_to: "Ray Dunmore", quote_amount: 1850, intake_notes: "No hot water since yesterday morning. Tank is original to the house, ~14 years old, visible rust at base." },
  { id: "j2", contact_id: "c2", service_type: "AC not cooling", category: "HVAC", urgency: "High", status: "Quoted", assigned_to: "Kim Osei", quote_amount: 640, intake_notes: "Upstairs unit blowing warm air, outdoor fan not spinning. Thermostat reads 82°F." },
  { id: "j3", contact_id: "c3", service_type: "Panel upgrade estimate", category: "Electrical", urgency: "Low", status: "New Lead", assigned_to: "Unassigned", quote_amount: null, intake_notes: "Wants to upgrade from 100A to 200A ahead of EV charger install. Flexible on timing." },
  { id: "j4", contact_id: "c4", service_type: "Clogged main line", category: "Plumbing", urgency: "Medium", status: "Qualified", assigned_to: "Ray Dunmore", quote_amount: null, intake_notes: "Slow drainage at all fixtures, backing up in basement floor drain during heavy use." },
  { id: "j5", contact_id: "c5", service_type: "Seasonal HVAC tune-up", category: "HVAC", urgency: "Low", status: "Scheduled", assigned_to: "Kim Osei", quote_amount: 189, intake_notes: "Annual maintenance, repeat customer. No known issues." },
  { id: "j6", contact_id: "c6", service_type: "Outlet not working", category: "Electrical", urgency: "Medium", status: "Completed", assigned_to: "Nia Brackett", quote_amount: 220, intake_notes: "Kitchen GFCI tripped and won't reset. Two downstream outlets also dead." },
  { id: "j7", contact_id: "c1", service_type: "Leaky faucet, guest bath", category: "Plumbing", urgency: "Low", status: "New Lead", assigned_to: "Unassigned", quote_amount: null, intake_notes: "Steady drip at cold handle, worsening over the last week." },
  { id: "j8", contact_id: "c4", service_type: "Circuit breaker tripping", category: "Electrical", urgency: "Medium", status: "Qualified", assigned_to: "Nia Brackett", quote_amount: null, intake_notes: "Breaker for garage trips within minutes of using table saw. Suspect undersized circuit." },
  { id: "j9", contact_id: "c7", service_type: "Emergency pipe burst", category: "Plumbing", urgency: "High", status: "Scheduled", assigned_to: "Ray Dunmore", quote_amount: null, intake_notes: "Burst supply line under kitchen sink, water shut off at the main. Needs same-weekend repair." },
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
];

const FOLLOW_UPS = [
  { id: "f1", job_id: "j2", channel: "Email", status: "drafted", content: "Hi Denny, following up on your AC diagnosis — we've attached a firm estimate of $640 for capacitor + fan motor replacement, parts and labor included. Reply here or call us to schedule. — Foreman Home Services", sent_at: null },
  { id: "f2", job_id: "j3", channel: "SMS", status: "approved", content: "Hi Priya, thanks for reaching out about your panel upgrade! We'd love to get you scheduled for a free on-site estimate — what does next week look like for you?", sent_at: null },
  { id: "f3", job_id: "j5", channel: "SMS", status: "sent", content: "Hi Loretta, this is a reminder your seasonal HVAC tune-up is scheduled for tomorrow, 11:30 AM–12:30 PM with Kim. Reply CONFIRM to confirm.", sent_at: "2026-09-17T09:00" },
  { id: "f4", job_id: "j7", channel: "Email", status: "drafted", content: "Hi Marta, thanks for letting us know about the guest bath faucet leak. We can pair this with your water heater appointment tomorrow if you'd like — just reply yes and we'll add it on at no extra visit fee.", sent_at: null },
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

function getContact(id) { return CONTACTS.find(c => c.id === id); }
function getJob(id) { return JOBS.find(j => j.id === id); }
function getJobsForContact(contactId) { return JOBS.filter(j => j.contact_id === contactId); }
function getCallForJob(jobId) { return CALLS.find(c => c.job_id === jobId); }
function getFollowUpForJob(jobId) { return FOLLOW_UPS.find(f => f.job_id === jobId); }
function getAppointmentForJob(jobId) { return APPOINTMENTS.find(a => a.job_id === jobId); }

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

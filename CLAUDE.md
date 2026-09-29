# Foreman — AI CRM for home service businesses

## Data model
- Contact: full_name, phone, email, address, preferred_contact, source
- Job: contact_id, service_type, job_type (Repair, New Install, Warranty), appointment_type (Initial Appointment, Appointment), urgency, status (New Lead → Qualified → Scheduled → Estimating → Proposal Sent → Proposal Signed → Completed), assigned_to (field technician), sales_rep, quote_amount, intake_notes
- Appointment: job_id, start_time, end_time, assigned_tech, status
- Call: job_id, timestamp, duration, transcript, summary, outcome
- FollowUp: job_id, channel (SMS/email), status (drafted/approved/sent), content, sent_at
- ActivityLog: type, related job_id, description, requires_review, timestamp

## Pages to build first (fake/mock data — no live AI yet)
- Dashboard: today's stats, today's schedule, AI activity feed
- Contact/job detail: contact info, job info, call transcript, drafted follow-up
- Calendar: weekly view, appointments by technician, unscheduled leads panel

## Style
Warm paper background (#F6F4EF), deep pine green accent (#1F5C4C), serif display font (Fraunces) + sans body (Public Sans). No gradients, no generic SaaS blue.

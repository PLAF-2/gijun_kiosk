# Cancellation expiry implementation

**Goal:** Delete cancelled reservations automatically 60 seconds after cancellation; leave booked records untouched.

**Design:** Persist optional cancelledAt in the existing v1 record. Cancel stamps it once. Legacy cancellations without a timestamp begin their retention window on first load. Initialization removes expired records, saves migration/cleanup, and preserves storage warnings. A nearest-expiry timeout performs foreground deletion; focus/visibility checks catch browser suspension. A deleted completion record returns home, and open lookup results reflect deletion with a message. Remaining phone matches stay selectable.

- [x] Add cancellation timestamp and pure migration/expiry helpers.
- [x] Extend v1 validation without rejecting records missing the new field.
- [x] Hook initialization, deadline scheduling, resume checks and completion/lookup updates.
- [x] Add cancellation retention copy and README documentation.
- [x] Review source, run build and scoped diff check, then restore local dev server.

Source review identified and resolved stale cleanup writes and navigation clearing the visible storage warning. Cleanup re-reads the latest saved snapshot, with independent pending-memory persistence state. Final production build passed (exit 0; home 15.1 kB / first load 117 kB), scoped diff check passed, and local dev server was restarted on port 3105. No automated tests were added or run.

No automated tests are added or run unless requested. No GitHub push in this task.

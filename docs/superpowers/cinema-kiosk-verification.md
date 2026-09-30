# Cinema kiosk verification

## Browser flow (2026-09-30, local development)

- Ten supplied movie entries render in selection.
- Friday 2026-10-02 uses 15,000 KRW per adult; two selected seats total 30,000 KRW.
- Seeded unavailable seats are disabled. Tapping a third seat when the audience count is two leaves two selected seats.
- Review and simulated payment create a reservation code with the selected movie, date, auditorium, seats, and total.
- Immediate-cancel dialog initially focuses the confirmation action. Escape closes it and returns focus to the cancellation trigger without cancelling the booking.
- Reload returns to home; looking up the created code in lowercase restores the saved reservation with uppercase normalization.
- Lookup cancellation marks the booking cancelled and shows the already-cancelled message. The result heading receives focus.
- An unknown reservation number displays a recoverable not-found message.
- Cancelled seats are available in the same screening and can be booked again.
- Cancelling this second booking directly from the completion screen retains the receipt with the cancelled heading and focuses that heading.

These are browser-local demo transactions, with no real payment or shared inventory.

## Final pass (2026-09-30)

- At 1920 × 1080, home actions and movie continuation fit in the viewport. All ten posters loaded successfully.
- At 1280 × 720 and 390 × 844, the seat screen has no document horizontal overflow; seat-map scrolling is contained. Main controls remain at least 56 px high.
- Mobile review, completion and lookup have no document horizontal overflow.
- Returning to movie selection and continuing with the same movie preserves the screening and selected A3 seat. Reselecting the same movie no longer resets the draft.
- Demo reservation C143239 survived reload, was found using lowercase input and was cancelled with confirmation. Focus moved to the result heading. This record remains cancelled.
- Storage validation now rejects audience counts outside 1–8, unknown or duplicate seats, seat-count mismatches, malformed receipt codes and negative totals.
- Removed the unused Yakitei components, library and public assets; README is clean UTF-8.
- Browser inspection found no application errors. One development Fast Refresh warning occurred while source files were edited.
- Final `npm run build` passed, including TypeScript validation and static export (exit 0). Home first-load JavaScript is 111 kB. Next.js emitted a workspace-root warning because this worktree is nested under another npm project.
- `git diff --check` passed. Existing automated tests were not rerun during this finishing pass.
- Integrated locally into `main`. The main checkout build also passed after limiting TypeScript input to app source and Next.js configuration; unrelated temporary project copies are no longer checked. Restored the existing matching Windows SWC package from the worktree installation for local development.

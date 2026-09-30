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

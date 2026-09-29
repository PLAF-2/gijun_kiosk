# Cinema Reservation Kiosk Design

## Summary

Replace the current Yakitei food-ordering demo experience with a Korean-language cinema ticket reservation kiosk demo. Keep the existing Next.js project shell, but rebuild the customer-facing flow and its application logic for movie booking. The first version uses sample movies and screenings, a selectable seat map, simulated payment, booking lookup, and cancellation.

## Product Goals

- Let a customer complete a movie reservation using a large-touch, landscape kiosk interface.
- Make the flow clear: choose a movie, show date and time, audience count, seats, and confirm the booking.
- Support cancellation both immediately after booking and later by looking up the booking number.
- Persist demo bookings in the same browser so the booking lookup and cancellation can be demonstrated.
- Keep the first release focused on reservation; do not add concession ordering.

## In Scope

- Korean-language kiosk experience optimized for a 16:9 landscape display.
- Sample movie list with poster artwork, title, rating, runtime, and brief description.
- Sample screening dates and showtimes.
- Audience count selection.
- Seat map with available, selected, and unavailable seat states.
- Booking summary and simulated payment completion.
- Booking completion view with reservation number and a direct cancellation action.
- Home-screen booking lookup by reservation number, followed by details and cancellation.
- Cancellation confirmation and release of cancelled seats back to the available pool.
- Local browser persistence for completed and cancelled demo bookings.

## Out of Scope

- Live movie, theater, or screening data.
- Shared seat inventory, server-side reservation, or multi-device synchronization.
- Real payment processing, refunds, or payment-provider integration.
- Login, phone-number collection, membership, or discounts.
- Concession ordering, staff tools, ticket printer integration, or multi-theater administration.
- Replicating any specific cinema operator's cancellation policy.

## Primary Booking Flow

1. The home screen offers `예매 시작` and `예매 조회·취소`.
2. The customer chooses a movie from poster-led cards.
3. The customer selects a screening date and showtime.
4. The customer selects the audience count.
5. The customer selects the same number of seats from the seat map. Occupied seats are disabled and visibly distinct.
6. The customer reviews the movie, screening, audience count, seats, and total price.
7. A demo payment action completes the reservation without contacting a payment service.
8. The completion screen displays a reservation number, booking details, and an `예매 취소` action. A `처음으로` action returns to the home screen.

## Cancellation Flow

Two entry points are supported:

1. **Immediate cancellation:** the completion view can cancel the reservation just created.
2. **Later cancellation:** the home screen opens a booking lookup view where the customer enters a reservation number, checks the reservation details, and chooses to cancel.

Both paths show a confirmation step before cancellation. After cancellation, the reservation is marked cancelled, its seats become available in the demo seat map, and the customer sees a cancellation confirmation. Unknown and already-cancelled reservation numbers produce clear messages and allow another lookup.

The demo does not collect personal details. A reservation number is sufficient to find a booking in the local browser store. Cancellation policy is a demo rule, not a representation of a particular cinema's rules.

## Screen Structure

### 1. Home

- Cinema wordmark/title.
- `예매 시작` primary action.
- `예매 조회·취소` secondary action.
- Brief guidance for starting a reservation or retrieving an existing one.

### 2. Movie Selection

- Poster, title, age rating, runtime, and short description for each sample movie.
- Large selectable cards and a visible continue action.

### 3. Screening Selection

- Date selector and showtime cards.
- Each showtime shows a demo auditorium and remaining-seat hint.
- Changing the movie or showtime clears downstream seat selection.

### 4. Audience and Seat Selection

- Audience count control.
- A seat map with a screen indicator, row labels, and clear available/selected/unavailable states.
- Selected seat count and current total remain visible.
- The continue action stays disabled until the selected-seat count equals the audience count.

### 5. Booking Review and Demo Payment

- Summary of movie, screening, audience count, selected seats, and price.
- One clearly labeled simulated payment action.
- Back navigation preserves valid selections; changing the showtime resets seats.

### 6. Booking Complete

- Reservation number and booking details.
- Direct `예매 취소` and `처음으로` actions.

### 7. Booking Lookup and Cancellation

- Reservation number entry using an on-screen numeric keypad or simple kiosk-friendly input.
- Matching reservation details and cancellation action.
- Confirmation screen and explicit result state.

## Visual Direction

- Use a 16:9 landscape composition designed for touchscreen use.
- Use a dark navy base with a bright accent color and high-contrast text.
- Let movie posters anchor the movie-selection screen.
- Keep navigation and primary actions large, consistent, and easy to reach.
- Pair seat-state colors with text or symbols so state does not rely on color alone.
- At narrower viewports, stack panels while preserving the same booking sequence.

## Architecture and Data Flow

- Keep the existing Next.js App Router shell and replace the current restaurant-oriented entry experience with the cinema kiosk.
- Organize the booking flow as focused screens under `src/components/cinema` and a central `KioskApp` that owns step transitions and in-progress selection state.
- Store sample movies, screenings, seat layouts, and base ticket prices in focused modules under `src/lib/cinema`.
- Keep booking operations in pure helpers: price calculation, seat validation, booking creation, lookup, and cancellation.
- Store demo reservations in a versioned `localStorage` key. Persist reservation number, screening, audience count, seats, total, and booking status.
- When a booking completes, mark its selected seats unavailable for that screening. When cancelled, mark it cancelled and make those seats available again.
- Treat malformed or unavailable local storage as an empty demo store and continue to show the sample catalog.
- Clear seat selection if the selected movie, date, or showtime changes. Preserve valid selections when navigating back within the same screening.

## Error Handling and Edge Cases

- Prevent continuing without a movie, screening, audience count, or the matching number of seats.
- Prevent selection of unavailable seats and prevent selecting more seats than the audience count.
- Clear seat selection after changing screening so seats from another showtime cannot be submitted.
- Show a recoverable message for unknown reservation numbers and allow another attempt.
- Prevent duplicate cancellation and explain when a reservation is already cancelled.
- After cancellation, update the seat map and booking lookup result from the same local store.
- If persisted data cannot be read, continue with empty reservations rather than blocking a new demo booking.

## Verification Plan

- Check helper behavior for seat-count validation, total calculation, booking creation, lookup, and cancellation seat release.
- Walk through the full booking flow, including changing a screening and confirming that previous seat selections are cleared.
- Walk through immediate cancellation and lookup-based cancellation, including unknown and already-cancelled booking numbers.
- Confirm local persistence survives a page reload in the same browser and that the interface remains usable at kiosk landscape and narrow viewport sizes.

## Success Criteria

- A customer can complete a sample movie reservation with a valid set of seats and see a unique reservation number.
- A customer can cancel from the completion screen or by looking up that reservation number from the home screen.
- Cancelled seats become selectable again; unavailable seats cannot be selected.
- The kiosk experience contains no Yakitei food-ordering content and makes no real payment or live inventory calls.

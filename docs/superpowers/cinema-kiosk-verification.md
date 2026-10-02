# Cinema kiosk verification

## Release preparation (2026-10-02)

- Final entry settings are 1,000 ms opening plus 100 ms revealed-poster hold (1,100 ms until movie selection). README and the CSS fallback match the runtime constants.
- Reviewed the movie-information, benefit-price, optional-phone, seat-view, completion, theme and souvenir integrations for this release. Production build passed with exit 0, including type validation and static export (137 kB home first-load JavaScript).
- Automated tests and fresh browser flow/layout checks were not run. Remote main was confirmed at the local base commit before the authorized push; unrelated workspace documents and temporary assets are excluded from the release commit.

## Slower entry and optional telephone (2026-10-02)

- Entry now opens over 1,800 ms, then holds the revealed posters for 1,000 ms before movie selection. The animation duration comes from the same constant via a CSS variable. Immediate skip, reduced-motion entry and cleanup remain in place.
- Added shared optional-phone validation: empty/undefined values permit payment; supplied numbers still require the existing 010 plus eight digits format. Applied it to the review action, final payment handler and reservation attempt. Empty values are omitted by the existing reservation creator and accepted by storage validation; telephone lookup still requires a valid registered number.
- Updated the field label and hint to explain optional entry and reservation-code lookup for unregistered numbers.
- Initial build hit the known OneDrive `EINVAL readlink` cache problem. Moved only the generated `.next` cache to a validated workspace temporary path; the replacement production build passed with exit 0. Local page returned HTTP 200 and `git diff --check` passed. No browser payment/animation exercise, automated tests, commits or pushes were run.

## Door-first home and seven palettes (2026-10-02)

- Replaced the home copy/door split with a large centered theater door and secondary supporting copy and lookup controls underneath. Removed the separate booking-start button; the door remains a native labelled button. Existing entry guards, skip, reduced-motion behavior and timer cleanup are retained.
- Both door leaves clip the same full-width, six-column CINEMA title. Their shared center falls between the third (N) and fourth (E) columns, keeping the closed title centered and splitting it with the opening doors. Responsive CSS retains the door as the main element on small screens.
- Extended the shared souvenir palette list with sunset, blossom, film and neon, for seven choices total. The existing preview and PNG exporter consume the same palette data.
- Production build passed with exit 0, including type validation and static export; development page returned HTTP 200; `git diff --check` passed. No browser layout/animation inspection, image download exercise, automated tests, commits or pushes were performed.

## Theme surface continuity (2026-10-02)

- The submitted completion screenshot showed a solid green rectangle within a purple ticket. Source review found that the shell's themed `.booking-summary` rule and the receipt's transparent summary rule had equal specificity, making the result depend on stylesheet order. Restricted the raised summary background to direct screen-card summaries so nested receipt summaries stay transparent.
- Replaced fixed purple completion, credits, ticket border, text and action colors with the current movie's existing CSS variables. The ticket now has one continuous surface through its header and receipt. Removed the edge notch pseudo-elements that looked clipped, retained section separators and adjusted receipt type/column spacing. Posters use contain sizing.
- Matched the surrounding souvenir controls, seat-view panel/dialog and movie-info panel/dialog to the same theme variables. The independently selectable souvenir image palette is retained.
- Production build passed with exit 0, including type validation and static export; local development page returned HTTP 200; `git diff --check` passed. Browser visual inspection and interaction tests were not performed. No automated tests, commits or pushes were run.

## Playful experience and themed UI (2026-10-02)

- Added a home theater-door entry lasting about 0.8 seconds, immediate skip and reduced-motion entry. Pending entry timers are cleared on lookup and unmount; repeated entry is guarded.
- Added ten movie-specific decorative SVG backgrounds and scoped UI variables for panels, borders, primary actions, selected theaters/screenings and benefit surfaces. Booked/open seat styles and payment-brand colors remain distinguishable. Decorations do not capture input and animation respects reduced motion.
- Added unique star, footprint and logo-film discoveries with accessible touch/keyboard controls, a short announcement and souvenir stamps. Discovery state belongs to the current visit and resets on the home action.
- Added phrase/color customization, live souvenir preview and user-triggered Canvas PNG export using local posters. Images exclude telephone numbers and barcodes. Export has a poster fallback, duplicate-action guard, cancellation/unmount abort and temporary object URL cleanup. Cancelled reservations cannot export. Customization and stamps are not persisted with reservations.
- Final `GITHUB_REPOSITORY=PLAF-2/gijun_kiosk` production build passed with exit 0, including compilation, type validation and static export. Home first-load JavaScript is 137 kB. Local development page returned HTTP 200 and `git diff --check` passed.
- Browser interactions, responsive visual inspection and actual PNG downloads were not exercised. No automated tests, commits or pushes were performed.

## Seat view and ending credits (2026-10-02)

- Added a native seat-view dialog using the selected screening's row order, physical columns and aisle spacing. Screen size, lateral offset and trapezoid proportions change by seat position; selected seats can be compared without changing the booking. The scene is explicitly marked as an estimate, not surveyed theater geometry or a photo.
- Source-reviewed dialog open/close, Escape default behavior, body scroll cleanup and trigger focus restoration, including selected-seat removal fallback.
- Added a receipt-keyed 7.4-second ending-credits component and poster ticket. Skip reveals and focuses the ticket; reduced-motion preferences and cancellation show it immediately. Timers and media listeners are cleaned up. Storage warnings and cancel/home actions remain above the animation; existing receipt totals and cancellation dialog are retained.
- `GITHUB_REPOSITORY=PLAF-2/gijun_kiosk` production build passed with exit 0 (compile, type validation, static export). Home first-load JavaScript is 129 kB. Local development page returned HTTP 200 afterward; `git diff --check` passed.
- No browser interaction or layout inspection, automated tests, commits or pushes were performed for these changes.

## Benefit count controls (2026-10-02)

- Removed all upper-card add-action text. Selecting an unselected priority-benefit card adds it at 1 attendee; selected cards are disabled and cannot increment counts. Increasing and decreasing counts is available only in the lower selected-benefits list.
- Replaced category expansion plus/minus glyphs with chevrons, changed the picker heading to 대상 선택, and shortened the option cards. Existing audience and companion limits remain in the shared calculation.
- Production build completed with exit 0, `git diff --check` passed, and the local development page returned HTTP 200. No automated tests, commits or pushes were performed.

## Benefit wording and audience limit (2026-10-02)

- Confirmed from the submitted screen and source that all benefit additions are disabled once the benefit audience count equals the selected booking audience. One selected attendee therefore allows one priority-price attendee. No audience or companion constraints were removed.
- Changed customer-facing discount/coupon wording to 혜택 in selection, payment, receipt rows and booking errors. Existing saved line labels are converted for display. The capacity message now includes the selected audience count.
- A production build encountered OneDrive `EINVAL readlink` on a generated manifest. Moved the generated `.next` cache into a workspace temporary backup and rebuilt successfully (exit 0). The development page returned HTTP 200. `git diff --check` passed.
- No automated tests, commits or pushes were performed.

## Development server recovery (2026-10-01)

- Reproduced HTTP 500 at `http://127.0.0.1:3105/`. The running development server logged missing `.next/server/app/page/build-manifest.json` after a production build replaced its shared cache.
- Separated generated directories: development uses `.next-dev/`, production uses `.next/`. Added development generated types to TypeScript input and ignored the development cache in Git.
- Restarted the local server on port 3105, then ran the production build while it remained active. Build completed with exit 0; the local page, stylesheet and JavaScript asset all returned HTTP 200 afterward.
- No automated tests, commits or pushes were performed.

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

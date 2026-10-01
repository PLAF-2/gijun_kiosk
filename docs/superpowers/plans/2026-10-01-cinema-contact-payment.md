# Cinema contact and payment UI

User-approved changes from browser comments and follow-up instructions (2026-10-01).

- Remove the nine specified UI text fragments; preserve the first home description sentence and change the footer to 영화 예매. Remove only 10편 from the poster caption.
- Require a normalized 010 phone number of eleven digits at booking review. Store it as an optional reservation field so existing records remain readable.
- Offer code and phone lookup modes. Phone lookup uses exact matching, lists multiple bookings with their status, and reuses the confirmed cancellation flow. No phone verification or SMS service is connected.
- Add a payment stage after review. Offer IC card, Samsung Pay, Apple Pay, Kakao Pay, Naver Pay, Toss Pay and cash. Selecting a method opens the corresponding insert/tap/scan/cash instruction; completion uses the existing local reservation function and stores the method. No money or payment credentials are collected.
- Update storage validation for optional phone/payment fields, receipt and lookup labels, README, and the existing review-action assertion. Do not add or run tests in this change.

Reference: https://docs.tossplace.com/guide/front-integration/getting-started.html. These are representative terminal methods, not a claim of CGV branch support.

Verification: compile with npm run build; inspect the diff and perform a focused code review.

Completed: all requested copy changes and contact/payment flows implemented. npm run build passed, including TypeScript and static export, on 2026-10-01. Scoped git diff --check passed. Focused code review reported no concrete runtime bugs. Existing review-action assertion was updated; no tests were added or run. Changes remain local pending a push request.

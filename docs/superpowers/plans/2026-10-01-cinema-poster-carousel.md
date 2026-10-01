# Cinema poster carousel implementation plan

**Goal:** Display large portrait posters in one horizontally scrollable row, as requested and approved in chat.

**Architecture:** Keep the existing movie selection callbacks and catalogue. Use a native scrolling flex row with scroll snapping, touch gestures and accessible previous/next buttons. Poster and metadata must never shrink into cropped thumbnails.

**Tech stack:** React, TypeScript, CSS; no new dependency.

- [x] Update `src/components/cinema/movie-screen.tsx`: bind a scroller ref, synchronize edge buttons on scroll/resize, scroll by a visible page on arrow clicks, respect reduced motion and bring the selected movie back into view on return.
- [x] Update `src/app/globals.css`: one nonwrapping flex row, nonshrinking cards, portrait images with `object-fit: contain`, readable titles, contained horizontal overflow and a compact layout for short landscape screens. Apply the same carousel to mobile.
- [x] Compile using `npm run build`; no test files or test suite changes are requested. Build and TypeScript validation passed (exit 0), as did the scoped `git diff --check`.

The user previously declined browser mockup planning. The chosen layout replaces the two-row film grid; reservation and cancellation behavior stay in the existing parent component.

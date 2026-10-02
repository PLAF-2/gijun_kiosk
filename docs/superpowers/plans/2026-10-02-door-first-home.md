# Door-first home and souvenir palettes

**Goal:** Make the theater door the main booking entry, splitting the centered CINEMA title between N and E, and provide seven souvenir palettes.

**Architecture:** Keep the existing guarded entry timer, skip, reduced-motion entry and lookup behavior. Replace the home layout with a large door and secondary supporting copy. Each door clips one identical six-column title, aligned across their shared seam. Use the existing shared souvenir theme list for both preview and PNG export.

- [x] Replace home composition in `start-screen.tsx`; remove the separate booking-start button and keep native accessible door input, lookup and skip.
- [x] Replace `cinema-entry.module.css` with a responsive central door, matching title halves and secondary supporting controls.
- [x] Add sunset, blossom, film and neon palettes to `ticket-image.ts`; existing preview/export consumers enumerate this list.
- [x] Review source, build static export, inspect local HTTP response and record limitations. No tests, commits or pushes.

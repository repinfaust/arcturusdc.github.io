Original prompt: create a new web app within /apps/stea called art-atlas. Attached prompt asks for an interactive browser-based 3D art museum of art history: zoomable infinite-canvas timeline, artist cards, first-person walkable galleries, Wikipedia/Wikimedia-sourced data, realistic lighting, and short check-ins.

## Progress

- Read root SoRR (`CLAUDE.md`, `planning/PROJECT_CONTEXT.md`, `planning/DECISIONS.md`, `planning/FINDINGS.md`) and found no app-level SoRR for `src/app/apps/stea`.
- User selected timeline direction B: Cosmos.
- User asked whether existing Firebase could be used instead of Neo Postgres. Decision recorded in `planning/DECISIONS.md`: use existing Firebase/Admin as optional read cache; no Neo Postgres; local Wikipedia/Wikimedia-sourced fallback remains required.
- Installed `three` for the 3D gallery.
- Added source catalogue under `src/lib/art-atlas/` and same-origin API routes under `src/app/api/art-atlas/`.
- Added `/apps/stea/art-atlas` route with constellation timeline, artist placard, and Three.js walkable gallery.
- Natural break taken after browser verification showed the timeline, placard, and visible 3D Degas gallery. User pivoted to `/apps/app-store` before final Art Atlas hook/browser test cleanup.
- Added an unrestricted Art Atlas card to the STEa launcher and a route-local access gate that allows any signed-in STEa member or super-admin, regardless of selected workspace.
- Improved gallery polish with shadows, bench/baseboards, back-wall artist title, glazing, movement help, and stable `render_game_to_text` / `advanceTime` hooks for timeline and gallery verification.
- `npm run build` passes; postbuild changelog leak test passes. Local browser verification confirmed protected-route handoff and explicit Firebase config failure handling. Direct API checks returned 15 periods, 45 artists, and 12 image-backed Degas works.
- User reported “no art”; attached browser log showed CORS failures loading Wikimedia Commons `Special:FilePath` redirects in Three.js textures. Fix in progress: preserve original Wikimedia URL as `imageSource`, serve `image` via a restricted same-origin `/api/art-atlas/image` proxy, and keep source links visible in the inspect panel.
- CORS fix verified locally: Degas API returns proxied same-origin artwork URLs, the image endpoint returns `200 image/jpeg`, Wikimedia originals are requested at `width=1400`, upstream image fetch uses `cache: no-store` to avoid Next data-cache >2MB errors, and `npm run build` / postbuild leak test pass.
- Added a preferred Hieronymus Bosch work overlay sourced from Wikidata/Wikimedia IDs and file paths. Bosch now returns a stable 12-work gallery including Garden of Earthly Delights, The Haywain Triptych, Temptation of St. Anthony, The Last Judgment, Ship of Fools, Death and the Miser, Seven Deadly Sins, Adoration of the Magi, Cutting the Stone, The Wayfarer, St. John on Patmos, and The Tree-Man. Added search aliases for "Hieronymous Bosch" and "Jheronimus Bosch".
- Fixed first-person gallery controls so WASD/arrow movement follows the gallery axes regardless of head/look yaw, matching the app-store correction. Also tightened each artist gallery's back wall from the final artwork position to remove excess empty space at the end.
- Verification: `npm run build` passes with the existing postbuild changelog leak test. The develop-web-game Playwright client could not be run in this checkout because the `playwright` package is not resolvable; local full walkthrough also still depends on valid Firebase client config and an authorised STEa session.

## TODO

- Full in-browser gallery walkthrough still requires a valid local Firebase client config and an authorised STEa session; the unauthorised/local-invalid state is now handled explicitly.

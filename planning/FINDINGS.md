# Findings

---

## 2026-02-07 — Added Next.js page update guidance
**What happened:** Documented Next.js App Router page update rules.  
**Root cause:** Needed explicit rules for updating pages and assets.  
**Fix / workaround:** Added guidance to `README.md` and `planning/PROJECT_CONTEXT.md`.  
**Promote to global?** yes — `~/.dev-knowledge/web/nextjs-app-router-page-updates.md`

---

## 2026-05-19 — STEa admin tools are no longer purely static
**What happened:** The Dialled MTB workspace's User Feedback tool requires server-side Firebase Admin reads and Storage signed URLs under `/apps/stea/dialled-mtb`.  
**Root cause:** Dialled MTB mobile feedback is intentionally write-only from the client, so an internal admin surface cannot safely use client Firestore reads or loosen Firebase rules.  
**Fix / workaround:** Keep public site static by default, but document narrow STEa internal-tool backend exceptions and require existing STEa session + workspace access checks.  
**Promote to global?** no

---

## 2026-09-27 — Tailwind must not scan the self-contained PMR export
**What happened:** A clean production build failed with `RangeError: Maximum call
stack size exceeded` inside Tailwind's default extractor while compiling
`globals.css`. Development and standalone CSS compilation could pass, so they
did not demonstrate production build health.

**Root cause:** The broad `public/**/*.html` content glob included the
self-contained PMR concept export from D-SITE-029. Its embedded media/bundle
includes a roughly 14 MB line and is not source for the host site's Tailwind CSS.
An uninstrumented, cache-free baseline build reproduced the failure. Excluding
only this file made the otherwise unchanged cache-free production build pass.

**Fix:** Added `!./public/apps/pmr/concept.html` to Tailwind's content inputs.
The export already supplies its own styles and remains byte-for-byte unchanged;
the public URL, static serving and noindex headers are preserved. All application
source and the two game HTML inputs remain scanned. No stack-limit increase,
error suppression, dependency upgrade or export rewrite was needed.

**Verification:** `npm run build` on Node 20.19.5 passed, including the postbuild
leak check (zero matches across 17 forbidden strings). The production server
served all four Returno routes and their CSS/images; the three legal HTML files
were included in their function traces. The PMR rewrite served identical bytes
to the source with its existing noindex header.

**Promote to global?** no — repository content-glob boundary.

---

## YYYY-MM-DD — <Finding title>
**What happened:**  
**Root cause:**  
**Fix / workaround:**  
**Promote to global?** yes/no

---

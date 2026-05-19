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

## YYYY-MM-DD — <Finding title>
**What happened:**  
**Root cause:**  
**Fix / workaround:**  
**Promote to global?** yes/no

---

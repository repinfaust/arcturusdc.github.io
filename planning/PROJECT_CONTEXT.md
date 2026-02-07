# Project context

## What this repo is
- App / service: ArcturusDC marketing site and app pages.
- Primary user: Prospective users of ArcturusDC apps/services.
- Core outcome: Provide product pages, policies, and download links.

## Stack
- Platform: Next.js (App Router).
- Language/framework: React + Next.js.
- Backend: None (static pages).
- Auth: None.
- Payments: None.
- Analytics/telemetry: Not configured in repo.
- CI/CD: Vercel (git-based deploys).

## Environments
- Local: `npm run dev` on http://localhost:3000/.
- Dev: Vercel preview deployments.
- Staging: Not defined.
- Prod: Vercel production deployment.

## Constraints (non-negotiables)
- Compliance: App store policy pages must remain accessible and readable.
- Data handling: No user data collection in site code.
- Performance: Keep media optimized; use `next/image` for local images.
- Accessibility: Maintain semantic headings, alt text, and accessible links.
- Offline requirements: None.

## Non-goals (explicit)
- Not doing: App backend or authentication.
- Not supporting: Complex dynamic server rendering.

## Overrides vs global knowledge
List any intentional differences from your normal patterns.

## Updating pages (rules)
- App Router pages live under `src/app/`.
- Route segments map to folders; `page.js` defines the route.
- Shared app metadata for cards lives in `src/data/apps.json`.
- Static assets live in `public/` and are referenced by absolute `/...` paths.

## Links
- Repo:
- Issue tracker:
- Deploy:
- Store listing:
- Design:
- Docs:

# ArcturusDC — Next.js site
Run:
```
npm install
npm run dev
```
Then open http://localhost:3000/

## Updating pages
- App Router pages live under `src/app/` (route segments map to folders).
- Shared app metadata for cards lives in `src/data/apps.json`.
- Static assets (images, videos, downloadable files) live in `public/`.
- Use `next/link` for internal routes and `next/image` for local images.

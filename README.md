# Arcturus Digital Consulting — Static Site

This repository hosts the public website for Arcturus Digital Consulting.

## Quick start (GitHub Pages)
1. Create a new public repo (e.g. `arcturusdc.github.io` or `website`).  
2. Put these files in the repo root (or in `docs/` and change Pages source accordingly).
3. In **Settings → Pages**, set **Source** to **Deploy from a branch** and choose `main` and `/ (root)`.
4. Add your custom domain `arcturusdc.com` in **Settings → Pages** and save.
5. In Namecheap DNS, create two records:
   - `A` records for root `@` pointing to GitHub Pages IPs: 185.199.108.153 / 185.199.109.153 / 185.199.110.153 / 185.199.111.153
   - `CNAME` for `www` → `arcturusdc.com`
6. Wait for DNS to propagate, then enable HTTPS in GitHub Pages.

Alternatively, deploy to **Netlify** or any static host.

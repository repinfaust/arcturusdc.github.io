# Dialled MTB changelog — adding a release

One file per release. Drop it in this folder, commit, push. That's the whole job.

## Minimal template (copy this)

```mdx
---
id: my-release-slug
date: 2026-06-15
featureIds: [tyre_config]
type: feature
title: Short human title
---

One or two sentences on what shipped and why it matters to riders.
```

Only those **5 fields are required**. The body text (below the `---`) is the
release notes — plain markdown, optional.

## All fields

| Field | Required | What it is |
|---|---|---|
| `id` | ✅ | kebab-case slug, unique across all releases. Becomes the permalink: `/apps/dialled-mtb/changelog/release/<id>` |
| `date` | ✅ | `YYYY-MM-DD` |
| `featureIds` | ✅ | which tree node(s) this release advances (list). See ids below. |
| `type` | ✅ | `feature` \| `improvement` \| `fix` |
| `title` | ✅ | short human title |
| `version` | — | e.g. `2.0.6`. Omit for backend/web changes with no app version |
| `platform` | — | list from `ios`, `android`, `backend`, `web` |
| `media` | — | list of `{ src, alt, caption? }`. Put images in `public/changelog/` and use `/changelog/<file>.png` |
| `visibility` | — | `public` (default) or `internal` (kept off the public site) |

A feature node with at least one **public** release shows as **Live** on the
tree automatically — status is derived from these files, never hand-edited.

## With a screenshot

```mdx
---
id: tyre-config-2-1-0
date: 2026-07-01
featureIds: [tyre_config]
type: feature
title: Tyre configuration upgrade
version: 2.1.0
platform: [ios, android]
media:
  - src: /changelog/tyre-config-casing.png
    alt: Casing selector on the setup screen
    caption: Brand → Model → Width → Casing
---

PSI output now reflects casing, tubeless status and rim insert.
```

Screenshots are the value — add one whenever there's anything visual.

## Feature ids

`core_loop`, `imperial`, `sync_harden`, `default_intervals`, `health_mileage`,
`strava_gear`, `calculators`, `advisor`, `tyre_config`, `bikestate`, `gravel`,
`conf_chips`, `writeback`, `component_setup`, `nfc_switch`, `coach_share`,
`coach_mode`, `emergency_tag`, `verified_service`, `uplift`

(The full list, including internal nodes, lives in
`src/lib/dialled-changelog/features.js`.)

A malformed file **fails the build** with a message naming the file and the
problem, so you can't silently break the page.

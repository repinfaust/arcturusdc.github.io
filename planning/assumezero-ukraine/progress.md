Original prompt: “claude ccode commited your spec, let's build please, on a new sub url?”

David explicitly overruled the UK pilot and partnership prerequisites for the local adult-review build. D-SITE-098 records the scope at `/apps/assumezero/ukraine`.

- Added the Ukrainian text-first prototype, with two teaching sessions, fresh practice, two assessment forms, and a repair activity.
- Both editions use the shared static entry point, deck loading, and run progression. The existing UK presentation and scoring policy live in `uk-feed.js`.
- Ukrainian educator review, narration, and offline delivery remain follow-up work for an agreed pilot scope.
- Verified the local route in Chrome. Exercised evidence selection and revision, keyboard focus after closing help, skip and stop, repair, assessment without teaching feedback, and the session summary. Checked same-origin GET requests and empty learner storage. Reviewed desktop and 390px screenshots and checked reflow at 320px.
- Ran the UK game through its existing iframe from warm-up through the feed, Creator Mode, final assessment and replay. Mapped the directory URL to the static entry and fixed the pending video play/pause race found during that run.

To review locally, run `npm run dev -- --hostname 127.0.0.1 --port 3093` and open `http://127.0.0.1:3093/apps/assumezero/ukraine`. Choose the first exercise, pick “Поки не знаємо” (not enough evidence), then use “Перевірити” (check) to open the original source and revise the answer.

- Revised the play screen after David's visual feedback. Practice posts have a scene slot, the source check comes first, and the pause dialog offers return, skip and finish. The [art prompt sheet](IMAGE_PROMPTS.md) covers every practice card and lists the opening six first.
- Verified the lesson and pause controls, narrow reflow, the artwork slot and alt text with a test image, and the UK game through replay. The practice deck uses temporary topic icons until its artwork is supplied.

- Matched all 16 ChatGPT images supplied by David to the practice cards by scene. Converted them to 1200px-wide WebP assets with Ukrainian alt text. Archived the source PNGs under `Claude outputs/assumezero-ukraine-source/` and verified the actual images load across all practice cards in Chrome. The date clue still comes from the source panel and the assessment remains text-only.

Original prompt: “claude ccode commited your spec, let's build please, on a new sub url?”

David explicitly overruled the UK pilot and partnership prerequisites for the local adult-review build. D-SITE-098 records the scope at `/apps/assumezero/ukraine`.

- Added the Ukrainian text-first prototype, with two teaching sessions, fresh practice, two assessment forms, and a repair activity.
- Both editions use the shared static entry point, deck loading, and run progression. The existing UK presentation and scoring policy live in `uk-feed.js`.
- Ukrainian educator review, narration, and offline delivery remain follow-up work for an agreed pilot scope.
- Verified the local route in Chrome. Exercised evidence selection and revision, keyboard focus after closing help, skip and stop, repair, assessment without teaching feedback, and the session summary. Checked same-origin GET requests and empty learner storage. Reviewed desktop and 390px screenshots and checked reflow at 320px.
- Ran the UK game through its existing iframe from warm-up through the feed, Creator Mode, final assessment and replay. Mapped the directory URL to the static entry and fixed the pending video play/pause race found during that run.

To review locally, run `npm run dev -- --hostname 127.0.0.1 --port 3093` and open `http://127.0.0.1:3093/apps/assumezero/ukraine`. Choose the first exercise, pick “Поки не знаємо” (not enough evidence), then use “Перевірити” (check) to open the original source and revise the answer.

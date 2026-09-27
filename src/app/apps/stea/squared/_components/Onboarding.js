'use client';

import { useState } from 'react';
import { Modal, DISPLAY, CAPS } from './ui';

// The seven-card briefing from the design, in a light forces voice.
// Tone is under client review — change copy here, not in the markup.
const CARDS = [
  {
    title: 'Welcome to Squared',
    body: "Job hunting after service is its own op. The algorithms bury you in mismatches, and nobody explains what a 'stakeholder' is.\n\nSquared is honest triage: it finds roles that genuinely fit, tells you straight which ones aren't worth the effort, and puts your service into words a civvy recruiter gets. Sixty-second brief incoming.",
  },
  {
    title: 'Your data stays yours',
    body: "Before you add anything:\n\n• Everything lives in your own private, isolated Arcturus DC workspace — no one else can see it.\n• We never sell or share your details for marketing. Ever.\n• We never ask for your service number.\n• Your CV and job details only go to the AI and job-board services needed to do the analysis.",
  },
  {
    title: 'First: your service record',
    body: "Head to Config and fill in:\n\n• Service record — service, trade, rank, clearance and (optionally) your exit date.\n• Candidate profile — target roles, home base, salary floor.\n• Evidence anchors — real postings and achievements, with numbers.\n\nThe AI only ever works from your real evidence. No embellishment.",
    cta: 'Go to Config',
  },
  {
    title: 'Two ways to start',
    body: "• No role in mind yet? Use Live Scans to search real UK job boards (Reed + Adzuna), ranked by fit to your targets.\n\n• Already found one? Paste its link or text on the Pipeline tab and hit Analyse.",
  },
  {
    title: 'Straight talk, no flannel',
    body: "Every role is scored across 12 factors with a clear GO / proceed-with-care / NO-GO call — strengths and gaps, no false hope.\n\nEffort goes where there's a genuine match. Like a good recce.",
  },
  {
    title: 'Then crack on',
    body: "Decided to apply? Squared will:\n\n• Tailor your CV to that exact role, in civilian language (clean ATS-friendly PDF).\n• Write a cover letter you can refine in plain English.\n• Pre-fill your details in Apply Assist — copy field-by-field into any clunky form.",
  },
  {
    title: 'Fair by design',
    body: "Your first 20 actions are free. After that, a £5 brew unlocks 50 more — just enough to cover the AI costs. We don't profit from people looking for work.\n\nGood luck out there. You've done harder things than a competency interview.",
  },
];

export default function Onboarding({ onClose, onDismiss, onGoConfig }) {
  const [i, setI] = useState(0);
  const card = CARDS[i];
  const last = i === CARDS.length - 1;
  return (
    <Modal kicker={`Briefing · ${String(i + 1).padStart(2, '0')} / ${String(CARDS.length).padStart(2, '0')}`} onClose={onClose}>
      <h3 className={`m-0 ${DISPLAY} text-[30px] sm:text-[36px] leading-[0.95] tracking-[-0.03em]`}>{card.title}</h3>
      <p className="mt-4 min-h-[170px] text-sm leading-relaxed whitespace-pre-line">{card.body}</p>
      {card.cta && (
        <button onClick={onGoConfig} className="mt-1 text-sm font-extrabold text-[#4c5c3f]">{card.cta} →</button>
      )}
      <div className="flex gap-1 my-5">
        {CARDS.map((_, n) => <span key={n} className={`flex-1 h-[5px] ${n <= i ? 'bg-[#4c5c3f]' : 'bg-[#d7cebc]'}`} />)}
      </div>
      <div className="flex justify-between items-center gap-3">
        <button onClick={onDismiss} className={`${CAPS} text-[#686c62]`}>Don&apos;t show again</button>
        <div className="flex gap-2">
          {i > 0 && (
            <button onClick={() => setI(i - 1)} className="h-[42px] px-4 border border-[#22251f] text-sm font-bold">Back</button>
          )}
          <button onClick={() => (last ? onClose() : setI(i + 1))} className="h-[42px] px-5 bg-[#22251f] text-[#f8f4ea] text-sm font-extrabold">
            {last ? 'Get started' : 'Next'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

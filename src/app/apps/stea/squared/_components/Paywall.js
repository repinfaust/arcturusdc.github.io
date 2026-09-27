'use client';

import { Modal, DISPLAY } from './ui';

export default function Paywall({ usage, onClose, onBuy, onRedeem }) {
  const out = !(usage?.remaining > 0);
  return (
    <Modal kicker="Actions" onClose={onClose} width={460}>
      <h3 className={`m-0 ${DISPLAY} text-[30px] leading-[0.95] tracking-[-0.03em]`}>
        {out ? "You've used your free actions" : 'Getting value from Squared?'}
      </h3>
      <p className="mt-4 text-sm leading-relaxed">
        Squared is free for your first {usage?.free_actions || 20} actions (analyses, CV tailoring, searches and translations).
        {out ? ' To keep going, buy us a brew.' : ` You have ${usage.remaining} left.`}
      </p>
      <p className="mt-3 text-[13px] sm:text-xs leading-relaxed text-[#686c62]">
        This isn&apos;t about profit — it covers the AI costs of running your search. A £5 brew unlocks another {usage?.bundle || 50} actions.
      </p>
      <div className="flex flex-wrap gap-3 mt-6">
        <button onClick={onBuy} className="flex-1 min-w-[180px] h-12 bg-[#4c5c3f] text-[#f8f4ea] font-extrabold shadow-[4px_4px_0_#22251f]">
          Buy a brew — £5
        </button>
        <button onClick={onClose} className="h-12 px-5 border border-[#22251f] font-bold">Maybe later</button>
      </div>
      <button onClick={onRedeem} className="mt-5 w-full text-center text-[13px] sm:text-xs text-[#686c62] underline">
        Have an access code? Enter it here
      </button>
    </Modal>
  );
}

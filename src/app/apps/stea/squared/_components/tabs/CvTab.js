'use client';

import { useState } from 'react';
import { printCvAsPdf } from '@/lib/careerEngine/printCv';
import { TabHeading, Md, AiReviewWarning, DISPLAY, CAPS } from '../ui';

// Not in the design export; built in the same language (D-SITE-034).
export default function CvTab({ cvLibrary, profile, goPipeline }) {
  const [openId, setOpenId] = useState(null);
  return (
    <div>
      <div className="mt-8">
        <TabHeading kicker="CV tailoring" title="Tailored CVs">
          <p className="mt-2.5 text-[15px]">Every CV you&apos;ve tailored to a role, in civilian language. Analyse a role and choose &ldquo;Proceed to Apply&rdquo; to add one.</p>
        </TabHeading>
      </div>

      <div className="mt-6 pb-3 border-b-4 border-[#22251f]">
        <div className={`${DISPLAY} text-[24px] sm:text-[30px] leading-none tracking-[-0.025em]`}>
          {cvLibrary.length} {cvLibrary.length === 1 ? 'CV' : 'CVs'} on file
        </div>
      </div>

      {cvLibrary.length === 0 ? (
        <div className="bg-[#fffdf8] border border-[#d7cebc] border-t-0 px-5 py-10 text-center text-sm text-[#686c62]">
          No tailored CVs yet. <button onClick={goPipeline} className="underline font-bold text-[#4c5c3f]">Analyse a role</button>, then choose &ldquo;Proceed to Apply&rdquo;.
        </div>
      ) : (
        <div className="flex flex-col">
          {cvLibrary.map((cv) => {
            const open = openId === cv.id;
            return (
              <div key={cv.id} className="bg-[#fffdf8] border border-[#d7cebc] border-t-0">
                <button onClick={() => setOpenId(open ? null : cv.id)} className="w-full flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-left">
                  <div className="min-w-0">
                    <div className="text-[15px] font-bold">{cv.role}</div>
                    <div className="text-[13px] text-[#686c62]">
                      {cv.company}{cv.tailored_cv_at ? ` · ${new Date(cv.tailored_cv_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}
                    </div>
                  </div>
                  <span className="flex items-center gap-3">
                    <span className={`px-2 py-1 bg-[#4c5c3f] text-[#f8f4ea] ${CAPS} !text-[11px]`}>{cv.status}</span>
                    <span className="text-lg text-[#4c5c3f]">{open ? '−' : '+'}</span>
                  </span>
                </button>
                {open && (
                  <div className="px-5 pb-5">
                    <div className="flex justify-end gap-4 mb-3">
                      <button onClick={() => printCvAsPdf({ name: profile?.name || 'Candidate', role: cv.role || 'Role', cvMarkdown: cv.tailored_cv })} className={`${CAPS} text-[#4c5c3f]`}>Download PDF</button>
                      <button onClick={() => navigator.clipboard?.writeText(cv.tailored_cv)} className={`${CAPS} text-[#686c62]`}>Copy</button>
                    </div>
                    <div className="bg-[#f8f4ea] border border-[#ede5d4] p-4 sm:p-5"><Md>{cv.tailored_cv}</Md></div>
                    <AiReviewWarning what="CV" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

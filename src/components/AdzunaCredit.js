// "Jobs by Adzuna" credit required on every displayed Adzuna advert (Adzuna API
// terms: at least 116x23px, "Jobs" and "Adzuna" both linked to adzuna.co.uk).
// The terms also require "Adzuna" to be their logo image, which must come from
// adzuna.co.uk/press.html; it blocks automated download, so the logo is still
// to be added (D-SITE-036). Until then the word is shown as a linked label.
export default function AdzunaCredit({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 min-w-[116px] h-[23px] text-[12px] leading-none text-[#686c62] ${className}`}>
      <a href="https://www.adzuna.co.uk" target="_blank" rel="noreferrer" className="underline">Jobs</a>
      <span>by</span>
      <a href="https://www.adzuna.co.uk" target="_blank" rel="noreferrer" className="font-bold text-[#22251f] underline">Adzuna</a>
    </span>
  );
}

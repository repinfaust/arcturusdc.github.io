// "Jobs by Adzuna" credit required on every displayed Adzuna advert (Adzuna API
// terms: at least 116x23px; "Jobs" linked to adzuna.co.uk; "Adzuna" as their
// logo image, also linked). Logo from adzuna.co.uk/press.html, resized to
// public/img/adzuna-logo.jpg (D-SITE-036).
export default function AdzunaCredit({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 min-w-[116px] h-[23px] text-[13px] leading-none text-[#686c62] ${className}`}>
      <a href="https://www.adzuna.co.uk" target="_blank" rel="noreferrer" className="underline">Jobs</a>
      <span>by</span>
      <a href="https://www.adzuna.co.uk" target="_blank" rel="noreferrer" className="inline-flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/adzuna-logo.jpg" alt="Adzuna" width={70} height={18} className="h-[18px] w-auto" />
      </a>
    </span>
  );
}

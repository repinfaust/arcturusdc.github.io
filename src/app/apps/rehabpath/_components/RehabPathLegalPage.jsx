import Link from "next/link";

const linkClass = "text-[#0F6B78] underline-offset-4 hover:underline";

export function RehabPathLegalPage({ eyebrow, title, effectiveDate, children }) {
  return (
    <main className="bg-[#F7F8F6] px-4 py-10 text-[#17211E] sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl">
        <div className="border-b border-[#DDE4DE] pb-8">
          <Link href="/apps/rehabpath" className={linkClass}>
            RehabPath
          </Link>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#62726D]">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-5 text-sm font-medium text-[#62726D]">
            Effective date: {effectiveDate}
          </p>
        </div>

        <div className="rehabpath-legal mt-8 space-y-7 text-base leading-8 text-[#41514C] [&_code]:rounded [&_code]:bg-white [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_li]:mt-2 [&_ul]:list-disc [&_ul]:pl-6">
          {children}
        </div>
      </article>
    </main>
  );
}

export function Section({ title, children }) {
  return (
    <section className="border-t border-[#DDE4DE] pt-7">
      <h2 className="text-2xl font-semibold tracking-tight text-[#17211E]">{title}</h2>
      <div className="mt-3 space-y-4">{children}</div>
    </section>
  );
}

export function ContactBlock({ terms = false }) {
  return (
    <p>
      For {terms ? "questions about these Terms" : "privacy questions"}, contact:{" "}
      <a className={linkClass} href="mailto:info@arcturusdc.com">
        info@arcturusdc.com
      </a>
    </p>
  );
}

export function LegalLinks() {
  return (
    <p className="text-sm text-[#62726D]">
      <Link href="/apps/rehabpath/privacy-policy" className={linkClass}>
        Privacy Policy
      </Link>
      {" · "}
      <Link href="/apps/rehabpath/terms-of-use" className={linkClass}>
        Terms of Use
      </Link>
      {" · "}
      <Link href="/apps/rehabpath/delete-account" className={linkClass}>
        Delete app data
      </Link>
    </p>
  );
}

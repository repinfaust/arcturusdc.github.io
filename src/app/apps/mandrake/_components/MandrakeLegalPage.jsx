import Link from 'next/link';

export default function MandrakeLegalPage({ eyebrow = 'Legal', title, updated, children }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <nav aria-label="Mandrake legal pages" className="mb-10 border-b-2 border-neutral-950 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/apps/mandrake" className="text-lg font-extrabold text-neutral-950 no-underline">
            Mandrake<span className="text-red-600">.</span>
          </Link>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
            <Link href="/apps/mandrake/privacy-policy" className="text-red-700 hover:underline">
              Privacy
            </Link>
            <Link href="/apps/mandrake/terms-of-service" className="text-red-700 hover:underline">
              Terms
            </Link>
            <Link href="/apps/mandrake/data-deletion" className="text-red-700 hover:underline">
              Data deletion
            </Link>
          </div>
        </div>
      </nav>

      <article className="max-w-none leading-7 text-neutral-700 [&_a]:text-red-700 [&_a]:underline [&_h1]:mt-2 [&_h1]:border-b-2 [&_h1]:border-neutral-950 [&_h1]:pb-3 [&_h1]:text-3xl [&_h1]:font-extrabold [&_h1]:uppercase [&_h1]:tracking-tight [&_h1]:text-neutral-950 md:[&_h1]:text-4xl [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:border-b [&_h2]:border-neutral-300 [&_h2]:pb-2 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-neutral-950 [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-bold [&_h3]:text-neutral-950 [&_li]:mb-2 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_strong]:text-neutral-950 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6">
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
          {eyebrow}
        </p>
        <h1>{title}</h1>
        {updated ? (
          <p className="font-mono text-xs uppercase tracking-[0.08em] text-neutral-500">
            Effective date: {updated}
          </p>
        ) : null}
        {children}
      </article>
    </main>
  );
}

export function LegalCallout({ children }) {
  return (
    <div className="not-prose my-6 border border-neutral-300 border-l-4 border-l-red-600 bg-neutral-50 px-4 py-3 text-neutral-700">
      {children}
    </div>
  );
}

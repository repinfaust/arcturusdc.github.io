import Image from 'next/image';
import Link from 'next/link';

import styles from './thereaboutsLegal.module.css';

export default function ThereaboutsLegalPage({ eyebrow, title, updated = '16 August 2026', children }) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:px-6 lg:px-8">
      <header className="border border-[#D7CEBC] bg-[#FFFDF8] p-5 md:p-7">
        <Link href="/apps/thereabouts" className="inline-flex items-center gap-3 no-underline">
          <Image
            src="/img/thereabouts/icon.png"
            width={46}
            height={46}
            alt=""
            className="rounded-xl border border-[#D7CEBC]"
          />
          <Image src="/img/thereabouts/wordmark.svg" width={190} height={48} alt="thereabouts" />
        </Link>
        <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.14em] text-[#4C5C3F]">{eyebrow}</p>
        <h1 className="mt-2 font-serif text-4xl font-normal leading-tight tracking-tight text-[#22251F] md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 border-t border-[#D7CEBC] pt-4 text-sm text-[#686C62]">
          <strong>Last updated:</strong> {updated} · <strong>Status:</strong> iOS and Android release
        </p>
      </header>

      <article className={`${styles.legal} mx-auto max-w-none border-x border-b border-[#D7CEBC] bg-[#F8F4EA] px-5 py-8 md:px-10 md:py-12`}>
        {children}
      </article>

      <nav
        aria-label="thereabouts policy links"
        className="flex flex-wrap gap-x-5 gap-y-2 border-x border-b border-[#D7CEBC] bg-[#DCE3D2] px-5 py-4 text-sm font-bold text-[#4C5C3F] md:px-10"
      >
        <Link href="/apps/thereabouts">App page</Link>
        <Link href="/apps/thereabouts/privacy-policy">Privacy</Link>
        <Link href="/apps/thereabouts/terms-of-use">Terms</Link>
        <Link href="/apps/thereabouts/delete-account">Delete account or data</Link>
      </nav>
    </main>
  );
}

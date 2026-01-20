'use client';
import Image from 'next/image';
import Link from 'next/link';

export default function AppCard({ app }) {
  return (
    <div className="group rounded-2xl border border-neutral-200/70 bg-white shadow-sm hover:shadow-md transition-shadow p-5 flex items-start gap-4">
      <div className="relative size-14 shrink-0 rounded-xl overflow-hidden ring-1 ring-neutral-200 bg-neutral-50">
        {app.logo ? (
          <Image src={app.logo} alt={app.name} fill sizes="56px" className="object-cover" />
        ) : (
          <div className="size-full bg-neutral-100" />
        )}
      </div>
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-neutral-900">{app.name}</h3>
        <p className="text-sm text-neutral-600 line-clamp-2">{app.tagline}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {app.platforms?.map((p, i) => (
            <Link key={i} href={p.policyBase} className="text-sm px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-100 hover:bg-red-100">
              {p.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// src/app/apps/toume/page.js
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';

export default function TouMe() {
  return (
    <>
      <Header/>
      <main className="pb-10">
        {/* App card */}
        <div className="card p-4 flex items-center gap-3 mt-2">
          <Image
            className="rounded-2xl border border-black/10"
            src="/img/tou.me_logo.jpeg"
            width={64}
            height={64}
            alt="Tou.Me logo"
          />
          <div>
            <div className="font-extrabold">Tou.Me</div>
            <div className="text-muted text-sm">
              Shared-care family organisation — simple, compliant, privacy-first.
            </div>
          </div>
        </div>

        {/* Platforms */}
        <div className="card p-6 mt-3">
          <div className="text-2xl font-extrabold mb-2">Choose a platform</div>
          <div className="flex gap-2 flex-wrap">
            <Link className="btn btn-primary" href="/apps/toume/android">
              Android (Google Play)
            </Link>
            <Link className="btn btn-primary" href="/apps/toume/ios">
              iOS (Apple App Store)
            </Link>
          </div>
        </div>

        {/* Policies */}
        <div className="card p-6 mt-3">
          <div className="text-2xl font-extrabold mb-2">Policies</div>
          <ul className="list-disc pl-5 text-sm">
            <li>
              <Link
                href="/assets/policies/Toume_PrivacyPolicy.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Privacy Policy (PDF)
              </Link>
            </li>
            <li>
              <Link
                href="/assets/policies/Toume_TermsOfService.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Terms of Service (PDF)
              </Link>
            </li>
          </ul>
        </div>
      </main>
      <Footer/>
    </>
  );
}

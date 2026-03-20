import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Unload – Delete Account or Data',
  description:
    'How to request account deletion or data deletion for the Unload app.',
};

export default function DeleteAccountPage() {
  return (
    <main className="pb-12">
      <section className="relative mt-3 overflow-hidden rounded-2xl border border-black/10">
        <div className="absolute inset-0 -z-10">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(90% 70% at 50% 20%, rgba(170, 198, 181, 0.65), rgba(247, 242, 234, 0.2)), linear-gradient(180deg, #F7F2EA 0%, #EFE7DD 50%, #E9DED2 100%)',
            }}
          />
          <div className="absolute inset-0 bg-black/10" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/20" />
        </div>

        <div className="p-6 md:p-10">
          <div className="mx-auto max-w-4xl">
            <Link
              href="/apps/unload"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#3F342E]/85 hover:text-[#2F2723]"
            >
              <Image
                src="/img/unload-logo.svg"
                width={24}
                height={24}
                alt="Unload"
                className="rounded-md border border-black/10 bg-white"
              />
              Back to Unload
            </Link>

            <h1 className="mt-5 text-3xl md:text-5xl font-extrabold tracking-tight text-[#2F2723]">
              Delete <span className="text-[#4B6A5B]">Account or Data</span>
            </h1>
            <p className="mt-3 text-sm text-[#3F342E]/75">
              Effective date: 20 March 2026
            </p>

            <div className="mt-6 rounded-2xl border border-black/10 bg-white/70 p-5 md:p-6">
              <p className="text-[#3F342E]/90 leading-relaxed">
                This page explains how Unload users can request full account deletion or
                request deletion of specific app data. It also explains what is deleted,
                what may be retained temporarily, and where to ask for support.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="card p-6 md:p-8 mt-4 space-y-8 text-[#2F2723]">
        <div>
          <h2 className="text-2xl font-extrabold">How to delete your account</h2>
          <p className="mt-2 text-sm text-[#3F342E]/85">
            You can delete your Unload account from inside the app.
          </p>
          <div className="mt-4 grid gap-3">
            <StepCard step="Step 1" text="Open the Unload app and sign in to the account you want to delete." />
            <StepCard step="Step 2" text="Go to Settings, then open Account." />
            <StepCard step="Step 3" text="Select Delete Account and confirm your request." />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-extrabold">
            How to request data deletion without deleting your account
          </h2>
          <p className="mt-2 text-sm text-[#3F342E]/85">
            Email{' '}
            <a href="mailto:info@arcturusdc.com" className="text-[#2E5E9E] hover:underline">
              info@arcturusdc.com
            </a>{' '}
            from the email address linked to your account.
          </p>
          <div className="mt-4 rounded-xl border border-black/10 bg-white/60 p-4">
            <p className="text-sm text-[#3F342E]/90">
              Use subject line: <strong>Unload data deletion request</strong> and include
              what you want removed.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-extrabold">What you can request deleted</h2>
          <ul className="mt-3 list-disc pl-5 text-sm text-[#3F342E]/90 space-y-1">
            <li>Your Unload account record</li>
            <li>Unload entries and saved session history</li>
            <li>Saved preferences and personalisation settings</li>
            <li>All app-stored data while keeping your account active</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-extrabold">Retention period</h2>
          <div className="mt-3 rounded-xl border border-black/10 bg-[#F4EFE8]/85 p-4">
            <p className="text-sm text-[#3F342E]/90">
              Account deletion requests are completed within <strong>30 days</strong>.
              Verified selective data deletion requests are also completed within{' '}
              <strong>30 days</strong>.
            </p>
            <p className="mt-2 text-sm text-[#3F342E]/85">
              Where required for legal, fraud prevention, or security reasons, limited
              records may be retained for a longer period and then securely deleted.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-extrabold">Need help?</h2>
          <div className="mt-3 rounded-xl border border-black/10 bg-white/60 p-4 text-sm text-[#3F342E]/90">
            <p>
              Email: <a href="mailto:info@arcturusdc.com" className="text-[#2E5E9E] hover:underline">info@arcturusdc.com</a>
            </p>
            <p className="mt-1">
              Privacy Policy:{' '}
              <a href="/apps/unload/privacy-policy" className="text-[#2E5E9E] hover:underline">
                /apps/unload/privacy-policy
              </a>
            </p>
            <p className="mt-1">
              Terms of Use:{' '}
              <a href="/apps/unload/terms-of-use" className="text-[#2E5E9E] hover:underline">
                /apps/unload/terms-of-use
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function StepCard({ step, text }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white/60 p-4">
      <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#4B6A5B]">
        {step}
      </div>
      <p className="mt-1 text-sm text-[#3F342E]/90">{text}</p>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { auth, googleProvider } from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup } from 'firebase/auth';

export default function SteaLogin() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) router.replace('/apps/stea/board');
    });
    return () => unsub();
  }, [router]);

  const signIn = async () => {
    await signInWithPopup(auth, googleProvider);
    router.replace('/apps/stea/board');
  };

  return (
    <main className="pb-10 max-w-xl mx-auto px-4">
      <div className="card p-6 mt-8 text-center">
        <Image
          src="/img/arcturusdc_mark.png"
          width={72}
          height={72}
          alt="Arcturus mark"
          className="mx-auto rounded-2xl border border-black/10"
          priority
        />
        <h1 className="text-2xl font-extrabold mt-3">STEa — Sign in</h1>
        <p className="text-sm text-neutral-700 mt-2">
          Lightweight idea → planning → design → build board.  
          Sign in with Google to continue.
        </p>

        <button
          onClick={signIn}
          className="mt-6 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Continue with Google
        </button>

        <p className="mt-6 text-xs text-gray-500">
          By continuing you agree to basic usage for managing app ideas.{' '}
          <Link href="/apps" className="underline">Back to apps</Link>
        </p>
      </div>
    </main>
  );
}

import Link from 'next/link';
import Image from 'next/image';

export default function Header(){
  return (
    <header className="py-6 flex items-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-white border border-black/10 shadow-soft grid place-items-center">
        <Image src="/assets/logo.png" alt="Arcturus logo" width={36} height={36} />
      </div>
      <div className="flex-1">
        <h1 className="text-3xl sm:text-4xl font-extrabold">Arcturus Digital Consulting</h1>
        <nav className="mt-1 text-sm font-bold flex gap-4">
          <Link href="/">Home</Link>
          <Link href="/apps">Apps</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </div>
    </header>
  );
}

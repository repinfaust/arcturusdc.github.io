import Image from 'next/image';
import Link from 'next/link';

export default function AppTile({href,logo,name,desc}){
  return (
    <Link href={href} className="card p-4 flex gap-3 items-center hover:outline outline-2 outline-[var(--ring)]">
      <Image className="rounded-2xl border border-black/10" src={logo} alt={`${name} logo`} width={64} height={64} />
      <div>
        <div className="font-extrabold">{name}</div>
        <div className="text-muted text-sm">{desc}</div>
      </div>
    </Link>
  );
}

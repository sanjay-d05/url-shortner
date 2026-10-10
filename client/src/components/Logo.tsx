import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-serif text-2xl tracking-tight">
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
        <path d="M3 19 19 3" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" />
        <path d="M3 3h6M13 19h6" stroke="var(--color-ink)" strokeWidth="3" strokeLinecap="round" />
      </svg>
      Snip
    </Link>
  );
}

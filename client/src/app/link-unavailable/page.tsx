import Link from 'next/link';
import Logo from '@/components/Logo';

const MESSAGES: Record<string, [string, string]> = {
  not_found: ["This link doesn't exist", 'It may have been deleted, or the address was mistyped.'],
  disabled: ['This link is turned off', 'The owner has disabled it for now.'],
  expired: ['This link has expired', 'It was only valid until a certain date.'],
  limit_reached: ['This link has reached its limit', 'It was set to work for a limited number of visits.'],
};

export default async function LinkUnavailablePage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason = 'not_found' } = await searchParams;
  const [title, text] = MESSAGES[reason] ?? MESSAGES.not_found;
  return (
    <div className="mx-auto grid min-h-screen max-w-md content-center gap-8 px-6">
      <Logo />
      <div>
        <h1 className="font-serif text-4xl">{title}</h1>
        <p className="mt-3 text-muted">{text}</p>
        <Link href="/" className="mt-6 inline-block underline">Go to the homepage</Link>
      </div>
    </div>
  );
}

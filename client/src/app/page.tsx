'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import Logo from '@/components/Logo';
import { Button, Card, Input, copyToClipboard } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks';
import { useCreateLink } from '@/features/links/hooks';
import { errorMessage } from '@/lib/api';

const FEATURES: [string, string][] = [
  ['Custom aliases', 'Choose snip.link/your-name instead of a random code.'],
  ['Passwords, expiry & click limits', 'Control who can open a link, and for how long.'],
  ['Analytics that respect privacy', 'Clicks, countries, devices, referrers. Bots filtered out.'],
  ['QR codes & bulk import', 'One QR per link, or paste a hundred URLs at once.'],
  ['API keys', 'Create links from your own scripts and apps.'],
  ['Fast redirects', 'Cached in Redis, click logging never blocks the redirect.'],
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const create = useCreateLink();
  const [url, setUrl] = useState('');
  const [result, setResult] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const link = await create.mutateAsync({ url: url.trim() });
      setResult(link.shortUrl);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6">
      <header className="flex items-center justify-between py-6">
        <Logo />
        <nav className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link href="/dashboard"><Button>Dashboard</Button></Link>
          ) : (
            <>
              <Link href="/login"><Button variant="ghost">Sign in</Button></Link>
              <Link href="/register"><Button>Get started</Button></Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="py-20 md:py-28">
          <h1 className="max-w-3xl font-serif text-5xl leading-[1.05] tracking-tight md:text-7xl">
            Long links, cut short.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Paste a URL below. No account needed for a quick link, and a free account unlocks aliases, passwords, expiry and analytics.
          </p>

          <form onSubmit={submit} className="mt-10 flex max-w-2xl flex-col gap-3 sm:flex-row">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/a/very/long/link?with=params"
              className="py-3.5 text-base"
              aria-label="URL to shorten"
              required
            />
            <Button type="submit" loading={create.isPending} className="px-6 py-3.5 text-base">Shorten</Button>
          </form>

          {result && (
            <Card className="mt-4 flex max-w-2xl items-center justify-between gap-3 p-4">
              <a href={result} target="_blank" rel="noreferrer" className="truncate font-mono text-lg text-accent hover:underline">{result}</a>
              <Button variant="secondary" size="sm" onClick={() => copyToClipboard(result)}>Copy</Button>
            </Card>
          )}
        </section>

        <section className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([title, text]) => (
            <div key={title} className="bg-card p-6">
              <h3 className="font-serif text-xl">{title}</h3>
              <p className="mt-2 text-sm text-muted">{text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="py-12 text-sm text-muted">Snip — a portfolio URL shortener built with NestJS, Next.js and PostgreSQL.</footer>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Button, Card, Spinner, StatusBadge, copyToClipboard, formatDate } from '@/components/ui';
import { BreakdownList, ClicksChart } from '@/features/analytics/charts';
import { useLinkAnalytics } from '@/features/analytics/hooks';
import { useLink } from '@/features/links/hooks';
import { errorMessage } from '@/lib/api';
import { useAppDispatch } from '@/store/hooks';
import { openEdit, setQrFor } from '@/store/uiSlice';

const RANGES = [7, 30, 90];

export default function LinkDetailPage() {
  const id = Number(useParams<{ id: string }>().id);
  const dispatch = useAppDispatch();
  const [days, setDays] = useState(30);
  const link = useLink(id);
  const stats = useLinkAnalytics(id, days);

  if (link.isLoading) return <Spinner />;
  if (link.error || !link.data) {
    return (
      <div className="space-y-3">
        <p className="text-accent">{errorMessage(link.error)}</p>
        <Link href="/links" className="underline">Back to links</Link>
      </div>
    );
  }
  const l = link.data;
  const s = stats.data;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/links" className="text-sm text-muted hover:text-ink">← All links</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-3xl">/{l.shortCode}</h1>
          <StatusBadge status={l.status} />
        </div>
        <p className="mt-1 truncate text-muted" title={l.originalUrl}>{l.originalUrl}</p>
        <p className="mt-1 text-sm text-muted">
          Created {formatDate(l.createdAt)}{l.expiresAt && ` · expires ${formatDate(l.expiresAt)}`}{l.isPasswordProtected && ' · password protected'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => copyToClipboard(l.shortUrl)}>Copy {l.shortUrl.replace(/^https?:\/\//, '')}</Button>
          <Button variant="secondary" onClick={() => dispatch(setQrFor(l))}>QR code</Button>
          <Button variant="secondary" onClick={() => dispatch(openEdit(l))}>Edit</Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl">Analytics</h2>
        <div className="flex gap-1 rounded-md border border-line bg-card p-1">
          {RANGES.map((r) => (
            <button key={r} onClick={() => setDays(r)} className={`cursor-pointer rounded px-3 py-1 text-sm ${days === r ? 'bg-ink text-paper' : 'text-muted hover:text-ink'}`}>
              {r}d
            </button>
          ))}
        </div>
      </div>

      {!s ? (
        <Spinner />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5"><p className="text-sm text-muted">Clicks</p><p className="mt-1 font-serif text-4xl tabular-nums">{s.totalClicks}</p></Card>
            <Card className="p-5"><p className="text-sm text-muted">Unique visitors</p><p className="mt-1 font-serif text-4xl tabular-nums">{s.uniqueVisitors}</p></Card>
          </div>
          <Card className="p-5"><ClicksChart data={s.timeSeries} /></Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-5"><BreakdownList title="Countries" data={s.countries} /></Card>
            <Card className="p-5"><BreakdownList title="Referrers" data={s.referrers} /></Card>
            <Card className="p-5"><BreakdownList title="Devices" data={s.devices} /></Card>
            <Card className="p-5"><BreakdownList title="Browsers" data={s.browsers} /></Card>
            <Card className="p-5"><BreakdownList title="Operating systems" data={s.operatingSystems} /></Card>
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Button, Card, Spinner } from '@/components/ui';
import { ClicksChart } from '@/features/analytics/charts';
import { useSummary } from '@/features/analytics/hooks';
import { errorMessage } from '@/lib/api';
import { useAppDispatch } from '@/store/hooks';
import { openCreate } from '@/store/uiSlice';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { data, isLoading, error } = useSummary(14);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <h1 className="font-serif text-4xl">Overview</h1>
        <Button onClick={() => dispatch(openCreate())}>New link</Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : error || !data ? (
        <p className="text-accent">{errorMessage(error)}</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ['Links', data.totalLinks],
              ['Total clicks', data.totalClicks],
              ['Clicks, last 7 days', data.clicksLast7Days],
            ].map(([label, value]) => (
              <Card key={label} className="p-5">
                <p className="text-sm text-muted">{label}</p>
                <p className="mt-1 font-serif text-4xl tabular-nums">{value}</p>
              </Card>
            ))}
          </div>

          <Card className="p-5">
            <h2 className="mb-4 font-serif text-xl">Clicks, last 14 days</h2>
            <ClicksChart data={data.timeSeries} />
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-serif text-xl">Top links</h2>
            {data.topLinks.length === 0 ? (
              <p className="text-sm text-muted">Nothing yet. Create a link and share it.</p>
            ) : (
              <ul className="divide-y divide-line">
                {data.topLinks.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                    <Link href={`/links/${l.id}`} className="min-w-0">
                      <span className="font-mono">/{l.shortCode}</span>
                      <span className="ml-3 truncate text-muted">{l.originalUrl}</span>
                    </Link>
                    <span className="tabular-nums">{l.clickCount} clicks</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

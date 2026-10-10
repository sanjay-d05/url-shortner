'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Bucket, DayPoint } from '@/types';

export function ClicksChart({ data, height = 260 }: { data: DayPoint[]; height?: number }) {
  return (
    <div style={{ height }} role="img" aria-label="Clicks over time">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="clicks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e8431f" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#e8431f" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#ddd7c8" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} tick={{ fontSize: 12, fill: '#6b665a' }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b665a' }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ borderRadius: 6, border: '1px solid #ddd7c8', background: '#fffdf8' }} />
          <Area type="monotone" dataKey="clicks" stroke="#e8431f" strokeWidth={2} fill="url(#clicks)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BreakdownList({ title, data }: { title: string; data: Bucket[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div>
      <h3 className="mb-3 font-serif text-lg">{title}</h3>
      {data.length === 0 ? (
        <p className="text-sm text-muted">No data yet</p>
      ) : (
        <ul className="space-y-2.5">
          {data.map((d) => (
            <li key={d.name} className="text-sm">
              <div className="mb-1 flex justify-between">
                <span className="truncate pr-2">{d.name}</span>
                <span className="tabular-nums text-muted">{d.value} · {Math.round((d.value / total) * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-line/60">
                <div className="h-full rounded-full bg-ink" style={{ width: `${(d.value / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

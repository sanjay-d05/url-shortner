'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BarChart3, Copy, ExternalLink, LockKeyhole, Pencil, Power, PowerOff, QrCode, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, Input, Spinner, StatusBadge, copyToClipboard, formatDate } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  StatusFilter, clearSelected, openCreate, openEdit, setFilters, setQrFor, setSelected, toggleSelected,
} from '@/store/uiSlice';
import type { Link as LinkType } from '@/types';
import { useDeleteLinks, useLinks, useTags, useUpdateLink } from './hooks';

export default function LinksTable() {
  const dispatch = useAppDispatch();
  const { filters, selectedIds } = useAppSelector((s) => s.ui);
  const { data, isLoading, isFetching, error } = useLinks(filters);
  const { data: tags } = useTags();
  const del = useDeleteLinks();
  const update = useUpdateLink();

  // Debounce the search box before pushing it into Redux (which triggers the query).
  const [search, setSearch] = useState(filters.search);
  useEffect(() => {
    const t = setTimeout(() => search !== filters.search && dispatch(setFilters({ search })), 300);
    return () => clearTimeout(t);
  }, [search, filters.search, dispatch]);

  const items = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / 10));
  const allSelected = items.length > 0 && items.every((l) => selectedIds.includes(l.id));

  const remove = async (ids: number[]) => {
    if (!confirm(`Delete ${ids.length} link${ids.length > 1 ? 's' : ''}? This cannot be undone.`)) return;
    try {
      await del.mutateAsync(ids);
      dispatch(clearSelected());
      toast.success('Deleted');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const toggleActive = (l: LinkType) =>
    update.mutate({ id: l.id, isActive: !l.isActive }, { onError: (e) => toast.error(errorMessage(e)) });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder="Search links…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select
          value={filters.status}
          onChange={(e) => dispatch(setFilters({ status: e.target.value as StatusFilter }))}
          className="rounded-md border border-line bg-card px-3 py-2.5 text-sm"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
          <option value="expired">Expired</option>
        </select>
        <select
          value={filters.tag}
          onChange={(e) => dispatch(setFilters({ tag: e.target.value }))}
          className="rounded-md border border-line bg-card px-3 py-2.5 text-sm"
          aria-label="Filter by tag"
        >
          <option value="">All tags</option>
          {tags?.map((t) => <option key={t}>{t}</option>)}
        </select>
        {isFetching && !isLoading && <Spinner className="self-center" />}
        {selectedIds.length > 0 && (
          <Button variant="danger" className="ml-auto" onClick={() => remove(selectedIds)} loading={del.isPending}>
            Delete {selectedIds.length} selected
          </Button>
        )}
      </div>

      <Card className="overflow-x-auto">
        {isLoading ? (
          <div className="grid place-items-center p-16"><Spinner /></div>
        ) : error ? (
          <p className="p-8 text-center text-accent">{errorMessage(error)}</p>
        ) : items.length === 0 ? (
          <div className="p-14 text-center">
            <p className="font-serif text-2xl">No links yet</p>
            <p className="mt-1 text-muted">Create your first short link to see it here.</p>
            <Button className="mt-5" onClick={() => dispatch(openCreate())}>New link</Button>
          </div>
        ) : (
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="w-10 p-3">
                  <input type="checkbox" aria-label="Select all" checked={allSelected} onChange={() => dispatch(setSelected(allSelected ? [] : items.map((l) => l.id)))} />
                </th>
                <th className="p-3 font-medium">Short link</th>
                <th className="p-3 font-medium">Destination</th>
                <th className="p-3 text-right font-medium">Clicks</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Created</th>
                <th className="w-[188px] p-3 text-right font-medium"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((l) => (
                <tr key={l.id} className="hover:bg-paper/60">
                  <td className="p-3">
                    <input type="checkbox" aria-label={`Select ${l.shortCode}`} checked={selectedIds.includes(l.id)} onChange={() => dispatch(toggleSelected(l.id))} />
                  </td>
                  <td className="p-3">
                    <div className="flex max-w-64 items-center gap-1">
                      <a
                        href={l.shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={l.shortUrl}
                        className="group flex min-w-0 items-center gap-1.5 rounded-md border border-line bg-paper/70 px-2.5 py-1.5 font-mono text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent"
                      >
                        <span className="truncate">{l.shortUrl.replace(/^https?:\/\//, '')}</span>
                        <ExternalLink size={13} className="shrink-0 opacity-60 group-hover:opacity-100" aria-hidden="true" />
                      </a>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 shrink-0 p-0"
                        onClick={() => copyToClipboard(l.shortUrl)}
                        title="Copy short link"
                        aria-label={`Copy short link ${l.shortCode}`}
                      >
                        <Copy size={15} aria-hidden="true" />
                      </Button>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {l.isPasswordProtected && <span className="inline-flex items-center gap-1 rounded border border-line px-1.5 text-xs text-muted"><LockKeyhole size={11} aria-hidden="true" /> password</span>}
                      {l.tags.map((t) => <span key={t} className="rounded border border-line px-1.5 text-xs text-muted">{t}</span>)}
                    </div>
                  </td>
                  <td className="max-w-64 p-3"><span className="block truncate text-muted" title={l.originalUrl}>{l.originalUrl}</span></td>
                  <td className="p-3 text-right tabular-nums">
                    {l.clickCount}{l.maxClicks ? <span className="text-muted"> / {l.maxClicks}</span> : null}
                  </td>
                  <td className="p-3"><StatusBadge status={l.status} /></td>
                  <td className="whitespace-nowrap p-3 text-muted">{formatDate(l.createdAt)}</td>
                  <td className="whitespace-nowrap p-2 text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <Link
                        href={`/links/${l.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-line/50 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink"
                        title="View stats"
                        aria-label={`View stats for ${l.shortCode}`}
                      >
                        <BarChart3 size={16} aria-hidden="true" />
                      </Link>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => dispatch(setQrFor(l))} title="Show QR code" aria-label={`Show QR code for ${l.shortCode}`}>
                        <QrCode size={16} aria-hidden="true" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => dispatch(openEdit(l))} title="Edit link" aria-label={`Edit ${l.shortCode}`}>
                        <Pencil size={16} aria-hidden="true" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => toggleActive(l)} title={l.isActive ? 'Disable link' : 'Enable link'} aria-label={`${l.isActive ? 'Disable' : 'Enable'} ${l.shortCode}`}>
                        {l.isActive ? <Power size={16} aria-hidden="true" /> : <PowerOff size={16} aria-hidden="true" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:text-accent" onClick={() => remove([l.id])} title="Delete link" aria-label={`Delete ${l.shortCode}`}>
                        <Trash2 size={16} aria-hidden="true" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted">
          <span>{data?.total} links</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" disabled={filters.page <= 1} onClick={() => dispatch(setFilters({ page: filters.page - 1 }))}>Previous</Button>
            <span>Page {filters.page} of {totalPages}</span>
            <Button size="sm" variant="secondary" disabled={filters.page >= totalPages} onClick={() => dispatch(setFilters({ page: filters.page + 1 }))}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}

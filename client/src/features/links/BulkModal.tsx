'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button, Modal, copyToClipboard } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setBulkOpen } from '@/store/uiSlice';
import type { BulkResult } from '@/types';
import { useBulkCreate } from './hooks';

/** Accepts one URL per line, or a CSV file (first column, or any cell that starts with http). */
function extractUrls(text: string): string[] {
  const urls = text
    .split(/[\n,;\s]+/)
    .map((s) => s.trim().replace(/^"|"$/g, ''))
    .filter((s) => /^https?:\/\//i.test(s));
  return [...new Set(urls)];
}

export default function BulkModal() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.ui.bulkOpen);
  const bulk = useBulkCreate();
  const [text, setText] = useState('');
  const [results, setResults] = useState<BulkResult[] | null>(null);

  const close = () => { dispatch(setBulkOpen(false)); setText(''); setResults(null); };
  const urls = extractUrls(text);

  const run = async () => {
    try {
      setResults(await bulk.mutateAsync(urls.slice(0, 100)));
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const csv = () =>
    ['original_url,short_url,error', ...(results ?? []).map((r) => `"${r.url}","${r.link?.shortUrl ?? ''}","${r.error ?? ''}"`)].join('\n');

  const download = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv()], { type: 'text/csv' }));
    a.download = 'short-links.csv';
    a.click();
  };

  return (
    <Modal open={open} onClose={close} title="Bulk shorten">
      {!results ? (
        <div className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder={'Paste one URL per line\nhttps://example.com/one\nhttps://example.com/two'}
            className="w-full rounded-md border border-line bg-card p-3 font-mono text-sm outline-none focus:border-ink"
          />
          <div className="flex items-center justify-between text-sm text-muted">
            <label className="cursor-pointer underline">
              Upload CSV / TXT
              <input type="file" accept=".csv,.txt" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setText(await f.text()); }} />
            </label>
            <span>{urls.length} valid URL{urls.length === 1 ? '' : 's'} (max 100)</span>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button onClick={run} loading={bulk.isPending} disabled={!urls.length}>Shorten {urls.length || ''}</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <ul className="max-h-72 divide-y divide-line overflow-y-auto rounded-md border border-line bg-card text-sm">
            {results.map((r, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="truncate text-muted">{r.url}</span>
                {r.link ? (
                  <button onClick={() => copyToClipboard(r.link!.shortUrl)} className="shrink-0 cursor-pointer font-mono hover:text-accent">
                    {r.link.shortUrl.replace(/^https?:\/\//, '')}
                  </button>
                ) : (
                  <span className="shrink-0 text-accent">{r.error}</span>
                )}
              </li>
            ))}
          </ul>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={download}>Download CSV</Button>
            <Button onClick={close}>Done</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

'use client';

import { Button } from '@/components/ui';
import LinksTable from '@/features/links/LinksTable';
import { useAppDispatch } from '@/store/hooks';
import { openCreate, setBulkOpen } from '@/store/uiSlice';

export default function LinksPage() {
  const dispatch = useAppDispatch();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-serif text-4xl">Links</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => dispatch(setBulkOpen(true))}>Bulk import</Button>
          <Button onClick={() => dispatch(openCreate())}>New link</Button>
        </div>
      </div>
      <LinksTable />
    </div>
  );
}

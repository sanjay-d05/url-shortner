'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';
import { ConfirmModal, Spinner } from '@/components/ui';
import { useAuth, useLogout, useRequireAuth } from '@/features/auth/hooks';
import BulkModal from '@/features/links/BulkModal';
import CreateEditLinkModal from '@/features/links/CreateEditLinkModal';
import QrModal from '@/features/links/QrModal';

const NAV = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/links', label: 'Links' },
  { href: '/settings', label: 'Settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const status = useRequireAuth();
  const { user } = useAuth();
  const logout = useLogout();
  const pathname = usePathname();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (status !== 'authenticated') {
    return <div className="grid min-h-screen place-items-center"><Spinner /></div>;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-6 md:flex-row md:gap-10">
      <aside className="flex shrink-0 flex-col gap-8 md:sticky md:top-6 md:h-[calc(100vh-3rem)] md:w-48">
        <Logo />
        <nav className="flex gap-1 md:flex-col">
          {NAV.map((n) => {
            const active = pathname === n.href || (n.href === '/links' && pathname.startsWith('/links/'));
            return (
              <Link key={n.href} href={n.href} className={`rounded-md px-3 py-2 text-sm font-medium ${active ? 'bg-ink text-paper' : 'text-muted hover:bg-line/50 hover:text-ink'}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto hidden text-sm md:block">
          <p className="truncate text-muted">{user?.email}</p>
          <button onClick={() => setConfirmOpen(true)} className="mt-1 cursor-pointer underline">Sign out</button>
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
      <CreateEditLinkModal />
      <BulkModal />
      <QrModal />

      <ConfirmModal
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => { setConfirmOpen(false); logout(); }}
        title="Sign out?"
        message="You'll need to sign back in to access your dashboard."
        confirmLabel="Sign out"
        cancelLabel="Stay"
      />
    </div>
  );
}

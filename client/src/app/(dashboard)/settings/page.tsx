'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button, Card, ConfirmModal, Input, Spinner, copyToClipboard, formatDate } from '@/components/ui';
import { useAuth, useLogout } from '@/features/auth/hooks';
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '@/features/links/hooks';
import { API_URL, errorMessage } from '@/lib/api';

export default function SettingsPage() {
  const { user } = useAuth();
  const logout = useLogout();
  const keys = useApiKeys();
  const create = useCreateApiKey();
  const revoke = useRevokeApiKey();
  const [name, setName] = useState('');
  const [fresh, setFresh] = useState<string | null>(null);

  // logout confirm
  const [logoutOpen, setLogoutOpen] = useState(false);

  // revoke confirm
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const revokeTarget = keys.data?.find((k) => k.id === revokeId);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const k = await create.mutateAsync(name.trim());
      setFresh(k.key ?? null);
      setName('');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-4xl">Settings</h1>

      <Card className="p-6">
        <h2 className="font-serif text-xl">Profile</h2>
        <p className="mt-2 text-sm text-muted">Signed in as</p>
        <p className="font-medium">{user?.email}</p>
        <Button variant="secondary" className="mt-4" onClick={() => setLogoutOpen(true)}>Sign out</Button>
      </Card>

      <Card className="p-6">
        <h2 className="font-serif text-xl">API keys</h2>
        <p className="mt-1 text-sm text-muted">
          Send your key in the <code className="font-mono">x-api-key</code> header. Interactive docs live at{' '}
          <a className="underline" href={`${API_URL}/api/docs`} target="_blank" rel="noreferrer">/api/docs</a>.
        </p>

        <form onSubmit={add} className="mt-4 flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Key name, e.g. my-script" maxLength={50} required />
          <Button type="submit" loading={create.isPending}>Create key</Button>
        </form>

        {fresh && (
          <div className="mt-4 rounded-md border border-accent/40 bg-accent/5 p-4 text-sm">
            <p className="font-medium">Copy your key now. It won&apos;t be shown again.</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate font-mono">{fresh}</code>
              <Button size="sm" variant="secondary" onClick={() => copyToClipboard(fresh)}>Copy</Button>
              <Button size="sm" variant="ghost" onClick={() => setFresh(null)}>Dismiss</Button>
            </div>
          </div>
        )}

        <div className="mt-5">
          {keys.isLoading ? <Spinner /> : keys.data?.length === 0 ? (
            <p className="text-sm text-muted">No API keys yet.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {keys.data?.map((k) => (
                <li key={k.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{k.name}</p>
                    <p className="font-mono text-muted">{k.prefix}… · created {formatDate(k.createdAt)}</p>
                  </div>
                  <Button size="sm" variant="danger" onClick={() => setRevokeId(k.id)}>Revoke</Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* Sign out confirmation */}
      <ConfirmModal
        open={logoutOpen}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => { setLogoutOpen(false); logout(); }}
        title="Sign out?"
        message="You'll need to sign back in to access your dashboard."
        confirmLabel="Sign out"
        cancelLabel="Stay"
      />

      {/* Revoke API key confirmation */}
      <ConfirmModal
        open={!!revokeId}
        onCancel={() => setRevokeId(null)}
        onConfirm={() => { revoke.mutate(revokeId!); setRevokeId(null); }}
        title="Revoke API key?"
        message={revokeTarget ? `"${revokeTarget.name}" will stop working immediately. This cannot be undone.` : undefined}
        confirmLabel="Revoke key"
        cancelLabel="Cancel"
      />
    </div>
  );
}

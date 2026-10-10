'use client';

import axios from 'axios';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import Logo from '@/components/Logo';
import { Button, Card, Field, Input } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';

export default function ProtectedLinkPage() {
  const code = useParams<{ code: string }>().code;
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post<{ url: string }>(`/api/public/unlock/${encodeURIComponent(code)}`, { password });
      window.location.href = data.url;
    } catch (err) {
      setError(axios.isAxiosError(err) && err.response?.status === 403 ? 'Incorrect password' : errorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-screen max-w-md content-center gap-8 px-6">
      <Logo />
      <Card className="p-8">
        <h1 className="font-serif text-3xl">This link is protected</h1>
        <p className="mt-2 text-sm text-muted">Enter the password to continue to the destination.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Password" error={error}>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus required />
          </Field>
          <Button type="submit" className="w-full" loading={loading}>Continue</Button>
        </form>
      </Card>
    </div>
  );
}

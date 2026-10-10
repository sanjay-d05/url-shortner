'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import Logo from '@/components/Logo';
import { Button, Card, Field, Input } from '@/components/ui';
import { useAuth, useAuthMutation } from '@/features/auth/hooks';
import { errorMessage } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters').max(72),
});

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const mutation = useAuthMutation(mode);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  useEffect(() => { if (isAuthenticated) router.replace('/dashboard'); }, [isAuthenticated, router]);

  const isLogin = mode === 'login';
  return (
    <div className="mx-auto grid min-h-screen max-w-md content-center gap-8 px-6">
      <Logo />
      <Card className="p-8">
        <h1 className="font-serif text-3xl">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="mt-6 space-y-4">
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" autoComplete="email" {...register('email')} />
          </Field>
          <Field label="Password" error={errors.password?.message}>
            <Input type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} {...register('password')} />
          </Field>
          {mutation.error && <p className="text-sm text-accent">{errorMessage(mutation.error)}</p>}
          <Button type="submit" className="w-full" loading={mutation.isPending}>{isLogin ? 'Sign in' : 'Create account'}</Button>
        </form>
      </Card>
      <p className="text-sm text-muted">
        {isLogin ? 'New here? ' : 'Already have an account? '}
        <Link href={isLogin ? '/register' : '/login'} className="text-ink underline">{isLogin ? 'Create an account' : 'Sign in'}</Link>
      </p>
    </div>
  );
}

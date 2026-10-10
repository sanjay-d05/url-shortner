'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button, Field, Input, Modal, PasswordInput, copyToClipboard } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeCreate } from '@/store/uiSlice';
import { useCreateLink, useUpdateLink } from './hooks';

const schema = z.object({
  url: z.string().url('Enter a full URL, e.g. https://example.com'),
  alias: z.string().regex(/^([A-Za-z0-9_-]{3,32})?$/, '3-32 characters: letters, numbers, - or _').optional(),
  expiresAt: z.string().optional(),
  maxClicks: z.string().regex(/^(\d+)?$/, 'Whole number').optional(),
  password: z.string().refine((v) => v === '' || v.length >= 4, 'At least 4 characters').optional(),
  removePassword: z.boolean().optional(),
  tags: z.string().optional(),
  utm: z.boolean().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

/** Appends UTM parameters to a URL (the "UTM builder"). */
function withUtm(url: string, v: FormValues) {
  if (!v.utm) return url;
  const u = new URL(url);
  if (v.utmSource) u.searchParams.set('utm_source', v.utmSource);
  if (v.utmMedium) u.searchParams.set('utm_medium', v.utmMedium);
  if (v.utmCampaign) u.searchParams.set('utm_campaign', v.utmCampaign);
  return u.toString();
}

export default function CreateEditLinkModal() {
  const dispatch = useAppDispatch();
  const { createOpen, editing } = useAppSelector((s) => s.ui);
  const create = useCreateLink();
  const update = useUpdateLink();
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });
  const { register, handleSubmit, reset, watch, formState: { errors } } = form;
  const close = () => dispatch(closeCreate());

  useEffect(() => {
    if (!createOpen) return;
    reset({
      url: editing?.originalUrl ?? '',
      alias: '',
      expiresAt: toLocalInput(editing?.expiresAt ?? null),
      maxClicks: editing?.maxClicks?.toString() ?? '',
      password: '',
      removePassword: false,
      tags: editing?.tags.join(', ') ?? '',
      utm: false,
    });
  }, [createOpen, editing, reset]);

  const onSubmit = handleSubmit(async (v) => {
    const tags = (v.tags ?? '').split(',').map((t) => t.trim()).filter(Boolean);
    const expiresAt = v.expiresAt ? new Date(v.expiresAt).toISOString() : null;
    const maxClicks = v.maxClicks ? Number(v.maxClicks) : null;
    try {
      if (editing) {
        await update.mutateAsync({
          id: editing.id,
          url: withUtm(v.url, v),
          expiresAt,
          maxClicks,
          tags,
          ...(v.removePassword ? { password: null } : v.password ? { password: v.password } : {}),
        });
        toast.success('Link updated');
      } else {
        const link = await create.mutateAsync({
          url: withUtm(v.url, v),
          alias: v.alias || undefined,
          expiresAt: expiresAt ?? undefined,
          maxClicks: maxClicks ?? undefined,
          password: v.password || undefined,
          tags: tags.length ? tags : undefined,
        });
        copyToClipboard(link.shortUrl);
      }
      close();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  });

  return (
    <Modal
      open={createOpen}
      onClose={close}
      title={editing ? 'Edit link' : 'New link'}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={close}>Cancel</Button>
          <Button type="submit" form="link-form" loading={create.isPending || update.isPending}>
            {editing ? 'Save changes' : 'Create & copy link'}
          </Button>
        </>
      }
    >
      <form id="link-form" onSubmit={onSubmit} className="space-y-4">
        <Field label="Destination URL" error={errors.url?.message}>
          <Input placeholder="https://example.com/very/long/url" autoFocus {...register('url')} />
        </Field>

        {!editing && (
          <Field label="Custom alias" error={errors.alias?.message} hint="Optional. Leave empty for a random code.">
            <Input placeholder="my-portfolio" {...register('alias')} />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Expires" error={errors.expiresAt?.message}>
            <Input type="datetime-local" {...register('expiresAt')} />
          </Field>
          <Field label="Max clicks" error={errors.maxClicks?.message}>
            <Input inputMode="numeric" placeholder="Unlimited" {...register('maxClicks')} />
          </Field>
        </div>

        <Field
          label="Password"
          error={errors.password?.message}
          hint={editing?.isPasswordProtected ? 'Leave blank to keep the current password.' : 'Optional. Visitors must enter it before being redirected.'}
        >
          <PasswordInput autoComplete="off" placeholder="••••••••" {...register('password')} />
        </Field>
        {editing?.isPasswordProtected && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('removePassword')} /> Remove password protection
          </label>
        )}

        <Field label="Tags" hint="Comma separated, e.g. marketing, launch">
          <Input {...register('tags')} />
        </Field>

        <div className="rounded-md border border-line p-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" {...register('utm')} /> Add UTM parameters
          </label>
          {watch('utm') && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Input placeholder="source" {...register('utmSource')} />
              <Input placeholder="medium" {...register('utmMedium')} />
              <Input placeholder="campaign" {...register('utmCampaign')} />
            </div>
          )}
        </div>

      </form>
    </Modal>
  );
}

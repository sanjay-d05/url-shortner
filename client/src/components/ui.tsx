'use client';

import { forwardRef, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, className, children, disabled, ...rest },
  ref,
) {
  const styles = {
    primary: 'bg-ink text-paper hover:bg-accent',
    secondary: 'bg-card text-ink border border-line hover:border-ink',
    ghost: 'text-muted hover:text-ink hover:bg-line/50',
    danger: 'bg-card text-accent border border-line hover:border-accent',
  }[variant];
  return (
    <button
      ref={ref}
      {...rest}
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
        size === 'sm' ? 'px-2.5 py-1.5 text-sm' : 'px-4 py-2.5 text-sm',
        styles,
        className,
      )}
    >
      {loading && <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
});

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      {...rest}
      className={cx(
        'w-full rounded-md border border-line bg-card px-3 py-2.5 text-sm outline-none placeholder:text-muted/60 focus:border-ink',
        className,
      )}
    />
  );
});

export const PasswordInput = forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>>(
  function PasswordInput({ className, ...rest }, ref) {
    const [show, setShow] = useState(false);
    return (
      <div className="relative">
        <input
          ref={ref}
          type={show ? 'text' : 'password'}
          {...rest}
          className={cx(
            'w-full rounded-md border border-line bg-card px-3 py-2.5 pr-10 text-sm outline-none placeholder:text-muted/60 focus:border-ink',
            className,
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-muted hover:text-ink transition-colors"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? (
            /* eye-off */
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            /* eye */
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    );
  },
);

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-muted">{hint}</span>}
      {error && <span className="block text-xs text-accent">{error}</span>}
    </label>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cx('rounded-lg border border-line bg-card', className)}>{children}</div>;
}

const BADGE: Record<string, string> = {
  active: 'text-ok border-ok/30 bg-ok/10',
  disabled: 'text-muted border-line bg-line/40',
  expired: 'text-warn border-warn/30 bg-warn/10',
  limit_reached: 'text-warn border-warn/30 bg-warn/10',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cx('rounded-full border px-2 py-0.5 text-xs font-medium', BADGE[status] ?? BADGE.disabled)}>
      {status.replace('_', ' ')}
    </span>
  );
}

export function Modal({ open, onClose, title, footer, children }: { open: boolean; onClose: () => void; title: string; footer?: React.ReactNode; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 py-[5vh]" onMouseDown={onClose}>
      <div role="dialog" aria-label={title} onMouseDown={(e) => e.stopPropagation()} className="flex w-full max-w-lg flex-col rounded-lg border border-line bg-paper" style={{ maxHeight: 'calc(100vh - 10vh)' }}>
        {/* sticky header */}
        <div className="flex shrink-0 items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-serif text-2xl">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="cursor-pointer text-2xl leading-none text-muted hover:text-ink">×</button>
        </div>
        {/* scrollable body */}
        <div className="overflow-y-auto p-6">
          {children}
        </div>
        {/* sticky footer */}
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cx('inline-block size-5 animate-spin rounded-full border-2 border-muted border-t-transparent', className)} />;
}

export function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success('Copied to clipboard'),
    () => toast.error('Could not copy'),
  );
}

export function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

/* ------------------------------------------------------------------ */
/* ConfirmModal — smooth animated confirmation dialog                  */
/* ------------------------------------------------------------------ */

const ANIM_STYLES = `
@keyframes _cm-backdrop-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes _cm-dialog-in   { from { opacity: 0; transform: scale(.95) translateY(8px) } to { opacity: 1; transform: scale(1) translateY(0) } }
@keyframes _cm-backdrop-out { from { opacity: 1 } to { opacity: 0 } }
@keyframes _cm-dialog-out   { from { opacity: 1; transform: scale(1) translateY(0) } to { opacity: 0; transform: scale(.95) translateY(8px) } }
._cm-bd-in  { animation: _cm-backdrop-in  200ms ease forwards }
._cm-bd-out { animation: _cm-backdrop-out 180ms ease forwards }
._cm-d-in   { animation: _cm-dialog-in    220ms cubic-bezier(.16,1,.3,1) forwards }
._cm-d-out  { animation: _cm-dialog-out   180ms ease forwards }
`;

type ConfirmModalProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** defaults to 'danger' */
  confirmVariant?: ButtonProps['variant'];
};

export function ConfirmModal({
  open,
  onConfirm,
  onCancel,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
}: ConfirmModalProps) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // inject keyframe styles once
  useEffect(() => {
    if (document.getElementById('_cm-styles')) return;
    const s = document.createElement('style');
    s.id = '_cm-styles';
    s.textContent = ANIM_STYLES;
    document.head.appendChild(s);
  }, []);

  // open → show; close → animate out then hide
  useEffect(() => {
    if (open) {
      setClosing(false);
      setVisible(true);
      setTimeout(() => confirmRef.current?.focus(), 50);
    } else if (visible) {
      setClosing(true);
      const t = setTimeout(() => { setVisible(false); setClosing(false); }, 200);
      return () => clearTimeout(t);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ESC key to cancel
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, onCancel]);

  if (!visible) return null;

  return (
    <div
      className={cx('fixed inset-0 z-50 flex items-center justify-center p-4', closing ? '_cm-bd-out' : '_cm-bd-in')}
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onMouseDown={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="_cm-title"
        aria-describedby={message ? '_cm-desc' : undefined}
        onMouseDown={(e) => e.stopPropagation()}
        className={cx(
          'w-full max-w-sm rounded-xl border border-line bg-paper p-6 shadow-xl',
          closing ? '_cm-d-out' : '_cm-d-in',
        )}
      >
        {/* Icon */}
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h2 id="_cm-title" className="text-base font-semibold text-ink">{title}</h2>
        {message && <p id="_cm-desc" className="mt-1.5 text-sm text-muted">{message}</p>}

        <div className="mt-5 flex gap-2.5">
          <Button
            ref={confirmRef}
            variant={confirmVariant}
            className="flex-1"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

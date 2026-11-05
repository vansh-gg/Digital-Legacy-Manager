/**
 * Shared UI building blocks. Every control has a visible text label,
 * a minimum 44–48px touch target and high-contrast colours.
 */
import { useId } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from 'lucide-react';

export const cx = (...c) => c.filter(Boolean).join(' ');

const BUTTON_VARIANTS = {
  primary: 'bg-deep text-white border-deep hover:bg-midnight shadow-sm',
  accent: 'bg-ice text-midnight border-ice hover:bg-ice-hover hover:border-ice-hover shadow-[0_8px_24px_-12px_rgb(187_214_243/0.55)]',
  secondary: 'bg-white text-deep border-[#c3cfdd] hover:border-deep hover:bg-ice-soft',
  light: 'bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur',
  danger: 'bg-danger text-white border-danger hover:bg-[#7f130c]',
  quiet: 'bg-transparent text-muted border-transparent hover:bg-black/5 hover:text-ink',
  success: 'bg-ok text-white border-ok hover:bg-[#0f4a35] shadow-sm',
};

const BUTTON_SIZES = {
  sm: 'min-h-10 px-3.5 text-[0.9rem] gap-2 rounded-lg',
  md: 'min-h-12 px-5 text-base gap-2.5 rounded-xl',
  lg: 'min-h-14 px-7 text-lg gap-3 rounded-xl',
};

export function Button({ variant = 'primary', size = 'md', icon: Icon, to, href, className, children, loading, ...props }) {
  const classes = cx(
    'inline-flex items-center justify-center border font-bold transition-all duration-150 cursor-pointer text-center no-underline',
    'disabled:opacity-60 disabled:cursor-not-allowed active:translate-y-px',
    BUTTON_SIZES[size],
    BUTTON_VARIANTS[variant],
    className,
  );
  const iconSize = size === 'lg' ? 'size-6' : 'size-5';
  const content = (
    <>
      {loading ? <Loader2 className={cx(iconSize, 'animate-spin')} aria-hidden /> : Icon && <Icon className={cx(iconSize, 'shrink-0')} aria-hidden />}
      <span>{children}</span>
    </>
  );
  if (to) return <Link to={to} className={classes} {...props}>{content}</Link>;
  if (href) return <a href={href} className={classes} {...props}>{content}</a>;
  return (
    <button type="button" className={classes} disabled={loading || props.disabled} {...props}>
      {content}
    </button>
  );
}

export function Card({ className, children, as: Tag = 'section', ...props }) {
  return (
    <Tag className={cx('rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-[var(--shadow-soft)]', className)} {...props}>
      {children}
    </Tag>
  );
}

/** Small coloured square holding an icon. */
export function IconChip({ icon: Icon, tone = 'navy', size = 'md' }) {
  const tones = {
    navy: 'bg-ice-soft text-deep',
    ice: 'bg-midnight text-ice',
    ok: 'bg-ok-soft text-ok',
    warn: 'bg-warn-soft text-warn',
    danger: 'bg-danger-soft text-danger',
  };
  const sizes = { sm: 'size-9 [&>svg]:size-5', md: 'size-11 [&>svg]:size-6', lg: 'size-14 [&>svg]:size-7' };
  return (
    <span className={cx('inline-flex shrink-0 items-center justify-center rounded-xl', tones[tone], sizes[size])}>
      <Icon aria-hidden />
    </span>
  );
}

export function PageHeader({ title, intro, action, back, eyebrow }) {
  return (
    <header className="mb-7">
      {back && (
        <Link to={back.to} className="mb-3 inline-flex items-center gap-2 text-base font-bold no-underline hover:underline">
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          {eyebrow && <p className="mb-1 text-sm font-bold uppercase tracking-[0.14em] text-deep">{eyebrow}</p>}
          <h1 className="font-serif text-3xl font-semibold leading-tight text-midnight sm:text-[2.35rem]">{title}</h1>
          {intro && <p className="mt-2 text-lg text-muted">{intro}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}

const ALERT_TONES = {
  info: { cls: 'bg-ice-soft/70 border-deep/20 text-deep', icon: Info },
  ok: { cls: 'bg-ok-soft border-ok/25 text-ok', icon: CheckCircle2 },
  warn: { cls: 'bg-warn-soft border-warn/25 text-warn', icon: AlertTriangle },
  danger: { cls: 'bg-danger-soft border-danger/25 text-danger', icon: XCircle },
};

export function Alert({ tone = 'info', title, children, className, role }) {
  const { cls, icon: Icon } = ALERT_TONES[tone];
  return (
    <div className={cx('flex gap-3 rounded-xl border p-4 text-base', cls, className)} role={role || (tone === 'danger' ? 'alert' : 'status')}>
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div>
        {title && <p className="font-bold">{title}</p>}
        {children && <div className="text-ink">{children}</div>}
      </div>
    </div>
  );
}

export function Badge({ tone = 'info', children, className }) {
  const tones = {
    info: 'bg-ice-soft text-deep',
    ok: 'bg-ok-soft text-ok',
    warn: 'bg-warn-soft text-warn',
    danger: 'bg-danger-soft text-danger',
    ice: 'bg-ice-soft text-deep',
    neutral: 'bg-black/5 text-ink',
  };
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold', tones[tone], className)}>{children}</span>
  );
}

function FieldShell({ id, label, hint, error, optional, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-base font-bold text-ink">
        {label} {optional && <span className="font-normal text-muted">(optional)</span>}
      </label>
      {hint && <p id={`${id}-hint`} className="text-[0.95rem] text-muted">{hint}</p>}
      {children}
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-2 text-[0.95rem] font-bold text-danger" role="alert">
          <XCircle className="size-5" aria-hidden /> {error}
        </p>
      )}
    </div>
  );
}

const inputClass = (error) =>
  cx(
    'w-full rounded-xl border bg-white px-4 py-2.5 text-base text-ink placeholder:text-[#5b6b80] transition-colors',
    'focus:outline-none focus:ring-4 focus:ring-deep/20',
    error ? 'border-danger' : 'border-[#c3cfdd] focus:border-deep',
  );

const describedBy = (id, hint, error) => [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;

export function TextField({ label, hint, error, optional, multiline, rows = 4, className, trailing, ...props }) {
  const id = useId();
  const Tag = multiline ? 'textarea' : 'input';
  const field = (
    <Tag
      id={id}
      className={cx(inputClass(error), multiline ? 'min-h-32' : 'min-h-12', trailing && 'pr-28', className)}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={describedBy(id, hint, error)}
      rows={multiline ? rows : undefined}
      {...props}
    />
  );
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional}>
      {trailing ? (
        <div className="relative">
          {field}
          <div className="absolute inset-y-0 right-1.5 flex items-center">{trailing}</div>
        </div>
      ) : (
        field
      )}
    </FieldShell>
  );
}

export function SelectField({ label, hint, error, optional, options, ...props }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional}>
      <select
        id={id}
        className={cx(inputClass(error), 'min-h-12 cursor-pointer')}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </FieldShell>
  );
}

/** Large tick-box rows, e.g. for choosing nominees. */
export function CheckboxList({ legend, hint, options, value, onChange, emptyText }) {
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <fieldset className="space-y-2.5">
      <legend className="text-base font-bold">{legend}</legend>
      {hint && <p className="text-[0.95rem] text-muted">{hint}</p>}
      {options.length === 0 && <p className="text-base text-muted">{emptyText}</p>}
      {options.map((o) => (
        <label
          key={o.value}
          className={cx(
            'flex min-h-12 cursor-pointer items-center gap-3.5 rounded-xl border px-4 py-2.5 text-base transition-colors',
            value.includes(o.value) ? 'border-deep bg-ice-soft/60' : 'border-line bg-white hover:border-deep/50',
          )}
        >
          <input type="checkbox" className="size-5 accent-[#173b65]" checked={value.includes(o.value)} onChange={() => toggle(o.value)} />
          <Avatar name={o.label} size="sm" />
          <span>
            <span className="font-bold">{o.label}</span>
            {o.description && <span className="block text-sm text-muted">{o.description}</span>}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

const AVATAR_COLORS = ['#173b65', '#2f5d8a', '#445873', '#1e4a7d', '#101f33', '#355f8f'];

/** Initials in a coloured circle. */
export function Avatar({ name = '', size = 'md' }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
  const color = AVATAR_COLORS[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
  const sizes = { sm: 'size-8 text-xs', md: 'size-11 text-sm', lg: 'size-14 text-base' };
  return (
    <span
      className={cx('inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-white', sizes[size])}
      style={{ background: color }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

/** Circular progress indicator with content in the middle. */
export function Ring({ value, max = 100, size = 120, stroke = 10, color = '#bbd6f3', track = 'rgb(255 255 255 / 0.15)', children, label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex items-center gap-3 py-10 text-base text-muted" role="status">
      <Loader2 className="size-6 animate-spin" aria-hidden /> {label}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <Alert tone="danger" title="Sorry, something went wrong">
      <p>{error?.message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Alert>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <Card className="relative overflow-hidden py-14 text-center">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ice-soft/60 to-transparent" />
      {Icon && (
        <span className="relative mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-midnight text-ice shadow-[var(--shadow-lift)]">
          <Icon className="size-8" aria-hidden />
        </span>
      )}
      <h2 className="relative font-serif text-2xl font-semibold text-midnight">{title}</h2>
      {children && <p className="relative mx-auto mt-2 max-w-xl text-lg text-muted">{children}</p>}
      {action && <div className="relative mt-7">{action}</div>}
    </Card>
  );
}

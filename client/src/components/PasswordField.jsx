import { useState } from 'react';
import { Eye, EyeOff, Check, Circle } from 'lucide-react';
import { TextField } from './ui.jsx';

/** Password input with a clearly-labelled "Show password" button. */
export function PasswordField({ label = 'Password', ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      label={label}
      type={visible ? 'text' : 'password'}
      {...props}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-bold text-deep hover:bg-ice-soft cursor-pointer"
          aria-pressed={visible}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          {visible ? 'Hide' : 'Show'}
        </button>
      }
    />
  );
}

export const PASSWORD_RULES = [
  { test: (p) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p) => /[A-Za-z]/.test(p), label: 'At least one letter' },
  { test: (p) => /[0-9]/.test(p), label: 'At least one number' },
];

export function PasswordRules({ password }) {
  return (
    <ul className="space-y-1" aria-label="Password requirements">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(password);
        return (
          <li key={r.label} className={`flex items-center gap-2 text-sm ${ok ? 'font-bold text-ok' : 'text-muted'}`}>
            {ok ? <Check className="size-5" aria-hidden /> : <Circle className="size-5" aria-hidden />}
            {r.label}
            <span className="sr-only">{ok ? '(done)' : '(not yet)'}</span>
          </li>
        );
      })}
    </ul>
  );
}

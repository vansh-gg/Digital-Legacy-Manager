import { Outlet, useLocation } from 'react-router-dom';
import { Lock, HeartHandshake, ShieldCheck } from 'lucide-react';
import { AccessibilityBar } from './AccessibilityBar.jsx';
import { Logo } from './Logo.jsx';
import { Button } from './ui.jsx';

/** The landing page draws its own full-bleed header; other public pages get this one. */
export function PublicLayout() {
  const { pathname } = useLocation();
  const isLanding = pathname === '/';
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">Skip to main content</a>
      {!isLanding && (
        <header className="border-b border-line bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <Logo />
            <AccessibilityBar />
          </div>
        </header>
      )}
      <main id="main" className="flex-1" tabIndex={-1}>
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-navy-950 text-white/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-md">
          <Logo tone="light" />
          <p className="mt-3 text-sm">
            A calm, secure place for your accounts, documents and wishes — released only to the people you trust, only when
            they truly need them.
          </p>
        </div>
        <div className="text-sm md:text-right">
          <p>AES-256 encrypted · Built for accessibility</p>
          <p className="mt-1 text-white/45">Not a substitute for a registered legal will.</p>
        </div>
      </div>
    </footer>
  );
}

const REASSURANCE = [
  { icon: Lock, text: 'Bank-grade encryption for every password, file and letter' },
  { icon: ShieldCheck, text: 'Nothing is shared until you stop checking in — and you can always undo it' },
  { icon: HeartHandshake, text: 'Designed with older users and their families in mind' },
];

/** Split-screen card used by login, sign-up and similar pages. */
export function AuthCard({ title, intro, children }) {
  return (
    <div className="mx-auto grid max-w-6xl gap-0 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:py-14">
      <aside className="bg-hero grain relative hidden overflow-hidden rounded-l-3xl p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="relative">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-gold">Digital Legacy Manager</p>
          <p className="mt-5 font-serif text-[2rem] font-semibold leading-tight">
            Peace of mind for you. <span className="text-gold-gradient">Clarity for your family.</span>
          </p>
        </div>
        <ul className="relative space-y-5">
          {REASSURANCE.map(({ icon: Icon, text }) => (
            <li key={text} className="flex gap-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-gold">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="pt-1.5 text-white/85">{text}</span>
            </li>
          ))}
        </ul>
        <Button to="/" variant="light" size="sm" className="relative w-fit">← Back to home</Button>
      </aside>
      <div className="rounded-3xl border border-line bg-white p-6 shadow-[var(--shadow-soft)] sm:p-10 lg:rounded-l-none">
        <h1 className="font-serif text-3xl font-semibold text-navy-900">{title}</h1>
        {intro && <p className="mt-2 text-lg text-muted">{intro}</p>}
        <div className="mt-7">{children}</div>
      </div>
    </div>
  );
}

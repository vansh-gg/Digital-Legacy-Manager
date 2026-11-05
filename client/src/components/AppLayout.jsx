import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { House, Wallet, FileText, Users, Mail, Gift, History, Settings, LogOut, Menu, X, Inbox } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { AccessibilityBar } from './AccessibilityBar.jsx';
import { Logo } from './Logo.jsx';
import { StatusBanner } from './StatusBanner.jsx';
import { Avatar } from './ui.jsx';

const NAV_GROUPS = [
  {
    label: 'My plan',
    items: [
      { to: '/app', label: 'Home', icon: House, end: true },
      { to: '/app/assets', label: 'Accounts & assets', icon: Wallet },
      { to: '/app/documents', label: 'Documents', icon: FileText },
      { to: '/app/nominees', label: 'Trusted people', icon: Users },
      { to: '/app/letters', label: 'Personal letters', icon: Mail },
    ],
  },
  {
    label: 'Family',
    items: [{ to: '/app/shared', label: 'Left for me', icon: Gift }],
  },
  {
    label: 'Account',
    items: [
      { to: '/app/activity', label: 'Activity history', icon: History },
      { to: '/app/settings', label: 'Settings', icon: Settings },
    ],
  },
];

function NavItems({ devTools }) {
  return (
    <nav aria-label="Main menu" className="space-y-6">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-xs font-bold uppercase tracking-[0.18em] text-white/45">{group.label}</p>
          <ul className="space-y-1">
            {group.items.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-[0.98rem] font-bold no-underline transition-colors ${
                      isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-gold" aria-hidden />}
                      <Icon className={`size-5 shrink-0 ${isActive ? 'text-gold' : ''}`} aria-hidden />
                      {label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {devTools && (
        <NavLink
          to="/dev/mailbox"
          className="flex min-h-10 items-center gap-3 rounded-xl border border-dashed border-white/20 px-3 text-sm font-bold text-white/60 no-underline hover:text-white"
        >
          <Inbox className="size-4 shrink-0" aria-hidden /> Demo mailbox
        </NavLink>
      )}
    </nav>
  );
}

function UserCard({ user, onSignOut }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-3">
        <Avatar name={user?.name} />
        <div className="min-w-0">
          <p className="truncate font-bold text-white">{user?.name}</p>
          <p className="truncate text-sm text-white/55">{user?.email}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onSignOut}
        className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/15 text-sm font-bold text-white/80 hover:bg-white/10 hover:text-white cursor-pointer"
      >
        <LogOut className="size-4" aria-hidden /> Log out
      </button>
    </div>
  );
}

export function AppLayout() {
  const { user, logout, devTools } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const signOut = async () => {
    await logout();
    navigate('/login', { replace: true, state: { signedOut: true } });
  };

  return (
    <div className="min-h-screen lg:pl-72">
      <a href="#main" className="skip-link">Skip to main content</a>

      {/* Desktop sidebar */}
      <aside className="bg-hero grain fixed inset-y-0 left-0 z-30 hidden w-72 flex-col overflow-y-auto px-4 py-6 lg:flex">
        <div className="relative px-2">
          <Logo to="/app" tone="light" />
        </div>
        <div className="relative mt-9 flex-1">
          <NavItems devTools={devTools} />
        </div>
        <div className="relative mt-6">
          <UserCard user={user} onSignOut={signOut} />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="bg-hero sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 lg:hidden">
        <Logo to="/app" tone="light" />
        <button
          type="button"
          className="flex min-h-11 items-center gap-2 rounded-xl border border-white/25 px-3 text-sm font-bold text-white cursor-pointer"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          Menu
        </button>
      </header>
      {menuOpen && (
        <div id="mobile-menu" className="bg-navy-950 space-y-6 px-4 pb-6 pt-2 lg:hidden">
          <AccessibilityBar tone="light" />
          <NavItems devTools={devTools} />
          <UserCard user={user} onSignOut={signOut} />
        </div>
      )}

      {/* Desktop utility bar */}
      <div className="sticky top-0 z-20 hidden border-b border-line/80 bg-paper/85 backdrop-blur lg:block">
        <div className="mx-auto flex max-w-6xl items-center justify-end px-8 py-3">
          <AccessibilityBar />
        </div>
      </div>

      <main id="main" className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pt-8" tabIndex={-1}>
        <StatusBanner />
        <Outlet />
      </main>
    </div>
  );
}

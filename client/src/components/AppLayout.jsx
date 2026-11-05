import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { House, Wallet, FileText, Users, Mail, Gift, History, Settings, LogOut, Menu, X, Inbox } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { usePolling } from '../lib/useNow.js';
import { AccessibilityBar } from './AccessibilityBar.jsx';
import { Logo } from './Logo.jsx';
import { StatusBanner } from './StatusBanner.jsx';
import { Avatar } from './ui.jsx';

const NAV_GROUPS = [
  {
    label: 'Start here',
    items: [
      { to: '/app', label: 'Home', icon: House, end: true },
      { to: '/app/shared', label: 'Left for me', icon: Gift, badge: 'leftForMe' },
    ],
  },
  {
    label: 'My plan',
    items: [
      { to: '/app/assets', label: 'Accounts & assets', icon: Wallet },
      { to: '/app/documents', label: 'Documents', icon: FileText },
      { to: '/app/nominees', label: 'Trusted people', icon: Users },
      { to: '/app/letters', label: 'Personal letters', icon: Mail },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/app/activity', label: 'Activity history', icon: History },
      { to: '/app/settings', label: 'Settings', icon: Settings },
    ],
  },
];

function NavItems({ devTools, badges = {} }) {
  return (
    <nav aria-label="Main menu" className="space-y-6">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-xs font-bold uppercase tracking-[0.18em] text-white/65">{group.label}</p>
          <ul className="space-y-1">
            {group.items.map(({ to, label, icon: Icon, end, badge }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `group relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-[0.95rem] font-bold no-underline transition-colors ${
                      isActive ? 'bg-ice text-midnight' : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className="size-[18px] shrink-0" aria-hidden />
                      {label}
                      {badge && badges[badge] > 0 && (
                        <span
                          className={`ml-auto rounded-full px-2 py-0.5 text-xs font-bold ${
                            isActive ? 'bg-midnight text-white' : 'bg-ice text-midnight'
                          }`}
                        >
                          {badges[badge]} ready
                        </span>
                      )}
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
          className="flex min-h-10 items-center gap-3 rounded-xl border border-dashed border-white/20 px-3 text-sm font-bold text-white/75 no-underline hover:text-white"
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
          <p className="truncate text-sm text-white/70">{user?.email}</p>
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
  const { user, setUser, logout, devTools } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  // How many people have released items to this user (badge + mobile shortcut).
  const [leftForMe, setLeftForMe] = useState({ total: 0, ready: 0 });
  useEffect(() => {
    api('/shared')
      .then((r) => setLeftForMe({ total: r.vaults.length, ready: r.vaults.filter((v) => v.ownerStatus === 'RELEASED').length }))
      .catch(() => {});
  }, [location.pathname]);
  const badges = { leftForMe: leftForMe.ready };

  // In live demo mode, refresh the owner's status every 3 seconds so the release appears on screen live.
  const refreshMe = useCallback(() => {
    api('/auth/me').then((r) => setUser(r.user)).catch(() => {});
  }, [setUser]);
  usePolling(refreshMe, 3000, Boolean(user?.liveDemo));

  const signOut = async () => {
    await logout();
    navigate('/login', { replace: true, state: { signedOut: true } });
  };

  return (
    <div className="min-h-screen lg:pl-64">
      <a href="#main" className="skip-link">Skip to main content</a>

      {/* Desktop sidebar */}
      <aside className="bg-hero grain fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-y-auto px-4 py-6 lg:flex">
        <div className="relative px-2">
          <Logo to="/app" tone="light" />
        </div>
        <div className="relative mt-8 flex-1">
          <NavItems devTools={devTools} badges={badges} />
        </div>
        <div className="relative mt-6">
          <UserCard user={user} onSignOut={signOut} />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="bg-hero sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 lg:hidden">
        <Logo to="/app" tone="light" />
        {leftForMe.total > 0 && (
          <NavLink
            to="/app/shared"
            className="ml-auto flex min-h-11 items-center gap-2 rounded-xl bg-ice px-3 text-sm font-bold text-midnight no-underline"
          >
            <Gift className="size-5" aria-hidden />
            <span className="max-[400px]:sr-only">Left for me</span>
            {leftForMe.ready > 0 && <span className="rounded-full bg-midnight px-1.5 text-xs text-white">{leftForMe.ready}</span>}
          </NavLink>
        )}
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
        <div id="mobile-menu" className="bg-midnight-deep space-y-6 px-4 pb-6 pt-2 lg:hidden">
          <AccessibilityBar tone="light" />
          <NavItems devTools={devTools} badges={badges} />
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

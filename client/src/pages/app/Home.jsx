import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  HeartPulse,
  Wallet,
  FileText,
  Users,
  Mail,
  Gift,
  UserPlus,
  ShieldCheck,
  CalendarClock,
  Radio,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../lib/api.js';
import { useApi } from '../../lib/useApi.js';
import { useNow } from '../../lib/useNow.js';
import { firstName, formatDate, formatDateTime, greeting, relativeDays } from '../../lib/format.js';
import { NOMINEE_STATUS } from '../../lib/meta.js';
import { Avatar, Badge, Button, Card, ErrorState, IconChip, Loading, Ring } from '../../components/ui.jsx';

const DAY = 86_400_000;

const STATUS_TEXT = {
  ACTIVE: { label: 'Active — your plan is private and safe', tone: 'text-[#8fe0b8]' },
  REMINDED: { label: 'Reminder sent — check-in due soon', tone: 'text-ice' },
  GRACE: { label: 'Waiting period — we have not heard from you', tone: 'text-[#fca5a5]' },
  RELEASED: { label: 'Released — your plan was handed over', tone: 'text-[#fca5a5]' },
};

/** What the countdown ring shows for each state. */
function countdown(user, now) {
  const live = user.liveDemo;
  const unit = live ? 1000 : DAY;
  const left = (date) => Math.max(0, Math.ceil((new Date(date).getTime() - now) / unit));
  if (user.legacyStatus === 'RELEASED') return { value: 0, max: 1, big: '0', small: 'handed over', label: 'Plan released' };
  if (user.legacyStatus === 'GRACE') {
    const n = left(user.graceEndsAt);
    const max = live ? user.demoGraceSeconds : user.gracePeriodDays;
    return { value: n, max, big: String(n), small: live ? 'seconds to release' : `day${n === 1 ? '' : 's'} to release`, label: `${n} ${live ? 'seconds' : 'days'} until release` };
  }
  const n = left(user.nextCheckInDue);
  const max = live ? user.demoIntervalSeconds : user.checkInIntervalDays;
  return { value: n, max, big: String(n), small: live ? 'seconds left' : `day${n === 1 ? '' : 's'} left`, label: `${n} ${live ? 'seconds' : 'days'} until your next check-in` };
}

/** Midnight banner with greeting and the check-in countdown ring (ticks every second in live demo mode). */
function CheckInHero({ user, onCheckedIn }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const now = useNow(1000, user.liveDemo);
  const status = STATUS_TEXT[user.legacyStatus];
  const ring = countdown(user, now);
  const danger = user.legacyStatus === 'GRACE' || user.legacyStatus === 'RELEASED';

  const checkIn = async () => {
    setBusy(true);
    try {
      const res = await api('/check-in', { method: 'POST' });
      onCheckedIn(res.user);
      toast('Thank you! We have noted that you are well.');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-hero grain relative overflow-hidden rounded-3xl p-6 text-white shadow-[var(--shadow-lift)] sm:p-8">
      <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`flex items-center gap-2 text-sm font-bold ${status.tone}`}>
              <ShieldCheck className="size-4" aria-hidden /> {status.label}
            </p>
            {user.liveDemo && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ice px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-midnight">
                <Radio className="size-3.5" aria-hidden /> Live demo
              </span>
            )}
          </div>
          <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-[2.3rem]">
            {greeting()}, {firstName(user.name)}
          </h1>
          <p className="mt-3 text-base text-white/80">
            {user.liveDemo ? (
              <>
                Live demo: check in every <strong className="text-white">{user.demoIntervalSeconds} seconds</strong>, then a{' '}
                <strong className="text-white">{user.demoGraceSeconds}-second</strong> waiting period before release.
              </>
            ) : (
              <>
                Last check-in {relativeDays(user.lastCheckInAt)}. Next one due on{' '}
                <strong className="text-white">{formatDate(user.nextCheckInDue)}</strong>.
              </>
            )}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button variant="accent" size="lg" icon={HeartPulse} onClick={checkIn} loading={busy}>
              I am well — check in
            </Button>
            <Button to="/app/settings" variant="light" icon={CalendarClock}>Change schedule</Button>
          </div>
        </div>
        <Ring
          value={ring.value}
          max={ring.max || 1}
          size={156}
          stroke={11}
          color={danger ? '#fca5a5' : '#bbd6f3'}
          label={ring.label}
        >
          <span className="font-serif text-5xl font-semibold leading-none" aria-live={user.liveDemo ? 'off' : undefined}>{ring.big}</span>
          <span className="mt-1 max-w-24 text-xs text-white/80">{ring.small}</span>
        </Ring>
      </div>
    </section>
  );
}

const TILES = [
  { key: 'assets', label: 'Accounts & assets', to: '/app/assets', icon: Wallet, tone: 'navy' },
  { key: 'documents', label: 'Documents', to: '/app/documents', icon: FileText, tone: 'ice' },
  { key: 'nominees', label: 'Trusted people', to: '/app/nominees', icon: Users, tone: 'ok' },
  { key: 'letters', label: 'Personal letters', to: '/app/letters', icon: Mail, tone: 'navy' },
];

function ReadinessCard({ steps, unassigned }) {
  const done = steps.filter((s) => s.done).length;
  const percent = Math.round((done / steps.length) * 100);
  const next = steps.find((s) => !s.done);
  return (
    <Card className="lg:col-span-2">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Ring value={percent} size={112} stroke={10} track="#e2ebf5" color="#173b65" label={`Plan ${percent}% ready`}>
          <span className="font-serif text-3xl font-semibold text-midnight">{percent}%</span>
          <span className="text-xs font-bold uppercase tracking-wider text-muted">ready</span>
        </Ring>
        <div className="flex-1">
          <h2 className="font-serif text-2xl font-semibold text-midnight">
            {percent === 100 ? 'Your plan is complete' : 'Your plan is taking shape'}
          </h2>
          <p className="mt-1 text-muted">{done} of {steps.length} steps done.</p>
          {next && (
            <Button to={next.to} size="sm" className="mt-3" icon={ArrowRight}>Next: {next.label}</Button>
          )}
        </div>
      </div>
      <ul className="mt-6 grid gap-1.5 sm:grid-cols-2">
        {steps.map((s) => (
          <li key={s.key}>
            <Link
              to={s.to}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 no-underline transition-colors hover:bg-ice-soft/60 ${
                s.done ? 'text-muted' : 'font-bold text-ink'
              }`}
            >
              {s.done ? (
                <CheckCircle2 className="size-5 shrink-0 text-ok" aria-hidden />
              ) : (
                <Circle className="size-5 shrink-0 text-[#8796aa]" aria-hidden />
              )}
              <span className={s.done ? 'line-through decoration-1' : ''}>{s.label}</span>
              <span className="sr-only">{s.done ? '(done)' : '(to do)'}</span>
            </Link>
          </li>
        ))}
      </ul>
      {unassigned > 0 && (
        <p className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-warn">
          <strong>{unassigned}</strong> item{unassigned > 1 ? 's are' : ' is'} not yet assigned to anyone.{' '}
          <Link to="/app/assets" className="font-bold text-warn">Choose who receives {unassigned > 1 ? 'them' : 'it'} →</Link>
        </p>
      )}
    </Card>
  );
}

/** Uses the same list as the dashboard counts, so the tile and this panel always agree. */
function PeopleCard({ people, counts }) {
  const summary = [
    counts.acceptedNominees && `${counts.acceptedNominees} accepted`,
    counts.pendingNominees && `${counts.pendingNominees} waiting for reply`,
    counts.declinedNominees && `${counts.declinedNominees} declined`,
  ].filter(Boolean);
  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold text-midnight">Trusted people</h2>
        <Link to="/app/nominees" className="text-sm font-bold">Manage</Link>
      </div>
      {people.length === 0 ? (
        <div className="flex flex-1 flex-col items-start justify-center py-6">
          <p className="text-muted">Choose someone you trust completely to receive your plan.</p>
          <Button to="/app/nominees/new" size="sm" icon={UserPlus} className="mt-4">Add a person</Button>
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted">{summary.join(' · ')}</p>
          <ul className="mt-4 space-y-3">
            {people.slice(0, 4).map((n) => {
              const s = NOMINEE_STATUS[n.status];
              return (
                <li key={n.id} className="flex items-start gap-3">
                  <Avatar name={n.name} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold leading-snug">{n.name}</p>
                    <p className="text-sm text-muted">{n.relationship}</p>
                    <Badge tone={s.tone} className="mt-1.5">{s.label}</Badge>
                  </div>
                </li>
              );
            })}
          </ul>
          {people.length > 4 && (
            <Link to="/app/nominees" className="mt-3 text-sm font-bold">and {people.length - 4} more →</Link>
          )}
          {counts.pendingNominees > 0 && (
            <Button to="/app/nominees" variant="secondary" size="sm" className="mt-4 self-start">
              Remind people who have not replied
            </Button>
          )}
        </>
      )}
    </Card>
  );
}

export default function Home() {
  const { user, setUser } = useAuth();
  const { data, loading, error, reload } = useApi('/dashboard');

  const onCheckedIn = (u) => {
    setUser(u);
    reload();
  };

  if (loading && !data) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      <CheckInHero user={user} onCheckedIn={onCheckedIn} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {TILES.map(({ key, label, to, icon, tone }) => (
          <Link
            key={key}
            to={to}
            className="group flex items-center gap-4 rounded-2xl border border-line bg-white p-5 text-ink no-underline shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-lift)]"
          >
            <IconChip icon={icon} tone={tone} size="lg" />
            <div className="flex-1">
              <p className="font-serif text-3xl font-semibold leading-none text-midnight">{data.counts[key]}</p>
              <p className="mt-1 text-[0.95rem] font-bold text-muted">{label}</p>
            </div>
            <ArrowRight className="size-5 text-[#8796aa] transition-transform group-hover:translate-x-0.5 group-hover:text-deep" aria-hidden />
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ReadinessCard steps={data.steps} unassigned={data.counts.unassignedAssets} />
        <PeopleCard people={data.people} counts={data.counts} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-serif text-xl font-semibold text-midnight">Recent activity</h2>
            <Link to="/app/activity" className="text-sm font-bold">See all</Link>
          </div>
          <ol className="mt-5 space-y-0">
            {data.recentActivity.map((a, i) => (
              <li key={a.id} className="relative flex gap-4 pb-5 last:pb-0">
                {i < data.recentActivity.length - 1 && <span className="absolute left-[7px] top-5 h-full w-px bg-line" aria-hidden />}
                <span className="relative mt-1.5 size-[15px] shrink-0 rounded-full border-[3px] border-ice bg-white" aria-hidden />
                <div>
                  <p>{a.detail}</p>
                  <p className="text-sm text-muted">{formatDateTime(a.createdAt)}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Card className={data.counts.sharedWithMe > 0 ? 'bg-ice-soft border-ice/30' : ''}>
          <IconChip icon={Gift} tone="ice" size="lg" />
          <h2 className="mt-4 font-serif text-xl font-semibold text-midnight">Left for me</h2>
          {data.counts.sharedWithMe > 0 ? (
            <>
              <p className="mt-2 text-muted">
                <strong className="text-ink">{data.counts.sharedWithMe}</strong>{' '}
                {data.counts.sharedWithMe === 1 ? 'person has' : 'people have'} chosen you as their trusted person.
              </p>
              <Button to="/app/shared" variant="secondary" size="sm" className="mt-4">See details</Button>
            </>
          ) : (
            <p className="mt-2 text-muted">When someone names you as their trusted person, they will appear here.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

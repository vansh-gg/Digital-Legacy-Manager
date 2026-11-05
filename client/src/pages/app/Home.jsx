import { useCallback, useState } from 'react';
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
  FolderOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../lib/api.js';
import { useApi } from '../../lib/useApi.js';
import { secondsUntil, useNow, usePolling } from '../../lib/useNow.js';
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
            <Button variant="accent" size="lg" icon={HeartPulse} onClick={checkIn} loading={busy} disabled={user.readOnly}>
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

/**
 * Where the plan stands, in order: last check-in, (private) reminder, next due
 * date, the waiting period and when a release would happen or happened.
 */
function PlanTimeline({ user, lastReminderAt }) {
  const live = user.liveDemo;
  const when = (d) => (live ? formatDateTime(d) : formatDate(d));
  const graceText = live ? `${user.demoGraceSeconds} seconds` : `${user.gracePeriodDays} days`;
  const due = new Date(user.nextCheckInDue);
  const wouldRelease = new Date(due.getTime() + (live ? user.demoGraceSeconds * 1000 : user.gracePeriodDays * DAY));
  const st = user.legacyStatus;

  const steps = [
    { key: 'last', label: 'Last check-in', value: when(user.lastCheckInAt), state: 'done' },
    lastReminderAt && (st === 'REMINDED' || st === 'GRACE') && {
      key: 'reminder', label: 'Reminder sent to you', value: when(lastReminderAt), note: 'Only you can see this.', state: 'done',
    },
    st === 'ACTIVE' || st === 'REMINDED'
      ? { key: 'due', label: 'Next check-in due', value: when(user.nextCheckInDue), state: 'current' }
      : { key: 'due', label: 'Check-in was due', value: when(user.nextCheckInDue), state: 'done' },
    st === 'GRACE'
      ? { key: 'grace', label: 'Waiting period ends', value: when(user.graceEndsAt), note: 'Check in before then to stop the release.', state: 'warn' }
      : st === 'RELEASED'
        ? null
        : { key: 'grace', label: 'If you miss it', value: `${graceText} waiting period`, note: 'We keep reminding you and your trusted people.', state: 'future' },
    st === 'RELEASED'
      ? { key: 'release', label: 'Released to trusted people', value: when(user.statusChangedAt), note: 'Check in to lock everything again.', state: 'warn' }
      : {
          key: 'release',
          label: st === 'GRACE' ? 'Release on' : 'Earliest release',
          value: when(st === 'GRACE' ? user.graceEndsAt : wouldRelease),
          note: st === 'GRACE' ? undefined : 'Only if you do not check in.',
          state: st === 'GRACE' ? 'warn' : 'future',
        },
  ].filter(Boolean);

  const dot = {
    done: 'border-deep bg-deep',
    current: 'border-deep bg-white ring-4 ring-ice',
    warn: 'border-danger bg-danger-soft',
    future: 'border-[#8796aa] bg-white',
  };

  return (
    <Card>
      <h2 className="font-serif text-xl font-semibold text-midnight">Plan timeline</h2>
      <ol className="mt-5 grid gap-5 sm:grid-cols-2 lg:flex lg:gap-0">
        {steps.map((s, i) => (
          <li key={s.key} className="relative lg:flex-1 lg:pr-4">
            {i < steps.length - 1 && <span className="absolute left-[9px] top-6 hidden h-px w-[calc(100%-18px)] translate-x-[18px] bg-line lg:block" aria-hidden />}
            <span className={`relative block size-[18px] rounded-full border-[3px] ${dot[s.state]}`} aria-hidden />
            <p className="mt-2 text-sm font-bold uppercase tracking-wider text-muted">{s.label}</p>
            <p className={`font-bold ${s.state === 'warn' ? 'text-danger' : 'text-ink'}`}>{s.value}</p>
            {s.note && <p className="text-sm text-muted">{s.note}</p>}
          </li>
        ))}
      </ol>
    </Card>
  );
}

const VAULT_STATUS = {
  RELEASED: { label: 'Available now', tone: 'info' },
  GRACE: { label: 'Not responding', tone: 'warn' },
  ACTIVE: { label: 'Private for now', tone: 'ok' },
};

/**
 * Shown first for anyone who is also a trusted person, so items left for them
 * are never buried under their own plan.
 */
function LeftForMePanel({ vaults, now }) {
  const ready = vaults.filter((v) => v.ownerStatus === 'RELEASED');
  return (
    <section
      aria-labelledby="left-for-me-heading"
      className={`rounded-3xl border-2 p-5 sm:p-6 ${ready.length ? 'border-deep bg-ice-soft' : 'border-line bg-white'}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconChip icon={Gift} tone="ice" size="lg" />
          <div>
            <h2 id="left-for-me-heading" className="font-serif text-2xl font-semibold text-midnight">Left for me</h2>
            <p className="text-muted">
              {ready.length > 0
                ? `${ready.length} ${ready.length === 1 ? 'person has' : 'people have'} left items you can open now.`
                : `You are a trusted person for ${vaults.length} ${vaults.length === 1 ? 'person' : 'people'}. Nothing is available yet.`}
            </p>
          </div>
        </div>
        <Button to="/app/shared" variant={ready.length ? 'primary' : 'secondary'} icon={ArrowRight}>
          {ready.length ? 'Open Left for me' : 'See details'}
        </Button>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {vaults.map((v) => {
          const st = VAULT_STATUS[v.ownerStatus];
          return (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3">
              <div className="min-w-0">
                <p className="font-bold">{v.ownerName}</p>
                <p className="text-sm text-muted">
                  {v.ownerStatus === 'GRACE' && v.graceEndsAt
                    ? v.liveDemo
                      ? `May open in ${secondsUntil(v.graceEndsAt, now)} seconds`
                      : `May open on ${formatDate(v.graceEndsAt)}`
                    : `${v.counts.assets} items · ${v.counts.documents} documents · ${v.counts.letters} letters`}
                </p>
              </div>
              {v.ownerStatus === 'RELEASED' ? (
                <Button to={`/app/shared/${v.id}`} size="sm" icon={FolderOpen}>Open</Button>
              ) : (
                <Badge tone={st.tone}>{st.label}</Badge>
              )}
            </li>
          );
        })}
      </ul>
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
          <Link to="/app/assets?show=unassigned" className="font-bold text-warn">Show {unassigned > 1 ? 'them' : 'it'} and choose who receives {unassigned > 1 ? 'them' : 'it'} →</Link>
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
  const { data, loading, error, reload, setData } = useApi('/dashboard');
  const leftForMe = data?.leftForMe || [];
  // Follow a live-demo release on screen (e.g. Kavya watching Harish's countdown).
  const live = leftForMe.some((v) => v.liveDemo && v.ownerStatus !== 'RELEASED');
  const refresh = useCallback(() => {
    api('/dashboard').then(setData).catch(() => {});
  }, [setData]);
  usePolling(refresh, 3000, live);
  const now = useNow(1000, live);

  const onCheckedIn = (u) => {
    setUser(u);
    reload();
  };

  if (loading && !data) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      {leftForMe.length > 0 && <LeftForMePanel vaults={leftForMe} now={now} />}
      <CheckInHero user={user} onCheckedIn={onCheckedIn} />
      <PlanTimeline user={user} lastReminderAt={data.timeline?.lastReminderAt} />

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
        <Card className={leftForMe.length ? 'lg:col-span-3' : 'lg:col-span-2'}>
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

        {leftForMe.length === 0 && (
          <Card>
            <IconChip icon={Gift} tone="ice" size="lg" />
            <h2 className="mt-4 font-serif text-xl font-semibold text-midnight">Left for me</h2>
            <p className="mt-2 text-muted">When someone names you as their trusted person, they will appear here.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

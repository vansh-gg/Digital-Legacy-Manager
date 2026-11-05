import { useEffect, useState } from 'react';
import { Users, ShieldCheck, Search, RotateCcw, History, Eye, Lock } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../lib/api.js';
import { useApi } from '../../lib/useApi.js';
import { formatDate, formatDateTime } from '../../lib/format.js';
import { Alert, Badge, Button, Card, ErrorState, IconChip, Loading, PageHeader, SelectField, TextField } from '../../components/ui.jsx';
import { ConfirmDialog, Dialog } from '../../components/Dialog.jsx';

const STATUS = {
  ACTIVE: { label: 'Active', tone: 'ok' },
  REMINDED: { label: 'Reminder sent', tone: 'info' },
  GRACE: { label: 'Waiting period', tone: 'warn' },
  RELEASED: { label: 'Released', tone: 'danger' },
};

/** Plain-language names for activity codes. Admins see what happened and when, never the details. */
const ACTIONS = {
  ACCOUNT_CREATED: 'Account created',
  LOGIN: 'Logged in',
  LOGIN_FAILED: 'Wrong password entered',
  ACCOUNT_LOCKED: 'Account locked after wrong passwords',
  CHECK_IN: 'Checked in',
  REMINDER_SENT: 'Check-in reminder sent',
  GRACE_STARTED: 'Waiting period started',
  VAULT_RELEASED: 'Plan released to trusted people',
  RELEASE_CANCELLED: 'Release cancelled by check-in',
  NOMINEE_ADDED: 'Trusted person added',
  NOMINEE_ACCEPTED: 'Trusted person accepted',
  NOMINEE_DECLINED: 'Trusted person declined',
  NOMINEE_REINVITED: 'Invitation re-sent',
  NOMINEE_REMOVED: 'Trusted person removed',
  NOMINEE_UPDATED: 'Trusted person updated',
  BECAME_NOMINEE: 'Became a trusted person',
  NOMINEE_VIEWED: 'A trusted person opened their items',
  NOMINEE_SECRET_VIEWED: 'A trusted person viewed private details',
  NOMINEE_DOCUMENT_OPENED: 'A trusted person opened a document',
  SHARED_SECRET_VIEWED: 'Viewed items left for them',
  REPORTED_OWNER: 'Reported a concern about someone',
  ASSET_ADDED: 'Item added',
  ASSET_UPDATED: 'Item changed',
  ASSET_REMOVED: 'Item removed',
  SECRET_VIEWED: 'Viewed own private details',
  SECRET_VIEW_DENIED: 'Wrong password when viewing private details',
  DOCUMENT_UPLOADED: 'Document uploaded',
  DOCUMENT_UPDATED: 'Document changed',
  DOCUMENT_OPENED: 'Document opened',
  DOCUMENT_REMOVED: 'Document removed',
  LETTER_WRITTEN: 'Letter written',
  LETTER_UPDATED: 'Letter changed',
  LETTER_REMOVED: 'Letter removed',
  PASSWORD_CHANGED: 'Password changed',
  PASSWORD_RESET: 'Password reset by email',
  PASSWORD_RESET_REQUESTED: 'Password reset requested',
  LOGOUT_ALL: 'Signed out everywhere',
  PROFILE_UPDATED: 'Profile updated',
  CHECK_IN_SETTINGS: 'Check-in schedule changed',
  DEMO_PREVIEW: 'Read-only demo preview opened',
  DEMO_TIME_TRAVEL: 'Demo: time travel',
  LIVE_DEMO_STARTED: 'Live demo started',
  LIVE_DEMO_STOPPED: 'Live demo stopped',
  ADMIN_DEMO_RESET: 'Demo scenarios reset',
};
const actionLabel = (code) => ACTIONS[code] || code.replaceAll('_', ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());

const SCENARIOS = [
  ['ramesh@example.com', 'Active plan, one invitation pending', 'priya@example.com'],
  ['sunita@example.com', 'Reminder sent, check-in due soon', 'karthik@example.com'],
  ['mohan@example.com', 'Missed check-in, waiting period', 'lakshmi@example.com'],
  ['meera@example.com', 'Reported by her daughter, waiting period', 'anjali@example.com'],
  ['gopal@example.com', 'Released to his children', 'vikram@example.com · deepa@example.com'],
  ['harish@example.com', 'Live demo: release in seconds', 'kavya@example.com'],
];

function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, tone: 'neutral' };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

/** When things happen for one account (dates only). */
function PlanDates({ u }) {
  const rows = [
    ['Last check-in', formatDateTime(u.lastCheckInAt)],
    u.legacyStatus === 'GRACE' && ['Release on', formatDateTime(u.graceEndsAt)],
    u.legacyStatus === 'RELEASED' && ['Released on', formatDateTime(u.statusChangedAt)],
    (u.legacyStatus === 'ACTIVE' || u.legacyStatus === 'REMINDED') && ['Next check-in due', formatDateTime(u.nextCheckInDue)],
  ].filter(Boolean);
  return (
    <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt className="text-sm text-muted">{k}</dt>
          <dd className="font-bold">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function AccountActivity({ id, onClose }) {
  const { data, loading, error } = useApi(`/admin/users/${id}/activity`);
  return (
    <Dialog open onClose={onClose} title={data?.user.name || 'Account activity'} wide>
      {loading && <Loading />}
      {error && <Alert tone="danger">{error.message}</Alert>}
      {data && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={data.user.legacyStatus} />
            {data.user.isDemo && <Badge tone="neutral">Demo account</Badge>}
            {data.user.role === 'ADMIN' && <Badge tone="info">Administrator</Badge>}
            {data.user.locked && <Badge tone="danger">Locked</Badge>}
          </div>
          <PlanDates u={data.user} />
          <p className="flex items-start gap-2 rounded-xl bg-mist px-4 py-3 text-sm text-muted">
            <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
            Administrators see what happened and when. Item names, private details, documents, letters and who receives
            what are never shown here.
          </p>
          <ol className="max-h-[50vh] space-y-0 overflow-y-auto pr-1">
            {data.activity.map((e, i) => (
              <li key={e.id} className="relative flex gap-4 pb-4 last:pb-0">
                {i < data.activity.length - 1 && <span className="absolute left-[7px] top-5 h-full w-px bg-line" aria-hidden />}
                <span className="relative mt-1.5 size-[15px] shrink-0 rounded-full border-[3px] border-ice bg-white" aria-hidden />
                <div>
                  <p className="font-bold">{actionLabel(e.action)}</p>
                  <p className="text-sm text-muted">{formatDateTime(e.createdAt)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </Dialog>
  );
}

function DemoTools({ accounts, onReset }) {
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const byEmail = Object.fromEntries(accounts.map((a) => [a.email, a]));

  const reset = async () => {
    try {
      const res = await api('/admin/demo/reset', { method: 'POST' });
      toast(`All ${res.scenarios} demo scenarios were reset (${res.accounts} demo accounts).`);
      setConfirming(false);
      onReset();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-midnight">Demo scenarios</h2>
          <p className="mt-1 max-w-2xl text-muted">
            Logging in normally as a demo owner counts as a check-in and changes their scenario. Use{' '}
            <strong>Read-only demo preview</strong> on the login page to show an owner without changing anything, or reset
            all six scenarios here.
          </p>
        </div>
        <Button icon={RotateCcw} onClick={() => setConfirming(true)}>Reset demo scenarios</Button>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-line text-sm text-muted">
              <th className="py-2 pr-4 font-bold">Owner</th>
              <th className="py-2 pr-4 font-bold">Scenario</th>
              <th className="py-2 pr-4 font-bold">Status now</th>
              <th className="py-2 font-bold">Trusted person login</th>
            </tr>
          </thead>
          <tbody>
            {SCENARIOS.map(([email, label, nominee]) => (
              <tr key={email} className="border-b border-line/70 last:border-0">
                <td className="py-3 pr-4">
                  <p className="font-bold">{byEmail[email]?.name || email.split('@')[0]}</p>
                  <p className="text-sm text-muted">{email}</p>
                </td>
                <td className="py-3 pr-4">{label}</td>
                <td className="py-3 pr-4">{byEmail[email] ? <StatusBadge status={byEmail[email].legacyStatus} /> : <Badge tone="neutral">Missing</Badge>}</td>
                <td className="py-3 text-sm">{nominee}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={reset}
        title="Reset the six demo scenarios?"
        confirmLabel="Yes, reset the demo"
      >
        <p>
          The demo accounts (Ramesh, Sunita, Mohan, Meera, Gopal, Harish and their family members) go back to their starting
          state. The demo password stays the same. <strong>No other account is changed.</strong>
        </p>
      </ConfirmDialog>
    </Card>
  );
}

export default function Admin() {
  const overview = useApi('/admin/overview');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [viewing, setViewing] = useState(null);
  const path = `/admin/users?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(status ? { status } : {}) })}`;
  const users = useApi(path);
  const demo = useApi('/admin/users?q=example.com');

  // Search as the admin types (short pause so we do not query on every key).
  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  if (overview.loading && !overview.data) return <Loading />;
  if (overview.error) return <ErrorState error={overview.error} onRetry={overview.reload} />;
  const { totals, activity } = overview.data;
  const refreshAll = () => {
    overview.reload();
    users.reload();
    demo.reload();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Admin dashboard"
        intro="Account status and system activity. Vault contents and release controls are not available to administrators."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="flex items-center gap-4">
          <IconChip icon={Users} tone="navy" size="lg" />
          <div>
            <p className="font-serif text-3xl font-semibold leading-none text-midnight">{totals.total}</p>
            <p className="mt-1 text-sm font-bold text-muted">Accounts ({totals.demo} demo)</p>
          </div>
        </Card>
        {Object.entries(STATUS).map(([key, s]) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatus(status === key ? '' : key)}
            aria-pressed={status === key}
            className={`cursor-pointer rounded-2xl border bg-white p-5 text-left shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-lift)] ${
              status === key ? 'border-deep ring-2 ring-deep/30' : 'border-line'
            }`}
          >
            <p className="font-serif text-3xl font-semibold leading-none text-midnight">{totals.byStatus[key]}</p>
            <p className="mt-2"><Badge tone={s.tone}>{s.label}</Badge></p>
          </button>
        ))}
      </div>

      <DemoTools accounts={demo.data?.users || []} onReset={refreshAll} />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h2 className="font-serif text-2xl font-semibold text-midnight">Accounts</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_14rem]">
            <TextField label="Search by name or email" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Gopal" />
            <SelectField
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[{ value: '', label: 'All statuses' }, ...Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label }))]}
            />
          </div>
          {users.error && <Alert tone="danger" className="mt-4">{users.error.message}</Alert>}
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-line text-sm text-muted">
                  <th className="py-2 pr-4 font-bold">Account</th>
                  <th className="py-2 pr-4 font-bold">Status</th>
                  <th className="py-2 pr-4 font-bold">Last check-in</th>
                  <th className="py-2 pr-4 font-bold">Trusted people</th>
                  <th className="py-2 font-bold"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {(users.data?.users || []).map((u) => (
                  <tr key={u.id} className="border-b border-line/70 last:border-0">
                    <td className="py-3 pr-4">
                      <p className="font-bold">
                        {u.name}{' '}
                        {u.role === 'ADMIN' && <ShieldCheck className="inline size-4 text-deep" aria-label="Administrator" />}
                      </p>
                      <p className="text-sm text-muted">{u.email}{u.isDemo ? ' · demo' : ''}</p>
                    </td>
                    <td className="py-3 pr-4"><StatusBadge status={u.legacyStatus} /></td>
                    <td className="py-3 pr-4 text-sm">{formatDate(u.lastCheckInAt)}</td>
                    <td className="py-3 pr-4 text-sm">{u.trustedPeople} chosen · trusted by {u.trustedBy}</td>
                    <td className="py-3 text-right">
                      <Button size="sm" variant="secondary" icon={Eye} onClick={() => setViewing(u.id)}>Timeline</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.data && users.data.users.length === 0 && <p className="py-6 text-center text-muted">No accounts match.</p>}
            {users.loading && !users.data && <Loading />}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <History className="size-5 text-deep" aria-hidden />
            <h2 className="font-serif text-2xl font-semibold text-midnight">Recent activity</h2>
          </div>
          <ol className="mt-5 max-h-[38rem] space-y-0 overflow-y-auto pr-1">
            {activity.map((e, i) => (
              <li key={e.id} className="relative flex gap-4 pb-4 last:pb-0">
                {i < activity.length - 1 && <span className="absolute left-[7px] top-5 h-full w-px bg-line" aria-hidden />}
                <span className="relative mt-1.5 size-[15px] shrink-0 rounded-full border-[3px] border-ice bg-white" aria-hidden />
                <div>
                  <p className="font-bold leading-snug">{actionLabel(e.action)}</p>
                  <p className="text-sm text-muted">{e.user?.name} · {formatDateTime(e.createdAt)}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      {viewing && <AccountActivity id={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

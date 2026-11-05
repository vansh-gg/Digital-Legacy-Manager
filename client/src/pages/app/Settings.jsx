import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, KeyRound, LogOut, Trash2, FlaskConical, Inbox, Play, Square, Radio } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { TEXT_SIZES, usePrefs } from '../../context/PrefsContext.jsx';
import { api } from '../../lib/api.js';
import { formatDate } from '../../lib/format.js';
import { secondsUntil, useNow } from '../../lib/useNow.js';
import { Alert, Button, Card, PageHeader, SelectField, TextField } from '../../components/ui.jsx';
import { PasswordField, PasswordRules, PASSWORD_RULES } from '../../components/PasswordField.jsx';
import { ConfirmDialog, Dialog } from '../../components/Dialog.jsx';

const INTERVALS = [7, 14, 30, 60, 90, 180];
const GRACE = [3, 7, 14, 30];

function useSubmit(fn) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async (e) => {
    e?.preventDefault();
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}

function Section({ title, intro, children }) {
  return (
    <Card>
      <h2 className="font-serif text-2xl font-semibold text-midnight">{title}</h2>
      {intro && <p className="mt-1 text-lg text-muted">{intro}</p>}
      <div className="mt-6">{children}</div>
    </Card>
  );
}

const LIVE_PHASE = {
  ACTIVE: 'Active — counting down to the next check-in',
  REMINDED: 'Reminder sent — check-in due very soon',
  GRACE: 'Waiting period — the plan will be released unless you check in',
  RELEASED: 'Released — your trusted people can now open what you left',
};

/** Start / stop live demo mode and watch the countdown. */
function LiveDemoPanel({ user, setUser }) {
  const toast = useToast();
  const [form, setForm] = useState({
    intervalSeconds: user.demoIntervalSeconds || 30,
    graceSeconds: user.demoGraceSeconds || 30,
  });
  const [busy, setBusy] = useState(false);
  const now = useNow(1000, user.liveDemo);

  const start = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api('/dev/live-demo', {
        method: 'POST',
        body: { intervalSeconds: Number(form.intervalSeconds), graceSeconds: Number(form.graceSeconds) },
      });
      setUser(res.user);
      toast(`Live demo started: check in every ${form.intervalSeconds} seconds.`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    setBusy(true);
    try {
      const res = await api('/dev/live-demo', { method: 'DELETE' });
      setUser(res.user);
      toast('Live demo stopped. Back to the normal schedule.');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const target = user.legacyStatus === 'GRACE' ? user.graceEndsAt : user.nextCheckInDue;
  return (
    <div className="space-y-5">
      {user.liveDemo && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-deep/20 bg-ice-soft p-4" role="status">
          <div>
            <p className="flex items-center gap-2 font-bold text-midnight">
              <Radio className="size-4" aria-hidden /> Live demo is running
            </p>
            <p className="text-muted">{LIVE_PHASE[user.legacyStatus]}</p>
          </div>
          {user.legacyStatus !== 'RELEASED' && (
            <p className="font-serif text-3xl font-semibold text-midnight">
              {secondsUntil(target, now)}<span className="ml-1 font-sans text-base text-muted">s</span>
            </p>
          )}
        </div>
      )}
      <form onSubmit={start} className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Check in every (seconds)"
          type="number"
          min={10}
          max={3600}
          value={form.intervalSeconds}
          onChange={(e) => setForm({ ...form, intervalSeconds: e.target.value })}
        />
        <TextField
          label="Then wait before release (seconds)"
          type="number"
          min={10}
          max={3600}
          value={form.graceSeconds}
          onChange={(e) => setForm({ ...form, graceSeconds: e.target.value })}
        />
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <Button type="submit" icon={Play} loading={busy}>{user.liveDemo ? 'Restart with these times' : 'Start live demo'}</Button>
          {user.liveDemo && <Button variant="secondary" icon={Square} onClick={stop} disabled={busy}>Stop live demo</Button>}
          <Button variant="quiet" icon={Inbox} to="/dev/mailbox">Open demo mailbox</Button>
        </div>
      </form>
      <ol className="list-decimal space-y-1 pl-5 text-muted">
        <li>Press <strong className="text-ink">Start live demo</strong> — this counts as a check-in.</li>
        <li>Go to <strong className="text-ink">Home</strong> and watch the countdown. Do not press "I am well".</li>
        <li>When it reaches zero the waiting period starts, and when that ends the plan is released.</li>
        <li>In another browser (or incognito window) log in as the nominee and open <strong className="text-ink">Left for me</strong> — it updates by itself.</li>
        <li>Press <strong className="text-ink">I am well</strong> at any point to lock everything again.</li>
      </ol>
    </div>
  );
}

export default function Settings() {
  const { user, setUser, devTools } = useAuth();
  const { textSize, setTextSize } = usePrefs();
  const toast = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({ name: user.name, phone: user.phone || '' });
  const saveProfile = useSubmit(async () => {
    const res = await api('/auth/me', { method: 'PATCH', body: profile });
    setUser(res.user);
    toast('Your details were saved.');
  });

  const [schedule, setSchedule] = useState({ checkInIntervalDays: user.checkInIntervalDays, gracePeriodDays: user.gracePeriodDays });
  const saveSchedule = useSubmit(async () => {
    const res = await api('/auth/me/check-in-settings', { method: 'PATCH', body: schedule });
    setUser(res.user);
    toast('Your check-in schedule was saved.');
  });

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const changePassword = useSubmit(async () => {
    if (!PASSWORD_RULES.every((r) => r.test(pw.newPassword))) throw new Error('Please follow the password rules.');
    if (pw.newPassword !== pw.confirm) throw new Error('The two new passwords do not match.');
    await api('/auth/change-password', { method: 'POST', body: { currentPassword: pw.currentPassword, newPassword: pw.newPassword } });
    setPw({ currentPassword: '', newPassword: '', confirm: '' });
    toast('Your password was changed. Other devices have been signed out.');
  });

  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const logoutAll = async () => {
    await api('/auth/logout-everywhere', { method: 'POST' });
    setUser(null);
    navigate('/login', { replace: true, state: { signedOut: true } });
  };

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePw, setDeletePw] = useState('');
  const deleteAccount = useSubmit(async () => {
    await api('/auth/me', { method: 'DELETE', body: { password: deletePw } });
    setUser(null);
    navigate('/', { replace: true });
  });

  const timeTravel = async (days) => {
    try {
      const res = await api('/dev/time-travel', { method: 'POST', body: { days } });
      setUser(res.user);
      toast(`Moved ${days} days ahead. Status is now: ${res.user.legacyStatus}.`);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <>
      <PageHeader title="Settings" intro="Your details, check-in schedule and security." />
      <div className="max-w-3xl space-y-6">
        <Section title="Text size" intro="Choose what is most comfortable to read. This is remembered on this device.">
          <div className="flex flex-wrap gap-3" role="group" aria-label="Text size">
            {TEXT_SIZES.map((s) => (
              <Button key={s.value} variant={textSize === s.value ? 'primary' : 'secondary'} aria-pressed={textSize === s.value} onClick={() => setTextSize(s.value)}>
                {s.label}
              </Button>
            ))}
          </div>
        </Section>

        <Section title="Check-in schedule" intro="How often we ask whether you are well, and how long we wait before sharing anything.">
          <form onSubmit={saveSchedule.run} className="space-y-6">
            {saveSchedule.error && <Alert tone="danger">{saveSchedule.error}</Alert>}
            <SelectField
              label="Ask me every"
              value={schedule.checkInIntervalDays}
              onChange={(e) => setSchedule({ ...schedule, checkInIntervalDays: Number(e.target.value) })}
              options={INTERVALS.map((d) => ({ value: d, label: d < 30 ? `${d} days` : d === 30 ? '1 month (30 days)' : `${d / 30} months (${d} days)` }))}
            />
            <SelectField
              label="If I do not answer, wait this long before sharing"
              hint="During this time we keep trying to reach you, and let your trusted people know you are not responding."
              value={schedule.gracePeriodDays}
              onChange={(e) => setSchedule({ ...schedule, gracePeriodDays: Number(e.target.value) })}
              options={GRACE.map((d) => ({ value: d, label: `${d} days` }))}
            />
            <p className="text-lg">Your next check-in is due on <strong>{formatDate(user.nextCheckInDue)}</strong>.</p>
            <Button type="submit" icon={Check} loading={saveSchedule.busy}>Save schedule</Button>
          </form>
        </Section>

        <Section title="My details">
          <form onSubmit={saveProfile.run} className="space-y-6">
            {saveProfile.error && <Alert tone="danger">{saveProfile.error}</Alert>}
            <TextField label="Full name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required />
            <TextField label="Email address" value={user.email} readOnly hint="Your email address cannot be changed here." />
            <TextField label="Mobile number" type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} optional />
            <Button type="submit" icon={Check} loading={saveProfile.busy}>Save my details</Button>
          </form>
        </Section>

        <Section title="Change password">
          <form onSubmit={changePassword.run} className="space-y-6">
            {changePassword.error && <Alert tone="danger">{changePassword.error}</Alert>}
            <PasswordField label="Current password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required />
            <div className="space-y-3">
              <PasswordField label="New password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required />
              <PasswordRules password={pw.newPassword} />
            </div>
            <PasswordField label="Type the new password again" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required />
            <Button type="submit" icon={KeyRound} loading={changePassword.busy}>Change password</Button>
          </form>
        </Section>

        <Section title="Security" intro="If you think someone else may have used your account, sign out everywhere and change your password.">
          <Button variant="secondary" icon={LogOut} onClick={() => setConfirmLogoutAll(true)}>Sign out of all devices</Button>
        </Section>

        {devTools && (
          <Section title="Live demo mode" intro="Count check-ins in seconds instead of days, so you can show a missed check-in and the handover happening live.">
            <LiveDemoPanel user={user} setUser={setUser} />
          </Section>
        )}

        {devTools && !user.liveDemo && (
          <Section title="Jump ahead in time" intro="Pretend days have passed for your own account (normal schedule).">
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" icon={FlaskConical} onClick={() => timeTravel(28)}>+28 days (reminder)</Button>
              <Button variant="secondary" icon={FlaskConical} onClick={() => timeTravel(user.checkInIntervalDays + 1)}>Miss the check-in</Button>
              <Button variant="secondary" icon={FlaskConical} onClick={() => timeTravel(user.gracePeriodDays + 1)}>End the waiting period</Button>
              <Button variant="quiet" icon={Inbox} to="/dev/mailbox">Open demo mailbox</Button>
            </div>
          </Section>
        )}

        <Section title="Delete my account" intro="This permanently deletes your vault, documents and letters. It cannot be undone.">
          <Button variant="danger" icon={Trash2} onClick={() => setDeleteOpen(true)}>Delete my account</Button>
        </Section>
      </div>

      <ConfirmDialog open={confirmLogoutAll} onClose={() => setConfirmLogoutAll(false)} onConfirm={logoutAll} title="Sign out everywhere?" confirmLabel="Yes, sign out">
        <p>You will be signed out on this device and every other device. You can log in again straight away.</p>
      </ConfirmDialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete your account permanently?">
        <form onSubmit={deleteAccount.run} className="space-y-5">
          <Alert tone="danger">Everything in your vault will be deleted. Your trusted people will not receive anything.</Alert>
          {deleteAccount.error && <Alert tone="danger">{deleteAccount.error}</Alert>}
          <TextField label="Type your password to confirm" type="password" value={deletePw} onChange={(e) => setDeletePw(e.target.value)} required />
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>No, keep my account</Button>
            <Button type="submit" variant="danger" loading={deleteAccount.busy}>Delete everything</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

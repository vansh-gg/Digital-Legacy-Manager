import { prisma } from '../db.js';
import { config } from '../config.js';
import { createToken } from '../lib/tokens.js';
import { audit } from '../lib/audit.js';
import { sendMail, appLink } from '../lib/mailer.js';

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Live demo mode counts in seconds; normal mode counts in days. */
export const isLiveDemo = (user) => Boolean(user.demoIntervalSeconds);
export const intervalMs = (user) => (isLiveDemo(user) ? user.demoIntervalSeconds * 1000 : user.checkInIntervalDays * DAY_MS);
export const graceMs = (user) =>
  isLiveDemo(user) && user.demoGraceSeconds ? user.demoGraceSeconds * 1000 : user.gracePeriodDays * DAY_MS;

export const checkInDueAt = (user) => new Date(user.lastCheckInAt.getTime() + intervalMs(user));

/** Safe view of a user for the browser. */
export function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isDemo: user.isDemo,
    checkInIntervalDays: user.checkInIntervalDays,
    gracePeriodDays: user.gracePeriodDays,
    lastCheckInAt: user.lastCheckInAt,
    nextCheckInDue: checkInDueAt(user),
    legacyStatus: user.legacyStatus,
    graceEndsAt: user.graceEndsAt,
    statusReason: user.statusReason,
    statusChangedAt: user.statusChangedAt,
    liveDemo: isLiveDemo(user),
    demoIntervalSeconds: user.demoIntervalSeconds,
    demoGraceSeconds: user.demoGraceSeconds,
    serverNow: new Date(),
    createdAt: user.createdAt,
  };
}

/**
 * The owner has shown they are alive and well (logged in, pressed "I'm OK",
 * or clicked the check-in link in an email). Resets the inactivity timer and
 * cancels any pending or completed release.
 */
export async function recordCheckIn(user, via, req = null) {
  const previous = user.legacyStatus;
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      lastCheckInAt: new Date(),
      legacyStatus: 'ACTIVE',
      graceEndsAt: null,
      statusReason: null,
      ...(previous !== 'ACTIVE' ? { statusChangedAt: new Date() } : {}),
    },
  });
  await audit(user.id, 'CHECK_IN', `You confirmed you are well (${via}).`, req);

  if (previous === 'GRACE' || previous === 'RELEASED') {
    const nominees = await acceptedNominees(user.id);
    for (const n of nominees) {
      await sendMail({
        to: n.email,
        subject: `${user.name} has checked in`,
        heading: `Good news: ${user.name} has checked in`,
        text:
          previous === 'RELEASED'
            ? `Dear ${n.name},\n\n${user.name} has confirmed they are well. The items that were shared with you have been locked again.`
            : `Dear ${n.name},\n\n${user.name} has confirmed they are well. No action is needed from you.`,
      });
    }
    if (previous === 'RELEASED') {
      await audit(user.id, 'RELEASE_CANCELLED', 'You checked in after your vault was released. Access was locked again.', req);
    }
  }
  return updated;
}

export { appLink };

// ---------------------------------------------------------------------------
// Inactivity engine ("dead man's switch")
//
//   ACTIVE ──(shortly before due)──▶ REMINDED ──(due date passes)──▶ GRACE
//      ▲                                                            │
//      └───────────── owner checks in at any point ◀────────────────┤
//                                                                   ▼
//                                            (waiting period ends)  RELEASED
//
// Every transition is a conditional update ("only if still in state X"), so
// running the engine twice at the same moment never sends duplicate emails.
// ---------------------------------------------------------------------------

const acceptedNominees = (ownerId) => prisma.nominee.findMany({ where: { ownerId, status: 'ACCEPTED' } });

/** Atomically move a user from one of `from` states. Returns true if this call made the change. */
async function transition(userId, from, data) {
  const { count } = await prisma.user.updateMany({
    where: { id: userId, legacyStatus: { in: from } },
    data: { ...data, statusChangedAt: new Date() },
  });
  return count === 1;
}

const describeWhen = (user, date) =>
  isLiveDemo(user)
    ? `in about ${Math.max(1, Math.round((date - Date.now()) / 1000))} seconds`
    : `on ${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`;

async function sendCheckInEmail(user, { subject, heading, text }) {
  const token = await createToken({
    type: 'CHECK_IN',
    userId: user.id,
    ttlMinutes: Math.max(60, Math.ceil((intervalMs(user) + graceMs(user)) / 60000) + 7 * 24 * 60),
  });
  await sendMail({ to: user.email, subject, heading, text, link: appLink(`/check-in/${token}`), linkLabel: 'Yes, I am well' });
}

export async function enterGrace(user, { graceEndsAt, reason }) {
  const changed = await transition(user.id, ['ACTIVE', 'REMINDED'], { legacyStatus: 'GRACE', graceEndsAt, statusReason: reason });
  if (!changed) return prisma.user.findUnique({ where: { id: user.id } });

  const when = describeWhen(user, graceEndsAt);
  await sendCheckInEmail(user, {
    subject: 'Urgent: please confirm you are well',
    heading: 'Please let us know you are well',
    text:
      `Dear ${user.name},\n\n${reason}\n\nIf we do not hear from you ${when}, the items you chose will be shared with your nominees.\n\n` +
      'Please press the button below, or simply log in. It takes one click.',
  });
  for (const n of await acceptedNominees(user.id)) {
    await sendMail({
      to: n.email,
      subject: `We are trying to reach ${user.name}`,
      text:
        `Dear ${n.name},\n\nWe have not been able to reach ${user.name} recently. If you can, please check on them ` +
        `and remind them to log in to Digital Legacy Manager.\n\nNothing else is needed from you right now.`,
    });
  }
  await audit(user.id, 'GRACE_STARTED', `${reason} Release scheduled ${when} unless you check in.`);
  return prisma.user.findUnique({ where: { id: user.id } });
}

export async function releaseVault(user) {
  const changed = await transition(user.id, ['GRACE'], { legacyStatus: 'RELEASED', graceEndsAt: null });
  if (!changed) return prisma.user.findUnique({ where: { id: user.id } });

  for (const n of await acceptedNominees(user.id)) {
    await sendMail({
      to: n.email,
      subject: `${user.name} has left items for you`,
      heading: `Items left for you by ${user.name}`,
      text:
        `Dear ${n.name},\n\nWe are sorry that we could not reach ${user.name}. As they wished, the items and messages ` +
        `they chose for you are now available.\n\nPlease log in with your own account to see them.`,
      link: appLink('/app/shared'),
      linkLabel: 'See what was left for me',
    });
  }
  await sendMail({
    to: user.email,
    subject: 'Your vault has been released to your nominees',
    text: `Dear ${user.name},\n\nWe did not hear from you, so your nominees can now see what you left for them.\n\nIf you are well, simply log in and access will be locked again immediately.`,
    link: appLink('/login'),
    linkLabel: 'Log in',
  });
  await audit(user.id, 'VAULT_RELEASED', 'Your vault was released to your accepted nominees.');
  return prisma.user.findUnique({ where: { id: user.id } });
}

/**
 * Apply whichever step is due for one owner, right now. Used by the scheduled
 * sweep and on demand whenever an owner's status is read, so live demos and
 * serverless hosting (cron once a day) still release exactly on time.
 */
export async function evaluateUser(user, now = new Date()) {
  if (!user || user.legacyStatus === 'RELEASED') return user;

  if (user.legacyStatus === 'GRACE') {
    return user.graceEndsAt && now >= user.graceEndsAt ? releaseVault(user) : user;
  }

  const due = checkInDueAt(user);
  const remindAt = isLiveDemo(user)
    ? new Date(due.getTime() - intervalMs(user) / 2)
    : new Date(due.getTime() - Math.min(config.reminderDaysBefore, Math.floor(user.checkInIntervalDays / 2)) * DAY_MS);

  if (now >= due) {
    // Always leave at least one full warning period, even if the server was offline for a while.
    const minWarning = isLiveDemo(user) ? graceMs(user) : DAY_MS;
    const graceEndsAt = new Date(Math.max(due.getTime() + graceMs(user), now.getTime() + Math.min(minWarning, graceMs(user))));
    const reason = isLiveDemo(user)
      ? 'You missed your check-in (live demo).'
      : `You have not checked in since ${user.lastCheckInAt.toDateString()}.`;
    const updated = await enterGrace(user, { graceEndsAt, reason });
    // A long outage may mean the waiting period has already ended too.
    return updated?.legacyStatus === 'GRACE' && updated.graceEndsAt && now >= updated.graceEndsAt ? releaseVault(updated) : updated;
  }

  if (now >= remindAt && user.legacyStatus === 'ACTIVE') {
    if (await transition(user.id, ['ACTIVE'], { legacyStatus: 'REMINDED' })) {
      await sendCheckInEmail(user, {
        subject: 'Friendly reminder: please check in',
        heading: `Hello ${user.name}, how are you?`,
        text: `It is almost time for your regular check-in (due ${describeWhen(user, due)}).\n\nPlease press the button below to tell us you are well. That is all you need to do.`,
      });
      await audit(user.id, 'REMINDER_SENT', 'A check-in reminder was emailed to you.');
    }
    return prisma.user.findUnique({ where: { id: user.id } });
  }
  return user;
}

/** Re-check one owner by id and return their latest record. */
export async function refreshUser(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return evaluateUser(user);
}

/** Scheduled job (hourly locally, daily on Vercel). Safe to run any number of times. */
export async function runInactivitySweep(now = new Date()) {
  const summary = { reminded: 0, grace: 0, released: 0 };
  const users = await prisma.user.findMany({ where: { legacyStatus: { in: ['ACTIVE', 'REMINDED', 'GRACE'] } } });
  for (const user of users) {
    const before = user.legacyStatus;
    const after = (await evaluateUser(user, now))?.legacyStatus;
    if (after === before) continue;
    if (after === 'REMINDED') summary.reminded++;
    if (after === 'GRACE') summary.grace++;
    if (after === 'RELEASED') summary.released++;
  }
  return summary;
}

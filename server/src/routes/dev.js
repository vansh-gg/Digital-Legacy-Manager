/**
 * Demonstration helpers — ONLY mounted when ENABLE_DEV_TOOLS is on
 * (default in development, off in production unless explicitly enabled).
 *
 * - Mailbox: read the emails the system "sent" without configuring SMTP.
 *   In production it only shows emails addressed to the signed-in user.
 * - Time travel: pretend N days have passed for your own account, so the
 *   reminder → grace → release flow can be shown in a classroom demo.
 */
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { audit } from '../lib/audit.js';
import { requireAuth } from '../middleware/auth.js';
import { DAY_MS, publicUser, recordCheckIn, runInactivitySweep } from '../services/legacy.js';

const router = Router();

const mailboxGuard = config.isProd ? [requireAuth] : [];

router.get('/mailbox', ...mailboxGuard, async (req, res) => {
  const emails = await prisma.emailLog.findMany({
    where: req.user ? { to: req.user.email } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ emails, scope: req.user ? 'mine' : 'all' });
});

router.post('/time-travel', requireAuth, async (req, res) => {
  const { days } = z.object({ days: z.number().int().min(1).max(400) }).parse(req.body);
  const shift = (d) => (d ? new Date(d.getTime() - days * DAY_MS) : d);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { lastCheckInAt: shift(req.user.lastCheckInAt), graceEndsAt: shift(req.user.graceEndsAt) },
  });
  await audit(req.user.id, 'DEMO_TIME_TRAVEL', `Demo: moved ${days} days into the future.`, req);
  const summary = await runInactivitySweep();
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json({ user: publicUser(user), summary });
});

/**
 * Live demo mode for the signed-in owner: check-ins and the waiting period are
 * counted in seconds, so "missing a check-in" and the release can be shown live.
 * Starting (or changing) the timers counts as a check-in.
 */
router.post('/live-demo', requireAuth, async (req, res) => {
  const { intervalSeconds, graceSeconds } = z
    .object({
      intervalSeconds: z.number().int().min(10, 'Minimum is 10 seconds.').max(3600, 'Maximum is 3600 seconds.'),
      graceSeconds: z.number().int().min(10, 'Minimum is 10 seconds.').max(3600, 'Maximum is 3600 seconds.'),
    })
    .parse(req.body);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { demoIntervalSeconds: intervalSeconds, demoGraceSeconds: graceSeconds },
  });
  const fresh = await prisma.user.findUnique({ where: { id: req.user.id } });
  const user = await recordCheckIn(fresh, 'started live demo', req);
  await audit(user.id, 'LIVE_DEMO_STARTED', `Live demo: check in every ${intervalSeconds}s, then wait ${graceSeconds}s before release.`, req);
  res.json({ user: publicUser(user) });
});

router.delete('/live-demo', requireAuth, async (req, res) => {
  await prisma.user.update({ where: { id: req.user.id }, data: { demoIntervalSeconds: null, demoGraceSeconds: null } });
  const fresh = await prisma.user.findUnique({ where: { id: req.user.id } });
  const user = await recordCheckIn(fresh, 'stopped live demo', req);
  await audit(user.id, 'LIVE_DEMO_STOPPED', 'Live demo ended; back to the normal schedule.', req);
  res.json({ user: publicUser(user) });
});

export default router;

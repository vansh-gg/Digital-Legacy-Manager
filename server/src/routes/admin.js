/**
 * Administrator area. Every route checks the ADMIN role on the server.
 *
 * Admins can see who has an account and where each plan stands (status and
 * dates), browse a basic activity timeline, and reset the demo scenarios.
 * They can NOT see vault contents (items, secrets, documents, letters, who
 * receives what) and can NOT release, lock or check in for anyone.
 */
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db.js';
import { audit } from '../lib/audit.js';
import { badRequest, notFound } from '../lib/http.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { checkInDueAt, isLiveDemo } from '../services/legacy.js';
import { DEMO_EMAILS, currentDemoHash, resetDemoData } from '../services/demoData.js';

const router = Router();
router.use(requireAuth, requireAdmin);

const STATUSES = ['ACTIVE', 'REMINDED', 'GRACE', 'RELEASED'];

/** Account summary for admins: status and dates only, never vault contents. */
const accountDto = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  isDemo: u.isDemo,
  legacyStatus: u.legacyStatus,
  lastCheckInAt: u.lastCheckInAt,
  nextCheckInDue: checkInDueAt(u),
  graceEndsAt: u.graceEndsAt,
  statusChangedAt: u.statusChangedAt,
  liveDemo: isLiveDemo(u),
  locked: Boolean(u.lockedUntil && u.lockedUntil > new Date()),
  createdAt: u.createdAt,
  trustedPeople: u._count?.nominees ?? 0,
  trustedBy: u._count?.nomineeOf ?? 0,
});

/** Activity entries without their free-text detail (which can mention item names). */
const eventDto = (e) => ({ id: e.id, action: e.action, createdAt: e.createdAt, user: e.user ? { id: e.user.id, name: e.user.name } : undefined });

router.get('/overview', async (req, res) => {
  const [total, demo, admins, grouped, recent] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isDemo: true } }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.user.groupBy({ by: ['legacyStatus'], _count: { _all: true } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 40,
      select: { id: true, action: true, createdAt: true, user: { select: { id: true, name: true } } },
    }),
  ]);
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const g of grouped) byStatus[g.legacyStatus] = g._count._all;
  res.json({ totals: { total, demo, admins, byStatus }, activity: recent.map(eventDto), demoEmails: DEMO_EMAILS.length });
});

router.get('/users', async (req, res) => {
  const { q, status } = z
    .object({ q: z.string().trim().max(100).optional(), status: z.enum(STATUSES).optional() })
    .parse(req.query);
  const users = await prisma.user.findMany({
    where: status ? { legacyStatus: status } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 500,
    include: { _count: { select: { nominees: true, nomineeOf: true } } },
  });
  const needle = q?.toLowerCase();
  const matches = needle ? users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(needle)) : users;
  res.json({ users: matches.slice(0, 200).map(accountDto) });
});

router.get('/users/:id/activity', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { nominees: true, nomineeOf: true } } },
  });
  if (!user) throw notFound();
  const events = await prisma.auditLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, action: true, createdAt: true },
  });
  res.json({ user: accountDto(user), activity: events.map(eventDto) });
});

/**
 * Put the six demo scenarios back to their starting state. Only accounts
 * flagged as demo are touched; the demo password stays the same.
 */
router.post('/demo/reset', async (req, res) => {
  let passwordHash = await currentDemoHash();
  if (!passwordHash && process.env.DEMO_PASSWORD?.length >= 8) {
    passwordHash = await bcrypt.hash(process.env.DEMO_PASSWORD, 12);
  }
  if (!passwordHash) throw badRequest('Set DEMO_PASSWORD on the server (or run "npm run seed" once) before resetting the demo.');
  const result = await resetDemoData({ passwordHash });
  await audit(req.user.id, 'ADMIN_DEMO_RESET', 'You reset the six demo scenarios.', req);
  res.json({ ok: true, ...result });
});

export default router;

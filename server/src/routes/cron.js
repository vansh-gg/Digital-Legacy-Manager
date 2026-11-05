/**
 * Scheduled inactivity sweep for serverless hosting (Vercel Cron).
 * Vercel calls GET /api/cron/sweep with "Authorization: Bearer <CRON_SECRET>".
 * When running as a normal Node server, node-cron in src/index.js does this instead.
 */
import crypto from 'node:crypto';
import { Router } from 'express';
import { config } from '../config.js';
import { notFound } from '../lib/http.js';
import { runInactivitySweep } from '../services/legacy.js';

const router = Router();

function authorised(req) {
  if (!config.cronSecret) return false;
  const expected = Buffer.from(`Bearer ${config.cronSecret}`);
  const given = Buffer.from(req.get('authorization') || '');
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

router.get('/sweep', async (req, res) => {
  if (!authorised(req)) throw notFound();
  res.json({ ok: true, summary: await runInactivitySweep() });
});

export default router;

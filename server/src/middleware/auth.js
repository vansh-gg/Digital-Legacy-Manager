import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { prisma } from '../db.js';
import { forbidden, unauthorized } from '../lib/http.js';
import { evaluateUser } from '../services/legacy.js';

const COOKIE = 'dlm_session';

/** Issue a session as an HttpOnly cookie (JavaScript in the page can never read it). */
export function setSession(res, user, { readOnly = false } = {}) {
  const token = jwt.sign({ sub: user.id, tv: user.tokenVersion, ...(readOnly ? { ro: true } : {}) }, config.jwtSecret, {
    expiresIn: `${config.sessionHours}h`,
    algorithm: 'HS256',
  });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProd,
    maxAge: config.sessionHours * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearSession(res) {
  res.clearCookie(COOKIE, { path: '/', httpOnly: true, sameSite: 'lax', secure: config.isProd });
}

export async function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE];
  if (!token) throw unauthorized();
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
  } catch {
    clearSession(res);
    throw unauthorized('Your session has ended. Please log in again.');
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  // tokenVersion changes on password change / "log out everywhere".
  if (!user || user.tokenVersion !== payload.tv) {
    clearSession(res);
    throw unauthorized('Your session has ended. Please log in again.');
  }
  // A read-only demo preview may look at everything but change nothing (not even a check-in).
  req.readOnly = payload.ro === true;
  if (req.readOnly && !SAFE_METHODS.has(req.method)) {
    throw forbidden('This is a read-only demo preview. Log in normally to make changes.');
  }
  // Apply any check-in step that has become due (keeps live demos and daily-cron hosting exact).
  req.user = await evaluateUser(user);
  next();
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Only administrators. Checked on the server for every admin endpoint. */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') throw forbidden('This area is only for administrators.');
  next();
}

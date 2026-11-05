import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Load server/.env (created by `npm run setup`). Real environment variables win.
try {
  process.loadEnvFile(path.join(serverRoot, '.env'));
} catch {
  /* no .env file — rely on the real environment */
}

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}. Run "npm run setup" first.`);
  }
  return value;
}

const env = process.env.NODE_ENV || 'development';
const isProd = env === 'production';
const onVercel = Boolean(process.env.VERCEL);

/** Public address of the web app, used in email links. */
function clientUrl() {
  if (process.env.CLIENT_URL) return process.env.CLIENT_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return 'http://localhost:5173';
}

export const config = {
  env,
  isProd,
  isTest: env === 'test',
  onVercel,
  // API_PORT wins so the API never collides with a front-end dev server's PORT.
  port: Number(process.env.API_PORT || process.env.PORT || 4000),
  jwtSecret: required('JWT_SECRET'),
  encryptionKey: required('ENCRYPTION_KEY'),
  clientUrl: clientUrl(),
  sessionHours: 4,
  // Vercel functions accept request bodies up to 4.5 MB.
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || (onVercel ? 4 : 10)),
  /** Secret Vercel Cron sends as "Authorization: Bearer <CRON_SECRET>". */
  cronSecret: process.env.CRON_SECRET || '',
  /** Days before the check-in deadline that the first reminder is sent. */
  reminderDaysBefore: 3,
  /** Wrong passwords allowed before the account is locked for lockMinutes. */
  maxFailedLogins: 5,
  lockMinutes: 15,
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'Digital Legacy Manager <no-reply@dlm.local>',
  },
  /** Demo helpers (mailbox, time travel). Never enable on a real deployment. */
  devTools: process.env.ENABLE_DEV_TOOLS ? process.env.ENABLE_DEV_TOOLS === 'true' : !isProd,
};

if (Buffer.from(config.encryptionKey, 'base64').length !== 32) {
  throw new Error('ENCRYPTION_KEY must be 32 bytes, base64-encoded. Run "npm run setup" to generate one.');
}
if (config.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long.');
}

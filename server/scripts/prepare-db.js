/**
 * Build-time database preparation for hosted deployments (Vercel).
 *
 *  - If DATABASE_URL is PostgreSQL (e.g. Neon), switch the Prisma provider
 *    from SQLite to PostgreSQL, regenerate the client and create/update tables.
 *  - If SEED_DEMO=true, load the demo family (Ramesh & Priya) for presentations.
 *
 * Locally (SQLite) this does nothing — use `npm run setup` instead.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schemaPath = path.join(root, 'prisma', 'schema.prisma');
const url = process.env.DATABASE_URL || '';

if (!/^postgres(ql)?:\/\//.test(url)) {
  console.log('[prepare-db] DATABASE_URL is not PostgreSQL — nothing to do.');
  process.exit(0);
}

/** Free Neon databases sleep when idle and take a few seconds to wake: allow 30s to connect. */
export const withWakeTimeout = (u) => (!u || /connect_timeout=/.test(u) ? u : `${u}${u.includes('?') ? '&' : '?'}connect_timeout=30`);

// Neon/Vercel provide a pooled URL for the app and a direct one for schema changes.
const directUrl = withWakeTimeout(process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || url);

let schema = fs.readFileSync(schemaPath, 'utf8');
schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
if (!schema.includes('directUrl')) {
  schema = schema.replace('url      = env("DATABASE_URL")', 'url       = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")');
}
fs.writeFileSync(schemaPath, schema);
console.log('[prepare-db] Using PostgreSQL.');

const env = { ...process.env, DATABASE_URL: withWakeTimeout(url), DIRECT_URL: directUrl };
const run = (cmd) => execSync(cmd, { cwd: root, env, stdio: 'inherit' });

/** Retry a command a few times (the database may still be waking up). */
function runWithRetry(cmd, attempts = 3) {
  for (let i = 1; i <= attempts; i++) {
    try {
      return run(cmd);
    } catch (err) {
      if (i === attempts) throw err;
      console.log(`[prepare-db] "${cmd}" failed (attempt ${i}/${attempts}) — database may be waking up, retrying in 10s…`);
      execSync(process.platform === 'win32' ? 'ping -n 11 127.0.0.1 >NUL' : 'sleep 10');
    }
  }
}

run('npx prisma generate');
runWithRetry('npx prisma db push --skip-generate');

if (process.env.SEED_DEMO === 'true') {
  console.log('[prepare-db] Loading demo data…');
  runWithRetry('node prisma/seed.js');
}

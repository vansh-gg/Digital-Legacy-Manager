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

// Neon/Vercel provide a pooled URL for the app and a direct one for schema changes.
const directUrl = process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || url;

let schema = fs.readFileSync(schemaPath, 'utf8');
schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
if (!schema.includes('directUrl')) {
  schema = schema.replace('url      = env("DATABASE_URL")', 'url       = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")');
}
fs.writeFileSync(schemaPath, schema);
console.log('[prepare-db] Using PostgreSQL.');

const env = { ...process.env, DIRECT_URL: directUrl };
const run = (cmd) => execSync(cmd, { cwd: root, env, stdio: 'inherit' });

run('npx prisma generate');
run('npx prisma db push --skip-generate');

if (process.env.SEED_DEMO === 'true') {
  console.log('[prepare-db] Loading demo data…');
  run('node prisma/seed.js');
}

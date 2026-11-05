/**
 * Demo data for presentations: one family per situation the system handles
 * (see src/services/demoData.js for the six scenarios).
 *
 *   npm run seed
 *
 * All demo accounts share one password, read from DEMO_PASSWORD (server/.env
 * locally, an environment variable on Vercel). It is never stored in the code.
 * If it is missing, a random password is generated and printed once.
 *
 * Also creates the demo administrator admin@example.com (same password) if it
 * does not exist yet. Re-running replaces only the demo accounts.
 */
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/db.js';
import { resetDemoData } from '../src/services/demoData.js';

const ADMIN_EMAIL = 'admin@example.com';

let PASSWORD = process.env.DEMO_PASSWORD;
let generated = false;
if (!PASSWORD || PASSWORD.length < 8) {
  PASSWORD = `Demo-${crypto.randomInt(1000, 9999)}-${crypto.randomBytes(3).toString('hex')}`;
  generated = true;
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  await resetDemoData({ passwordHash, takeover: true });
  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin) {
    await prisma.user.create({ data: { name: 'Demo Administrator', email: ADMIN_EMAIL, passwordHash, role: 'ADMIN' } });
  } else if (admin.role !== 'ADMIN') {
    await prisma.user.update({ where: { id: admin.id }, data: { role: 'ADMIN' } });
  }

  console.log('✔ Demo data ready: 6 scenarios, 13 demo accounts, plus admin@example.com.');
  if (generated) {
    console.log(`  No DEMO_PASSWORD set — generated one for this run: ${PASSWORD}`);
    console.log('  Set DEMO_PASSWORD in server/.env to keep the same password every time.');
  } else {
    console.log('  Password for all demo accounts: the value of DEMO_PASSWORD.');
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

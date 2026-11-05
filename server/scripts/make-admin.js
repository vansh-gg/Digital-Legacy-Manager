/**
 * Grant (or remove) the administrator role for an existing account.
 *
 *   npm run make-admin -w server -- you@example.com
 *   npm run make-admin -w server -- you@example.com --remove
 *
 * Uses DATABASE_URL from server/.env, or from the environment (set it to the
 * Neon connection string to grant an admin on the live Vercel deployment).
 */
import '../src/config.js';
import { prisma } from '../src/db.js';

const [email, flag] = process.argv.slice(2);
if (!email) {
  console.error('Usage: npm run make-admin -w server -- <email> [--remove]');
  process.exit(1);
}
const role = flag === '--remove' ? 'USER' : 'ADMIN';
try {
  const user = await prisma.user.update({ where: { email: email.trim().toLowerCase() }, data: { role } });
  console.log(`✔ ${user.email} is now ${role === 'ADMIN' ? 'an administrator' : 'a regular user'}. They may need to log in again.`);
} catch {
  console.error(`No account found for ${email}. Register it in the app first.`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

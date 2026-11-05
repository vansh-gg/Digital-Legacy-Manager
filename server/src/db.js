import { PrismaClient } from '@prisma/client';

const isPostgres = (u) => u.startsWith('postgres://') || u.startsWith('postgresql://');

// Free Neon databases sleep when idle; give the first connection 30s to wake them.
const url = process.env.DATABASE_URL || '';
if (isPostgres(url) && !url.includes('connect_timeout=')) {
  process.env.DATABASE_URL = `${url}${url.includes('?') ? '&' : '?'}connect_timeout=30`;
}

// On PostgreSQL hosts the schema also references DIRECT_URL (used only for
// schema changes); fall back to the main URL so the app always starts.
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
}

export const prisma = new PrismaClient();

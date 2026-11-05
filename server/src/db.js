import { PrismaClient } from '@prisma/client';

// On PostgreSQL hosts the schema also references DIRECT_URL (used only for
// schema changes); fall back to the main URL so the app always starts.
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
}

export const prisma = new PrismaClient();

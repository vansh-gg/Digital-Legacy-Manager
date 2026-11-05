-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'USER';
ALTER TABLE "User" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- Existing seeded demo accounts become resettable demo accounts.
UPDATE "User" SET "isDemo" = true WHERE "email" IN (
  'ramesh@example.com', 'priya@example.com', 'arjun@example.com',
  'sunita@example.com', 'karthik@example.com',
  'mohan@example.com', 'lakshmi@example.com', 'vikram@example.com',
  'meera@example.com', 'anjali@example.com',
  'gopal@example.com', 'deepa@example.com', 'ravi@example.com',
  'harish@example.com', 'kavya@example.com'
);

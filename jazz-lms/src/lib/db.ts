import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

function getValidatedDatabaseUrl() {
  const value = process.env.DATABASE_URL?.trim();

  if (!value) {
    throw new Error(
      'DATABASE_URL is missing. Set a PostgreSQL URL in your .env (example: postgresql://user:password@host:5432/database).'
    );
  }

  if (!value.startsWith('postgresql://') && !value.startsWith('postgres://')) {
    throw new Error(
      `Invalid DATABASE_URL protocol: "${value}". Prisma datasource is PostgreSQL, so DATABASE_URL must start with "postgresql://" or "postgres://".`
    );
  }

  return value;
}

getValidatedDatabaseUrl();

export const db = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = db;

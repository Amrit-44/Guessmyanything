import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

/**
 * Database client.
 *
 * Supports TWO backends via the DATABASE_URL env var:
 *
 *   1. Local SQLite (default for dev):
 *        DATABASE_URL=file:../db/custom.db
 *      → standard PrismaClient with the SQLite provider.
 *
 *   2. Turso libSQL (for Vercel / production):
 *        DATABASE_URL=libsql://<db>-<handle>.turso.io
 *        DATABASE_AUTH_TOKEN=<token>
 *      → PrismaClient with the PrismaLibSQL adapter, which works on
 *        Vercel's read-only filesystem (Turso is a network SQLite).
 *
 * The detection is automatic: if DATABASE_URL starts with `libsql:`,
 * the adapter is used; otherwise the standard client is used. This
 * means local dev and the sandbox are completely unaffected.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "";
  const isTurso = url.startsWith("libsql:") || url.startsWith("turso:");

  if (isTurso) {
    const libsql = createClient({
      url,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
    const adapter = new PrismaLibSql(libsql);
    return new PrismaClient({ adapter, log: ["error", "warn"] });
  }

  // Local SQLite — standard client.
  return new PrismaClient({ log: ["error", "warn"] });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

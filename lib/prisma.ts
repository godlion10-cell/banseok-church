// lib/prisma.ts
import { PrismaClient } from '@prisma/client';
// /web 버전: 네이티브 바이너리(.node) 없이 HTTP로만 Turso에 연결
import { PrismaLibSql } from '@prisma/adapter-libsql/web';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

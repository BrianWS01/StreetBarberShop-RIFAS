import { PrismaClient } from '@prisma/client';

// Singleton global — evita múltiplas conexões em hot-reload (dev) e serverless (prod)
declare global {
  var prismaGlobal: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;

  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ DATABASE_URL não definida operacionalmente no servidor.');
    }
    // Retorna cliente padrão que lerá do ambiente se disponível depois
    return new PrismaClient();
  }

  // Para TiDB Cloud, o motor nativo do Prisma é o mais recomendado e estável.
  // Ele lida automaticamente com SSL e conexões MySQL/TiDB.
  return new PrismaClient();
}

const prisma = globalThis.prismaGlobal ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export default prisma;

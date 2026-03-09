import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// Singleton global — evita múltiplas conexões em hot-reload (dev) e serverless (prod)
declare global {
  var prismaGlobal: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;

  // Durante o build sem DATABASE_URL, retorna cliente sem adapter
  // Isso é seguro pois as rotas são force-dynamic e nunca serão chamadas no build
  if (!url) {
    console.warn('⚠️ DATABASE_URL não definida. Cliente Prisma inativo.');
    // Retorna um proxy que vai explodir apenas se usar, nunca durante o import
    return new PrismaClient() as PrismaClient;
  }

  try {
    const adapter = new PrismaMariaDb(url);
    return new PrismaClient({ adapter } as any) as PrismaClient;
  } catch (error) {
    console.error('❌ Erro ao inicializar Prisma adapter:', error);
    // Fallback: tenta sem adapter (Prisma lerá do ambiente)
    return new PrismaClient() as PrismaClient;
  }
}

const prisma = globalThis.prismaGlobal ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export default prisma;

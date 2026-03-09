import { PrismaClient } from '@prisma/client';

// Singleton global para evitar múltiplas conexões em desenvolvimento
declare global {
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * Cria o cliente Prisma com o Driver Adapter MariaDB de forma estável.
 * O Prisma v7 (engineType: client) está sendo forçado pela Vercel.
 */
function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;

  // No build da Vercel, a DATABASE_URL pode não estar presente.
  // Usamos um mock adapter para satisfazer o construtor durante o build.
  if (!url) {
    console.warn('🚧 [PRISMA] DATABASE_URL não encontrada. Usando Mock Adapter para o build.');
    const mockAdapter = {
      name: 'mock',
      modelName: 'mysql',
      queryRaw: async () => ({ columns: [], rows: [] }),
      executeRaw: async () => 0,
      transaction: async (o: any, cb: any) => cb({}),
    };
    return new PrismaClient({ adapter: mockAdapter as any });
  }

  try {
    const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
    const mariadb = require('mariadb');

    const urlObj = new URL(url);
    const dbName = urlObj.pathname.replace('/', '') || 'test';

    const pool = mariadb.createPool({
      host: urlObj.hostname,
      port: parseInt(urlObj.port) || 4000,
      user: decodeURIComponent(urlObj.username),
      password: decodeURIComponent(urlObj.password),
      database: dbName,
      connectionLimit: 1, // Limite conservador para serverless
      connectTimeout: 30000,
      ssl: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      },
    });

    const adapter = new PrismaMariaDb(pool);
    return new PrismaClient({ adapter });
  } catch (error: any) {
    console.error('❌ [PRISMA] Erro ao inicializar adapter:', error.message);
    return new PrismaClient();
  }
}

/**
 * Proxy Lazy: Retarda a conexão real até o primeiro acesso de dados.
 */
const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    if (typeof prop === 'symbol' || prop === '$$typeof') return (target as any)[prop];

    if (!globalThis.prismaGlobal) {
      globalThis.prismaGlobal = createPrismaClient();
    }

    const instance = globalThis.prismaGlobal;
    const value = (instance as any)[prop];

    if (typeof value === 'function') {
      return value.bind(instance);
    }

    return value;
  }
});

export default prisma;

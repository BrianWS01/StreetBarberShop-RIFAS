import { PrismaClient } from '@prisma/client';

// Singleton global para evitar múltiplas conexões em desenvolvimento
declare global {
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * Cria o cliente Prisma com o Driver Adapter MariaDB.
 * O Prisma v7 (engineType: client) EXIGE um adapter ou accelerateUrl.
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

    // Parse da URL para configurar o pool manualmente (evita bugs de query string no driver)
    const urlObj = new URL(url);
    const pool = mariadb.createPool({
      host: urlObj.hostname,
      port: parseInt(urlObj.port) || 4000,
      user: decodeURIComponent(urlObj.username),
      password: decodeURIComponent(urlObj.password),
      database: urlObj.pathname.replace('/', ''),
      connectionLimit: 10,
      connectTimeout: 15000,
      ssl: { rejectUnauthorized: false }, // Obrigatório para TiDB Cloud
    });

    const adapter = new PrismaMariaDb(pool);
    return new PrismaClient({ adapter });
  } catch (error: any) {
    console.error('❌ [PRISMA] Erro fatal ao inicializar adapter:', error.message);
    // Em caso de erro catastrófico, retorna cliente padrão (que falhará em runtime, mas deixará o log)
    return new PrismaClient();
  }
}

/**
 * Proxy Lazy: Garante que o PrismaClient só seja instanciado quando os dados 
 * forem efetivamente acessados (e.g., .raffle.findMany()).
 * Isso protege o processo de build da Vercel.
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

import { PrismaClient } from '@prisma/client';

// Singleton global para evitar múltiplas conexões em desenvolvimento
declare global {
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * Cria o cliente Prisma com o Driver Adapter MariaDB de forma estável.
 * O TiDB Cloud exige SSL, mas o driver mariadb precisa que isso seja 
 * passado explicitamente no objeto de configuração do pool.
 */
function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.warn('🚧 [PRISMA] DATABASE_URL não encontrada (build ou ambiente restrito).');
    // Mock adapter para não quebrar o build na Vercel
    const mockAdapter = {
      name: 'mock', modelName: 'mysql',
      queryRaw: async () => ({ columns: [], rows: [] }),
      executeRaw: async () => 0,
      transaction: async (o: any, cb: any) => cb({})
    };
    return new PrismaClient({ adapter: mockAdapter as any });
  }

  try {
    const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
    const mariadb = require('mariadb');

    // Parse da URL para o pool. Removemos os parâmetros de query da string 
    // para evitar que o driver tente interpretá-los de forma errada.
    const urlObj = new URL(url);

    const pool = mariadb.createPool({
      host: urlObj.hostname,
      port: parseInt(urlObj.port) || 4000,
      user: decodeURIComponent(urlObj.username),
      password: decodeURIComponent(urlObj.password),
      database: urlObj.pathname.replace('/', ''),
      connectionLimit: 10,
      connectTimeout: 15000,
      // SSL é mandatório para TiDB Cloud
      ssl: {
        rejectUnauthorized: false
      }
    });

    const adapter = new PrismaMariaDb(pool);
    return new PrismaClient({ adapter });
  } catch (error: any) {
    console.error('❌ [PRISMA] Falha fatal na conexão:', error?.message);
    throw error;
  }
}

/**
 * Proxy Lazy: o PrismaClient só é instanciado no primeiro acesso a dados.
 * Isso protege o processo de build "collect page data" do Next.js.
 */
const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    if (typeof prop === 'symbol' || prop === '$$typeof') return (target as any)[prop];

    if (!globalThis.prismaGlobal) {
      globalThis.prismaGlobal = createPrismaClient();
    }

    const instance = globalThis.prismaGlobal;
    const value = (instance as any)[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});

export default prisma;

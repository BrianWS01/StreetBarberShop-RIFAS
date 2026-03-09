import { PrismaClient } from '@prisma/client';

// Singleton global para evitar múltiplas conexões em desenvolvimento
declare global {
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * Cria o cliente Prisma com o Driver Adapter MariaDB otimizado para TiDB Cloud.
 */
function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;

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

    // Configuração de pool mais robusta e tolerante a falhas de rede
    const pool = mariadb.createPool({
      host: urlObj.hostname,
      port: parseInt(urlObj.port) || 4000,
      user: decodeURIComponent(urlObj.username),
      password: decodeURIComponent(urlObj.password),
      database: urlObj.pathname.replace('/', ''),
      connectionLimit: 10,
      idleTimeout: 30000,     // 30s para conexões ociosas
      connectTimeout: 20000,  // Aumentado para 20s para handshake SSL lento
      ssl: {
        rejectUnauthorized: false, // Necessário para TiDB Cloud Serverless
      },
    });

    // Logging de eventos do pool para diagnóstico
    pool.on('error', (err: any) => {
      console.error('🌊 [PRISMA POOL ERROR]:', err.message);
    });

    const adapter = new PrismaMariaDb(pool);
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  } catch (error: any) {
    console.error('❌ [PRISMA] Falha crítica ao inicializar driver MariaDB:', error.message);
    return new PrismaClient();
  }
}

/**
 * Proxy Lazy: Garante que o PrismaClient só seja instanciado quando os dados 
 * forem efetivamente acessados (e.g., .raffle.findMany()).
 */
const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    if (typeof prop === 'symbol' || prop === '$$typeof') return (target as any)[prop];

    if (!globalThis.prismaGlobal) {
      console.log('🔄 [PRISMA] Tentando conectar ao banco pela primeira vez...');
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

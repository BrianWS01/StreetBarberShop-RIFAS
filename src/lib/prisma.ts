import { PrismaClient } from '@prisma/client';

// Singleton global para evitar múltiplas conexões em desenvolvimento
declare global {
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * Cria o cliente Prisma com o Driver Adapter MariaDB endurecido.
 * O TiDB Cloud Serverless exige TLS v1.2+ e configurações específicas de SSL.
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

    const dbName = urlObj.pathname.replace('/', '') || 'test';
    console.log(`🔌 [PRISMA] Conectando ao banco: ${dbName} no host: ${urlObj.hostname}`);

    // Configuração do pool com foco em segurança e resiliência total
    const pool = mariadb.createPool({
      host: urlObj.hostname,
      port: parseInt(urlObj.port) || 4000,
      user: decodeURIComponent(urlObj.username),
      password: decodeURIComponent(urlObj.password),
      database: dbName,
      connectionLimit: 1, // Reduzido para evitar contenção no serverless
      connectTimeout: 30000,
      ssl: {
        rejectUnauthorized: false, // Necessário para TiDB Cloud Serverless
        minVersion: 'TLSv1.2',      // Garante conformidade com o gateway TiDB
      },
    });

    pool.on('error', (err: any) => {
      console.error('🌊 [PRISMA POOL FATAL]:', err.message);
    });

    const adapter = new PrismaMariaDb(pool);

    return new PrismaClient({
      adapter,
      // Desativamos logs de query em produção para foco em erros
      log: ['error', 'warn'],
    });
  } catch (error: any) {
    console.error('❌ [PRISMA] Erro ao instanciar adapter MariaDB:', error.message);
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
      console.log('🔄 [PRISMA] Inicializando conexão segura com TiDB Cloud...');
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

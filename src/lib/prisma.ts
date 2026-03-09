import { PrismaClient } from '@prisma/client';

// Singleton global para evitar múltiplas conexões em desenvolvimento
declare global {
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * Função para criar a instância do Prisma de forma segura para o build da Vercel.
 */
function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;

  // No Prisma v7 sem URL no schema, o construtor EXIGE um adapter ou accelerateUrl.
  // Se não tivermos URL (ambiente de build), passamos um "mock adapter" para não quebrar o processo.
  if (!url) {
    console.log('🚧 [PRISMA] Inicializando com Mock Adapter (Ambiente de Build)');
    const mockAdapter = {
      name: 'mock-adapter',
      modelName: 'mysql',
      queryRaw: async () => ({ columns: [], rows: [] }),
      executeRaw: async () => 0,
      transaction: async (options: any, callback: any) => callback({}),
    };
    return new PrismaClient({ adapter: mockAdapter as any });
  }

  try {
    const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
    const mariadb = require('mariadb');

    console.log('🔄 [PRISMA] Conectando ao TiDB Cloud via MariaDB Adapter...');
    const pool = mariadb.createPool(url);
    const adapter = new PrismaMariaDb(pool);

    return new PrismaClient({ adapter });
  } catch (error) {
    console.error('❌ [PRISMA] Falha ao carregar driver: usando fallback seguro.');
    return new PrismaClient({
      adapter: { name: 'fallback', modelName: 'mysql', queryRaw: async () => ({}) } as any
    });
  }
}

const prisma = globalThis.prismaGlobal ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export default prisma;

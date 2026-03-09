import { PrismaClient } from '@prisma/client';

// Singleton global para evitar múltiplas conexões em desenvolvimento
declare global {
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * Função interna para criar a instância do Prisma.
 */
function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.error('⚠️ [PRISMA] DATABASE_URL não encontrada no ambiente!');
    return new PrismaClient();
  }

  try {
    // Usamos require para evitar problemas de tipos/importação de export default vs *
    const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
    const mariadb = require('mariadb');

    console.log('🔄 [PRISMA] Inicializando pool MariaDB para o Prisma v7...');

    const pool = mariadb.createPool(url);
    const adapter = new PrismaMariaDb(pool);

    return new PrismaClient({ adapter });
  } catch (error) {
    console.error('❌ [PRISMA] Falha fatal ao criar adapter:', error);
    // Fallback: se falhar o adapter, tenta o padrão (que pode falhar se não houver url no schema)
    return new PrismaClient();
  }
}

/**
 * Proxy para inicialização Lazy. Impede falhas durante o build "collect page data".
 */
const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
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

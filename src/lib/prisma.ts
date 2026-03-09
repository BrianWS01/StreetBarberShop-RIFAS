import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as mariadb from 'mariadb';

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
    // No build da Vercel, o DATABASE_URL pode estar ausente.
    // Retornamos uma instância padrão (que vai reclamar se for usada sem url no schema, 
    // mas o Proxy protege o build).
    return new PrismaClient();
  }

  try {
    // No Prisma v7 com MariaDB/TiDB, é obrigatório usar um Driver Adapter 
    // se a URL não estiver no schema.prisma.
    const pool = mariadb.createPool(url);
    const adapter = new PrismaMariaDb(pool);
    return new PrismaClient({ adapter });
  } catch (error) {
    console.error('❌ Erro ao instanciar Prisma com adapter:', error);
    return new PrismaClient();
  }
}

/**
 * Proxy para inicialização Lazy. Impede que o Prisma tente conectar durante o build.
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

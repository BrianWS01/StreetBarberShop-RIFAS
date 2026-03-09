import { PrismaClient } from '@prisma/client';

// Singleton global para evitar múltiplas conexões em desenvolvimento
declare global {
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * Função interna para criar a instância do Prisma.
 * Só deve ser chamada em tempo de execução, nunca no build.
 */
function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.warn('⚠️ [PRISMA] DATABASE_URL não encontrada. Usando Mock Adapter para compatibilidade.');
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

    const pool = mariadb.createPool(url);
    const adapter = new PrismaMariaDb(pool);

    return new PrismaClient({ adapter });
  } catch (error) {
    console.error('❌ [PRISMA] Erro ao carregar adapter:', error);
    return new PrismaClient({
      adapter: { name: 'fallback', modelName: 'mysql', queryRaw: async () => ({}) } as any
    });
  }
}

/**
 * TRUE LAZY EXPORT:
 * Exportamos um objeto que se comporta como o PrismaClient, mas só instancia
 * o cliente real quando qualquer propriedade (como .raffle ou .user) for acessada.
 */
const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    // Ignora propriedades internas do sistema ou Symbol.toStringTag
    if (typeof prop === 'symbol' || prop === '$$typeof') return (target as any)[prop];

    // Se a instância real ainda não existe, cria ela agora
    if (!globalThis.prismaGlobal) {
      globalThis.prismaGlobal = createPrismaClient();
    }

    const instance = globalThis.prismaGlobal;
    const value = (instance as any)[prop];

    // Se for uma função (findMany, etc), bindamos ao o objeto real
    if (typeof value === 'function') {
      return value.bind(instance);
    }

    return value;
  }
});

export default prisma;

import { PrismaClient } from '@prisma/client';

// Singleton global para evitar múltiplas conexões em desenvolvimento
declare global {
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * Cria o cliente Prisma de forma nativa e eficiente.
 * Usamos a inicialização padrão que lê a DATABASE_URL do ambiente.
 */
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

/**
 * Proxy Lazy: Garante que o PrismaClient só seja instanciado quando os dados 
 * forem efetivamente acessados (e.g., .raffle.findMany()).
 * Isso permite que o build da Vercel (`next build`) passe sem a DATABASE_URL.
 */
const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    // Ignora símbolos internos do Node.js
    if (typeof prop === 'symbol' || prop === '$$typeof') return (target as any)[prop];

    if (!globalThis.prismaGlobal) {
      console.log('🔄 [PRISMA] Inicializando Driver Nativo (First Access)...');
      globalThis.prismaGlobal = createPrismaClient();
    }

    const instance = globalThis.prismaGlobal;
    const value = (instance as any)[prop];

    // Bind de funções (findMany, update, etc) para manter o contexto da instância
    if (typeof value === 'function') {
      return value.bind(instance);
    }

    return value;
  }
});

export default prisma;

import { PrismaClient } from '@prisma/client';

// Singleton global para evitar múltiplas conexões em desenvolvimento
declare global {
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * Função interna para criar a instância do Prisma.
 * Só é chamada quando o banco for realmente acessado.
 */
function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;

  if (!url) {
    // No build da Vercel, o DATABASE_URL pode estar ausente ou o ambiente ser restrito.
    // Retornamos uma instância padrão que não deve tentar conectar até ser consultada.
    return new PrismaClient();
  }

  // Inicialização padrão do Prisma 7
  return new PrismaClient();
}

/**
 * Exportamos um Proxy que adia a criação do PrismaClient até a primeira propriedade ser acessada.
 * Isso resolve o erro "Failed to collect page data" durante o build, 
 * pois o código de inicialização do Prisma não roda no topo do módulo.
 */
const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    // Se a instância global ainda não existe, cria ela agora
    if (!globalThis.prismaGlobal) {
      globalThis.prismaGlobal = createPrismaClient();
    }

    const instance = globalThis.prismaGlobal;
    const value = (instance as any)[prop];

    // Se for uma função (como findMany, update, etc), bindamos ao o objeto real
    if (typeof value === 'function') {
      return value.bind(instance);
    }

    return value;
  }
});

export default prisma;

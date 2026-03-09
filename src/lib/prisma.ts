import { PrismaClient } from '@prisma/client';

// Singleton global — evita múltiplas conexões em hot-reload (dev) e serverless (prod)
declare global {
  var prismaGlobal: PrismaClient | undefined;
}

// Inicialização simples: o Prisma lê DATABASE_URL automaticamente do ambiente.
// NÃO passamos opções de construtor — isso garante compatibilidade com todas as versões.
const prisma = globalThis.prismaGlobal ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export default prisma;

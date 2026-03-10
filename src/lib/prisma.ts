import { PrismaClient } from '@prisma/client';

// Singleton robusto para o Prisma sem drivers externos manuais
// Isso utiliza o motor nativo do Prisma (Rust), que gerencia pool e SSL
// de forma muito mais eficiente na Vercel.
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error', 'warn'],
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;

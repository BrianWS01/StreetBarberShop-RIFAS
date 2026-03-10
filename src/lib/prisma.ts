import { PrismaClient } from '@prisma/client';

// Padrão Singleton para o PrismaClient recomendado pela Next.js
// O Prisma nativo lida melhor com SSL e Pooling no ambiente Vercel
const prismaClientSingleton = () => {
  console.log('🔌 [PRISMA] Inicializando cliente nativo...');
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

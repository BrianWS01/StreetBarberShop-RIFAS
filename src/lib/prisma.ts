import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// Singleton global — evita múltiplas conexões em hot-reload (dev) e serverless (prod)
declare global {
  var prismaGlobal: PrismaClient | undefined;
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL;

  // Se não houver URL (comum durante o build se não configurado no painel), 
  // retornamos o PrismaClient padrão para não travar a compilação do Next.js
  if (!url) {
    console.warn('⚠️ DATABASE_URL não definida. As queries de banco falharão em runtime.');
    return new PrismaClient();
  }

  // Passamos a URL diretamente — PrismaMariaDb aceita string
  // O adapter gerencia o pool internamente
  const adapter = new PrismaMariaDb(url);
  return new PrismaClient({ adapter });
}

const prisma = globalThis.prismaGlobal ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export default prisma;

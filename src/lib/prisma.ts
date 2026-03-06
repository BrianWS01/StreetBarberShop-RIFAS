import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// Singleton global — evita múltiplas conexões em hot-reload (dev) e serverless (prod)
declare global {
  var prismaGlobal: PrismaClient | undefined;
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL;

  // Se não houver URL (comum durante o build se não configurado no painel), 
  // retornamos o PrismaClient com o adapter e uma URL dummy para não travar a compilação
  if (!url) {
    console.warn('⚠️ DATABASE_URL não definida. Usando URL dummy para o build.');
    const dummyAdapter = new PrismaMariaDb('mysql://localhost:3306/unused');
    return new PrismaClient({ adapter: dummyAdapter });
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

import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// Singleton global — evita múltiplas conexões em hot-reload (dev) e serverless (prod)
declare global {
  var prismaGlobal: PrismaClient | undefined;
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ ERRO CRÍTICO: DATABASE_URL não definida em produção!');
    } else {
      console.warn('⚠️ DATABASE_URL não definida. Usando URL dummy para o build/dev.');
    }
    const dummyAdapter = new PrismaMariaDb('mysql://localhost:3306/unused');
    return new PrismaClient({ adapter: dummyAdapter });
  }

  try {
    // Para Aiven MySQL, o motor nativo do Prisma (Rust) é mais estável com SSL
    // do que o driver mariadb-connector-js através do adapter.
    if (url.includes('aivencloud.com') || url.includes('ssl-mode=')) {
      return new PrismaClient();
    }

    const adapter = new PrismaMariaDb(url);
    return new PrismaClient({ adapter });
  } catch (error) {
    console.error('❌ Erro ao inicializar Prisma:', error);
    // Fallback para o cliente padrão se o adapter falhar
    return new PrismaClient();
  }
}

const prisma = globalThis.prismaGlobal ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export default prisma;

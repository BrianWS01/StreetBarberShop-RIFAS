import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as mariadb from 'mariadb';

// Singleton para o PrismaClient
// Em hospedagem compartilhada (Hostinger), usamos Driver Adapters
// para evitar problemas com binários do Rust e garantir compatibilidade.
const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.warn('⚠️ [PRISMA] DATABASE_URL não encontrada no ambiente.');
    return new PrismaClient();
  }

  try {
    const urlObj = new URL(url);
    const dbName = urlObj.pathname.replace('/', '') || 'test';

    console.log(`🔌 [PRISMA] Conectando via Driver Adapter: ${urlObj.hostname}`);

    const pool = mariadb.createPool({
      host: urlObj.hostname,
      port: parseInt(urlObj.port) || 4000,
      user: decodeURIComponent(urlObj.username),
      password: decodeURIComponent(urlObj.password),
      database: dbName,
      connectionLimit: 5,
      connectTimeout: 30000,
      ssl: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      },
    });

    const adapter = new PrismaMariaDb(pool as any);
    return new PrismaClient({ adapter });
  } catch (error: any) {
    console.error('❌ [PRISMA] Erro ao inicializar adaptador:', error.message);
    return new PrismaClient();
  }
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;

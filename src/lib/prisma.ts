import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import mariadb from 'mariadb';

// Padrão Singleton para o PrismaClient recomendado pela Next.js
// Evita a criação de múltiplas instâncias em desenvolvimento (Hot Reload)
const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.warn('⚠️ [PRISMA] DATABASE_URL não encontrada. Usando cliente padrão (pode falhar).');
    return new PrismaClient();
  }

  try {
    const urlObj = new URL(url);
    const dbName = urlObj.pathname.replace('/', '') || 'test';

    console.log(`🔌 [PRISMA] Conectando ao TiDB/MariaDB: ${urlObj.hostname}`);

    const pool = mariadb.createPool({
      host: urlObj.hostname,
      port: parseInt(urlObj.port) || 4000,
      user: decodeURIComponent(urlObj.username),
      password: decodeURIComponent(urlObj.password),
      database: dbName,
      connectionLimit: 10, // Aumentado para lidar com mais requisições
      connectTimeout: 30000,
      ssl: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      },
    });

    const adapter = new PrismaMariaDb(pool);
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

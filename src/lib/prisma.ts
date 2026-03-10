import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as mariadb from 'mariadb';

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.warn('⚠️ [PRISMA] DATABASE_URL não encontrada.');
    return new PrismaClient();
  }

  try {
    const urlObj = new URL(url);
    const dbName = urlObj.pathname.replace('/', '') || 'test';
    const isLocal = urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1';

    console.log(`🔌 [PRISMA] Conectando ao Banco: ${urlObj.hostname} (Local: ${isLocal})`);

    const poolConfig: any = {
      host: urlObj.hostname,
      port: parseInt(urlObj.port) || 3306,
      user: decodeURIComponent(urlObj.username),
      password: decodeURIComponent(urlObj.password),
      database: dbName,
      connectionLimit: 10,
      connectTimeout: 60000, // Aumentado para 60s
    };

    // Só usa SSL para conexões externas (como TiDB Cloud)
    // Conexões locais da Hostinger geralmente não suportam/precisam de SSL
    if (!isLocal) {
      poolConfig.ssl = {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      };
    }

    const pool = mariadb.createPool(poolConfig);
    const adapter = new PrismaMariaDb(pool as any);
    
    return new PrismaClient({ 
      adapter,
      log: ['error', 'warn'] 
    });
  } catch (error: any) {
    console.error('❌ [PRISMA] Erro crítico:', error.message);
    return new PrismaClient();
  }
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;

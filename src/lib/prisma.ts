import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as mariadb from 'mariadb';

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL;
  if (!url) return new PrismaClient() as any;

  try {
    const urlObj = new URL(url);
    const dbName = urlObj.pathname.replace('/', '').split('?')[0] || 'test';
    
    console.log('--- 🚨 SOLUÇÃO DE ULTRA EMERGÊNCIA (TIMEOUT 60S) 🚨 ---');
    console.log(`📍 Host: ${urlObj.hostname}`);
    console.log(`📍 Pool Timeout: 60s`);

    const pool = mariadb.createPool({
      host: urlObj.hostname,
      port: parseInt(urlObj.port) || 3306,
      user: decodeURIComponent(urlObj.username),
      password: decodeURIComponent(urlObj.password),
      database: dbName,
      connectionLimit: 20, 
      connectTimeout: 60000, 
      acquireTimeout: 60000,
    });

    const adapter = new PrismaMariaDb(pool as any);
    
    // Forçamos o Prisma a não desistir em 10 segundos
    return new PrismaClient({ 
      adapter,
      log: ['error']
    });
  } catch (error: any) {
    return new PrismaClient() as any;
  }
};

declare global {
  var prismaFinalGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaFinalGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaFinalGlobal = prisma;

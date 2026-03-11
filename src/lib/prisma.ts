import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as mariadb from 'mariadb';

// Configuração de emergência para entrega em minutos
const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL;
  if (!url) return new PrismaClient() as any;

  try {
    const urlObj = new URL(url);
    const dbName = urlObj.pathname.replace('/', '') || 'test';
    
    console.log(`🚀 [EMERGÊNCIA] Conectando ao banco Hostinger via IP: ${urlObj.hostname}`);

    const pool = mariadb.createPool({
      host: urlObj.hostname,
      port: parseInt(urlObj.port) || 3306,
      user: decodeURIComponent(urlObj.username),
      password: decodeURIComponent(urlObj.password),
      database: dbName,
      connectionLimit: 20, // Aumentado para suportar mais requisições
      connectTimeout: 40000, // 40 segundos para o socket inicial
      acquireTimeout: 40000, // 40 segundos para pegar a conexão
      noDelay: true,
      compress: true, // Tenta comprimir dados para diminuir latência local->remoto
    });

    const adapter = new PrismaMariaDb(pool as any);
    
    return new PrismaClient({ 
      adapter,
      log: ['error'] 
    });
  } catch (error: any) {
    console.error('❌ Erro crítico:', error.message);
    return new PrismaClient() as any;
  }
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;

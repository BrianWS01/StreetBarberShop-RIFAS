import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as mariadb from 'mariadb';

// Helper para inicializar o Prisma de forma inteligente
// Usa Native Engine (Rust) localmente para velocidade e estabilidade
// Usa Driver Adapter (JS) na Hostinger para compatibilidade
const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.warn('⚠️ [PRISMA] DATABASE_URL não encontrada.');
    return new PrismaClient();
  }

  // Verifica se estamos em ambiente de desenvolvimento local
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Se for local ou se NÃO tivermos o Driver Adapter habilitado no schema, 
  // tentamos usar o nativo primeiro.
  if (isDevelopment) {
    console.log('🔌 [PRISMA] Usando Motor Nativo (Localhost)');
    return new PrismaClient();
  }

  try {
    const urlObj = new URL(url);
    const dbName = urlObj.pathname.replace('/', '') || 'test';
    const isLocalHost = urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1';

    console.log(`🔌 [PRISMA] Usando Driver Adapter (Hostinger/Produção): ${urlObj.hostname}`);

    const poolConfig: any = {
      host: urlObj.hostname,
      port: parseInt(urlObj.port) || 3306,
      user: decodeURIComponent(urlObj.username),
      password: decodeURIComponent(urlObj.password),
      database: dbName,
      connectionLimit: 10,
      connectTimeout: 20000,
    };

    // SSL apenas para conexões remotas (não localhost)
    if (!isLocalHost) {
      poolConfig.ssl = {
        rejectUnauthorized: false
      };
    }

    const pool = mariadb.createPool(poolConfig);
    const adapter = new PrismaMariaDb(pool as any);
    
    return new PrismaClient({ adapter });
  } catch (error: any) {
    console.error('❌ [PRISMA] Erro ao carregar adaptador, tentando modo nativo:', error.message);
    return new PrismaClient();
  }
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;

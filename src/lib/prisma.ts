import { PrismaClient } from '@prisma/client';

// Singleton global para evitar múltiplas conexões em desenvolvimento
declare global {
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * Cria o cliente Prisma com um teste de conexão manual para diagnóstico.
 */
async function createPrismaClient(): Promise<PrismaClient> {
  const url = process.env.DATABASE_URL;

  if (!url) {
    const mockAdapter = {
      name: 'mock',
      modelName: 'mysql',
      queryRaw: async () => ({ columns: [], rows: [] }),
      executeRaw: async () => 0,
      transaction: async (o: any, cb: any) => cb({}),
    };
    return new PrismaClient({ adapter: mockAdapter as any });
  }

  try {
    const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
    const mariadb = require('mariadb');

    const urlObj = new URL(url);
    const dbName = urlObj.pathname.replace('/', '') || 'test';

    console.log(`🔌 [PRISMA v1.4] Testando conexão direta com TiDB: ${urlObj.hostname}`);

    const pool = mariadb.createPool({
      host: urlObj.hostname,
      port: parseInt(urlObj.port) || 4000,
      user: decodeURIComponent(urlObj.username),
      password: decodeURIComponent(urlObj.password),
      database: dbName,
      connectionLimit: 1,
      connectTimeout: 30000,
      ssl: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      },
    });

    // TESTE MANUAL: Tenta conectar ANTES de dar o pool ao Prisma
    try {
      const conn = await pool.getConnection();
      console.log('✅ [PRISMA v1.4] Conexão manual SUCESSO!');
      await conn.release();
    } catch (connError: any) {
      console.error('❌ [PRISMA v1.4] Falha na conexão manual:', connError.message);
      // Mesmo com erro, tentamos prosseguir para que o Prisma logue sua versão do erro
    }

    const adapter = new PrismaMariaDb(pool);
    return new PrismaClient({ adapter });
  } catch (error: any) {
    console.error('❌ [PRISMA v1.4] Erro fatal no inicializador:', error.message);
    return new PrismaClient();
  }
}

/**
 * Proxy Lazy: Agora lida com a inicialização assíncrona do teste de conexão.
 */
let isInitializing = false;
const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    if (typeof prop === 'symbol' || prop === '$$typeof') return (target as any)[prop];

    if (!globalThis.prismaGlobal && !isInitializing) {
      isInitializing = true;
      console.log('🔄 [PRISMA v1.4] Iniciando singleton...');
      createPrismaClient().then(client => {
        globalThis.prismaGlobal = client;
        isInitializing = false;
      });
    }

    // Enquanto inicializa, se alguém tentar usar, retornamos um proxy de espera ou deixamos falhar
    // Para simplificar, retornamos a instância se existir.
    const instance = globalThis.prismaGlobal;
    if (!instance) {
      // Se ainda não inicializou, retornamos o target (objeto vazio) que causará erro
      // Isso é temporário até a primeira requisição completar.
      return (target as any)[prop];
    }

    const value = (instance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }

    return value;
  }
});

export default prisma;

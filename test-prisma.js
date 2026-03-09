// Teste rápido do prisma.ts compilado
require('dotenv').config();

// Simula o que o src/lib/prisma.ts faz
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const mariadb = require('mariadb');
const { PrismaClient } = require('@prisma/client');

const url = process.env.DATABASE_URL;

async function test() {
    console.log('Testando com URL:', url.replace(/:([^:@]+)@/, ':****@'));

    try {
        const urlObj = new URL(url);
        const pool = mariadb.createPool({
            host: urlObj.hostname,
            port: parseInt(urlObj.port) || 4000,
            user: decodeURIComponent(urlObj.username),
            password: decodeURIComponent(urlObj.password),
            database: urlObj.pathname.replace('/', ''),
            connectionLimit: 5,
            connectTimeout: 10000,
            ssl: { rejectUnauthorized: false }
        });

        const adapter = new PrismaMariaDb(pool);
        const prisma = new PrismaClient({ adapter });

        console.log('PrismaClient criado com sucesso!');

        const raffle = await prisma.raffle.findFirst();
        console.log('✅ Rifa encontrada:', raffle?.title ?? 'Nenhuma');

        const count = await prisma.ticket.count();
        console.log('✅ Tickets:', count);

        await prisma.$disconnect();
        console.log('\n🎉 TUDO FUNCIONANDO! Pronto para deploy.');
    } catch (e) {
        console.error('❌ ERRO:', e.message);
        console.error(e.stack);
    }
    process.exit(0);
}

test();

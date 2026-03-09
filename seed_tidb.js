const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const crypto = require('crypto');

async function seed() {
    console.log('Iniciando seed no TiDB Cloud (Motor Nativo)...');

    // Inicialização simples sem adapter — Prisma lê DATABASE_URL do .env
    const prisma = new PrismaClient();

    try {
        // 1. Limpar dados antigos
        console.log('Limpando dados antigos...');
        await prisma.ticket.deleteMany({});
        await prisma.transaction.deleteMany({});
        await prisma.user.deleteMany({});
        await prisma.raffle.deleteMany({});

        // 2. Criar a Rifa
        const raffle = await prisma.raffle.create({
            data: {
                id: 'seed-raffle-001',
                title: "Sorteio Especial - PS5 ou R$ 1.500 no Pix",
                prize: "PS5 ou R$ 1.500 no Pix",
                pricePerTicket: 15.0,
                totalTickets: 350,
                status: "ACTIVE",
                updatedAt: new Date(),
            },
        });
        console.log('Rifa criada:', raffle.id);

        // 3. Criar Tickets em blocos
        console.log('Criando 350 tickets...');
        const tickets = Array.from({ length: 350 }, (_, i) => ({
            id: crypto.randomUUID(),
            number: i + 1,
            status: "AVAILABLE",
            raffleId: raffle.id,
        }));

        // Inserir em blocos de 100 para estabilidade
        const chunkSize = 100;
        for (let i = 0; i < tickets.length; i += chunkSize) {
            const chunk = tickets.slice(i, i + chunkSize);
            await prisma.ticket.createMany({
                data: chunk
            });
            console.log(`Inseridos ${i + chunk.length} tickets...`);
        }

        console.log('Seed concluído com sucesso!');
    } catch (err) {
        console.error('Erro no seed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

seed();

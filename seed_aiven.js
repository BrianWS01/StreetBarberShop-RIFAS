const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

async function seed() {
    const url = process.env.DATABASE_URL;
    console.log('Iniciando seed no Aiven...');

    const adapter = new PrismaMariaDb(url);
    const prisma = new PrismaClient({ adapter });

    try {
        // 1. Criar a Rifa
        const raffle = await prisma.raffle.create({
            data: {
                id: 'seed-raffle-001',
                title: "Sorteio Especial - PS5 ou R$ 1.500 no Pix",
                prize: "PS5 ou R$ 1.500 no Pix",
                pricePerTicket: 15.0,
                totalTickets: 350,
                status: "ACTIVE",
            },
        });
        console.log('Rifa criada:', raffle.id);

        // 2. Criar Tickets em blocos (para não estourar a conexão)
        console.log('Criando 350 tickets...');
        const tickets = Array.from({ length: 350 }, (_, i) => ({
            number: i + 1,
            status: "AVAILABLE",
            raffleId: raffle.id,
        }));

        await prisma.ticket.createMany({
            data: tickets
        });

        console.log('Seed concluído com sucesso!');
    } catch (err) {
        console.error('Erro no seed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

seed();

import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
    console.log("Iniciando seed no TiDB Cloud...");

    // 1. Limpar dados
    await prisma.ticket.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.raffle.deleteMany({});

    // 2. Criar uma Rifa de Exemplo
    const raffle = await prisma.raffle.create({
        data: {
            id: "seed-raffle-001",
            title: "Sorteio Especial - PS5 ou R$ 1.500 no Pix",
            prize: "PS5 ou R$ 1.500 no Pix",
            pricePerTicket: 15.0,
            totalTickets: 350,
            status: "ACTIVE",
            updatedAt: new Date(),
        },
    });

    console.log(`Rifa criada: ${raffle.id}`);

    // 3. Criar 350 Bilhetes para esta Rifa em blocos
    console.log("Gerando 350 bilhetes...");
    const ticketsData = Array.from({ length: 350 }, (_, i) => ({
        id: crypto.randomUUID(),
        number: i + 1,
        status: "AVAILABLE" as const,
        raffleId: raffle.id,
    }));

    const chunkSize = 100;
    for (let i = 0; i < ticketsData.length; i += chunkSize) {
        const chunk = ticketsData.slice(i, i + chunkSize);
        await prisma.ticket.createMany({
            data: chunk,
        });
        console.log(`Inseridos ${i + chunk.length} tickets...`);
    }

    console.log("Seed finalizado com sucesso!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

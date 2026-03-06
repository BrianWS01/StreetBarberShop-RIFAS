import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Iniciando seed...");

    // 1. Criar uma Rifa de Exemplo
    const raffle = await prisma.raffle.create({
        data: {
            title: "Sorteio Especial - PS5 ou R$ 1.500 no Pix",
            prize: "PS5 ou R$ 1.500 no Pix",
            pricePerTicket: 15.0,
            totalTickets: 350,
            status: "ACTIVE",
        },
    });

    console.log(`Rifa criada: ${raffle.id}`);

    // 2. Criar 350 Bilhetes para esta Rifa
    console.log("Gerando 350 bilhetes...");
    const ticketsData = Array.from({ length: 350 }, (_, i) => ({
        number: i + 1,
        status: "AVAILABLE" as const,
        raffleId: raffle.id,
    }));

    await prisma.ticket.createMany({
        data: ticketsData,
    });

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

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createPixPayment } from '@/lib/pix';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// POST /api/checkout
// Body: { ticketNumbers: number[], buyerName: string, buyerPhone: string }
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { ticketNumbers, buyerName, buyerPhone } = body;

        // --- Validação básica ---
        if (!ticketNumbers || !Array.isArray(ticketNumbers) || ticketNumbers.length === 0) {
            return NextResponse.json({ error: 'Nenhum número selecionado.' }, { status: 400 });
        }
        if (!buyerName || typeof buyerName !== 'string' || buyerName.trim().length < 2) {
            return NextResponse.json({ error: 'Nome inválido.' }, { status: 400 });
        }
        if (!buyerPhone || typeof buyerPhone !== 'string' || buyerPhone.replace(/\D/g, '').length < 10) {
            return NextResponse.json({ error: 'WhatsApp inválido.' }, { status: 400 });
        }
        if (ticketNumbers.length > 20) {
            return NextResponse.json({ error: 'Máximo de 20 números por compra.' }, { status: 400 });
        }

        // Normaliza o telefone (só dígitos)
        const phoneClean = buyerPhone.replace(/\D/g, '');

        // --- Busca a rifa ativa ---
        const raffle = await prisma.raffle.findFirst({
            where: { status: 'ACTIVE' },
        });

        if (!raffle) {
            return NextResponse.json({ error: 'Nenhuma rifa ativa.' }, { status: 404 });
        }

        // --- Verifica disponibilidade dos tickets (tudo em transação atômica) ---
        const result = await prisma.$transaction(async (tx) => {
            // Busca os tickets solicitados
            const tickets = await tx.ticket.findMany({
                where: {
                    raffleId: raffle.id,
                    number: { in: ticketNumbers },
                },
            });

            if (tickets.length !== ticketNumbers.length) {
                throw new Error('Um ou mais números não existem nesta rifa.');
            }

            const unavailable = tickets.filter((t) => t.status !== 'AVAILABLE');
            if (unavailable.length > 0) {
                throw new Error(
                    `Números indisponíveis: ${unavailable.map((t) => t.number).join(', ')}. Por favor, selecione outros.`
                );
            }

            // --- Cria ou busca o usuário pelo telefone ---
            const user = await tx.user.upsert({
                where: { phone: phoneClean },
                update: {
                    name: buyerName.trim(),
                    updatedAt: new Date()
                },
                create: {
                    id: crypto.randomUUID(),
                    name: buyerName.trim(),
                    phone: phoneClean,
                    updatedAt: new Date()
                },
            });

            // --- Calcula o valor total ---
            const totalAmount = Number(raffle.pricePerTicket) * ticketNumbers.length;

            // --- Cria a Transaction no banco (ainda sem o ID do MP) ---
            const transaction = await tx.transaction.create({
                data: {
                    id: crypto.randomUUID(),
                    amount: totalAmount,
                    status: 'PENDING',
                    updatedAt: new Date()
                },
            });

            // --- Reserva os tickets ---
            await tx.ticket.updateMany({
                where: {
                    raffleId: raffle.id,
                    number: { in: ticketNumbers },
                },
                data: {
                    status: 'RESERVED',
                    userId: user.id,
                    transactionId: transaction.id,
                    reservedAt: new Date(),
                },
            });

            return { transaction, user, totalAmount };
        });

        // --- Gera o PIX no Mercado Pago (fora da transação do banco) ---
        const pixData = await createPixPayment({
            amount: result.totalAmount,
            description: `Rifa - ${ticketNumbers.length} número(s): ${ticketNumbers.join(', ')}`,
            externalId: result.transaction.id,
            payerEmail: `${phoneClean}@rifa.com`, // email fictício (MP exige)
        });

        // --- Salva o paymentId e QR Code na Transaction ---
        await prisma.transaction.update({
            where: { id: result.transaction.id },
            data: {
                externalId: pixData.paymentId,
                qrCode: pixData.qrCode,
                qrCodeBase64: pixData.qrCodeBase64,
            },
        });

        // --- Resposta de sucesso ---
        return NextResponse.json({
            success: true,
            transactionId: result.transaction.id,
            amount: result.totalAmount,
            ticketNumbers,
            qrCode: pixData.qrCode,
            qrCodeBase64: pixData.qrCodeBase64,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        });
    } catch (error: any) {
        console.error('[CHECKOUT ERROR]', error);

        // Erros de negócio (tickets indisponíveis, etc.)
        if (error.message?.includes('indisponíveis') || error.message?.includes('não existem')) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }

        return NextResponse.json(
            { error: 'Erro interno ao processar seu pedido. Tente novamente.' },
            { status: 500 }
        );
    }
}

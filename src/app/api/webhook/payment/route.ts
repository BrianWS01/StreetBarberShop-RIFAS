import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getPixPaymentStatus } from '@/lib/pix';

// POST /api/webhook/payment
// Recebe notificações de pagamento do Mercado Pago
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // O MP envia notificações com type "payment" e o id do pagamento
        const { type, data } = body;

        if (type !== 'payment' || !data?.id) {
            // Ignora outros tipos de notificação (chargebacks, etc.)
            return NextResponse.json({ received: true });
        }

        const mpPaymentId = String(data.id);

        // --- Consulta o status real no MP para evitar fraudes ---
        const mpStatus = await getPixPaymentStatus(mpPaymentId);

        if (mpStatus.status !== 'approved') {
            // Pagamento ainda pendente ou falhou — atualiza status se necessário
            if (mpStatus.status === 'cancelled' || mpStatus.status === 'rejected') {
                const transaction = await prisma.transaction.findFirst({
                    where: { externalId: mpPaymentId },
                });

                if (transaction && transaction.status === 'PENDING') {
                    await prisma.$transaction(async (tx) => {
                        await tx.transaction.update({
                            where: { id: transaction.id },
                            data: { status: 'FAILED' },
                        });
                        // Libera os tickets reservados
                        await tx.ticket.updateMany({
                            where: { transactionId: transaction.id },
                            data: {
                                status: 'AVAILABLE',
                                userId: null,
                                transactionId: null,
                                reservedAt: null,
                            },
                        });
                    });
                }
            }

            return NextResponse.json({ received: true });
        }

        // --- Pagamento APROVADO ---
        const transaction = await prisma.transaction.findFirst({
            where: { externalId: mpPaymentId },
        });

        if (!transaction) {
            console.error(`[WEBHOOK] Transação não encontrada para mpPaymentId: ${mpPaymentId}`);
            return NextResponse.json({ received: true });
        }

        // Evita processar o mesmo pagamento duas vezes (idempotência)
        if (transaction.status === 'PAID') {
            return NextResponse.json({ received: true, message: 'Já processado.' });
        }

        // --- Atualiza tudo em transação atômica ---
        await prisma.$transaction(async (tx) => {
            // Marca a transaction como PAID
            await tx.transaction.update({
                where: { id: transaction.id },
                data: { status: 'PAID' },
            });

            // Confirma todos os tickets dessa transação
            await tx.ticket.updateMany({
                where: { transactionId: transaction.id },
                data: {
                    status: 'PAID',
                    paidAt: new Date(),
                },
            });
        });

        console.log(`[WEBHOOK] Pagamento confirmado: transação ${transaction.id}`);
        return NextResponse.json({ received: true, success: true });
    } catch (error) {
        console.error('[WEBHOOK ERROR]', error);
        // Retorna 200 mesmo em erro para o MP não reenviar infinitamente
        return NextResponse.json({ received: true, error: 'Erro interno.' });
    }
}

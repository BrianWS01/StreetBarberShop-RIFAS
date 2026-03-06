import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/payment/[transactionId]
// Usado pelo front-end para polling: verifica se o PIX foi pago
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ transactionId: string }> }
) {
    try {
        const { transactionId } = await params;

        if (!transactionId) {
            return NextResponse.json({ error: 'ID da transação não informado.' }, { status: 400 });
        }

        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: {
                ticket: {
                    select: { number: true, status: true },
                    orderBy: { number: 'asc' },
                },
            },
        });

        if (!transaction) {
            return NextResponse.json({ error: 'Transação não encontrada.' }, { status: 404 });
        }

        return NextResponse.json({
            transactionId: transaction.id,
            status: transaction.status, // PENDING | PAID | FAILED | EXPIRED
            amount: Number(transaction.amount),
            tickets: transaction.ticket,
            createdAt: transaction.createdAt,
        });
    } catch (error) {
        console.error('[PAYMENT STATUS ERROR]', error);
        return NextResponse.json({ error: 'Erro ao consultar status.' }, { status: 500 });
    }
}

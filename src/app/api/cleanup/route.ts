import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const RESERVATION_TIMEOUT_MINUTES = 15;

// POST /api/cleanup
// Expira reservas antigas e libera os tickets
// Deve ser chamado por um cron job a cada ~5 minutos
export async function POST(request: NextRequest) {
    try {
        // Proteção por chave secreta para evitar chamadas não autorizadas
        const authHeader = request.headers.get('Authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
        }

        const cutoffTime = new Date(Date.now() - RESERVATION_TIMEOUT_MINUTES * 60 * 1000);

        // Busca todas as transações pendentes que passaram do tempo limite
        const expiredTransactions = await prisma.transaction.findMany({
            where: {
                status: 'PENDING',
                createdAt: { lt: cutoffTime },
            },
            select: { id: true },
        });

        if (expiredTransactions.length === 0) {
            return NextResponse.json({ expired: 0, message: 'Nenhuma reserva expirada.' });
        }

        const expiredIds = expiredTransactions.map((t) => t.id);

        // Atualização atômica: expira transações + libera tickets
        await prisma.$transaction([
            prisma.transaction.updateMany({
                where: { id: { in: expiredIds } },
                data: { status: 'EXPIRED' },
            }),
            prisma.ticket.updateMany({
                where: {
                    transactionId: { in: expiredIds },
                    status: 'RESERVED',
                },
                data: {
                    status: 'AVAILABLE',
                    userId: null,
                    transactionId: null,
                    reservedAt: null,
                },
            }),
        ]);

        console.log(`[CLEANUP] ${expiredIds.length} transação(ões) expirada(s).`);
        return NextResponse.json({
            expired: expiredIds.length,
            expiredIds,
        });
    } catch (error) {
        console.error('[CLEANUP ERROR]', error);
        return NextResponse.json({ error: 'Erro interno no cleanup.' }, { status: 500 });
    }
}

// GET /api/cleanup — para consulta manual (sem autenticação, só leitura)
export async function GET(request: NextRequest) {
    const cutoffTime = new Date(Date.now() - RESERVATION_TIMEOUT_MINUTES * 60 * 1000);

    const count = await prisma.transaction.count({
        where: {
            status: 'PENDING',
            createdAt: { lt: cutoffTime },
        },
    });

    return NextResponse.json({
        pendingExpired: count,
        cutoffTime,
    });
}

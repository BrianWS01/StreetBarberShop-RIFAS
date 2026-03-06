import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const ADMIN_SECRET = process.env.ADMIN_SECRET

function isAuthorized(request: NextRequest): boolean {
    const secret = request.headers.get('x-admin-secret')
    return secret === ADMIN_SECRET && !!ADMIN_SECRET
}

// GET /api/admin/stats — resumo geral da rifa
export async function GET(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    try {
        const raffle = await prisma.raffle.findFirst({
            where: { status: { in: ['ACTIVE', 'FINISHED'] } },
            orderBy: { createdAt: 'desc' },
        })

        if (!raffle) {
            return NextResponse.json({ error: 'Nenhuma rifa encontrada.' }, { status: 404 })
        }

        // Queries paralelas para performance
        const [ticketStats, revenue, pendingCount, transactions] = await Promise.all([
            // Contagem de tickets por status
            prisma.ticket.groupBy({
                by: ['status'],
                where: { raffleId: raffle.id },
                _count: true,
            }),
            // Receita total de transações pagas
            prisma.transaction.aggregate({
                where: { status: 'PAID' },
                _sum: { amount: true },
            }),
            // Transações pendentes
            prisma.transaction.count({ where: { status: 'PENDING' } }),
            // Últimas 50 transações (sem include aninhado para evitar erros)
            prisma.transaction.findMany({
                where: { status: { in: ['PAID', 'PENDING', 'EXPIRED'] } },
                orderBy: { createdAt: 'desc' },
                take: 50,
            }),
        ])

        // Busca os tickets de cada transação em paralelo
        const txWithDetails = await Promise.all(
            transactions.map(async (tx) => {
                const tickets = await prisma.ticket.findMany({
                    where: { transactionId: tx.id },
                    select: { number: true, userId: true },
                })

                // Busca o user do primeiro ticket (todos da mesma transação são do mesmo user)
                let buyer = null
                if (tickets[0]?.userId) {
                    const user = await prisma.user.findUnique({
                        where: { id: tickets[0].userId },
                        select: { name: true, phone: true },
                    })
                    buyer = user
                }

                return {
                    id: tx.id,
                    status: tx.status,
                    amount: Number(tx.amount),
                    createdAt: tx.createdAt,
                    buyer,
                    ticketNumbers: tickets.map((t) => t.number).sort((a, b) => a - b),
                }
            })
        )

        const stats = {
            raffleId: raffle.id,
            raffleTitle: raffle.title,
            raffleStatus: raffle.status,
            winnerNumber: raffle.winnerNumber,
            totalTickets: raffle.totalTickets,
            ticketsByStatus: Object.fromEntries(
                ticketStats.map((s) => [s.status, s._count])
            ),
            revenue: Number(revenue._sum.amount ?? 0),
            pendingTransactions: pendingCount,
            recentTransactions: txWithDetails,
        }

        return NextResponse.json(stats)
    } catch (error) {
        console.error('[ADMIN STATS ERROR]', error)
        return NextResponse.json({ error: 'Erro ao carregar stats.' }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const ADMIN_SECRET = process.env.ADMIN_SECRET

function isAuthorized(request: NextRequest): boolean {
    const secret = request.headers.get('x-admin-secret')
    return secret === ADMIN_SECRET && !!ADMIN_SECRET
}

// POST /api/admin/draw — realiza o sorteio (escolhe número vencedor aleatório entre os PAGOS)
export async function POST(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    try {
        const raffle = await prisma.raffle.findFirst({
            where: { status: 'ACTIVE' },
        })

        if (!raffle) {
            return NextResponse.json({ error: 'Nenhuma rifa ativa.' }, { status: 404 })
        }

        // Busca todos os tickets PAGOS para sortear entre eles
        const paidTickets = await prisma.ticket.findMany({
            where: { raffleId: raffle.id, status: 'PAID' },
            select: { number: true },
        })

        if (paidTickets.length === 0) {
            return NextResponse.json({ error: 'Nenhum ticket pago para sortear.' }, { status: 400 })
        }

        // Sorteia aleatoriamente
        const winner = paidTickets[Math.floor(Math.random() * paidTickets.length)]

        // Atualiza a rifa com o número vencedor e encerra
        await prisma.raffle.update({
            where: { id: raffle.id },
            data: {
                winnerNumber: winner.number,
                status: 'FINISHED',
            },
        })

        // Busca o dono do ticket vencedor
        const winnerTicket = await prisma.ticket.findFirst({
            where: { raffleId: raffle.id, number: winner.number },
            include: { user: { select: { name: true, phone: true } } },
        })

        console.log(`[SORTEIO] Vencedor: número ${winner.number} — ${winnerTicket?.user?.name}`)

        return NextResponse.json({
            success: true,
            winnerNumber: winner.number,
            winner: winnerTicket?.user ?? null,
            totalParticipants: paidTickets.length,
        })
    } catch (error) {
        console.error('[DRAW ERROR]', error)
        return NextResponse.json({ error: 'Erro ao realizar sorteio.' }, { status: 500 })
    }
}

// PATCH /api/admin/draw — altera status da rifa manualmente
export async function PATCH(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    try {
        const { status } = await request.json()

        if (!['ACTIVE', 'DRAFT', 'FINISHED'].includes(status)) {
            return NextResponse.json({ error: 'Status inválido.' }, { status: 400 })
        }

        const raffle = await prisma.raffle.findFirst({
            orderBy: { createdAt: 'desc' },
        })

        if (!raffle) {
            return NextResponse.json({ error: 'Nenhuma rifa encontrada.' }, { status: 404 })
        }

        await prisma.raffle.update({
            where: { id: raffle.id },
            data: { status },
        })

        return NextResponse.json({ success: true, newStatus: status })
    } catch (error) {
        console.error('[STATUS CHANGE ERROR]', error)
        return NextResponse.json({ error: 'Erro ao alterar status.' }, { status: 500 })
    }
}

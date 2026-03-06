import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/tickets — retorna status atual de todos os tickets da rifa ativa
// Usado pelo TicketGrid para refresh em tempo real
export async function GET(request: NextRequest) {
    try {
        const raffle = await prisma.raffle.findFirst({
            where: { status: 'ACTIVE' },
            select: { id: true },
        })

        if (!raffle) {
            return NextResponse.json({ tickets: [] })
        }

        const tickets = await prisma.ticket.findMany({
            where: { raffleId: raffle.id },
            select: { number: true, status: true },
            orderBy: { number: 'asc' },
        })

        return NextResponse.json({ tickets })
    } catch (error) {
        console.error('[TICKETS API ERROR]', error)
        return NextResponse.json({ error: 'Erro ao buscar tickets.' }, { status: 500 })
    }
}

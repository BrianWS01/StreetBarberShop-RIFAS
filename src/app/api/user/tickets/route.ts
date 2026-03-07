import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const phone = searchParams.get('phone');

        if (!phone) {
            return NextResponse.json({ error: 'Telefone não informado.' }, { status: 400 });
        }

        // Busca o usuário pelo telefone
        const user = await (prisma.user as any).findUnique({
            where: { phone },
            include: {
                tickets: {
                    include: {
                        raffle: {
                            select: { title: true }
                        }
                    },
                    orderBy: { number: 'asc' }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'Nenhum cadastro encontrado para este telefone.' }, { status: 404 });
        }

        // Formata os dados para o front-end
        const userTickets = user.tickets || [];
        const formattedTickets = userTickets.map((t: any) => ({
            number: t.number,
            status: t.status,
            raffleTitle: t.raffle?.title || 'Rifa',
            reservedAt: t.reservedAt,
            paidAt: t.paidAt
        }));

        return NextResponse.json({
            name: user.name,
            tickets: formattedTickets
        });
    } catch (error) {
        console.error('[USER TICKETS API ERROR]', error);
        return NextResponse.json({ error: 'Erro ao buscar seus números.' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const secret = searchParams.get('secret');

    // Proteção básica para não expor segredos publicamente
    if (secret !== 'diagnostico123') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const results: any = {
        version: "v1.2-native-library-check",
        env: {
            DATABASE_URL: process.env.DATABASE_URL ? 'PRESENTE (Oculto)' : 'FALTANDO',
            NODE_ENV: process.env.NODE_ENV,
        },
        prisma_check: 'Iniciando...',
    };

    try {
        // Tenta uma query extremamente simples
        const start = Date.now();
        const raffleCount = await prisma.raffle.count();
        results.prisma_check = 'SUCESSO';
        results.data = { raffleCount };
        results.latency = `${Date.now() - start}ms`;
    } catch (error: any) {
        results.prisma_check = 'FALHA';
        results.error = {
            name: error.name,
            message: error.message,
            code: error.code,
            clientVersion: error.clientVersion,
            stack: error.stack?.split('\n').slice(0, 5), // Primeiras 5 linhas da stack
        };
    }

    return NextResponse.json(results);
}

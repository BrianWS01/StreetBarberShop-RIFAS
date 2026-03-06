'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'
import CheckoutModal, { type CheckoutSuccessData } from './CheckoutModal'
import PixPayment from './PixPayment'
import PaymentSuccess from './PaymentSuccess'

type FlowStep = 'selecting' | 'checkout' | 'pix' | 'success' | 'expired'

interface Ticket {
    number: number
    status: string
}

interface Raffle {
    id: string
    pricePerTicket: number
}

interface TicketGridProps {
    raffle: Raffle
    tickets: Ticket[]
}

export default function TicketGrid({ raffle, tickets }: TicketGridProps) {
    const [selected, setSelected] = useState<number[]>([])
    const [step, setStep] = useState<FlowStep>('selecting')
    const [pixData, setPixData] = useState<CheckoutSuccessData | null>(null)

    // Estado local dos tickets para atualizar sem precisar de refresh de página
    const [localTickets, setLocalTickets] = useState<Ticket[]>(tickets)

    const price = Number(raffle.pricePerTicket)
    const totalPrice = selected.length * price

    // Polling: busca status atualizado dos tickets a cada 30s
    // (reflete compras de outros usuários sem precisar recarregar a página)
    useEffect(() => {
        const refreshTickets = async () => {
            // Apenas atualiza se não houver fluxo de compra ativo
            if (step !== 'selecting') return
            try {
                const res = await fetch('/api/tickets')
                if (!res.ok) return
                const { tickets: fresh } = await res.json()
                setLocalTickets((prev) =>
                    prev.map((t) => {
                        const updated = fresh.find((f: { number: number; status: string }) => f.number === t.number)
                        // Não sobrescreve tickets que o usuário selecionou (evita deselecionar durante navegação)
                        if (selected.includes(t.number)) return t
                        return updated ?? t
                    })
                )
            } catch {
                // Silencia erros de rede no polling
            }
        }
        const interval = setInterval(refreshTickets, 30000)
        return () => clearInterval(interval)
    }, [step, selected])

    const handleSelect = (num: number, status: string) => {
        if (status !== 'AVAILABLE') return
        setSelected((prev) =>
            prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
        )
    }

    const handleCheckoutSuccess = (data: CheckoutSuccessData) => {
        setPixData(data)
        // Marca localmente os tickets como reservados
        setLocalTickets((prev) =>
            prev.map((t) =>
                data.ticketNumbers.includes(t.number) ? { ...t, status: 'RESERVED' } : t
            )
        )
        setStep('pix')
    }

    const handlePaid = useCallback(() => {
        if (!pixData) return
        // Marca localmente os tickets como pagos
        setLocalTickets((prev) =>
            prev.map((t) =>
                pixData.ticketNumbers.includes(t.number) ? { ...t, status: 'PAID' } : t
            )
        )
        setSelected([])
        setStep('success')
    }, [pixData])

    const handleExpired = useCallback(() => {
        if (!pixData) return
        // Libera os tickets localmente (o cleanup do servidor fará o mesmo)
        setLocalTickets((prev) =>
            prev.map((t) =>
                pixData.ticketNumbers.includes(t.number) ? { ...t, status: 'AVAILABLE' } : t
            )
        )
        setSelected([])
        setStep('expired')
        setTimeout(() => setStep('selecting'), 3000)
    }, [pixData])

    const handleSuccessClose = () => {
        setPixData(null)
        setStep('selecting')
    }

    return (
        <div className="w-full">
            {/* Legenda */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-12 font-montserrat font-bold text-xs md:text-sm uppercase tracking-wider">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded border border-gray-700 bg-[#161616]" />
                    <span className="text-white">Livre</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded border border-brand bg-brand shadow-[0_0_10px_rgba(212,0,0,0.5)]" />
                    <span className="text-brand">Selecionado</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded border border-accent/50 bg-accent/20" />
                    <span className="text-accent">Reservado</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded border border-gray-800 bg-gray-900 opacity-50 relative overflow-hidden">
                        <div className="absolute inset-0 border-t-2 border-brand origin-top-left rotate-45 scale-150" />
                    </div>
                    <span className="text-gray-500">Pago</span>
                </div>
            </div>

            {/* Contador */}
            <div className="text-center mb-8">
                <span className="text-sm font-inter text-gray-400">
                    <strong className="text-white text-base">
                        {localTickets.filter((t) => t.status === 'AVAILABLE').length}
                    </strong>{' '}
                    de {localTickets.length} números disponíveis
                </span>
            </div>

            {/* Grade de tickets */}
            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 lg:grid-cols-14 gap-2 md:gap-3">
                {localTickets.map((ticket) => {
                    const isSelected = selected.includes(ticket.number)

                    let styleClass = 'bg-[#161616] border-gray-700 hover:border-gray-500 text-gray-300'
                    let cursorClass = 'cursor-pointer'

                    if (ticket.status === 'PAID') {
                        styleClass = 'bg-gray-900 border-gray-800 text-gray-700 opacity-50 relative overflow-hidden'
                        cursorClass = 'cursor-not-allowed'
                    } else if (ticket.status === 'RESERVED') {
                        styleClass = 'bg-accent/10 border-accent/40 text-accent'
                        cursorClass = 'cursor-not-allowed'
                    } else if (isSelected) {
                        styleClass = 'bg-brand border-brand text-white font-black shadow-[0_0_15px_rgba(212,0,0,0.6)]'
                    }

                    return (
                        <motion.button
                            whileHover={ticket.status === 'AVAILABLE' ? { scale: 1.05 } : {}}
                            whileTap={ticket.status === 'AVAILABLE' ? { scale: 0.95 } : {}}
                            key={ticket.number}
                            onClick={() => handleSelect(ticket.number, ticket.status)}
                            className={`aspect-square rounded-md border-2 flex items-center justify-center font-montserrat font-bold text-sm md:text-base transition-colors ${styleClass} ${cursorClass}`}
                        >
                            <span className="relative z-10">{ticket.number.toString().padStart(3, '0')}</span>
                            {ticket.status === 'PAID' && (
                                <div className="absolute inset-0 border-t-2 border-brand/40 origin-top-left flex rotate-45 scale-150 z-0 pointer-events-none w-[200%]" />
                            )}
                        </motion.button>
                    )
                })}
            </div>

            {/* Barra flutuante de checkout */}
            <AnimatePresence>
                {selected.length > 0 && step === 'selecting' && (
                    <motion.div
                        initial={{ y: 150, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 150, opacity: 0 }}
                        className="fixed bottom-0 left-0 w-full z-40 p-4 pb-6 md:pb-8 pointer-events-none"
                    >
                        <div className="max-w-4xl mx-auto bg-black border-2 border-accent shadow-[0_0_30px_rgba(212,175,55,0.2)] p-4 md:p-6 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 pointer-events-auto">
                            <div className="text-center sm:text-left">
                                <span className="bg-brand text-white font-montserrat font-black text-xs uppercase px-2 py-1 rounded inline-block mb-1">
                                    SELEÇÃO ATIVA
                                </span>
                                <p className="text-gray-300 font-inter text-sm md:text-base">
                                    <strong className="text-white text-lg">{selected.length}</strong> número(s) escolhido(s)
                                </p>
                                <p className="text-white font-montserrat font-black text-2xl md:text-3xl text-gradient-gold">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice)}
                                </p>
                            </div>
                            <button
                                onClick={() => setStep('checkout')}
                                className="w-full sm:w-auto bg-gradient-gold text-black px-8 py-4 rounded font-montserrat font-black uppercase text-lg flex items-center justify-center gap-3 hover:scale-105 transition-transform"
                            >
                                <ShoppingCart className="w-6 h-6" />
                                FECHAR COMPRA
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast de reserva expirada */}
            <AnimatePresence>
                {step === 'expired' && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-brand border border-brand/50 text-white font-montserrat font-bold text-sm px-6 py-3 rounded-full shadow-lg"
                    >
                        ⏱ Tempo esgotado! Seus números foram liberados.
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal de checkout */}
            <CheckoutModal
                isOpen={step === 'checkout'}
                onClose={() => setStep('selecting')}
                selectedNumbers={selected}
                totalPrice={totalPrice}
                onSuccess={handleCheckoutSuccess}
            />

            {/* Tela de PIX */}
            {step === 'pix' && pixData && (
                <PixPayment
                    data={pixData}
                    onPaid={handlePaid}
                    onExpired={handleExpired}
                />
            )}

            {/* Tela de sucesso */}
            {step === 'success' && pixData && (
                <PaymentSuccess
                    ticketNumbers={pixData.ticketNumbers}
                    buyerName={pixData.buyerName}
                    onClose={handleSuccessClose}
                />
            )}
        </div>
    )
}

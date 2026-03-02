'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'

const TOTAL_TICKETS = 350;
const TICKET_PRICE = 15;

type TicketStatus = 'AVAILABLE' | 'RESERVED' | 'PAID';

const mockTickets = Array.from({ length: TOTAL_TICKETS }).map((_, i) => {
    const isSold = Math.random() > 0.8;
    const isReserved = !isSold && Math.random() > 0.9;
    return {
        number: i + 1,
        status: isSold ? 'PAID' : isReserved ? 'RESERVED' : 'AVAILABLE' as TicketStatus,
    }
});

export default function TicketGrid() {
    const [selected, setSelected] = useState<number[]>([])

    const handleSelect = (num: number, status: TicketStatus) => {
        if (status !== 'AVAILABLE') return;

        if (selected.includes(num)) {
            setSelected(selected.filter(n => n !== num))
        } else {
            setSelected([...selected, num])
        }
    }

    const totalPrice = selected.length * TICKET_PRICE

    return (
        <div className="w-full">
            {/* Legenda de cores bem visível na estética do site */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-12 font-montserrat font-bold text-xs md:text-sm uppercase tracking-wider">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded border border-gray-700 bg-[#161616]"></div>
                    <span className="text-white">Livre</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded border border-brand bg-brand shadow-[0_0_10px_rgba(212,0,0,0.5)]"></div>
                    <span className="text-brand">Selecionado</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded border border-accent/50 bg-accent/20"></div>
                    <span className="text-accent">Reservado</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded border border-gray-800 bg-gray-900 block opacity-50 relative overflow-hidden">
                        <div className="absolute inset-0 border-t-2 border-brand origin-top-left rotate-45 scale-150"></div>
                    </div>
                    <span className="text-gray-500">Pago / Indisponível</span>
                </div>
            </div>

            {/* Grade de ingressos brutalista */}
            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 lg:grid-cols-14 gap-2 md:gap-3">
                {mockTickets.map((ticket) => {
                    const isSelected = selected.includes(ticket.number);

                    let styleClass = "bg-[#161616] border-gray-700 hover:border-gray-500 text-gray-300";
                    let cursorClass = "cursor-pointer";

                    if (ticket.status === 'PAID') {
                        styleClass = "bg-gray-900 border-gray-800 text-gray-700 opacity-50 relative overflow-hidden";
                        cursorClass = "cursor-not-allowed";
                    } else if (ticket.status === 'RESERVED') {
                        styleClass = "bg-accent/10 border-accent/40 text-accent";
                        cursorClass = "cursor-not-allowed";
                    } else if (isSelected) {
                        styleClass = "bg-brand border-brand text-white font-black shadow-[0_0_15px_rgba(212,0,0,0.6)]";
                    }

                    return (
                        <motion.button
                            whileHover={ticket.status === 'AVAILABLE' ? { scale: 1.05 } : {}}
                            whileTap={ticket.status === 'AVAILABLE' ? { scale: 0.95 } : {}}
                            key={ticket.number}
                            onClick={() => handleSelect(ticket.number, ticket.status)}
                            className={`
                aspect-square rounded-md border-2 flex items-center justify-center font-montserrat font-bold text-sm md:text-base md:text-lg transition-colors
                ${styleClass} ${cursorClass}
              `}
                        >
                            <span className="relative z-10">{ticket.number.toString().padStart(3, '0')}</span>
                            {ticket.status === 'PAID' && (
                                <div className="absolute inset-0 border-t-2 border-brand/40 origin-top-left flex rotate-45 scale-150 z-0 pointer-events-none w-[200%]"></div>
                            )}
                        </motion.button>
                    )
                })}
            </div>

            {/* Barra fixa de checkout agressiva */}
            <AnimatePresence>
                {selected.length > 0 && (
                    <motion.div
                        initial={{ y: 150, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 150, opacity: 0 }}
                        className="fixed bottom-0 left-0 w-full z-50 p-4 pb-6 md:pb-8 pointer-events-none"
                    >
                        <div className="max-w-4xl mx-auto bg-black border-2 border-accent shadow-[0_0_30px_rgba(212,175,55,0.2)] p-4 md:p-6 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 pointer-events-auto">
                            <div className="text-center sm:text-left">
                                <span className="bg-brand text-white font-montserrat font-black text-xs uppercase px-2 py-1 rounded inline-block mb-1">
                                    SELEÇÃO ATIVA
                                </span>
                                <p className="text-gray-300 font-inter text-sm md:text-base">
                                    <strong className="text-white text-lg">{selected.length}</strong> números escolhidos
                                </p>
                                <p className="text-white font-montserrat font-black text-2xl md:text-3xl text-gradient-gold">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice)}
                                </p>
                            </div>
                            <button className="w-full sm:w-auto bg-gradient-gold text-black px-8 py-4 rounded font-montserrat font-black uppercase text-lg flex items-center justify-center gap-3 hover:scale-105 transition-transform">
                                <ShoppingCart className="w-6 h-6" />
                                FECHAR COMPRA
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

'use client'

import { motion } from 'framer-motion'
import { Trophy, Star, Share2 } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'

interface PaymentSuccessProps {
    ticketNumbers: number[]
    buyerName: string
    onClose: () => void
}

export default function PaymentSuccess({ ticketNumbers, buyerName, onClose }: PaymentSuccessProps) {
    // Dispara confetti ao montar o componente
    useEffect(() => {
        const end = Date.now() + 2000
        const frame = () => {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#D40000', '#D4AF37', '#FFFFFF'],
            })
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#D40000', '#D4AF37', '#FFFFFF'],
            })
            if (Date.now() < end) requestAnimationFrame(frame)
        }
        frame()
    }, [])

    const shareText = `Acabei de garantir meus números na Rifa da Street Barbershop! 🎉🏆 Nums: ${ticketNumbers.sort((a, b) => a - b).map(n => n.toString().padStart(3, '0')).join(', ')}`

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="bg-[#111] border-2 border-accent rounded-2xl w-full max-w-md shadow-[0_0_80px_rgba(212,175,55,0.3)] text-center overflow-hidden"
            >
                {/* Glow top */}
                <div className="h-1 w-full bg-gradient-to-r from-brand via-accent to-brand" />

                <div className="p-8 space-y-6">
                    {/* Ícone animado */}
                    <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 250 }}
                        className="mx-auto w-24 h-24 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.4)]"
                    >
                        <Trophy className="w-12 h-12 text-accent" />
                    </motion.div>

                    {/* Título */}
                    <div>
                        <h2 className="font-montserrat font-black text-3xl text-white uppercase leading-tight">
                            Pagamento <span className="text-accent">Confirmado!</span>
                        </h2>
                        <p className="text-gray-400 font-inter mt-2">
                            Boa sorte, <strong className="text-white">{buyerName.split(' ')[0]}</strong>! 🤞
                        </p>
                    </div>

                    {/* Números */}
                    <div className="bg-[#0a0a0a] rounded-xl p-4">
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <Star className="w-4 h-4 text-accent fill-accent" />
                            <p className="text-xs font-montserrat font-bold uppercase tracking-wider text-gray-400">
                                Seus números da sorte
                            </p>
                            <Star className="w-4 h-4 text-accent fill-accent" />
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center max-h-32 overflow-y-auto">
                            {ticketNumbers.sort((a, b) => a - b).map((n) => (
                                <motion.span
                                    key={n}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.3 + ticketNumbers.indexOf(n) * 0.03 }}
                                    className="bg-accent/20 border border-accent text-accent font-montserrat font-black text-sm px-3 py-1.5 rounded-lg"
                                >
                                    {n.toString().padStart(3, '0')}
                                </motion.span>
                            ))}
                        </div>
                    </div>

                    {/* Info */}
                    <p className="text-sm text-gray-500 font-inter leading-relaxed">
                        O sorteio será realizado pela <strong className="text-gray-300">Loteria Federal</strong>.
                        Você receberá a confirmação pelo WhatsApp cadastrado.
                    </p>

                    {/* Botões */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => {
                                if (navigator.share) {
                                    navigator.share({ text: shareText })
                                } else {
                                    navigator.clipboard.writeText(shareText)
                                }
                            }}
                            className="w-full border border-accent/50 text-accent font-montserrat font-bold uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-accent/10 transition-colors text-sm"
                        >
                            <Share2 className="w-4 h-4" />
                            Compartilhar
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full bg-gradient-gold text-black font-montserrat font-black uppercase tracking-wider py-3 rounded-xl hover:scale-[1.02] transition-transform text-sm"
                        >
                            Voltar para a rifa
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Phone, ArrowRight, Loader2 } from 'lucide-react'

interface CheckoutModalProps {
    isOpen: boolean
    onClose: () => void
    selectedNumbers: number[]
    totalPrice: number
    onSuccess: (data: CheckoutSuccessData) => void
}

export interface CheckoutSuccessData {
    transactionId: string
    qrCode: string
    qrCodeBase64: string
    amount: number
    ticketNumbers: number[]
    expiresAt: string
    buyerName: string
}

export default function CheckoutModal({
    isOpen,
    onClose,
    selectedNumbers,
    totalPrice,
    onSuccess,
}: CheckoutModalProps) {
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Formata o telefone enquanto digita: (11) 99999-9999
    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 11)
        if (digits.length <= 2) return digits
        if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
        if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
        return value
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        const phoneDigits = phone.replace(/\D/g, '')
        if (name.trim().length < 2) {
            setError('Digite seu nome completo.')
            return
        }
        if (phoneDigits.length < 10) {
            setError('Digite um WhatsApp válido com DDD.')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticketNumbers: selectedNumbers,
                    buyerName: name.trim(),
                    buyerPhone: phoneDigits,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao processar pedido.')
            }

            onSuccess({ ...(data as CheckoutSuccessData), buyerName: name.trim() })
        } catch (err: any) {
            setError(err.message || 'Erro inesperado. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="bg-[#111] border-2 border-brand rounded-2xl w-full max-w-md shadow-[0_0_60px_rgba(212,0,0,0.3)] pointer-events-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/10">
                                <div>
                                    <h2 className="font-montserrat font-black text-xl text-white uppercase tracking-wider">
                                        Finalizar Compra
                                    </h2>
                                    <p className="text-gray-400 text-sm font-inter mt-0.5">
                                        {selectedNumbers.length} número(s) · {formatted.format(totalPrice)}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Números selecionados */}
                            <div className="px-6 pt-5 pb-3">
                                <p className="text-xs font-montserrat font-bold uppercase tracking-wider text-gray-500 mb-2">
                                    Seus números
                                </p>
                                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto py-1">
                                    {selectedNumbers.sort((a, b) => a - b).map((n) => (
                                        <span
                                            key={n}
                                            className="bg-brand/20 border border-brand/50 text-brand font-montserrat font-bold text-xs px-2 py-1 rounded"
                                        >
                                            {n.toString().padStart(3, '0')}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Formulário */}
                            <form onSubmit={handleSubmit} className="p-6 pt-3 space-y-4">
                                {/* Nome */}
                                <div>
                                    <label className="block text-xs font-montserrat font-bold uppercase tracking-wider text-gray-400 mb-2">
                                        Seu Nome
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Nome completo"
                                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white font-inter text-sm placeholder:text-gray-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* WhatsApp */}
                                <div>
                                    <label className="block text-xs font-montserrat font-bold uppercase tracking-wider text-gray-400 mb-2">
                                        WhatsApp (com DDD)
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(formatPhone(e.target.value))}
                                            placeholder="(11) 99999-9999"
                                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white font-inter text-sm placeholder:text-gray-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Erro */}
                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-brand text-sm font-inter bg-brand/10 border border-brand/30 rounded-lg px-4 py-2"
                                    >
                                        {error}
                                    </motion.p>
                                )}

                                {/* Total */}
                                <div className="bg-[#0a0a0a] rounded-xl p-4 flex items-center justify-between">
                                    <span className="text-gray-400 font-inter text-sm">Total a pagar</span>
                                    <span className="font-montserrat font-black text-2xl text-gradient-gold">
                                        {formatted.format(totalPrice)}
                                    </span>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-gold text-black font-montserrat font-black uppercase tracking-wider py-4 rounded-lg flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Gerando PIX...
                                        </>
                                    ) : (
                                        <>
                                            Gerar PIX
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>

                                <p className="text-center text-xs text-gray-600 font-inter">
                                    Ao continuar, você concorda com os termos da rifa. Pagamento 100% seguro via PIX.
                                </p>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

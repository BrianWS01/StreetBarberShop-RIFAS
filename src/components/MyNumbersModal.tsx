'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Phone, Search, Loader2, Ticket as TicketIcon, CheckCircle2, Clock } from 'lucide-react'

interface MyNumbersModalProps {
    isOpen: boolean
    onClose: () => void
}

interface UserTicket {
    number: number
    status: string
    raffleTitle: string
    reservedAt: string | null
    paidAt: string | null
}

export default function MyNumbersModal({ isOpen, onClose }: MyNumbersModalProps) {
    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [data, setData] = useState<{ name: string; tickets: UserTicket[] } | null>(null)

    // Formata o telefone enquanto digita: (11) 99999-9999
    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 11)
        if (digits.length <= 2) return digits
        if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
        if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
        return value
    }

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setData(null)

        const phoneDigits = phone.replace(/\D/g, '')
        if (phoneDigits.length < 10) {
            setError('Digite um WhatsApp válido com DDD.')
            return
        }

        setLoading(true)
        try {
            const res = await fetch(`/api/user/tickets?phone=${phoneDigits}`)
            const json = await res.json()

            if (!res.ok) {
                throw new Error(json.error || 'Erro ao buscar seus números.')
            }

            setData(json)
        } catch (err: any) {
            setError(err.message || 'Erro inesperado. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    const STATUS_LABELS: Record<string, string> = {
        PAID: 'Pago',
        RESERVED: 'Agaurdando Pix',
        CANCELLED: 'Cancelado',
    }

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
                        <div className="bg-[#111] border-2 border-brand rounded-2xl w-full max-w-lg shadow-[0_0_60px_rgba(212,0,0,0.3)] pointer-events-auto flex flex-col max-h-[90vh]">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                                <div>
                                    <h2 className="font-montserrat font-black text-xl text-white uppercase tracking-wider">
                                        Meus Números
                                    </h2>
                                    <p className="text-gray-400 text-sm font-inter mt-0.5">
                                        Consulte suas cotas compradas
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Conteúdo */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                {/* Formulário de Busca */}
                                {!data && (
                                    <form onSubmit={handleSearch} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-montserrat font-bold uppercase tracking-wider text-gray-400 mb-2">
                                                Informe seu WhatsApp (com DDD)
                                            </label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <input
                                                    type="tel"
                                                    value={phone}
                                                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                                                    placeholder="(11) 99999-9999"
                                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg pl-10 pr-4 py-4 text-white font-inter text-base placeholder:text-gray-600 focus:outline-none focus:border-brand transition-colors"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {error && (
                                            <p className="text-brand text-sm font-inter bg-brand/10 border border-brand/30 rounded-lg px-4 py-2">
                                                {error}
                                            </p>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-gradient-gold text-black font-montserrat font-black uppercase tracking-wider py-4 rounded-lg flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform disabled:opacity-60"
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                            {loading ? 'Buscando...' : 'Consultar Números'}
                                        </button>
                                    </form>
                                )}

                                {/* Lista de Resultados */}
                                {data && (
                                    <div className="space-y-6">
                                        <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-5 text-center">
                                            <p className="text-gray-500 text-xs font-montserrat font-bold uppercase tracking-widest mb-1">Bem-vindo(a),</p>
                                            <h3 className="text-white font-montserrat font-black text-2xl uppercase truncate">{data.name}</h3>
                                            <button
                                                onClick={() => setData(null)}
                                                className="text-accent text-xs font-inter mt-3 hover:underline"
                                            >
                                                Consultar outro número
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            <p className="text-xs font-montserrat font-bold uppercase tracking-wider text-gray-500">Seus Bilhetes</p>

                                            {data.tickets.length === 0 ? (
                                                <p className="text-gray-600 font-inter text-center py-8">Nenhum bilhete encontrado.</p>
                                            ) : (
                                                data.tickets.map((t, i) => (
                                                    <div key={i} className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-montserrat font-black text-lg ${t.status === 'PAID' ? 'bg-brand/20 text-brand border border-brand/30' : 'bg-accent/10 text-accent border border-accent/30'}`}>
                                                                {t.number.toString().padStart(3, '0')}
                                                            </div>
                                                            <div>
                                                                <p className="text-white font-montserrat font-bold text-sm uppercase leading-tight">{t.raffleTitle}</p>
                                                                <div className="flex items-center gap-1.5 mt-1">
                                                                    {t.status === 'PAID' ? (
                                                                        <>
                                                                            <CheckCircle2 className="w-3 h-3 text-green-400" />
                                                                            <span className="text-[10px] text-green-400 font-bold uppercase tracking-tighter">Pago em {new Date(t.paidAt!).toLocaleDateString('pt-BR')}</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Clock className="w-3 h-3 text-accent" />
                                                                            <span className="text-[10px] text-accent font-bold uppercase tracking-tighter">Aguardando Pagamento</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <TicketIcon className={`w-5 h-5 ${t.status === 'PAID' ? 'text-brand' : 'text-accent opacity-30'}`} />
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-white/10 text-center shrink-0">
                                <p className="text-[10px] text-gray-600 font-inter uppercase tracking-widest">
                                    Dúvidas? Entre em contato pelo WhatsApp da Barbearia
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    BarChart3, Users, DollarSign, Ticket, Trophy, RefreshCw,
    CheckCircle, Clock, XCircle, Play, Square, AlertTriangle
} from 'lucide-react'

interface Stats {
    raffleTitle: string
    raffleStatus: string
    rafflePrice: number
    totalTickets: number
    winnerNumber: number | null

    ticketsByStatus: { AVAILABLE?: number; RESERVED?: number; PAID?: number }
    revenue: number
    pendingTransactions: number
    recentTransactions: Transaction[]
}

interface Transaction {
    id: string
    status: string
    amount: number
    createdAt: string
    buyer: { name: string; phone: string } | null
    ticketNumbers: number[]
}

const STATUS_LABELS: Record<string, string> = {
    ACTIVE: 'Ativa',
    FINISHED: 'Encerrada',
    DRAFT: 'Rascunho',
    PAID: 'Pago',
    PENDING: 'Pendente',
    EXPIRED: 'Expirado',
    FAILED: 'Falhou',
}

const STATUS_COLORS: Record<string, string> = {
    PAID: 'text-green-400 bg-green-400/10 border-green-400/30',
    PENDING: 'text-accent bg-accent/10 border-accent/30',
    EXPIRED: 'text-gray-500 bg-gray-500/10 border-gray-500/30',
    FAILED: 'text-red-400 bg-red-400/10 border-red-400/30',
}

export default function AdminPage() {
    const [secret, setSecret] = useState('')
    const [authed, setAuthed] = useState(false)
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [drawing, setDrawing] = useState(false)
    const [drawResult, setDrawResult] = useState<{ winnerNumber: number; winner: { name: string; phone: string } | null } | null>(null)
    const [statusChanging, setStatusChanging] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [editForm, setEditForm] = useState({ title: '', price: 0 })

    const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })


    const fetchStats = useCallback(async (adminSecret: string) => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/admin/stats', {
                headers: { 'x-admin-secret': adminSecret },
            })
            if (res.status === 401) {
                setError('Senha incorreta.')
                setAuthed(false)
                return
            }
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setStats(data)
            setAuthed(true)
        } catch (e: any) {
            setError(e.message || 'Erro ao carregar dados.')
        } finally {
            setLoading(false)
        }
    }, [])

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        fetchStats(secret)
    }

    // Auto-refresh a cada 30s
    useEffect(() => {
        if (!authed || !secret) return
        const interval = setInterval(() => fetchStats(secret), 30000)
        return () => clearInterval(interval)
    }, [authed, secret, fetchStats])

    const handleDraw = async () => {
        if (!confirm('⚠️ Tem certeza? O sorteio é irreversível e encerra a rifa!')) return
        setDrawing(true)
        try {
            const res = await fetch('/api/admin/draw', {
                method: 'POST',
                headers: { 'x-admin-secret': secret },
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setDrawResult({ winnerNumber: data.winnerNumber, winner: data.winner })
            fetchStats(secret)
        } catch (e: any) {
            alert('Erro: ' + e.message)
        } finally {
            setDrawing(false)
        }
    }

    const handleStatusChange = async (status: string) => {
        if (!confirm(`Mudar status da rifa para "${STATUS_LABELS[status]}"?`)) return
        setStatusChanging(true)
        try {
            const res = await fetch('/api/admin/draw', {
                method: 'PATCH',
                headers: { 'x-admin-secret': secret, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            fetchStats(secret)
        } catch (e: any) {
            alert('Erro: ' + e.message)
        } finally {
            setStatusChanging(false)
        }
    }

    const handleUpdateRaffle = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch('/api/admin/draw', {
                method: 'PATCH',
                headers: { 'x-admin-secret': secret, 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: editForm.title, price: editForm.price }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setEditModalOpen(false)
            fetchStats(secret)
        } catch (e: any) {
            alert('Erro: ' + e.message)
        } finally {
            setLoading(false)
        }
    }


    // TELA DE LOGIN
    if (!authed) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#111] border-2 border-brand rounded-2xl p-8 w-full max-w-sm shadow-[0_0_40px_rgba(212,0,0,0.2)]"
                >
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-full bg-brand/20 border-2 border-brand flex items-center justify-center mx-auto mb-4">
                            <BarChart3 className="w-8 h-8 text-brand" />
                        </div>
                        <h1 className="font-montserrat font-black text-2xl text-white uppercase">Admin</h1>
                        <p className="text-gray-500 font-inter text-sm mt-1">Painel de Controle da Rifa</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            value={secret}
                            onChange={(e) => setSecret(e.target.value)}
                            placeholder="Senha de administrador"
                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white font-inter text-sm placeholder:text-gray-600 focus:outline-none focus:border-brand transition-colors"
                            required
                        />
                        {error && (
                            <p className="text-brand text-sm font-inter text-center">{error}</p>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-gold text-black font-montserrat font-black uppercase py-3 rounded-lg hover:scale-[1.02] transition-transform disabled:opacity-50"
                        >
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>
                </motion.div>
            </div>
        )
    }

    // PAINEL ADMIN
    return (
        <div className="min-h-screen bg-[#0A0A0A] p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-montserrat font-black text-3xl text-white uppercase">
                            Admin <span className="text-brand">Panel</span>
                        </h1>
                        {stats && (
                            <p className="text-gray-500 font-inter text-sm mt-1">{stats.raffleTitle}</p>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => fetchStats(secret)}
                            disabled={loading}
                            className="flex items-center gap-2 border border-white/10 text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm font-inter transition-colors hover:bg-white/5"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Atualizar
                        </button>
                        <button
                            onClick={() => { setAuthed(false); setStats(null) }}
                            className="border border-white/10 text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm font-inter transition-colors hover:bg-white/5"
                        >
                            Sair
                        </button>
                    </div>
                </div>

                {/* Status da Rifa + Ações */}
                {stats && (
                    <div className="bg-[#111] border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${stats.raffleStatus === 'ACTIVE' ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                            <div>
                                <span className="text-white font-montserrat font-bold">Status: </span>
                                <span className={`font-montserrat font-black ${stats.raffleStatus === 'ACTIVE' ? 'text-green-400' : stats.raffleStatus === 'FINISHED' ? 'text-accent' : 'text-gray-400'}`}>
                                    {STATUS_LABELS[stats.raffleStatus] ?? stats.raffleStatus}
                                </span>
                            </div>
                            {stats.winnerNumber && (
                                <span className="bg-accent/20 border border-accent text-accent font-montserrat font-bold text-sm px-3 py-1 rounded-full">
                                    🏆 Vencedor: #{stats.winnerNumber.toString().padStart(3, '0')}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => {
                                    setEditForm({ title: stats.raffleTitle, price: stats.rafflePrice })
                                    setEditModalOpen(true)
                                }}
                                className="flex items-center gap-2 bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg text-sm font-montserrat font-bold hover:bg-white/10 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" /> Editar Rifa
                            </button>
                            {stats.raffleStatus === 'DRAFT' && (
                                <button onClick={() => handleStatusChange('ACTIVE')} disabled={statusChanging}
                                    className="flex items-center gap-2 bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-2 rounded-lg text-sm font-montserrat font-bold hover:bg-green-500/30 transition-colors">
                                    <Play className="w-4 h-4" /> Ativar Rifa
                                </button>
                            )}
                            {stats.raffleStatus === 'ACTIVE' && (
                                <>
                                    <button onClick={() => handleStatusChange('DRAFT')} disabled={statusChanging}
                                        className="flex items-center gap-2 bg-gray-500/20 border border-gray-500/50 text-gray-400 px-4 py-2 rounded-lg text-sm font-montserrat font-bold hover:bg-gray-500/30 transition-colors">
                                        <Square className="w-4 h-4" /> Pausar
                                    </button>
                                    <button onClick={handleDraw} disabled={drawing}
                                        className="flex items-center gap-2 bg-accent/20 border border-accent/50 text-accent px-4 py-2 rounded-lg text-sm font-montserrat font-bold hover:bg-accent/30 transition-colors">
                                        <Trophy className={`w-4 h-4 ${drawing ? 'animate-spin' : ''}`} />
                                        {drawing ? 'Sorteando...' : 'Realizar Sorteio'}
                                    </button>
                                </>
                            )}
                        </div>

                    </div>
                )}

                {/* Resultado do Sorteio */}
                <AnimatePresence>
                    {drawResult && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-accent/10 border-2 border-accent rounded-xl p-6 text-center"
                        >
                            <Trophy className="w-12 h-12 text-accent mx-auto mb-3" />
                            <h2 className="font-montserrat font-black text-3xl text-white mb-1">
                                Número <span className="text-accent">#{drawResult.winnerNumber.toString().padStart(3, '0')}</span>
                            </h2>
                            {drawResult.winner && (
                                <p className="text-lg text-white font-inter">
                                    Vencedor: <strong>{drawResult.winner.name}</strong> — {drawResult.winner.phone}
                                </p>
                            )}
                            <button onClick={() => setDrawResult(null)} className="mt-4 text-gray-500 text-sm underline">Fechar</button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Modal de Edição */}
                <AnimatePresence>
                    {editModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setEditModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                className="relative bg-[#111] border-2 border-brand rounded-2xl p-8 w-full max-w-md shadow-2xl"
                            >
                                <h2 className="font-montserrat font-black text-xl text-white uppercase mb-6">Editar Rifa</h2>
                                <form onSubmit={handleUpdateRaffle} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Título da Rifa</label>
                                        <input
                                            type="text"
                                            value={editForm.title}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-brand outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Preço por Cota (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editForm.price}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-brand outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setEditModalOpen(false)}
                                            className="flex-1 border border-white/10 text-white font-bold py-3 rounded-lg hover:bg-white/5 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 bg-gradient-gold text-black font-black uppercase py-3 rounded-lg hover:scale-[1.02] transition-transform disabled:opacity-50"
                                        >
                                            {loading ? 'Salvando...' : 'Salvar'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Cards de Estatísticas */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            {
                                icon: <Ticket className="w-5 h-5" />,
                                label: 'Vendidos',
                                value: stats.ticketsByStatus.PAID ?? 0,
                                sub: `de ${stats.totalTickets}`,
                                color: 'text-green-400',
                            },
                            {
                                icon: <Clock className="w-5 h-5" />,
                                label: 'Reservados',
                                value: stats.ticketsByStatus.RESERVED ?? 0,
                                sub: 'aguardando PIX',
                                color: 'text-accent',
                            },
                            {
                                icon: <DollarSign className="w-5 h-5" />,
                                label: 'Receita',
                                value: fmt.format(stats.revenue),
                                sub: `${stats.pendingTransactions} pendente(s)`,
                                color: 'text-accent',
                            },
                            {
                                icon: <Users className="w-5 h-5" />,
                                label: 'Disponíveis',
                                value: stats.ticketsByStatus.AVAILABLE ?? 0,
                                sub: 'números livres',
                                color: 'text-gray-400',
                            },
                        ].map((card) => (
                            <div key={card.label} className="bg-[#111] border border-white/10 rounded-xl p-5">
                                <div className={`flex items-center gap-2 mb-3 ${card.color}`}>
                                    {card.icon}
                                    <span className="font-montserrat font-bold text-xs uppercase tracking-wider">{card.label}</span>
                                </div>
                                <p className={`font-montserrat font-black text-2xl md:text-3xl ${card.color}`}>{card.value}</p>
                                <p className="text-gray-600 font-inter text-xs mt-1">{card.sub}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tabela de Transações */}
                {stats && stats.recentTransactions.length > 0 && (
                    <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
                        <div className="p-5 border-b border-white/10">
                            <h2 className="font-montserrat font-black text-white uppercase tracking-wider">
                                Compradores Recentes
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        {['Comprador', 'WhatsApp', 'Números', 'Valor', 'Status', 'Data'].map((h) => (
                                            <th key={h} className="text-left px-5 py-3 text-xs font-montserrat font-bold uppercase tracking-wider text-gray-500">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recentTransactions.map((tx) => (
                                        <tr key={tx.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                                            <td className="px-5 py-4 text-white font-inter text-sm font-medium">
                                                {tx.buyer?.name ?? <span className="text-gray-600">—</span>}
                                            </td>
                                            <td className="px-5 py-4 text-gray-400 font-inter text-sm font-mono">
                                                {tx.buyer?.phone ?? '—'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                    {tx.ticketNumbers.slice(0, 5).map((n) => (
                                                        <span key={n} className="bg-brand/20 text-brand font-montserrat font-bold text-xs px-1.5 py-0.5 rounded">
                                                            {n.toString().padStart(3, '0')}
                                                        </span>
                                                    ))}
                                                    {tx.ticketNumbers.length > 5 && (
                                                        <span className="text-gray-500 text-xs">+{tx.ticketNumbers.length - 5}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-white font-inter text-sm font-bold">
                                                {fmt.format(tx.amount)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 rounded-full text-xs font-montserrat font-bold ${STATUS_COLORS[tx.status] ?? 'text-gray-400 bg-gray-400/10 border-gray-400/30'}`}>
                                                    {tx.status === 'PAID' && <CheckCircle className="w-3 h-3" />}
                                                    {tx.status === 'PENDING' && <Clock className="w-3 h-3" />}
                                                    {(tx.status === 'EXPIRED' || tx.status === 'FAILED') && <XCircle className="w-3 h-3" />}
                                                    {STATUS_LABELS[tx.status] ?? tx.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-gray-500 font-inter text-xs">
                                                {new Date(tx.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {stats && stats.recentTransactions.length === 0 && (
                    <div className="bg-[#111] border border-white/10 rounded-xl p-12 text-center">
                        <AlertTriangle className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 font-inter">Nenhuma transação ainda.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

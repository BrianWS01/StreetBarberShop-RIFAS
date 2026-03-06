'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Copy, CheckCircle, Clock, RefreshCw } from 'lucide-react'
import type { CheckoutSuccessData } from './CheckoutModal'

interface PixPaymentProps {
    data: CheckoutSuccessData
    onPaid: () => void
    onExpired: () => void
}

export default function PixPayment({ data, onPaid, onExpired }: PixPaymentProps) {
    const [copied, setCopied] = useState(false)
    const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutos em segundos
    const [status, setStatus] = useState<'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED'>('PENDING')

    // Calcula o tempo restante real com base no expiresAt
    useEffect(() => {
        const expires = new Date(data.expiresAt).getTime()
        const update = () => {
            const remaining = Math.max(0, Math.floor((expires - Date.now()) / 1000))
            setTimeLeft(remaining)
            if (remaining === 0) onExpired()
        }
        update()
        const interval = setInterval(update, 1000)
        return () => clearInterval(interval)
    }, [data.expiresAt, onExpired])

    // Polling: verifica se o pagamento foi aprovado a cada 5 segundos
    const checkStatus = useCallback(async () => {
        try {
            const res = await fetch(`/api/payment/${data.transactionId}`)
            const json = await res.json()
            if (json.status === 'PAID') {
                setStatus('PAID')
                onPaid()
            } else if (json.status === 'EXPIRED' || json.status === 'FAILED') {
                setStatus(json.status)
                onExpired()
            }
        } catch {
            // Silencia erros de rede no polling
        }
    }, [data.transactionId, onPaid, onExpired])

    useEffect(() => {
        const interval = setInterval(checkStatus, 5000)
        return () => clearInterval(interval)
    }, [checkStatus])

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(data.qrCode)
            setCopied(true)
            setTimeout(() => setCopied(false), 3000)
        } catch {
            // fallback para browsers sem clipboard API
        }
    }

    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#111] border-2 border-accent rounded-2xl w-full max-w-md shadow-[0_0_60px_rgba(212,175,55,0.2)]"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 text-center">
                    <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/50 rounded-full px-4 py-1.5 mb-3">
                        <RefreshCw className="w-3.5 h-3.5 text-accent animate-spin" />
                        <span className="text-accent font-montserrat font-bold text-xs uppercase tracking-wider">
                            Aguardando Pagamento
                        </span>
                    </div>
                    <h2 className="font-montserrat font-black text-2xl text-white uppercase">
                        Pague com PIX
                    </h2>
                    <p className="text-gray-400 font-inter text-sm mt-1">
                        Escaneie o QR Code ou copie o código
                    </p>
                </div>

                <div className="p-6 space-y-5">
                    {/* Timer */}
                    <div className="flex items-center justify-center gap-2 text-center">
                        <Clock className={`w-4 h-4 ${timeLeft < 120 ? 'text-brand' : 'text-gray-400'}`} />
                        <span className={`font-montserrat font-black text-lg tabular-nums ${timeLeft < 120 ? 'text-brand' : 'text-gray-300'}`}>
                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </span>
                        <span className="text-gray-500 font-inter text-sm">para expirar</span>
                    </div>

                    {/* QR Code */}
                    <div className="flex justify-center">
                        <div className="bg-white p-3 rounded-xl inline-block shadow-[0_0_30px_rgba(212,175,55,0.15)]">
                            {data.qrCodeBase64 ? (
                                <img
                                    src={`data:image/png;base64,${data.qrCodeBase64}`}
                                    alt="QR Code PIX"
                                    className="w-48 h-48 block"
                                />
                            ) : (
                                <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-lg">
                                    <p className="text-gray-500 text-xs text-center px-4">QR Code indisponível. Use o código abaixo.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Código copia e cola */}
                    <div>
                        <p className="text-xs font-montserrat font-bold uppercase tracking-wider text-gray-500 mb-2 text-center">
                            Código PIX (Copia e Cola)
                        </p>
                        <div className="relative">
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-3 pr-12 text-xs text-gray-400 font-mono break-all leading-relaxed max-h-20 overflow-y-auto">
                                {data.qrCode}
                            </div>
                            <button
                                onClick={copyToClipboard}
                                className="absolute top-3 right-3 text-gray-400 hover:text-accent transition-colors"
                                title="Copiar código"
                            >
                                {copied ? (
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                ) : (
                                    <Copy className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        {copied && (
                            <motion.p
                                initial={{ opacity: 0, y: 3 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-green-400 text-xs text-center mt-2 font-inter"
                            >
                                ✓ Código copiado!
                            </motion.p>
                        )}
                    </div>

                    {/* Valor e números */}
                    <div className="bg-[#0a0a0a] rounded-xl p-4 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 font-inter text-sm">Valor</span>
                            <span className="font-montserrat font-black text-xl text-gradient-gold">
                                {formatted.format(data.amount)}
                            </span>
                        </div>
                        <div className="flex justify-between items-start">
                            <span className="text-gray-400 font-inter text-sm">Números</span>
                            <span className="text-white font-inter text-sm text-right max-w-[60%]">
                                {data.ticketNumbers.sort((a, b) => a - b).map(n => n.toString().padStart(3, '0')).join(', ')}
                            </span>
                        </div>
                    </div>

                    <p className="text-center text-xs text-gray-600 font-inter leading-relaxed">
                        Após o pagamento, sua participação é confirmada automaticamente. Esta tela atualiza sozinha.
                    </p>
                </div>
            </motion.div>
        </div>
    )
}

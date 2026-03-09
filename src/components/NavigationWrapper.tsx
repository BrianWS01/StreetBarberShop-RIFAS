'use client'

import { useState } from 'react'
import MyNumbersModal from '@/components/MyNumbersModal'

interface NavigationWrapperProps {
    children: React.ReactNode
}

export default function NavigationWrapper({ children }: NavigationWrapperProps) {
    const [isMyNumbersOpen, setIsMyNumbersOpen] = useState(false)

    return (
        <>
            <header className="fixed top-0 w-full z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b-2 border-brand">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="font-montserrat font-black text-xl tracking-widest text-white uppercase flex items-center gap-1">
                        STREET <span className="text-brand">BARBERSHOP</span>
                    </div>
                    <nav className="flex items-center gap-6 font-montserrat font-bold text-sm">
                        <a href="#about" className="hover:text-accent transition-colors hidden md:block">Sobre</a>
                        <a href="#tickets" className="hover:text-accent transition-colors hidden md:block">Números</a>
                        <button
                            onClick={() => setIsMyNumbersOpen(true)}
                            className="bg-brand/10 border border-brand/50 px-4 py-2 rounded uppercase text-brand font-black hover:bg-brand/20 transition-all font-montserrat"
                        >
                            Meus Números
                        </button>
                    </nav>
                </div>
            </header>

            <MyNumbersModal
                isOpen={isMyNumbersOpen}
                onClose={() => setIsMyNumbersOpen(false)}
            />

            <main className="flex-1 w-full">
                {children}
            </main>
        </>
    )
}

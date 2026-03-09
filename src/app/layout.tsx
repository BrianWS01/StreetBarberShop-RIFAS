import type { Metadata } from 'next'
import { Inter, Montserrat } from 'next/font/google'
import './globals.css'
import NavigationWrapper from '@/components/NavigationWrapper'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' })

export const metadata: Metadata = {
  title: 'Street Barbershop - Rifa Especial',
  description: 'Concorra a um PS5 ou R$ 1.500 no Pix! Sorteio especial da Street Barbershop.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark scroll-smooth">
      <body className={`${inter.variable} ${montserrat.variable} font-sans min-h-screen flex flex-col`}>
        <NavigationWrapper>
          {children}
        </NavigationWrapper>

        <footer className="border-t-2 border-brand/50 py-12 mt-12 bg-[#0a0a0a] text-center">
          <div className="font-montserrat font-black text-2xl tracking-widest text-white uppercase mb-4 flex items-center justify-center gap-1">
            STREET <span className="text-brand">BARBERSHOP</span>
          </div>
          <p className="text-sm text-gray-400 font-medium font-inter">© {new Date().getFullYear()} Rifa Segura. Todos os direitos reservados.</p>
        </footer>
      </body>
    </html>
  )
}

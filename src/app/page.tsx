import TicketGrid from '@/components/TicketGrid'
import { Trophy, CheckCircle, Smartphone } from 'lucide-react'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic';

export default async function Home() {
  try {
    const raffle = await prisma.raffle.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        tickets: {
          orderBy: { number: 'asc' }
        }
      }
    })

    if (!raffle) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
          <p className="text-xl font-montserrat">Nenhuma rifa ativa no momento.</p>
        </div>
      )
    }

    return (
      <div className="bg-[#0A0A0A]">
        {/* HERO SECTION - Ajustada nativamente (Sem Scale forçado) */}
        <section className="relative min-h-[85vh] lg:min-h-[75vh] flex flex-col items-center justify-center overflow-hidden pt-24 pb-12 lg:pt-28 lg:pb-16">
          {/* Sem Background Overlay - Fundo Limpo */}

          <div className="container relative z-20 mx-auto px-4 mt-4 md:mt-6">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-center max-w-7xl mx-auto">

              {/* LADO ESQUERDO: Textos e CTA */}
              <div className="order-1 text-center lg:text-left flex flex-col items-center lg:items-start">
                <span className="inline-table py-1.5 px-5 border border-brand text-brand font-bold uppercase tracking-widest text-xs lg:text-sm rounded-full mb-6 bg-brand/10 backdrop-blur-sm shadow-[0_0_15px_rgba(212,0,0,0.3)] animate-pulse whitespace-nowrap">
                  Sorteio Especial da Barbearia
                </span>

                <h1 className="font-montserrat font-black text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white uppercase leading-[1.05] mb-5 tracking-tight drop-shadow-lg">
                  Ganhe um <span className="text-gradient-gold">PS5</span> <br className="hidden md:block" />
                  ou <span className="text-brand">R$ 1.500</span> <br className="hidden lg:block" /> no Pix
                </h1>

                <p className="text-lg md:text-xl lg:text-lg text-gray-300 font-inter max-w-xl mb-8 leading-relaxed">
                  Apenas 350 números disponíveis. Escolha o seu e concorra agora mesmo com total transparência e segurança.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-5 mb-10 w-full sm:w-auto">
                  <a href="#tickets" className="bg-gradient-gold text-black font-montserrat font-black uppercase tracking-wider px-8 py-4 lg:px-10 lg:py-4 rounded hover:-translate-y-1 transition-transform duration-300 w-full sm:w-auto text-base lg:text-lg hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] text-center">
                    GARANTIR MEU NÚMERO
                  </a>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 lg:gap-6 text-xs lg:text-[11px] xl:text-xs font-bold text-gray-400 font-montserrat uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    Entrega Garantida
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-brand" />
                    Loteria Federal
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-accent" />
                    Pix na hora
                  </div>
                </div>
              </div>

              {/* LADO DIREITO: Imagens dos Prêmios */}
              <div className="order-2 relative flex justify-center items-center group mt-10 lg:mt-0">
                {/* Efeito de brilho de fundo */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-brand/20 blur-[100px] rounded-full pointer-events-none"></div>

                {/* Container da Imagem Central */}
                <div className="relative z-10 w-full max-w-sm lg:max-w-md xl:max-w-[400px] mx-auto aspect-square bg-[#111] rounded-3xl border-2 border-brand shadow-[0_0_50px_rgba(212,0,0,0.3)] overflow-hidden transition-transform duration-500 hover:scale-105 group">
                  {/* Foto enviada pelo cliente */}
                  <img
                    src="/nova-foto-premio.png"
                    alt="Playstation 5 e Pix"
                    className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/90 to-transparent p-5 text-center">
                    <span className="font-montserrat font-black text-2xl xl:text-3xl text-accent uppercase tracking-widest drop-shadow-md">PS5 1TB</span>
                    <p className="text-white font-bold text-xs xl:text-sm uppercase mt-1 tracking-widest">OU R$ 1.500 NO PIX</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* CUIDADO: Red Bottom Border Line. Posição fixa bottom-0 sem interferência. */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand to-transparent z-20"></div>
        </section>

        {/* TICKETS SECTION */}
        <section className="py-24 relative" id="tickets">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-montserrat font-black text-4xl md:text-6xl text-white uppercase tracking-tight mb-4">
                Escolha seus <span className="text-brand">números</span>
              </h2>
              <div className="w-24 h-1 bg-accent mx-auto mb-6"></div>
              <p className="text-gray-400 font-inter text-lg">
                Clique nos números abaixo para selecionar. {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(raffle.pricePerTicket))} cada cota.
              </p>
            </div>

            <TicketGrid
              raffle={{ ...raffle, pricePerTicket: Number(raffle.pricePerTicket) }}
              tickets={raffle.tickets}
            />
          </div>
        </section>

        {/* CALL TO ACTION SECTION */}
        <section className="py-20 border-t border-white/5 bg-[#111]">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-montserrat font-black text-3xl md:text-5xl text-white uppercase mb-8">
              Não fique de fora dessa <span className="text-accent">oportunidade</span>
            </h2>
            <p className="text-gray-400 font-inter max-w-2xl mx-auto mb-10 text-lg">
              A qualquer momento todos os números podem esgotar. O pagamento é processado instantaneamente e sua participação é confirmada na hora via sistema seguro.
            </p>
            <a href="#tickets" className="inline-block bg-brand text-white font-montserrat font-black uppercase tracking-wider px-12 py-5 rounded shadow-[0_0_20px_rgba(212,0,0,0.4)] hover:bg-brand-hover hover:-translate-y-1 transition-all duration-300">
              COMPRAR AGORA
            </a>
          </div>
        </section>
      </div>
    )
  } catch (error) {
    console.error('[HOME PAGE ERROR]', error)
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4 text-center">
        <h1 className="text-3xl font-black text-brand mb-4 uppercase tracking-tighter">Ops! Sistema em Manutenção</h1>
        <p className="text-gray-400 max-w-md font-medium">
          Estamos realizando uma manutenção rápida em nossos sistemas para garantir a melhor experiência para você.
          Por favor, tente novamente em alguns instantes.
        </p>
        <div className="mt-8 p-4 border border-brand/20 rounded bg-brand/5 text-xs text-brand/60 font-mono">
          SERVER_SIDE_EXCEPTION_HANDLED
        </div>
      </div>
    )
  }
}

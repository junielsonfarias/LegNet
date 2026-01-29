import { Hero } from '@/components/home/hero'
import { HighlightsSection } from '@/components/home/highlights-section'
import { ParliamentariansSection } from '@/components/home/parliamentarians-section'
import { LatestNews } from '@/components/home/latest-news'
import { TransparencySection } from '@/components/home/transparency-section'
import { StatsSection } from '@/components/home/stats-section'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero com estatisticas dinamicas */}
      <Hero />

      {/* Destaques: Sessao ao vivo, Proxima sessao, Publicacoes */}
      <HighlightsSection />

      {/* Parlamentares */}
      <ParliamentariansSection />

      {/* Noticias */}
      <LatestNews />

      {/* Transparencia */}
      <TransparencySection />

      {/* Estatisticas detalhadas */}
      <StatsSection />
    </div>
  )
}

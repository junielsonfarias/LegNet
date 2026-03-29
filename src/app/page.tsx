import { Hero } from '@/components/home/hero'
import { LiveSessionBanner } from '@/components/home/live-session-banner'
import { LegislativeActivitySection } from '@/components/home/legislative-activity-section'
import { ParliamentariansSection } from '@/components/home/parliamentarians-section'
import { TransparencySection } from '@/components/home/transparency-section'
import { LatestNews } from '@/components/home/latest-news'
import { CitizenParticipationSection } from '@/components/home/citizen-participation-section'
import { StatsSection } from '@/components/home/stats-section'
import { SocialMediaBanner } from '@/components/home/social-media-banner'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero com busca, 4 cards de acesso rapido e estatisticas */}
      <Hero />

      {/* Banner de sessao ao vivo ou proxima sessao */}
      <LiveSessionBanner />

      {/* Atividade legislativa com abas */}
      <LegislativeActivitySection />

      {/* Parlamentares */}
      <ParliamentariansSection />

      {/* Transparencia */}
      <TransparencySection />

      {/* Redes sociais */}
      <SocialMediaBanner />

      {/* Noticias */}
      <LatestNews />

      {/* Participacao cidada */}
      <CitizenParticipationSection />

      {/* Contato e redes sociais */}
      <StatsSection />
    </div>
  )
}

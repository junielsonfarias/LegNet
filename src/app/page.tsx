import { Hero } from '@/components/home/hero'
import { LiveSessionBanner } from '@/components/home/live-session-banner'
import { LegislativeActivitySection } from '@/components/home/legislative-activity-section'
import { ParliamentariansSection } from '@/components/home/parliamentarians-section'
import { TransparencySection } from '@/components/home/transparency-section'
import { LatestNews } from '@/components/home/latest-news'
import { CitizenParticipationSection } from '@/components/home/citizen-participation-section'
import { StatsSection } from '@/components/home/stats-section'
import { SocialMediaBanner } from '@/components/home/social-media-banner'
import { RevealSection } from '@/components/ui/reveal-section'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero com busca, 4 cards de acesso rapido e estatisticas */}
      <Hero />

      {/* Banner de sessao ao vivo ou proxima sessao */}
      <RevealSection direction="up" distance={20}>
        <LiveSessionBanner />
      </RevealSection>

      {/* Atividade legislativa com abas */}
      <RevealSection direction="up" delay={50}>
        <LegislativeActivitySection />
      </RevealSection>

      {/* Parlamentares */}
      <RevealSection direction="up" delay={50}>
        <ParliamentariansSection />
      </RevealSection>

      {/* Transparencia */}
      <RevealSection direction="up" delay={50}>
        <TransparencySection />
      </RevealSection>

      {/* Redes sociais */}
      <RevealSection direction="up" distance={20}>
        <SocialMediaBanner />
      </RevealSection>

      {/* Noticias */}
      <RevealSection direction="up" delay={50}>
        <LatestNews />
      </RevealSection>

      {/* Participacao cidada */}
      <RevealSection direction="up" delay={50}>
        <CitizenParticipationSection />
      </RevealSection>

      {/* Contato e redes sociais */}
      <RevealSection direction="up" distance={20}>
        <StatsSection />
      </RevealSection>
    </div>
  )
}

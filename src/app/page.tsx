import { Hero } from '@/components/home/hero'
import { StatsSection } from '@/components/home/stats-section'
import { LatestNews } from '@/components/home/latest-news'
import { ParliamentariansSection } from '@/components/home/parliamentarians-section'
import { TransparencySection } from '@/components/home/transparency-section'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <StatsSection />
      <ParliamentariansSection />
      <LatestNews />
      <TransparencySection />
    </div>
  )
}

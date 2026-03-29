'use client'

import Link from 'next/link'
import { Facebook, Instagram, Youtube, ArrowRight } from 'lucide-react'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'
import { cn } from '@/lib/utils'

const socialNetworks = [
  {
    key: 'facebook' as const,
    label: 'Facebook',
    icon: Facebook,
    gradient: 'from-blue-600 to-blue-700',
    hoverBg: 'hover:bg-blue-700',
    description: 'Curta nossa pagina',
  },
  {
    key: 'instagram' as const,
    label: 'Instagram',
    icon: Instagram,
    gradient: 'from-pink-500 via-purple-500 to-orange-400',
    hoverBg: 'hover:bg-pink-600',
    description: 'Siga nosso perfil',
  },
  {
    key: 'youtube' as const,
    label: 'YouTube',
    icon: Youtube,
    gradient: 'from-red-600 to-red-700',
    hoverBg: 'hover:bg-red-700',
    description: 'Inscreva-se no canal',
  },
]

export function SocialMediaBanner() {
  const { configuracao } = useConfiguracaoInstitucional()

  const urls: Record<string, string | null> = {
    facebook: configuracao.facebookUrl || '#',
    instagram: configuracao.instagramUrl || '#',
    youtube: configuracao.youtubeUrl || '#',
  }

  return (
    <section className="py-8 md:py-12 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-500 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <p className="text-xs md:text-sm font-semibold uppercase tracking-wider text-blue-400 mb-1">
            Conecte-se conosco
          </p>
          <h2 className="text-lg md:text-2xl lg:text-3xl font-bold text-white">
            Acompanhe nossas redes sociais
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Fique por dentro das noticias, sessoes e atividades legislativas
          </p>
        </div>

        {/* Social Cards */}
        <div className="grid grid-cols-3 gap-3 md:gap-5 max-w-2xl mx-auto">
          {socialNetworks.map((social) => {
            const url = urls[social.key] || '#'

            return (
              <a
                key={social.key}
                href={url}
                target={url !== '#' ? '_blank' : undefined}
                rel={url !== '#' ? 'noopener noreferrer' : undefined}
                className="group"
              >
                <div className={cn(
                  'relative rounded-2xl overflow-hidden transition-all duration-300',
                  'hover:scale-105 hover:-translate-y-1 hover:shadow-2xl',
                  'bg-gradient-to-br p-[1px]',
                  social.gradient
                )}>
                  <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl p-4 sm:p-5 md:p-6 text-center h-full group-hover:bg-slate-800/70 transition-colors">
                    {/* Icon */}
                    <div className={cn(
                      'w-12 h-12 sm:w-14 sm:h-14 rounded-xl mx-auto mb-3 flex items-center justify-center',
                      'bg-gradient-to-br shadow-lg',
                      social.gradient,
                      'group-hover:scale-110 transition-transform'
                    )}>
                      <social.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>

                    {/* Text */}
                    <h3 className="font-bold text-white text-sm sm:text-base mb-0.5">
                      {social.label}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-400 hidden sm:block">
                      {social.description}
                    </p>

                    {/* CTA */}
                    <div className="mt-2 sm:mt-3 inline-flex items-center gap-1 text-[11px] sm:text-xs font-medium text-blue-400 group-hover:text-blue-300 transition-colors">
                      <span className="hidden sm:inline">Acessar</span>
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default SocialMediaBanner

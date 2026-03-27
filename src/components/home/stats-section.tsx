/**
 * Stats Section - Contato + Redes sociais + Fale Conosco
 */

'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Facebook,
  Instagram,
  Youtube,
  Send,
} from 'lucide-react'

const socialLinks = [
  { icon: Facebook, label: 'Facebook', href: '#', color: 'hover:bg-blue-500' },
  { icon: Instagram, label: 'Instagram', href: '#', color: 'hover:bg-pink-500' },
  { icon: Youtube, label: 'YouTube', href: '#', color: 'hover:bg-red-500' },
]

export function StatsSection() {
  return (
    <section
      className="py-16 text-white relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, var(--municipal-primary-dark) 0%, var(--municipal-primary-darker) 100%)'
      }}
    >
      {/* Decoracao */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute bottom-0 -left-12 w-64 h-64 rounded-full bg-white/5" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Fale Conosco */}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Fale Conosco</h2>
            <p className="text-white/70 text-lg mb-6 max-w-lg">
              Entre em contato com a Camara Municipal. Estamos a disposicao para atender o cidadao.
            </p>

            {/* Redes Sociais */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm text-white/60">Siga-nos:</span>
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${social.label} (abre em nova janela)`}
                  className={`w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center ${social.color} transition-colors`}
                >
                  <social.icon className="h-5 w-5 text-white" />
                </a>
              ))}
            </div>

            <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-gray-100 font-semibold">
              <Link href="/institucional/contato">
                <Send className="h-5 w-5 mr-2" />
                Enviar Mensagem
              </Link>
            </Button>
          </div>

          {/* Informacoes de contato */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-4 border border-white/10">
            <h3 className="font-semibold text-lg mb-4">Informacoes de Contato</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-white/70" />
                </div>
                <div>
                  <p className="text-sm text-white/90">Praca Central, S/N - Centro</p>
                  <p className="text-xs text-white/50">Mojui dos Campos - PA</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4 text-white/70" />
                </div>
                <p className="text-sm text-white/90">(93) 3059-1000</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-white/70" />
                </div>
                <p className="text-sm text-white/90">contato@camaramojui.pa.gov.br</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-white/70" />
                </div>
                <p className="text-sm text-white/90">Segunda a Sexta: 8h as 14h</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default StatsSection

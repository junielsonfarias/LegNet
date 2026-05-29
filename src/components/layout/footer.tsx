'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Youtube } from 'lucide-react'
import { useConfiguracaoInstitucional, formatarEnderecoClient } from '@/lib/hooks/use-configuracao-institucional'
import { RadarBadge } from '@/components/transparencia/radar-badge'

export function Footer() {
  const { configuracao, legislatura, mesaDiretora } = useConfiguracaoInstitucional()
  const [anoAtual, setAnoAtual] = useState(2026)

  useEffect(() => {
    setAnoAtual(new Date().getFullYear())
  }, [])

  const nomeCasa = configuracao.nomeCasa
  const enderecoCompleto = formatarEnderecoClient(configuracao.endereco)
  const periodoLegislatura = legislatura?.periodo || `${anoAtual}/${anoAtual + 3}`

  const socialLinks = [
    { Icon: Facebook, label: 'Facebook', href: configuracao.facebookUrl },
    { Icon: Instagram, label: 'Instagram', href: configuracao.instagramUrl },
    { Icon: Youtube, label: 'Youtube', href: configuracao.youtubeUrl },
  ].filter(s => s.href)

  const linkClass = "block hover:text-camara-primary transition-colors focus:outline-none focus:ring-2 focus:ring-camara-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-1 -mx-1"

  return (
    <footer
      id="footer"
      className="text-white"
      style={{ backgroundColor: 'var(--municipal-primary-darker, #0f172a)' }}
      role="contentinfo"
      aria-label="Rodape do site"
    >
      {/* Seção principal */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Info da Câmara + Redes Sociais (topo no mobile) */}
        <div className="mb-6 md:mb-0 md:hidden">
          <h3 className="text-base font-bold text-camara-primary mb-3">
            {nomeCasa}
          </h3>
          <div className="grid grid-cols-1 gap-1.5 text-sm text-gray-300 mb-4">
            {enderecoCompleto && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-camara-primary shrink-0" />
                <span className="text-xs">{enderecoCompleto}</span>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {configuracao.telefone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-camara-primary" />
                  <span className="text-xs">{configuracao.telefone}</span>
                </div>
              )}
              {configuracao.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-camara-primary" />
                  <span className="text-xs break-all">{configuracao.email}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-camara-primary" />
              <span className="text-xs">08h às 14h, Seg à Sex</span>
            </div>
          </div>

          {/* Redes Sociais - inline no mobile */}
          {socialLinks.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">Siga-nos:</span>
            {socialLinks.map(({ Icon, label, href }) => (
              <a
                key={label}
                href={href!}
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center text-gray-400 hover:text-camara-primary"
                aria-label={`${label} (abre em nova janela)`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </a>
            ))}
          </div>
          )}
        </div>

        {/* Separador mobile */}
        <div className="border-t border-white/10 mb-6 md:hidden" />

        {/* Links: 2 cols em <sm, 3 cols em sm, 4 cols em md+ — melhor legibilidade em telas pequenas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-8">
          {/* Info da Câmara (só desktop) */}
          <div className="hidden md:block space-y-4">
            <h3 className="text-lg font-semibold text-camara-primary">
              {nomeCasa}
            </h3>
            <div className="space-y-2 text-sm">
              {enderecoCompleto && (
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-camara-primary flex-shrink-0" />
                  <span>{enderecoCompleto}</span>
                </div>
              )}
              {configuracao.telefone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-camara-primary" />
                  <span>{configuracao.telefone}</span>
                </div>
              )}
              {configuracao.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-camara-primary" />
                  <span>{configuracao.email}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-camara-primary" />
                <span>De 08:00h às 14:00h, Segunda à Sexta</span>
              </div>
            </div>

            {/* Redes Sociais desktop */}
            {socialLinks.length > 0 && (
            <div className="pt-2">
              <h5 id="footer-redes" className="text-sm font-semibold mb-2">Redes Sociais</h5>
              <nav aria-labelledby="footer-redes">
                <ul className="flex space-x-3" role="list">
                  {socialLinks.map(({ Icon, label, href }) => (
                    <li key={label}>
                      <a
                        href={href!}
                        className="text-gray-400 hover:text-camara-primary transition-colors focus:outline-none focus:ring-2 focus:ring-camara-primary rounded p-1 inline-flex min-w-touch min-h-touch items-center justify-center"
                        aria-label={`${label} (abre em nova janela)`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
            )}
          </div>

          {/* Links Institucionais */}
          <nav aria-labelledby="footer-institucional">
            <h4 id="footer-institucional" className="text-xs md:text-lg font-semibold mb-2 md:mb-4 text-white/80 md:text-white uppercase md:normal-case tracking-wider md:tracking-normal">Institucional</h4>
            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm" role="list">
              <li><Link href="/institucional/sobre" className={linkClass}>Sobre a Camara</Link></li>
              <li><Link href="/institucional/codigo-etica" className={linkClass}>Codigo de Etica</Link></li>
              <li><Link href="/institucional/lei-organica" className={linkClass}>Lei Organica</Link></li>
              <li><Link href="/institucional/regimento" className={linkClass}>Regimento Interno</Link></li>
              <li><Link href="/institucional/ouvidoria" className={linkClass}>Ouvidoria</Link></li>
              <li><Link href="/transparencia/politica-privacidade" className={linkClass}>Politica de Privacidade</Link></li>
            </ul>
          </nav>

          {/* Links Legislativos */}
          <nav aria-labelledby="footer-legislativo">
            <h4 id="footer-legislativo" className="text-xs md:text-lg font-semibold mb-2 md:mb-4 text-white/80 md:text-white uppercase md:normal-case tracking-wider md:tracking-normal">Legislativo</h4>
            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm" role="list">
              <li><Link href="/parlamentares" className={linkClass}>Vereadores</Link></li>
              <li><Link href="/legislativo/sessoes" className={linkClass}>Sessoes</Link></li>
              <li><Link href="/legislativo/proposicoes" className={linkClass}>Proposicoes</Link></li>
              <li><Link href="/legislativo/comissoes" className={linkClass}>Comissoes</Link></li>
              <li><Link href="/transparencia/publicacoes" className={linkClass}>Publicacoes</Link></li>
            </ul>
          </nav>

          {/* Transparencia */}
          <nav aria-labelledby="footer-transparencia">
            <h4 id="footer-transparencia" className="text-xs md:text-lg font-semibold mb-2 md:mb-4 text-white/80 md:text-white uppercase md:normal-case tracking-wider md:tracking-normal">Transparencia</h4>
            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm" role="list">
              <li><Link href="/transparencia/gestao-fiscal" className={linkClass}>Gestao Fiscal</Link></li>
              <li><Link href="/transparencia/leis" className={linkClass}>Leis</Link></li>
              <li><Link href="/transparencia/atos/decretos" className={linkClass}>Decretos</Link></li>
              <li><Link href="/transparencia" className={linkClass}>Portal Completo</Link></li>
              <li><Link href="/transparencia/mapa-do-site" className={linkClass}>Mapa do Site</Link></li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Informações da Legislatura */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2 md:gap-4">
            <div className="text-center md:text-left">
              <p className="text-xs md:text-sm text-gray-400">
                <strong>Legislatura {periodoLegislatura}</strong>
                {mesaDiretora?.presidente && (
                  <> | Presidente: {mesaDiretora.presidente}</>
                )}
              </p>
              {configuracao.cnpj && (
                <p className="text-xs text-gray-500">
                  CNPJ: {configuracao.cnpj}
                </p>
              )}
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs md:text-sm text-gray-400">
                © {anoAtual} {nomeCasa}
              </p>
              {/* PNTP: ativar via admin quando configurado */}
            </div>
          </div>
        </div>
      </div>

      {/* Radar ATRICON - Programa Nacional de Transparencia Publica (PNTP) */}
      <div className="bg-camara-primary py-1.5 md:py-2">
        <div className="container mx-auto px-4 text-center">
          <RadarBadge variant="footer" />
        </div>
      </div>
    </footer>
  )
}

'use client'

import Link from 'next/link'
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Youtube, ExternalLink } from 'lucide-react'
import { useConfiguracaoInstitucional, formatarEnderecoClient } from '@/lib/hooks/use-configuracao-institucional'

export function Footer() {
  const { configuracao, legislatura, mesaDiretora } = useConfiguracaoInstitucional()

  const nomeCasa = configuracao.nomeCasa
  const enderecoCompleto = formatarEnderecoClient(configuracao.endereco)
  const anoAtual = new Date().getFullYear()

  // Formatar periodo da legislatura
  const periodoLegislatura = legislatura?.periodo || `${anoAtual}/${anoAtual + 3}`

  return (
    <footer
      id="footer"
      className="bg-gray-900 text-white"
      role="contentinfo"
      aria-label="Rodape do site"
    >
      {/* Seção principal do footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Informações da Câmara */}
          <div className="space-y-4">
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
          </div>

          {/* Links Institucionais */}
          <nav className="space-y-4" aria-labelledby="footer-institucional">
            <h4 id="footer-institucional" className="text-lg font-semibold">Institucional</h4>
            <ul className="space-y-2 text-sm" role="list">
              <li>
                <Link href="/institucional/sobre" className="block hover:text-camara-primary transition-colors focus:outline-none focus:ring-2 focus:ring-camara-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-1 -mx-1">
                  Sobre a Camara
                </Link>
              </li>
              <li>
                <Link href="/institucional/codigo-etica" className="block hover:text-camara-primary transition-colors focus:outline-none focus:ring-2 focus:ring-camara-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-1 -mx-1">
                  Codigo de Etica
                </Link>
              </li>
              <li>
                <Link href="/institucional/lei-organica" className="block hover:text-camara-primary transition-colors focus:outline-none focus:ring-2 focus:ring-camara-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-1 -mx-1">
                  Lei Organica
                </Link>
              </li>
              <li>
                <Link href="/institucional/regimento" className="block hover:text-camara-primary transition-colors focus:outline-none focus:ring-2 focus:ring-camara-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-1 -mx-1">
                  Regimento Interno
                </Link>
              </li>
              <li>
                <Link href="/institucional/ouvidoria" className="block hover:text-camara-primary transition-colors focus:outline-none focus:ring-2 focus:ring-camara-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-1 -mx-1">
                  Ouvidoria
                </Link>
              </li>
            </ul>
          </nav>

          {/* Links Legislativos */}
          <nav className="space-y-4" aria-labelledby="footer-legislativo">
            <h4 id="footer-legislativo" className="text-lg font-semibold">Legislativo</h4>
            <ul className="space-y-2 text-sm" role="list">
              <li>
                <Link href="/parlamentares" className="block hover:text-camara-primary transition-colors focus:outline-none focus:ring-2 focus:ring-camara-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-1 -mx-1">
                  Vereadores
                </Link>
              </li>
              <li>
                <Link href="/legislativo/sessoes" className="block hover:text-camara-primary transition-colors focus:outline-none focus:ring-2 focus:ring-camara-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-1 -mx-1">
                  Sessoes
                </Link>
              </li>
              <li>
                <Link href="/legislativo/proposicoes" className="block hover:text-camara-primary transition-colors focus:outline-none focus:ring-2 focus:ring-camara-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-1 -mx-1">
                  Proposicoes
                </Link>
              </li>
              <li>
                <Link href="/legislativo/comissoes" className="block hover:text-camara-primary transition-colors focus:outline-none focus:ring-2 focus:ring-camara-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-1 -mx-1">
                  Comissoes
                </Link>
              </li>
              <li>
                <Link href="/transparencia/publicacoes" className="block hover:text-camara-primary transition-colors focus:outline-none focus:ring-2 focus:ring-camara-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-1 -mx-1">
                  Publicacoes
                </Link>
              </li>
            </ul>
          </nav>

          {/* Transparencia e Contato */}
          <div className="space-y-4">
            <nav aria-labelledby="footer-transparencia">
              <h4 id="footer-transparencia" className="text-lg font-semibold">Transparencia</h4>
              <ul className="space-y-2 text-sm mt-4" role="list">
                <li>
                  <Link href="/transparencia/gestao-fiscal" className="block hover:text-camara-primary transition-colors focus:outline-none focus:ring-2 focus:ring-camara-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-1 -mx-1">
                    Gestao Fiscal
                  </Link>
                </li>
                <li>
                  <Link href="/transparencia/leis" className="block hover:text-camara-primary transition-colors focus:outline-none focus:ring-2 focus:ring-camara-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-1 -mx-1">
                    Leis
                  </Link>
                </li>
                <li>
                  <Link href="/transparencia/decretos" className="block hover:text-camara-primary transition-colors focus:outline-none focus:ring-2 focus:ring-camara-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-1 -mx-1">
                    Decretos
                  </Link>
                </li>
              </ul>
            </nav>

            {/* Redes Sociais */}
            <div className="pt-4">
              <h5 id="footer-redes" className="text-sm font-semibold mb-2">Redes Sociais</h5>
              <nav aria-labelledby="footer-redes">
                <ul className="flex space-x-3" role="list">
                  <li>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-camara-primary transition-colors focus:outline-none focus:ring-2 focus:ring-camara-primary rounded p-1 inline-flex min-w-touch min-h-touch items-center justify-center"
                      aria-label="Facebook (abre em nova janela)"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Facebook className="h-5 w-5" aria-hidden="true" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-camara-primary transition-colors focus:outline-none focus:ring-2 focus:ring-camara-primary rounded p-1 inline-flex min-w-touch min-h-touch items-center justify-center"
                      aria-label="Instagram (abre em nova janela)"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Instagram className="h-5 w-5" aria-hidden="true" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-camara-primary transition-colors focus:outline-none focus:ring-2 focus:ring-camara-primary rounded p-1 inline-flex min-w-touch min-h-touch items-center justify-center"
                      aria-label="Youtube (abre em nova janela)"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Youtube className="h-5 w-5" aria-hidden="true" />
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Informações da Legislatura */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-400">
                <strong>Legislatura {periodoLegislatura}</strong>
                {mesaDiretora?.presidente && (
                  <> | Presidente: {mesaDiretora.presidente}</>
                )}
              </p>
              {configuracao.cnpj && (
                <p className="text-sm text-gray-400">
                  CNPJ: {configuracao.cnpj}
                </p>
              )}
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-400">
                © {anoAtual} {nomeCasa}. Todos os direitos reservados.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Desenvolvido para fins de transparência pública
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Radar ATRICON */}
      <div className="bg-camara-primary py-2">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-white">
            <strong>Radar ATRICON</strong> - {nomeCasa}
          </p>
        </div>
      </div>
    </footer>
  )
}

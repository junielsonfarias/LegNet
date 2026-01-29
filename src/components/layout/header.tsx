'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, Search, User, ChevronDown, Home, Users, FileText, Eye, Newspaper, MessageSquare, Heart, Accessibility } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'
import { SearchButton, CommandPalette } from '@/components/busca/command-palette'
import { SkipLinks, NavigationRegion, useAnnounce } from '@/components/ui/skip-link'

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { configuracao } = useConfiguracaoInstitucional()
  const { announce } = useAnnounce()

  const nomeCasa = configuracao.nomeCasa
  const sigla = configuracao.sigla || 'CM'
  const logoUrl = configuracao.logoUrl

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Função para mostrar dropdown com delay
  const handleMouseEnter = (sectionTitle: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(sectionTitle)
    }, 150) // Delay de 150ms para mostrar
  }

  // Função para esconder dropdown com delay
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null)
    }, 300) // Delay de 300ms para esconder
  }

  // Função para cancelar timeout quando mouse entra no dropdown
  const handleDropdownMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
  }

  // Cleanup do timeout
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  // Fechar dropdown com ESC
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && activeDropdown) {
      setActiveDropdown(null)
      announce('Menu fechado')
    }
  }, [activeDropdown, announce])

  useEffect(() => {
    if (activeDropdown) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeDropdown, handleKeyDown])

  const menuItems = [
    {
      title: 'Institucional',
      icon: Home,
      items: [
        { name: 'Sobre a Câmara', href: '/institucional/sobre', status: 'active' },
        { name: 'Código de Ética', href: '/institucional/codigo-etica', status: 'active' },
        { name: 'Dicionário Legislativo', href: '/institucional/dicionario', status: 'active' },
        { name: 'E-SIC', href: '/institucional/e-sic', status: 'active' },
        { name: 'Lei Orgânica', href: '/institucional/lei-organica', status: 'active' },
        { name: 'Ouvidoria', href: '/institucional/ouvidoria', status: 'active' },
        { name: 'Papel do Vereador', href: '/institucional/papel-vereador', status: 'active' },
        { name: 'Papel da Câmara', href: '/institucional/papel-camara', status: 'active' },
        { name: 'Regimento Interno', href: '/institucional/regimento', status: 'active' },
      ]
    },
    {
      title: 'Parlamentares',
      icon: Users,
      items: [
        { name: 'Vereadores', href: '/parlamentares', status: 'active' },
        { name: 'Galeria de Vereadores', href: '/parlamentares/galeria', status: 'active' },
        { name: 'Mesa Diretora', href: '/parlamentares/mesa-diretora', status: 'active' },
      ]
    },
    {
      title: 'Legislativo',
      icon: FileText,
      items: [
        { name: 'Calendario Legislativo', href: '/calendario', status: 'active', badge: 'Novo' },
        { name: 'Sessões', href: '/legislativo/sessoes', status: 'active' },
        { name: 'Pautas das Sessões', href: '/legislativo/pautas-sessoes', status: 'active' },
        { name: 'Audiências Públicas', href: '/legislativo/audiencias-publicas', status: 'active' },
        { name: 'Proposições e Matérias', href: '/legislativo/proposicoes', status: 'active' },
        { name: 'Tramitações Legislativas', href: '/tramitacoes', status: 'active' },
        { name: 'Comissões', href: '/legislativo/comissoes', status: 'active' },
        { name: 'Atas de Sessões', href: '/legislativo/atas', status: 'active' },
        { name: 'Legislatura', href: '/legislativo/legislatura', status: 'active' },
      ]
    },
    {
      title: 'Transparência',
      icon: Eye,
      href: '/transparencia',
      items: []
    },
    {
      title: 'Participação Cidadã',
      icon: MessageSquare,
      items: [
        { name: 'Portal de Participação', href: '/participacao', status: 'active', badge: 'Novo' },
        { name: 'Consultas Públicas', href: '/participacao#consultas', status: 'active' },
        { name: 'Sugestões Cidadãs', href: '/participacao#sugestoes', status: 'active' },
        { name: 'Petições Populares', href: '/participacao#peticoes', status: 'active' },
      ]
    },
    {
      title: 'Notícias',
      icon: Newspaper,
      items: [
        { name: 'Todas as Notícias', href: '/noticias', status: 'active' },
      ]
    }
  ]

  // Evitar erro de hidratação - renderizar versão estática inicialmente
  if (!isMounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className="bg-camara-primary text-white py-2">
          <div className="container mx-auto px-4 flex justify-between items-center text-sm">
            <div className="hidden md:flex items-center space-x-4">
              <span>Transparência</span>
              <span>•</span>
              <span>Fale conosco</span>
              <span>•</span>
              <span>Ouvidoria/e-Sic</span>
              <span>•</span>
              <span>Pesquisa</span>
              <span>•</span>
              <span>Acessibilidade</span>
            </div>
            <div className="flex items-center space-x-2 ml-auto">
              <Link
                href="/meus-favoritos"
                className="flex items-center gap-1 px-3 py-1.5 hover:bg-white/10 rounded-md transition-colors font-medium"
                title="Meus Favoritos"
              >
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Favoritos</span>
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors font-medium"
              >
                <User className="h-4 w-4" />
                <span>Área Restrita</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={nomeCasa}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-camara-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{sigla.substring(0, 2)}</span>
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-camara-primary">
                  {nomeCasa}
                </h1>
                <p className="text-sm text-gray-600">Portal Institucional</p>
              </div>
            </Link>
            <div className="lg:hidden">
              <Button variant="ghost" size="sm">
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
        <div className="hidden lg:block border-t bg-white">
          <div className="container mx-auto px-4">
            <nav className="flex items-center justify-center space-x-8 py-3">
              <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700">
                <Home className="h-4 w-4" />
                Institucional
              </div>
              <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700">
                <Users className="h-4 w-4" />
                Parlamentares
              </div>
              <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700">
                <FileText className="h-4 w-4" />
                Legislativo
              </div>
              <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700">
                <Eye className="h-4 w-4" />
                Transparência
              </div>
              <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700">
                <Newspaper className="h-4 w-4" />
                Notícias
              </div>
              <Link href="/participacao-cidada" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                <MessageSquare className="h-4 w-4" />
                Participação Cidadã
              </Link>
            </nav>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* Skip Links para acessibilidade */}
      <SkipLinks />

      <header
        className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm"
        role="banner"
      >
      {/* Barra superior - Top Bar */}
      <div className="bg-camara-primary text-white py-2" role="navigation" aria-label="Links rapidos">
        <div className="container mx-auto px-4 flex justify-between items-center text-sm">
          {/* Links escondidos no mobile */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/transparencia"
              className="hover:text-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-camara-primary rounded px-1"
            >
              Transparencia
            </Link>
            <span aria-hidden="true">•</span>
            <Link
              href="/institucional/e-sic"
              className="hover:text-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-camara-primary rounded px-1"
            >
              E-SIC
            </Link>
            <span aria-hidden="true">•</span>
            <Link
              href="/institucional/ouvidoria"
              className="hover:text-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-camara-primary rounded px-1"
            >
              Ouvidoria
            </Link>
            <span aria-hidden="true">•</span>
            <Link
              href="#accessibility-toolbar"
              className="flex items-center gap-1 hover:text-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-camara-primary rounded px-1"
              aria-label="Opcoes de acessibilidade"
            >
              <Accessibility className="h-4 w-4" aria-hidden="true" />
              <span>Acessibilidade</span>
            </Link>
          </div>
          {/* Area Restrita - sempre visivel */}
          <div className="flex items-center space-x-2 ml-auto">
            <Link
              href="/meus-favoritos"
              className="flex items-center gap-1 px-3 py-1.5 hover:bg-white/10 rounded-md transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-white min-h-touch"
              aria-label="Meus Favoritos"
            >
              <Heart className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Favoritos</span>
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-white min-h-touch"
              aria-label="Acessar area restrita"
            >
              <User className="h-4 w-4" aria-hidden="true" />
              <span>Area Restrita</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Header principal */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={nomeCasa}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-camara-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">{sigla.substring(0, 2)}</span>
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-camara-primary">
                {nomeCasa}
              </h1>
              <p className="text-sm text-gray-600">Portal Institucional</p>
            </div>
          </Link>

          {/* Busca Global */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <SearchButton className="w-full justify-start" />
          </div>

          {/* Command Palette - sempre disponivel via Ctrl+K */}
          <CommandPalette />

          {/* Menu mobile */}
          <div className="lg:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-6 mt-4 animate-in slide-in-from-right duration-300">
                  <SearchButton className="w-full" />

                  {/* Link Área Restrita no mobile */}
                  <Link
                    href="/login"
                    className="flex items-center gap-2 px-4 py-3 bg-camara-primary text-white rounded-lg hover:bg-camara-primary/90 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="h-5 w-5" />
                    <span className="font-medium">Área Restrita</span>
                  </Link>

                  {menuItems.map((section, sectionIndex) => (
                    <div key={section.title} className="animate-in slide-in-from-right duration-300" style={{ animationDelay: `${sectionIndex * 100}ms` }}>
                      {section.items.length === 0 && section.href ? (
                        <Link
                          href={section.href}
                          className="flex items-center gap-2 mb-3 py-2 px-2 hover:bg-gray-50 rounded transition-all"
                          onClick={() => setIsOpen(false)}
                        >
                          <section.icon className="h-4 w-4 text-camara-primary transition-transform duration-200 hover:scale-110" />
                          <h3 className="font-semibold text-camara-primary">
                            {section.title}
                          </h3>
                        </Link>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-3">
                            <section.icon className="h-4 w-4 text-camara-primary transition-transform duration-200 hover:scale-110" />
                            <h3 className="font-semibold text-camara-primary">
                              {section.title}
                            </h3>
                          </div>
                          <div className="space-y-1 ml-6">
                            {section.items.map((item, itemIndex) => (
                              <Link
                                key={item.name}
                                href={item.href}
                                className="block py-2 text-sm text-gray-600 hover:text-camara-primary hover:bg-gray-50 rounded px-2 transition-all duration-200 ease-in-out hover:pl-4 animate-in slide-in-from-right"
                                style={{ animationDelay: `${(sectionIndex * 100) + (itemIndex * 50)}ms` }}
                                onClick={() => setIsOpen(false)}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{item.name}</span>
                                  {item.badge && (
                                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                              </Link>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Menu desktop centralizado */}
      <div className="hidden lg:block border-t bg-white">
        <div className="container mx-auto px-4">
          <NavigationRegion label="Menu principal" id="main-nav">
            <ul className="flex items-center justify-center space-x-8 py-3" role="menubar">
              {menuItems.map((section) => (
                <li
                  key={section.title}
                  className="relative group"
                  role="none"
                  onMouseEnter={() => section.items.length > 0 ? handleMouseEnter(section.title) : null}
                  onMouseLeave={handleMouseLeave}
                >
                  {section.items.length === 0 && section.href ? (
                    <Link
                      href={section.href}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-camara-primary transition-all duration-200 ease-in-out hover:bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-camara-primary focus:ring-offset-2 min-h-touch"
                      role="menuitem"
                    >
                      <section.icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
                      {section.title}
                    </Link>
                  ) : (
                    <>
                      <button
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-camara-primary transition-all duration-200 ease-in-out hover:bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-camara-primary focus:ring-offset-2 min-h-touch"
                        role="menuitem"
                        aria-haspopup="true"
                        aria-expanded={activeDropdown === section.title}
                        aria-controls={`dropdown-${section.title.toLowerCase().replace(/\s/g, '-')}`}
                        onClick={() => setActiveDropdown(activeDropdown === section.title ? null : section.title)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setActiveDropdown(activeDropdown === section.title ? null : section.title)
                          }
                          if (e.key === 'ArrowDown' && section.items.length > 0) {
                            e.preventDefault()
                            setActiveDropdown(section.title)
                          }
                        }}
                      >
                        <section.icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
                        {section.title}
                        <ChevronDown
                          className={`h-3 w-3 transition-all duration-300 ease-in-out ${
                            activeDropdown === section.title ? 'rotate-180 text-camara-primary' : 'rotate-0'
                          }`}
                          aria-hidden="true"
                        />
                      </button>

                      {/* Dropdown com ARIA */}
                      <div
                        id={`dropdown-${section.title.toLowerCase().replace(/\s/g, '-')}`}
                        className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 transition-all duration-200 ease-in-out ${
                          activeDropdown === section.title
                            ? 'opacity-100 visible translate-y-0'
                            : 'opacity-0 invisible -translate-y-2'
                        }`}
                        role="menu"
                        aria-label={`Submenu de ${section.title}`}
                        aria-hidden={activeDropdown !== section.title}
                        onMouseEnter={handleDropdownMouseEnter}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="px-4 py-2 border-b border-gray-100">
                          <h4 className="font-semibold text-camara-primary flex items-center gap-2" id={`heading-${section.title.toLowerCase().replace(/\s/g, '-')}`}>
                            <section.icon className="h-4 w-4" aria-hidden="true" />
                            {section.title}
                          </h4>
                        </div>
                        <ul className="max-h-96 overflow-y-auto" role="menu" aria-labelledby={`heading-${section.title.toLowerCase().replace(/\s/g, '-')}`}>
                          {section.items.map((item, itemIndex) => (
                            <li key={item.name} role="none">
                              <Link
                                href={item.href}
                                className="block px-4 py-3 text-sm text-gray-700 hover:bg-camara-primary/5 hover:text-camara-primary transition-all duration-150 ease-in-out hover:pl-6 focus:outline-none focus:bg-camara-primary/10 focus:text-camara-primary"
                                role="menuitem"
                                tabIndex={activeDropdown === section.title ? 0 : -1}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') {
                                    setActiveDropdown(null)
                                  }
                                  if (e.key === 'ArrowDown') {
                                    e.preventDefault()
                                    const nextItem = e.currentTarget.parentElement?.nextElementSibling?.querySelector('a')
                                    nextItem?.focus()
                                  }
                                  if (e.key === 'ArrowUp') {
                                    e.preventDefault()
                                    const prevItem = e.currentTarget.parentElement?.previousElementSibling?.querySelector('a')
                                    prevItem?.focus()
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{item.name}</span>
                                  {item.badge && (
                                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full" aria-label={`${item.badge}`}>
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </NavigationRegion>
        </div>
      </div>
    </header>
    </>
  )
}

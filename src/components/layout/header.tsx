'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Menu, X, Search, User, ChevronDown, Home, Users, FileText, Eye, Newspaper, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
        { name: 'Sessões', href: '/legislativo/sessoes', status: 'active' },
        { name: 'Pautas das Sessões', href: '/legislativo/pautas-sessoes', status: 'active' },
        { name: 'Audiências Públicas', href: '/legislativo/audiencias-publicas', status: 'active' },
        { name: 'Proposições e Matérias', href: '/legislativo/proposicoes', status: 'active' },
        { name: 'Tramitações Legislativas', href: '/tramitacoes', status: 'active', badge: 'Novo' },
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
            <div className="flex items-center space-x-4">
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
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <User className="h-4 w-4 mr-1" />
                Área Restrita
              </Button>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-camara-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">CM</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-camara-primary">
                  Câmara Municipal de Mojuí dos Campos
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
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
      {/* Barra superior */}
      <div className="bg-camara-primary text-white py-2">
        <div className="container mx-auto px-4 flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <Link href="/transparencia" className="hover:text-blue-200 transition-colors">
              Transparência
            </Link>
            <span>•</span>
            <Link href="/institucional/ouvidoria" className="hover:text-blue-200 transition-colors">
              Fale conosco
            </Link>
            <span>•</span>
            <Link href="/institucional/ouvidoria" className="hover:text-blue-200 transition-colors">
              Ouvidoria/e-Sic
            </Link>
            <span>•</span>
            <span className="cursor-pointer hover:text-blue-200 transition-colors">Pesquisa</span>
            <span>•</span>
            <span className="cursor-pointer hover:text-blue-200 transition-colors">Acessibilidade</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <Link href="/admin">
                <User className="h-4 w-4 mr-1" />
                Área Restrita
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Header principal */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-camara-primary rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">CM</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-camara-primary">
                Câmara Municipal de Mojuí dos Campos
              </h1>
              <p className="text-sm text-gray-600">Portal Institucional</p>
            </div>
          </Link>

          {/* Busca */}
          <div className="hidden lg:flex items-center space-x-4 flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar no portal..."
                className="pl-10 pr-4"
              />
            </div>
          </div>

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
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar no portal..."
                      className="pl-10 pr-4"
                    />
                  </div>
                  
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
          <nav className="flex items-center justify-center space-x-8 py-3">
            {menuItems.map((section) => (
              <div
                key={section.title}
                className="relative group"
                onMouseEnter={() => section.items.length > 0 ? handleMouseEnter(section.title) : null}
                onMouseLeave={handleMouseLeave}
              >
                {section.items.length === 0 && section.href ? (
                  <Link 
                    href={section.href}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-camara-primary transition-all duration-200 ease-in-out hover:bg-gray-50 rounded-md"
                  >
                    <section.icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                    {section.title}
                  </Link>
                ) : (
                  <>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-camara-primary transition-all duration-200 ease-in-out hover:bg-gray-50 rounded-md">
                      <section.icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                      {section.title}
                      <ChevronDown className={`h-3 w-3 transition-all duration-300 ease-in-out ${
                        activeDropdown === section.title ? 'rotate-180 text-camara-primary' : 'rotate-0'
                      }`} />
                    </button>
                    
                    {/* Dropdown */}
                    <div 
                      className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 transition-all duration-200 ease-in-out ${
                        activeDropdown === section.title 
                          ? 'opacity-100 visible translate-y-0' 
                          : 'opacity-0 invisible -translate-y-2'
                      }`}
                      onMouseEnter={handleDropdownMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <h4 className="font-semibold text-camara-primary flex items-center gap-2">
                          <section.icon className="h-4 w-4" />
                          {section.title}
                        </h4>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {section.items.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="block px-4 py-3 text-sm text-gray-700 hover:bg-camara-primary/5 hover:text-camara-primary transition-all duration-150 ease-in-out hover:pl-6"
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
                    </div>
                  </>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}

'use client'

import Image from 'next/image'
import { signOut } from 'next-auth/react'
import { Building2, MapPin, Timer, User, LogOut, ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatarTempo, formatarTipoSessao, formatarDataSessao } from '../../hooks/useTempoSessao'
import type { SessaoCompleta, ParlamentarInfo, ConfiguracaoInstitucional } from '../../types/votacao'

interface VotacaoHeaderProps {
  sessao: SessaoCompleta
  parlamentarInfo: ParlamentarInfo | null
  nomeParlamentar: string
  tempoSessao: number
  configuracao: ConfiguracaoInstitucional
  statusBadge?: React.ReactNode
  variant?: 'default' | 'dark' | 'compact'
}

export function VotacaoHeader({
  sessao,
  parlamentarInfo,
  nomeParlamentar,
  tempoSessao,
  configuracao,
  statusBadge,
  variant = 'default'
}: VotacaoHeaderProps) {
  const iniciais = nomeParlamentar.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const cidade = configuracao.endereco?.cidade || 'Mojuí dos Campos'
  const logoUrl = configuracao.logoUrl ?? undefined
  const nomeCasa = configuracao.nomeCasa || 'Câmara Municipal'
  const fotoUrl = parlamentarInfo?.foto ?? undefined

  const isDark = variant === 'dark'
  const isCompact = variant === 'compact'

  const headerBgClass = isDark
    ? 'bg-slate-800/90 border-slate-700'
    : 'bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900'

  const textPrimaryClass = isDark ? 'text-white' : 'text-white'
  const textSecondaryClass = isDark ? 'text-slate-400' : 'text-blue-200'

  const sizeClass = isCompact ? {
    logo: 'w-6 h-6 sm:w-7 sm:h-7',
    avatar: 'w-7 h-7 sm:w-8 sm:h-8',
    titleText: 'text-[10px] sm:text-xs',
    subtitleText: 'text-[9px] sm:text-[10px]',
    nameText: 'text-xs sm:text-sm',
    padding: 'px-3 py-1.5 sm:py-2'
  } : {
    logo: 'w-10 h-10 sm:w-11 sm:h-11',
    avatar: 'w-11 h-11 sm:w-12 sm:h-12',
    titleText: 'text-sm sm:text-base',
    subtitleText: 'text-xs sm:text-sm',
    nameText: 'text-base sm:text-lg',
    padding: 'px-3 sm:px-4 py-2.5 sm:py-3'
  }

  return (
    <header className={`flex-shrink-0 ${headerBgClass} ${isDark ? 'border-b' : ''}`}>
      {/* Barra superior - Câmara */}
      <div className={`border-b ${isDark ? 'border-slate-700/50' : 'border-white/10'} ${sizeClass.padding}`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="Logo"
                width={44}
                height={44}
                className={`${sizeClass.logo} rounded-full object-contain bg-white p-0.5`}
                unoptimized
              />
            ) : (
              <div className={`${sizeClass.logo} ${isDark ? 'bg-blue-600/30' : 'bg-white/20'} rounded-full flex items-center justify-center flex-shrink-0`}>
                <Building2 className={`${isCompact ? 'h-3 w-3 sm:h-4 sm:w-4' : 'h-5 w-5 sm:h-6 sm:w-6'} ${isDark ? 'text-blue-400' : 'text-white'}`} />
              </div>
            )}
            <div className="min-w-0">
              <p className={`${textPrimaryClass} font-bold ${sizeClass.titleText} truncate`}>
                {nomeCasa}
              </p>
              <p className={`${textSecondaryClass} ${sizeClass.subtitleText} flex items-center gap-1`}>
                <MapPin className={isCompact ? 'h-2 w-2 sm:h-2.5 sm:w-2.5' : 'h-3 w-3 sm:h-3.5 sm:w-3.5'} />
                {cidade}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5 text-slate-300">
            <div className={`flex items-center gap-1.5 ${sizeClass.subtitleText}`}>
              <div className={`${isCompact ? 'w-1.5 h-1.5' : 'w-2 h-2'} bg-green-500 rounded-full animate-pulse`} />
              <span className="hidden md:inline">
                {sessao.numero}ª Sessão {formatarTipoSessao(sessao.tipo)}
              </span>
              <span className="hidden sm:inline md:hidden">
                {sessao.numero}ª {formatarTipoSessao(sessao.tipo)}
              </span>
              <span className="sm:hidden">
                {sessao.numero}ª {formatarTipoSessao(sessao.tipo, true)}
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className={`${isDark ? 'text-slate-400' : 'text-blue-300'} ${isCompact ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs'}`}>
                {formatarDataSessao(sessao.data)}
              </span>
              {sessao.tempoInicio && (
                <div className={`flex items-center gap-1 font-mono ${isCompact ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'} ${isDark ? 'text-blue-400' : 'text-green-300'} font-semibold`}>
                  <Timer className={isCompact ? 'h-3 w-3' : 'h-3 w-3 sm:h-4 sm:w-4'} />
                  {formatarTempo(tempoSessao)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Barra do parlamentar */}
      <div className={sizeClass.padding}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 sm:gap-3 min-w-0 hover:opacity-80 transition-opacity cursor-pointer">
                {fotoUrl ? (
                  <Image
                    src={fotoUrl}
                    alt={nomeParlamentar}
                    width={48}
                    height={48}
                    className={`${sizeClass.avatar} rounded-full object-cover ring-2 ${isDark ? 'ring-blue-500/50' : 'ring-white/30'}`}
                    unoptimized
                  />
                ) : (
                  <div className={`${sizeClass.avatar} ${isDark ? 'bg-blue-600/30' : 'bg-white/20'} rounded-full flex items-center justify-center ring-2 ${isDark ? 'ring-blue-500/50' : 'ring-white/30'} flex-shrink-0`}>
                    <span className={`${isDark ? 'text-blue-300' : 'text-white'} font-bold ${isCompact ? 'text-[10px] sm:text-xs' : 'text-sm sm:text-base'}`}>
                      {iniciais}
                    </span>
                  </div>
                )}
                <div className="min-w-0 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`${textPrimaryClass} font-bold ${sizeClass.nameText} truncate`}>
                      {nomeParlamentar}
                    </p>
                    {parlamentarInfo?.partido && (
                      <Badge className={`${isDark ? 'bg-blue-600' : 'bg-white/20'} text-white border-0 ${isCompact ? 'text-[9px] sm:text-[10px] px-1.5 py-0' : 'text-[10px] sm:text-xs px-2 py-0.5'}`}>
                        {parlamentarInfo.partido}
                      </Badge>
                    )}
                    <ChevronDown className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'} ${textSecondaryClass}`} />
                  </div>
                  <p className={`${isDark ? 'text-slate-400' : 'text-blue-200'} ${isCompact ? 'text-[9px] sm:text-[10px]' : 'text-xs sm:text-sm'}`}>
                    Vereador(a)
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem disabled className="text-sm text-gray-500">
                <User className="h-4 w-4 mr-2" />
                {nomeParlamentar}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair da Sessão
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {statusBadge}
        </div>
      </div>
    </header>
  )
}

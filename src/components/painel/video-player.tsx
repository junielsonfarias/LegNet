'use client'

/**
 * Componente de Player de Video para Streaming
 * Suporta YouTube, Vimeo e iframes genericos
 */

import { useState, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VideoPlayerProps {
  url?: string
  embedUrl?: string
  plataforma?: 'youtube' | 'vimeo' | 'outro'
  titulo?: string
  autoplay?: boolean
  muted?: boolean
  showControls?: boolean
  aspectRatio?: '16/9' | '4/3' | '1/1'
  className?: string
  chatEnabled?: boolean
  chatUrl?: string
}

export function VideoPlayer({
  url,
  embedUrl,
  plataforma = 'youtube',
  titulo = 'Transmissao ao Vivo',
  autoplay = true,
  muted = false,
  showControls = true,
  aspectRatio = '16/9',
  className = '',
  chatEnabled = false,
  chatUrl
}: VideoPlayerProps) {
  const [isMuted, setIsMuted] = useState(muted)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showChat, setShowChat] = useState(chatEnabled && !!chatUrl)

  // Extrair video ID e gerar embed URL se necessario
  const getEmbedUrl = (): string | null => {
    if (embedUrl) return embedUrl

    if (!url) return null

    if (plataforma === 'youtube' || url.includes('youtube') || url.includes('youtu.be')) {
      const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/
      const match = url.match(regex)
      if (match) {
        const params = new URLSearchParams({
          autoplay: autoplay ? '1' : '0',
          mute: isMuted ? '1' : '0',
          controls: '1',
          modestbranding: '1',
          rel: '0'
        })
        return `https://www.youtube.com/embed/${match[1]}?${params.toString()}`
      }
    }

    if (plataforma === 'vimeo' || url.includes('vimeo')) {
      const regex = /vimeo\.com\/(?:video\/)?(\d+)/
      const match = url.match(regex)
      if (match) {
        const params = new URLSearchParams({
          autoplay: autoplay ? '1' : '0',
          muted: isMuted ? '1' : '0'
        })
        return `https://player.vimeo.com/video/${match[1]}?${params.toString()}`
      }
    }

    return url
  }

  const finalEmbedUrl = getEmbedUrl()

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      const container = document.getElementById('video-container')
      if (container?.requestFullscreen) {
        container.requestFullscreen()
        setIsFullscreen(true)
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  const abrirEmNovaAba = () => {
    if (url) {
      window.open(url, '_blank')
    }
  }

  if (!finalEmbedUrl) {
    return (
      <div className={`bg-gray-800 rounded-lg flex items-center justify-center ${className}`}
           style={{ aspectRatio }}>
        <div className="text-center text-gray-400">
          <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhuma transmissao ativa</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} id="video-container">
      {/* Header com titulo */}
      {showControls && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white font-semibold text-sm">AO VIVO</span>
              <span className="text-white/70 text-sm">• {titulo}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={abrirEmNovaAba}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Container do video */}
      <div className="flex gap-4">
        {/* Player */}
        <div className={`flex-1 ${showChat ? 'w-2/3' : 'w-full'}`}>
          <div className="relative rounded-lg overflow-hidden bg-black" style={{ aspectRatio }}>
            <iframe
              src={finalEmbedUrl}
              title={titulo}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>

        {/* Chat (se habilitado) */}
        {showChat && chatUrl && (
          <div className="w-1/3 min-w-[300px]">
            <div className="bg-gray-800 rounded-lg overflow-hidden h-full" style={{ aspectRatio }}>
              <iframe
                src={chatUrl}
                title="Chat ao vivo"
                className="w-full h-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Controles inferiores */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="text-white/70 text-xs">
              Transmissao via {plataforma === 'youtube' ? 'YouTube' : plataforma === 'vimeo' ? 'Vimeo' : 'Streaming'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Player simplificado para incorporacao
 */
export function SimpleVideoEmbed({
  url,
  className = '',
  aspectRatio = '16/9'
}: {
  url: string
  className?: string
  aspectRatio?: string
}) {
  // Detectar tipo e gerar embed
  let embedUrl = url

  if (url.includes('youtube') || url.includes('youtu.be')) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/)
    if (match) {
      embedUrl = `https://www.youtube.com/embed/${match[1]}`
    }
  } else if (url.includes('vimeo')) {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
    if (match) {
      embedUrl = `https://player.vimeo.com/video/${match[1]}`
    }
  }

  return (
    <div className={`relative rounded-lg overflow-hidden bg-black ${className}`} style={{ aspectRatio }}>
      <iframe
        src={embedUrl}
        title="Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  )
}

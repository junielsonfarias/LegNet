import { ImageResponse } from 'next/og'

/**
 * Icone do app gerado dinamicamente (Fase 4 / A9 PWA).
 * Usado como favicon e em PWA install. Cor do tema vem de SITE_THEME_COLOR
 * (cada tenant pode customizar via env).
 */
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  const themeColor = process.env.SITE_THEME_COLOR || '#374151'
  const initial = (process.env.SITE_NAME || 'Câmara')
    .replace(/^(Cãmara|Camara)(\s+Municipal)?(\s+de)?\s*/i, '')
    .charAt(0)
    .toUpperCase() || 'C'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: themeColor,
          color: '#ffffff',
          fontSize: 22,
          fontWeight: 700,
          fontFamily: 'sans-serif',
          borderRadius: 6
        }}
      >
        {initial}
      </div>
    ),
    { ...size }
  )
}

import { ImageResponse } from 'next/og'

/**
 * Apple touch icon (Fase 4 / A9 PWA) — usado quando usuario salva a tela
 * inicial em iOS.
 */
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
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
          fontSize: 110,
          fontWeight: 700,
          fontFamily: 'sans-serif'
        }}
      >
        {initial}
      </div>
    ),
    { ...size }
  )
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        // Fonte acessivel para dislexia (quando disponivel)
        accessible: ['var(--font-accessible)', 'OpenDyslexic', 'system-ui', 'sans-serif'],
      },
      // Design Tokens - Espacamento Portal
      spacing: {
        'portal-xs': '0.25rem',   // 4px
        'portal-sm': '0.5rem',    // 8px
        'portal-md': '1rem',      // 16px
        'portal-lg': '1.5rem',    // 24px
        'portal-xl': '2rem',      // 32px
        'portal-2xl': '3rem',     // 48px
        'portal-3xl': '4rem',     // 64px
        'portal-4xl': '6rem',     // 96px
        // Touch targets (minimo 44px WCAG)
        'touch-min': '44px',
        'touch-comfortable': '48px',
        'touch-large': '56px',
      },
      // Design Tokens - Tipografia Responsiva
      fontSize: {
        'portal-xs': ['clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)', { lineHeight: '1.5' }],
        'portal-sm': ['clamp(0.875rem, 0.8rem + 0.375vw, 1rem)', { lineHeight: '1.5' }],
        'portal-base': ['clamp(1rem, 0.9rem + 0.5vw, 1.125rem)', { lineHeight: '1.625' }],
        'portal-lg': ['clamp(1.125rem, 1rem + 0.625vw, 1.25rem)', { lineHeight: '1.625' }],
        'portal-xl': ['clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)', { lineHeight: '1.375' }],
        'portal-2xl': ['clamp(1.5rem, 1.25rem + 1.25vw, 2rem)', { lineHeight: '1.25' }],
        'portal-3xl': ['clamp(1.875rem, 1.5rem + 1.875vw, 2.5rem)', { lineHeight: '1.25' }],
        'portal-4xl': ['clamp(2.25rem, 1.75rem + 2.5vw, 3rem)', { lineHeight: '1.25' }],
        'portal-5xl': ['clamp(3rem, 2.25rem + 3.75vw, 4rem)', { lineHeight: '1.25' }],
      },
      // Alturas de linha para acessibilidade
      lineHeight: {
        'accessible': '1.75',     // Espacamento confortavel
        'accessible-loose': '2',  // Espacamento amplo
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Cores específicas da Câmara (dinâmicas via tenant)
        camara: {
          primary: "var(--tenant-primary, #1e40af)", // Azul institucional (padrão)
          secondary: "var(--tenant-secondary, #3b82f6)", // Azul secundário (padrão)
          accent: "#059669", // Verde
          gold: "#d97706", // Dourado
        },
        // Cores do tenant (acesso direto)
        tenant: {
          primary: "var(--tenant-primary, #1e40af)",
          secondary: "var(--tenant-secondary, #3b82f6)",
        },
        // Cores de alto contraste
        'hc': {
          bg: 'var(--hc-bg, #000000)',
          fg: 'var(--hc-fg, #ffffff)',
          primary: 'var(--hc-primary, #ffff00)',
          secondary: 'var(--hc-secondary, #00ffff)',
          accent: 'var(--hc-accent, #ff00ff)',
          focus: 'var(--hc-focus, #ffff00)',
          border: 'var(--hc-border, #ffffff)',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Tamanhos minimos para touch targets
      minWidth: {
        'touch': '44px',
      },
      minHeight: {
        'touch': '44px',
      },
      // Box shadows com focus ring acessivel
      boxShadow: {
        'focus-ring': '0 0 0 3px rgb(59 130 246 / 0.5)',
        'focus-ring-hc': '0 0 0 3px #ffff00',
        'focus-ring-offset': '0 0 0 2px white, 0 0 0 4px rgb(59 130 246 / 0.8)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.85 },
        },
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-2px)" },
        },
        "fade-in": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        "slide-in-up": {
          from: { opacity: 0, transform: "translateY(10px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: 0, transform: "scale(0.95)" },
          to: { opacity: 1, transform: "scale(1)" },
        },
        "confetti": {
          "0%": { transform: "translateY(0) rotate(0deg)", opacity: 1 },
          "100%": { transform: "translateY(100vh) rotate(720deg)", opacity: 0 },
        },
        "ripple": {
          "0%": { transform: "scale(0)", opacity: 1 },
          "100%": { transform: "scale(4)", opacity: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-soft": "pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-soft": "bounce-soft 2s ease-in-out infinite",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-up": "slide-in-up 0.4s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "confetti": "confetti 3s ease-out forwards",
        "ripple": "ripple 1s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#f8f9ff',
          dim: '#ccdbf2',
          bright: '#f8f9ff',
          container: {
            lowest: '#ffffff',
            low: '#eef4ff',
            DEFAULT: '#e5efff',
            high: '#dbe9ff',
            highest: '#d4e4fa'
          },
          tint: '#006a63'
        },
        'on-surface': {
          DEFAULT: '#0d1c2d',
          variant: '#3e4947'
        },
        inverse: {
          surface: '#233143',
          'on-surface': '#e9f1ff',
          primary: '#80d5cb'
        },
        outline: {
          DEFAULT: '#6e7977',
          variant: '#bdc9c6'
        },
        primary: {
          DEFAULT: '#005c55',
          container: '#0f766e',
          fixed: {
            DEFAULT: '#9cf2e8',
            dim: '#80d5cb'
          }
        },
        'on-primary': {
          DEFAULT: '#ffffff',
          container: '#a3faef',
          fixed: {
            DEFAULT: '#00201d',
            variant: '#00504a'
          }
        },
        secondary: {
          DEFAULT: '#545f73',
          container: '#d5e0f8',
          fixed: {
            DEFAULT: '#d8e3fb',
            dim: '#bcc7de'
          }
        },
        'on-secondary': {
          DEFAULT: '#ffffff',
          container: '#586377',
          fixed: {
            DEFAULT: '#111c2d',
            variant: '#3c475a'
          }
        },
        tertiary: {
          DEFAULT: '#a6002f',
          container: '#d2093f',
          fixed: {
            DEFAULT: '#ffdada',
            dim: '#ffb3b6'
          }
        },
        'on-tertiary': {
          DEFAULT: '#ffffff',
          container: '#ffe4e4',
          fixed: {
            DEFAULT: '#40000c',
            variant: '#920028'
          }
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6'
        },
        'on-error': {
          DEFAULT: '#ffffff',
          container: '#93000a'
        },
        background: '#f8f9ff',
        'on-background': '#0d1c2d',
        'agent-atlas': '#2F9E76',
        'agent-vera': '#C97B3D',
        'axis-navy': '#1F2B4D',
        'axis-gold': '#C9A227',
        'risk': '#D8534A',
        'risk-bg': '#FCEDEC',
        'caution': '#D99A3D',
        'surface-dim': '#CCDBF2',
        'border-mock': '#E1E7F5',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'sans-serif']
      },
      spacing: {
        'container-max': '1280px',
        gutter: '24px',
        'margin-mobile': '16px',
        'margin-desktop': '32px',
        'stack-xs': '4px',
        'stack-sm': '8px',
        'stack-md': '16px',
        'stack-lg': '32px'
      }
    },
  },
  plugins: [],
}

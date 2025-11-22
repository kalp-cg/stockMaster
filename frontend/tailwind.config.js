/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        border: 'hsl(220 13% 91%)',
        // Odoo Primary Brand Colors
        'odoo-purple': '#714B67',
        'odoo-purple-soft': '#9C7AA0',
        'odoo-purple-dark': '#4A2C3A',
        // Surface & Background
        'bg-light': '#F8F8F8',
        'surface-white': '#FFFFFF',
        'border-light': '#E3E3E3',
        'hover-gray': '#EFEFEF',
        // Text System
        'text-primary': '#2A2A2A',
        'text-secondary': '#4C4C4C',
        'text-muted': '#8A8A8A',
        'text-disabled': '#BDBDBD',
        // Status Colors
        'status-success': '#21B799',
        'status-warning': '#F5A623',
        'status-error': '#E6383B',
        'status-info': '#5DADE2',
        // Table
        'table-header': '#F4F4F4',
        primary: {
          DEFAULT: '#714B67',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#9C7AA0',
          foreground: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        fadeIn: {
          from: {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideIn: {
          from: {
            transform: 'translateX(-100%)',
          },
          to: {
            transform: 'translateX(0)',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        fadeIn: 'fadeIn 0.5s ease-out',
        slideIn: 'slideIn 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
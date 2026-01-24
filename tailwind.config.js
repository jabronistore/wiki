import { fontFamily } from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
const config = {
	darkMode: ['class'],
	content: ['./src/**/*.{html,js,svelte,ts}'],
	safelist: ['dark'],
	theme: {
		container: {
			center: true,
			padding: {
				DEFAULT: '1rem',
				sm: '2rem',
				lg: '2.5rem',
				xl: '3rem',
				'2xl': '4rem',
				'3xl': '5rem',
				'4xl': '6rem'
			},
			screens: {
				'2xl': '1400px',
				'3xl': '1800px',
				'4xl': '2200px',
				'5xl': '2800px'
			}
		},
		extend: {
			// Add larger screen breakpoints
			screens: {
				'3xl': '1920px',
				'4xl': '2560px',
				'5xl': '3840px'
			},

			// Add responsive spacing scales for larger screens
			spacing: {
				72: '18rem',
				84: '21rem',
				96: '24rem',
				104: '26rem',
				112: '28rem',
				120: '30rem',
				128: '32rem'
			},

			// Add fluid font sizes
			fontSize: {
				'fluid-xs': 'clamp(0.75rem, 0.7vw + 0.6rem, 0.875rem)',
				'fluid-sm': 'clamp(0.875rem, 0.8vw + 0.7rem, 1rem)',
				'fluid-base': 'clamp(1rem, 1vw + 0.75rem, 1.25rem)',
				'fluid-lg': 'clamp(1.125rem, 1.2vw + 0.8rem, 1.5rem)',
				'fluid-xl': 'clamp(1.25rem, 1.5vw + 0.9rem, 1.75rem)',
				'fluid-2xl': 'clamp(1.5rem, 2vw + 1rem, 2.25rem)',
				'fluid-3xl': 'clamp(1.875rem, 2.5vw + 1.1rem, 3rem)',
				'fluid-4xl': 'clamp(2.25rem, 3vw + 1.2rem, 3.75rem)',
				'fluid-5xl': 'clamp(3rem, 4vw + 1.5rem, 5rem)',
				'fluid-6xl': 'clamp(3.75rem, 5vw + 1.75rem, 6rem)'
			},

			colors: {
				border: 'hsl(var(--border) / <alpha-value>)',
				input: 'hsl(var(--input) / <alpha-value>)',
				ring: 'hsl(var(--ring) / <alpha-value>)',
				background: 'hsl(var(--background) / <alpha-value>)',
				foreground: 'hsl(var(--foreground) / <alpha-value>)',
				primary: {
					DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
					foreground: 'hsl(var(--primary-foreground) / <alpha-value>)'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
					foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
					foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
					foreground: 'hsl(var(--muted-foreground) / <alpha-value>)'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
					foreground: 'hsl(var(--accent-foreground) / <alpha-value>)'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
					foreground: 'hsl(var(--popover-foreground) / <alpha-value>)'
				},
				card: {
					DEFAULT: 'hsl(var(--card) / <alpha-value>)',
					foreground: 'hsl(var(--card-foreground) / <alpha-value>)'
				},
				success: {
					DEFAULT: 'hsl(var(--success) / <alpha-value>)',
					foreground: 'hsl(var(--success-foreground) / <alpha-value>)'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning) / <alpha-value>)',
					foreground: 'hsl(var(--warning-foreground) / <alpha-value>)'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				sans: ['Inter Variable', 'Inter', ...fontFamily.sans],
				serif: ['Source Serif Pro', 'Georgia', 'serif'],
				mono: ['JetBrains Mono', ...fontFamily.mono]
			},
			// Add scaling transitions for smoother responsive changes
			transitionProperty: {
				sizing: 'width, height, margin, padding'
			}
		}
	},
	plugins: [
		// Add your existing plugins here
	]
};

export default config;

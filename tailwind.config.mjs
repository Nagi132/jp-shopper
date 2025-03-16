/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ["class"],
	content: [
	  "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
	  "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
	  "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
	  extend: {
		colors: {
		  // Original color scheme
		  background: 'hsl(var(--background))',
		  foreground: 'hsl(var(--foreground))',
		  card: {
			DEFAULT: 'hsl(var(--card))',
			foreground: 'hsl(var(--card-foreground))'
		  },
		  popover: {
			DEFAULT: 'hsl(var(--popover))',
			foreground: 'hsl(var(--popover-foreground))'
		  },
		  primary: {
			DEFAULT: 'hsl(var(--primary))',
			foreground: 'hsl(var(--primary-foreground))'
		  },
		  secondary: {
			DEFAULT: 'hsl(var(--secondary))',
			foreground: 'hsl(var(--secondary-foreground))'
		  },
		  muted: {
			DEFAULT: 'hsl(var(--muted))',
			foreground: 'hsl(var(--muted-foreground))'
		  },
		  accent: {
			DEFAULT: 'hsl(var(--accent))',
			foreground: 'hsl(var(--accent-foreground))'
		  },
		  destructive: {
			DEFAULT: 'hsl(var(--destructive))',
			foreground: 'hsl(var(--destructive-foreground))'
		  },
		  border: 'hsl(var(--border))',
		  input: 'hsl(var(--input))',
		  ring: 'hsl(var(--ring))',
		  chart: {
			'1': 'hsl(var(--chart-1))',
			'2': 'hsl(var(--chart-2))',
			'3': 'hsl(var(--chart-3))',
			'4': 'hsl(var(--chart-4))',
			'5': 'hsl(var(--chart-5))'
		  },
		  
		  // Retro theme colors
		  'retro-purple': '#C999F8',
		  'retro-purple-light': '#D8B5FF',
		  'retro-cyan': '#00FFFF',
		  'retro-cyan-dark': '#00CCCC',
		  'win98': {
			'gray': '#C0C0C0',
			'teal': '#008080',
			'blue': '#000080',
			'darkgray': '#808080',
			'lightgray': '#D3D3D3'
		  }
		},
		borderRadius: {
		  lg: 'var(--radius)',
		  md: 'calc(var(--radius) - 2px)',
		  sm: 'calc(var(--radius) - 4px)'
		},
		
		// Add fonts with Futura Cyrillic
		fontFamily: {
		  sans: ['var(--font-sans)', 'sans-serif'],
		  'futura': ['Futura Cyrillic', 'sans-serif'],
		  'futura-light': ['Futura Cyrillic Light', 'sans-serif'],
		  'futura-medium': ['Futura Cyrillic Medium', 'sans-serif'],
		  'futura-bold': ['Futura Cyrillic Bold', 'sans-serif'],
		  'ms-sans': ['MS Sans Serif', 'Tahoma', 'sans-serif'],
		},
		
		// Animations
		animation: {
		  'marquee': 'marquee 20s linear infinite',
		  'blink': 'blink 1s step-end infinite',
		  'scan': 'scan 2s linear infinite',
		},
		keyframes: {
		  marquee: {
			'0%': { transform: 'translateX(100%)' },
			'100%': { transform: 'translateX(-100%)' },
		  },
		  blink: {
			'0%, 100%': { opacity: 1 },
			'50%': { opacity: 0 },
		  },
		  scan: {
			'0%': { transform: 'translateY(-100%)' },
			'100%': { transform: 'translateY(100%)' },
		  },
		},
		
		// Retro effects
		backgroundImage: {
		  'crt-lines': 'linear-gradient(0deg, rgba(0, 0, 0, 0.1) 50%, transparent 50%)',
		  'win98-gradient': 'linear-gradient(90deg, #C999F8, #D8B5FF)',
		},
		boxShadow: {
		  'win98-inset': 'inset -1px -1px #fff, inset 1px 1px #000',
		  'win98-outset': 'inset 1px 1px #fff, inset -1px -1px #000',
		},
		backdropFilter: {
		  'scanline': 'contrast(1.1) brightness(1.1)',
		}
	  },
	},
	plugins: [require("tailwindcss-animate")],
  };
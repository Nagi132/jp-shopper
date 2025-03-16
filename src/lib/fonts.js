import localFont from 'next/font/local';

// Load Futura Cyrillic fonts from public directory
export const futuraCyrillicLight = localFont({ 
  src: '../../public/fonts/FuturaCyrillicLight.ttf',
  variable: '--font-futura-light',
  display: 'swap'
});

export const futuraCyrillicMedium = localFont({ 
  src: '../../public/fonts/FuturaCyrillicMedium.ttf',
  variable: '--font-futura-medium',
  display: 'swap'
});

export const futuraCyrillicBold = localFont({ 
  src: '../../public/fonts/FuturaCyrillicBold.ttf',
  variable: '--font-futura-bold',
  display: 'swap'
});
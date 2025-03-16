import './globals.css';
import { futuraCyrillicLight, futuraCyrillicMedium, futuraCyrillicBold } from '@/lib/fonts';

export const metadata = {
  title: 'Japan Personal Shopper Marketplace',
  description: 'Connect with personal shoppers in Japan for exclusive items',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${futuraCyrillicMedium.variable} ${futuraCyrillicLight.variable} ${futuraCyrillicBold.variable}`}>
      <body className="min-h-screen bg-gray-50 font-futura-medium">
        {children}
      </body>
    </html>
  );
}
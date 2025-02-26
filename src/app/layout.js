import './globals.css'
export const metadata = {
  title: 'Japan Personal Shopper Marketplace',
  description: 'Connect with personal shoppers in Japan for exclusive items',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
}
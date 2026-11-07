import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import CartDrawer from '@/components/CartDrawer';
import Script from 'next/script';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Maktabah An Noor — Books That Illuminate The Heart',
  description: "Spreading beneficial knowledge — Qurans, Islamic Books & Essentials. Shipping worldwide.",
  openGraph: {
    title: 'Maktabah An Noor — Books That Illuminate The Heart',
    description: "Spreading beneficial knowledge — Qurans, Islamic Books & Essentials. Shipping worldwide.",
    siteName: 'Maktabah An Noor',
    url: SITE_URL,
    images: [
      {
        url: `${SITE_URL}/logo.png`,
        width: 800,
        height: 800,
        alt: 'Maktabah An Noor',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Maktabah An Noor — Books That Illuminate The Heart',
    description: "Spreading beneficial knowledge — Qurans, Islamic Books & Essentials. Shipping worldwide.",
    images: [`${SITE_URL}/logo.png`],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:wght@300;400;500&family=Noto+Naskh+Arabic:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-MNNFJ7BT');
            `,
          }}
        />
        {/* Google Tag Manager (noscript fallback) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MNNFJ7BT"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              {children}
              <CartDrawer />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

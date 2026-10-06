import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import CartDrawer from '@/components/CartDrawer';

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

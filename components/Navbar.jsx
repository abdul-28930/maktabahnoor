'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';

export default function Navbar({ active = '' }) {
  const { cartCount, openCart } = useCart();

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-logo">
          <Image src="/logo.png" alt="Maktabah An Noor" width={48} height={48} style={{ height: 48, width: 'auto' }} />
          <div className="nav-logo-text">
            <div className="nav-logo-en">Maktabah An Noor</div>
            <span className="nav-logo-tag">Books That Illuminate The Heart</span>
          </div>
        </Link>

        <div className="nav-links">
          <Link href="/"      className={`nav-link${active === 'home'  ? ' active' : ''}`}>Home</Link>
          <Link href="/books" className={`nav-link${active === 'books' ? ' active' : ''}`}>All Books</Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Cart icon button */}
          <button
            className="nav-cart-btn"
            onClick={openCart}
            aria-label={`Open cart${cartCount > 0 ? ` (${cartCount} items)` : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {cartCount > 0 && (
              <span className="nav-cart-count" aria-hidden="true">{cartCount}</span>
            )}
          </button>

          <Link href="/books" className="nav-cta">Browse Collection →</Link>
        </div>
      </div>
    </nav>
  );
}

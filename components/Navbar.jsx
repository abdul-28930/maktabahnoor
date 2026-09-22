'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function Navbar({ active = '' }) {
  const { cartCount, openCart } = useCart();
  const { user, loading } = useAuth();

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
          <Link href="/"        className={`nav-link${active === 'home'    ? ' active' : ''}`}>Home</Link>
          <Link href="/books"   className={`nav-link${active === 'books'   ? ' active' : ''}`}>All Books</Link>
          <Link href="/bundles" className={`nav-link${active === 'bundles' ? ' active' : ''}`}>Bundles</Link>
          <Link href="/accessories" className={`nav-link${active === 'accessories' ? ' active' : ''}`}>Accessories</Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* User Account / Profile */}
          {!loading && (
            user ? (
              <Link
                href="/profile"
                className={`nav-link${active === 'profile' ? ' active' : ''}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 500 }}
                title={`Logged in as ${user.username}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>{user.username}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className={`nav-link${active === 'login' ? ' active' : ''}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                <span>Sign In</span>
              </Link>
            )
          )}

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

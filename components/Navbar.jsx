'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BooksNavDropdown from './BooksNavDropdown';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

export default function Navbar({ active = '' }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { cartCount, openCart } = useCart();

  return (
    <>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px clamp(20px, 5vw, 72px)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          background: 'rgba(250, 249, 245, 0.85)',
          borderBottom: '1px solid rgba(27, 67, 50, 0.07)',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Brand Logo & Name */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            textDecoration: 'none',
            color: '#1b4332',
            flexShrink: 0,
          }}
        >
          <Image
            src="/logo.png"
            alt="Maktabah An Noor"
            width={38}
            height={38}
            style={{ height: 38, width: 'auto' }}
            priority
          />
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '.5px',
            }}
          >
            Maktabah An Noor
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div
          className="hp-nav-links"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 22,
          }}
        >
          {/* 1. Home */}
          <Link
            href="/"
            className="hp-nlink"
            style={{
              textDecoration: 'none',
              color: active === 'home' ? '#1b4332' : '#6b6460',
              fontSize: 14,
              letterSpacing: '.3px',
              fontWeight: active === 'home' ? 500 : 400,
              transition: 'color .2s ease',
            }}
          >
            Home
          </Link>

          {/* 2. About */}
          <Link
            href="/#about"
            className="hp-nlink"
            style={{
              textDecoration: 'none',
              color: active === 'about' ? '#1b4332' : '#6b6460',
              fontSize: 14,
              letterSpacing: '.3px',
              fontWeight: active === 'about' ? 500 : 400,
              transition: 'color .2s ease',
            }}
          >
            About
          </Link>

          {/* 3. Books (with category dropdown) */}
          <BooksNavDropdown
            className="hp-nlink"
            active={active === 'books'}
            style={{
              fontSize: 14,
              color: active === 'books' ? '#1b4332' : '#6b6460',
              fontWeight: active === 'books' ? 500 : 400,
            }}
          />

          {/* 4. Bundles */}
          <Link
            href="/bundles"
            className="hp-nlink"
            style={{
              textDecoration: 'none',
              color: active === 'bundles' ? '#1b4332' : '#6b6460',
              fontSize: 14,
              letterSpacing: '.3px',
              fontWeight: active === 'bundles' ? 500 : 400,
              transition: 'color .2s ease',
            }}
          >
            Bundles
          </Link>

          {/* 5. Accessories */}
          <Link
            href="/accessories"
            className="hp-nlink"
            style={{
              textDecoration: 'none',
              color: active === 'accessories' ? '#1b4332' : '#6b6460',
              fontSize: 14,
              letterSpacing: '.3px',
              fontWeight: active === 'accessories' ? 500 : 400,
              transition: 'color .2s ease',
            }}
          >
            Accessories
          </Link>

          {/* 6. Clothing */}
          <Link
            href="/clothing"
            className="hp-nlink"
            style={{
              textDecoration: 'none',
              color: active === 'clothing' ? '#1b4332' : '#6b6460',
              fontSize: 14,
              letterSpacing: '.3px',
              fontWeight: active === 'clothing' ? 500 : 400,
              transition: 'color .2s ease',
            }}
          >
            Clothing
          </Link>

          {/* 7. Wishlist */}
          <Link
            href="/wishlist"
            className="hp-nlink"
            style={{
              textDecoration: 'none',
              color: active === 'wishlist' ? '#1b4332' : '#6b6460',
              fontSize: 14,
              letterSpacing: '.3px',
              fontWeight: active === 'wishlist' ? 500 : 400,
              transition: 'color .2s ease',
            }}
          >
            ♡ Wishlist
          </Link>

          {/* 8. Sign-in / User's account (their name if logged in) */}
          {!authLoading && (
            user ? (
              <Link
                href="/profile"
                className="hp-nlink"
                style={{
                  textDecoration: 'none',
                  color: active === 'profile' ? '#1b4332' : '#6b6460',
                  fontSize: 14,
                  letterSpacing: '.3px',
                  fontWeight: active === 'profile' ? 500 : 400,
                  transition: 'color .2s ease',
                }}
                title="Account Preferences & Settings"
              >
                {user.username}
              </Link>
            ) : (
              <Link
                href="/login"
                className="hp-nlink"
                style={{
                  textDecoration: 'none',
                  color: active === 'login' ? '#1b4332' : '#6b6460',
                  fontSize: 14,
                  letterSpacing: '.3px',
                  fontWeight: active === 'login' ? 500 : 400,
                  transition: 'color .2s ease',
                }}
              >
                Sign In
              </Link>
            )
          )}

          {/* 9. Cart (only if the user is signed in) */}
          {!authLoading && user && (
            <button
              type="button"
              onClick={openCart}
              className="hp-nlink"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                letterSpacing: '.3px',
                color: '#6b6460',
                cursor: 'pointer',
                fontWeight: 400,
                transition: 'color .2s ease',
              }}
              aria-label={`Open shopping cart${cartCount > 0 ? ` (${cartCount} items)` : ''}`}
            >
              Cart{cartCount > 0 ? ` (${cartCount})` : ''}
            </button>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="hp-hamburger"
          onClick={() => setMobileMenuOpen(o => !o)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            border: '1.5px solid rgba(27,67,50,0.15)',
            borderRadius: 10,
            background: 'transparent',
            color: '#1b4332',
            cursor: 'pointer',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {mobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div
          className="hp-hamburger"
          style={{
            display: 'flex',
            position: 'fixed',
            top: '70px',
            left: 0,
            right: 0,
            zIndex: 39,
            flexDirection: 'column',
            background: '#faf9f5',
            borderBottom: '1px solid rgba(27,67,50,0.1)',
            boxShadow: '0 12px 32px rgba(27,67,50,0.12)',
            padding: '14px clamp(20px,5vw,72px) 24px',
            gap: 2,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              textDecoration: 'none',
              color: '#1b4332',
              fontSize: 15,
              padding: '10px 4px',
              borderBottom: '1px solid rgba(27,67,50,0.06)',
            }}
          >
            Home
          </Link>
          <Link
            href="/#about"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              textDecoration: 'none',
              color: '#1b4332',
              fontSize: 15,
              padding: '10px 4px',
              borderBottom: '1px solid rgba(27,67,50,0.06)',
            }}
          >
            About
          </Link>
          <Link
            href="/books"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              textDecoration: 'none',
              color: '#1b4332',
              fontSize: 15,
              padding: '10px 4px',
              borderBottom: '1px solid rgba(27,67,50,0.06)',
            }}
          >
            Books
          </Link>
          <Link
            href="/bundles"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              textDecoration: 'none',
              color: '#1b4332',
              fontSize: 15,
              padding: '10px 4px',
              borderBottom: '1px solid rgba(27,67,50,0.06)',
            }}
          >
            Bundles
          </Link>
          <Link
            href="/accessories"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              textDecoration: 'none',
              color: '#1b4332',
              fontSize: 15,
              padding: '10px 4px',
              borderBottom: '1px solid rgba(27,67,50,0.06)',
            }}
          >
            Accessories
          </Link>
          <Link
            href="/clothing"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              textDecoration: 'none',
              color: '#1b4332',
              fontSize: 15,
              padding: '10px 4px',
              borderBottom: '1px solid rgba(27,67,50,0.06)',
            }}
          >
            Clothing
          </Link>
          <Link
            href="/wishlist"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              textDecoration: 'none',
              color: '#1b4332',
              fontSize: 15,
              padding: '10px 4px',
              borderBottom: '1px solid rgba(27,67,50,0.06)',
            }}
          >
            ♡ Wishlist
          </Link>

          {/* Account Profile or Sign In */}
          {!authLoading && (
            user ? (
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  textDecoration: 'none',
                  color: '#1b4332',
                  fontSize: 15,
                  padding: '10px 4px',
                  fontWeight: 600,
                  borderBottom: '1px solid rgba(27,67,50,0.06)',
                }}
              >
                👤 {user.username} (Account Preferences)
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  textDecoration: 'none',
                  color: '#1b4332',
                  fontSize: 15,
                  padding: '10px 4px',
                  fontWeight: 600,
                  borderBottom: '1px solid rgba(27,67,50,0.06)',
                }}
              >
                Sign In
              </Link>
            )
          )}

          {/* Cart in mobile menu (only if signed in) */}
          {!authLoading && user && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                openCart();
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: '10px 4px',
                textAlign: 'left',
                color: '#1b4332',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              🛒 Cart{cartCount > 0 ? ` (${cartCount})` : ''}
            </button>
          )}
        </div>
      )}
    </>
  );
}

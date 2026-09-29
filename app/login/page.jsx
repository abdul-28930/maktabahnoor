'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import PageBackground from '@/components/PageBackground';
import { useAuth } from '@/context/AuthContext';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/';
  const urlMode = searchParams.get('mode');

  const { user, loading: authLoading, login, register } = useAuth();

  const [mode, setMode] = useState(urlMode === 'register' ? 'register' : 'login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync mode if query param changes
  useEffect(() => {
    if (urlMode === 'register' || urlMode === 'login') {
      setMode(urlMode);
    }
  }, [urlMode]);

  // Auto-fill remembered username if saved previously
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('mn_remember_username');
      if (savedUser) {
        setUsername(savedUser);
      } else {
        // Also check document cookie
        const match = document.cookie.match(/(?:^|; )mn_remember_username=([^;]*)/);
        if (match && match[1]) {
          setUsername(decodeURIComponent(match[1]));
        }
      }
    } catch {}
  }, []);

  // If already logged in, redirect away
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirectTarget.startsWith('/') && redirectTarget !== '/login' ? redirectTarget : '/');
    }
  }, [user, authLoading, router, redirectTarget]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim();
    if (!cleanUser) {
      setError('Please enter your username.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (mode === 'register') {
      if (cleanUser.length < 3) {
        setError('Username must be at least 3 characters.');
        return;
      }
      if (cleanUser.length > 30) {
        setError('Username must be 30 characters or fewer.');
        return;
      }
      if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUser)) {
        setError('Username can only contain letters, numbers, underscores, and dots.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(cleanUser, password, rememberMe);
      } else {
        await register(cleanUser, password, rememberMe);
      }
      router.replace(redirectTarget.startsWith('/') && redirectTarget !== '/login' ? redirectTarget : '/');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  function handleContinueAsGuest(e) {
    if (e) e.preventDefault();
    try {
      // Set 24-hour guest cookie so visitor can browse without login
      document.cookie = 'mn_guest=1; path=/; max-age=86400; SameSite=Lax';
    } catch {}
    const target = redirectTarget.startsWith('/') && redirectTarget !== '/login' ? redirectTarget : '/';
    // Navigate via guest auth endpoint to ensure cookie header is fully registered
    window.location.href = `/api/user/auth/guest?redirect=${encodeURIComponent(target)}`;
  }

  return (
    <div style={{
      position: 'relative',
      zIndex: 1,
      background: '#fff',
      border: '1px solid rgba(27,67,50,0.12)',
      borderRadius: 24,
      padding: 'clamp(28px, 6vw, 44px) clamp(20px, 5vw, 36px)',
      maxWidth: 440,
      width: '100%',
      boxShadow: '0 24px 70px rgba(27,67,50,0.09)',
      textAlign: 'center',
    }}>
      {/* Brand logo & title */}
      <Link href="/" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', marginBottom: 18 }}>
        <Image src="/logo.png" alt="Maktabah An Noor" width={68} height={68} style={{ height: 68, width: 'auto', marginBottom: 10 }} priority />
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 600, color: '#1b4332', letterSpacing: '.5px' }}>
          Maktabah An Noor
        </span>
        <span style={{ fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#b8965a', fontWeight: 500, marginTop: 2 }}>
          Books That Illuminate The Heart
        </span>
      </Link>

      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: '#1b4332', margin: '0 0 6px' }}>
        {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
      </h1>
      <p style={{ fontSize: 13, color: '#6b6460', margin: '0 0 22px', lineHeight: 1.5, fontWeight: 300 }}>
        {mode === 'login'
          ? 'Sign in to access your curated library, track your orders, and sync your reading wishlist.'
          : 'Create your reader account to personalize your book recommendations, track shipments, and save favorites.'}
      </p>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: 'rgba(27,67,50,0.06)',
        borderRadius: 14,
        padding: 4,
        marginBottom: 22,
      }}>
        <button
          type="button"
          onClick={() => { setMode('login'); setError(''); }}
          style={{
            flex: 1,
            padding: '10px 0',
            borderRadius: 10,
            border: 'none',
            background: mode === 'login' ? '#fff' : 'transparent',
            color: mode === 'login' ? '#1b4332' : '#6b6460',
            fontWeight: mode === 'login' ? 600 : 400,
            fontSize: 13,
            cursor: 'pointer',
            boxShadow: mode === 'login' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            transition: 'all .2s',
          }}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => { setMode('register'); setError(''); }}
          style={{
            flex: 1,
            padding: '10px 0',
            borderRadius: 10,
            border: 'none',
            background: mode === 'register' ? '#fff' : 'transparent',
            color: mode === 'register' ? '#1b4332' : '#6b6460',
            fontWeight: mode === 'register' ? 600 : 400,
            fontSize: 13,
            cursor: 'pointer',
            boxShadow: mode === 'register' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            transition: 'all .2s',
          }}
        >
          Create Account
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
        {/* Username */}
        <div>
          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 500, color: '#1b4332', marginBottom: 6 }}>
            <span>Username</span>
            <span style={{ fontSize: 11, color: '#a09890', fontWeight: 400 }}>Required</span>
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#b8965a', fontSize: 14, pointerEvents: 'none' }}>
              @
            </span>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. zayd_ahmad"
              autoComplete="username"
              required
              style={{
                width: '100%',
                padding: '12px 14px 12px 34px',
                background: '#faf9f5',
                border: '1.5px solid rgba(27,67,50,0.15)',
                borderRadius: 12,
                fontSize: 14,
                fontFamily: "'DM Sans', sans-serif",
                color: '#1a1712',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color .15s',
              }}
              onFocus={e => e.target.style.borderColor = '#1b4332'}
              onBlur={e => e.target.style.borderColor = 'rgba(27,67,50,0.15)'}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 500, color: '#1b4332', marginBottom: 6 }}>
            <span>Password</span>
            <span style={{ fontSize: 11, color: '#a09890', fontWeight: 400 }}>{mode === 'register' ? 'Min 6 characters' : ''}</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              style={{
                width: '100%',
                padding: '12px 42px 12px 14px',
                background: '#faf9f5',
                border: '1.5px solid rgba(27,67,50,0.15)',
                borderRadius: 12,
                fontSize: 14,
                fontFamily: "'DM Sans', sans-serif",
                color: '#1a1712',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color .15s',
              }}
              onFocus={e => e.target.style.borderColor = '#1b4332'}
              onBlur={e => e.target.style.borderColor = 'rgba(27,67,50,0.15)'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                padding: 6,
                cursor: 'pointer',
                color: '#8b837c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Confirm password on registration */}
        {mode === 'register' && (
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#1b4332', marginBottom: 6 }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 14px',
                  background: '#faf9f5',
                  border: '1.5px solid rgba(27,67,50,0.15)',
                  borderRadius: 12,
                  fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif",
                  color: '#1a1712',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color .15s',
                }}
                onFocus={e => e.target.style.borderColor = '#1b4332'}
                onBlur={e => e.target.style.borderColor = 'rgba(27,67,50,0.15)'}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(p => !p)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: 6,
                  cursor: 'pointer',
                  color: '#8b837c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Remember my login checkbox */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 2, userSelect: 'none' }}>
          <input
            id="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={e => setRememberMe(e.target.checked)}
            style={{
              marginTop: 3,
              width: 16,
              height: 16,
              accentColor: '#1b4332',
              cursor: 'pointer',
            }}
          />
          <label htmlFor="rememberMe" style={{ fontSize: 13, color: '#3d3834', cursor: 'pointer', lineHeight: 1.4 }}>
            <span style={{ fontWeight: 500, color: '#1b4332' }}>Remember my login</span>
            <span style={{ display: 'block', fontSize: 11.5, color: '#888078' }}>
              Keeps you logged in so you don&apos;t have to enter your credentials on every visit.
            </span>
          </label>
        </div>

        {/* Error notification */}
        {error && (
          <div style={{
            fontSize: 12.5,
            color: '#b91c1c',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 10,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: '#1b4332',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '.4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: 6,
            opacity: loading ? 0.75 : 1,
            transition: 'background .2s, transform .1s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(27,67,50,0.22)',
          }}
          onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.99)'; }}
          onMouseUp={e => { if (!loading) e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {loading ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                <path d="M12 2a10 10 0 0 1 10 10"/>
              </svg>
              <span>{mode === 'login' ? 'Signing In…' : 'Creating Account…'}</span>
            </>
          ) : (
            <span>{mode === 'login' ? 'Sign In →' : 'Create Account →'}</span>
          )}
        </button>

        {/* Alternate mode toggle link */}
        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: '#6b6460' }}>
          {mode === 'login' ? (
            <span>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                style={{ color: '#1b4332', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
              >
                Create Account
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                style={{ color: '#1b4332', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
              >
                Sign In
              </button>
            </span>
          )}
        </div>
      </form>

      {/* Guest bypass divider */}
      <div style={{
        margin: '22px 0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(27,67,50,0.08)' }} />
        <span style={{ fontSize: 11, color: '#a09890', textTransform: 'uppercase', letterSpacing: '1px' }}>or</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(27,67,50,0.08)' }} />
      </div>

      <a
        href={`/api/user/auth/guest?redirect=${encodeURIComponent(redirectTarget.startsWith('/') && redirectTarget !== '/login' ? redirectTarget : '/')}`}
        onClick={handleContinueAsGuest}
        style={{
          width: '100%',
          padding: '12px',
          background: 'transparent',
          border: '1.5px solid rgba(27,67,50,0.18)',
          borderRadius: 12,
          fontSize: 13,
          color: '#1b4332',
          cursor: 'pointer',
          fontWeight: 500,
          textDecoration: 'none',
          boxSizing: 'border-box',
          transition: 'background .15s, border-color .15s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(27,67,50,0.04)';
          e.currentTarget.style.borderColor = '#1b4332';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'rgba(27,67,50,0.18)';
        }}
      >
        <span>Explore Collection as Guest</span>
        <span style={{ fontSize: 14 }}>→</span>
      </a>

      <div style={{ marginTop: 22, fontSize: 12, color: '#a09890' }}>
        <span>Secure authentication powered by encrypted sessions.</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      background: '#faf9f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <PageBackground />
      <Suspense fallback={
        <div style={{ textAlign: 'center', color: '#1b4332', fontFamily: "'DM Sans', sans-serif" }}>
          Loading login portal…
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}

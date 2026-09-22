'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import PageBackground from '@/components/PageBackground';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, register } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to profile
  if (user) {
    router.push('/profile');
    return null;
  }

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
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
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
        await login(cleanUser, password);
      } else {
        await register(cleanUser, password);
      }
      router.push('/profile');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#faf9f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'DM Sans', sans-serif" }}>
      <PageBackground />

      <div style={{
        position: 'relative',
        zIndex: 1,
        background: '#fff',
        border: '1px solid rgba(27,67,50,0.1)',
        borderRadius: 24,
        padding: '44px 36px',
        maxWidth: 420,
        width: '100%',
        boxShadow: '0 20px 60px rgba(27,67,50,0.08)',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'inline-block', marginBottom: 16 }}>
          <Image src="/logo.png" alt="Maktabah An Noor" width={64} height={64} style={{ height: 64, width: 'auto', margin: '0 auto' }} />
        </Link>

        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600, color: '#1b4332', margin: '0 0 6px' }}>
          {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
        </h1>
        <p style={{ fontSize: 13, color: '#6b6460', margin: '0 0 24px', lineHeight: 1.5 }}>
          {mode === 'login'
            ? 'Sign in to access your saved cart, wishlist, and profile.'
            : 'Join to save your reading wishlist, view orders, and personalize your recommendations.'}
        </p>

        {/* Tab switch */}
        <div style={{
          display: 'flex',
          background: 'rgba(27,67,50,0.06)',
          borderRadius: 14,
          padding: 4,
          marginBottom: 24,
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
              boxShadow: mode === 'login' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
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
              boxShadow: mode === 'register' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              transition: 'all .2s',
            }}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#1b4332', marginBottom: 6 }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. zayd_ahmad"
              autoComplete="username"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                background: '#faf9f5',
                border: '1.5px solid rgba(27,67,50,0.14)',
                borderRadius: 12,
                fontSize: 14,
                fontFamily: "'DM Sans', sans-serif",
                color: '#1a1712',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#1b4332', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                background: '#faf9f5',
                border: '1.5px solid rgba(27,67,50,0.14)',
                borderRadius: 12,
                fontSize: 14,
                fontFamily: "'DM Sans', sans-serif",
                color: '#1a1712',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#1b4332', marginBottom: 6 }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: '#faf9f5',
                  border: '1.5px solid rgba(27,67,50,0.14)',
                  borderRadius: 12,
                  fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif",
                  color: '#1a1712',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {error && (
            <div style={{
              fontSize: 12,
              color: '#dc2626',
              background: 'rgba(220, 38, 38, 0.08)',
              border: '1px solid rgba(220, 38, 38, 0.2)',
              borderRadius: 8,
              padding: '10px 12px',
              marginTop: 4,
            }}>
              {error}
            </div>
          )}

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
              fontWeight: 500,
              cursor: 'pointer',
              marginTop: 8,
              opacity: loading ? 0.7 : 1,
              transition: 'background .2s',
            }}
          >
            {loading
              ? (mode === 'login' ? 'Signing In…' : 'Creating Account…')
              : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div style={{ marginTop: 24, fontSize: 12, color: '#a09890' }}>
          <Link href="/" style={{ color: '#1b4332', textDecoration: 'none' }}>
            ← Back to Maktabah An Noor
          </Link>
        </div>
      </div>
    </div>
  );
}

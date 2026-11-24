'use client';
import { useState, useRef, useEffect } from 'react';
import { useCurrency } from '@/context/CurrencyContext';

export default function CurrencySelector({ isMobile = false }) {
  const { currency, currencies, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [open]);

  // Display label: e.g. "USD $" or "INR ₹"
  const currentLabel = `${currency?.code || 'INR'} ${currency?.symbol || '₹'}`;

  if (isMobile) {
    return (
      <div style={{ padding: '12px 4px', borderBottom: '1px solid rgba(27,67,50,0.06)' }}>
        <div style={{ fontSize: 11, color: '#8c827a', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 6 }}>
          Select Currency
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {currencies.map(c => {
            const isSel = c.code === currency?.code;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => setCurrency(c.code)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: isSel ? '1.5px solid #1b4332' : '1px solid rgba(27,67,50,0.15)',
                  background: isSel ? '#1b4332' : '#fff',
                  color: isSel ? '#fff' : '#1a1712',
                  fontSize: 13,
                  fontWeight: isSel ? 600 : 400,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <span>{c.code}</span>
                <span style={{ color: isSel ? '#e8dfd8' : '#b8965a', fontWeight: 600 }}>{c.symbol}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={`Current currency: ${currentLabel}. Click to change.`}
        aria-expanded={open}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 20,
          background: open ? 'rgba(27,67,50,0.1)' : 'rgba(27,67,50,0.06)',
          border: '1.5px solid rgba(27,67,50,0.14)',
          color: '#1b4332',
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '.3px',
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          transition: 'all .15s ease',
        }}
      >
        <span>{currentLabel}</span>
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transition: 'transform .2s ease',
            transform: open ? 'rotate(180deg)' : 'none',
          }}
        >
          <path d="M1 1l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            minWidth: 175,
            maxHeight: 280,
            overflowY: 'auto',
            background: '#ffffff',
            borderRadius: 14,
            border: '1px solid rgba(27,67,50,0.12)',
            boxShadow: '0 12px 32px rgba(27,67,50,0.14)',
            padding: '6px',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <div style={{ padding: '6px 10px 4px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.8px', color: '#8c827a', fontWeight: 600 }}>
            Currency
          </div>
          {currencies.map(c => {
            const isSel = c.code === currency?.code;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  setCurrency(c.code);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: 'none',
                  background: isSel ? 'rgba(27,67,50,0.08)' : 'transparent',
                  color: isSel ? '#1b4332' : '#2b2623',
                  fontSize: 13,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'background .15s',
                }}
                onMouseEnter={e => {
                  if (!isSel) e.currentTarget.style.background = 'rgba(27,67,50,0.04)';
                }}
                onMouseLeave={e => {
                  if (!isSel) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: isSel ? 700 : 500 }}>{c.code}</span>
                  <span style={{ color: '#b8965a', fontWeight: 600 }}>{c.symbol}</span>
                </div>
                <span style={{ fontSize: 11, color: '#8c827a', maxWidth: 85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.name}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

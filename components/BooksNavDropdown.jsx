'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function BooksNavDropdown({ active, className, style }) {
  const [open, setOpen] = useState(false);
  const [cats, setCats] = useState([]);

  useEffect(() => {
    fetch('/api/taxonomy')
      .then(r => r.json())
      .then(d => setCats(d.taxonomy?.categories || []))
      .catch(() => {});
  }, []);

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href="/books"
        className={className}
        style={{
          textDecoration: 'none',
          fontSize: 14,
          letterSpacing: '.3px',
          color: active ? '#1b4332' : '#6b6460',
          fontWeight: active ? 500 : 400,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          transition: 'color .2s ease',
          ...style,
        }}
      >
        <span>Books</span>
        <span style={{ fontSize: 10, marginTop: 1, color: 'inherit' }}>
          {open ? '▴' : '▾'}
        </span>
      </Link>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 8,
            background: '#fff',
            border: '1px solid rgba(27,67,50,0.1)',
            borderRadius: 12,
            boxShadow: '0 12px 30px rgba(27,67,50,0.12)',
            padding: 6,
            minWidth: 190,
            zIndex: 60,
            animation: 'pageFade .15s ease',
          }}
        >
          <Link
            href="/books"
            style={{
              display: 'block',
              padding: '8px 12px',
              borderRadius: 8,
              textDecoration: 'none',
              color: '#1b4332',
              fontSize: 13,
              fontWeight: 500,
              borderBottom: cats.length > 0 ? '1px solid rgba(27,67,50,0.06)' : 'none',
              marginBottom: cats.length > 0 ? 4 : 0,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(27,67,50,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            All Books →
          </Link>
          {cats.map(c => (
            <Link
              key={c}
              href={`/books?category=${encodeURIComponent(c)}`}
              style={{
                display: 'block',
                padding: '8px 12px',
                borderRadius: 8,
                textDecoration: 'none',
                color: '#1a1712',
                fontSize: 13,
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(27,67,50,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {c}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

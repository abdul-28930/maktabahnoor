'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import PageBackground from '@/components/PageBackground';
import { WA_NUMBER } from '@/lib/constants';

export default function OrderPage({ params }) {
  const { ref } = params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${ref}`)
      .then(r => r.json())
      .then(d => { if (d.order) setOrder(d.order); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ref]);

  const items = order?.items || [];
  const subtotal = order?.total || items.reduce((s, i) => s + (Number(i.price || i.mrp || 0) * (i.qty || 1)), 0);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#faf9f5', fontFamily: "'DM Sans', sans-serif" }}>
      <PageBackground subtle />
      <Navbar />

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 560, margin: '0 auto', padding: '32px clamp(16px, 4vw, 24px) 80px' }}>

        {/* Order request badge â€” right aligned like reference */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, marginBottom: 16, color: '#1b4332', fontSize: 13 }}>
          <span>ðŸ”’</span>
          <span style={{ fontWeight: 500 }}>Order request</span>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          border: '1px solid rgba(27,67,50,0.1)',
          boxShadow: '0 2px 16px rgba(27,67,50,0.06)',
          padding: '24px 20px',
        }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: '#1a1712', margin: '0 0 20px' }}>
            Order summary
          </h1>

          {loading ? (
            <p style={{ color: '#a09890', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>Loadingâ€¦</p>
          ) : (
            <>
              {/* Items */}
              {items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ position: 'relative', width: 44, height: 58, flexShrink: 0 }}>
                    {item.coverUrl ? (
                      <img
                        src={item.coverUrl}
                        alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6, border: '1px solid rgba(27,67,50,0.1)' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', borderRadius: 6, background: '#1b4332', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#b8965a', fontSize: 10, fontFamily: "'Noto Naskh Arabic', serif" }}>ÙƒØªØ§Ø¨</span>
                      </div>
                    )}
                    <span style={{
                      position: 'absolute', top: -7, left: -7,
                      background: '#1b4332', color: '#fff',
                      fontSize: 10, fontWeight: 700,
                      width: 18, height: 18, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                    }}>
                      {item.qty || 1}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 14, color: '#1a1712', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1712', flexShrink: 0 }}>
                      â‚¹{((Number(item.price || item.mrp || 0)) * (item.qty || 1)).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}

              <div style={{ height: 1, background: 'rgba(27,67,50,0.08)', margin: '16px 0' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b6460' }}>
                  <span>Subtotal</span>
                  <span style={{ color: '#1a1712' }}>â‚¹{Number(subtotal).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b6460' }}>
                  <span>Shipping</span>
                  <span style={{ color: '#2d6a4f' }}>Confirmed on WhatsApp</span>
                </div>
                {order?.pincode && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b6460' }}>
                    <span>Delivery Pincode</span>
                    <span style={{ color: '#1b4332', fontWeight: 500 }}>ðŸ“ {order.pincode}</span>
                  </div>
                )}
              </div>

              <div style={{ height: 1, background: 'rgba(27,67,50,0.08)', margin: '16px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1712' }}>Items total</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#1b4332' }}>â‚¹{Number(subtotal).toLocaleString('en-IN')}</span>
              </div>
            </>
          )}
        </div>

        <p style={{ fontSize: 12, color: '#a09890', textAlign: 'center', margin: '16px 0', lineHeight: 1.5 }}>
          Our team will contact you on WhatsApp to confirm shipping charges and share payment details.
        </p>

        <Link
          href={`https://wa.me/${WA_NUMBER}`}
          target="_blank"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '13px 20px', boxSizing: 'border-box',
            borderRadius: 12, background: '#1b4332', color: '#fff',
            fontSize: 14, fontWeight: 600, textDecoration: 'none',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Message on WhatsApp
        </Link>

        <Link href="/books" style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 13, color: '#a09890', textDecoration: 'none' }}>
          Continue shopping &rarr;
        </Link>
      </main>
    </div>
  );
}

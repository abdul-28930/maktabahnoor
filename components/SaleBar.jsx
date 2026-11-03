'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

function formatCountdown(endTime) {
  if (!endTime) return null;
  const target = new Date(endTime).getTime();
  if (isNaN(target)) return null;

  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return null; // Timer has ended

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  const pad = n => String(n).padStart(2, '0');

  if (days > 0) {
    return `${days}d ${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  }
  return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
}

export default function SaleBar({ initialData = null }) {
  const [saleBar, setSaleBar] = useState(initialData);
  const [timeLeft, setTimeLeft] = useState(() => (initialData?.endTime ? formatCountdown(initialData.endTime) : null));
  const [hasEnded, setHasEnded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/sale-bar?t=${Date.now()}`)
      .then(r => r.json())
      .then(d => {
        if (!isMounted) return;
        if (d?.saleBar) {
          setSaleBar(d.saleBar);
          if (d.saleBar.endTime) {
            const initial = formatCountdown(d.saleBar.endTime);
            if (!initial) {
              setHasEnded(true);
            } else {
              setTimeLeft(initial);
              setHasEnded(false);
            }
          }
        }
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!saleBar?.enabled || !saleBar?.endTime) return;

    const timer = setInterval(() => {
      const remaining = formatCountdown(saleBar.endTime);
      if (!remaining) {
        setHasEnded(true);
        setTimeLeft(null);
        clearInterval(timer);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [saleBar?.enabled, saleBar?.endTime]);

  // If sale bar is disabled or timer has reached 0, remove the entire bar
  if (!saleBar || !saleBar.enabled) return null;
  if (saleBar.endTime && hasEnded) return null;

  // If there's no text and no active timer, don't show empty bar
  if (!saleBar.text1 && !saleBar.text2 && !timeLeft) return null;

  const timerLabel = saleBar.timerLabel || 'Sale countdown';

  // Render a single iteration of the 3-box group
  const renderGroup = (keyPrefix) => (
    <div key={keyPrefix} style={{ display: 'inline-flex', alignItems: 'center' }}>
      {[0, 1, 2, 3].map((idx) => (
        <span
          key={`${keyPrefix}-${idx}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 16,
            padding: '0 28px',
          }}
        >
          {/* Box 1: Left Text */}
          {saleBar.text1 && (
            <span
              style={{
                color: '#faf9f5',
                fontSize: 12.5,
                fontWeight: 600,
                letterSpacing: '.4px',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {saleBar.text1}
            </span>
          )}

          {/* Separator */}
          <span style={{ color: '#b8965a', fontSize: 11, opacity: 0.9 }}>✦</span>

          {/* Box 2: Sale Countdown Timer */}
          {timeLeft && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(184, 150, 90, 0.16)',
                border: '1px solid rgba(212, 171, 112, 0.45)',
                borderRadius: 20,
                padding: '3px 14px',
                color: '#faf9f5',
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '.3px',
                boxShadow: '0 1px 6px rgba(0,0,0,0.12)',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#b8965a' }} />
              <span style={{ color: '#e8dfd8' }}>{timerLabel} :</span>
              <span
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontWeight: 700,
                  color: '#ffd166',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '.5px',
                }}
              >
                {timeLeft}
              </span>
            </span>
          )}

          {/* Separator */}
          {saleBar.text2 && (
            <>
              {timeLeft && <span style={{ color: '#b8965a', fontSize: 11, opacity: 0.9 }}>✦</span>}
              {/* Box 3: Right Text */}
              <span
                style={{
                  color: '#e8dfd8',
                  fontSize: 12.5,
                  fontWeight: 400,
                  letterSpacing: '.3px',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                {saleBar.text2}
              </span>
            </>
          )}

          {/* End divider */}
          <span style={{ color: '#b8965a', fontSize: 11, opacity: 0.9, marginLeft: 4 }}>✦</span>
        </span>
      ))}
    </div>
  );

  const content = (
    <div
      className="sale-bar-track"
      style={{
        display: 'flex',
        width: 'max-content',
        whiteSpace: 'nowrap',
        animation: 'saleMarqueeAnim 32s linear infinite',
      }}
    >
      {renderGroup('a')}
      {renderGroup('b')}
    </div>
  );

  return (
    <aside
      aria-label="Sale Announcement"
      style={{
        position: 'relative',
        zIndex: 35,
        background: '#1b4332',
        borderBottom: '1px solid rgba(184, 150, 90, 0.28)',
        borderTop: '1px solid rgba(27, 67, 50, 0.1)',
        overflow: 'hidden',
        padding: '9px 0',
        fontFamily: "'DM Sans', sans-serif",
        lineHeight: 1.4,
      }}
    >
      {saleBar.link ? (
        <Link
          href={saleBar.link}
          style={{
            textDecoration: 'none',
            display: 'block',
            cursor: 'pointer',
          }}
        >
          {content}
        </Link>
      ) : (
        content
      )}

      <style jsx global>{`
        @keyframes saleMarqueeAnim {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .sale-bar-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </aside>
  );
}

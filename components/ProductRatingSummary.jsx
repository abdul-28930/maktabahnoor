'use client';
import { useState, useEffect, useRef } from 'react';

// Fractional stars renderer supporting full, half, and fractional star fills
function FractionalStars({ rating = 0, size = 18, color = '#e59819', emptyColor = 'rgba(184,150,90,0.25)' }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(i => {
        const fill = Math.max(0, Math.min(1, rating - (i - 1)));
        return (
          <span
            key={i}
            style={{
              position: 'relative',
              display: 'inline-block',
              width: size,
              height: size,
              fontSize: size,
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            {/* Empty background star */}
            <span
              style={{
                color: emptyColor,
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ★
            </span>
            {/* Filled overlay */}
            {fill > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: `${fill * 100}%`,
                  height: '100%',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  color: color,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                ★
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

export default function ProductRatingSummary({ itemId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const closeTimerRef = useRef(null);
  const containerRef = useRef(null);

  function fetchReviews() {
    if (!itemId) return;
    fetch(`/api/reviews?itemId=${encodeURIComponent(itemId)}`)
      .then(r => r.json())
      .then(d => {
        setReviews(d.reviews || []);
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchReviews();

    function handleUpdate(e) {
      if (!e.detail?.itemId || e.detail.itemId === itemId) {
        fetchReviews();
      }
    }
    window.addEventListener('mn-review-added', handleUpdate);
    return () => window.removeEventListener('mn-review-added', handleUpdate);
  }, [itemId]);

  // Click outside listener for touchscreen / mobile
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const totalReviews = reviews.length;
  const ratingSum = reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0);
  const avgRating = totalReviews > 0 ? (ratingSum / totalReviews) : 0;
  const avgFormatted = totalReviews > 0 ? avgRating.toFixed(1) : '0.0';

  // Star breakdown calculation (5 down to 1)
  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    const star = Math.min(5, Math.max(1, Math.round(Number(r.rating))));
    if (starCounts[star] !== undefined) {
      starCounts[star]++;
    }
  });

  function handleMouseEnter() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsOpen(true);
  }

  function handleMouseLeave() {
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 220);
  }

  function scrollToReviews(e) {
    if (e) e.preventDefault();
    setIsOpen(false);
    const el = document.getElementById('reviews');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-block',
        marginBottom: 20,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Top Rating Row */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
        }}
      >
        {/* Rating Number (e.g. 4.5) */}
        <span
          onClick={() => setIsOpen(p => !p)}
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#e59819',
            fontFamily: "'DM Sans',sans-serif",
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          {avgFormatted}
        </span>

        {/* Stars */}
        <div
          onClick={() => setIsOpen(p => !p)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            cursor: 'pointer',
          }}
        >
          <FractionalStars rating={avgRating} size={18} />
          {/* Chevron indicator */}
          <span
            style={{
              fontSize: 10,
              color: '#8c827a',
              marginLeft: 3,
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform .2s ease',
              display: 'inline-block',
            }}
          >
            ▼
          </span>
        </div>

        {/* Number of reviews in brackets: ( 2,500 ) */}
        <button
          type="button"
          onClick={scrollToReviews}
          style={{
            background: 'none',
            border: 'none',
            padding: '2px 4px',
            color: '#1b4332',
            fontSize: 15,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: "'DM Sans',sans-serif",
            textDecoration: 'none',
            transition: 'color .15s',
            marginLeft: 2,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#b8965a';
            e.currentTarget.style.textDecoration = 'underline';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#1b4332';
            e.currentTarget.style.textDecoration = 'none';
          }}
          title="Jump to customer reviews"
        >
          (&nbsp;{totalReviews.toLocaleString('en-IN')}&nbsp;)
        </button>
      </div>

      {/* Amazon-style Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 12px)',
            left: 0,
            zIndex: 100,
            width: 320,
            maxWidth: 'calc(100vw - 36px)',
            background: '#ffffff',
            borderRadius: 14,
            border: '1px solid rgba(27,67,50,0.12)',
            boxShadow: '0 14px 40px rgba(0,0,0,0.14)',
            padding: '20px 22px 16px',
            fontFamily: "'DM Sans',sans-serif",
            boxSizing: 'border-box',
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Top Arrow Pointer */}
          <div
            style={{
              position: 'absolute',
              top: -7,
              left: 42,
              width: 12,
              height: 12,
              background: '#ffffff',
              borderLeft: '1px solid rgba(27,67,50,0.12)',
              borderTop: '1px solid rgba(27,67,50,0.12)',
              transform: 'rotate(45deg)',
            }}
          />

          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              color: '#8c827a',
              padding: 4,
              lineHeight: 1,
            }}
          >
            ✕
          </button>

          {/* Header: Stars + "X out of 5" */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <FractionalStars rating={avgRating} size={18} />
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1712' }}>
              {totalReviews > 0 ? `${avgFormatted} out of 5` : '0 out of 5'}
            </span>
          </div>

          {/* Subtitle: "X global ratings" */}
          <div style={{ fontSize: 12.5, color: '#6b6460', marginBottom: 18, fontWeight: 400 }}>
            {totalReviews.toLocaleString('en-IN')} {totalReviews === 1 ? 'customer review' : 'customer reviews'}
          </div>

          {/* Breakdown bars for 5, 4, 3, 2, 1 stars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {[5, 4, 3, 2, 1].map(stars => {
              const count = starCounts[stars] || 0;
              const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

              return (
                <div
                  key={stars}
                  onClick={scrollToReviews}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  title={`${stars} star: ${count} (${pct}%)`}
                >
                  {/* Left Star Label */}
                  <span
                    style={{
                      width: 44,
                      fontSize: 13,
                      color: '#1b4332',
                      textAlign: 'left',
                      flexShrink: 0,
                    }}
                  >
                    {stars} star
                  </span>

                  {/* Middle Progress Bar */}
                  <div
                    style={{
                      flex: 1,
                      height: 18,
                      background: '#f0f2f2',
                      borderRadius: 6,
                      border: '1px solid rgba(0,0,0,0.1)',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg, #ff9900, #de7921)',
                        borderRadius: pct === 100 ? 5 : '5px 0 0 5px',
                        transition: 'width .3s ease',
                      }}
                    />
                  </div>

                  {/* Right Percentage */}
                  <span
                    style={{
                      width: 38,
                      fontSize: 13,
                      color: '#1b4332',
                      textAlign: 'right',
                      fontWeight: 500,
                      flexShrink: 0,
                    }}
                  >
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Footer Divider & Link */}
          <div
            style={{
              marginTop: 18,
              paddingTop: 14,
              borderTop: '1px solid rgba(27,67,50,0.08)',
              textAlign: 'center',
            }}
          >
            <button
              onClick={scrollToReviews}
              style={{
                background: 'none',
                border: 'none',
                color: '#b8965a',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'DM Sans',sans-serif",
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              {totalReviews > 0 ? 'See customer reviews ›' : 'Write a customer review ›'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

// Star rating display (read-only)
function Stars({ rating, size = 16, interactive = false, onRate }) {
  const [hover, setHover] = useState(0);
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span
          key={s}
          onClick={interactive ? () => onRate(s) : undefined}
          onMouseEnter={interactive ? () => setHover(s) : undefined}
          onMouseLeave={interactive ? () => setHover(0) : undefined}
          style={{
            fontSize: size,
            color: s <= (hover || rating) ? '#b8965a' : 'rgba(184,150,90,0.25)',
            cursor: interactive ? 'pointer' : 'default',
            transition: 'color .15s',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────
// itemId: "book:{slug}" | "accessory:{id}" | "clothing:{id}"
// itemType: "book" | "accessory" | "clothing"
export default function ReviewSection({ itemId, itemType }) {
  const { user, loading: authLoading } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Form state
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [guestName, setGuestName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState(null); // { text, type }
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!itemId) return;
    setReviewsLoading(true);
    fetch(`/api/reviews?itemId=${encodeURIComponent(itemId)}`)
      .then(r => r.json())
      .then(d => setReviews(d.reviews || []))
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [itemId]);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const wordCount = reviewText.trim().split(/\s+/).filter(Boolean).length;
  const overLimit = wordCount > 300;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rating) { setSubmitMsg({ text: 'Please select a star rating.', type: 'error' }); return; }
    if (!reviewText.trim()) { setSubmitMsg({ text: 'Please write a review.', type: 'error' }); return; }
    if (overLimit) { setSubmitMsg({ text: 'Review must be 300 words or fewer.', type: 'error' }); return; }
    if (!user && !guestName.trim()) { setSubmitMsg({ text: 'Please enter your name.', type: 'error' }); return; }
    if (!user && !purchaseDate) { setSubmitMsg({ text: 'Please enter your date of purchase.', type: 'error' }); return; }

    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          itemType,
          rating,
          review: reviewText.trim(),
          name: guestName.trim() || undefined,
          purchaseDate: purchaseDate || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit.');
      setSubmitMsg({ text: data.message, type: 'success' });
      setRating(0); setReviewText(''); setGuestName(''); setPurchaseDate('');
      setShowForm(false);
      // Reload reviews if auto-approved
      if (data.status === 'approved') {
        const r2 = await fetch(`/api/reviews?itemId=${encodeURIComponent(itemId)}`);
        const d2 = await r2.json();
        setReviews(d2.reviews || []);
      }
    } catch (err) {
      setSubmitMsg({ text: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  const S = {
    section: { marginTop: 64, paddingTop: 48, borderTop: '1px solid rgba(27,67,50,0.08)' },
    heading: { fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 500, color: '#1b4332', margin: '0 0 4px' },
    subheading: { fontSize: 12, color: '#a09890', letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 28px', display: 'flex', alignItems: 'center', gap: 8 },
    reviewCard: { background: '#fff', borderRadius: 14, border: '1px solid rgba(27,67,50,0.08)', padding: '20px 24px', boxShadow: '0 2px 10px rgba(27,67,50,0.04)' },
    reviewName: { fontWeight: 500, fontSize: 14, color: '#1a1712' },
    reviewDate: { fontSize: 11, color: '#a09890', marginLeft: 8 },
    reviewText: { fontSize: 14, color: '#4a453f', lineHeight: 1.7, margin: '10px 0 0', fontWeight: 300 },
    inputStyle: { width: '100%', padding: '11px 14px', background: '#faf9f5', border: '1.5px solid rgba(27,67,50,0.12)', borderRadius: 10, color: '#1a1712', fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: 'none', transition: 'border-color .2s', boxSizing: 'border-box' },
    label: { fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: '#b8965a', fontWeight: 500, marginBottom: 6, display: 'block' },
    submitBtn: { padding: '12px 28px', borderRadius: 30, border: 'none', background: '#1b4332', color: '#fff', fontSize: 13, fontWeight: 500, letterSpacing: 0.5, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'opacity .2s' },
    cancelBtn: { padding: '12px 20px', borderRadius: 30, border: '1.5px solid rgba(27,67,50,0.2)', background: 'transparent', color: '#1b4332', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" },
    writeBtn: { padding: '10px 24px', borderRadius: 30, border: '1.5px solid rgba(27,67,50,0.2)', background: '#fff', color: '#1b4332', fontSize: 12, fontWeight: 500, letterSpacing: 0.5, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s', textTransform: 'uppercase' },
  };

  return (
    <div style={S.section}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
        <div>
          <h2 style={S.heading}>Customer Reviews</h2>
          <div style={S.subheading}>
            <span style={{ width: 16, height: 1, background: '#b8965a', display: 'inline-block' }} />
            {reviews.length > 0
              ? <><Stars rating={Math.round(Number(avgRating))} size={13} /> &nbsp;{avgRating} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}</>
              : 'No reviews yet — be the first!'}
          </div>
        </div>
        {!showForm && (
          <button
            style={S.writeBtn}
            onClick={() => { setShowForm(true); setSubmitMsg(null); }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(27,67,50,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
          >
            ✦ Write a Review
          </button>
        )}
      </div>

      {/* Submit message (shown after closing form) */}
      {submitMsg && !showForm && (
        <div style={{
          marginBottom: 20, padding: '14px 20px', borderRadius: 12,
          background: submitMsg.type === 'success' ? 'rgba(45,106,79,0.07)' : 'rgba(220,38,38,0.07)',
          border: `1px solid ${submitMsg.type === 'success' ? 'rgba(45,106,79,0.2)' : 'rgba(220,38,38,0.2)'}`,
          color: submitMsg.type === 'success' ? '#2d6a4f' : '#dc2626', fontSize: 13,
        }}>
          {submitMsg.text}
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <div style={{ background: 'linear-gradient(135deg,rgba(27,67,50,0.03),rgba(184,150,90,0.03))', borderRadius: 16, border: '1px solid rgba(27,67,50,0.1)', padding: '28px 24px', marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#1b4332', marginBottom: 20 }}>Share your experience</div>

          {/* In-form message */}
          {submitMsg && (
            <div style={{
              marginBottom: 16, padding: '12px 16px', borderRadius: 10,
              background: submitMsg.type === 'success' ? 'rgba(45,106,79,0.08)' : 'rgba(220,38,38,0.08)',
              border: `1px solid ${submitMsg.type === 'success' ? 'rgba(45,106,79,0.2)' : 'rgba(220,38,38,0.2)'}`,
              color: submitMsg.type === 'success' ? '#2d6a4f' : '#dc2626', fontSize: 13,
            }}>
              {submitMsg.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Star rating */}
            <div style={{ marginBottom: 20 }}>
              <span style={S.label}>Your Rating *</span>
              <div style={{ marginTop: 4 }}>
                <Stars rating={rating} size={28} interactive onRate={setRating} />
              </div>
            </div>

            {/* Guest-only fields */}
            {!user && !authLoading && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={S.label}>Your Name *</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    placeholder="e.g. Abdullah"
                    maxLength={60}
                    style={S.inputStyle}
                    onFocus={e => e.target.style.borderColor = '#1b4332'}
                    onBlur={e => e.target.style.borderColor = 'rgba(27,67,50,0.12)'}
                  />
                </div>
                <div>
                  <label style={S.label}>Date of Purchase *</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={e => setPurchaseDate(e.target.value)}
                    max={new Date().toISOString().slice(0, 10)}
                    style={S.inputStyle}
                    onFocus={e => e.target.style.borderColor = '#1b4332'}
                    onBlur={e => e.target.style.borderColor = 'rgba(27,67,50,0.12)'}
                  />
                </div>
              </div>
            )}

            {user && (
              <div style={{ marginBottom: 16, fontSize: 12, color: '#6b6460', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(27,67,50,0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#1b4332', fontWeight: 600 }}>
                  {(user.name || user.username || '?')[0].toUpperCase()}
                </span>
                Posting as <strong style={{ color: '#1a1712' }}>&nbsp;{user.name || user.username}</strong>
              </div>
            )}

            {/* Review text */}
            <div style={{ marginBottom: 8 }}>
              <label style={S.label}>Your Review * (max 300 words)</label>
              <textarea
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="Tell others what you liked about this book, how it helped you, quality, etc."
                rows={4}
                style={{ ...S.inputStyle, resize: 'vertical', lineHeight: 1.65 }}
                onFocus={e => e.target.style.borderColor = '#1b4332'}
                onBlur={e => e.target.style.borderColor = 'rgba(27,67,50,0.12)'}
              />
              <div style={{ fontSize: 11, color: overLimit ? '#dc2626' : '#a09890', marginTop: 4, textAlign: 'right' }}>
                {wordCount} / 300 words{overLimit ? ' — too long' : ''}
              </div>
            </div>

            {!user && !authLoading && (
              <div style={{ fontSize: 11, color: '#a09890', marginBottom: 16, padding: '10px 14px', background: 'rgba(184,150,90,0.06)', borderRadius: 8, border: '1px solid rgba(184,150,90,0.15)', lineHeight: 1.6 }}>
                ✦ Reviews from unregistered users are verified by our team before they appear publicly.
                Only customers who have purchased this item can leave a review.
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                type="submit"
                disabled={submitting || overLimit}
                style={{ ...S.submitBtn, opacity: submitting || overLimit ? 0.6 : 1 }}
              >
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setSubmitMsg(null); }}
                style={S.cancelBtn}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews list */}
      {reviewsLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#a09890', fontSize: 13 }}>Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#a09890', fontSize: 13 }}>
          <div style={{ fontFamily: "'Noto Naskh Arabic',serif", fontSize: 48, color: 'rgba(27,67,50,0.07)', marginBottom: 12 }}>✦</div>
          No reviews yet. Be the first to share your thoughts!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {reviews.map(r => (
            <div key={r.id} style={S.reviewCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(27,67,50,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#1b4332', flexShrink: 0 }}>
                  {(r.reviewerName || '?')[0].toUpperCase()}
                </div>
                <span style={S.reviewName}>{r.reviewerName}</span>
                <span style={S.reviewDate}>{fmtDate(r.createdAt)}</span>
                <div style={{ marginLeft: 'auto' }}>
                  <Stars rating={r.rating} size={13} />
                </div>
              </div>
              <p style={S.reviewText}>{r.review}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';
import { useEffect, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import { WA_NUMBER } from '@/lib/constants';

const CAT_AR = {
  Aqeedah:'عقيدة', Fiqh:'فقه', Hadith:'حديث', Tafsir:'تفسير',
  Seerah:'سيرة', 'Manners & Character':'أخلاق', History:'تاريخ',
  'Arabic Language':'لغة', 'Dua & Dhikr':'دعاء', 'Quran & Tajweed':'قرآن', General:'عام',
};

const COVER_BG = 'linear-gradient(155deg,#2d6a4f 0%,#1b4332 100%)';

function buildWhatsAppMessage(items) {
  const lines = items.map((item, i) =>
    `${i + 1}. ${item.title}${item.titleAr ? ` (${item.titleAr})` : ''}${item.qty > 1 ? ` × ${item.qty}` : ''}`
  ).join('\n');

  return (
    `Assalamualaikum! 🌙\n\n` +
    `I would like to order the following from *Maktabah An Noor*:\n\n` +
    `${lines}\n\n` +
    `Please confirm availability and share the total. JazakAllahu Khairan! 📚`
  );
}

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeFromCart, updateQty, clearCart, cartCount } = useCart();
  const drawerRef = useRef(null);

  /* Close on Escape key */
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeCart(); };
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, closeCart]);

  /* Lock body scroll when open */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleWhatsApp = () => {
    const msg = buildWhatsAppMessage(items);
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noreferrer');
  };

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className={`cart-backdrop${isOpen ? ' cart-backdrop--open' : ''}`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* ── Drawer panel ── */}
      <aside
        ref={drawerRef}
        className={`cart-drawer${isOpen ? ' cart-drawer--open' : ''}`}
        aria-label="Shopping cart"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="cart-header">
          <div className="cart-header-left">
            <span className="cart-title">Your Cart</span>
            {cartCount > 0 && (
              <span className="cart-count-badge">{cartCount}</span>
            )}
          </div>
          <button className="cart-close" onClick={closeCart} aria-label="Close cart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div className="cart-divider" />

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-ar">كتاب</div>
            <div className="cart-empty-title">Your cart is empty</div>
            <p className="cart-empty-sub">Browse our collection and add books you'd like to order.</p>
            <button className="cart-browse-btn" onClick={closeCart}>Browse Collection →</button>
          </div>
        ) : (
          <>
            {/* Items list */}
            <div className="cart-items">
              {items.map((item) => {
                const ar = CAT_AR[item.category] || 'كتاب';
                return (
                  <div key={item.slug} className="cart-item">
                    {/* Cover */}
                    <div className="cart-item-cover">
                      {item.coverUrl ? (
                        <img src={item.coverUrl} alt={item.title} />
                      ) : (
                        <div className="cart-item-cover-ph" style={{ background: COVER_BG }}>
                          <span className="cart-item-cover-ar">{ar}</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="cart-item-info">
                      <div className="cart-item-title">{item.title}</div>
                      {item.titleAr && (
                        <div className="cart-item-title-ar" dir="rtl">{item.titleAr}</div>
                      )}
                      <div className="cart-item-author">{item.author}</div>

                      {/* Price */}
                      {(item.price || item.mrp) && (
                        <div className="cart-item-price">
                          {item.price
                            ? <span className="cart-item-price-main">₹{Number(item.price).toLocaleString('en-IN')}</span>
                            : <span className="cart-item-price-main">₹{Number(item.mrp).toLocaleString('en-IN')}</span>
                          }
                          {item.mrp && item.price && item.mrp > item.price && (
                            <span className="cart-item-price-mrp">₹{Number(item.mrp).toLocaleString('en-IN')}</span>
                          )}
                        </div>
                      )}

                      {/* Qty + Remove */}
                      <div className="cart-item-actions">
                        <div className="cart-qty">
                          <button
                            className="cart-qty-btn"
                            onClick={() => updateQty(item.slug, item.qty - 1)}
                            disabled={item.qty <= 1}
                            aria-label="Decrease quantity"
                          >−</button>
                          <span className="cart-qty-val">{item.qty}</span>
                          <button
                            className="cart-qty-btn"
                            onClick={() => updateQty(item.slug, item.qty + 1)}
                            aria-label="Increase quantity"
                          >+</button>
                        </div>
                        <button
                          className="cart-remove"
                          onClick={() => removeFromCart(item.slug)}
                          aria-label="Remove item"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                          </svg>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="cart-footer">
              {/* Summary note */}
              <div className="cart-summary-note">
                <span className="cart-summary-icon">✦</span>
                <span>{cartCount} item{cartCount !== 1 ? 's' : ''} ready to order</span>
              </div>

              {/* WhatsApp CTA */}
              <button className="cart-wa-btn" onClick={handleWhatsApp}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Order via WhatsApp
              </button>

              {/* Clear cart */}
              <button className="cart-clear" onClick={clearCart}>
                Clear cart
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

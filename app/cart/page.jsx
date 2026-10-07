'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import PageBackground from '@/components/PageBackground';
import { WA_NUMBER } from '@/lib/constants';

const COVER_BG = 'linear-gradient(155deg,#2d6a4f 0%,#1b4332 100%)';

function buildOrderRef() {
  return `MAN-${Date.now().toString(36).slice(-5).toUpperCase()}`;
}

function buildWhatsAppMessage(items, orderRef, coupon, delivery) {
  const lines = items.map((item, i) =>
    `${i + 1}. ${item.type === 'bundle' ? '📦 ' : ''}${item.title}${item.qty > 1 ? ` × ${item.qty}` : ''}`
  ).join('\n');

  const subtotal = items.reduce((sum, i) => sum + (Number(i.price || i.mrp || 0) * i.qty), 0);
  const total = coupon ? Math.max(0, subtotal - coupon.discount) : subtotal;

  return (
    `Assalamualaikum! 🌙\n\n` +
    `I would like to order the following from *Maktabah An Noor*:\n\n` +
    `${lines}\n\n` +
    (subtotal > 0 ? `Subtotal: ₹${subtotal.toLocaleString('en-IN')}\n` : '') +
    (coupon ? `Coupon *${coupon.code}* applied: -₹${coupon.discount.toLocaleString('en-IN')}\nEstimated items total: ₹${total.toLocaleString('en-IN')}\n` : '') +
    `\n*Delivery Details:*\n` +
    `Name: ${delivery.name}\n` +
    `Phone: ${delivery.phone}\n` +
    `Address: ${delivery.address}\n` +
    `City: ${delivery.city}\n` +
    `State: ${delivery.state}\n` +
    `Country: ${delivery.country}\n` +
    `Pincode: ${delivery.pincode}\n` +
    `\nOrder ref: *${orderRef}*\n\n` +
    `_Note: Shipping charges are applicable and will be calculated & confirmed via WhatsApp before payment._\n\n` +
    `Please confirm availability, shipping charges, and total amount to pay. JazakAllahu Khairan! 📚`
  );
}

const FIELD = {
  width: '100%',
  padding: '11px 14px',
  background: '#fff',
  border: '1.5px solid rgba(27,67,50,0.15)',
  borderRadius: 10,
  fontSize: 14,
  color: '#1a1712',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: "'DM Sans', sans-serif",
};

export default function CartPage() {
  const { items, removeFromCart, updateQty, clearCart, cartCount } = useCart();
  const { user, updateProfile } = useAuth();
  const router = useRouter();

  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  // Delivery fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [ordering, setOrdering] = useState(false);

  // Auto-fill delivery details from logged-in user profile
  useEffect(() => {
    if (user) {
      if (user.name)     setName(user.name);
      if (user.phone)    setPhone(user.phone);
      if (user.address)  setAddress(user.address);
      if (user.country)  setCountry(user.country);
      if (user.state)    setState(user.state);
      if (user.city)     setCity(user.city);
      if (user.pincode)  setPincode(user.pincode);
    }
  }, [user]);

  const subtotal = items.reduce((sum, i) => sum + (Number(i.price || i.mrp || 0) * i.qty), 0);
  const discounted = coupon ? Math.max(0, subtotal - coupon.discount) : subtotal;

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setCheckingCoupon(true); setCouponError('');
    try {
      const r = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, subtotal }),
      });
      const d = await r.json();
      if (!d.valid) { setCouponError(d.error || 'Invalid coupon.'); setCoupon(null); return; }
      setCoupon(d);
    } catch { setCouponError('Something went wrong. Try again.'); }
    finally { setCheckingCoupon(false); }
  }
  function removeCoupon() { setCoupon(null); setCouponCode(''); setCouponError(''); }

  function validate() {
    const errors = {};
    if (!name.trim())    errors.name    = 'Full name is required.';
    if (!phone.trim())   errors.phone   = 'Phone number is required.';
    if (!address.trim()) errors.address = 'Address is required.';
    if (!country.trim()) errors.country = 'Country is required.';
    if (!state.trim())   errors.state   = 'State is required.';
    if (!city.trim())    errors.city    = 'City is required.';
    if (!pincode.trim()) errors.pincode = 'Pincode is required.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleWhatsApp() {
    if (!validate()) return;
    setOrdering(true);

    const delivery = {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      country: country.trim(),
      state: state.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
    };

    const orderRef = buildOrderRef();
    const msg = buildWhatsAppMessage(items, orderRef, coupon, delivery);
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noreferrer');

    // Save delivery details to profile for logged-in users
    if (user) {
      try {
        await updateProfile({
          name:    delivery.name,
          phone:   delivery.phone,
          address: delivery.address,
          country: delivery.country,
          state:   delivery.state,
          city:    delivery.city,
          pincode: delivery.pincode,
        });
      } catch {}
    }

    // Await stock reservation + order logging so the order is in Redis
    // before we navigate to the order page.
    await fetch('/api/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderRef,
        delivery,
        coupon: coupon ? { code: coupon.code, discount: coupon.discount } : null,
        items: items.map(i => ({
          slug: i.slug, type: i.type, bundleId: i.bundleId,
          coverUrl: i.coverUrl, author: i.author,
          title: i.title, price: i.price, mrp: i.mrp, qty: i.qty,
        })),
      }),
    }).catch(() => {});

    clearCart();
    removeCoupon();
    setOrdering(false);
    router.push(`/order/${orderRef}`);
  }

  // ─── Styles helpers ───────────────────────────────────────────────
  const card = {
    background: '#fff',
    border: '1px solid rgba(27,67,50,0.08)',
    borderRadius: 20,
    padding: 28,
    boxShadow: '0 4px 16px rgba(27,67,50,0.04)',
  };

  const label = {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    color: '#1b4332',
    marginBottom: 6,
  };

  function fieldStyle(key) {
    return { ...FIELD, borderColor: fieldErrors[key] ? '#dc2626' : 'rgba(27,67,50,0.15)' };
  }

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#faf9f5', fontFamily: "'DM Sans', sans-serif" }}>
      <PageBackground subtle />
      <Navbar active="cart" />

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '40px clamp(16px,5vw,48px) 100px' }}>

        {/* Page header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 10, letterSpacing: '2.5px', textTransform: 'uppercase', color: '#b8965a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 16, height: 1, background: '#b8965a', display: 'inline-block' }} />Shopping Cart
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px,4vw,40px)', fontWeight: 500, color: '#1b4332', margin: 0 }}>
            Your Cart {cartCount > 0 && <span style={{ fontSize: '0.55em', color: '#b8965a', verticalAlign: 'middle' }}>({cartCount} item{cartCount !== 1 ? 's' : ''})</span>}
          </h1>
        </div>

        {items.length === 0 ? (
          /* ── Empty state ── */
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ fontFamily: "'Noto Naskh Arabic', serif", fontSize: 80, color: 'rgba(27,67,50,0.07)', marginBottom: 20 }}>كتاب</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: '#1b4332', marginBottom: 10 }}>Your cart is empty</h2>
            <p style={{ color: '#6b6460', fontSize: 14, marginBottom: 28 }}>Browse our collection and add items you'd like to order.</p>
            <Link href="/books" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1b4332', color: '#fff', padding: '14px 28px', borderRadius: 40, fontSize: 13 }}>
              Browse Books →
            </Link>
          </div>
        ) : (
          <div className="cart-page-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>

            {/* ── Left: Items list ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map(item => (
                <div key={item.slug} style={{ ...card, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 18 }}>
                  {/* Cover */}
                  <div style={{ width: 70, height: 98, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: COVER_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.coverUrl
                      ? <img src={item.coverUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                      : <span style={{ fontFamily: "'Noto Naskh Arabic', serif", fontSize: 22, color: '#d4ab70' }}>ك</span>
                    }
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                      {item.type === 'bundle' && (
                        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#b8965a', background: 'rgba(184,150,90,0.12)', border: '1px solid rgba(184,150,90,0.3)', borderRadius: 8, padding: '2px 7px', flexShrink: 0 }}>Bundle</span>
                      )}
                      <div style={{ fontSize: 15, color: '#1a1712', fontWeight: 500, lineHeight: 1.3 }}>{item.title}</div>
                    </div>
                    {item.author && <div style={{ fontSize: 12, color: '#a09890', marginBottom: 8 }}>{item.author}</div>}

                    {/* Price row */}
                    {(item.price || item.mrp) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: '#1b4332' }}>
                          ₹{Number(item.price || item.mrp).toLocaleString('en-IN')}
                        </span>
                        {item.mrp && item.price && item.mrp > item.price && (
                          <span style={{ fontSize: 12, color: '#a09890', textDecoration: 'line-through' }}>₹{Number(item.mrp).toLocaleString('en-IN')}</span>
                        )}
                        {item.qty > 1 && (
                          <span style={{ fontSize: 12, color: '#6b6460' }}>× {item.qty} = ₹{(Number(item.price || item.mrp) * item.qty).toLocaleString('en-IN')}</span>
                        )}
                      </div>
                    )}

                    {/* Qty controls + remove */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1.5px solid rgba(27,67,50,0.15)', borderRadius: 10, overflow: 'hidden' }}>
                        <button
                          onClick={() => { if (item.qty <= 1) removeFromCart(item.slug); else updateQty(item.slug, item.qty - 1); }}
                          style={{ width: 32, height: 32, background: 'none', border: 'none', fontSize: 18, color: '#1b4332', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          aria-label="Decrease quantity"
                        >−</button>
                        <span style={{ minWidth: 28, textAlign: 'center', fontSize: 14, fontWeight: 500, color: '#1a1712' }}>{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.slug, item.qty + 1)}
                          disabled={item.stockCount > 0 && item.qty >= item.stockCount}
                          style={{ width: 32, height: 32, background: 'none', border: 'none', fontSize: 18, color: '#1b4332', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: item.stockCount > 0 && item.qty >= item.stockCount ? 0.3 : 1 }}
                          aria-label="Increase quantity"
                        >+</button>
                      </div>
                      {item.stockCount > 0 && item.qty >= item.stockCount && (
                        <span style={{ fontSize: 11, color: '#b8965a' }}>Max {item.stockCount} available</span>
                      )}
                      <button
                        onClick={() => removeFromCart(item.slug)}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#a09890', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, transition: 'color .15s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                        onMouseLeave={e => e.currentTarget.style.color = '#a09890'}
                        aria-label="Remove item"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Clear cart */}
              <button onClick={clearCart} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', cursor: 'pointer', color: '#a09890', fontSize: 12, padding: '6px 4px', marginTop: 4 }}>
                Clear cart
              </button>
            </div>

            {/* ── Right: Order summary + delivery form ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Coupon */}
              <div style={card}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1b4332', marginBottom: 12 }}>Coupon Code</div>
                {coupon ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(45,106,79,0.07)', border: '1px solid rgba(45,106,79,0.2)', borderRadius: 10, fontSize: 13 }}>
                    <span style={{ color: '#2d6a4f' }}>✓ <b>{coupon.code}</b> — save ₹{coupon.discount.toLocaleString('en-IN')}</span>
                    <button onClick={removeCoupon} style={{ background: 'none', border: 'none', color: '#a09890', fontSize: 12, cursor: 'pointer', padding: 0 }}>Remove</button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        value={couponCode}
                        onChange={e => { setCouponCode(e.target.value); setCouponError(''); }}
                        onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                        placeholder="Enter coupon code"
                        style={{ ...FIELD, textTransform: 'uppercase', flex: 1 }}
                      />
                      <button onClick={applyCoupon} disabled={checkingCoupon || !couponCode.trim()}
                        style={{ padding: '0 16px', borderRadius: 10, border: '1.5px solid #1b4332', background: 'transparent', color: '#1b4332', fontSize: 12, cursor: 'pointer', opacity: checkingCoupon || !couponCode.trim() ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                        {checkingCoupon ? '…' : 'Apply'}
                      </button>
                    </div>
                    {couponError && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 6 }}>{couponError}</div>}
                  </>
                )}
              </div>

              {/* Price summary */}
              <div style={card}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1b4332', marginBottom: 14 }}>Order Summary</div>
                {coupon && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b6460', marginBottom: 6 }}>
                    <span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {coupon && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#2d6a4f', marginBottom: 6 }}>
                    <span>Discount</span><span>−₹{coupon.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 600, color: '#1a1712', paddingTop: coupon ? 8 : 0, borderTop: coupon ? '1px solid rgba(27,67,50,0.08)' : 'none' }}>
                  <span>{coupon ? 'Estimated Total' : 'Subtotal'}</span>
                  <span>₹{discounted.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ fontSize: 11, color: '#a09890', marginTop: 8 }}>
                  🚚 Shipping calculated & confirmed via WhatsApp before payment.
                </div>
              </div>

              {/* Delivery details form */}
              <div style={card}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1b4332', marginBottom: 16 }}>
                  Delivery Details
                  {user && <span style={{ fontSize: 11, color: '#b8965a', fontWeight: 400, marginLeft: 8 }}>Auto-filled from your profile</span>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  <div>
                    <label style={label}>Full Name <span style={{ color: '#dc2626' }}>*</span></label>
                    <input value={name} onChange={e => { setName(e.target.value); setFieldErrors(p => ({ ...p, name: '' })); }}
                      placeholder="e.g. Zayd Ahmad" style={fieldStyle('name')} />
                    {fieldErrors.name && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>{fieldErrors.name}</div>}
                  </div>

                  <div>
                    <label style={label}>Phone Number <span style={{ color: '#dc2626' }}>*</span></label>
                    <input type="tel" value={phone} onChange={e => { setPhone(e.target.value); setFieldErrors(p => ({ ...p, phone: '' })); }}
                      placeholder="e.g. +91 98765 43210" style={fieldStyle('phone')} />
                    {fieldErrors.phone && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>{fieldErrors.phone}</div>}
                  </div>

                  <div>
                    <label style={label}>Address <span style={{ color: '#dc2626' }}>*</span></label>
                    <textarea value={address} onChange={e => { setAddress(e.target.value); setFieldErrors(p => ({ ...p, address: '' })); }}
                      placeholder="House / Flat no., Street, Area" rows={2}
                      style={{ ...fieldStyle('address'), resize: 'vertical', lineHeight: 1.5 }} />
                    {fieldErrors.address && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>{fieldErrors.address}</div>}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={label}>City <span style={{ color: '#dc2626' }}>*</span></label>
                      <input value={city} onChange={e => { setCity(e.target.value); setFieldErrors(p => ({ ...p, city: '' })); }}
                        placeholder="e.g. Chennai" style={fieldStyle('city')} />
                      {fieldErrors.city && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>{fieldErrors.city}</div>}
                    </div>
                    <div>
                      <label style={label}>Pincode <span style={{ color: '#dc2626' }}>*</span></label>
                      <input value={pincode} onChange={e => { setPincode(e.target.value.replace(/\D/g, '')); setFieldErrors(p => ({ ...p, pincode: '' })); }}
                        placeholder="e.g. 600001" maxLength={10} style={fieldStyle('pincode')} />
                      {fieldErrors.pincode && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>{fieldErrors.pincode}</div>}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={label}>State <span style={{ color: '#dc2626' }}>*</span></label>
                      <input value={state} onChange={e => { setState(e.target.value); setFieldErrors(p => ({ ...p, state: '' })); }}
                        placeholder="e.g. Tamil Nadu" style={fieldStyle('state')} />
                      {fieldErrors.state && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>{fieldErrors.state}</div>}
                    </div>
                    <div>
                      <label style={label}>Country <span style={{ color: '#dc2626' }}>*</span></label>
                      <input value={country} onChange={e => { setCountry(e.target.value); setFieldErrors(p => ({ ...p, country: '' })); }}
                        placeholder="e.g. India" style={fieldStyle('country')} />
                      {fieldErrors.country && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>{fieldErrors.country}</div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* WhatsApp CTA */}
              <button
                onClick={handleWhatsApp}
                disabled={ordering}
                style={{
                  width: '100%', padding: '16px 20px',
                  background: 'linear-gradient(135deg,#25d366,#128c7e)',
                  color: '#fff', border: 'none', borderRadius: 14,
                  fontSize: 15, fontWeight: 600,
                  cursor: ordering ? 'not-allowed' : 'pointer',
                  opacity: ordering ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: '0 4px 16px rgba(37,211,102,0.3)',
                  transition: 'opacity .2s, transform .15s',
                }}
                onMouseEnter={e => { if (!ordering) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                {ordering ? 'Opening WhatsApp…' : 'Order via WhatsApp'}
              </button>

              {!user && (
                <p style={{ fontSize: 12, color: '#a09890', textAlign: 'center', lineHeight: 1.5 }}>
                  <Link href="/login" style={{ color: '#1b4332', fontWeight: 500 }}>Sign in</Link> to auto-save your delivery details for future orders.
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      <style>{`
        @media (max-width: 760px) {
          .cart-page-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

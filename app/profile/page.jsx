'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import PageBackground from '@/components/PageBackground';
import { useAuth } from '@/context/AuthContext';
import { DEFAULT_CATEGORIES } from '@/lib/constants';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, updateProfile, logout } = useAuth();

  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [selectedCats, setSelectedCats] = useState([]);
  const [availableCats, setAvailableCats] = useState(DEFAULT_CATEGORIES);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [pwMsg, setPwMsg] = useState({ text: '', type: '' });

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load user data into form
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setPhone(user.phone || '');
      setWhatsapp(user.whatsapp || '');
      setSelectedCats(user.interestedCategories || []);
    }
  }, [user]);

  // Fetch available categories
  useEffect(() => {
    fetch('/api/taxonomy')
      .then(r => r.json())
      .then(d => {
        if (d.taxonomy?.categories) setAvailableCats(d.taxonomy.categories);
      })
      .catch(() => {});
  }, []);

  // Fetch order history
  useEffect(() => {
    if (!user) return;
    setOrdersLoading(true);
    fetch('/api/user/orders')
      .then(r => r.json())
      .then(d => setOrders(Array.isArray(d.orders) ? d.orders : []))
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, [user]);

  function toggleCategory(cat) {
    setSelectedCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setProfileMsg({ text: '', type: '' });
    setSavingProfile(true);
    try {
      await updateProfile({
        username: username.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        interestedCategories: selectedCats,
      });
      setProfileMsg({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      setProfileMsg({ text: err.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwMsg({ text: '', type: '' });

    if (!currentPw) {
      setPwMsg({ text: 'Please enter your current password.', type: 'error' });
      return;
    }
    if (newPw.length < 6) {
      setPwMsg({ text: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    setSavingPw(true);
    try {
      await updateProfile({
        currentPassword: currentPw,
        newPassword: newPw,
      });
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setPwMsg({ text: 'Password changed successfully!', type: 'success' });
    } catch (err) {
      setPwMsg({ text: err.message || 'Failed to change password.', type: 'error' });
    } finally {
      setSavingPw(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
        <p style={{ color: '#a09890', fontSize: 14 }}>Loading profile…</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#faf9f5', fontFamily: "'DM Sans', sans-serif" }}>
      <PageBackground subtle />
      <Navbar active="profile" />

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 860, margin: '0 auto', padding: '40px clamp(16px, 4vw, 32px) 80px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 600, color: '#1b4332', margin: 0 }}>
              My Profile
            </h1>
            <p style={{ fontSize: 14, color: '#6b6460', margin: '4px 0 0' }}>
              Manage your account credentials, contact information, and reading preferences.
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              await logout();
              router.push('/');
            }}
            style={{
              padding: '9px 18px',
              borderRadius: 20,
              border: '1.5px solid rgba(180,60,60,0.3)',
              background: 'transparent',
              color: '#b44',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {/* Personal Info & Contact Form */}
          <div style={{ background: '#fff', border: '1px solid rgba(27,67,50,0.08)', borderRadius: 20, padding: 28, boxShadow: '0 4px 16px rgba(27,67,50,0.04)' }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: '#1b4332', margin: '0 0 18px' }}>
              Account &amp; Contact Info
            </h2>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#1b4332', marginBottom: 6 }}>
                  Username <span style={{ color: '#a09890', fontWeight: 400 }}>(Must be unique)</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: '#faf9f5',
                    border: '1.5px solid rgba(27,67,50,0.12)',
                    borderRadius: 10,
                    fontSize: 14,
                    color: '#1a1712',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#1b4332', marginBottom: 6 }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: '#faf9f5',
                    border: '1.5px solid rgba(27,67,50,0.12)',
                    borderRadius: 10,
                    fontSize: 14,
                    color: '#1a1712',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#1b4332', marginBottom: 6 }}>
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: '#faf9f5',
                    border: '1.5px solid rgba(27,67,50,0.12)',
                    borderRadius: 10,
                    fontSize: 14,
                    color: '#1a1712',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Book Category Interests */}
              <div style={{ marginTop: 8 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#1b4332', marginBottom: 8 }}>
                  Book Categories I am Interested In
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {availableCats.map(cat => {
                    const sel = selectedCats.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 20,
                          fontSize: 12,
                          border: `1.5px solid ${sel ? '#1b4332' : 'rgba(27,67,50,0.14)'}`,
                          background: sel ? '#1b4332' : 'transparent',
                          color: sel ? '#fff' : '#6b6460',
                          cursor: 'pointer',
                          transition: 'all .2s',
                        }}
                      >
                        {sel ? '✓ ' : '+ '}{cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {profileMsg.text && (
                <div style={{
                  fontSize: 12,
                  padding: '9px 12px',
                  borderRadius: 8,
                  color: profileMsg.type === 'success' ? '#2d6a4f' : '#dc2626',
                  background: profileMsg.type === 'success' ? 'rgba(45,106,79,0.08)' : 'rgba(220,38,38,0.08)',
                  border: `1px solid ${profileMsg.type === 'success' ? 'rgba(45,106,79,0.2)' : 'rgba(220,38,38,0.2)'}`,
                }}>
                  {profileMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={savingProfile}
                style={{
                  padding: '12px 20px',
                  background: '#1b4332',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  marginTop: 6,
                  opacity: savingProfile ? 0.7 : 1,
                }}
              >
                {savingProfile ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Change Password Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ background: '#fff', border: '1px solid rgba(27,67,50,0.08)', borderRadius: 20, padding: 28, boxShadow: '0 4px 16px rgba(27,67,50,0.04)' }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: '#1b4332', margin: '0 0 18px' }}>
                Change Password
              </h2>

              <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#1b4332', marginBottom: 6 }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: '#faf9f5',
                      border: '1.5px solid rgba(27,67,50,0.12)',
                      borderRadius: 10,
                      fontSize: 14,
                      color: '#1a1712',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#1b4332', marginBottom: 6 }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: '#faf9f5',
                      border: '1.5px solid rgba(27,67,50,0.12)',
                      borderRadius: 10,
                      fontSize: 14,
                      color: '#1a1712',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#1b4332', marginBottom: 6 }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: '#faf9f5',
                      border: '1.5px solid rgba(27,67,50,0.12)',
                      borderRadius: 10,
                      fontSize: 14,
                      color: '#1a1712',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {pwMsg.text && (
                  <div style={{
                    fontSize: 12,
                    padding: '9px 12px',
                    borderRadius: 8,
                    color: pwMsg.type === 'success' ? '#2d6a4f' : '#dc2626',
                    background: pwMsg.type === 'success' ? 'rgba(45,106,79,0.08)' : 'rgba(220,38,38,0.08)',
                    border: `1px solid ${pwMsg.type === 'success' ? 'rgba(45,106,79,0.2)' : 'rgba(220,38,38,0.2)'}`,
                  }}>
                    {pwMsg.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingPw}
                  style={{
                    padding: '12px 20px',
                    background: '#1b4332',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    marginTop: 6,
                    opacity: savingPw ? 0.7 : 1,
                  }}
                >
                  {savingPw ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            </div>

            {/* Order History Card */}
            <div style={{ background: '#fff', border: '1px solid rgba(27,67,50,0.08)', borderRadius: 20, padding: 28, boxShadow: '0 4px 16px rgba(27,67,50,0.04)' }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: '#1b4332', margin: '0 0 18px' }}>
                My Orders
              </h2>

              {ordersLoading ? (
                <p style={{ fontSize: 13, color: '#a09890' }}>Loading orders…</p>
              ) : orders.length === 0 ? (
                <p style={{ fontSize: 13, color: '#a09890' }}>
                  You haven't placed any orders yet.{' '}
                  <Link href="/books" style={{ color: '#1b4332', fontWeight: 500 }}>Browse books →</Link>
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {orders.map(order => (
                    <Link
                      key={order.orderRef}
                      href={`/order/${order.orderRef}`}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                        padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(27,67,50,0.1)',
                        textDecoration: 'none', color: '#1a1712',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>#{order.orderRef}</div>
                        <div style={{ fontSize: 12, color: '#a09890', marginTop: 2 }}>
                          {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''} · {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#1b4332' }}>₹{Number(order.total || 0).toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: 11, color: order.fulfilled ? '#2d6a4f' : '#b8965a', marginTop: 2 }}>
                          {order.fulfilled ? 'Fulfilled' : 'Pending'}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Links Card */}
            <div style={{ background: '#fff', border: '1px solid rgba(27,67,50,0.08)', borderRadius: 20, padding: 24, boxShadow: '0 4px 16px rgba(27,67,50,0.04)' }}>
              <div style={{ fontSize: 13, color: '#6b6460', lineHeight: 1.6 }}>
                💡 <b>Cloud Sync Active:</b> Any items added to your cart or saved to your wishlist will automatically be saved to your account.
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                <Link href="/books" style={{ fontSize: 12, color: '#1b4332', fontWeight: 500, textDecoration: 'none' }}>
                  Browse Books →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

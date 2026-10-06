'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import PageBackground from '@/components/PageBackground';
import Navbar from '@/components/Navbar';
import { renderDescription } from '@/components/FormattedDescription';
import ReviewSection from '@/components/ReviewSection';

export default function AccessoryPageClient() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const [related, setRelated] = useState([]);

  const { addAccessoryToCart, isInCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    fetch(`/api/accessories/${encodeURIComponent(slug)}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then(d => {
        if (d?.accessory) {
          setItem(d.accessory);
          if (d.accessory.variants?.length > 0) {
            setSelected(d.accessory.variants[0]);
          } else {
            setSelected(null);
          }
          setLoading(false);
        } else if (d?.error) {
          setNotFound(true);
          setLoading(false);
        }
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  // Fetch related accessories
  useEffect(() => {
    fetch('/api/accessories')
      .then(r => r.json())
      .then(d => {
        const others = (d.accessories || []).filter(a => a.id !== item?.id && a.slug !== item?.slug).slice(0, 4);
        setRelated(others);
      })
      .catch(() => {});
  }, [item?.id, item?.slug]);

  if (loading) {
    return (
      <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',fontFamily:"'DM Sans',sans-serif"}}>
        <PageBackground subtle/>
        <Navbar active="accessories" />
        <div style={{position:'relative',zIndex:1,display:'flex',alignItems:'center',justifyContent:'center',minHeight:'70vh',flexDirection:'column',gap:16}}>
          <div style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:64,color:'rgba(27,67,50,0.1)',animation:'pulseRays 2s ease-in-out infinite'}}>إكسسوار</div>
          <div style={{fontSize:13,color:'#a09890',letterSpacing:1}}>Loading…</div>
        </div>
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',fontFamily:"'DM Sans',sans-serif"}}>
        <PageBackground subtle/>
        <Navbar active="accessories" />
        <div style={{position:'relative',zIndex:1,textAlign:'center',padding:'100px 24px'}}>
          <div style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:80,color:'rgba(27,67,50,0.08)',marginBottom:20}}>إكسسوار</div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,color:'#1b4332',marginBottom:12}}>Accessory Not Found</h1>
          <p style={{color:'#6b6460',marginBottom:28}}>This item does not exist or may have been removed.</p>
          <Link href="/accessories" style={{textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8,background:'#1b4332',color:'#fff',padding:'14px 28px',borderRadius:40,fontSize:13}}>← Back to Accessories</Link>
        </div>
      </div>
    );
  }

  const hasVariants = item.variants?.length > 0;
  const effectiveStock = hasVariants ? (selected?.stockCount ?? 0) : item.stockCount;
  const soldOut = effectiveStock <= 0;
  const isLow = !soldOut && effectiveStock > 0 && effectiveStock <= 5;
  const cartSlug = `accessory:${item.id}${selected ? ':' + selected.id : ''}`;
  const inCart = isInCart(cartSlug);
  const wished = isWishlisted(item.slug || item.id);

  const discount = item.mrp && item.price && item.mrp > item.price
    ? Math.round((1 - item.price / item.mrp) * 100)
    : 0;

  function handleAddToCart() {
    if (soldOut) return;
    addAccessoryToCart(item, selected, qty);
    setQty(1);
  }

  function handleWishlist() {
    toggleWishlist({
      slug: item.slug || item.id,
      title: item.name,
      price: item.price,
      mrp: item.mrp,
      coverUrl: item.coverUrl,
      inStock: !soldOut,
      category: 'Accessory',
    });
  }

  return (
    <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',fontFamily:"'DM Sans',sans-serif",overflowX:'hidden'}}>
      <PageBackground subtle/>
      <Navbar active="accessories" />

      {/* BREADCRUMB */}
      <div style={{position:'relative',zIndex:1,padding:'20px clamp(20px,5vw,72px)',borderBottom:'1px solid rgba(27,67,50,0.06)'}}>
        <div style={{maxWidth:1200,margin:'0 auto',display:'flex',alignItems:'center',gap:10,fontSize:12,color:'#a09890',letterSpacing:.5,flexWrap:'wrap'}}>
          <Link href="/" style={{textDecoration:'none',color:'#a09890'}}>Home</Link>
          <span style={{color:'rgba(27,67,50,0.2)'}}>›</span>
          <Link href="/accessories" style={{textDecoration:'none',color:'#a09890'}}>Accessories</Link>
          <span style={{color:'rgba(27,67,50,0.2)'}}>›</span>
          <span style={{color:'#1b4332'}}>{item.name}</span>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="detail-main-grid" style={{position:'relative',zIndex:1,maxWidth:1200,margin:'0 auto',padding:'56px clamp(20px,5vw,72px) 100px',display:'grid',gridTemplateColumns:'360px 1fr',gap:64,alignItems:'start'}}>
        
        {/* IMAGE / COVER */}
        <div className="detail-cover-sticky" style={{position:'sticky',top:92}}>
          <div style={{position:'relative',borderRadius:18,overflow:'hidden',boxShadow:'0 20px 60px rgba(27,67,50,0.15)',background:'linear-gradient(155deg,#2d6a4f,#1b4332)',aspectRatio:'1/1'}}>
            {item.coverUrl ? (
              <img src={item.coverUrl} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/>
            ) : (
              <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,0.6)',fontSize:14,padding:24,textAlign:'center'}}>
                <div style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:50,color:'#d4ab70',marginBottom:8}}>إكسسوار</div>
                <span>{item.name}</span>
              </div>
            )}
            {soldOut && (
              <div style={{position:'absolute',inset:0,background:'rgba(250,249,245,0.7)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <span style={{padding:'8px 18px',background:'#1a1712',color:'#fff',fontSize:10,letterSpacing:1.5,textTransform:'uppercase',borderRadius:24,fontWeight:600}}>Out of Stock</span>
              </div>
            )}
          </div>
        </div>

        {/* DETAILS */}
        <div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:18,flexWrap:'wrap'}}>
            <span style={{padding:'5px 14px',background:'rgba(27,67,50,0.07)',borderRadius:20,fontSize:10,fontWeight:600,letterSpacing:1.2,textTransform:'uppercase',color:'#1b4332'}}>
              ✦ Essentials
            </span>
            <span style={{padding:'5px 14px',background:'rgba(184,150,90,0.08)',borderRadius:20,fontSize:10,fontWeight:600,letterSpacing:1.2,textTransform:'uppercase',color:'#b8965a',border:'1px solid rgba(184,150,90,0.25)'}}>
              Accessory
            </span>
          </div>

          <h1 style={{margin:'0 0 16px',fontFamily:"'Cormorant Garamond',serif",fontWeight:500,fontSize:'clamp(32px,4.5vw,48px)',color:'#1b4332',lineHeight:1.15}}>
            {item.name}
          </h1>

          <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:24}}>
            <span style={{flex:1,height:1,background:'linear-gradient(90deg,rgba(27,67,50,0.2),transparent)'}}/>
            <span style={{color:'#b8965a',fontSize:12}}>✦</span>
          </div>

          {/* Pricing */}
          <div style={{marginBottom:24,padding:'20px 24px',background:'linear-gradient(135deg,rgba(27,67,50,0.04),rgba(184,150,90,0.04))',borderRadius:16,border:'1px solid rgba(27,67,50,0.08)'}}>
            <div style={{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
              {item.mrp && item.price && item.mrp > item.price && (
                <span style={{fontSize:20,color:'#a09890',textDecoration:'line-through',fontFamily:"'Cormorant Garamond',serif"}}>
                  ₹{Number(item.mrp).toLocaleString('en-IN')}
                </span>
              )}
              <span style={{fontSize:36,fontWeight:500,color:'#1b4332',fontFamily:"'Cormorant Garamond',serif",lineHeight:1}}>
                ₹{Number(item.price || item.mrp || 0).toLocaleString('en-IN')}
              </span>
              {discount > 0 && (
                <span style={{padding:'5px 14px',borderRadius:20,background:'rgba(45,106,79,0.12)',color:'#2d6a4f',fontSize:13,fontWeight:600}}>
                  {discount}% off
                </span>
              )}
            </div>
            {discount > 0 && (
              <div style={{fontSize:13,color:'#6b6460',marginTop:8,fontWeight:300}}>
                You save ₹{(item.mrp - item.price).toLocaleString('en-IN')}
              </div>
            )}
          </div>

          {/* Stock status badge */}
          <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 18px',borderRadius:30,marginBottom:28,
            background:soldOut||isLow?'rgba(192,57,43,0.08)':'rgba(45,106,79,0.08)',
            border:`1px solid ${soldOut||isLow?'rgba(192,57,43,0.25)':'rgba(45,106,79,0.2)'}`,
            color:soldOut||isLow?'#c0392b':'#2d6a4f',fontSize:12,fontWeight:600,letterSpacing:1,textTransform:'uppercase'}}>
            <span style={{width:7,height:7,borderRadius:'50%',background:'currentColor'}}/>
            {soldOut ? 'Out of Stock' : isLow ? `Only ${effectiveStock} left!` : 'In Stock'}
          </div>

          {/* Description */}
          {item.description && (
            <div style={{marginBottom:32,paddingBottom:28,borderBottom:'1px solid rgba(27,67,50,0.08)'}}>
              {renderDescription(item.description)}
            </div>
          )}

          {/* Color Variants */}
          {hasVariants && (
            <div style={{marginBottom:32}}>
              <div style={{fontSize:13,fontWeight:500,color:'#1a1712',marginBottom:10}}>
                Color: <span style={{fontWeight:600,color:'#1b4332'}}>{selected?.label}</span>
                {selected?.stockCount !== undefined && selected.stockCount <= 0 && (
                  <span style={{fontSize:11,color:'#c0392b',marginLeft:8}}>(Sold Out)</span>
                )}
              </div>
              <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                {item.variants.map(v => (
                  <button
                    key={v.id}
                    onClick={() => { setSelected(v); setQty(1); }}
                    title={`${v.label}${v.stockCount <= 0 ? ' (out of stock)' : ''}`}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: v.color || '#1b4332',
                      cursor: 'pointer',
                      border: selected?.id === v.id ? '2px solid #1b4332' : '2px solid rgba(0,0,0,0.1)',
                      boxShadow: selected?.id === v.id ? '0 0 0 2px #fff, 0 0 0 4px #1b4332' : 'none',
                      opacity: v.stockCount <= 0 ? 0.35 : 1,
                      position: 'relative',
                      transition: 'all .2s'
                    }}
                  >
                    {v.stockCount <= 0 && (
                      <span style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'#fff',textShadow:'0 0 2px #000'}}>✕</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div style={{display:'flex',gap:14,flexWrap:'wrap',marginBottom:32,alignItems:'center'}}>
            {!soldOut && !inCart && (
              <div style={{display:'flex',alignItems:'center',border:'1.5px solid rgba(27,67,50,0.15)',borderRadius:40,overflow:'hidden'}}>
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  style={{width:40,height:48,border:'none',background:'transparent',color:'#1b4332',fontSize:18,cursor:'pointer'}}
                >−</button>
                <span style={{minWidth:32,textAlign:'center',fontSize:15,color:'#1a1712'}}>{qty}</span>
                <button
                  onClick={() => setQty(q => effectiveStock > 0 ? Math.min(effectiveStock, q + 1) : q + 1)}
                  aria-label="Increase quantity"
                  style={{width:40,height:48,border:'none',background:'transparent',color:'#1b4332',fontSize:18,cursor:'pointer'}}
                >+</button>
              </div>
            )}

            {!soldOut && (
              <button
                className={`book-add-to-cart book-add-to-cart--lg${inCart ? ' book-add-to-cart--in' : ''}`}
                onClick={handleAddToCart}
              >
                {inCart ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Added to Cart
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                      <line x1="3" y1="6" x2="21" y2="6"/>
                      <path d="M16 10a4 4 0 01-8 0"/>
                    </svg>
                    Add to Cart
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleWishlist}
              aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
              style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:52,height:52,borderRadius:'50%',border:'1.5px solid rgba(27,67,50,0.15)',background:'#fff',cursor:'pointer',flexShrink:0}}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={wished ? '#c44' : 'none'} stroke={wished ? '#c44' : '#6b6460'} strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
            </button>

            <Link
              href="/accessories"
              style={{textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8,border:'1.5px solid rgba(27,67,50,0.2)',color:'#1b4332',padding:'16px 28px',borderRadius:40,fontSize:14,letterSpacing:.4}}
            >
              ← Back to Accessories
            </Link>
          </div>
        </div>
      </div>

      {/* RELATED ACCESSORIES */}
      {related.length > 0 && (
        <div style={{position:'relative',zIndex:1,maxWidth:1200,margin:'0 auto',padding:'0 clamp(20px,5vw,72px) 100px'}}>
          <div style={{fontSize:10,letterSpacing:'2px',textTransform:'uppercase',color:'#b8965a',marginBottom:8}}>✦ More Essentials</div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:'#1b4332',margin:'0 0 28px'}}>Other Accessories</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:24}}>
            {related.map(r => (
              <Link
                key={r.id}
                href={`/accessory/${r.slug || r.id}`}
                style={{textDecoration:'none',display:'block',background:'#fff',borderRadius:16,overflow:'hidden',border:'1px solid rgba(27,67,50,0.08)',boxShadow:'0 4px 16px rgba(27,67,50,0.04)',transition:'transform .2s,box-shadow .2s'}}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 14px 32px rgba(27,67,50,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 4px 16px rgba(27,67,50,0.04)'; }}
              >
                <div style={{aspectRatio:'1/1',background:'linear-gradient(155deg,#2d6a4f,#1b4332)'}}>
                  {r.coverUrl ? (
                    <img src={r.coverUrl} alt={r.name} style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/>
                  ) : (
                    <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,0.6)',fontSize:12}}>{r.name}</div>
                  )}
                </div>
                <div style={{padding:'14px 16px'}}>
                  <h3 style={{margin:'0 0 4px',fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600,color:'#1a1712'}}>{r.name}</h3>
                  <div style={{fontSize:15,fontWeight:600,color:'#1b4332'}}>₹{r.price}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* REVIEWS */}
      <div style={{position:'relative',zIndex:1,maxWidth:1200,margin:'0 auto',padding:'0 clamp(20px,5vw,72px) 80px'}}>
        <ReviewSection itemId={`accessory:${item.id}`} itemType="accessory" />
      </div>

      {/* FOOTER */}
      <footer style={{position:'relative',zIndex:1,background:'#1b4332',padding:'48px clamp(20px,5vw,72px)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:20}}>
        <Link href="/" style={{textDecoration:'none',fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:'#fff'}}>Maktabah An Noor</Link>
        <div dir="rtl" style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:22,color:'#b8965a'}}>مكتبة النور</div>
      </footer>
    </div>
  );
}

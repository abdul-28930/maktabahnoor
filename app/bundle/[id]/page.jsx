'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import PageBackground from '@/components/PageBackground';

const OFFER_COLORS = {
  'Sale':                {bg:'rgba(220,38,38,0.1)',  border:'rgba(220,38,38,0.3)',  text:'#dc2626'},
  'Limited Edition':     {bg:'rgba(124,58,237,0.1)', border:'rgba(124,58,237,0.3)', text:'#7c3aed'},
  'Limited Deal':        {bg:'rgba(184,150,90,0.1)', border:'rgba(184,150,90,0.3)', text:'#b8965a'},
  'Limited Time Offer':  {bg:'rgba(220,120,20,0.1)', border:'rgba(220,120,20,0.3)', text:'#dc7814'},
};
function OfferBadge({ type }) {
  if (!type) return null;
  const c = OFFER_COLORS[type] || OFFER_COLORS['Sale'];
  return <span style={{padding:'5px 14px',borderRadius:20,fontSize:11,fontWeight:500,letterSpacing:1,textTransform:'uppercase',background:c.bg,border:`1px solid ${c.border}`,color:c.text}}>{type}</span>;
}

export default function BundlePage() {
  const { id } = useParams();
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { addBundleToCart, isInCart } = useCart();

  useEffect(() => {
    if (!id) return;
    fetch(`/api/bundles/${id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then(d => { if (d) { setBundle(d.bundle); setLoading(false); } })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [id]);

  const Nav = () => (
    <nav style={{position:'sticky',top:0,zIndex:40,height:68,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 clamp(20px,5vw,72px)',backdropFilter:'blur(10px)',background:'rgba(250,249,245,0.85)',borderBottom:'1px solid rgba(27,67,50,0.08)'}}>
      <Link href="/" style={{display:'flex',alignItems:'center',gap:12,textDecoration:'none',color:'#1b4332'}}>
        <Image src="/logo.png" alt="Logo" width={36} height={36} style={{height:36,width:'auto'}}/>
        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:600,letterSpacing:.5}}>Maktabah An Noor</span>
      </Link>
      <div style={{display:'flex',alignItems:'center',gap:24}}>
        <Link href="/"        style={{textDecoration:'none',fontSize:13,color:'#6b6460',letterSpacing:.3}}>Home</Link>
        <Link href="/books"   style={{textDecoration:'none',fontSize:13,color:'#6b6460',letterSpacing:.3}}>Collection</Link>
        <Link href="/bundles" style={{textDecoration:'none',fontSize:13,color:'#6b6460',letterSpacing:.3}}>Bundles</Link>
        <Link href="/accessories" style={{textDecoration:'none',fontSize:13,color:'#6b6460',letterSpacing:.3}}>Accessories</Link>
        <Link href="/wishlist" style={{textDecoration:'none',fontSize:13,color:'#6b6460',letterSpacing:.3}}>♡ Wishlist</Link>
      </div>
    </nav>
  );

  if (loading) return (
    <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',fontFamily:"'DM Sans',sans-serif"}}>
      <PageBackground subtle/><Nav/>
      <div style={{position:'relative',zIndex:1,display:'flex',alignItems:'center',justifyContent:'center',minHeight:'70vh',flexDirection:'column',gap:16}}>
        <div style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:64,color:'rgba(27,67,50,0.1)',animation:'pulseRays 2s ease-in-out infinite'}}>حزمة</div>
        <div style={{fontSize:13,color:'#a09890',letterSpacing:1}}>Loading…</div>
      </div>
    </div>
  );

  if (notFound || !bundle) return (
    <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',fontFamily:"'DM Sans',sans-serif"}}>
      <PageBackground subtle/><Nav/>
      <div style={{position:'relative',zIndex:1,textAlign:'center',padding:'100px 24px'}}>
        <div style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:80,color:'rgba(27,67,50,0.08)',marginBottom:20}}>حزمة</div>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,color:'#1b4332',marginBottom:12}}>Bundle Not Found</h1>
        <p style={{color:'#6b6460',marginBottom:28}}>This bundle does not exist or may have been removed.</p>
        <Link href="/bundles" style={{textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8,background:'#1b4332',color:'#fff',padding:'14px 28px',borderRadius:40,fontSize:13}}>← Back to Bundles</Link>
      </div>
    </div>
  );

  const books = bundle.books || [];
  const save = bundle.totalMrp && bundle.bundlePrice ? bundle.totalMrp - bundle.bundlePrice : 0;
  const soldOut = bundle.stockCount !== undefined && bundle.stockCount <= 0;
  const inCart = isInCart(`bundle:${bundle.id}`);

  return (
    <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',fontFamily:"'DM Sans',sans-serif",overflowX:'hidden'}}>
      <PageBackground subtle/>
      <Nav/>

      {/* BREADCRUMB */}
      <div style={{position:'relative',zIndex:1,padding:'20px clamp(20px,5vw,72px)',borderBottom:'1px solid rgba(27,67,50,0.06)'}}>
        <div style={{maxWidth:1200,margin:'0 auto',display:'flex',alignItems:'center',gap:10,fontSize:12,color:'#a09890',letterSpacing:.5}}>
          <Link href="/"        style={{textDecoration:'none',color:'#a09890'}}>Home</Link>
          <span style={{color:'rgba(27,67,50,0.2)'}}>›</span>
          <Link href="/bundles" style={{textDecoration:'none',color:'#a09890'}}>Bundles</Link>
          <Link href="/accessories" style={{textDecoration:'none',color:'#a09890'}}>Accessories</Link>
          <span style={{color:'rgba(27,67,50,0.2)'}}>›</span>
          <span style={{color:'#1b4332'}}>{bundle.name}</span>
        </div>
      </div>

      <div style={{position:'relative',zIndex:1,maxWidth:1200,margin:'0 auto',padding:'56px clamp(20px,5vw,72px) 100px',display:'grid',gridTemplateColumns:'320px 1fr',gap:64,alignItems:'start'}}>

        {/* Stacked covers */}
        <div style={{position:'sticky',top:92}}>
          <div style={{borderRadius:18,overflow:'hidden',boxShadow:'0 20px 60px rgba(27,67,50,0.2)',background:'linear-gradient(155deg,#2d6a4f,#1b4332)',aspectRatio:'3/4',display:'flex',alignItems:'center',justifyContent:'center',flexWrap:'wrap',gap:6,padding:24}}>
            {books.length > 0 ? books.slice(0, 6).map(b => (
              <div key={b.slug} style={{width:80,height:112,borderRadius:6,overflow:'hidden',boxShadow:'0 6px 18px rgba(0,0,0,0.3)',border:'2px solid rgba(255,255,255,0.15)'}}>
                {b.coverUrl ? <img src={b.coverUrl} alt={b.title} style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/>
                  : <div style={{width:'100%',height:'100%',background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Noto Naskh Arabic',serif",fontSize:16,color:'#b8965a'}}>ك</div>}
              </div>
            )) : <span style={{fontSize:64,opacity:.4}}>📦</span>}
          </div>
          {bundle.offerType && (
            <div style={{marginTop:20,textAlign:'center'}}><OfferBadge type={bundle.offerType} /></div>
          )}
        </div>

        {/* Details */}
        <div>
          <div style={{fontSize:10,letterSpacing:'2.5px',textTransform:'uppercase',color:'#b8965a',marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
            <span style={{width:16,height:1,background:'#b8965a',display:'inline-block'}}/>Bundle Deal · {books.length} Books
          </div>
          <h1 style={{margin:'0 0 14px',fontFamily:"'Cormorant Garamond',serif",fontWeight:500,fontSize:'clamp(30px,4.5vw,46px)',color:'#1b4332',lineHeight:1.15}}>
            {bundle.name}
          </h1>

          {bundle.description && (
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic',fontSize:17,color:'#6b6460',lineHeight:1.75,marginBottom:28}}>
              {bundle.description}
            </p>
          )}

          {/* Pricing */}
          <div style={{marginBottom:20,padding:'20px 24px',background:'linear-gradient(135deg,rgba(27,67,50,0.04),rgba(184,150,90,0.04))',borderRadius:16,border:'1px solid rgba(27,67,50,0.08)'}}>
            <div style={{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
              {bundle.totalMrp > 0 && (
                <span style={{fontSize:20,color:'#a09890',textDecoration:'line-through',fontFamily:"'Cormorant Garamond',serif"}}>₹{Number(bundle.totalMrp).toLocaleString('en-IN')}</span>
              )}
              <span style={{fontSize:36,fontWeight:500,color:'#1b4332',fontFamily:"'Cormorant Garamond',serif",lineHeight:1}}>₹{Number(bundle.bundlePrice).toLocaleString('en-IN')}</span>
            </div>
            {save > 0 && (
              <div style={{fontSize:13,color:'#2d6a4f',marginTop:8,fontWeight:400}}>You save ₹{save.toLocaleString('en-IN')} buying as a bundle</div>
            )}
          </div>

          {/* Stock badge */}
          <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'9px 20px',borderRadius:30,marginBottom:28,
            background:soldOut?'rgba(180,60,60,0.06)':'rgba(45,106,79,0.08)',
            border:`1px solid ${soldOut?'rgba(180,60,60,0.15)':'rgba(45,106,79,0.2)'}`,
            color:soldOut?'#b44444':'#2d6a4f',fontSize:12,fontWeight:500,letterSpacing:1,textTransform:'uppercase'}}>
            <span style={{width:7,height:7,borderRadius:'50%',background:'currentColor'}}/>
            {soldOut ? 'Sold Out' : bundle.stockCount && bundle.stockCount <= 5 ? `Only ${bundle.stockCount} left!` : 'Available'}
          </div>

          {/* Books included */}
          <div style={{marginBottom:32}}>
            <div style={{fontSize:13,fontWeight:500,color:'#1b4332',letterSpacing:.5,marginBottom:14,textTransform:'uppercase'}}>What&apos;s Included</div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {books.map(b => (
                <Link key={b.slug} href={`/book/${b.slug}`} style={{textDecoration:'none',display:'flex',alignItems:'center',gap:14,padding:'12px 16px',background:'#fff',borderRadius:12,border:'1px solid rgba(27,67,50,0.08)',boxShadow:'0 2px 8px rgba(27,67,50,0.04)',transition:'box-shadow .2s'}}
                  onMouseEnter={e=>e.currentTarget.style.boxShadow='0 6px 18px rgba(27,67,50,0.1)'} onMouseLeave={e=>e.currentTarget.style.boxShadow='0 2px 8px rgba(27,67,50,0.04)'}>
                  <div style={{width:40,height:56,borderRadius:5,overflow:'hidden',flexShrink:0,background:'linear-gradient(155deg,#2d6a4f,#1b4332)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {b.coverUrl ? <img src={b.coverUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/> : <span style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:16,color:'#d4ab70'}}>ك</span>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,color:'#1a1712',fontWeight:400,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{b.title}</div>
                    <div style={{fontSize:12,color:'#a09890'}}>{b.author} · {b.category}</div>
                  </div>
                  {(b.price || b.mrp) && (
                    <div style={{fontSize:13,color:'#a09890',flexShrink:0}}>₹{Number(b.price || b.mrp).toLocaleString('en-IN')}</div>
                  )}
                </Link>
              ))}
            </div>
          </div>

          <div style={{display:'flex',gap:14,flexWrap:'wrap',marginBottom:24}}>
            {!soldOut && (
              <button
                className={`book-add-to-cart book-add-to-cart--lg${inCart ? ' book-add-to-cart--in' : ''}`}
                onClick={() => addBundleToCart(bundle)}>
                {inCart ? (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Added to Cart</>
                ) : (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>Add Bundle to Cart</>
                )}
              </button>
            )}
            <Link href="/bundles"
              style={{textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8,border:'1.5px solid rgba(27,67,50,0.2)',color:'#1b4332',padding:'16px 28px',borderRadius:40,fontSize:14,letterSpacing:.4}}>
              ← Back to Bundles
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{position:'relative',zIndex:1,background:'#1b4332',padding:'48px clamp(20px,5vw,72px)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:20}}>
        <Link href="/" style={{textDecoration:'none',fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:'#fff'}}>Maktabah An Noor</Link>
        <div dir="rtl" style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:22,color:'#b8965a'}}>مكتبة النور</div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',letterSpacing:1}}>© 2026 · Books That Illuminate The Heart</div>
      </footer>
    </div>
  );
}

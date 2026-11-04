'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import PageBackground from '@/components/PageBackground';
import { useCart } from '@/context/CartContext';
import { renderDescription } from '@/components/FormattedDescription';

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

export default function ComboPageClient() {
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

  if (loading) return (
    <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',fontFamily:"'DM Sans',sans-serif"}}>
      <PageBackground subtle/>
      <Navbar active="combos" />
      <div style={{position:'relative',zIndex:1,display:'flex',alignItems:'center',justifyContent:'center',minHeight:'70vh',flexDirection:'column',gap:16}}>
        <div style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:64,color:'rgba(27,67,50,0.1)',animation:'pulseRays 2s ease-in-out infinite'}}>حزمة</div>
        <div style={{fontSize:13,color:'#a09890',letterSpacing:1}}>Loading…</div>
      </div>
    </div>
  );

  if (notFound || !bundle) return (
    <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',fontFamily:"'DM Sans',sans-serif"}}>
      <PageBackground subtle/>
      <Navbar active="combos" />
      <div style={{position:'relative',zIndex:1,textAlign:'center',padding:'100px 24px'}}>
        <div style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:80,color:'rgba(27,67,50,0.08)',marginBottom:20}}>حزمة</div>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,color:'#1b4332',marginBottom:12}}>Combo Not Found</h1>
        <p style={{color:'#6b6460',marginBottom:28}}>This combo does not exist or may have been removed.</p>
        <Link href="/combos" style={{textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8,background:'#1b4332',color:'#fff',padding:'14px 28px',borderRadius:40,fontSize:13}}>← Back to Combos</Link>
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
      <Navbar active="combos" />

      {/* BREADCRUMB */}
      <div style={{position:'relative',zIndex:1,padding:'20px clamp(20px,5vw,72px)',borderBottom:'1px solid rgba(27,67,50,0.06)'}}>
        <div style={{maxWidth:1200,margin:'0 auto',display:'flex',alignItems:'center',gap:10,fontSize:12,color:'#a09890',letterSpacing:.5}}>
          <Link href="/"        style={{textDecoration:'none',color:'#a09890'}}>Home</Link>
          <span style={{color:'rgba(27,67,50,0.2)'}}>›</span>
          <Link href="/combos" style={{textDecoration:'none',color:'#a09890'}}>Combos</Link>
          <span style={{color:'rgba(27,67,50,0.2)'}}>›</span>
          <span style={{color:'#1b4332'}}>{bundle.name}</span>
        </div>
      </div>

      <div style={{position:'relative',zIndex:1,maxWidth:1200,margin:'0 auto',padding:'52px clamp(20px,5vw,72px) 100px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:'clamp(36px,5vw,72px)',alignItems:'start'}}>

        {/* LEFT: Books in the combo */}
        <div>
          <div style={{fontSize:11,letterSpacing:'2px',textTransform:'uppercase',color:'#b8965a',fontWeight:600,marginBottom:20}}>
            Included in this Combo ({books.length} Books)
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {books.map(b => (
              <Link key={b.slug} href={`/book/${b.slug}`}
                style={{textDecoration:'none',display:'flex',gap:16,padding:16,background:'#fff',borderRadius:16,border:'1px solid rgba(27,67,50,0.08)',boxShadow:'0 2px 12px rgba(27,67,50,0.04)',transition:'transform .2s,box-shadow .2s'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(27,67,50,0.08)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 2px 12px rgba(27,67,50,0.04)';}}>
                <div style={{width:64,height:88,borderRadius:8,overflow:'hidden',flexShrink:0,background:'#f0ece1',boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}>
                  {b.coverUrl ? <img src={b.coverUrl} alt={b.title} style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/>
                    : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Noto Naskh Arabic',serif",fontSize:20,color:'#b8965a'}}>ك</div>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:'#1b4332',lineHeight:1.3,marginBottom:4}}>{b.title}</div>
                  <div style={{fontSize:12,color:'#a09890',marginBottom:8}}>{b.author}</div>
                  {b.price && <div style={{fontSize:14,fontWeight:500,color:'#1b4332'}}>₹{Number(b.price).toLocaleString('en-IN')}</div>}
                </div>
              </Link>
            ))}
          </div>
          {bundle.offerType && (
            <div style={{marginTop:20,textAlign:'center'}}><OfferBadge type={bundle.offerType} /></div>
          )}
        </div>

        {/* RIGHT: Combo details & CTA */}
        <div style={{background:'#fff',borderRadius:24,padding:'clamp(28px,4vw,44px)',border:'1px solid rgba(27,67,50,0.08)',boxShadow:'0 8px 36px rgba(27,67,50,0.06)'}}>
          <div style={{fontSize:10,letterSpacing:'2px',textTransform:'uppercase',color:'#b8965a',fontWeight:600,marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
            <span style={{width:16,height:1,background:'#b8965a',display:'inline-block'}}/>Combo Deal · {books.length} Books
          </div>
          <h1 style={{margin:'0 0 16px',fontFamily:"'Cormorant Garamond',serif",fontWeight:500,fontSize:'clamp(28px,3.5vw,40px)',color:'#1b4332',lineHeight:1.2}}>
            {bundle.name}
          </h1>

          {bundle.description && (
            <div style={{marginBottom:28}}>
              {renderDescription(bundle.description, { fontSize: 17, lineHeight: 1.75 })}
            </div>
          )}

          {/* Pricing block */}
          <div style={{padding:'20px 24px',background:'rgba(27,67,50,0.03)',borderRadius:16,border:'1px solid rgba(27,67,50,0.07)',marginBottom:28}}>
            <div style={{display:'flex',alignItems:'baseline',gap:12,flexWrap:'wrap'}}>
              {bundle.totalMrp > 0 && (
                <span style={{fontSize:20,color:'#a09890',textDecoration:'line-through',fontFamily:"'Cormorant Garamond',serif"}}>₹{Number(bundle.totalMrp).toLocaleString('en-IN')}</span>
              )}
              <span style={{fontSize:36,fontWeight:500,color:'#1b4332',fontFamily:"'Cormorant Garamond',serif",lineHeight:1}}>₹{Number(bundle.bundlePrice).toLocaleString('en-IN')}</span>
            </div>
            {save > 0 && (
              <div style={{fontSize:13,color:'#2d6a4f',marginTop:8,fontWeight:400}}>You save ₹{save.toLocaleString('en-IN')} buying as a combo</div>
            )}
          </div>

          {/* Stock status */}
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:28,fontSize:13,color: soldOut ? '#c44' : '#2d6a4f'}}>
            <span style={{width:8,height:8,borderRadius:'50%',background: soldOut ? '#c44' : '#2d6a4f',display:'inline-block'}}/>
            {soldOut ? 'Sold Out' : bundle.stockCount && bundle.stockCount <= 5 ? `Only ${bundle.stockCount} left!` : 'Available'}
          </div>

          {/* CTAs */}
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {!soldOut && (
              <button
                className={`book-add-to-cart book-add-to-cart--lg${inCart ? ' book-add-to-cart--in' : ''}`}
                onClick={() => addBundleToCart(bundle)}>
                {inCart ? (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Added to Cart</>
                ) : (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>Add Combo to Cart</>
                )}
              </button>
            )}
            <Link href="/combos"
              style={{textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8,border:'1.5px solid rgba(27,67,50,0.2)',color:'#1b4332',padding:'16px 28px',borderRadius:40,fontSize:14,letterSpacing:.4}}>
              ← Back to Combos
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

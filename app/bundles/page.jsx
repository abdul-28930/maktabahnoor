'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import PageBackground from '@/components/PageBackground';
import { useCart } from '@/context/CartContext';

const OFFER_COLORS = {
  'Sale':                {bg:'rgba(220,38,38,0.1)',  border:'rgba(220,38,38,0.3)',  text:'#dc2626'},
  'Limited Edition':     {bg:'rgba(124,58,237,0.1)', border:'rgba(124,58,237,0.3)', text:'#7c3aed'},
  'Limited Deal':        {bg:'rgba(184,150,90,0.1)', border:'rgba(184,150,90,0.3)', text:'#b8965a'},
  'Limited Time Offer':  {bg:'rgba(220,120,20,0.1)', border:'rgba(220,120,20,0.3)', text:'#dc7814'},
};

function OfferBadge({ type }) {
  if (!type) return null;
  const c = OFFER_COLORS[type] || OFFER_COLORS['Sale'];
  return (
    <span style={{padding:'4px 12px',borderRadius:20,fontSize:10,fontWeight:500,letterSpacing:1,textTransform:'uppercase',background:c.bg,border:`1px solid ${c.border}`,color:c.text}}>
      {type}
    </span>
  );
}

function BundleCard({ bundle }) {
  const { addBundleToCart, isInCart } = useCart();
  const slug = `bundle:${bundle.id}`;
  const inCart = isInCart(slug);
  const covers = (bundle.books || []).slice(0, 3);
  const save = bundle.totalMrp && bundle.bundlePrice ? bundle.totalMrp - bundle.bundlePrice : 0;
  const soldOut = bundle.stockCount !== undefined && bundle.stockCount <= 0;

  function handleAdd(e) {
    e.preventDefault(); e.stopPropagation();
    addBundleToCart(bundle);
  }

  return (
    <Link href={`/bundle/${bundle.id}`} style={{textDecoration:'none',display:'block',background:'#fff',borderRadius:18,border:'1px solid rgba(27,67,50,0.08)',overflow:'hidden',boxShadow:'0 4px 20px rgba(27,67,50,0.05)',transition:'transform .2s,box-shadow .2s'}}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 16px 40px rgba(27,67,50,0.12)';}}
      onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 4px 20px rgba(27,67,50,0.05)';}}>

      {/* Stacked cover strip */}
      <div style={{position:'relative',height:180,background:'linear-gradient(155deg,#2d6a4f,#1b4332)',display:'flex',alignItems:'center',justifyContent:'center',gap:0}}>
        {covers.length > 0 ? covers.map((b, i) => (
          <div key={b.slug} style={{
            width:90, height:130, borderRadius:8, overflow:'hidden', boxShadow:'0 8px 24px rgba(0,0,0,0.3)',
            marginLeft: i === 0 ? 0 : -28, transform: `rotate(${(i - (covers.length-1)/2) * 8}deg)`,
            border:'2px solid rgba(255,255,255,0.15)', zIndex: covers.length - i, background:'#fff',
          }}>
            {b.coverUrl ? <img src={b.coverUrl} alt={b.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Noto Naskh Arabic',serif",fontSize:20,color:'#b8965a'}}>ك</div>}
          </div>
        )) : <span style={{fontSize:52,opacity:.35}}>📦</span>}
        <div style={{position:'absolute',top:12,left:12}}>
          <OfferBadge type={bundle.offerType} />
        </div>
        {soldOut && (
          <div style={{position:'absolute',inset:0,background:'rgba(26,23,18,0.55)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{color:'#fff',fontSize:12,fontWeight:500,letterSpacing:1.5,textTransform:'uppercase',border:'1px solid rgba(255,255,255,0.4)',padding:'6px 16px',borderRadius:20}}>Sold Out</span>
          </div>
        )}
      </div>

      <div style={{padding:'20px 22px 22px'}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:21,fontWeight:600,color:'#1b4332',marginBottom:6,lineHeight:1.25}}>{bundle.name}</div>
        <div style={{fontSize:12,color:'#a09890',marginBottom:14}}>{bundle.bookSlugs?.length || covers.length} books in this bundle</div>

        <div style={{display:'flex',alignItems:'baseline',gap:10,flexWrap:'wrap',marginBottom:14}}>
          {bundle.totalMrp > 0 && (
            <span style={{fontSize:14,color:'#a09890',textDecoration:'line-through'}}>₹{Number(bundle.totalMrp).toLocaleString('en-IN')}</span>
          )}
          <span style={{fontSize:22,fontWeight:600,color:'#1b4332',fontFamily:"'Cormorant Garamond',serif"}}>₹{Number(bundle.bundlePrice).toLocaleString('en-IN')}</span>
          {save > 0 && (
            <span style={{fontSize:11,color:'#2d6a4f',background:'rgba(45,106,79,0.1)',padding:'3px 10px',borderRadius:10}}>Save ₹{save.toLocaleString('en-IN')}</span>
          )}
        </div>

        {!soldOut && (
          <button
            onClick={handleAdd}
            style={{width:'100%',padding:'12px',borderRadius:30,border:'none',fontSize:12,fontWeight:500,letterSpacing:.6,textTransform:'uppercase',cursor:'pointer',
              background: inCart ? 'rgba(27,67,50,0.08)' : '#1b4332', color: inCart ? '#1b4332' : '#fff', transition:'all .2s'}}>
            {inCart ? '✓ Added to Cart' : 'Add Bundle to Cart'}
          </button>
        )}
      </div>
    </Link>
  );
}

export default function BundlesPage() {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bundles')
      .then(r => r.json())
      .then(async d => {
        const active = (d.bundles || []).filter(b => b.active !== false);
        // Fetch full details (with book covers) for each bundle
        const detailed = await Promise.all(active.map(async b => {
          try {
            const r = await fetch(`/api/bundles/${b.id}`);
            const dd = await r.json();
            return dd.bundle || b;
          } catch { return b; }
        }));
        setBundles(detailed);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',fontFamily:"'DM Sans',sans-serif",overflowX:'hidden'}}>
      <PageBackground subtle/>

      {/* NAV */}
      <nav style={{position:'sticky',top:0,zIndex:40,height:68,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 clamp(20px,5vw,72px)',backdropFilter:'blur(12px)',background:'rgba(250,249,245,0.88)',borderBottom:'1px solid rgba(27,67,50,0.08)'}}>
        <Link href="/" style={{display:'flex',alignItems:'center',gap:12,textDecoration:'none',color:'#1b4332'}}>
          <Image src="/logo.png" alt="Logo" width={36} height={36} style={{height:36,width:'auto'}}/>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:600,letterSpacing:.5}}>Maktabah An Noor</span>
        </Link>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <Link href="/" style={{textDecoration:'none',padding:'7px 14px',borderRadius:20,fontSize:12,color:'#6b6460',letterSpacing:.3}}>Home</Link>
          <Link href="/books" style={{textDecoration:'none',padding:'7px 14px',borderRadius:20,fontSize:12,color:'#6b6460',letterSpacing:.3}}>Books</Link>
          <Link href="/bundles" style={{textDecoration:'none',padding:'7px 14px',borderRadius:20,fontSize:12,color:'#1b4332',fontWeight:500,background:'rgba(27,67,50,0.07)'}}>Bundles</Link>
          <Link href="/accessories" style={{textDecoration:'none',padding:'7px 14px',borderRadius:20,fontSize:12,color:'#1b4332',fontWeight:500,background:'rgba(27,67,50,0.07)'}}>Accessories</Link>
          <Link href="/wishlist" style={{textDecoration:'none',padding:'7px 14px',borderRadius:20,fontSize:12,color:'#6b6460',letterSpacing:.3}}>♡ Wishlist</Link>
        </div>
      </nav>

      {/* HEADER */}
      <div style={{position:'relative',zIndex:1,padding:'52px clamp(20px,5vw,72px) 40px',borderBottom:'1px solid rgba(27,67,50,0.07)',background:'linear-gradient(180deg,rgba(27,67,50,0.03),transparent)',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'50%',right:'4%',transform:'translateY(-50%)',fontFamily:"'Noto Naskh Arabic',serif",fontSize:150,color:'rgba(27,67,50,0.04)',pointerEvents:'none',lineHeight:1}}>حزم</div>
        <div style={{maxWidth:1280,margin:'0 auto',position:'relative'}}>
          <div style={{fontSize:10,letterSpacing:'2.5px',textTransform:'uppercase',color:'#b8965a',marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
            <span style={{width:16,height:1,background:'#b8965a',display:'inline-block'}}/>Bundle Deals
          </div>
          <h1 style={{margin:'0 0 10px',fontFamily:"'Cormorant Garamond',serif",fontWeight:500,fontSize:'clamp(32px,5vw,50px)',color:'#1b4332',lineHeight:1.1}}>Curated Book Bundles</h1>
          <p style={{maxWidth:520,fontSize:15,color:'#6b6460',lineHeight:1.7,fontWeight:300}}>Hand-picked collections at a special combined price — a simple way to start or grow your Islamic library.</p>
        </div>
      </div>

      {/* GRID */}
      <div style={{position:'relative',zIndex:1,maxWidth:1280,margin:'0 auto',padding:'44px clamp(20px,5vw,72px) 100px'}}>
        {loading ? (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:24}}>
            {[...Array(3)].map((_,i) => (
              <div key={i} style={{height:340,borderRadius:18,background:'rgba(27,67,50,0.05)',animation:'pulseRays 1.6s ease-in-out infinite'}}/>
            ))}
          </div>
        ) : bundles.length === 0 ? (
          <div style={{textAlign:'center',padding:'80px 24px'}}>
            <div style={{fontSize:52,marginBottom:16,opacity:.25}}>📦</div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:'#1b4332',margin:'0 0 10px'}}>No bundles available right now</h2>
            <p style={{color:'#6b6460',marginBottom:24}}>Check back soon, or browse our full collection instead.</p>
            <Link href="/books" style={{textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8,background:'#1b4332',color:'#fff',padding:'14px 28px',borderRadius:40,fontSize:13}}>Browse All Books →</Link>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:24}}>
            {bundles.map(b => <BundleCard key={b.id} bundle={b} />)}
          </div>
        )}
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

'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import PageBackground from '@/components/PageBackground';
import { useCart } from '@/context/CartContext';

function ClothingCard({ item }) {
  const { addClothingToCart, isInCart } = useCart();
  const hasVariants = item.variants?.length > 0;
  const [selected, setSelected] = useState(hasVariants ? item.variants[0] : null);
  const effectiveStock = hasVariants ? (selected?.stockCount ?? 0) : item.stockCount;
  const slug = `clothing:${item.id}${selected ? ':' + selected.id : ''}`;
  const inCart = isInCart(slug);
  const soldOut = effectiveStock <= 0;
  const itemSlug = item.slug || item.id;

  function handleAddToCart(e) {
    e.preventDefault();
    e.stopPropagation();
    addClothingToCart(item, selected);
  }

  function handleSelectVariant(e, v) {
    e.preventDefault();
    e.stopPropagation();
    setSelected(v);
  }

  return (
    <Link
      href={`/clothing/${itemSlug}`}
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        borderRadius: 18,
        border: '1px solid rgba(27,67,50,0.08)',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(27,67,50,0.05)',
        transition: 'transform .3s, box-shadow .3s',
        cursor: 'pointer'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 18px 40px rgba(27,67,50,0.13)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(27,67,50,0.05)';
      }}
    >
      <div style={{position:'relative',aspectRatio:'1/1',background:'linear-gradient(155deg,#2d6a4f,#1b4332)',overflow:'hidden'}}>
        {item.coverUrl
          ? <img src={item.coverUrl} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform .4s'}}
              onMouseEnter={e=>e.target.style.transform='scale(1.04)'}
              onMouseLeave={e=>e.target.style.transform='scale(1)'}
              loading="lazy"/>
          : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,0.6)',fontSize:13}}>{item.name}</div>}
        {soldOut && <div style={{position:'absolute',inset:0,background:'rgba(250,249,245,0.65)',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{padding:'6px 14px',background:'#1a1712',color:'#fff',fontSize:9,letterSpacing:1.5,textTransform:'uppercase',borderRadius:20}}>Out of Stock</span></div>}
      </div>
      <div style={{padding:'16px 18px',display:'flex',flexDirection:'column',flex:1}}>
        <h3 style={{margin:'0 0 4px',fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:18,color:'#1a1712'}}>{item.name}</h3>
        {item.description && <p style={{margin:'0 0 10px',fontSize:12,color:'#6b6460',lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{item.description}</p>}
        <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:hasVariants?10:12,flexWrap:'wrap'}}>
          <span style={{fontSize:16,fontWeight:600,color:'#1b4332'}}>₹{item.price}</span>
          {item.mrp > item.price && <span style={{fontSize:12,color:'#a09890',textDecoration:'line-through'}}>₹{item.mrp}</span>}
          {item.mrp > item.price && (
            <span style={{fontSize:11,fontWeight:700,color:'#2d6a4f',background:'rgba(45,106,79,0.08)',padding:'2px 7px',borderRadius:8}}>
              {Math.round((1 - item.price/item.mrp)*100)}% off
            </span>
          )}
        </div>
        {hasVariants && (
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,color:'#a09890',marginBottom:6}}>
              {selected?.size && selected?.color ? 'Size / Color: ' : selected?.size ? 'Size: ' : 'Color: '}
              <span style={{color:'#1a1712'}}>{selected?.label}</span>
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {item.variants.map(v => (
                <button key={v.id} onClick={(e)=>handleSelectVariant(e, v)} title={`${v.label}${v.stockCount<=0?' (out of stock)':''}`}
                  style={v.color ? {
                    width:26,height:26,borderRadius:'50%',background:v.color,cursor:'pointer',
                    border:selected?.id===v.id?'2px solid #1b4332':'2px solid rgba(0,0,0,0.1)',
                    boxShadow:selected?.id===v.id?'0 0 0 2px #fff, 0 0 0 3px #1b4332':'none',
                    opacity:v.stockCount<=0?0.35:1,position:'relative'
                  } : {
                    padding:'5px 12px',borderRadius:8,cursor:'pointer',fontSize:12,background:selected?.id===v.id?'#1b4332':'#fff',
                    color:selected?.id===v.id?'#fff':'#1a1712',border:`1.5px solid ${selected?.id===v.id?'#1b4332':'rgba(27,67,50,0.15)'}`,
                    opacity:v.stockCount<=0?0.4:1
                  }}>
                  {v.color ? (v.stockCount<=0 && <span style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'#fff',textShadow:'0 0 2px #000'}}>✕</span>) : (v.label + (v.stockCount<=0?' ✕':''))}
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{marginTop:'auto'}}>
          {!soldOut && (
            <button onClick={handleAddToCart} className={`book-add-to-cart${inCart?' book-add-to-cart--in':''}`} style={{width:'100%',padding:'6px 10px',fontSize:11,height:32}}>
              {inCart ? (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight:4}}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Added
                </>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:4}}>
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 01-8 0"/>
                  </svg>
                  Add to Cart
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function ClothingPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/clothing').then(r=>r.json()).then(d=>{setItems(d.clothing||[]);setLoading(false);}).catch(()=>setLoading(false));
  }, []);

  return (
    <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',fontFamily:"'DM Sans',sans-serif",overflowX:'hidden'}}>
      <PageBackground subtle/>
      <Navbar active="clothing" />

      <div style={{position:'relative',zIndex:1,padding:'52px clamp(20px,5vw,72px) 40px',borderBottom:'1px solid rgba(27,67,50,0.07)'}}>
        <div style={{maxWidth:1280,margin:'0 auto'}}>
          <div style={{fontSize:10,letterSpacing:'2.5px',textTransform:'uppercase',color:'#b8965a',marginBottom:14}}>✦ Essentials</div>
          <h1 style={{margin:'0 0 10px',fontFamily:"'Cormorant Garamond',serif",fontWeight:500,fontSize:'clamp(32px,5vw,50px)',color:'#1b4332'}}>Clothing</h1>
          <p style={{maxWidth:520,fontSize:15,color:'#6b6460',lineHeight:1.7,fontWeight:300}}>Modest wear and everyday essentials, alongside our book collection.</p>
        </div>
      </div>

      <div style={{position:'relative',zIndex:1,maxWidth:1280,margin:'0 auto',padding:'44px clamp(20px,5vw,72px) 100px'}}>
        {loading ? (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:24}}>
            {[...Array(4)].map((_,i)=><div key={i} style={{height:300,borderRadius:18,background:'rgba(27,67,50,0.05)'}}/>)}
          </div>
        ) : items.length === 0 ? (
          <div style={{textAlign:'center',padding:'80px 24px'}}>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:'#1b4332',margin:'0 0 10px'}}>No clothing available right now</h2>
            <Link href="/books" style={{textDecoration:'none',display:'inline-flex',color:'#1b4332'}}>Browse Books →</Link>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:24}}>
            {items.map(i => <ClothingCard key={i.id} item={i}/>)}
          </div>
        )}
      </div>

      <footer style={{position:'relative',zIndex:1,background:'#1b4332',padding:'48px clamp(20px,5vw,72px)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:20}}>
        <Link href="/" style={{textDecoration:'none',fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:'#fff'}}>Maktabah An Noor</Link>
        <div dir="rtl" style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:22,color:'#b8965a'}}>مكتبة النور</div>
      </footer>
    </div>
  );
}

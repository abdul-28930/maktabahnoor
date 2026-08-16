'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import BooksNavDropdown from '@/components/BooksNavDropdown';
import Image from 'next/image';
import PageBackground from '@/components/PageBackground';
import { useCart } from '@/context/CartContext';

function AccessoryCard({ item }) {
  const { addAccessoryToCart, isInCart } = useCart();
  const slug = `accessory:${item.id}`;
  const inCart = isInCart(slug);
  const soldOut = item.stockCount <= 0;

  return (
    <div style={{background:'#fff',borderRadius:18,border:'1px solid rgba(27,67,50,0.08)',overflow:'hidden',boxShadow:'0 4px 20px rgba(27,67,50,0.05)'}}>
      <div style={{position:'relative',aspectRatio:'1/1',background:'linear-gradient(155deg,#2d6a4f,#1b4332)'}}>
        {item.coverUrl
          ? <img src={item.coverUrl} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,0.6)',fontSize:13}}>{item.name}</div>}
        {soldOut && <div style={{position:'absolute',inset:0,background:'rgba(250,249,245,0.65)',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{padding:'6px 14px',background:'#1a1712',color:'#fff',fontSize:9,letterSpacing:1.5,textTransform:'uppercase',borderRadius:20}}>Out of Stock</span></div>}
      </div>
      <div style={{padding:'16px 18px'}}>
        <h3 style={{margin:'0 0 4px',fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:18,color:'#1a1712'}}>{item.name}</h3>
        {item.description && <p style={{margin:'0 0 10px',fontSize:12,color:'#6b6460',lineHeight:1.5}}>{item.description}</p>}
        <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:12}}>
          <span style={{fontSize:16,fontWeight:600,color:'#1b4332'}}>₹{item.price}</span>
          {item.mrp > item.price && <span style={{fontSize:12,color:'#a09890',textDecoration:'line-through'}}>₹{item.mrp}</span>}
        </div>
        {!soldOut && (
          <button onClick={()=>addAccessoryToCart(item)} className={`book-add-to-cart${inCart?' book-add-to-cart--in':''}`}>
            {inCart ? 'Added' : 'Add to Cart'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AccessoriesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/accessories').then(r=>r.json()).then(d=>{setItems(d.accessories||[]);setLoading(false);}).catch(()=>setLoading(false));
  }, []);

  return (
    <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',fontFamily:"'DM Sans',sans-serif",overflowX:'hidden'}}>
      <PageBackground subtle/>
      <nav style={{position:'sticky',top:0,zIndex:40,height:68,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 clamp(20px,5vw,72px)',backdropFilter:'blur(12px)',background:'rgba(250,249,245,0.88)',borderBottom:'1px solid rgba(27,67,50,0.08)'}}>
        <Link href="/" style={{display:'flex',alignItems:'center',gap:12,textDecoration:'none',color:'#1b4332'}}>
          <Image src="/logo.png" alt="Logo" width={36} height={36} style={{height:36,width:'auto'}}/>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:600,letterSpacing:.5}}>Maktabah An Noor</span>
        </Link>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <Link href="/" style={{textDecoration:'none',padding:'7px 14px',borderRadius:20,fontSize:12,color:'#6b6460'}}>Home</Link>
          <BooksNavDropdown/>
          <Link href="/bundles" style={{textDecoration:'none',padding:'7px 14px',borderRadius:20,fontSize:12,color:'#6b6460'}}>Bundles</Link>
          <Link href="/accessories" style={{textDecoration:'none',padding:'7px 14px',borderRadius:20,fontSize:12,color:'#1b4332',fontWeight:500,background:'rgba(27,67,50,0.07)'}}>Accessories</Link>
          <Link href="/wishlist" style={{textDecoration:'none',padding:'7px 14px',borderRadius:20,fontSize:12,color:'#6b6460'}}>♡ Wishlist</Link>
        </div>
      </nav>

      <div style={{position:'relative',zIndex:1,padding:'52px clamp(20px,5vw,72px) 40px',borderBottom:'1px solid rgba(27,67,50,0.07)'}}>
        <div style={{maxWidth:1280,margin:'0 auto'}}>
          <div style={{fontSize:10,letterSpacing:'2.5px',textTransform:'uppercase',color:'#b8965a',marginBottom:14}}>✦ Essentials</div>
          <h1 style={{margin:'0 0 10px',fontFamily:"'Cormorant Garamond',serif",fontWeight:500,fontSize:'clamp(32px,5vw,50px)',color:'#1b4332'}}>Accessories</h1>
          <p style={{maxWidth:520,fontSize:15,color:'#6b6460',lineHeight:1.7,fontWeight:300}}>Watches and other everyday essentials, alongside our book collection.</p>
        </div>
      </div>

      <div style={{position:'relative',zIndex:1,maxWidth:1280,margin:'0 auto',padding:'44px clamp(20px,5vw,72px) 100px'}}>
        {loading ? (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:24}}>
            {[...Array(4)].map((_,i)=><div key={i} style={{height:300,borderRadius:18,background:'rgba(27,67,50,0.05)'}}/>)}
          </div>
        ) : items.length === 0 ? (
          <div style={{textAlign:'center',padding:'80px 24px'}}>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:'#1b4332',margin:'0 0 10px'}}>No accessories available right now</h2>
            <Link href="/books" style={{textDecoration:'none',display:'inline-flex',color:'#1b4332'}}>Browse Books →</Link>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:24}}>
            {items.map(i => <AccessoryCard key={i.id} item={i}/>)}
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

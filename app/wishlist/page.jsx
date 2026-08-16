'use client';
import Link from 'next/link';
import BooksNavDropdown from '@/components/BooksNavDropdown';
import Image from 'next/image';
import PageBackground from '@/components/PageBackground';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { WA_NUMBER } from '@/lib/constants';

export default function WishlistPage() {
  const { items, removeFromWishlist } = useWishlist();
  const { addToCart, isInCart } = useCart();

  function notifyMe(book) {
    const msg = `Assalamualaikum! 🌙\n\nCould you let me know when this is back in stock?\n\n📖 ${book.title}\n\nJazakAllahu Khairan!`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noreferrer');
  }

  return (
    <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',fontFamily:"'DM Sans',sans-serif",overflowX:'hidden'}}>
      <PageBackground subtle/>

      <nav style={{position:'sticky',top:0,zIndex:40,height:68,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 clamp(20px,5vw,72px)',backdropFilter:'blur(12px)',background:'rgba(250,249,245,0.88)',borderBottom:'1px solid rgba(27,67,50,0.08)'}}>
        <Link href="/" style={{display:'flex',alignItems:'center',gap:12,textDecoration:'none',color:'#1b4332'}}>
          <Image src="/logo.png" alt="Logo" width={36} height={36} style={{height:36,width:'auto'}}/>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:600,letterSpacing:.5}}>Maktabah An Noor</span>
        </Link>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <Link href="/" style={{textDecoration:'none',padding:'7px 14px',borderRadius:20,fontSize:12,color:'#6b6460',letterSpacing:.3}}>Home</Link>
          <BooksNavDropdown/>
          <Link href="/bundles" style={{textDecoration:'none',padding:'7px 14px',borderRadius:20,fontSize:12,color:'#6b6460',letterSpacing:.3}}>Bundles</Link>
          <Link href="/accessories" style={{textDecoration:'none',padding:'7px 14px',borderRadius:20,fontSize:12,color:'#6b6460',letterSpacing:.3}}>Accessories</Link>
        </div>
      </nav>

      <div style={{position:'relative',zIndex:1,padding:'52px clamp(20px,5vw,72px) 40px',borderBottom:'1px solid rgba(27,67,50,0.07)',background:'linear-gradient(180deg,rgba(27,67,50,0.03),transparent)'}}>
        <div style={{maxWidth:900,margin:'0 auto'}}>
          <div style={{fontSize:10,letterSpacing:'2.5px',textTransform:'uppercase',color:'#b8965a',marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
            <span style={{width:16,height:1,background:'#b8965a',display:'inline-block'}}/>Saved for later
          </div>
          <h1 style={{margin:'0 0 8px',fontFamily:"'Cormorant Garamond',serif",fontWeight:500,fontSize:'clamp(30px,4.5vw,44px)',color:'#1b4332'}}>Your Wishlist</h1>
          <p style={{fontSize:14,color:'#a09890'}}>{items.length} book{items.length !== 1 ? 's' : ''} saved on this device</p>
        </div>
      </div>

      <div style={{position:'relative',zIndex:1,maxWidth:900,margin:'0 auto',padding:'40px clamp(20px,5vw,72px) 100px'}}>
        {items.length === 0 ? (
          <div style={{textAlign:'center',padding:'60px 24px'}}>
            <div style={{fontSize:44,marginBottom:14,opacity:.25}}>♡</div>
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#6b6460',margin:'0 0 20px'}}>Your wishlist is empty.</p>
            <Link href="/books" style={{textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8,background:'#1b4332',color:'#fff',padding:'14px 28px',borderRadius:40,fontSize:13}}>Browse Collection →</Link>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {items.map(book => (
              <div key={book.slug} style={{display:'flex',alignItems:'center',gap:16,padding:'16px 20px',background:'#fff',borderRadius:14,border:'1px solid rgba(27,67,50,0.08)',boxShadow:'0 2px 12px rgba(27,67,50,0.04)'}}>
                <Link href={`/book/${book.slug}`} style={{width:52,height:72,borderRadius:6,overflow:'hidden',flexShrink:0,background:'linear-gradient(155deg,#2d6a4f,#1b4332)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {book.coverUrl ? <img src={book.coverUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:18,color:'#d4ab70'}}>ك</span>}
                </Link>
                <div style={{flex:1,minWidth:0}}>
                  <Link href={`/book/${book.slug}`} style={{textDecoration:'none',color:'#1a1712',fontSize:15,display:'block',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{book.title}</Link>
                  <div style={{fontSize:12,color:'#a09890',marginBottom:4}}>{book.author}</div>
                  {(book.price || book.mrp) && <div style={{fontSize:14,color:'#1b4332',fontWeight:500}}>₹{Number(book.price || book.mrp).toLocaleString('en-IN')}</div>}
                  {!book.inStock && <div style={{fontSize:11,color:'#b44',fontWeight:500,marginTop:2}}>Out of Stock</div>}
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'flex-end',flexShrink:0}}>
                  {book.inStock !== false ? (
                    <button onClick={() => addToCart(book)} style={{padding:'8px 16px',borderRadius:20,border:'none',fontSize:11,fontWeight:500,letterSpacing:.5,textTransform:'uppercase',cursor:'pointer',
                      background: isInCart(book.slug) ? 'rgba(27,67,50,0.08)' : '#1b4332', color: isInCart(book.slug) ? '#1b4332' : '#fff'}}>
                      {isInCart(book.slug) ? '✓ In Cart' : 'Add to Cart'}
                    </button>
                  ) : (
                    <button onClick={() => notifyMe(book)} style={{padding:'8px 16px',borderRadius:20,border:'1.5px solid rgba(184,150,90,0.4)',background:'rgba(184,150,90,0.08)',color:'#b8965a',fontSize:11,fontWeight:500,letterSpacing:.5,textTransform:'uppercase',cursor:'pointer'}}>
                      Notify Me
                    </button>
                  )}
                  <button onClick={() => removeFromWishlist(book.slug)} style={{fontSize:11,color:'#a09890',background:'none',border:'none',cursor:'pointer',padding:0}}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer style={{position:'relative',zIndex:1,background:'#1b4332',padding:'48px clamp(20px,5vw,72px)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:20}}>
        <Link href="/" style={{textDecoration:'none',fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:'#fff'}}>Maktabah An Noor</Link>
        <div dir="rtl" style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:22,color:'#b8965a'}}>مكتبة النور</div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',letterSpacing:1}}>© 2026 · Books That Illuminate The Heart</div>
      </footer>
    </div>
  );
}

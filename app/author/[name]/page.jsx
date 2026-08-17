'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import BooksNavDropdown from '@/components/BooksNavDropdown';
import Image from 'next/image';
import PageBackground from '@/components/PageBackground';
import { useCart } from '@/context/CartContext';

const CAT_AR = {
  Aqeedah:'عقيدة', Fiqh:'فقه', Hadith:'حديث', Tafsir:'تفسير',
  Seerah:'سيرة', 'Manners & Character':'أخلاق', History:'تاريخ',
  'Arabic Language':'لغة', 'Dua & Dhikr':'دعاء', 'Quran & Tajweed':'قرآن', General:'عام',
};

function BookTile({ book }) {
  const { addToCart, isInCart } = useCart();
  const inCart = isInCart(book.slug);
  function handleAdd(e) { e.preventDefault(); e.stopPropagation(); addToCart(book); }

  return (
    <Link href={`/book/${book.slug}`} style={{textDecoration:'none',display:'block',background:'#fff',borderRadius:14,border:'1px solid rgba(27,67,50,0.08)',overflow:'hidden',boxShadow:'0 2px 12px rgba(27,67,50,0.05)',transition:'transform .2s'}}
      onMouseEnter={e=>e.currentTarget.style.transform='translateY(-3px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
      <div style={{aspectRatio:'3/4',background:'linear-gradient(155deg,#2d6a4f,#1b4332)',display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
        {book.coverUrl ? <img src={book.coverUrl} alt={book.title} style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/>
          : <span style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:26,color:'#d4ab70'}}>{CAT_AR[book.category]||'كتاب'}</span>}
        {!book.inStock && (
          <div style={{position:'absolute',inset:0,background:'rgba(26,23,18,0.5)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{color:'#fff',fontSize:10,fontWeight:500,letterSpacing:1,textTransform:'uppercase',border:'1px solid rgba(255,255,255,0.4)',padding:'4px 10px',borderRadius:16}}>Out of Stock</span>
          </div>
        )}
      </div>
      <div style={{padding:'12px 14px'}}>
        <div style={{fontSize:9,color:'#a09890',letterSpacing:.6,textTransform:'uppercase',marginBottom:4}}>{book.category}</div>
        <div style={{fontSize:14,color:'#1a1712',fontWeight:400,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',marginBottom:8}}>{book.title}</div>
        <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:10}}>
          {book.price != null && <span style={{fontSize:15,fontWeight:600,color:'#1b4332'}}>₹{Number(book.price).toLocaleString('en-IN')}</span>}
          {book.mrp > book.price && (
            <>
              <span style={{fontSize:12,color:'#a09890',textDecoration:'line-through'}}>₹{Number(book.mrp).toLocaleString('en-IN')}</span>
              <span style={{fontSize:13,fontWeight:700,color:'#2d6a4f'}}>{Math.round((1 - book.price/book.mrp)*100)}% off</span>
            </>
          )}
        </div>
        {book.inStock !== false && (
          <button onClick={handleAdd} style={{width:'100%',padding:'9px',borderRadius:20,border:'none',fontSize:11,fontWeight:500,letterSpacing:.5,textTransform:'uppercase',cursor:'pointer',
            background: inCart ? 'rgba(27,67,50,0.08)' : '#1b4332', color: inCart ? '#1b4332' : '#fff'}}>
            {inCart ? '✓ Added' : 'Add to Cart'}
          </button>
        )}
      </div>
    </Link>
  );
}

export default function AuthorPage() {
  const { name } = useParams();
  const authorName = decodeURIComponent(name || '');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authorName) return;
    fetch(`/api/books?author=${encodeURIComponent(authorName)}&all=1`)
      .then(r => r.json())
      .then(d => {
        const list = [...(d.books || [])].sort((a, b) => (a.inStock===false?1:0) - (b.inStock===false?1:0));
        setBooks(list); setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [authorName]);

  return (
    <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',fontFamily:"'DM Sans',sans-serif",overflowX:'hidden'}}>
      <PageBackground subtle/>

      <nav style={{position:'sticky',top:0,zIndex:40,height:68,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 clamp(20px,5vw,72px)',backdropFilter:'blur(12px)',background:'rgba(250,249,245,0.88)',borderBottom:'1px solid rgba(27,67,50,0.08)'}}>
        <Link href="/" style={{display:'flex',alignItems:'center',gap:12,textDecoration:'none',color:'#1b4332'}}>
          <Image src="/logo.png" alt="Logo" width={36} height={36} style={{height:36,width:'auto'}}/>
          <span className="site-name-text" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:600,letterSpacing:.5}}>Maktabah An Noor</span>
        </Link>
        <div className="nav-links-scroll" style={{display:'flex',alignItems:'center',gap:6,overflowX:'auto',scrollbarWidth:'none',maxWidth:'70vw'}}>
          <Link href="/" style={{textDecoration:'none',padding:'7px 14px',borderRadius:20,fontSize:12,color:'#6b6460',letterSpacing:.3}}>Home</Link>
          <BooksNavDropdown/>
          <Link href="/bundles" style={{textDecoration:'none',padding:'7px 14px',borderRadius:20,fontSize:12,color:'#6b6460',letterSpacing:.3}}>Bundles</Link>
          <Link href="/accessories" style={{textDecoration:'none',padding:'7px 14px',borderRadius:20,fontSize:12,color:'#6b6460',letterSpacing:.3}}>Accessories</Link>
          <Link href="/wishlist" style={{textDecoration:'none',padding:'7px 14px',borderRadius:20,fontSize:12,color:'#6b6460',letterSpacing:.3}}>♡ Wishlist</Link>
        </div>
      </nav>

      <div style={{position:'relative',zIndex:1,padding:'52px clamp(20px,5vw,72px) 40px',borderBottom:'1px solid rgba(27,67,50,0.07)',background:'linear-gradient(180deg,rgba(27,67,50,0.03),transparent)'}}>
        <div style={{maxWidth:1280,margin:'0 auto'}}>
          <div style={{fontSize:10,letterSpacing:'2.5px',textTransform:'uppercase',color:'#b8965a',marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
            <span style={{width:16,height:1,background:'#b8965a',display:'inline-block'}}/>Author
          </div>
          <h1 style={{margin:'0 0 6px',fontFamily:"'Cormorant Garamond',serif",fontWeight:500,fontSize:'clamp(30px,4.5vw,46px)',color:'#1b4332',lineHeight:1.15}}>{authorName}</h1>
          <p style={{fontSize:14,color:'#a09890'}}>{books.length} book{books.length !== 1 ? 's' : ''} in our collection</p>
        </div>
      </div>

      <div style={{position:'relative',zIndex:1,maxWidth:1280,margin:'0 auto',padding:'44px clamp(20px,5vw,72px) 100px'}}>
        {loading ? (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:18}}>
            {[...Array(4)].map((_,i) => <div key={i} style={{aspectRatio:'3/4.6',borderRadius:14,background:'rgba(27,67,50,0.05)'}}/>)}
          </div>
        ) : books.length === 0 ? (
          <div style={{textAlign:'center',padding:'60px 24px'}}>
            <p style={{color:'#6b6460',marginBottom:20}}>No books found for this author.</p>
            <Link href="/books" style={{textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8,background:'#1b4332',color:'#fff',padding:'14px 28px',borderRadius:40,fontSize:13}}>Browse All Books →</Link>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:18}}>
            {books.map(b => <BookTile key={b.slug} book={b} />)}
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

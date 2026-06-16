'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { IG_URL, IG_HANDLE } from '@/lib/constants';
import PageBackground from '@/components/PageBackground';

const CAT_AR = {
  'Aqeedah':'عقيدة','Fiqh':'فقه','Hadith':'حديث','Tafsir':'تفسير',
  'Seerah':'سيرة','Manners & Character':'أخلاق','History':'تاريخ',
  'Arabic Language':'لغة','Dua & Dhikr':'دعاء','Quran & Tajweed':'قرآن','General':'عام',
};
const COVER_BG = 'linear-gradient(155deg,#2d6a4f 0%,#1b4332 100%)';

export default function BookPage() {
  const { slug } = useParams();
  const [book, setBook]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/books/${slug}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then(d => {
        if (d) { setBook(d.book); setLoading(false); }
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  const Nav = () => (
    <nav style={{position:'sticky',top:0,zIndex:40,height:68,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 clamp(20px,5vw,72px)',backdropFilter:'blur(10px)',background:'rgba(250,249,245,0.85)',borderBottom:'1px solid rgba(27,67,50,0.08)'}}>
      <Link href="/" style={{display:'flex',alignItems:'center',gap:12,textDecoration:'none',color:'#1b4332'}}>
        <Image src="/logo.png" alt="Logo" width={36} height={36} style={{height:36,width:'auto'}}/>
        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:600,letterSpacing:.5}}>Maktabah An Noor</span>
      </Link>
      <div style={{display:'flex',alignItems:'center',gap:24}}>
        <Link href="/"      style={{textDecoration:'none',fontSize:13,color:'#6b6460',letterSpacing:.3}}>Home</Link>
        <Link href="/books" style={{textDecoration:'none',fontSize:13,color:'#6b6460',letterSpacing:.3}}>Collection</Link>
      </div>
    </nav>
  );

  if (loading) return (
    <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',fontFamily:"'DM Sans',sans-serif"}}>
      <PageBackground subtle/>
      <Nav/>
      <div style={{position:'relative',zIndex:1,display:'flex',alignItems:'center',justifyContent:'center',minHeight:'70vh',flexDirection:'column',gap:16}}>
        <div style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:64,color:'rgba(27,67,50,0.1)',animation:'pulseRays 2s ease-in-out infinite'}}>النور</div>
        <div style={{fontSize:13,color:'#a09890',letterSpacing:1}}>Loading…</div>
      </div>
    </div>
  );

  if (notFound || !book) return (
    <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',fontFamily:"'DM Sans',sans-serif"}}>
      <PageBackground subtle/>
      <Nav/>
      <div style={{position:'relative',zIndex:1,textAlign:'center',padding:'100px 24px'}}>
        <div style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:80,color:'rgba(27,67,50,0.08)',marginBottom:20}}>كتاب</div>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,color:'#1b4332',marginBottom:12}}>Book Not Found</h1>
        <p style={{color:'#6b6460',marginBottom:28}}>This book does not exist or may have been removed.</p>
        <Link href="/books" style={{textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8,background:'#1b4332',color:'#fff',padding:'14px 28px',borderRadius:40,fontSize:13}}>← Back to Collection</Link>
      </div>
    </div>
  );

  const ar = CAT_AR[book.category] || 'كتاب';
  const specs = [
    book.binding   && { label:'Binding',   val:book.binding },
    book.volumes   && { label:'Volumes',   val:book.volumes===1?'Single Volume':`${book.volumes} Volumes` },
    book.pages > 0 && { label:'Pages',     val:book.pages },
    book.language  && { label:'Language',  val:book.language },
    book.category  && { label:'Category',  val:book.category },
  ].filter(Boolean);

  return (
    <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',fontFamily:"'DM Sans',sans-serif",overflowX:'hidden'}}>
      <PageBackground subtle/>
      <Nav/>

      {/* BREADCRUMB */}
      <div style={{position:'relative',zIndex:1,padding:'20px clamp(20px,5vw,72px)',borderBottom:'1px solid rgba(27,67,50,0.06)'}}>
        <div style={{maxWidth:1200,margin:'0 auto',display:'flex',alignItems:'center',gap:10,fontSize:12,color:'#a09890',letterSpacing:.5}}>
          <Link href="/"      style={{textDecoration:'none',color:'#a09890'}}>Home</Link>
          <span style={{color:'rgba(27,67,50,0.2)'}}>›</span>
          <Link href="/books" style={{textDecoration:'none',color:'#a09890'}}>Collection</Link>
          <span style={{color:'rgba(27,67,50,0.2)'}}>›</span>
          <span style={{color:'#1b4332'}}>{book.title}</span>
        </div>
      </div>

      {/* MAIN */}
      <div style={{position:'relative',zIndex:1,maxWidth:1200,margin:'0 auto',padding:'56px clamp(20px,5vw,72px) 100px',display:'grid',gridTemplateColumns:'300px 1fr',gap:64,alignItems:'start'}}>

        {/* COVER */}
        <div style={{position:'sticky',top:92}}>
          <div style={{borderRadius:18,overflow:'hidden',boxShadow:'0 20px 60px rgba(27,67,50,0.2)',animation:'floatBook 6s ease-in-out infinite',aspectRatio:'3/4'}}>
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            ) : (
              <div style={{width:'100%',height:'100%',background:COVER_BG,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,padding:32,position:'relative'}}>
                <div style={{position:'absolute',inset:16,border:'1px solid rgba(212,171,112,0.4)',borderRadius:10}}/>
                <span style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:56,color:'#d4ab70'}}>{ar}</span>
                <span style={{color:'rgba(255,255,255,0.4)',fontSize:20}}>✦</span>
                <span style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic',fontSize:20,color:'rgba(255,255,255,0.85)',textAlign:'center',lineHeight:1.3}}>{book.title}</span>
              </div>
            )}
          </div>
          {book.tags?.length > 0 && (
            <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:20,justifyContent:'center'}}>
              {book.tags.map(t => (
                <span key={t} style={{padding:'5px 14px',borderRadius:20,fontSize:10,fontWeight:500,letterSpacing:1,textTransform:'uppercase',
                  background:t==='Bestseller'?'rgba(184,150,90,0.12)':'rgba(27,67,50,0.08)',
                  color:t==='Bestseller'?'#b8965a':'#1b4332',
                  border:`1px solid ${t==='Bestseller'?'rgba(184,150,90,0.3)':'rgba(27,67,50,0.15)'}`}}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* DETAILS */}
        <div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
            <span style={{padding:'5px 14px',background:'rgba(27,67,50,0.07)',borderRadius:20,fontSize:10,fontWeight:500,letterSpacing:1,textTransform:'uppercase',color:'#1b4332'}}>{book.category}</span>
            <span style={{padding:'5px 14px',background:'rgba(184,150,90,0.08)',borderRadius:20,fontSize:10,fontWeight:500,letterSpacing:1,textTransform:'uppercase',color:'#b8965a',border:'1px solid rgba(184,150,90,0.25)'}}>{book.language}</span>
          </div>

          <h1 style={{margin:'0 0 8px',fontFamily:"'Cormorant Garamond',serif",fontWeight:500,fontSize:'clamp(32px,4.5vw,52px)',color:'#1b4332',lineHeight:1.12}}>
            {book.title}
          </h1>
          {book.titleAr && (
            <div dir="rtl" style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:28,color:'#b8965a',marginBottom:16,fontWeight:500}}>{book.titleAr}</div>
          )}

          <div style={{fontSize:16,color:'#6b6460',marginBottom:28,fontWeight:300}}>
            By <span style={{color:'#1a1712',fontWeight:400}}>{book.author}</span>
            {book.authorAr && <span dir="rtl" style={{fontFamily:"'Noto Naskh Arabic',serif",color:'#b8965a',marginRight:10,fontSize:15}}> · {book.authorAr}</span>}
          </div>

          <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:28}}>
            <span style={{flex:1,height:1,background:'linear-gradient(90deg,rgba(27,67,50,0.2),transparent)'}}/>
            <span style={{color:'#b8965a',fontSize:12}}>✦</span>
          </div>

          <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'9px 20px',borderRadius:30,marginBottom:28,
            background:book.inStock?'rgba(45,106,79,0.08)':'rgba(180,60,60,0.06)',
            border:`1px solid ${book.inStock?'rgba(45,106,79,0.2)':'rgba(180,60,60,0.15)'}`,
            color:book.inStock?'#2d6a4f':'#b44444',fontSize:12,fontWeight:500,letterSpacing:1,textTransform:'uppercase'}}>
            <span style={{width:7,height:7,borderRadius:'50%',background:'currentColor'}}/>
            {book.inStock ? 'In Stock' : 'Out of Stock'}
          </div>

          {book.description && (
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic',fontSize:18,color:'#6b6460',lineHeight:1.8,marginBottom:36,paddingBottom:36,borderBottom:'1px solid rgba(27,67,50,0.08)'}}>
              {book.description}
            </p>
          )}

          {specs.length > 0 && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:36}}>
              {specs.map(s => (
                <div key={s.label} style={{padding:'16px 20px',background:'#fff',borderRadius:12,border:'1px solid rgba(27,67,50,0.08)',boxShadow:'0 2px 8px rgba(27,67,50,0.04)'}}>
                  <div style={{fontSize:9,letterSpacing:'2px',textTransform:'uppercase',color:'#b8965a',marginBottom:5}}>{s.label}</div>
                  <div style={{fontSize:15,color:'#1a1712',fontWeight:400}}>{s.val}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{display:'flex',gap:14,flexWrap:'wrap',marginBottom:24}}>
            <a href={`${IG_URL}?text=Assalamualaikum, I would like to order: ${encodeURIComponent(book.title)}`}
              target="_blank" rel="noreferrer"
              style={{textDecoration:'none',display:'inline-flex',alignItems:'center',gap:10,background:'#1b4332',color:'#fff',padding:'16px 32px',borderRadius:40,fontSize:14,letterSpacing:.4,boxShadow:'0 6px 20px rgba(27,67,50,0.25)'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              Order via Instagram →
            </a>
            <Link href="/books"
              style={{textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8,border:'1.5px solid rgba(27,67,50,0.2)',color:'#1b4332',padding:'16px 28px',borderRadius:40,fontSize:14,letterSpacing:.4}}>
              ← Back to Collection
            </Link>
          </div>

          <div style={{padding:'16px 20px',background:'rgba(184,150,90,0.06)',borderRadius:12,border:'1px solid rgba(184,150,90,0.18)',display:'flex',alignItems:'flex-start',gap:12}}>
            <span style={{color:'#b8965a',fontSize:16,marginTop:1}}>✦</span>
            <div>
              <div style={{fontSize:12,fontWeight:500,color:'#1b4332',marginBottom:3,letterSpacing:.3}}>How to Order</div>
              <p style={{margin:0,fontSize:13,color:'#6b6460',lineHeight:1.65,fontWeight:300}}>
                Click the button above to DM us on Instagram, or search <span style={{color:'#1b4332',fontWeight:400}}>{IG_HANDLE}</span> and send us the book name. We&apos;ll confirm availability and arrange swift delivery.
              </p>
            </div>
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
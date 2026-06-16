'use client';
import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import PageBackground from '@/components/PageBackground';
import { CATEGORIES, LANGUAGES, TAGS } from '@/lib/constants';

const CAT_AR = {
  'Aqeedah':'عقيدة','Fiqh':'فقه','Hadith':'حديث','Tafsir':'تفسير',
  'Seerah':'سيرة','Manners & Character':'أخلاق','History':'تاريخ',
  'Arabic Language':'لغة','Dua & Dhikr':'دعاء','Quran & Tajweed':'قرآن','General':'عام',
};
const COVER_BKGS = [
  'linear-gradient(155deg,#2d6a4f 0%,#1b4332 100%)',
  'linear-gradient(155deg,#234f3c 0%,#15291f 100%)',
  'linear-gradient(155deg,#1e3a2f 0%,#0f2218 100%)',
  'linear-gradient(155deg,#2a5a42 0%,#162e21 100%)',
];

function BookGridCard({ book, idx }) {
  const bg = COVER_BKGS[idx % COVER_BKGS.length];
  const ar = CAT_AR[book.category] || 'كتاب';
  const ribbon = book.tags?.includes('Bestseller') ? 'Bestseller'
               : book.tags?.includes('New Arrival') ? 'New Arrival' : null;
  const ribbonBg = ribbon === 'Bestseller' ? '#b8965a' : '#2d6a4f';

  return (
    <Link href={`/book/${book.slug}`} style={{textDecoration:'none',color:'inherit',display:'block',background:'#fff',borderRadius:14,overflow:'hidden',border:'1px solid rgba(27,67,50,0.08)',boxShadow:'0 6px 20px rgba(27,67,50,0.06)',transition:'transform .35s ease,box-shadow .35s ease'}}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-5px)';e.currentTarget.style.boxShadow='0 20px 44px rgba(27,67,50,0.14)';}}
      onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 6px 20px rgba(27,67,50,0.06)';}}>
      <div style={{position:'relative',aspectRatio:'3/4',overflow:'hidden'}}>
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',transition:'transform .55s ease'}}
            onMouseEnter={e=>e.target.style.transform='scale(1.05)'}
            onMouseLeave={e=>e.target.style.transform='scale(1)'}/>
        ) : (
          <div style={{position:'absolute',inset:0,background:bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,padding:20}}>
            <div style={{position:'absolute',inset:10,border:'1px solid rgba(212,171,112,0.4)',borderRadius:6}}/>
            <span style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:36,color:'#d4ab70'}}>{ar}</span>
            <span style={{color:'rgba(255,255,255,0.4)',fontSize:14}}>✦</span>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic',fontSize:15,color:'rgba(255,255,255,0.85)',textAlign:'center',lineHeight:1.25}}>{book.title}</span>
          </div>
        )}
        <span style={{position:'absolute',top:10,left:10,background:'#1b4332',color:'#fff',fontSize:9,letterSpacing:1,textTransform:'uppercase',padding:'4px 10px',borderRadius:20,zIndex:2}}>{book.category}</span>
        {ribbon && <span style={{position:'absolute',top:12,right:-30,transform:'rotate(45deg)',background:ribbonBg,color:'#fff',fontSize:8,letterSpacing:1,textTransform:'uppercase',padding:'4px 36px',zIndex:2}}>{ribbon}</span>}
        {!book.inStock && (
          <div style={{position:'absolute',inset:0,background:'rgba(250,249,245,0.72)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:3}}>
            <span style={{padding:'6px 16px',background:'#1a1712',color:'#fff',fontSize:9,letterSpacing:2,textTransform:'uppercase',borderRadius:20}}>Out of Stock</span>
          </div>
        )}
      </div>
      <div style={{padding:'16px 16px 20px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginBottom:8}}>
          <span style={{fontSize:9,letterSpacing:1,textTransform:'uppercase',color:'#b8965a',fontWeight:500}}>{book.language}</span>
          {book.binding && <span style={{fontSize:9,color:'#a09890',letterSpacing:.5}}>{book.binding}</span>}
        </div>
        <h3 style={{margin:'0 0 4px',fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:18,color:'#1a1712',lineHeight:1.2}}>{book.title}</h3>
        {book.titleAr && <div style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:14,color:'#b8965a',marginBottom:4,direction:'rtl'}}>{book.titleAr}</div>}
        <div style={{fontSize:12,color:'#6b6460',fontWeight:300}}>{book.author}</div>
        {book.volumes > 1 && <div style={{marginTop:6,fontSize:10,color:'#b8965a',letterSpacing:.5}}>{book.volumes} Volumes</div>}
      </div>
    </Link>
  );
}

function BooksContent() {
  const searchParams = useSearchParams();
  const [books, setBooks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [selCat, setSelCat]     = useState(searchParams.get('category') || '');
  const [selLang, setSelLang]   = useState(searchParams.get('language') || '');
  const [selTag, setSelTag]     = useState(searchParams.get('tag') || '');
  const [selStock, setSelStock] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const backdropRef = useRef(null);

  useEffect(() => {
    fetch('/api/books').then(r=>r.json()).then(d=>{setBooks(d.books||[]);setLoading(false);}).catch(()=>setLoading(false));
  }, []);

  useEffect(() => {
    if (menuRef.current) menuRef.current.style.transform = menuOpen ? 'translateX(0)' : 'translateX(-100%)';
    if (backdropRef.current) {
      backdropRef.current.style.opacity = menuOpen ? '1' : '0';
      backdropRef.current.style.pointerEvents = menuOpen ? 'auto' : 'none';
    }
  }, [menuOpen]);

  const filtered = useMemo(() => books.filter(b => {
    const q = search.toLowerCase();
    return (!q || b.title?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q) || b.titleAr?.includes(q))
      && (!selCat  || b.category === selCat)
      && (!selLang || b.language === selLang)
      && (!selTag  || b.tags?.includes(selTag))
      && (!selStock|| (selStock==='in'?b.inStock:!b.inStock));
  }), [books, search, selCat, selLang, selTag, selStock]);

  const hasFilters = selCat || selLang || selTag || selStock || search;
  function clear() { setSelCat(''); setSelLang(''); setSelTag(''); setSelStock(''); setSearch(''); }

  const FilterSection = ({ title, options, value, onToggle }) => (
    <div style={{marginBottom:28}}>
      <div style={{fontSize:9,letterSpacing:'2.5px',textTransform:'uppercase',color:'#b8965a',fontWeight:500,marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
        <span style={{width:14,height:1,background:'#b8965a',display:'inline-block'}}/>
        {title}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {options.map(opt => (
          <label key={opt} style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',fontSize:13,color:value===opt?'#1b4332':'#6b6460',fontWeight:value===opt?'400':'300',transition:'color .2s'}}>
            <span style={{width:16,height:16,borderRadius:'50%',border:`1.5px solid ${value===opt?'#1b4332':'rgba(27,67,50,0.25)'}`,background:value===opt?'#1b4332':'transparent',flexShrink:0,transition:'all .2s',display:'flex',alignItems:'center',justifyContent:'center'}}>
              {value===opt && <span style={{width:6,height:6,borderRadius:'50%',background:'#fff'}}/>}
            </span>
            <span onClick={()=>onToggle(value===opt?'':opt)}>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const Sidebar = () => (
    <div style={{display:'flex',flexDirection:'column'}}>
      {hasFilters && (
        <button onClick={clear} style={{marginBottom:24,padding:'8px 0',background:'none',border:'none',color:'#b8965a',fontSize:11,letterSpacing:'1.5px',textTransform:'uppercase',cursor:'pointer',textAlign:'left',borderBottom:'1px solid rgba(184,150,90,0.3)',paddingBottom:10}}>✕ Clear all filters</button>
      )}
      <FilterSection title="Category" options={CATEGORIES} value={selCat} onToggle={setSelCat}/>
      <div style={{height:1,background:'rgba(27,67,50,0.08)',margin:'4px 0 24px'}}/>
      <FilterSection title="Language" options={LANGUAGES} value={selLang} onToggle={setSelLang}/>
      <div style={{height:1,background:'rgba(27,67,50,0.08)',margin:'4px 0 24px'}}/>
      <FilterSection title="Tags" options={TAGS} value={selTag} onToggle={setSelTag}/>
      <div style={{height:1,background:'rgba(27,67,50,0.08)',margin:'4px 0 24px'}}/>
      <FilterSection title="Availability" options={['In Stock','Out of Stock']} value={selStock==='in'?'In Stock':selStock==='out'?'Out of Stock':''} onToggle={v=>setSelStock(v==='In Stock'?'in':v==='Out of Stock'?'out':'')}/>
    </div>
  );

  return (
    <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',fontFamily:"'DM Sans',sans-serif",overflowX:'hidden'}}>
      <PageBackground subtle/>

      {/* NAV */}
      <nav style={{position:'sticky',top:0,zIndex:40,height:68,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 clamp(20px,5vw,72px)',backdropFilter:'blur(10px)',background:'rgba(250,249,245,0.85)',borderBottom:'1px solid rgba(27,67,50,0.08)'}}>
        <Link href="/" style={{display:'flex',alignItems:'center',gap:12,textDecoration:'none',color:'#1b4332'}}>
          <Image src="/logo.png" alt="Logo" width={36} height={36} style={{height:36,width:'auto'}}/>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:600,letterSpacing:.5}}>Maktabah An Noor</span>
        </Link>
        <div style={{display:'flex',alignItems:'center',gap:24}}>
          <Link href="/"      style={{textDecoration:'none',fontSize:13,color:'#6b6460',letterSpacing:.3,transition:'color .2s'}} onMouseEnter={e=>e.target.style.color='#b8965a'} onMouseLeave={e=>e.target.style.color='#6b6460'}>Home</Link>
          <Link href="/books" style={{textDecoration:'none',fontSize:13,color:'#1b4332',letterSpacing:.3,fontWeight:500,borderBottom:'1.5px solid #1b4332',paddingBottom:1}}>Books</Link>
        </div>
        {/* Mobile filter btn */}
        <button onClick={()=>setMenuOpen(o=>!o)} style={{display:'none',padding:'8px 16px',background:'#1b4332',color:'#fff',border:'none',borderRadius:30,fontSize:12,cursor:'pointer',letterSpacing:.5}} className="mob-filter-btn">Filters</button>
      </nav>

      {/* HERO HEADER */}
      <div style={{position:'relative',zIndex:1,padding:'72px clamp(20px,5vw,72px) 56px',borderBottom:'1px solid rgba(27,67,50,0.08)',background:'linear-gradient(180deg,rgba(27,67,50,0.03) 0%,transparent 100%)',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'50%',right:'5%',transform:'translateY(-50%)',fontFamily:"'Noto Naskh Arabic',serif",fontSize:180,color:'rgba(27,67,50,0.04)',pointerEvents:'none',animation:'calliA 30s ease-in-out infinite',lineHeight:1}}>الكتب</div>
        <div style={{maxWidth:1200,margin:'0 auto',position:'relative'}}>
          <div style={{fontSize:10,letterSpacing:'3px',textTransform:'uppercase',color:'#b8965a',marginBottom:14,display:'flex',alignItems:'center',gap:10}}>
            <span style={{width:18,height:1,background:'#b8965a'}}/>✦ Islamic Bookstore
          </div>
          <h1 style={{margin:'0 0 8px',fontFamily:"'Cormorant Garamond',serif",fontWeight:500,fontSize:'clamp(40px,5vw,62px)',color:'#1b4332',lineHeight:1.1}}>Our Collection</h1>
          <div dir="rtl" style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:28,color:'#b8965a',marginBottom:14,display:'inline-block'}}>مجموعتنا</div>
          <p style={{margin:0,fontSize:15,color:'#6b6460',fontWeight:300,maxWidth:480,lineHeight:1.7}}>Browse our complete library of premium Islamic books — Arabic, Urdu, English and more.</p>
        </div>
      </div>

      {/* MAIN */}
      <div style={{position:'relative',zIndex:1,maxWidth:1280,margin:'0 auto',padding:'40px clamp(20px,5vw,72px) 80px',display:'grid',gridTemplateColumns:'220px 1fr',gap:48,alignItems:'start'}}>

        {/* SIDEBAR */}
        <aside style={{position:'sticky',top:88,background:'#fff',border:'1px solid rgba(27,67,50,0.08)',borderRadius:16,padding:'28px 24px',boxShadow:'0 4px 16px rgba(27,67,50,0.05)'}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:500,color:'#1b4332',marginBottom:24,paddingBottom:16,borderBottom:'1px solid rgba(27,67,50,0.08)'}}>Filter Books</div>
          <Sidebar/>
        </aside>

        {/* BOOKS MAIN */}
        <div>
          {/* Search + count */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,marginBottom:28,flexWrap:'wrap'}}>
            <div style={{position:'relative',flex:1,maxWidth:400}}>
              <svg style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',width:15,height:15,color:'#a09890'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="text" placeholder="Search by title or author…" value={search} onChange={e=>setSearch(e.target.value)}
                style={{width:'100%',padding:'12px 16px 12px 42px',background:'#fff',border:'1.5px solid rgba(27,67,50,0.12)',borderRadius:40,fontSize:13,fontFamily:"'DM Sans',sans-serif",color:'#1a1712',outline:'none',transition:'border-color .2s'}}
                onFocus={e=>e.target.style.borderColor='#1b4332'}
                onBlur={e=>e.target.style.borderColor='rgba(27,67,50,0.12)'}/>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              {hasFilters && <button onClick={clear} style={{padding:'8px 16px',background:'rgba(184,150,90,0.1)',border:'1px solid rgba(184,150,90,0.3)',borderRadius:20,fontSize:11,color:'#b8965a',cursor:'pointer',letterSpacing:.5,textTransform:'uppercase'}}>Clear</button>}
              <span style={{fontSize:12,color:'#a09890',letterSpacing:.5}}>{loading?'Loading…':`${filtered.length} book${filtered.length!==1?'s':''}`}</span>
            </div>
          </div>

          {/* Active filter pills */}
          {hasFilters && (
            <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:24}}>
              {selCat  && <span style={{padding:'5px 14px',background:'rgba(27,67,50,0.08)',borderRadius:20,fontSize:11,color:'#1b4332',letterSpacing:.5}}>{selCat} ×</span>}
              {selLang && <span style={{padding:'5px 14px',background:'rgba(27,67,50,0.08)',borderRadius:20,fontSize:11,color:'#1b4332',letterSpacing:.5}}>{selLang} ×</span>}
              {selTag  && <span style={{padding:'5px 14px',background:'rgba(184,150,90,0.1)',borderRadius:20,fontSize:11,color:'#b8965a',letterSpacing:.5}}>{selTag} ×</span>}
              {selStock&& <span style={{padding:'5px 14px',background:'rgba(27,67,50,0.08)',borderRadius:20,fontSize:11,color:'#1b4332',letterSpacing:.5}}>{selStock==='in'?'In Stock':'Out of Stock'} ×</span>}
              {search  && <span style={{padding:'5px 14px',background:'rgba(27,67,50,0.08)',borderRadius:20,fontSize:11,color:'#1b4332',letterSpacing:.5}}>&ldquo;{search}&rdquo; ×</span>}
            </div>
          )}

          {loading ? (
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
              {[...Array(6)].map((_,i)=>(
                <div key={i} style={{borderRadius:14,overflow:'hidden',border:'1px solid rgba(27,67,50,0.07)'}}>
                  <div style={{aspectRatio:'3/4',background:'linear-gradient(90deg,#f3f1ea,#faf9f5,#f3f1ea)',backgroundSize:'200% 100%',animation:'skeletonShimmer 1.6s linear infinite',animationDelay:`${i*0.1}s`}}/>
                  <div style={{padding:16}}>
                    <div style={{height:12,background:'rgba(27,67,50,0.06)',borderRadius:6,marginBottom:8}}/>
                    <div style={{height:10,background:'rgba(27,67,50,0.04)',borderRadius:6,width:'60%'}}/>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
              {filtered.map((b,i) => <BookGridCard key={b.slug} book={b} idx={i}/>)}
            </div>
          ) : (
            <div style={{textAlign:'center',padding:'80px 0'}}>
              <div style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:60,color:'rgba(27,67,50,0.1)',marginBottom:16}}>كتب</div>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'#6b6460',marginBottom:20}}>No books found.</p>
              <button onClick={clear} style={{padding:'12px 28px',background:'#1b4332',color:'#fff',border:'none',borderRadius:40,fontSize:13,cursor:'pointer',letterSpacing:.5}}>Clear Filters</button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <div ref={backdropRef} onClick={()=>setMenuOpen(false)} style={{position:'fixed',inset:0,zIndex:50,background:'rgba(21,41,31,0.5)',backdropFilter:'blur(4px)',opacity:0,pointerEvents:'none',transition:'opacity .3s ease'}}/>
      <div ref={menuRef} style={{position:'fixed',top:0,left:0,bottom:0,zIndex:51,width:'min(85vw,320px)',background:'#faf9f5',padding:'28px 24px',transform:'translateX(-100%)',transition:'transform .4s cubic-bezier(.4,0,.2,1)',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28}}>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:500,color:'#1b4332'}}>Filters</span>
          <button onClick={()=>setMenuOpen(false)} style={{width:36,height:36,border:'1px solid rgba(27,67,50,0.15)',borderRadius:8,background:'transparent',color:'#1b4332',cursor:'pointer',fontSize:16}}>✕</button>
        </div>
        <Sidebar/>
      </div>

      {/* Footer */}
      <footer style={{position:'relative',zIndex:1,background:'#1b4332',padding:'48px clamp(20px,5vw,72px)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:20}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:'#fff'}}>Maktabah An Noor</div>
        <div dir="rtl" style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:22,color:'#b8965a'}}>مكتبة النور</div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',letterSpacing:1}}>© 2025 · Books That Illuminate The Heart</div>
      </footer>
    </div>
  );
}

export default function BooksPage() {
  return (
    <Suspense fallback={
      <div style={{minHeight:'100vh',background:'#faf9f5',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:48,color:'rgba(27,67,50,0.15)',animation:'pulseRays 2s ease-in-out infinite'}}>النور</div>
      </div>
    }>
      <BooksContent/>
    </Suspense>
  );
}

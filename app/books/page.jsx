'use client';
import { useState, useEffect, useMemo, useRef, Suspense, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import PageBackground from '@/components/PageBackground';
import { CATEGORIES, LANGUAGES, TAGS } from '@/lib/constants';
import { useCart } from '@/context/CartContext';

/* ── constants ── */
const COVER_BKGS = [
  'linear-gradient(155deg,#2d6a4f 0%,#1b4332 100%)',
  'linear-gradient(155deg,#234f3c 0%,#15291f 100%)',
  'linear-gradient(155deg,#1e3a2f 0%,#0f2218 100%)',
  'linear-gradient(155deg,#2a5a42 0%,#162e21 100%)',
];
const CAT_AR = {
  'Aqeedah':'عقيدة','Fiqh':'فقه','Hadith':'حديث','Tafsir':'تفسير',
  'Seerah':'سيرة','Manners & Character':'أخلاق','History':'تاريخ',
  'Arabic Language':'لغة','Dua & Dhikr':'دعاء','Quran & Tajweed':'قرآن','General':'عام',
};
const SORT_OPTIONS = [
  { val:'newest',   label:'Newest Added' },
  { val:'oldest',   label:'Oldest Added' },
  { val:'title-az', label:'Title: A → Z' },
  { val:'title-za', label:'Title: Z → A' },
  { val:'author-az',label:'Author: A → Z' },
  { val:'category', label:'By Category' },
];

/* ── Book card — grid mode ── */
function GridCard({ book, idx }) {
  const bg  = COVER_BKGS[idx % COVER_BKGS.length];
  const ar  = CAT_AR[book.category] || 'كتاب';
  const tag = book.tags?.includes('New Arrival') ? 'New Arrival'
            : book.tags?.includes('Bestseller')  ? 'Bestseller'  : null;
  const { addToCart, isInCart } = useCart();
  const inCart = isInCart(book.slug);

  function handleAddToCart(e) {
    e.preventDefault();
    e.stopPropagation();
    addToCart(book);
  }

  return (
    <Link href={`/book/${book.slug}`} style={{textDecoration:'none',color:'inherit',display:'flex',flexDirection:'column',background:'#fff',borderRadius:16,overflow:'hidden',border:'1px solid rgba(27,67,50,0.07)',boxShadow:'0 4px 16px rgba(27,67,50,0.05)',transition:'transform .3s,box-shadow .3s'}}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-5px)';e.currentTarget.style.boxShadow='0 18px 40px rgba(27,67,50,0.13)';}}
      onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 4px 16px rgba(27,67,50,0.05)';}}>
      <div style={{position:'relative',aspectRatio:'3/4',overflow:'hidden',flexShrink:0}}>
        {book.coverUrl
          ? <img src={book.coverUrl} alt={book.title} loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform .4s'}}
              onMouseEnter={e=>e.target.style.transform='scale(1.04)'}
              onMouseLeave={e=>e.target.style.transform='scale(1)'}/>
          : <div style={{width:'100%',height:'100%',background:bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,padding:20}}>
              <div style={{position:'absolute',inset:10,border:'1px solid rgba(212,171,112,0.38)',borderRadius:6}}/>
              <span style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:32,color:'#d4ab70'}}>{ar}</span>
              <span style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic',fontSize:14,color:'rgba(255,255,255,0.85)',textAlign:'center',lineHeight:1.25}}>{book.title}</span>
            </div>
        }
        <span style={{position:'absolute',top:10,left:10,background:'rgba(27,67,50,0.88)',backdropFilter:'blur(4px)',color:'#fff',fontSize:9,letterSpacing:1.2,textTransform:'uppercase',padding:'4px 10px',borderRadius:20}}>{book.category}</span>
        {tag && <span style={{position:'absolute',top:10,right:10,background:tag==='Bestseller'?'rgba(184,150,90,0.9)':'rgba(45,106,79,0.9)',backdropFilter:'blur(4px)',color:'#fff',fontSize:9,letterSpacing:1,textTransform:'uppercase',padding:'4px 10px',borderRadius:20}}>{tag}</span>}
        {!book.inStock && <div style={{position:'absolute',inset:0,background:'rgba(250,249,245,0.65)',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{padding:'6px 14px',background:'#1a1712',color:'#fff',fontSize:9,letterSpacing:1.5,textTransform:'uppercase',borderRadius:20}}>Out of Stock</span></div>}
      </div>
      <div style={{padding:'14px 16px 18px',flex:1,display:'flex',flexDirection:'column',gap:6}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:9,letterSpacing:1.2,textTransform:'uppercase',color:'#b8965a'}}>{book.language}</span>
          {book.binding && <span style={{fontSize:9,color:'#c0b8b0'}}>{book.binding}</span>}
        </div>
        <h3 style={{margin:0,fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:17,color:'#1a1712',lineHeight:1.2}}>{book.title}</h3>
        {book.titleAr && <div style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:13,color:'#b8965a',direction:'rtl'}}>{book.titleAr}</div>}
        <div style={{fontSize:12,color:'#6b6460',fontWeight:300,marginTop:'auto',paddingTop:4}}>{book.author}</div>
        {book.volumes > 1 && <div style={{fontSize:10,color:'#b8965a',letterSpacing:.5}}>{book.volumes} Volumes</div>}
        {book.inStock !== false && (
          <button className={`book-add-to-cart${inCart?' book-add-to-cart--in':''}`} onClick={handleAddToCart}>
            {inCart
              ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Added</>
              : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>Add to Cart</>
            }
          </button>
        )}
      </div>
    </Link>
  );
}

/* ── Book card — list mode ── */
function ListCard({ book }) {
  const bg = COVER_BKGS[0];
  const ar = CAT_AR[book.category] || 'كتاب';
  return (
    <Link href={`/book/${book.slug}`} style={{textDecoration:'none',color:'inherit',display:'flex',alignItems:'center',gap:20,background:'#fff',borderRadius:14,border:'1px solid rgba(27,67,50,0.07)',boxShadow:'0 2px 10px rgba(27,67,50,0.04)',padding:'16px 20px',transition:'border-color .2s,box-shadow .2s'}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(27,67,50,0.2)';e.currentTarget.style.boxShadow='0 6px 20px rgba(27,67,50,0.1)';}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(27,67,50,0.07)';e.currentTarget.style.boxShadow='0 2px 10px rgba(27,67,50,0.04)';}}>
      <div style={{width:56,height:74,borderRadius:8,overflow:'hidden',flexShrink:0}}>
        {book.coverUrl
          ? <img src={book.coverUrl} alt={book.title} loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          : <div style={{width:'100%',height:'100%',background:bg,display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:18,color:'#d4ab70'}}>{ar}</span></div>
        }
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
          <span style={{padding:'2px 10px',background:'rgba(27,67,50,0.07)',borderRadius:10,fontSize:9,letterSpacing:1,textTransform:'uppercase',color:'#1b4332'}}>{book.category}</span>
          <span style={{fontSize:9,color:'#b8965a',letterSpacing:1,textTransform:'uppercase'}}>{book.language}</span>
          {book.tags?.includes('New Arrival') && <span style={{padding:'2px 10px',background:'rgba(45,106,79,0.1)',borderRadius:10,fontSize:9,letterSpacing:1,textTransform:'uppercase',color:'#2d6a4f'}}>New Arrival</span>}
          {book.tags?.includes('Bestseller') && <span style={{padding:'2px 10px',background:'rgba(184,150,90,0.1)',borderRadius:10,fontSize:9,letterSpacing:1,textTransform:'uppercase',color:'#b8965a'}}>Bestseller</span>}
        </div>
        <h3 style={{margin:'0 0 3px',fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:19,color:'#1a1712',lineHeight:1.2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{book.title}</h3>
        {book.titleAr && <div style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:14,color:'#b8965a',direction:'rtl',marginBottom:3}}>{book.titleAr}</div>}
        <div style={{fontSize:13,color:'#6b6460',fontWeight:300}}>{book.author}{book.authorAr && <span style={{fontFamily:"'Noto Naskh Arabic',serif",marginRight:8,color:'#b8965a',direction:'rtl',display:'inline'}}> · {book.authorAr}</span>}</div>
      </div>
      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6,flexShrink:0}}>
        {book.binding && <span style={{fontSize:11,color:'#a09890'}}>{book.binding}</span>}
        {book.volumes > 1 && <span style={{fontSize:11,color:'#b8965a'}}>{book.volumes} Vols</span>}
        <span style={{padding:'4px 12px',borderRadius:20,fontSize:9,fontWeight:500,letterSpacing:.8,textTransform:'uppercase',background:book.inStock?'rgba(45,106,79,0.08)':'rgba(180,60,60,0.07)',color:book.inStock?'#2d6a4f':'#b44',border:`1px solid ${book.inStock?'rgba(45,106,79,0.2)':'rgba(180,60,60,0.15)'}`}}>
          {book.inStock ? 'In Stock' : 'Out of Stock'}
        </span>
        {book.inStock !== false && (
          <AddToCartListBtn book={book}/>
        )}
      </div>
    </Link>
  );
}

function AddToCartListBtn({ book }) {
  const { addToCart, isInCart } = useCart();
  const inCart = isInCart(book.slug);
  function handleAddToCart(e) { e.preventDefault(); e.stopPropagation(); addToCart(book); }
  return (
    <button className={`book-add-to-cart${inCart?' book-add-to-cart--in':''}`} onClick={handleAddToCart} style={{marginTop:4}}>
      {inCart
        ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Added</>
        : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>Add to Cart</>
      }
    </button>
  );
}

/* ── Skeleton ── */
function Skeleton({ view }) {
  if (view === 'list') return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {[...Array(6)].map((_,i) => (
        <div key={i} style={{display:'flex',alignItems:'center',gap:20,background:'#fff',borderRadius:14,border:'1px solid rgba(27,67,50,0.07)',padding:'16px 20px'}}>
          <div style={{width:56,height:74,borderRadius:8,background:'linear-gradient(90deg,#f3f1ea,#faf9f5,#f3f1ea)',backgroundSize:'200% 100%',animation:`skeletonShimmer 1.5s linear infinite`,animationDelay:`${i*0.1}s`,flexShrink:0}}/>
          <div style={{flex:1,display:'flex',flexDirection:'column',gap:8}}>
            <div style={{height:10,width:'30%',background:'linear-gradient(90deg,#f3f1ea,#faf9f5,#f3f1ea)',backgroundSize:'200% 100%',animation:`skeletonShimmer 1.5s linear infinite`,borderRadius:6}}/>
            <div style={{height:16,width:'60%',background:'linear-gradient(90deg,#f3f1ea,#faf9f5,#f3f1ea)',backgroundSize:'200% 100%',animation:`skeletonShimmer 1.5s linear infinite`,borderRadius:6}}/>
            <div style={{height:10,width:'40%',background:'linear-gradient(90deg,#f3f1ea,#faf9f5,#f3f1ea)',backgroundSize:'200% 100%',animation:`skeletonShimmer 1.5s linear infinite`,borderRadius:6}}/>
          </div>
        </div>
      ))}
    </div>
  );
  return (
    <div style={{display:'grid',gridTemplateColumns:`repeat(${view==='2col'?2:3},1fr)`,gap:20}}>
      {[...Array(6)].map((_,i) => (
        <div key={i} style={{borderRadius:16,overflow:'hidden',border:'1px solid rgba(27,67,50,0.07)'}}>
          <div style={{aspectRatio:'3/4',background:'linear-gradient(90deg,#f3f1ea,#faf9f5,#f3f1ea)',backgroundSize:'200% 100%',animation:`skeletonShimmer 1.5s linear infinite`,animationDelay:`${i*0.1}s`}}/>
          <div style={{padding:16,display:'flex',flexDirection:'column',gap:8}}>
            <div style={{height:10,width:'40%',background:'linear-gradient(90deg,#f3f1ea,#faf9f5,#f3f1ea)',backgroundSize:'200% 100%',animation:`skeletonShimmer 1.5s linear infinite`,borderRadius:6}}/>
            <div style={{height:14,background:'linear-gradient(90deg,#f3f1ea,#faf9f5,#f3f1ea)',backgroundSize:'200% 100%',animation:`skeletonShimmer 1.5s linear infinite`,borderRadius:6}}/>
            <div style={{height:10,width:'60%',background:'linear-gradient(90deg,#f3f1ea,#faf9f5,#f3f1ea)',backgroundSize:'200% 100%',animation:`skeletonShimmer 1.5s linear infinite`,borderRadius:6}}/>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main component ── */
function BooksContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [allBooks, setAllBooks]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState(searchParams.get('q') || '');
  const [selCat, setSelCat]       = useState(searchParams.get('category') || '');
  const [selLang, setSelLang]     = useState(searchParams.get('language') || '');
  const [selTag, setSelTag]       = useState(searchParams.get('tag') || '');
  const [selStock, setSelStock]   = useState(searchParams.get('stock') || '');
  const [sortBy, setSortBy]       = useState(searchParams.get('sort') || 'newest');
  const [view, setView]           = useState('3col');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef   = useRef(null);
  const backdropRef = useRef(null);

  useEffect(() => {
    fetch('/api/books')
      .then(r => r.json())
      .then(d => { setAllBooks(d.books || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Sync URL when filters change
  useEffect(() => {
    const p = new URLSearchParams();
    if (search)   p.set('q', search);
    if (selCat)   p.set('category', selCat);
    if (selLang)  p.set('language', selLang);
    if (selTag)   p.set('tag', selTag);
    if (selStock) p.set('stock', selStock);
    if (sortBy !== 'newest') p.set('sort', sortBy);
    router.replace(`/books${p.toString() ? '?' + p.toString() : ''}`, { scroll: false });
  }, [search, selCat, selLang, selTag, selStock, sortBy]);

  useEffect(() => {
    if (drawerRef.current)   drawerRef.current.style.transform   = drawerOpen ? 'translateX(0)' : 'translateX(-100%)';
    if (backdropRef.current) {
      backdropRef.current.style.opacity       = drawerOpen ? '1' : '0';
      backdropRef.current.style.pointerEvents = drawerOpen ? 'auto' : 'none';
    }
  }, [drawerOpen]);

  // Category counts
  const catCounts = useMemo(() => {
    const counts = {};
    allBooks.forEach(b => { counts[b.category] = (counts[b.category] || 0) + 1; });
    return counts;
  }, [allBooks]);

  const langCounts = useMemo(() => {
    const counts = {};
    allBooks.forEach(b => { counts[b.language] = (counts[b.language] || 0) + 1; });
    return counts;
  }, [allBooks]);

  const tagCounts = useMemo(() => {
    const counts = {};
    allBooks.forEach(b => b.tags?.forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
    return counts;
  }, [allBooks]);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = allBooks.filter(b => {
      const q = search.toLowerCase();
      return (!q || b.title?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q) || b.titleAr?.includes(q) || b.authorAr?.includes(q))
          && (!selCat  || b.category === selCat)
          && (!selLang || b.language === selLang)
          && (!selTag  || b.tags?.includes(selTag))
          && (!selStock|| (selStock === 'in' ? b.inStock : !b.inStock));
    });

    // Sort
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'newest':    return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':    return new Date(a.createdAt) - new Date(b.createdAt);
        case 'title-az':  return (a.title||'').localeCompare(b.title||'');
        case 'title-za':  return (b.title||'').localeCompare(a.title||'');
        case 'author-az': return (a.author||'').localeCompare(b.author||'');
        case 'category':  return (a.category||'').localeCompare(b.category||'');
        default:          return 0;
      }
    });
    return list;
  }, [allBooks, search, selCat, selLang, selTag, selStock, sortBy]);

  const hasFilters = selCat || selLang || selTag || selStock || search;
  const activeFilters = [
    selCat   && { label: selCat,    clear: () => setSelCat('') },
    selLang  && { label: selLang,   clear: () => setSelLang('') },
    selTag   && { label: selTag,    clear: () => setSelTag('') },
    selStock && { label: selStock === 'in' ? 'In Stock' : 'Out of Stock', clear: () => setSelStock('') },
    search   && { label: `"${search}"`, clear: () => setSearch('') },
  ].filter(Boolean);

  function clearAll() { setSelCat(''); setSelLang(''); setSelTag(''); setSelStock(''); setSearch(''); }

  const gridCols = view === '2col' ? 2 : view === 'list' ? 1 : 3;

  const FilterSection = ({ title, options, value, onSet, counts }) => (
    <div style={{marginBottom:24}}>
      <div style={{fontSize:9,letterSpacing:'2.5px',textTransform:'uppercase',color:'#b8965a',fontWeight:500,marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
        <span style={{width:12,height:1,background:'#b8965a',display:'inline-block'}}/>
        {title}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {options.filter(o => !counts || counts[o] > 0).map(opt => (
          <label key={opt} onClick={() => onSet(value === opt ? '' : opt)}
            style={{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',fontSize:13,color:value===opt?'#1b4332':'#6b6460',fontWeight:value===opt?'500':'300',transition:'color .15s',padding:'2px 0',userSelect:'none'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${value===opt?'#1b4332':'rgba(27,67,50,0.22)'}`,background:value===opt?'#1b4332':'transparent',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}>
                {value===opt && <svg width="8" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </span>
              {opt}
            </div>
            {counts && counts[opt] && <span style={{fontSize:10,color:value===opt?'#1b4332':'#c0b8b0',background:'rgba(27,67,50,0.06)',padding:'1px 7px',borderRadius:10}}>{counts[opt]}</span>}
          </label>
        ))}
      </div>
    </div>
  );

  const SidebarContent = () => (
    <div style={{display:'flex',flexDirection:'column'}}>
      {hasFilters && (
        <button onClick={clearAll} style={{marginBottom:20,padding:'8px 0 10px',background:'none',border:'none',borderBottom:'1px solid rgba(184,150,90,0.2)',color:'#b8965a',fontSize:11,letterSpacing:'1.5px',textTransform:'uppercase',cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:8}}>
          <span>✕</span> Clear all filters
        </button>
      )}
      <FilterSection title="Category"     options={CATEGORIES} value={selCat}   onSet={setSelCat}   counts={catCounts}/>
      <div style={{height:1,background:'rgba(27,67,50,0.07)',margin:'4px 0 20px'}}/>
      <FilterSection title="Language"     options={LANGUAGES}  value={selLang}  onSet={setSelLang}  counts={langCounts}/>
      <div style={{height:1,background:'rgba(27,67,50,0.07)',margin:'4px 0 20px'}}/>
      <FilterSection title="Tags"         options={TAGS}       value={selTag}   onSet={setSelTag}   counts={tagCounts}/>
      <div style={{height:1,background:'rgba(27,67,50,0.07)',margin:'4px 0 20px'}}/>
      <FilterSection title="Availability" options={['In Stock','Out of Stock']} value={selStock==='in'?'In Stock':selStock==='out'?'Out of Stock':''}
        onSet={v => setSelStock(v==='In Stock'?'in':v==='Out of Stock'?'out':'')}/>
    </div>
  );

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
          <Link href="/" style={{textDecoration:'none',padding:'7px 14px',borderRadius:20,fontSize:12,color:'#6b6460',letterSpacing:.3,transition:'color .15s,background .15s'}} onMouseEnter={e=>{e.currentTarget.style.color='#1b4332';e.currentTarget.style.background='rgba(27,67,50,0.05)';}} onMouseLeave={e=>{e.currentTarget.style.color='#6b6460';e.currentTarget.style.background='transparent';}}>Home</Link>
          <Link href="/books" style={{textDecoration:'none',padding:'7px 14px',borderRadius:20,fontSize:12,color:'#1b4332',fontWeight:500,background:'rgba(27,67,50,0.07)'}}>Books</Link>
        </div>
      </nav>

      {/* PAGE HEADER */}
      <div style={{position:'relative',zIndex:1,padding:'52px clamp(20px,5vw,72px) 40px',borderBottom:'1px solid rgba(27,67,50,0.07)',background:'linear-gradient(180deg,rgba(27,67,50,0.03),transparent)',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'50%',right:'4%',transform:'translateY(-50%)',fontFamily:"'Noto Naskh Arabic',serif",fontSize:160,color:'rgba(27,67,50,0.04)',pointerEvents:'none',animation:'calliA 30s ease-in-out infinite',lineHeight:1}}>الكتب</div>
        <div style={{maxWidth:1280,margin:'0 auto',position:'relative',display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
          <div>
            <div style={{fontSize:10,letterSpacing:'3px',textTransform:'uppercase',color:'#b8965a',marginBottom:10,display:'flex',alignItems:'center',gap:10}}>
              <span style={{width:18,height:1,background:'#b8965a',display:'inline-block'}}/>✦ Islamic Bookstore
            </div>
            <h1 style={{margin:'0 0 6px',fontFamily:"'Cormorant Garamond',serif",fontWeight:500,fontSize:'clamp(36px,5vw,56px)',color:'#1b4332',lineHeight:1.1}}>Our Collection</h1>
            <div dir="rtl" style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:24,color:'#b8965a',display:'inline-block'}}>مجموعتنا</div>
          </div>
          <div style={{fontSize:13,color:'#a09890'}}>
            {loading ? 'Loading…' : <><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'#1b4332',fontWeight:500}}>{filtered.length}</span> books</>}
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div style={{position:'relative',zIndex:1,padding:'16px clamp(20px,5vw,72px)',borderBottom:'1px solid rgba(27,67,50,0.07)',background:'rgba(250,249,245,0.7)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
        {/* Search */}
        <div style={{position:'relative',flex:1,minWidth:200,maxWidth:380}}>
          <svg style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',width:14,height:14,color:'#a09890'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, author…"
            style={{width:'100%',padding:'10px 14px 10px 38px',background:'#fff',border:'1.5px solid rgba(27,67,50,0.12)',borderRadius:30,fontSize:13,fontFamily:"'DM Sans',sans-serif",color:'#1a1712',outline:'none',transition:'border-color .2s'}}
            onFocus={e=>e.target.style.borderColor='#1b4332'} onBlur={e=>e.target.style.borderColor='rgba(27,67,50,0.12)'}/>
        </div>

        {/* Sort dropdown */}
        <div style={{position:'relative'}}>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{padding:'10px 34px 10px 14px',background:'#fff',border:'1.5px solid rgba(27,67,50,0.12)',borderRadius:30,fontSize:12,fontFamily:"'DM Sans',sans-serif",color:'#1a1712',cursor:'pointer',outline:'none',appearance:'none',letterSpacing:.3,transition:'border-color .2s'}}
            onFocus={e=>e.target.style.borderColor='#1b4332'} onBlur={e=>e.target.style.borderColor='rgba(27,67,50,0.12)'}>
            {SORT_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
          </select>
          <svg style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',width:12,height:12,color:'#6b6460',pointerEvents:'none'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
        </div>

        {/* Mobile filter button */}
        <button onClick={() => setDrawerOpen(true)} style={{display:'none',padding:'10px 18px',background:'#1b4332',border:'none',borderRadius:30,color:'#fff',fontSize:12,cursor:'pointer',letterSpacing:.4}} id="mob-filter-btn">
          {hasFilters ? `Filters (${activeFilters.length})` : 'Filters'}
        </button>

        <div style={{flex:1}}/>

        {/* View toggle */}
        <div style={{display:'flex',alignItems:'center',gap:3,background:'#fff',border:'1px solid rgba(27,67,50,0.1)',borderRadius:30,padding:'4px 6px'}}>
          {[
            {id:'3col',icon:<svg width="14" height="14" viewBox="0 0 14 14"><rect x="0" y="0" width="4" height="4" rx="1" fill="currentColor"/><rect x="5" y="0" width="4" height="4" rx="1" fill="currentColor"/><rect x="10" y="0" width="4" height="4" rx="1" fill="currentColor"/><rect x="0" y="5" width="4" height="4" rx="1" fill="currentColor"/><rect x="5" y="5" width="4" height="4" rx="1" fill="currentColor"/><rect x="10" y="5" width="4" height="4" rx="1" fill="currentColor"/><rect x="0" y="10" width="4" height="4" rx="1" fill="currentColor"/><rect x="5" y="10" width="4" height="4" rx="1" fill="currentColor"/><rect x="10" y="10" width="4" height="4" rx="1" fill="currentColor"/></svg>},
            {id:'2col',icon:<svg width="14" height="14" viewBox="0 0 14 14"><rect x="0" y="0" width="6" height="6" rx="1" fill="currentColor"/><rect x="8" y="0" width="6" height="6" rx="1" fill="currentColor"/><rect x="0" y="8" width="6" height="6" rx="1" fill="currentColor"/><rect x="8" y="8" width="6" height="6" rx="1" fill="currentColor"/></svg>},
            {id:'list',icon:<svg width="14" height="14" viewBox="0 0 14 14"><rect x="0" y="0" width="14" height="3" rx="1" fill="currentColor"/><rect x="0" y="5.5" width="14" height="3" rx="1" fill="currentColor"/><rect x="0" y="11" width="14" height="3" rx="1" fill="currentColor"/></svg>},
          ].map(v => (
            <button key={v.id} onClick={() => setView(v.id)} style={{padding:'5px 8px',borderRadius:22,border:'none',background:view===v.id?'#1b4332':'transparent',color:view===v.id?'#fff':'#6b6460',cursor:'pointer',display:'flex',alignItems:'center',transition:'all .15s'}}>
              {v.icon}
            </button>
          ))}
        </div>
      </div>

      {/* ACTIVE FILTER CHIPS */}
      {activeFilters.length > 0 && (
        <div style={{position:'relative',zIndex:1,padding:'12px clamp(20px,5vw,72px)',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',borderBottom:'1px solid rgba(27,67,50,0.05)',background:'rgba(27,67,50,0.02)'}}>
          <span style={{fontSize:10,letterSpacing:1.5,textTransform:'uppercase',color:'#a09890',marginRight:4}}>Filters:</span>
          {activeFilters.map((f, i) => (
            <span key={i} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'5px 12px',background:'rgba(27,67,50,0.08)',border:'1px solid rgba(27,67,50,0.15)',borderRadius:20,fontSize:12,color:'#1b4332'}}>
              {f.label}
              <button onClick={f.clear} style={{background:'none',border:'none',color:'#1b4332',cursor:'pointer',padding:0,fontSize:12,lineHeight:1,opacity:.7}}>✕</button>
            </span>
          ))}
          <button onClick={clearAll} style={{fontSize:11,color:'#b8965a',background:'none',border:'none',cursor:'pointer',letterSpacing:.5,textTransform:'uppercase',marginLeft:4}}>Clear All</button>
        </div>
      )}

      {/* MAIN LAYOUT */}
      <div style={{position:'relative',zIndex:1,maxWidth:1280,margin:'0 auto',padding:'32px clamp(20px,5vw,72px) 80px',display:'grid',gridTemplateColumns:'220px 1fr',gap:40,alignItems:'start'}}>

        {/* SIDEBAR */}
        <aside style={{position:'sticky',top:88,background:'#fff',border:'1px solid rgba(27,67,50,0.08)',borderRadius:18,padding:'24px 20px',boxShadow:'0 4px 16px rgba(27,67,50,0.05)'}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:500,color:'#1b4332',marginBottom:20,paddingBottom:14,borderBottom:'1px solid rgba(27,67,50,0.07)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            Filter Books
            {hasFilters && <span style={{fontSize:10,background:'#1b4332',color:'#fff',padding:'2px 8px',borderRadius:10,letterSpacing:.5}}>{activeFilters.length}</span>}
          </div>
          <SidebarContent/>
        </aside>

        {/* BOOKS */}
        <main>
          {loading ? <Skeleton view={view}/> : filtered.length === 0 ? (
            <div style={{textAlign:'center',padding:'80px 0'}}>
              <div style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:72,color:'rgba(27,67,50,0.08)',marginBottom:16}}>كتب</div>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:'#1b4332',margin:'0 0 10px',fontWeight:400}}>No books found</h2>
              <p style={{color:'#6b6460',fontSize:14,margin:'0 0 24px'}}>Try adjusting your filters or search term.</p>
              <button onClick={clearAll} style={{padding:'12px 28px',background:'#1b4332',color:'#fff',border:'none',borderRadius:30,fontSize:13,cursor:'pointer',letterSpacing:.5}}>Clear All Filters</button>
            </div>
          ) : view === 'list' ? (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {filtered.map(b => <ListCard key={b.slug} book={b}/>)}
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:`repeat(${gridCols},1fr)`,gap:20}}>
              {filtered.map((b, i) => <GridCard key={b.slug} book={b} idx={i}/>)}
            </div>
          )}
        </main>
      </div>

      {/* MOBILE DRAWER */}
      <div ref={backdropRef} onClick={() => setDrawerOpen(false)} style={{position:'fixed',inset:0,zIndex:50,background:'rgba(21,41,31,0.5)',backdropFilter:'blur(4px)',opacity:0,pointerEvents:'none',transition:'opacity .3s'}}/>
      <div ref={drawerRef} style={{position:'fixed',top:0,left:0,bottom:0,zIndex:51,width:'min(85vw,320px)',background:'#faf9f5',padding:'28px 24px',transform:'translateX(-100%)',transition:'transform .4s cubic-bezier(.4,0,.2,1)',overflowY:'auto',boxShadow:'12px 0 40px rgba(27,67,50,0.15)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28}}>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:500,color:'#1b4332'}}>Filters</span>
          <button onClick={() => setDrawerOpen(false)} style={{width:36,height:36,border:'1px solid rgba(27,67,50,0.15)',borderRadius:8,background:'transparent',color:'#1b4332',cursor:'pointer',fontSize:16}}>✕</button>
        </div>
        <SidebarContent/>
      </div>

      {/* FOOTER */}
      <footer style={{position:'relative',zIndex:1,background:'#1b4332',padding:'40px clamp(20px,5vw,72px)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
        <Link href="/" style={{textDecoration:'none',fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:'#fff'}}>Maktabah An Noor</Link>
        <div dir="rtl" style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:22,color:'#b8965a'}}>مكتبة النور</div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',letterSpacing:1}}>© 2026 · Books That Illuminate The Heart</div>
      </footer>

      <style jsx global>{`
        @media (max-width:768px) {
          #mob-filter-btn { display: flex !important; }
          .books-sidebar   { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default function BooksPage() {
  return (
    <Suspense fallback={
      <div style={{minHeight:'100vh',background:'#faf9f5',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16}}>
        <div style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:64,color:'rgba(27,67,50,0.12)',animation:'pulseRays 2s ease-in-out infinite'}}>النور</div>
        <div style={{fontSize:12,color:'#a09890',letterSpacing:2,textTransform:'uppercase'}}>Loading collection…</div>
      </div>
    }>
      <BooksContent/>
    </Suspense>
  );
}

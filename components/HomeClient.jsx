'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { IG_URL } from '@/lib/constants';

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
const DISPLAY_CATS = [
  {name:'Tafsīr',ar:'تفسير',slug:'Tafsir'},{name:'Hadith',ar:'حديث',slug:'Hadith'},
  {name:'Seerah',ar:'سيرة',slug:'Seerah'},{name:'Fiqh',ar:'فقه',slug:'Fiqh'},
  {name:'Aqeedah',ar:'عقيدة',slug:'Aqeedah'},{name:'Duʿā & Dhikr',ar:'دعاء',slug:'Dua & Dhikr'},
  {name:'Manners',ar:'أخلاق',slug:'Manners & Character'},{name:'Arabic',ar:'لغة',slug:'Arabic Language'},
];
const NAV = ['Collection','Categories','New Arrivals','About'];
const MARQUEE_ITEMS = ['Arabic Books','Urdu Books','Hadith Collections','Tafsīr','ʿAqīdah','Seerah','Fiqh','Manners & Character','New Arrivals','Arabic Books','Urdu Books','Hadith Collections','Tafsīr','ʿAqīdah','Seerah','Fiqh','Manners & Character','New Arrivals'];
const PLACEHOLDER_BOOKS = [
  {slug:'#',title:'Riyāḍ aṣ-Ṣāliḥīn',author:'Imam an-Nawawī',category:'Hadith',meta:'Hardcover · 2 Vols',tags:['Bestseller'],coverUrl:'',ar:'رياض'},
  {slug:'#',title:'Tafsīr Ibn Kathīr',author:'Ibn Kathīr',category:'Tafsir',meta:'Hardcover · 10 Vols',tags:['New Arrival'],coverUrl:'',ar:'تفسير'},
  {slug:'#',title:'The Sealed Nectar',author:'S. al-Mubārakpūrī',category:'Seerah',meta:'Hardcover · 1 Vol',tags:[],coverUrl:'',ar:'الرحيق'},
  {slug:'#',title:'Fortress of the Muslim',author:'S. al-Qaḥṭānī',category:'Aqeedah',meta:'Pocket · 1 Vol',tags:['Bestseller'],coverUrl:'',ar:'الحصن'},
];

function BookCard({ book, idx }) {
  const bg = COVER_BKGS[idx % COVER_BKGS.length];
  const ar = book.ar || CAT_AR[book.category] || 'كتاب';
  const ribbon = book.tags?.includes('Bestseller') ? 'Bestseller' : book.tags?.includes('New Arrival') ? 'New Arrival' : null;
  const ribbonBg = ribbon === 'Bestseller' ? '#b8965a' : '#2d6a4f';
  const meta = book.meta || [book.binding, book.volumes > 1 ? `${book.volumes} Vols` : '1 Vol'].filter(Boolean).join(' · ');
  const isReal = book.slug !== '#';

  return (
    <Link href={isReal ? `/book/${book.slug}` : '#'} className="hp-book-card hp-reveal" style={{textDecoration:'none',color:'inherit',background:'#fff',borderRadius:14,overflow:'hidden',border:'1px solid rgba(27,67,50,0.07)',boxShadow:'0 10px 24px rgba(27,67,50,0.06)',cursor:'pointer',display:'block'}} data-reveal data-reveal-delay={idx * 0.1}>
      <div style={{position:'relative',aspectRatio:'3/4',overflow:'hidden'}}>
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} className="hp-book-cover-img" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>
        ) : (
          <div className="hp-book-cover-img" style={{position:'absolute',inset:0,background:bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:14,padding:24}}>
            <div style={{position:'absolute',inset:12,border:'1px solid rgba(212,171,112,0.45)',borderRadius:6}}/>
            <span style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:40,color:'#d4ab70'}}>{ar}</span>
            <span style={{color:'rgba(255,255,255,0.55)',fontSize:18}}>✦</span>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic',fontSize:17,color:'rgba(255,255,255,0.92)',textAlign:'center',lineHeight:1.25}}>{book.title}</span>
          </div>
        )}
        <span style={{position:'absolute',top:12,left:12,background:'#1b4332',color:'#fff',fontSize:10,letterSpacing:1,textTransform:'uppercase',padding:'5px 11px',borderRadius:20,zIndex:2}}>{book.category}</span>
        {ribbon && <span style={{position:'absolute',top:14,right:-34,transform:'rotate(45deg)',background:ribbonBg,color:'#fff',fontSize:9,letterSpacing:1,textTransform:'uppercase',padding:'5px 40px',zIndex:2,boxShadow:'0 4px 10px rgba(0,0,0,0.15)'}}>{ribbon}</span>}
        <div className="hp-book-overlay" style={{position:'absolute',inset:0,background:'linear-gradient(0deg,rgba(27,67,50,0.88),rgba(27,67,50,0.25))',display:'flex',alignItems:'flex-end',justifyContent:'center',paddingBottom:26,opacity:0,transform:'translateY(40%)'}}>
          <span style={{color:'#fff',fontSize:13,letterSpacing:2,textTransform:'uppercase'}}>View Book →</span>
        </div>
      </div>
      <div style={{padding:'18px 18px 22px'}}>
        <h3 style={{margin:'0 0 5px',fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:21,color:'#1a1712',lineHeight:1.15}}>{book.title}</h3>
        <div style={{fontSize:13,color:'#6b6460',fontWeight:300}}>{book.author}</div>
        <div style={{marginTop:10,fontSize:11,letterSpacing:'.6px',textTransform:'uppercase',color:'#b8965a'}}>{meta}</div>
      </div>
    </Link>
  );
}

export default function HomeClient({ featuredBooks = [], newArrivals = [] }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion:reduce)').matches;

    const reveals = root.querySelectorAll('.hp-reveal');
    if (reduced) {
      reveals.forEach(el => { el.style.opacity='1'; el.style.transform='none'; });
    } else {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const d = parseFloat(e.target.getAttribute('data-reveal-delay') || 0);
            setTimeout(() => e.target.classList.add('visible'), d * 1000);
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.12 });
      reveals.forEach(el => io.observe(el));
    }

    const cio = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const dur = 1500; const start = performance.now();
        const step = now => {
          const p = Math.min((now - start) / dur, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * ease) + suffix;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        cio.unobserve(el);
      });
    }, { threshold: 0.4 });
    root.querySelectorAll('[data-count]').forEach(el => cio.observe(el));

    const pEls = root.querySelectorAll('[data-parallax]');
    let onScroll;
    if (pEls.length && !reduced) {
      onScroll = () => {
        const vh = window.innerHeight;
        pEls.forEach(el => {
          const r = el.getBoundingClientRect();
          el.style.transform = `translateY(${(r.top + r.height/2 - vh/2) * -parseFloat(el.dataset.parallax)}px)`;
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
    return () => { if (onScroll) window.removeEventListener('scroll', onScroll); };
  }, []);

  const displayFeatured = featuredBooks.length > 0 ? featuredBooks : PLACEHOLDER_BOOKS;
  const displayNew      = newArrivals.length  > 0 ? newArrivals  : PLACEHOLDER_BOOKS.map(b=>({...b,tags:['New Arrival']}));

  return (
    <div ref={rootRef} style={{position:'relative',minHeight:'100vh',background:'#faf9f5',color:'#1a1712',fontFamily:"'DM Sans',sans-serif",overflowX:'hidden',animation:'pageFade .5s ease both'}}>

      {/* BG PATTERN */}
      <svg width="100%" style={{position:'fixed',left:0,top:-60,width:'100%',height:'calc(100% + 120px)',zIndex:0,pointerEvents:'none',animation:'patDrift 40s linear infinite'}} aria-hidden="true">
        <defs><pattern id="noorStars" width="60" height="60" patternUnits="userSpaceOnUse"><g fill="none" stroke="rgba(27,67,50,0.05)" strokeWidth="1"><rect x="15" y="15" width="30" height="30"/><rect x="15" y="15" width="30" height="30" transform="rotate(45 30 30)"/><circle cx="30" cy="30" r="3"/></g></pattern></defs>
        <rect x="0" y="0" width="100%" height="100%" fill="url(#noorStars)"/>
      </svg>
      <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-120,left:'50%',transform:'translateX(-50%)',width:640,height:640,borderRadius:'50%',background:'radial-gradient(circle,rgba(27,67,50,0.08),transparent 68%)',filter:'blur(120px)',animation:'orbA 14s ease-in-out infinite'}}/>
        <div style={{position:'absolute',bottom:-160,left:-120,width:560,height:560,borderRadius:'50%',background:'radial-gradient(circle,rgba(184,150,90,0.07),transparent 68%)',filter:'blur(120px)',animation:'orbB 17s ease-in-out infinite'}}/>
        <div style={{position:'absolute',top:'42%',right:-160,width:520,height:520,borderRadius:'50%',background:'radial-gradient(circle,rgba(45,106,79,0.07),transparent 68%)',filter:'blur(120px)',animation:'orbC 12s ease-in-out infinite'}}/>
      </div>

      {/* NAV */}
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:40,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px clamp(20px,5vw,72px)',backdropFilter:'blur(8px)',background:'rgba(250,249,245,0.72)',borderBottom:'1px solid rgba(27,67,50,0.07)'}}>
        <Link href="/" style={{display:'flex',alignItems:'center',gap:12,textDecoration:'none',color:'#1b4332'}}>
          <Image src="/logo.png" alt="Maktabah An Noor" width={38} height={38} style={{height:38,width:'auto'}}/>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:600,letterSpacing:.5}}>Maktabah An Noor</span>
        </Link>
        <div className="hp-nav-links" style={{display:'flex',alignItems:'center',gap:34}}>
          {NAV.map(n => (
            <a key={n} href={`#${n.toLowerCase().replace(/ /g,'-')}`} className="hp-nlink" style={{textDecoration:'none',color:'#6b6460',fontSize:14,letterSpacing:.3}}>{n}</a>
          ))}
        </div>
        <Link href="/books" style={{textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8,background:'#1b4332',color:'#fff',padding:'10px 20px',borderRadius:30,fontSize:12,letterSpacing:.4}}>Browse All →</Link>
      </nav>

      {/* HERO */}
      <header id="top" style={{position:'relative',zIndex:1,minHeight:'100vh',display:'flex',alignItems:'center',padding:'140px clamp(20px,5vw,72px) 130px'}}>
        <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>
          {[{text:'النور',top:'6%',right:'8%',size:190,anim:'calliA',dur:26},{text:'العلم',top:'auto',bottom:'8%',left:'4%',size:150,anim:'calliB',dur:32},{text:'الحكمة',top:'44%',left:'30%',size:130,anim:'calliC',dur:22},{text:'القرآن',top:'14%',left:'2%',size:120,anim:'calliB',dur:35},{text:'الإيمان',top:'auto',bottom:'24%',right:'30%',size:140,anim:'calliA',dur:30}].map((c,i)=>(
            <span key={i} style={{position:'absolute',top:c.top,bottom:c.bottom,left:c.left,right:c.right,fontFamily:"'Noto Naskh Arabic',serif",fontSize:c.size,color:'rgba(27,67,50,0.028)',animation:`${c.anim} ${c.dur}s ease-in-out infinite`}}>{c.text}</span>
          ))}
        </div>
        <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>
          {[{t:'18%',l:'12%',s:3,d:0},{t:'30%',l:'48%',s:2,d:.6},{t:'62%',l:'22%',s:3,d:1.1},{t:'74%',l:'40%',s:2,d:.3},{t:'24%',l:'70%',s:3,d:1.6},{t:'52%',l:'84%',s:2,d:.9},{t:'84%',l:'64%',s:3,d:2},{t:'12%',l:'34%',s:2,d:1.3},{t:'44%',l:'6%',s:2,d:.5},{t:'68%',l:'92%',s:3,d:1.8},{t:'88%',l:'14%',s:2,d:.2},{t:'36%',l:'58%',s:2,d:2.4}].map((p,i)=>(
            <span key={i} style={{position:'absolute',top:p.t,left:p.l,width:p.s,height:p.s,borderRadius:'50%',background:'rgba(184,150,90,0.5)',animation:`twinkle ${4+i*0.18}s ease-in-out infinite`,animationDelay:`${p.d}s`}}/>
          ))}
        </div>

        <div className="hp-hero-grid" style={{position:'relative',zIndex:2,width:'100%',maxWidth:1320,margin:'0 auto',display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:48,alignItems:'center'}}>
          <div>
            <div className="hp-hero-anim" style={{opacity:0,animation:'heroFadeUp .7s ease .3s both',display:'inline-flex',alignItems:'center',gap:8,color:'#b8965a',fontSize:12,letterSpacing:'3.5px',textTransform:'uppercase',marginBottom:28}}>✦ Est. 2026 · Chennai, India</div>
            <h1 style={{margin:0,fontFamily:"'Cormorant Garamond',serif",lineHeight:.96,fontWeight:400}}>
              <span className="hp-hero-anim" style={{display:'block',opacity:0,animation:'heroInLeft .7s ease .5s both',fontSize:'clamp(54px,7vw,90px)',color:'#1b4332'}}>Maktabah</span>
              <span className="hp-hero-anim" style={{display:'block',opacity:0,animation:'heroInLeft .7s ease .65s both',fontSize:'clamp(58px,7.6vw,98px)',fontStyle:'italic',fontWeight:500,color:'#b8965a'}}>An Noor</span>
            </h1>
            <div className="hp-hero-anim" dir="rtl" style={{opacity:0,animation:'heroInRight .7s ease .8s both',display:'inline-block',marginTop:14,fontFamily:"'Noto Naskh Arabic',serif",fontSize:'clamp(38px,4.4vw,54px)',fontWeight:500,color:'#2d6a4f',borderBottom:'2px solid #b8965a',paddingBottom:8}}>مكتبة النور</div>
            <div className="hp-hero-anim" style={{opacity:0,animation:'heroFadeUp .7s ease 1s both',display:'flex',alignItems:'center',gap:16,margin:'34px 0 18px',maxWidth:440}}>
              <span style={{flex:1,height:1,background:'linear-gradient(90deg,transparent,rgba(27,67,50,0.25))'}}/>
              <span style={{color:'#b8965a',fontSize:13}}>✦</span>
              <span style={{flex:1,height:1,background:'linear-gradient(90deg,rgba(27,67,50,0.25),transparent)'}}/>
            </div>
            <p className="hp-hero-anim" style={{opacity:0,animation:'heroFadeUp .7s ease 1s both',margin:'0 0 8px',fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic',fontSize:21,color:'#1b4332'}}>Books That Illuminate The Heart</p>
            <p className="hp-hero-anim" style={{opacity:0,animation:'heroFadeUp .7s ease 1.05s both',margin:'0 0 34px',fontSize:14.5,lineHeight:1.7,color:'#6b6460',maxWidth:440,fontWeight:300}}>Spreading beneficial knowledge — Qurans, Islamic Books &amp; Essentials. Shipping across India. Orders via DM.</p>
            <div className="hp-hero-anim" style={{opacity:0,animation:'heroScaleIn .6s ease 1.15s both',display:'flex',flexWrap:'wrap',gap:16}}>
              <Link href="/books" className="hp-btn-primary hp-glow-cta" style={{textDecoration:'none',display:'inline-flex',alignItems:'center',gap:10,background:'#1b4332',color:'#fff',padding:'16px 30px',borderRadius:40,fontSize:14,letterSpacing:.4}}>Browse Collection <span style={{fontSize:16}}>→</span></Link>
              <Link href="/books?tag=New+Arrival" className="hp-btn-secondary hp-glow-cta" style={{textDecoration:'none',display:'inline-flex',alignItems:'center',background:'transparent',color:'#1b4332',padding:'16px 30px',borderRadius:40,fontSize:14,letterSpacing:.4,border:'1px solid #1b4332',transition:'background .3s ease,color .3s ease'}}>View New Arrivals</Link>
            </div>
          </div>
          <div className="hp-hero-anim" style={{opacity:0,animation:'heroFadeUp .9s ease .8s both',display:'flex',flexDirection:'column',alignItems:'center'}}>
            <div style={{animation:'floatBook 6s ease-in-out infinite'}}>
              <svg width="300" height="330" viewBox="0 0 300 330" aria-hidden="true">
                <defs><radialGradient id="glowG" cx="50%" cy="46%" r="50%"><stop offset="0%" stopColor="rgba(184,150,90,0.30)"/><stop offset="100%" stopColor="rgba(184,150,90,0)"/></radialGradient></defs>
                <circle cx="150" cy="150" r="120" fill="url(#glowG)"/>
                <path d="M58 300 L58 150 A92 92 0 0 1 242 150 L242 300" fill="none" stroke="#b8965a" strokeWidth="2"/>
                <path d="M74 300 L74 152 A76 76 0 0 1 226 152 L226 300" fill="none" stroke="#b8965a" strokeWidth="1" strokeOpacity=".55"/>
                <circle cx="150" cy="64" r="4" fill="#b8965a"/>
                <g stroke="#d4ab70" strokeWidth="2" strokeLinecap="round" style={{animation:'pulseRays 4s ease-in-out infinite'}}>
                  <line x1="150" y1="196" x2="150" y2="120"/><line x1="150" y1="196" x2="112" y2="132"/>
                  <line x1="150" y1="196" x2="188" y2="132"/><line x1="150" y1="196" x2="92"  y2="158"/>
                  <line x1="150" y1="196" x2="208" y2="158"/>
                </g>
                <path d="M150 208 L96 196 L96 250 L150 262 Z" fill="#1b4332"/>
                <path d="M150 208 L204 196 L204 250 L150 262 Z" fill="#2d6a4f"/>
                <path d="M150 208 L150 262" stroke="#b8965a" strokeWidth="2"/>
                <g stroke="rgba(255,255,255,0.32)" strokeWidth="1.2">
                  <line x1="108" y1="210" x2="142" y2="216"/><line x1="108" y1="222" x2="142" y2="228"/>
                  <line x1="108" y1="234" x2="142" y2="240"/><line x1="158" y1="216" x2="192" y2="210"/>
                  <line x1="158" y1="228" x2="192" y2="222"/><line x1="158" y1="240" x2="192" y2="234"/>
                </g>
              </svg>
            </div>
            <div style={{position:'relative',height:96,width:230,marginTop:6}}>
              <div style={{position:'absolute',left:'50%',top:6,transform:'translateX(-50%) rotate(-6deg)',width:120,height:74,borderRadius:6,background:'#fff',border:'1px solid rgba(27,67,50,0.12)',boxShadow:'0 14px 26px rgba(27,67,50,0.14)'}}/>
              <div style={{position:'absolute',left:'50%',top:12,transform:'translateX(-50%) rotate(3deg)',width:120,height:74,borderRadius:6,background:'#fff',border:'1px solid rgba(27,67,50,0.12)',boxShadow:'0 14px 26px rgba(27,67,50,0.14)'}}/>
              <div style={{position:'absolute',left:'50%',top:0,transform:'translateX(-50%)',width:120,height:74,borderRadius:6,background:'linear-gradient(150deg,#2d6a4f,#1b4332)',boxShadow:'0 16px 30px rgba(27,67,50,0.22)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <span style={{fontFamily:"'Noto Naskh Arabic',serif",color:'#d4ab70',fontSize:22}}>كتاب</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{position:'absolute',bottom:26,left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:10,zIndex:2}}>
          <span style={{fontSize:10,letterSpacing:3,color:'#6b6460',textTransform:'uppercase'}}>Scroll</span>
          <span style={{width:1,height:42,background:'#b8965a',transformOrigin:'top',animation:'scrollLine 2.4s ease-in-out infinite'}}/>
        </div>
      </header>

      {/* MARQUEE */}
      <div style={{position:'relative',zIndex:1,background:'#1b4332',overflow:'hidden',padding:'15px 0'}}>
        <div style={{display:'flex',width:'max-content',whiteSpace:'nowrap',animation:'marqueeAnim 26s linear infinite'}}>
          {MARQUEE_ITEMS.map((m,i)=>(
            <span key={i} style={{display:'inline-flex',alignItems:'center',color:'#d4ab70',fontSize:13,letterSpacing:'1.5px',textTransform:'uppercase',padding:'0 26px'}}>
              <span style={{color:'#b8965a',marginRight:26}}>✦</span>{m}
            </span>
          ))}
        </div>
      </div>

      {/* STATS */}
      <section className="hp-reveal" style={{position:'relative',zIndex:1,background:'#faf9f5',borderTop:'1px solid rgba(27,67,50,0.08)',borderBottom:'1px solid rgba(27,67,50,0.08)'}}>
        <div className="hp-stats-row" style={{maxWidth:1200,margin:'0 auto',display:'flex'}}>
          {[{count:500,suffix:'+',label:'Books in Collection'},{count:10,suffix:'+',label:'Subject Categories'},{count:3,suffix:'',label:'Languages'},{val:'All India',label:'Delivery'}].map((s,i)=>(
            <div key={i} className="hp-stat-cell" style={{flex:1,textAlign:'center',padding:'46px 20px',borderLeft:i>0?'1px solid rgba(27,67,50,0.08)':'none'}}>
              {s.count!==undefined
                ? <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:54,color:'#1b4332',lineHeight:1}} data-count={s.count} data-suffix={s.suffix}>0{s.suffix}</div>
                : <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:54,color:'#1b4332',lineHeight:1}}>{s.val}</div>
              }
              <div style={{marginTop:8,fontSize:12,letterSpacing:'1.5px',textTransform:'uppercase',color:'#6b6460'}}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section id="collection" style={{position:'relative',zIndex:1,padding:'96px clamp(20px,5vw,72px)'}}>
        <div className="hp-reveal" style={{textAlign:'center',marginBottom:54}}>
          <div style={{color:'#b8965a',fontSize:12,letterSpacing:'3.5px',textTransform:'uppercase',marginBottom:14}}>✦ Hand-Picked</div>
          <h2 style={{margin:0,fontFamily:"'Cormorant Garamond',serif",fontWeight:500,fontSize:'clamp(40px,5vw,60px)',color:'#1b4332'}}>Featured Books</h2>
        </div>
        <div className="hp-four-grid" style={{maxWidth:1240,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:26}}>
          {displayFeatured.map((b,i) => <BookCard key={b.slug||i} book={b} idx={i}/>)}
        </div>
        <div style={{textAlign:'center',marginTop:36}}>
          <Link href="/books" className="hp-glow-cta" style={{textDecoration:'none',display:'inline-flex',alignItems:'center',gap:10,border:'1px solid rgba(27,67,50,0.25)',color:'#1b4332',padding:'14px 30px',borderRadius:40,fontSize:13,letterSpacing:.5}}>View All Books →</Link>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" style={{position:'relative',zIndex:1,background:'#1b4332',padding:'96px clamp(20px,5vw,72px)',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden'}}>
          <span style={{position:'absolute',top:'10%',right:'6%',fontFamily:"'Noto Naskh Arabic',serif",fontSize:180,color:'rgba(255,255,255,0.03)',animation:'calliA 30s ease-in-out infinite'}}>العلم</span>
          <span style={{position:'absolute',bottom:'6%',left:'4%',fontFamily:"'Noto Naskh Arabic',serif",fontSize:150,color:'rgba(255,255,255,0.025)',animation:'calliB 34s ease-in-out infinite'}}>الكتب</span>
        </div>
        <div className="hp-reveal" style={{position:'relative',textAlign:'center',marginBottom:54}}>
          <div style={{color:'#d4ab70',fontSize:12,letterSpacing:'3.5px',textTransform:'uppercase',marginBottom:14}}>✦ Browse by Topic</div>
          <h2 style={{margin:0,fontFamily:"'Cormorant Garamond',serif",fontWeight:500,fontSize:'clamp(40px,5vw,60px)',color:'#fff'}}>What are you looking for?</h2>
        </div>
        <div className="hp-four-grid" style={{position:'relative',maxWidth:1180,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:22}}>
          {DISPLAY_CATS.map((cat,i)=>(
            <Link key={cat.name} href={`/books?category=${encodeURIComponent(cat.slug)}`} className="hp-cat-card hp-reveal" style={{opacity:0,transform:'translateY(24px)',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(184,150,90,0.32)',borderRadius:14,padding:'32px 20px',textAlign:'center',cursor:'pointer',textDecoration:'none',display:'block'}} data-reveal data-reveal-delay={i*0.07}>
              <div className="hp-cat-ic" style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:42,color:'#d4ab70',lineHeight:1,marginBottom:14}}>{cat.ar}</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:21,color:'#fff'}}>{cat.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* QUOTE */}
      <section style={{position:'relative',zIndex:1,background:'#faf9f5',padding:'100px clamp(20px,5vw,72px)',textAlign:'center'}}>
        <div className="hp-reveal" style={{maxWidth:820,margin:'0 auto',position:'relative'}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:120,lineHeight:.4,color:'rgba(184,150,90,0.35)',height:60}}>&ldquo;</div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:22,margin:'10px 0 22px'}}>
            <span style={{width:60,height:1,background:'linear-gradient(90deg,transparent,#b8965a)'}}/>
            <span style={{color:'#b8965a'}}>✦</span>
            <span style={{width:60,height:1,background:'linear-gradient(90deg,#b8965a,transparent)'}}/>
          </div>
          <div dir="rtl" style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:'clamp(30px,4.4vw,44px)',color:'#1b4332',lineHeight:1.7,marginBottom:20}}>وَقُل رَّبِّ زِدْنِي عِلْمًا</div>
          <p style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic',fontSize:21,color:'#6b6460',margin:'0 0 14px'}}>&ldquo;And say: My Lord, increase me in knowledge.&rdquo;</p>
          <div style={{fontSize:11,letterSpacing:'2.5px',textTransform:'uppercase',color:'#b8965a'}}>— Surah Ta-Ha · 20:114</div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section id="new-arrivals" style={{position:'relative',zIndex:1,padding:'96px clamp(20px,5vw,72px)',background:'#f4f1e9',overflow:'hidden'}}>
        <div className="hp-reveal" style={{position:'relative',textAlign:'center',marginBottom:54}}>
          <div style={{color:'#b8965a',fontSize:12,letterSpacing:'3.5px',textTransform:'uppercase',marginBottom:14}}>✦ Fresh on the Shelf</div>
          <h2 style={{margin:0,fontFamily:"'Cormorant Garamond',serif",fontWeight:500,fontSize:'clamp(40px,5vw,60px)',color:'#1b4332'}}>New Arrivals</h2>
        </div>
        <div className="hp-four-grid" style={{position:'relative',maxWidth:1240,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:26}}>
          {displayNew.map((b,i) => <BookCard key={b.slug||i} book={b} idx={i}/>)}
        </div>
        <div style={{textAlign:'center',marginTop:36}}>
          <Link href="/books?tag=New+Arrival" className="hp-glow-cta" style={{textDecoration:'none',display:'inline-flex',alignItems:'center',gap:10,border:'1px solid rgba(27,67,50,0.25)',color:'#1b4332',padding:'14px 30px',borderRadius:40,fontSize:13,letterSpacing:.5}}>View All New Arrivals →</Link>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="hp-about-grid" style={{position:'relative',zIndex:1,display:'grid',gridTemplateColumns:'1fr 1fr',alignItems:'stretch'}}>
        <div style={{position:'relative',background:'#1b4332',padding:'96px clamp(28px,5vw,80px)',overflow:'hidden',display:'flex',flexDirection:'column',justifyContent:'center'}}>
          <span style={{position:'absolute',bottom:-30,right:-10,fontFamily:"'Noto Naskh Arabic',serif",fontSize:230,color:'rgba(255,255,255,0.04)',lineHeight:.8,pointerEvents:'none'}}>نور</span>
          <div className="hp-reveal" style={{position:'relative',maxWidth:460}}>
            <div style={{color:'#d4ab70',fontSize:12,letterSpacing:'3.5px',textTransform:'uppercase',marginBottom:18}}>✦ Our Mission</div>
            <h2 style={{margin:'0 0 22px',fontFamily:"'Cormorant Garamond',serif",fontWeight:500,fontSize:'clamp(36px,4.4vw,52px)',color:'#fff',lineHeight:1.08}}>Every Home Deserves a Library</h2>
            <p style={{margin:'0 0 18px',fontSize:15,lineHeight:1.8,color:'rgba(255,255,255,0.78)',fontWeight:300}}>Maktabah An Noor was founded in Chennai with a simple conviction — that authentic Islamic knowledge should reach every doorstep. We source and curate trusted editions across Arabic, Urdu and English.</p>
            <p style={{margin:'0 0 30px',fontSize:15,lineHeight:1.8,color:'rgba(255,255,255,0.78)',fontWeight:300}}>Each title is chosen with care for accuracy, binding quality, and the light it brings to the heart. Orders &amp; enquiries via DM on Instagram.</p>
            <Link href="/books" className="hp-glow-cta" style={{textDecoration:'none',display:'inline-flex',alignItems:'center',gap:10,background:'#b8965a',color:'#1b4332',padding:'15px 30px',borderRadius:40,fontSize:14,letterSpacing:.4,fontWeight:500}}>Explore Collection →</Link>
          </div>
        </div>
        <div style={{position:'relative',background:'#f4f1e9',padding:'60px clamp(28px,5vw,60px)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
          <div data-parallax="0.12" style={{width:'100%',maxWidth:420}}>
            <svg width="100%" viewBox="0 0 420 320" aria-hidden="true">
              <g stroke="#1b4332" strokeWidth="1.4" fill="none" opacity="0.8"><rect x="40" y="40" width="340" height="240" rx="4"/><line x1="40" y1="120" x2="380" y2="120"/><line x1="40" y1="200" x2="380" y2="200"/></g>
              <g>
                {[[58,56,20,56,'#1b4332'],[82,50,18,62,'#2d6a4f'],[104,58,22,54,'#b8965a'],[130,52,16,60,'#1b4332'],[150,56,20,56,'#d4ab70'],[174,50,18,62,'#2d6a4f']].map(([x,y,w,h,fill],i)=>(
                  <rect key={i} x={x} y={y} width={w} height={h} rx="2" fill={fill}/>
                ))}
                {[[58,136,18,56,'#b8965a'],[80,130,20,62,'#1b4332'],[104,138,16,54,'#2d6a4f'],[124,132,22,60,'#d4ab70']].map(([x,y,w,h,fill],i)=>(
                  <rect key={i+6} x={x} y={y} width={w} height={h} rx="2" fill={fill}/>
                ))}
                {[[300,56,20,56,'#2d6a4f'],[324,50,18,62,'#b8965a'],[346,58,20,54,'#1b4332'],[300,136,18,56,'#d4ab70'],[322,130,20,62,'#1b4332'],[346,138,20,54,'#2d6a4f']].map(([x,y,w,h,fill],i)=>(
                  <rect key={i+10} x={x} y={y} width={w} height={h} rx="2" fill={fill}/>
                ))}
              </g>
              <path d="M210 250 L168 240 L168 280 L210 290 Z" fill="#1b4332"/>
              <path d="M210 250 L252 240 L252 280 L210 290 Z" fill="#2d6a4f"/>
              <path d="M210 250 L210 290" stroke="#b8965a" strokeWidth="1.6"/>
            </svg>
          </div>
        </div>
      </section>

      {/* INSTAGRAM */}
      <section style={{position:'relative',zIndex:1,background:'#15291f',padding:'90px clamp(20px,5vw,72px)',textAlign:'center',overflow:'hidden'}}>
        <div className="hp-reveal" style={{position:'relative',maxWidth:880,margin:'0 auto'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:10,color:'#d4ab70',fontSize:12,letterSpacing:'3px',textTransform:'uppercase',marginBottom:16}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/></svg>
            Follow us on Instagram
          </div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic',fontSize:'clamp(34px,5vw,52px)',color:'#b8965a',marginBottom:36}}>@maktabahannoor</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:12,marginBottom:38}}>
            {[0,.2,.4,.6,.8,1].map((d,i)=>(
              <div key={i} style={{aspectRatio:'1',borderRadius:8,background:'linear-gradient(90deg,#1b4332,#2d6a4f,#1b4332)',backgroundSize:'180% 100%',animation:`skeletonShimmer 1.8s linear infinite`,animationDelay:`${d}s`}}/>
            ))}
          </div>
          <a href={IG_URL} target="_blank" rel="noreferrer" className="hp-glow-cta" style={{textDecoration:'none',display:'inline-flex',alignItems:'center',gap:10,background:'transparent',border:'1px solid rgba(184,150,90,0.5)',color:'#d4ab70',padding:'15px 32px',borderRadius:40,fontSize:14,letterSpacing:.5}}>Visit Instagram →</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{position:'relative',zIndex:1,background:'#1b4332',color:'rgba(255,255,255,0.85)',padding:'80px clamp(20px,5vw,72px) 0',overflow:'hidden'}}>
        <svg width="100%" style={{position:'absolute',left:0,top:-60,width:'100%',height:'calc(100% + 120px)',zIndex:0,pointerEvents:'none',animation:'patDrift 40s linear infinite',opacity:.6}} aria-hidden="true">
          <defs><pattern id="footStars" width="60" height="60" patternUnits="userSpaceOnUse"><g fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"><rect x="15" y="15" width="30" height="30"/><rect x="15" y="15" width="30" height="30" transform="rotate(45 30 30)"/></g></pattern></defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#footStars)"/>
        </svg>
        <div style={{position:'relative',maxWidth:1200,margin:'0 auto',display:'grid',gridTemplateColumns:'1.3fr 1fr 1fr',gap:44}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
              <Image src="/logo.png" alt="Logo" width={38} height={38} style={{height:38,width:'auto',filter:'brightness(1.1)'}}/>
              <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:600,color:'#fff'}}>Maktabah An Noor</span>
            </div>
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic',fontSize:18,color:'#d4ab70',margin:'0 0 10px'}}>Books That Illuminate The Heart</p>
            <div style={{fontSize:12,letterSpacing:'1.5px',textTransform:'uppercase',color:'rgba(255,255,255,0.55)'}}>Est. 2026 · Chennai, India</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div dir="rtl" style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:30,color:'#b8965a',marginBottom:22}}>رَبِّ اغْفِرْ وَارْحَمْ</div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {[['#collection','Collection'],['#categories','Categories'],['#new-arrivals','New Arrivals'],['#about','About']].map(([h,l])=>(
                <a key={l} href={h} className="hp-nlink" style={{textDecoration:'none',color:'rgba(255,255,255,0.78)',fontSize:14}}>{l}</a>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontSize:12,letterSpacing:'2px',textTransform:'uppercase',color:'#d4ab70',marginBottom:18}}>Get in Touch</div>
            <div style={{fontSize:14,lineHeight:1.9,color:'rgba(255,255,255,0.78)',fontWeight:300}}>
              <div>Instagram · @maktabahannoor</div>
              <div>Delivery across all India</div>
              <div>Arabic · Urdu · English</div>
            </div>
          </div>
        </div>
        <div style={{position:'relative',marginTop:64,borderTop:'1px solid rgba(184,150,90,0.3)',padding:'24px 0',textAlign:'center',fontSize:12,letterSpacing:1,color:'rgba(255,255,255,0.5)'}}>© 2026 Maktabah An Noor · Built with care for the Ummah</div>
      </footer>
    </div>
  );
}

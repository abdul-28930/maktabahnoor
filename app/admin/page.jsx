'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CATEGORIES, LANGUAGES, BINDINGS, TAGS } from '@/lib/constants';
import PageBackground from '@/components/PageBackground';

const EMPTY = { title:'',titleAr:'',author:'',authorAr:'',language:'Arabic',category:'Aqeedah',description:'',volumes:1,binding:'Hardcover',pages:'',inStock:true,tags:[],coverUrl:'' };

function fmt(iso) { return new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }

/* ── Reusable field components ── */
const Label = ({children, hint}) => (
  <div style={{marginBottom:6}}>
    <div style={{fontSize:9,letterSpacing:'2px',textTransform:'uppercase',color:'#b8965a',fontWeight:500,display:'flex',alignItems:'center',gap:8}}>
      <span style={{width:12,height:1,background:'#b8965a',display:'inline-block'}}/>
      {children}
    </div>
    {hint && <div style={{fontSize:11,color:'#a09890',marginTop:3}}>{hint}</div>}
  </div>
);

const Input = ({value, onChange, placeholder, type='text', dir, style={}}) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder} dir={dir}
    style={{width:'100%',padding:'12px 14px',background:'#faf9f5',border:'1.5px solid rgba(27,67,50,0.12)',borderRadius:10,color:'#1a1712',fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:'none',transition:'border-color .2s',...style}}
    onFocus={e=>e.target.style.borderColor='#1b4332'} onBlur={e=>e.target.style.borderColor='rgba(27,67,50,0.12)'}/>
);

const Select = ({value, onChange, options, placeholder}) => (
  <select value={value} onChange={onChange}
    style={{width:'100%',padding:'12px 14px',background:'#faf9f5',border:'1.5px solid rgba(27,67,50,0.12)',borderRadius:10,color:'#1a1712',fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:'none',cursor:'pointer',transition:'border-color .2s',appearance:'none'}}
    onFocus={e=>e.target.style.borderColor='#1b4332'} onBlur={e=>e.target.style.borderColor='rgba(27,67,50,0.12)'}>
    {placeholder && <option value="">{placeholder}</option>}
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

export default function AdminPage() {
  const [view, setView]         = useState('login');
  const [pw, setPw]             = useState('');
  const [pwErr, setPwErr]       = useState('');
  const [session, setSession]   = useState('');
  const [books, setBooks]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [editSlug, setEditSlug] = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [imgMode, setImgMode]   = useState('url');
  const [search, setSearch]     = useState('');
  const [toast, setToast]       = useState({msg:'',type:'',show:false});
  const timer    = useRef(null);
  const fileRef  = useRef(null);

  function f(k,v) { setForm(p=>({...p,[k]:v})); }
  function showToast(msg,type='') {
    setToast({msg,type,show:true});
    clearTimeout(timer.current);
    timer.current = setTimeout(()=>setToast(t=>({...t,show:false})),3000);
  }

  async function login() {
    if (!pw.trim()) return;
    setLoading(true); setPwErr('');
    try {
      const r = await fetch('/api/auth', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ password: pw }),
      });
      const d = await r.json();
      if (r.status === 401) throw new Error('Incorrect password.');
      if (!r.ok) throw new Error(d.error || 'Server error. Check ADMIN_PASSWORD env var.');
      setSession(pw); await loadBooks(pw); setView('dashboard'); setPw('');
    } catch(e) { setPwErr(e.message); }
    finally { setLoading(false); }
  }

  async function loadBooks(s=session) {
    try { const r=await fetch('/api/books?all=1'); const d=await r.json(); setBooks(d.books||[]); } catch {}
  }

  async function openEdit(slug) {
    setLoading(true);
    try {
      const r=await fetch(`/api/books/${slug}`); const d=await r.json();
      if (d.book) {
        setEditSlug(slug);
        setForm({title:d.book.title||'',titleAr:d.book.titleAr||'',author:d.book.author||'',authorAr:d.book.authorAr||'',language:d.book.language||'Arabic',category:d.book.category||'Aqeedah',description:d.book.description||'',volumes:d.book.volumes||1,binding:d.book.binding||'Hardcover',pages:d.book.pages||'',inStock:d.book.inStock!==false,tags:d.book.tags||[],coverUrl:d.book.coverUrl||''});
        setImgMode('url'); setView('editor');
      }
    } catch { showToast('Failed to load.','error'); }
    finally { setLoading(false); }
  }

  async function save() {
    if (!form.title.trim()) { showToast('Title is required.','error'); return; }
    setLoading(true);
    try {
      const r = editSlug
        ? await fetch(`/api/books/${editSlug}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session,...form})})
        : await fetch('/api/books',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session,...form})});
      const d = await r.json();
      if (!r.ok) throw new Error(d.error||'Failed');
      showToast(editSlug?'✓ Book updated!':'✓ Book added!','success');
      await loadBooks(); setView('dashboard');
    } catch(e) { showToast(e.message,'error'); }
    finally { setLoading(false); }
  }

  async function del(slug) {
    if (!confirm('Delete this book? This cannot be undone.')) return;
    try {
      await fetch(`/api/books/${slug}`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session})});
      showToast('Book deleted.'); await loadBooks();
    } catch { showToast('Failed.','error'); }
  }

  function handleImg(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => f('coverUrl', ev.target.result);
    reader.readAsDataURL(file);
  }

  function toggleTag(tag) { f('tags', form.tags.includes(tag)?form.tags.filter(t=>t!==tag):[...form.tags,tag]); }

  const filtered = useMemo(()=>books.filter(b=>!search||b.title?.toLowerCase().includes(search.toLowerCase())||b.author?.toLowerCase().includes(search.toLowerCase())),[books,search]);
  const stats = useMemo(()=>({total:books.length,inStock:books.filter(b=>b.inStock).length,out:books.filter(b=>!b.inStock).length,cats:[...new Set(books.map(b=>b.category))].length}),[books]);

  const Btn = ({children,onClick,disabled,variant='primary',style={}}) => {
    const base = {padding:'11px 22px',border:'none',borderRadius:30,fontSize:12,fontWeight:500,letterSpacing:.6,textTransform:'uppercase',cursor:'pointer',transition:'all .2s',fontFamily:"'DM Sans',sans-serif",...style};
    const variants = {
      primary:{...base,background:'#1b4332',color:'#fff'},
      gold:{...base,background:'#b8965a',color:'#fff'},
      ghost:{...base,background:'transparent',border:'1.5px solid rgba(27,67,50,0.2)',color:'#1b4332'},
      danger:{...base,background:'transparent',border:'1.5px solid rgba(180,60,60,0.25)',color:'#b44'},
    };
    return <button style={variants[variant]} onClick={onClick} disabled={disabled}>{children}</button>;
  };

  /* ── LOGIN ── */
  if (view==='login') return (
    <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',display:'flex',alignItems:'center',justifyContent:'center',padding:24,fontFamily:"'DM Sans',sans-serif"}}>
      <PageBackground/>
      <div style={{position:'relative',zIndex:1,background:'#fff',border:'1px solid rgba(27,67,50,0.1)',borderRadius:20,padding:'48px 44px',maxWidth:420,width:'100%',textAlign:'center',boxShadow:'0 20px 60px rgba(27,67,50,0.1)'}}>
        <Image src="/logo.png" alt="Logo" width={72} height={72} style={{height:72,width:'auto',margin:'0 auto 20px'}}/>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:500,color:'#1b4332',margin:'0 0 6px'}}>Admin Panel</h1>
        <p style={{fontSize:13,color:'#6b6460',margin:'0 0 32px',lineHeight:1.6}}>Sign in to manage the book collection.</p>
        <div style={{position:'relative',marginBottom:12}}>
          <input type="password" placeholder="Password" value={pw}
            onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} autoFocus
            style={{width:'100%',padding:'14px 18px',background:'#faf9f5',border:'1.5px solid rgba(27,67,50,0.12)',borderRadius:12,fontSize:14,fontFamily:"'DM Sans',sans-serif",color:'#1a1712',outline:'none',textAlign:'center',letterSpacing:2,transition:'border-color .2s'}}
            onFocus={e=>e.target.style.borderColor='#1b4332'} onBlur={e=>e.target.style.borderColor='rgba(27,67,50,0.12)'}/>
        </div>
        {pwErr && <p style={{fontSize:12,color:'#c44',marginBottom:12,minHeight:16}}>{pwErr}</p>}
        <button onClick={login} disabled={loading}
          style={{width:'100%',padding:14,background:'#1b4332',border:'none',borderRadius:12,color:'#fff',fontSize:13,fontWeight:500,letterSpacing:1,textTransform:'uppercase',cursor:'pointer',transition:'background .2s',opacity:loading?.6:1}}>
          {loading?'Signing in…':'Sign In'}
        </button>
        <div dir="rtl" style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:18,color:'rgba(27,67,50,0.2)',marginTop:28}}>مكتبة النور</div>
      </div>
    </div>
  );

  /* ── EDITOR ── */
  if (view==='editor') return (
    <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',fontFamily:"'DM Sans',sans-serif"}}>
      <PageBackground subtle/>

      {/* Header */}
      <header style={{position:'sticky',top:0,zIndex:40,height:68,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 clamp(20px,5vw,48px)',background:'rgba(250,249,245,0.92)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(27,67,50,0.08)'}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <Image src="/logo.png" alt="Logo" width={36} height={36} style={{height:36,width:'auto'}}/>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:'#1b4332'}}>{editSlug?'Edit Book':'Add New Book'}</div>
            <div style={{fontSize:10,color:'#b8965a',letterSpacing:'1.5px',textTransform:'uppercase'}}>Admin Panel</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <Btn variant="ghost" onClick={()=>setView('dashboard')}>← Dashboard</Btn>
          <Btn onClick={save} disabled={loading}>{loading?'Saving…':editSlug?'Save Changes':'Add Book'}</Btn>
        </div>
      </header>

      <div style={{position:'relative',zIndex:1,maxWidth:860,margin:'0 auto',padding:'40px clamp(20px,5vw,48px) 80px'}}>
        <div style={{display:'flex',flexDirection:'column',gap:24}}>

          {/* Titles */}
          <div style={{background:'#fff',borderRadius:16,padding:28,border:'1px solid rgba(27,67,50,0.07)',boxShadow:'0 2px 12px rgba(27,67,50,0.04)'}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#1b4332',fontWeight:500,marginBottom:20,paddingBottom:14,borderBottom:'1px solid rgba(27,67,50,0.06)'}}>Book Information</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
              <div><Label>Title (English) *</Label><Input value={form.title} onChange={e=>f('title',e.target.value)} placeholder="e.g. Sahih Al-Bukhari"/></div>
              <div><Label>Title (Arabic)</Label><Input value={form.titleAr} onChange={e=>f('titleAr',e.target.value)} placeholder="e.g. صحيح البخاري" dir="rtl" style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:15}}/></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div><Label>Author (English)</Label><Input value={form.author} onChange={e=>f('author',e.target.value)} placeholder="e.g. Imam Al-Bukhari"/></div>
              <div><Label>Author (Arabic)</Label><Input value={form.authorAr} onChange={e=>f('authorAr',e.target.value)} placeholder="e.g. الإمام البخاري" dir="rtl" style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:15}}/></div>
            </div>
          </div>

          {/* Classification */}
          <div style={{background:'#fff',borderRadius:16,padding:28,border:'1px solid rgba(27,67,50,0.07)',boxShadow:'0 2px 12px rgba(27,67,50,0.04)'}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#1b4332',fontWeight:500,marginBottom:20,paddingBottom:14,borderBottom:'1px solid rgba(27,67,50,0.06)'}}>Classification</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
              <div><Label>Category *</Label><Select value={form.category} onChange={e=>f('category',e.target.value)} options={CATEGORIES}/></div>
              <div><Label>Language *</Label><Select value={form.language} onChange={e=>f('language',e.target.value)} options={LANGUAGES}/></div>
              <div><Label>Binding</Label><Select value={form.binding} onChange={e=>f('binding',e.target.value)} options={BINDINGS} placeholder="— Select —"/></div>
            </div>
          </div>

          {/* Physical details */}
          <div style={{background:'#fff',borderRadius:16,padding:28,border:'1px solid rgba(27,67,50,0.07)',boxShadow:'0 2px 12px rgba(27,67,50,0.04)'}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#1b4332',fontWeight:500,marginBottom:20,paddingBottom:14,borderBottom:'1px solid rgba(27,67,50,0.06)'}}>Details</div>
            <div style={{marginBottom:16}}><Label>Short Description</Label>
              <textarea value={form.description} onChange={e=>f('description',e.target.value)} placeholder="2–3 lines about what this book covers…" rows={3}
                style={{width:'100%',padding:'12px 14px',background:'#faf9f5',border:'1.5px solid rgba(27,67,50,0.12)',borderRadius:10,color:'#1a1712',fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:'none',resize:'vertical',lineHeight:1.65,transition:'border-color .2s'}}
                onFocus={e=>e.target.style.borderColor='#1b4332'} onBlur={e=>e.target.style.borderColor='rgba(27,67,50,0.12)'}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div><Label>Number of Volumes</Label><Input type="number" value={form.volumes} onChange={e=>f('volumes',e.target.value)}/></div>
              <div><Label hint="Optional">Number of Pages</Label><Input type="number" value={form.pages} onChange={e=>f('pages',e.target.value)} placeholder="e.g. 480"/></div>
            </div>
          </div>

          {/* Cover image */}
          <div style={{background:'#fff',borderRadius:16,padding:28,border:'1px solid rgba(27,67,50,0.07)',boxShadow:'0 2px 12px rgba(27,67,50,0.04)'}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#1b4332',fontWeight:500,marginBottom:20,paddingBottom:14,borderBottom:'1px solid rgba(27,67,50,0.06)'}}>Cover Image</div>
            <div style={{display:'flex',gap:8,marginBottom:14}}>
              {['url','upload'].map(m=>(
                <button key={m} onClick={()=>setImgMode(m)} style={{padding:'7px 18px',borderRadius:20,border:`1.5px solid ${imgMode===m?'#1b4332':'rgba(27,67,50,0.15)'}`,background:imgMode===m?'rgba(27,67,50,0.07)':'transparent',color:imgMode===m?'#1b4332':'#6b6460',fontSize:12,cursor:'pointer',letterSpacing:.5,textTransform:'capitalize',fontFamily:"'DM Sans',sans-serif"}}>
                  {m==='url'?'Paste URL':'Upload Image'}
                </button>
              ))}
            </div>
            {imgMode==='url'
              ? <Input value={form.coverUrl.startsWith('data:')?'':form.coverUrl} onChange={e=>f('coverUrl',e.target.value)} placeholder="https://… (image URL)"/>
              : (
                <div onClick={()=>fileRef.current?.click()} style={{border:`2px dashed ${form.coverUrl?'rgba(27,67,50,0.15)':'rgba(27,67,50,0.12)'}`,borderRadius:12,padding:form.coverUrl?0:32,textAlign:'center',cursor:'pointer',transition:'border-color .2s',overflow:'hidden',background:'#faf9f5'}} onMouseEnter={e=>e.currentTarget.style.borderColor='#1b4332'} onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(27,67,50,0.12)'}>
                  {form.coverUrl
                    ? <img src={form.coverUrl} alt="Cover" style={{width:'100%',maxHeight:240,objectFit:'contain',borderRadius:10}}/>
                    : <><div style={{fontSize:13,color:'#6b6460',marginBottom:6}}>Click to upload cover image</div><div style={{fontSize:11,color:'#a09890'}}>JPG or PNG recommended</div></>
                  }
                  <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleImg}/>
                </div>
              )
            }
            {form.coverUrl && <button onClick={()=>f('coverUrl','')} style={{marginTop:8,fontSize:11,color:'#a09890',background:'none',border:'none',cursor:'pointer',padding:0}}>✕ Remove image</button>}
          </div>

          {/* Tags + stock */}
          <div style={{background:'#fff',borderRadius:16,padding:28,border:'1px solid rgba(27,67,50,0.07)',boxShadow:'0 2px 12px rgba(27,67,50,0.04)'}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#1b4332',fontWeight:500,marginBottom:20,paddingBottom:14,borderBottom:'1px solid rgba(27,67,50,0.06)'}}>Tags & Availability</div>
            <div style={{marginBottom:20}}>
              <Label>Tags</Label>
              <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:4}}>
                {TAGS.map(t=>(
                  <label key={t} onClick={()=>toggleTag(t)} style={{padding:'8px 18px',borderRadius:20,border:`1.5px solid ${form.tags.includes(t)?'#1b4332':'rgba(27,67,50,0.15)'}`,background:form.tags.includes(t)?'rgba(27,67,50,0.07)':'transparent',color:form.tags.includes(t)?'#1b4332':'#6b6460',fontSize:12,cursor:'pointer',transition:'all .2s',letterSpacing:.5,userSelect:'none'}}>
                    {t}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Availability</Label>
              <label onClick={()=>f('inStock',!form.inStock)} style={{display:'flex',alignItems:'center',gap:12,cursor:'pointer',width:'fit-content',marginTop:4}}>
                <div style={{width:44,height:26,borderRadius:13,background:form.inStock?'#1b4332':'rgba(27,67,50,0.15)',position:'relative',transition:'background .25s',flexShrink:0}}>
                  <div style={{position:'absolute',top:3,left:form.inStock?20:3,width:20,height:20,borderRadius:'50%',background:'#fff',transition:'left .25s',boxShadow:'0 1px 4px rgba(0,0,0,.2)'}}/>
                </div>
                <span style={{fontSize:14,color:form.inStock?'#1b4332':'#6b6460',fontWeight:form.inStock?'400':'300',transition:'color .2s'}}>{form.inStock?'In Stock':'Out of Stock'}</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div style={{display:'flex',gap:10,paddingTop:8}}>
            <Btn variant="ghost" onClick={()=>setView('dashboard')}>Cancel</Btn>
            <Btn onClick={save} disabled={loading}>{loading?'Saving…':editSlug?'Save Changes':'Add Book'}</Btn>
          </div>
        </div>
      </div>
      <Toast t={toast}/>
    </div>
  );

  /* ── DASHBOARD ── */
  return (
    <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',fontFamily:"'DM Sans',sans-serif"}}>
      <PageBackground subtle/>

      {/* Header */}
      <header style={{position:'sticky',top:0,zIndex:40,height:68,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 clamp(20px,5vw,48px)',background:'rgba(250,249,245,0.92)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(27,67,50,0.08)'}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <Image src="/logo.png" alt="Logo" width={36} height={36} style={{height:36,width:'auto'}}/>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:'#1b4332'}}>Maktabah An Noor</div>
            <div style={{fontSize:10,color:'#b8965a',letterSpacing:'1.5px',textTransform:'uppercase'}}>Admin Panel</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <Link href="/" style={{textDecoration:'none',padding:'9px 18px',border:'1.5px solid rgba(27,67,50,0.15)',borderRadius:20,fontSize:11,color:'#6b6460',letterSpacing:.5,textTransform:'uppercase',transition:'all .2s'}} onMouseEnter={e=>{e.currentTarget.style.color='#1b4332';e.currentTarget.style.borderColor='#1b4332';}} onMouseLeave={e=>{e.currentTarget.style.color='#6b6460';e.currentTarget.style.borderColor='rgba(27,67,50,0.15)';}}>View Site</Link>
          <Btn onClick={()=>{setEditSlug(null);setForm(EMPTY);setImgMode('url');setView('editor');}}>+ Add Book</Btn>
          <Btn variant="ghost" onClick={()=>{setSession('');setView('login');}}>Log Out</Btn>
        </div>
      </header>

      <div style={{position:'relative',zIndex:1,maxWidth:1100,margin:'0 auto',padding:'40px clamp(20px,5vw,48px) 80px'}}>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:40}}>
          {[{num:stats.total,label:'Total Books',ar:'كتاب'},{num:stats.inStock,label:'In Stock',ar:'متاح'},{num:stats.out,label:'Out of Stock',ar:'غير متاح'},{num:stats.cats,label:'Categories',ar:'تصنيف'}].map((s,i)=>(
            <div key={i} style={{background:'#fff',border:'1px solid rgba(27,67,50,0.07)',borderRadius:16,padding:'24px 20px',boxShadow:'0 2px 12px rgba(27,67,50,0.04)',display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:12}}>
              <div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:44,fontWeight:400,color:'#1b4332',lineHeight:1,marginBottom:6}}>{s.num}</div>
                <div style={{fontSize:10,letterSpacing:'1.5px',textTransform:'uppercase',color:'#a09890'}}>{s.label}</div>
              </div>
              <div style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:32,color:'rgba(184,150,90,0.3)',lineHeight:1}}>{s.ar}</div>
            </div>
          ))}
        </div>

        {/* Books list */}
        <div style={{background:'#fff',borderRadius:20,border:'1px solid rgba(27,67,50,0.07)',boxShadow:'0 4px 20px rgba(27,67,50,0.06)',overflow:'hidden'}}>
          {/* Table header */}
          <div style={{padding:'20px 24px',borderBottom:'1px solid rgba(27,67,50,0.07)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:500,color:'#1b4332'}}>
              Book Collection <span style={{fontSize:14,color:'#b8965a',fontStyle:'italic',fontWeight:400}}>{filtered.length} {filtered.length!==1?'books':'book'}</span>
            </div>
            <div style={{position:'relative',maxWidth:280}}>
              <svg style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',width:14,height:14,color:'#a09890'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="text" placeholder="Search books…" value={search} onChange={e=>setSearch(e.target.value)}
                style={{width:'100%',padding:'9px 14px 9px 36px',background:'#faf9f5',border:'1.5px solid rgba(27,67,50,0.1)',borderRadius:30,fontSize:13,fontFamily:"'DM Sans',sans-serif",color:'#1a1712',outline:'none',transition:'border-color .2s'}}
                onFocus={e=>e.target.style.borderColor='#1b4332'} onBlur={e=>e.target.style.borderColor='rgba(27,67,50,0.1)'}/>
            </div>
          </div>

          {books.length===0 ? (
            <div style={{textAlign:'center',padding:'72px 24px'}}>
              <div style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:64,color:'rgba(27,67,50,0.08)',marginBottom:16}}>الكتب</div>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#6b6460',margin:'0 0 20px'}}>No books yet. Add your first one.</p>
              <Btn onClick={()=>{setEditSlug(null);setForm(EMPTY);setImgMode('url');setView('editor');}}>+ Add First Book</Btn>
            </div>
          ) : (
            <div>
              {filtered.map((b,i)=>(
                <div key={b.slug} style={{display:'flex',alignItems:'center',gap:16,padding:'16px 24px',borderBottom:i<filtered.length-1?'1px solid rgba(27,67,50,0.05)':'none',transition:'background .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(27,67,50,0.02)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  {/* Thumb */}
                  <div style={{width:44,height:58,borderRadius:6,overflow:'hidden',flexShrink:0,background:'linear-gradient(155deg,#2d6a4f,#1b4332)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {b.coverUrl
                      ? <img src={b.coverUrl} alt={b.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                      : <span style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:16,color:'rgba(212,171,112,0.8)'}}>ك</span>
                    }
                  </div>
                  {/* Info */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,color:'#1a1712',fontWeight:400,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',marginBottom:4}}>
                      {b.title}
                      {b.titleAr && <span style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:13,color:'#b8965a',marginRight:8,direction:'rtl'}}> · {b.titleAr}</span>}
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                      <span style={{padding:'2px 10px',background:'rgba(27,67,50,0.07)',borderRadius:10,fontSize:9,color:'#1b4332',fontWeight:500,letterSpacing:.8,textTransform:'uppercase'}}>{b.category}</span>
                      <span style={{fontSize:11,color:'#a09890'}}>{b.language}</span>
                      {b.author && <span style={{fontSize:11,color:'#a09890'}}>{b.author}</span>}
                      {b.tags?.map(t=>(
                        <span key={t} style={{padding:'2px 8px',background:'rgba(184,150,90,0.1)',borderRadius:10,fontSize:9,color:'#b8965a',letterSpacing:.6,textTransform:'uppercase'}}>{t}</span>
                      ))}
                    </div>
                  </div>
                  {/* Date */}
                  <span style={{fontSize:11,color:'#c0b8b0',letterSpacing:.3,flexShrink:0}}>{fmt(b.createdAt)}</span>
                  {/* Stock */}
                  <span style={{padding:'4px 12px',borderRadius:20,fontSize:10,fontWeight:500,letterSpacing:.8,textTransform:'uppercase',flexShrink:0,
                    background:b.inStock?'rgba(45,106,79,0.08)':'rgba(180,60,60,0.07)',
                    color:b.inStock?'#2d6a4f':'#b44',
                    border:`1px solid ${b.inStock?'rgba(45,106,79,0.2)':'rgba(180,60,60,0.15)'}`}}>
                    {b.inStock?'In Stock':'Out'}
                  </span>
                  {/* Actions */}
                  <div style={{display:'flex',gap:6,flexShrink:0}}>
                    <button onClick={()=>openEdit(b.slug)} title="Edit" style={{width:32,height:32,borderRadius:8,border:'1.5px solid rgba(27,67,50,0.12)',background:'transparent',color:'#6b6460',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .2s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(27,67,50,0.07)';e.currentTarget.style.color='#1b4332';e.currentTarget.style.borderColor='#1b4332';}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#6b6460';e.currentTarget.style.borderColor='rgba(27,67,50,0.12)';}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
                    </button>
                    <button onClick={()=>del(b.slug)} title="Delete" style={{width:32,height:32,borderRadius:8,border:'1.5px solid rgba(27,67,50,0.12)',background:'transparent',color:'#6b6460',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .2s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(180,60,60,0.07)';e.currentTarget.style.color='#b44';e.currentTarget.style.borderColor='rgba(180,60,60,0.25)';}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#6b6460';e.currentTarget.style.borderColor='rgba(27,67,50,0.12)';}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Toast t={toast}/>
    </div>
  );
}

function Toast({t}) {
  return (
    <div style={{position:'fixed',bottom:24,left:'50%',transform:`translateX(-50%) translateY(${t.show?0:16}px)`,background:'#fff',border:`1px solid ${t.type==='success'?'rgba(45,106,79,0.3)':t.type==='error'?'rgba(180,60,60,0.3)':'rgba(27,67,50,0.12)'}`,borderRadius:12,padding:'12px 24px',fontSize:13,color:t.type==='success'?'#2d6a4f':t.type==='error'?'#b44':'#1a1712',boxShadow:'0 8px 32px rgba(27,67,50,0.12)',zIndex:999,opacity:t.show?1:0,transition:'opacity .3s,transform .3s',pointerEvents:'none',whiteSpace:'nowrap'}}>
      {t.msg}
    </div>
  );
}

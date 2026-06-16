'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CATEGORIES, LANGUAGES, BINDINGS, TAGS, OFFER_TYPES } from '@/lib/constants';
import PageBackground from '@/components/PageBackground';

const EMPTY_BOOK = {
  title:'',titleAr:'',author:'',authorAr:'',sku:'',language:'Arabic',category:'Aqeedah',
  description:'',volumes:1,binding:'Hardcover',pages:'',
  mrp:'',price:'',offerType:'',stockCount:'',
  inStock:true,tags:[],coverUrl:'',
};
const EMPTY_BUNDLE = {
  name:'',description:'',sku:'',bookSlugs:[],
  totalMrp:'',bundlePrice:'',offerType:'Limited Deal',stockCount:'',active:true,
};

const OFFER_COLORS = {
  'Sale':                {bg:'rgba(220,38,38,0.1)',  border:'rgba(220,38,38,0.3)',  text:'#dc2626'},
  'Limited Edition':     {bg:'rgba(124,58,237,0.1)', border:'rgba(124,58,237,0.3)', text:'#7c3aed'},
  'Limited Deal':        {bg:'rgba(184,150,90,0.1)', border:'rgba(184,150,90,0.3)', text:'#b8965a'},
  'Limited Time Offer':  {bg:'rgba(220,120,20,0.1)', border:'rgba(220,120,20,0.3)', text:'#dc7814'},
};

function OfferBadge({ type }) {
  if (!type) return null;
  const c = OFFER_COLORS[type] || OFFER_COLORS['Sale'];
  return <span style={{padding:'3px 10px',borderRadius:20,fontSize:9,fontWeight:500,letterSpacing:1,textTransform:'uppercase',background:c.bg,border:`1px solid ${c.border}`,color:c.text}}>{type}</span>;
}

function fmtPrice(n) { return n ? `₹${Number(n).toLocaleString('en-IN')}` : '—'; }
function fmt(iso)     { return new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }

const Label = ({children,hint}) => (
  <div style={{marginBottom:6}}>
    <div style={{fontSize:9,letterSpacing:'2px',textTransform:'uppercase',color:'#b8965a',fontWeight:500,display:'flex',alignItems:'center',gap:8}}>
      <span style={{width:12,height:1,background:'#b8965a',display:'inline-block'}}/>
      {children}
    </div>
    {hint && <div style={{fontSize:11,color:'#a09890',marginTop:2}}>{hint}</div>}
  </div>
);
const FInput = ({value,onChange,placeholder,type='text',dir,prefix,style={}}) => (
  <div style={{position:'relative'}}>
    {prefix && <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontSize:14,color:'#6b6460',pointerEvents:'none'}}>{prefix}</span>}
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} dir={dir}
      style={{width:'100%',padding:`11px 14px 11px ${prefix?'28px':'14px'}`,background:'#faf9f5',border:'1.5px solid rgba(27,67,50,0.12)',borderRadius:10,color:'#1a1712',fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:'none',transition:'border-color .2s',...style}}
      onFocus={e=>e.target.style.borderColor='#1b4332'} onBlur={e=>e.target.style.borderColor='rgba(27,67,50,0.12)'}/>
  </div>
);
const FSelect = ({value,onChange,options,placeholder}) => (
  <select value={value} onChange={onChange}
    style={{width:'100%',padding:'11px 14px',background:'#faf9f5',border:'1.5px solid rgba(27,67,50,0.12)',borderRadius:10,color:'#1a1712',fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:'none',cursor:'pointer',appearance:'none',transition:'border-color .2s'}}
    onFocus={e=>e.target.style.borderColor='#1b4332'} onBlur={e=>e.target.style.borderColor='rgba(27,67,50,0.12)'}>
    {placeholder && <option value="">{placeholder}</option>}
    {options.map(o=><option key={o} value={o}>{o}</option>)}
  </select>
);

export default function AdminPage() {
  const [view, setView]           = useState('login');
  const [tab, setTab]             = useState('books');
  const [pw, setPw]               = useState('');
  const [pwErr, setPwErr]         = useState('');
  const [session, setSession]     = useState('');
  const [books, setBooks]         = useState([]);
  const [bundles, setBundles]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [editSlug, setEditSlug]   = useState(null);
  const [editBundleId, setEditBundleId] = useState(null);
  const [form, setForm]           = useState(EMPTY_BOOK);
  const [bundleForm, setBundleForm] = useState(EMPTY_BUNDLE);
  const [imgMode, setImgMode]     = useState('url');
  const [search, setSearch]       = useState('');
  const [toast, setToast]         = useState({msg:'',type:'',show:false});
  const timer   = useRef(null);
  const fileRef = useRef(null);

  function f(k,v)  { setForm(p=>({...p,[k]:v})); }
  function bf(k,v) { setBundleForm(p=>({...p,[k]:v})); }

  function showToast(msg,type='') {
    setToast({msg,type,show:true});
    clearTimeout(timer.current);
    timer.current = setTimeout(()=>setToast(t=>({...t,show:false})),3000);
  }

  async function login() {
    if (!pw.trim()) return;
    setLoading(true); setPwErr('');
    try {
      const check = await fetch('/api/books',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw,title:'__auth__'})});
      if (check.status===401) throw new Error('Incorrect password.');
      const cd = await check.json();
      if (cd.slug) await fetch(`/api/books/${cd.slug}`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})});
      setSession(pw); await Promise.all([loadBooks(pw),loadBundles(pw)]); setView('dashboard'); setPw('');
    } catch(e) { setPwErr(e.message); }
    finally { setLoading(false); }
  }

  async function loadBooks(s=session) {
    try { const r=await fetch('/api/books?all=1'); const d=await r.json(); setBooks(d.books||[]); } catch {}
  }
  async function loadBundles(s=session) {
    try { const r=await fetch('/api/bundles'); const d=await r.json(); setBundles(d.bundles||[]); } catch {}
  }

  async function openEditBook(slug) {
    setLoading(true);
    try {
      const r=await fetch(`/api/books/${slug}`); const d=await r.json();
      if (d.book) {
        setEditSlug(slug);
        setForm({
          title:d.book.title||'',titleAr:d.book.titleAr||'',author:d.book.author||'',
          authorAr:d.book.authorAr||'',sku:d.book.sku||'',language:d.book.language||'Arabic',
          category:d.book.category||'Aqeedah',description:d.book.description||'',
          volumes:d.book.volumes||1,binding:d.book.binding||'Hardcover',pages:d.book.pages||'',
          mrp:d.book.mrp||'',price:d.book.price||'',offerType:d.book.offerType||'',
          stockCount:d.book.stockCount??'',inStock:d.book.inStock!==false,
          tags:d.book.tags||[],coverUrl:d.book.coverUrl||'',
        });
        setImgMode('url'); setView('bookEditor');
      }
    } catch { showToast('Failed to load.','error'); }
    finally { setLoading(false); }
  }

  async function openEditBundle(id) {
    setLoading(true);
    try {
      const r=await fetch(`/api/bundles/${id}`); const d=await r.json();
      if (d.bundle) {
        setEditBundleId(id);
        setBundleForm({
          name:d.bundle.name||'',description:d.bundle.description||'',sku:d.bundle.sku||'',
          bookSlugs:d.bundle.bookSlugs||[],totalMrp:d.bundle.totalMrp||'',
          bundlePrice:d.bundle.bundlePrice||'',offerType:d.bundle.offerType||'Limited Deal',
          stockCount:d.bundle.stockCount||'',active:d.bundle.active!==false,
        });
        setView('bundleEditor');
      }
    } catch { showToast('Failed to load.','error'); }
    finally { setLoading(false); }
  }

  async function saveBook() {
    if (!form.title.trim()) { showToast('Title is required.','error'); return; }
    setLoading(true);
    try {
      const r = editSlug
        ? await fetch(`/api/books/${editSlug}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session,...form})})
        : await fetch('/api/books',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session,...form})});
      const d = await r.json();
      if (!r.ok) throw new Error(d.error||'Failed');
      showToast(editSlug?'✓ Book updated!':'✓ Book added!','success');
      await loadBooks(); setView('dashboard'); setTab('books');
    } catch(e) { showToast(e.message,'error'); }
    finally { setLoading(false); }
  }

  async function saveBundle() {
    if (!bundleForm.name.trim()) { showToast('Bundle name is required.','error'); return; }
    if (bundleForm.bookSlugs.length < 2) { showToast('Select at least 2 books.','error'); return; }
    setLoading(true);
    try {
      const r = editBundleId
        ? await fetch(`/api/bundles/${editBundleId}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session,...bundleForm})})
        : await fetch('/api/bundles',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session,...bundleForm})});
      const d = await r.json();
      if (!r.ok) throw new Error(d.error||'Failed');
      showToast(editBundleId?'✓ Bundle updated!':'✓ Bundle created!','success');
      await loadBundles(); setView('dashboard'); setTab('bundles');
    } catch(e) { showToast(e.message,'error'); }
    finally { setLoading(false); }
  }

  async function delBook(slug) {
    if (!confirm('Delete this book?')) return;
    try {
      await fetch(`/api/books/${slug}`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session})});
      showToast('Book deleted.'); await loadBooks();
    } catch { showToast('Failed.','error'); }
  }

  async function delBundle(id) {
    if (!confirm('Delete this bundle?')) return;
    try {
      await fetch(`/api/bundles/${id}`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session})});
      showToast('Bundle deleted.'); await loadBundles();
    } catch { showToast('Failed.','error'); }
  }

  async function toggleBundleActive(id, active) {
    try {
      await fetch(`/api/bundles/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session,active})});
      await loadBundles(); showToast(active?'Bundle activated.':'Bundle hidden.','success');
    } catch { showToast('Failed.','error'); }
  }

  function handleImg(e) {
    const file=e.target.files?.[0]; if(!file) return;
    new Promise((res,rej)=>{const r=new FileReader();r.onload=ev=>res(ev.target.result);r.onerror=rej;r.readAsDataURL(file);}).then(d=>f('coverUrl',d));
  }

  function toggleTag(tag) { f('tags',form.tags.includes(tag)?form.tags.filter(t=>t!==tag):[...form.tags,tag]); }
  function toggleBookInBundle(slug) {
    const s = bundleForm.bookSlugs;
    const next = s.includes(slug) ? s.filter(x=>x!==slug) : [...s,slug];
    bf('bookSlugs', next);
    // Auto-calc total MRP from selected books
    const selected = books.filter(b => next.includes(b.slug));
    const total = selected.reduce((acc,b) => acc + (b.mrp || b.price || 0), 0);
    if (total > 0) bf('totalMrp', total);
  }

  const filteredBooks = useMemo(()=>books.filter(b=>!search||b.title?.toLowerCase().includes(search.toLowerCase())||b.author?.toLowerCase().includes(search.toLowerCase())),[books,search]);
  const stats = useMemo(()=>({
    total:books.length,inStock:books.filter(b=>b.inStock).length,
    out:books.filter(b=>!b.inStock).length,cats:[...new Set(books.map(b=>b.category))].length,
    bundles:bundles.length,
  }),[books,bundles]);

  const Btn = ({children,onClick,disabled,variant='primary',small,style:sx={}}) => {
    const base={padding:small?'8px 16px':'11px 22px',border:'none',borderRadius:30,fontSize:small?11:12,fontWeight:500,letterSpacing:.6,textTransform:'uppercase',cursor:'pointer',transition:'all .2s',fontFamily:"'DM Sans',sans-serif",...sx};
    const v={primary:{...base,background:'#1b4332',color:'#fff'},gold:{...base,background:'#b8965a',color:'#fff'},ghost:{...base,background:'transparent',border:'1.5px solid rgba(27,67,50,0.2)',color:'#1b4332'},danger:{...base,background:'transparent',border:'1.5px solid rgba(180,60,60,0.25)',color:'#b44'}};
    return <button style={v[variant]} onClick={onClick} disabled={disabled}>{children}</button>;
  };

  /* ── BOOK EDITOR ── */
  if (view==='bookEditor') return (
    <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',fontFamily:"'DM Sans',sans-serif"}}>
      <PageBackground subtle/>
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
          <Btn onClick={saveBook} disabled={loading}>{loading?'Saving…':editSlug?'Save Changes':'Add Book'}</Btn>
        </div>
      </header>
      <div style={{position:'relative',zIndex:1,maxWidth:900,margin:'0 auto',padding:'40px clamp(20px,5vw,48px) 80px',display:'flex',flexDirection:'column',gap:20}}>

        {/* Titles */}
        <Card title="Book Information">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <div><Label>Title (English) *</Label><FInput value={form.title} onChange={e=>f('title',e.target.value)} placeholder="e.g. Sahih Al-Bukhari"/></div>
            <div><Label>Title (Arabic)</Label><FInput value={form.titleAr} onChange={e=>f('titleAr',e.target.value)} placeholder="صحيح البخاري" dir="rtl" style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:15}}/></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <div><Label>Author (English)</Label><FInput value={form.author} onChange={e=>f('author',e.target.value)} placeholder="e.g. Imam Al-Bukhari"/></div>
            <div><Label>Author (Arabic)</Label><FInput value={form.authorAr} onChange={e=>f('authorAr',e.target.value)} placeholder="الإمام البخاري" dir="rtl" style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:15}}/></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
            <div><Label hint="Unique product code">SKU / Book Code</Label><FInput value={form.sku} onChange={e=>f('sku',e.target.value)} placeholder="e.g. HAD-001"/></div>
            <div><Label>Category</Label><FSelect value={form.category} onChange={e=>f('category',e.target.value)} options={CATEGORIES}/></div>
            <div><Label>Language</Label><FSelect value={form.language} onChange={e=>f('language',e.target.value)} options={LANGUAGES}/></div>
          </div>
        </Card>

        {/* Pricing */}
        <Card title="Pricing">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:16,marginBottom:16}}>
            <div><Label hint="Original / MRP">Actual Price (₹)</Label><FInput type="number" value={form.mrp} onChange={e=>f('mrp',e.target.value)} placeholder="350" prefix="₹"/></div>
            <div><Label hint="Sale / current price">Sale Price (₹)</Label><FInput type="number" value={form.price} onChange={e=>f('price',e.target.value)} placeholder="299" prefix="₹"/></div>
            <div><Label>Offer Type</Label>
              <select value={form.offerType} onChange={e=>f('offerType',e.target.value)}
                style={{width:'100%',padding:'11px 14px',background:'#faf9f5',border:'1.5px solid rgba(27,67,50,0.12)',borderRadius:10,color:form.offerType?'#1a1712':'#a09890',fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:'none',cursor:'pointer',appearance:'none',transition:'border-color .2s'}}
                onFocus={e=>e.target.style.borderColor='#1b4332'} onBlur={e=>e.target.style.borderColor='rgba(27,67,50,0.12)'}>
                <option value="">None</option>
                {OFFER_TYPES.map(o=><option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div><Label hint="Exact pieces available">Stock Count</Label><FInput type="number" value={form.stockCount} onChange={e=>f('stockCount',e.target.value)} placeholder="50"/></div>
          </div>
          {(form.mrp || form.price) && (
            <div style={{padding:'14px 16px',background:'rgba(27,67,50,0.04)',borderRadius:10,display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
              <span style={{fontSize:12,color:'#6b6460'}}>Preview:</span>
              {form.mrp && form.price && form.mrp > form.price && <span style={{fontSize:14,color:'#a09890',textDecoration:'line-through'}}>₹{Number(form.mrp).toLocaleString('en-IN')}</span>}
              {form.price && <span style={{fontSize:18,fontWeight:600,color:'#1b4332',fontFamily:"'Cormorant Garamond',serif"}}>₹{Number(form.price||form.mrp).toLocaleString('en-IN')}</span>}
              {form.mrp && form.price && form.mrp > form.price && <span style={{fontSize:12,color:'#2d6a4f',background:'rgba(45,106,79,0.1)',padding:'3px 10px',borderRadius:10}}>{Math.round((1-form.price/form.mrp)*100)}% off</span>}
              {form.offerType && <OfferBadge type={form.offerType}/>}
            </div>
          )}
        </Card>

        {/* Details */}
        <Card title="Book Details">
          <div style={{marginBottom:16}}>
            <Label>Short Description</Label>
            <textarea value={form.description} onChange={e=>f('description',e.target.value)} placeholder="2–3 lines about what this book covers…" rows={3}
              style={{width:'100%',padding:'12px 14px',background:'#faf9f5',border:'1.5px solid rgba(27,67,50,0.12)',borderRadius:10,color:'#1a1712',fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:'none',resize:'vertical',lineHeight:1.65,transition:'border-color .2s'}}
              onFocus={e=>e.target.style.borderColor='#1b4332'} onBlur={e=>e.target.style.borderColor='rgba(27,67,50,0.12)'}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
            <div><Label>Binding</Label><FSelect value={form.binding} onChange={e=>f('binding',e.target.value)} options={BINDINGS} placeholder="— Select —"/></div>
            <div><Label>Volumes</Label><FInput type="number" value={form.volumes} onChange={e=>f('volumes',e.target.value)}/></div>
            <div><Label hint="Optional">Pages</Label><FInput type="number" value={form.pages} onChange={e=>f('pages',e.target.value)} placeholder="480"/></div>
          </div>
        </Card>

        {/* Cover */}
        <Card title="Cover Image">
          <div style={{display:'flex',gap:8,marginBottom:14}}>
            {['url','upload'].map(m=>(
              <button key={m} onClick={()=>setImgMode(m)} style={{padding:'7px 18px',borderRadius:20,border:`1.5px solid ${imgMode===m?'#1b4332':'rgba(27,67,50,0.15)'}`,background:imgMode===m?'rgba(27,67,50,0.07)':'transparent',color:imgMode===m?'#1b4332':'#6b6460',fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                {m==='url'?'Paste URL':'Upload Image'}
              </button>
            ))}
          </div>
          {imgMode==='url'
            ? <FInput value={form.coverUrl.startsWith('data:')?'':form.coverUrl} onChange={e=>f('coverUrl',e.target.value)} placeholder="https://… (image URL)"/>
            : (
              <div onClick={()=>fileRef.current?.click()} style={{border:`2px dashed rgba(27,67,50,0.15)`,borderRadius:12,padding:form.coverUrl?0:32,textAlign:'center',cursor:'pointer',overflow:'hidden',background:'#faf9f5'}} onMouseEnter={e=>e.currentTarget.style.borderColor='#1b4332'} onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(27,67,50,0.15)'}>
                {form.coverUrl?<img src={form.coverUrl} alt="Preview" style={{width:'100%',maxHeight:240,objectFit:'contain',borderRadius:10}}/>:<><div style={{fontSize:13,color:'#6b6460',marginBottom:6}}>Click to upload cover image</div><div style={{fontSize:11,color:'#a09890'}}>JPG or PNG</div></>}
                <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleImg}/>
              </div>
            )
          }
          {form.coverUrl && <button onClick={()=>f('coverUrl','')} style={{marginTop:8,fontSize:11,color:'#a09890',background:'none',border:'none',cursor:'pointer',padding:0}}>✕ Remove image</button>}
        </Card>

        {/* Tags */}
        <Card title="Tags & Visibility">
          <div style={{marginBottom:16}}>
            <Label>Tags</Label>
            <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:4}}>
              {TAGS.map(t=>(
                <label key={t} onClick={()=>toggleTag(t)} style={{padding:'7px 16px',borderRadius:20,border:`1.5px solid ${form.tags.includes(t)?'#1b4332':'rgba(27,67,50,0.15)'}`,background:form.tags.includes(t)?'rgba(27,67,50,0.07)':'transparent',color:form.tags.includes(t)?'#1b4332':'#6b6460',fontSize:12,cursor:'pointer',userSelect:'none'}}>
                  {t}
                </label>
              ))}
            </div>
          </div>
        </Card>

        <div style={{display:'flex',gap:10,paddingTop:8}}>
          <Btn variant="ghost" onClick={()=>setView('dashboard')}>Cancel</Btn>
          <Btn onClick={saveBook} disabled={loading}>{loading?'Saving…':editSlug?'Save Changes':'Add Book'}</Btn>
        </div>
      </div>
      <Toast t={toast}/>
    </div>
  );

  /* ── BUNDLE EDITOR ── */
  if (view==='bundleEditor') return (
    <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',fontFamily:"'DM Sans',sans-serif"}}>
      <PageBackground subtle/>
      <header style={{position:'sticky',top:0,zIndex:40,height:68,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 clamp(20px,5vw,48px)',background:'rgba(250,249,245,0.92)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(27,67,50,0.08)'}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <Image src="/logo.png" alt="Logo" width={36} height={36} style={{height:36,width:'auto'}}/>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:'#1b4332'}}>{editBundleId?'Edit Bundle':'Create Bundle'}</div>
            <div style={{fontSize:10,color:'#b8965a',letterSpacing:'1.5px',textTransform:'uppercase'}}>Admin · Bundles</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <Btn variant="ghost" onClick={()=>setView('dashboard')}>← Dashboard</Btn>
          <Btn onClick={saveBundle} disabled={loading}>{loading?'Saving…':editBundleId?'Save Changes':'Create Bundle'}</Btn>
        </div>
      </header>

      <div style={{position:'relative',zIndex:1,maxWidth:900,margin:'0 auto',padding:'40px clamp(20px,5vw,48px) 80px',display:'flex',flexDirection:'column',gap:20}}>

        {/* Bundle Info */}
        <Card title="Bundle Information">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <div><Label>Bundle Name *</Label><FInput value={bundleForm.name} onChange={e=>bf('name',e.target.value)} placeholder="e.g. Beginner Islamic Library"/></div>
            <div><Label hint="Unique code">Bundle SKU</Label><FInput value={bundleForm.sku} onChange={e=>bf('sku',e.target.value)} placeholder="e.g. BUN-001"/></div>
          </div>
          <Label>Description</Label>
          <textarea value={bundleForm.description} onChange={e=>bf('description',e.target.value)} placeholder="What makes this bundle special?" rows={2}
            style={{width:'100%',padding:'12px 14px',background:'#faf9f5',border:'1.5px solid rgba(27,67,50,0.12)',borderRadius:10,color:'#1a1712',fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:'none',resize:'vertical',lineHeight:1.65,transition:'border-color .2s'}}
            onFocus={e=>e.target.style.borderColor='#1b4332'} onBlur={e=>e.target.style.borderColor='rgba(27,67,50,0.12)'}/>
        </Card>

        {/* Select Books */}
        <Card title={`Select Books (${bundleForm.bookSlugs.length} selected)`}>
          <p style={{fontSize:12,color:'#6b6460',marginBottom:16,fontWeight:300}}>Select 2 or more books to include in this bundle. Total MRP will be auto-calculated.</p>
          {books.length === 0 ? (
            <div style={{textAlign:'center',padding:'24px 0',color:'#a09890',fontSize:13}}>No books found. Add books first.</div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:400,overflowY:'auto',paddingRight:4}}>
              {books.map(b => {
                const sel = bundleForm.bookSlugs.includes(b.slug);
                return (
                  <div key={b.slug} onClick={()=>toggleBookInBundle(b.slug)}
                    style={{display:'flex',alignItems:'center',gap:14,padding:'12px 16px',borderRadius:10,border:`1.5px solid ${sel?'#1b4332':'rgba(27,67,50,0.1)'}`,background:sel?'rgba(27,67,50,0.05)':'#fff',cursor:'pointer',transition:'all .15s'}}>
                    <span style={{width:20,height:20,borderRadius:5,border:`1.5px solid ${sel?'#1b4332':'rgba(27,67,50,0.22)'}`,background:sel?'#1b4332':'transparent',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}>
                      {sel && <svg width="9" height="9" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </span>
                    {b.coverUrl && <img src={b.coverUrl} alt="" style={{width:36,height:48,objectFit:'cover',borderRadius:5,flexShrink:0}}/>}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,color:'#1a1712',fontWeight:400,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{b.title}</div>
                      <div style={{fontSize:11,color:'#a09890'}}>{b.author} · {b.category}</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      {b.mrp && <div style={{fontSize:11,color:'#a09890',textDecoration:'line-through'}}>₹{Number(b.mrp).toLocaleString('en-IN')}</div>}
                      {(b.price||b.mrp) && <div style={{fontSize:14,color:'#1b4332',fontWeight:500}}>₹{Number(b.price||b.mrp).toLocaleString('en-IN')}</div>}
                      {!b.price && !b.mrp && <div style={{fontSize:12,color:'#a09890'}}>No price set</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Bundle Pricing */}
        <Card title="Bundle Pricing">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:16,marginBottom:16}}>
            <div>
              <Label hint="Sum of individual book prices">Total MRP (₹)</Label>
              <FInput type="number" value={bundleForm.totalMrp} onChange={e=>bf('totalMrp',e.target.value)} placeholder="300" prefix="₹"/>
            </div>
            <div>
              <Label hint="Special bundle deal price">Bundle Price (₹) *</Label>
              <FInput type="number" value={bundleForm.bundlePrice} onChange={e=>bf('bundlePrice',e.target.value)} placeholder="250" prefix="₹"/>
            </div>
            <div><Label>Offer Type</Label>
              <select value={bundleForm.offerType} onChange={e=>bf('offerType',e.target.value)}
                style={{width:'100%',padding:'11px 14px',background:'#faf9f5',border:'1.5px solid rgba(27,67,50,0.12)',borderRadius:10,color:'#1a1712',fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:'none',cursor:'pointer',appearance:'none'}}>
                {OFFER_TYPES.map(o=><option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div><Label>Stock Count</Label><FInput type="number" value={bundleForm.stockCount} onChange={e=>bf('stockCount',e.target.value)} placeholder="20"/></div>
          </div>
          {(bundleForm.totalMrp || bundleForm.bundlePrice) && (
            <div style={{padding:'14px 16px',background:'rgba(27,67,50,0.04)',borderRadius:10,display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
              <span style={{fontSize:12,color:'#6b6460'}}>Bundle Preview:</span>
              {bundleForm.totalMrp && <span style={{fontSize:14,color:'#a09890',textDecoration:'line-through'}}>₹{Number(bundleForm.totalMrp).toLocaleString('en-IN')} individually</span>}
              {bundleForm.bundlePrice && <span style={{fontSize:18,fontWeight:600,color:'#1b4332',fontFamily:"'Cormorant Garamond',serif"}}>₹{Number(bundleForm.bundlePrice).toLocaleString('en-IN')} bundle</span>}
              {bundleForm.totalMrp && bundleForm.bundlePrice && <span style={{fontSize:12,color:'#2d6a4f',background:'rgba(45,106,79,0.1)',padding:'3px 10px',borderRadius:10}}>Save ₹{(bundleForm.totalMrp - bundleForm.bundlePrice).toLocaleString('en-IN')}</span>}
              <OfferBadge type={bundleForm.offerType}/>
            </div>
          )}
          <div style={{marginTop:16}}>
            <label onClick={()=>bf('active',!bundleForm.active)} style={{display:'flex',alignItems:'center',gap:12,cursor:'pointer',width:'fit-content'}}>
              <div style={{width:44,height:26,borderRadius:13,background:bundleForm.active?'#1b4332':'rgba(27,67,50,0.15)',position:'relative',transition:'background .25s',flexShrink:0}}>
                <div style={{position:'absolute',top:3,left:bundleForm.active?20:3,width:20,height:20,borderRadius:'50%',background:'#fff',transition:'left .25s',boxShadow:'0 1px 4px rgba(0,0,0,.2)'}}/>
              </div>
              <span style={{fontSize:14,color:bundleForm.active?'#1b4332':'#6b6460'}}>{bundleForm.active?'Active (visible on site)':'Hidden (draft)'}</span>
            </label>
          </div>
        </Card>

        <div style={{display:'flex',gap:10}}>
          <Btn variant="ghost" onClick={()=>setView('dashboard')}>Cancel</Btn>
          <Btn onClick={saveBundle} disabled={loading}>{loading?'Saving…':editBundleId?'Save Changes':'Create Bundle'}</Btn>
        </div>
      </div>
      <Toast t={toast}/>
    </div>
  );

  /* ── LOGIN ── */
  if (view==='login') return (
    <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',display:'flex',alignItems:'center',justifyContent:'center',padding:24,fontFamily:"'DM Sans',sans-serif"}}>
      <PageBackground/>
      <div style={{position:'relative',zIndex:1,background:'#fff',border:'1px solid rgba(27,67,50,0.1)',borderRadius:20,padding:'48px 44px',maxWidth:420,width:'100%',textAlign:'center',boxShadow:'0 20px 60px rgba(27,67,50,0.1)'}}>
        <Image src="/logo.png" alt="Logo" width={72} height={72} style={{height:72,width:'auto',margin:'0 auto 20px'}}/>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:500,color:'#1b4332',margin:'0 0 6px'}}>Admin Panel</h1>
        <p style={{fontSize:13,color:'#6b6460',margin:'0 0 32px',lineHeight:1.6}}>Sign in to manage your collection &amp; bundles.</p>
        <input type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} autoFocus
          style={{width:'100%',padding:'14px 18px',background:'#faf9f5',border:'1.5px solid rgba(27,67,50,0.12)',borderRadius:12,fontSize:14,fontFamily:"'DM Sans',sans-serif",color:'#1a1712',outline:'none',textAlign:'center',letterSpacing:2,marginBottom:12,transition:'border-color .2s'}}
          onFocus={e=>e.target.style.borderColor='#1b4332'} onBlur={e=>e.target.style.borderColor='rgba(27,67,50,0.12)'}/>
        {pwErr && <p style={{fontSize:12,color:'#c44',marginBottom:12}}>{pwErr}</p>}
        <button onClick={login} disabled={loading} style={{width:'100%',padding:14,background:'#1b4332',border:'none',borderRadius:12,color:'#fff',fontSize:13,fontWeight:500,letterSpacing:1,textTransform:'uppercase',cursor:'pointer',opacity:loading?.6:1}}>
          {loading?'Signing in…':'Sign In'}
        </button>
        <div dir="rtl" style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:18,color:'rgba(27,67,50,0.2)',marginTop:28}}>مكتبة النور</div>
      </div>
    </div>
  );

  /* ── DASHBOARD ── */
  return (
    <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',fontFamily:"'DM Sans',sans-serif"}}>
      <PageBackground subtle/>
      <header style={{position:'sticky',top:0,zIndex:40,height:68,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 clamp(20px,5vw,48px)',background:'rgba(250,249,245,0.92)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(27,67,50,0.08)'}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <Image src="/logo.png" alt="Logo" width={36} height={36} style={{height:36,width:'auto'}}/>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:'#1b4332'}}>Maktabah An Noor</div>
            <div style={{fontSize:10,color:'#b8965a',letterSpacing:'1.5px',textTransform:'uppercase'}}>Admin Panel</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <Link href="/" style={{textDecoration:'none',padding:'9px 18px',border:'1.5px solid rgba(27,67,50,0.15)',borderRadius:20,fontSize:11,color:'#6b6460',letterSpacing:.5,textTransform:'uppercase',transition:'all .2s'}}>View Site</Link>
          {tab==='books'
            ? <Btn onClick={()=>{setEditSlug(null);setForm(EMPTY_BOOK);setImgMode('url');setView('bookEditor');}}>+ Add Book</Btn>
            : <Btn onClick={()=>{setEditBundleId(null);setBundleForm(EMPTY_BUNDLE);setView('bundleEditor');}}>+ Create Bundle</Btn>
          }
          <Btn variant="ghost" onClick={()=>{setSession('');setView('login');}}>Log Out</Btn>
        </div>
      </header>

      <div style={{position:'relative',zIndex:1,maxWidth:1100,margin:'0 auto',padding:'40px clamp(20px,5vw,48px) 80px'}}>
        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:36}}>
          {[{num:stats.total,label:'Total Books',ar:'كتاب'},{num:stats.inStock,label:'In Stock',ar:'متاح'},{num:stats.out,label:'Out of Stock',ar:'غير متاح'},{num:stats.cats,label:'Categories',ar:'تصنيف'},{num:stats.bundles,label:'Bundles',ar:'حزم'}].map((s,i)=>(
            <div key={i} style={{background:'#fff',border:'1px solid rgba(27,67,50,0.07)',borderRadius:16,padding:'20px 16px',boxShadow:'0 2px 12px rgba(27,67,50,0.04)',display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:8}}>
              <div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:400,color:'#1b4332',lineHeight:1,marginBottom:4}}>{s.num}</div>
                <div style={{fontSize:9,letterSpacing:'1.5px',textTransform:'uppercase',color:'#a09890'}}>{s.label}</div>
              </div>
              <div style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:24,color:'rgba(184,150,90,0.28)',lineHeight:1}}>{s.ar}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:4,marginBottom:24,background:'rgba(27,67,50,0.05)',borderRadius:30,padding:4,width:'fit-content'}}>
          {[{id:'books',label:`Books (${books.length})`},{id:'bundles',label:`Bundles (${bundles.length})`}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'9px 22px',borderRadius:26,border:'none',background:tab===t.id?'#1b4332':'transparent',color:tab===t.id?'#fff':'#6b6460',fontSize:12,fontWeight:tab===t.id?500:300,letterSpacing:.5,cursor:'pointer',transition:'all .2s',fontFamily:"'DM Sans',sans-serif'"}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* BOOKS LIST */}
        {tab==='books' && (
          <div style={{background:'#fff',borderRadius:20,border:'1px solid rgba(27,67,50,0.07)',boxShadow:'0 4px 20px rgba(27,67,50,0.06)',overflow:'hidden'}}>
            <div style={{padding:'20px 24px',borderBottom:'1px solid rgba(27,67,50,0.07)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:500,color:'#1b4332'}}>Book Collection</div>
              <div style={{position:'relative',maxWidth:260}}>
                <svg style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',width:14,height:14,color:'#a09890'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input type="text" placeholder="Search books…" value={search} onChange={e=>setSearch(e.target.value)}
                  style={{width:'100%',padding:'8px 14px 8px 36px',background:'#faf9f5',border:'1.5px solid rgba(27,67,50,0.1)',borderRadius:30,fontSize:13,fontFamily:"'DM Sans',sans-serif",color:'#1a1712',outline:'none'}}/>
              </div>
            </div>
            {books.length===0 ? (
              <div style={{textAlign:'center',padding:'60px 24px'}}>
                <div style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:56,color:'rgba(27,67,50,0.08)',marginBottom:12}}>الكتب</div>
                <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#6b6460',margin:'0 0 20px'}}>No books yet.</p>
                <Btn onClick={()=>{setEditSlug(null);setForm(EMPTY_BOOK);setImgMode('url');setView('bookEditor');}}>+ Add First Book</Btn>
              </div>
            ) : (
              <div>
                {filteredBooks.map((b,i)=>(
                  <div key={b.slug} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 24px',borderBottom:i<filteredBooks.length-1?'1px solid rgba(27,67,50,0.05)':'none',transition:'background .15s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(27,67,50,0.02)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <div style={{width:40,height:54,borderRadius:5,overflow:'hidden',flexShrink:0,background:'linear-gradient(155deg,#2d6a4f,#1b4332)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {b.coverUrl?<img src={b.coverUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:16,color:'#d4ab70'}}>ك</span>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                        <span style={{fontSize:14,color:'#1a1712',fontWeight:400,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:240}}>{b.title}</span>
                        {b.sku && <span style={{fontSize:9,color:'#a09890',background:'rgba(27,67,50,0.05)',padding:'2px 8px',borderRadius:8,letterSpacing:.8,textTransform:'uppercase'}}>{b.sku}</span>}
                        {b.offerType && <OfferBadge type={b.offerType}/>}
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                        <span style={{padding:'2px 10px',background:'rgba(27,67,50,0.07)',borderRadius:10,fontSize:9,color:'#1b4332',fontWeight:500,letterSpacing:.8,textTransform:'uppercase'}}>{b.category}</span>
                        <span style={{fontSize:11,color:'#a09890'}}>{b.language}</span>
                        {b.author && <span style={{fontSize:11,color:'#a09890'}}>{b.author}</span>}
                        {b.tags?.map(t=><span key={t} style={{padding:'1px 7px',background:'rgba(184,150,90,0.1)',borderRadius:10,fontSize:9,color:'#b8965a',textTransform:'uppercase',letterSpacing:.6}}>{t}</span>)}
                      </div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0,minWidth:100}}>
                      {b.mrp && b.price && b.mrp > b.price && <div style={{fontSize:11,color:'#a09890',textDecoration:'line-through'}}>₹{Number(b.mrp).toLocaleString('en-IN')}</div>}
                      {(b.price||b.mrp) && <div style={{fontSize:14,color:'#1b4332',fontWeight:500}}>₹{Number(b.price||b.mrp).toLocaleString('en-IN')}</div>}
                    </div>
                    <div style={{flexShrink:0}}>
                      <div style={{fontSize:11,fontWeight:500,color:b.inStock?'#2d6a4f':'#b44',marginBottom:2}}>{b.inStock?'In Stock':'Out'}</div>
                      {b.stockCount !== undefined && <div style={{fontSize:10,color:'#a09890'}}>{b.stockCount} units</div>}
                    </div>
                    <div style={{display:'flex',gap:6,flexShrink:0}}>
                      <button onClick={()=>openEditBook(b.slug)} style={{width:32,height:32,borderRadius:8,border:'1.5px solid rgba(27,67,50,0.12)',background:'transparent',color:'#6b6460',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .2s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(27,67,50,0.07)';e.currentTarget.style.color='#1b4332';}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#6b6460';}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
                      </button>
                      <button onClick={()=>delBook(b.slug)} style={{width:32,height:32,borderRadius:8,border:'1.5px solid rgba(27,67,50,0.12)',background:'transparent',color:'#6b6460',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .2s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(180,60,60,0.07)';e.currentTarget.style.color='#b44';}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#6b6460';}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BUNDLES LIST */}
        {tab==='bundles' && (
          <div style={{background:'#fff',borderRadius:20,border:'1px solid rgba(27,67,50,0.07)',boxShadow:'0 4px 20px rgba(27,67,50,0.06)',overflow:'hidden'}}>
            <div style={{padding:'20px 24px',borderBottom:'1px solid rgba(27,67,50,0.07)'}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:500,color:'#1b4332'}}>Bundle Deals</div>
            </div>
            {bundles.length===0 ? (
              <div style={{textAlign:'center',padding:'60px 24px'}}>
                <div style={{fontSize:48,marginBottom:12,opacity:.2}}>📦</div>
                <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#6b6460',margin:'0 0 20px'}}>No bundles yet. Create your first bundle deal.</p>
                <Btn onClick={()=>{setEditBundleId(null);setBundleForm(EMPTY_BUNDLE);setView('bundleEditor');}}>+ Create First Bundle</Btn>
              </div>
            ) : (
              <div>
                {bundles.map((b,i)=>(
                  <div key={b.id} style={{display:'flex',alignItems:'center',gap:16,padding:'16px 24px',borderBottom:i<bundles.length-1?'1px solid rgba(27,67,50,0.05)':'none',transition:'background .15s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(27,67,50,0.02)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <div style={{width:44,height:44,borderRadius:10,background:'linear-gradient(135deg,#2d6a4f,#b8965a)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <span style={{fontSize:18}}>📦</span>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                        <span style={{fontSize:15,color:'#1a1712',fontWeight:400}}>{b.name}</span>
                        {b.sku && <span style={{fontSize:9,color:'#a09890',background:'rgba(27,67,50,0.05)',padding:'2px 8px',borderRadius:8,letterSpacing:.8,textTransform:'uppercase'}}>{b.sku}</span>}
                        <OfferBadge type={b.offerType}/>
                        {!b.active && <span style={{fontSize:9,color:'#a09890',background:'rgba(0,0,0,0.06)',padding:'2px 8px',borderRadius:8,letterSpacing:.8,textTransform:'uppercase'}}>Hidden</span>}
                      </div>
                      <div style={{fontSize:12,color:'#a09890'}}>{b.bookSlugs?.length || 0} books · {b.stockCount} units in stock</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0,minWidth:120}}>
                      {b.totalMrp && <div style={{fontSize:11,color:'#a09890',textDecoration:'line-through'}}>₹{Number(b.totalMrp).toLocaleString('en-IN')} individually</div>}
                      <div style={{fontSize:15,color:'#1b4332',fontWeight:500}}>₹{Number(b.bundlePrice).toLocaleString('en-IN')} bundle</div>
                      {b.totalMrp && b.bundlePrice && <div style={{fontSize:10,color:'#2d6a4f'}}>Save ₹{(b.totalMrp-b.bundlePrice).toLocaleString('en-IN')}</div>}
                    </div>
                    <div style={{display:'flex',gap:6,flexShrink:0,alignItems:'center'}}>
                      <button onClick={()=>toggleBundleActive(b.id,!b.active)} style={{padding:'5px 12px',borderRadius:20,border:`1.5px solid ${b.active?'rgba(45,106,79,0.3)':'rgba(27,67,50,0.15)'}`,background:b.active?'rgba(45,106,79,0.07)':'transparent',color:b.active?'#2d6a4f':'#6b6460',fontSize:10,cursor:'pointer',letterSpacing:.8,textTransform:'uppercase',transition:'all .2s'}}>
                        {b.active?'Active':'Hidden'}
                      </button>
                      <button onClick={()=>openEditBundle(b.id)} style={{width:32,height:32,borderRadius:8,border:'1.5px solid rgba(27,67,50,0.12)',background:'transparent',color:'#6b6460',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .2s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(27,67,50,0.07)';e.currentTarget.style.color='#1b4332';}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#6b6460';}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
                      </button>
                      <button onClick={()=>delBundle(b.id)} style={{width:32,height:32,borderRadius:8,border:'1.5px solid rgba(27,67,50,0.12)',background:'transparent',color:'#6b6460',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .2s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(180,60,60,0.07)';e.currentTarget.style.color='#b44';}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#6b6460';}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <Toast t={toast}/>
    </div>
  );
}

function Card({title,children}) {
  return (
    <div style={{background:'#fff',borderRadius:16,padding:28,border:'1px solid rgba(27,67,50,0.07)',boxShadow:'0 2px 12px rgba(27,67,50,0.04)'}}>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#1b4332',fontWeight:500,marginBottom:20,paddingBottom:14,borderBottom:'1px solid rgba(27,67,50,0.06)'}}>{title}</div>
      {children}
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

'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { CATEGORIES, LANGUAGES, BINDINGS, TAGS } from '@/lib/constants';

const EMPTY = {
  title:'', titleAr:'', author:'', authorAr:'',
  language:'Arabic', category:'Aqeedah', description:'',
  volumes:1, binding:'Hardcover', pages:'',
  inStock:true, tags:[], coverUrl:'',
};

function fmt(iso) { return new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }

export default function AdminPage() {
  const [view, setView]           = useState('login');
  const [pw, setPw]               = useState('');
  const [pwErr, setPwErr]         = useState('');
  const [session, setSession]     = useState('');
  const [books, setBooks]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [editSlug, setEditSlug]   = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [imgMode, setImgMode]     = useState('url'); // 'url' | 'upload'
  const [toast, setToast]         = useState({msg:'',type:'',show:false});
  const [search, setSearch]       = useState('');
  const timer = useRef(null);
  const fileRef = useRef(null);

  function f(k,v){ setForm(p=>({...p,[k]:v})); }
  function showToast(msg,type=''){
    setToast({msg,type,show:true});
    clearTimeout(timer.current);
    timer.current=setTimeout(()=>setToast(t=>({...t,show:false})),3000);
  }

  async function login(){
    if(!pw.trim()) return;
    setLoading(true); setPwErr('');
    try{
      const r=await fetch('/api/books?all=1');
      const check=await fetch('/api/books',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw,title:'__auth__'})});
      if(check.status===401) throw new Error('Incorrect password.');
      const cd=await check.json();
      if(cd.slug) await fetch(`/api/books/${cd.slug}`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})});
      setSession(pw); await loadBooks(pw); setView('dashboard'); setPw('');
    }catch(e){setPwErr(e.message);}finally{setLoading(false);}
  }

  async function loadBooks(s=session){
    try{const r=await fetch('/api/books?all=1');const d=await r.json();setBooks(d.books||[]);}catch{}
  }

  async function openEdit(slug){
    setLoading(true);
    try{
      const r=await fetch(`/api/books/${slug}`);const d=await r.json();
      if(d.book){
        setEditSlug(slug);
        setForm({
          title:d.book.title||'',titleAr:d.book.titleAr||'',
          author:d.book.author||'',authorAr:d.book.authorAr||'',
          language:d.book.language||'Arabic',category:d.book.category||'Aqeedah',
          description:d.book.description||'',volumes:d.book.volumes||1,
          binding:d.book.binding||'Hardcover',pages:d.book.pages||'',
          inStock:d.book.inStock!==false,tags:d.book.tags||[],
          coverUrl:d.book.coverUrl||'',
        });
        setImgMode('url'); setView('editor');
      }
    }catch{showToast('Failed to load.','error');}finally{setLoading(false);}
  }

  async function save(){
    if(!form.title.trim()){showToast('Title is required.','error');return;}
    setLoading(true);
    try{
      const r=editSlug
        ?await fetch(`/api/books/${editSlug}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session,...form})})
        :await fetch('/api/books',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session,...form})});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||'Failed');
      showToast(editSlug?'✓ Book updated!':'✓ Book added!','success');
      await loadBooks(); setView('dashboard');
    }catch(e){showToast(e.message,'error');}finally{setLoading(false);}
  }

  async function del(slug){
    if(!confirm('Delete this book?')) return;
    try{
      await fetch(`/api/books/${slug}`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session})});
      showToast('Book deleted.'); await loadBooks();
    }catch{showToast('Failed.','error');}
  }

  function handleImageUpload(e){
    const file=e.target.files?.[0];
    if(!file) return;
    const reader=new FileReader();
    reader.onload=(ev)=>f('coverUrl',ev.target.result);
    reader.readAsDataURL(file);
  }

  function toggleTag(tag){ f('tags', form.tags.includes(tag)?form.tags.filter(t=>t!==tag):[...form.tags,tag]); }

  const filtered = useMemo(()=>books.filter(b=>{
    const q=search.toLowerCase();
    return !q||b.title?.toLowerCase().includes(q)||b.author?.toLowerCase().includes(q);
  }),[books,search]);

  const stats = useMemo(()=>({
    total:books.length,
    inStock:books.filter(b=>b.inStock).length,
    outOfStock:books.filter(b=>!b.inStock).length,
    cats:[...new Set(books.map(b=>b.category))].length,
  }),[books]);

  /* LOGIN */
  if(view==='login') return (
    <div className="admin-page">
      <div className="admin-login-wrap">
        <div className="admin-login-card">
          <Image src="/logo.png" alt="Logo" width={64} height={64} className="al-logo" />
          <h1 className="al-title">Admin Panel</h1>
          <p className="al-sub">Sign in to manage the book collection.</p>
          <input className="al-input" type="password" placeholder="Password"
            value={pw} onChange={e=>setPw(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&login()} autoFocus />
          <p className="al-error">{pwErr}</p>
          <button className="al-btn" onClick={login} disabled={loading}>{loading?'Signing in…':'Sign In'}</button>
        </div>
      </div>
      <T t={toast}/>
    </div>
  );

  /* EDITOR */
  if(view==='editor') return (
    <div className="admin-page">
      <header className="adm-header">
        <Image src="/logo.png" alt="Logo" width={40} height={40} className="adm-logo" />
        <div className="adm-header-right">
          <button className="adm-sm-btn" onClick={()=>setView('dashboard')}>← Dashboard</button>
          <button className="adm-sm-btn primary" onClick={save} disabled={loading}>{loading?'Saving…':editSlug?'Save Changes':'Add Book'}</button>
        </div>
      </header>

      <div className="adm-body">
        <div className="adm-form-wrap">
          <h2 className="adm-form-title">{editSlug?'Edit Book':'Add New Book'}</h2>
          <div className="adm-form">

            {/* Titles */}
            <div className="form-row form-row-2">
              <div className="f-group">
                <label className="f-label">Book Title (English) *</label>
                <input className="f-input" type="text" placeholder="e.g. Sahih Al-Bukhari" value={form.title} onChange={e=>f('title',e.target.value)}/>
              </div>
              <div className="f-group">
                <label className="f-label">Book Title (Arabic)</label>
                <input className="f-input" type="text" placeholder="e.g. صحيح البخاري" value={form.titleAr} onChange={e=>f('titleAr',e.target.value)} dir="rtl" style={{fontFamily:"'Noto Naskh Arabic',serif"}}/>
              </div>
            </div>

            {/* Authors */}
            <div className="form-row form-row-2">
              <div className="f-group">
                <label className="f-label">Author (English)</label>
                <input className="f-input" type="text" placeholder="e.g. Imam Al-Bukhari" value={form.author} onChange={e=>f('author',e.target.value)}/>
              </div>
              <div className="f-group">
                <label className="f-label">Author (Arabic)</label>
                <input className="f-input" type="text" placeholder="e.g. الإمام البخاري" value={form.authorAr} onChange={e=>f('authorAr',e.target.value)} dir="rtl" style={{fontFamily:"'Noto Naskh Arabic',serif"}}/>
              </div>
            </div>

            {/* Category / Language / Binding */}
            <div className="form-row form-row-3">
              <div className="f-group">
                <label className="f-label">Category *</label>
                <select className="f-select" value={form.category} onChange={e=>f('category',e.target.value)}>
                  {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="f-group">
                <label className="f-label">Language *</label>
                <select className="f-select" value={form.language} onChange={e=>f('language',e.target.value)}>
                  {LANGUAGES.map(l=><option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="f-group">
                <label className="f-label">Binding</label>
                <select className="f-select" value={form.binding} onChange={e=>f('binding',e.target.value)}>
                  <option value="">— Select —</option>
                  {BINDINGS.map(b=><option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            {/* Volumes / Pages */}
            <div className="form-row form-row-2">
              <div className="f-group">
                <label className="f-label">Number of Volumes</label>
                <input className="f-input" type="number" min="1" value={form.volumes} onChange={e=>f('volumes',e.target.value)}/>
              </div>
              <div className="f-group">
                <label className="f-label">Number of Pages</label>
                <input className="f-input" type="number" min="1" placeholder="Optional" value={form.pages} onChange={e=>f('pages',e.target.value)}/>
              </div>
            </div>

            {/* Description */}
            <div className="f-group">
              <label className="f-label">Short Description</label>
              <textarea className="f-textarea" rows={3} placeholder="2–3 lines about what this book covers…" value={form.description} onChange={e=>f('description',e.target.value)}/>
            </div>

            <hr className="form-divider"/>

            {/* Cover image */}
            <div className="f-group">
              <label className="f-label">Cover Image</label>
              <div style={{display:'flex',gap:8,marginBottom:10}}>
                <button type="button" onClick={()=>setImgMode('url')} style={{padding:'6px 14px',borderRadius:6,border:'1px solid var(--border)',background:imgMode==='url'?'var(--green-d)':'transparent',color:imgMode==='url'?'var(--green)':'var(--muted)',fontSize:12,cursor:'pointer'}}>Paste URL</button>
                <button type="button" onClick={()=>setImgMode('upload')} style={{padding:'6px 14px',borderRadius:6,border:'1px solid var(--border)',background:imgMode==='upload'?'var(--green-d)':'transparent',color:imgMode==='upload'?'var(--green)':'var(--muted)',fontSize:12,cursor:'pointer'}}>Upload Image</button>
              </div>
              {imgMode==='url'?(
                <input className="f-input" type="url" placeholder="https://… (image URL)" value={form.coverUrl.startsWith('data:') ? '' : form.coverUrl} onChange={e=>f('coverUrl',e.target.value)}/>
              ):(
                <div className={`img-upload-area${form.coverUrl?'.has-img':''}`} onClick={()=>fileRef.current?.click()}>
                  {form.coverUrl
                    ?<img src={form.coverUrl} alt="Cover preview" className="img-preview"/>
                    :<><p className="img-upload-text">Click to upload cover image</p><p className="img-upload-sub">JPG, PNG — Max 2MB recommended</p></>
                  }
                  <input ref={fileRef} type="file" accept="image/*" className="img-upload-input" onChange={handleImageUpload}/>
                </div>
              )}
              {form.coverUrl && (
                <button type="button" onClick={()=>f('coverUrl','')} style={{marginTop:6,fontSize:11,color:'var(--xs)',background:'none',border:'none',cursor:'pointer',textAlign:'left'}}>✕ Remove image</button>
              )}
            </div>

            <hr className="form-divider"/>

            {/* Tags */}
            <div className="f-group">
              <label className="f-label">Tags</label>
              <div className="tags-grid">
                {TAGS.map(t=>(
                  <label key={t} className={`tag-check${form.tags.includes(t)?' on':''}`} onClick={()=>toggleTag(t)}>
                    <input type="checkbox" checked={form.tags.includes(t)} readOnly/>
                    {t}
                  </label>
                ))}
              </div>
            </div>

            {/* In stock */}
            <div className="f-group">
              <label className="f-label">Availability</label>
              <label className="toggle-row" onClick={()=>f('inStock',!form.inStock)}>
                <div className={`sw${form.inStock?' on':''}`}><div className="sw-k"/></div>
                {form.inStock?'In Stock':'Out of Stock'}
              </label>
            </div>

            <div className="form-actions">
              <button className="adm-sm-btn" onClick={()=>setView('dashboard')}>Cancel</button>
              <button className="adm-sm-btn primary" onClick={save} disabled={loading}>{loading?'Saving…':editSlug?'Save Changes':'Add Book'}</button>
            </div>
          </div>
        </div>
      </div>
      <T t={toast}/>
    </div>
  );

  /* DASHBOARD */
  return (
    <div className="admin-page">
      <header className="adm-header">
        <Image src="/logo.png" alt="Logo" width={40} height={40} className="adm-logo"/>
        <div className="adm-header-right">
          <span className="adm-tag">Admin</span>
          <button className="adm-sm-btn primary" onClick={()=>{setEditSlug(null);setForm(EMPTY);setImgMode('url');setView('editor');}}>+ Add Book</button>
          <button className="adm-sm-btn" onClick={()=>{setSession('');setView('login');}}>Log out</button>
        </div>
      </header>

      <div className="adm-body">
        <div className="adm-stats">
          <div className="adm-stat"><div className="adm-stat-num">{stats.total}</div><div className="adm-stat-label">Total Books</div></div>
          <div className="adm-stat"><div className="adm-stat-num">{stats.inStock}</div><div className="adm-stat-label">In Stock</div></div>
          <div className="adm-stat"><div className="adm-stat-num">{stats.outOfStock}</div><div className="adm-stat-label">Out of Stock</div></div>
          <div className="adm-stat"><div className="adm-stat-num">{stats.cats}</div><div className="adm-stat-label">Categories</div></div>
        </div>

        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,marginBottom:16}}>
          <div className="adm-section-title">Books ({filtered.length})</div>
          <div style={{position:'relative',maxWidth:280}}>
            <input style={{padding:'8px 12px 8px 32px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:'none',width:'100%'}} type="text" placeholder="Search books…" value={search} onChange={e=>setSearch(e.target.value)}/>
            <svg style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',width:14,height:14,color:'var(--xs)'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </div>
        </div>

        {books.length===0?(
          <div style={{textAlign:'center',padding:'60px 0',color:'var(--muted)',fontSize:14}}>
            No books yet. <button onClick={()=>{setEditSlug(null);setForm(EMPTY);setView('editor');}} style={{color:'var(--green)',background:'none',border:'none',fontSize:14,cursor:'pointer'}}>Add your first book →</button>
          </div>
        ):(
          <div className="adm-books-list">
            {filtered.map(b=>(
              <div key={b.slug} className="adm-book-row">
                <div className="adm-book-thumb">
                  {b.coverUrl?<img src={b.coverUrl} alt={b.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:null}
                </div>
                <div className="adm-book-info">
                  <div className="adm-book-title">{b.title}{b.titleAr&&<span style={{fontFamily:"'Noto Naskh Arabic',serif",marginRight:8,color:'var(--gold)',fontSize:13}}> · {b.titleAr}</span>}</div>
                  <div className="adm-book-meta">
                    <span className="adm-book-cat">{b.category}</span>
                    <span className="adm-book-lang">{b.language}</span>
                    {b.author&&<span className="adm-book-author">{b.author}</span>}
                    {b.tags?.length>0&&b.tags.map(t=><span key={t} style={{fontSize:10,color:'var(--gold)',background:'var(--gold-d)',padding:'1px 7px',borderRadius:999}}>{t}</span>)}
                  </div>
                </div>
                <span className={`adm-status${b.inStock?' in':' out'}`}>{b.inStock?'In Stock':'Out of Stock'}</span>
                <div className="adm-row-actions">
                  <button className="icon-btn" title="Edit" onClick={()=>openEdit(b.slug)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
                  </button>
                  <button className="icon-btn del" title="Delete" onClick={()=>del(b.slug)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <T t={toast}/>
    </div>
  );
}

function T({t}){ return <div className={`toast${t.show?' show':''}${t.type?` ${t.type}`:''}`}>{t.msg}</div>; }

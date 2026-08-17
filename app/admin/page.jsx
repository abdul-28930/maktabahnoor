'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { DEFAULT_CATEGORIES, DEFAULT_LANGUAGES, BINDINGS, TAGS, DEFAULT_OFFER_TYPES, MANDATORY_BOOK_FIELDS } from '@/lib/constants';
import PageBackground from '@/components/PageBackground';

const EMPTY_BOOK = {
  title:'',author:'',translator:'',publisher:'',sku:'',language:'Arabic',category:'Aqeedah',
  description:'',volumes:1,binding:'Hardcover',pages:'',
  mrp:'',price:'',offerType:'',stockCount:'',
  inStock:true,visible:true,tags:[],coverUrl:'',gallery:[],
};

// Labels shown next to the field + used to build the "please fill these in"
// validation message. Must match MANDATORY_BOOK_FIELDS keys in lib/constants.js.
const FIELD_LABELS = { title:'Title', author:'Author', category:'Category', language:'Language', price:'Sale Price', stockCount:'Stock Count', binding:'Binding' };
const EMPTY_BUNDLE = {
  name:'',description:'',sku:'',bookSlugs:[],
  totalMrp:'',bundlePrice:'',offerType:'Limited Deal',stockCount:'',active:true,
};

const EMPTY_SLIDE = {
  mode:'book', bookSlug:'', imageUrl:'', eyebrow:'', title:'', subtitle:'',
  ctaLabel:'', ctaUrl:'', active:true,
};

const EMPTY_ACCESSORY = { name:'',description:'',price:'',mrp:'',stockCount:'',coverUrl:'',variants:[],visible:true };
const EMPTY_COUPON = { code:'',type:'percent',value:'',minOrder:'',expiresAt:'',active:true };

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
const FInput = ({value,onChange,placeholder,type='text',dir,prefix,min,style={}}) => (
  <div style={{position:'relative'}}>
    {prefix && <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontSize:14,color:'#6b6460',pointerEvents:'none'}}>{prefix}</span>}
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} dir={dir} min={min}
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

// A select whose option list is admin-extensible: picking "+ Add new option…"
// swaps in a small text input; submitting it saves the new option to the
// shared taxonomy (via onAddOption) and selects it immediately.
const ADD_NEW = '__add_new__';
const TaxonomySelect = ({value,onChange,options,placeholder,onAddOption}) => {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft]   = useState('');

  if (adding) {
    return (
      <div style={{display:'flex',gap:6}}>
        <div style={{flex:1}}>
          <FInput value={draft} onChange={e=>setDraft(e.target.value)} placeholder="New option name" />
        </div>
        <button type="button" onClick={async ()=>{
            const v = draft.trim();
            if (!v) return;
            await onAddOption(v);
            onChange({ target: { value: v } });
            setAdding(false); setDraft('');
          }}
          style={{padding:'0 16px',borderRadius:10,border:'none',background:'#1b4332',color:'#fff',fontSize:12,cursor:'pointer',flexShrink:0}}>Add</button>
        <button type="button" onClick={()=>{setAdding(false);setDraft('');}}
          style={{padding:'0 14px',borderRadius:10,border:'1.5px solid rgba(27,67,50,0.15)',background:'transparent',color:'#6b6460',fontSize:12,cursor:'pointer',flexShrink:0}}>✕</button>
      </div>
    );
  }

  return (
    <select value={value} onChange={e => e.target.value === ADD_NEW ? setAdding(true) : onChange(e)}
      style={{width:'100%',padding:'11px 14px',background:'#faf9f5',border:'1.5px solid rgba(27,67,50,0.12)',borderRadius:10,color:value?'#1a1712':'#a09890',fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:'none',cursor:'pointer',appearance:'none',transition:'border-color .2s'}}
      onFocus={e=>e.target.style.borderColor='#1b4332'} onBlur={e=>e.target.style.borderColor='rgba(27,67,50,0.12)'}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o=><option key={o} value={o}>{o}</option>)}
      <option value={ADD_NEW}>+ Add new option…</option>
    </select>
  );
};

export default function AdminPage() {
  const [view, setView]           = useState('login');
  const [tab, setTab]             = useState('books');
  const [pw, setPw]               = useState('');
  const [pwErr, setPwErr]         = useState('');
  const [session, setSession]     = useState('');
  const [books, setBooks]         = useState([]);
  const [bundles, setBundles]     = useState([]);
  const [orders, setOrders]       = useState([]);
  const [views, setViews]         = useState({});
  const [slides, setSlides]       = useState([]);
  const [picks, setPicks]         = useState({ featured: [], newArrivals: [] });
  const [accessories, setAccessories] = useState([]);
  const [coupons, setCoupons]     = useState([]);
  const [couponForm, setCouponForm] = useState(EMPTY_COUPON);
  const [editAccId, setEditAccId] = useState(null);
  const [accForm, setAccForm]     = useState(EMPTY_ACCESSORY);
  const [accImgMode, setAccImgMode] = useState('url');
  const [taxonomy, setTaxonomy]   = useState({ categories: DEFAULT_CATEGORIES, languages: DEFAULT_LANGUAGES, offerTypes: DEFAULT_OFFER_TYPES });
  const [loading, setLoading]     = useState(false);
  const [editSlug, setEditSlug]   = useState(null);
  const [slugInput, setSlugInput] = useState('');
  const [slugSaving, setSlugSaving] = useState(false);
  const [editBundleId, setEditBundleId] = useState(null);
  const [editSlideId, setEditSlideId] = useState(null);
  const [form, setForm]           = useState(EMPTY_BOOK);
  const [bundleForm, setBundleForm] = useState(EMPTY_BUNDLE);
  const [slideForm, setSlideForm] = useState(EMPTY_SLIDE);
  const [slideImgMode, setSlideImgMode] = useState('url');
  const [imgMode, setImgMode]     = useState('url');
  const [galleryInput, setGalleryInput] = useState('');
  const [search, setSearch]       = useState('');
  const [bookPage, setBookPage]   = useState(1);
  const [selected, setSelected]   = useState(new Set());
  const BOOK_PAGE_SIZE = 20;
  const [toast, setToast]         = useState({msg:'',type:'',show:false});
  const timer   = useRef(null);
  const fileRef = useRef(null);

  function f(k,v)  { setForm(p=>({...p,[k]:v})); }
  function bf(k,v) { setBundleForm(p=>({...p,[k]:v})); }
  function sf(k,v) { setSlideForm(p=>({...p,[k]:v})); }
  function af(k,v) { setAccForm(p=>({...p,[k]:v})); }
  function addVariant() { setAccForm(p=>({...p,variants:[...p.variants,{id:Date.now().toString(36),label:'',color:'#1b4332',stockCount:0}]})); }
  function updVariant(id,k,v) { setAccForm(p=>({...p,variants:p.variants.map(x=>x.id===id?{...x,[k]:v}:x)})); }
  function rmVariant(id) { setAccForm(p=>({...p,variants:p.variants.filter(x=>x.id!==id)})); }
  function cf(k,v) { setCouponForm(p=>({...p,[k]:v})); }
  async function loadCoupons(s=session) {
    try { const r=await fetch(`/api/coupons?password=${encodeURIComponent(s)}`); const d=await r.json(); setCoupons(d.coupons||[]); } catch {}
  }
  async function saveCoupon() {
    if (!couponForm.code.trim()) { showToast('Coupon code is required.','error'); return; }
    if (!couponForm.value) { showToast('Discount value is required.','error'); return; }
    setLoading(true);
    try {
      const r = await fetch('/api/coupons',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session,...couponForm})});
      const d = await r.json();
      if (!r.ok) throw new Error(d.error||'Failed');
      showToast('✓ Coupon created!','success');
      setCouponForm(EMPTY_COUPON); await loadCoupons();
    } catch(e) { showToast(e.message,'error'); }
    finally { setLoading(false); }
  }
  async function delCoupon(code) {
    if (!confirm(`Delete coupon ${code}?`)) return;
    try { await fetch(`/api/coupons/${code}`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session})}); showToast('Deleted.'); await loadCoupons(); } catch { showToast('Failed.','error'); }
  }
  async function toggleCouponActive(code, active) {
    try { await fetch(`/api/coupons/${code}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session,active})}); await loadCoupons(); showToast(active?'Activated.':'Deactivated.','success'); } catch { showToast('Failed.','error'); }
  }
  async function loadAccessories(s=session) {
    try { const r=await fetch(`/api/accessories?password=${encodeURIComponent(s)}`); const d=await r.json(); setAccessories(d.accessories||[]); } catch {}
  }
  async function saveAcc() {
    if (!accForm.name.trim()) { showToast('Name is required.','error'); return; }
    if (accForm.price==='') { showToast('Price is required.','error'); return; }
    if (accForm.stockCount==='') { showToast('Stock count is required.','error'); return; }
    setLoading(true);
    try {
      const r = editAccId
        ? await fetch(`/api/accessories/${editAccId}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session,...accForm})})
        : await fetch('/api/accessories',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session,...accForm})});
      const d = await r.json();
      if (!r.ok) throw new Error(d.error||'Failed');
      showToast(editAccId?'✓ Accessory updated!':'✓ Accessory added!','success');
      await loadAccessories(); setView('dashboard'); setTab('accessories');
    } catch(e) { showToast(e.message,'error'); }
    finally { setLoading(false); }
  }
  async function delAcc(id) {
    if (!confirm('Delete this accessory?')) return;
    try { await fetch(`/api/accessories/${id}`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session})}); showToast('Deleted.'); await loadAccessories(); } catch { showToast('Failed.','error'); }
  }
  async function toggleAccVisible(id, visible) {
    try { await fetch(`/api/accessories/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session,visible})}); await loadAccessories(); showToast(visible?'Shown on site.':'Hidden from site.','success'); } catch { showToast('Failed.','error'); }
  }
  function openEditAcc(a) {
    setEditAccId(a.id);
    setAccForm({ name:a.name||'',description:a.description||'',price:a.price??'',mrp:a.mrp??'',stockCount:a.stockCount??'',coverUrl:a.coverUrl||'',variants:a.variants||[],visible:a.visible!==false });
    setAccImgMode('url'); setView('accEditor');
  }
  function handleAccImg(e) {
    const file=e.target.files?.[0]; if(!file) return;
    new Promise((res,rej)=>{const r=new FileReader();r.onload=ev=>res(ev.target.result);r.onerror=rej;r.readAsDataURL(file);}).then(d=>af('coverUrl',d));
  }

  function showToast(msg,type='') {
    setToast({msg,type,show:true});
    clearTimeout(timer.current);
    timer.current = setTimeout(()=>setToast(t=>({...t,show:false})),3000);
  }

  async function login() {
    if (!pw.trim()) return;
    setLoading(true); setPwErr('');
    try {
      const r = await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})});
      const d = await r.json();
      if (!r.ok) throw new Error(d.error||'Incorrect password.');
      setSession(pw); setView('dashboard'); setPw('');
      loadBooks(pw); loadBundles(pw); loadOrders(pw); loadViews(pw); loadTaxonomy(); loadSlides(pw); loadPicks(); loadAccessories(pw); loadCoupons(pw);
    } catch(e) { setPwErr(e.message); }
    finally { setLoading(false); }
  }

  async function loadBooks(s=session) {
    try { const r=await fetch(`/api/books?all=1&password=${encodeURIComponent(s)}`); const d=await r.json(); setBooks(d.books||[]); } catch {}
  }
  async function loadBundles(s=session) {
    try { const r=await fetch('/api/bundles'); const d=await r.json(); setBundles(d.bundles||[]); } catch {}
  }
  async function loadOrders(s=session) {
    try { const r=await fetch(`/api/orders?password=${encodeURIComponent(s)}`); const d=await r.json(); setOrders(d.orders||[]); } catch {}
  }
  async function loadViews(s=session) {
    try { const r=await fetch(`/api/analytics?password=${encodeURIComponent(s)}`); const d=await r.json(); setViews(d.views||{}); } catch {}
  }
  async function loadTaxonomy() {
    try { const r=await fetch('/api/taxonomy'); const d=await r.json(); if (d.taxonomy) setTaxonomy(d.taxonomy); } catch {}
  }
  async function loadSlides(s=session) {
    try { const r=await fetch(`/api/hero-slides?password=${encodeURIComponent(s)}`); const d=await r.json(); setSlides(d.slides||[]); } catch {}
  }
  async function loadPicks() {
    try { const r=await fetch('/api/homepage-picks'); const d=await r.json(); setPicks(d.picks||{featured:[],newArrivals:[]}); } catch {}
  }
  async function savePicks() {
    setLoading(true);
    try {
      const r = await fetch('/api/homepage-picks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session,...picks})});
      const d = await r.json();
      if (!r.ok) throw new Error(d.error||'Failed');
      showToast('✓ Homepage picks saved!','success');
    } catch(e) { showToast(e.message,'error'); }
    finally { setLoading(false); }
  }
  async function addTaxonomyOption(field, value) {
    try {
      const r = await fetch('/api/taxonomy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session,field,value})});
      const d = await r.json();
      if (!r.ok) throw new Error(d.error||'Failed to add option.');
      setTaxonomy(d.taxonomy);
      showToast(`✓ Added "${value}".`,'success');
    } catch(e) { showToast(e.message,'error'); }
  }
  async function toggleOrderFulfilled(orderRef, fulfilled) {
    try {
      await fetch('/api/orders',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session,orderRef,fulfilled})});
      await loadOrders(); showToast(fulfilled?'Marked fulfilled.':'Marked pending.','success');
    } catch { showToast('Failed.','error'); }
  }
  async function delOrder(orderRef) {
    if (!confirm('Delete this order record?')) return;
    try {
      await fetch('/api/orders',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session,orderRef})});
      showToast('Order deleted.'); await loadOrders();
    } catch { showToast('Failed.','error'); }
  }

  async function openEditBook(slug) {
    setLoading(true);
    try {
      const r=await fetch(`/api/books/${slug}`); const d=await r.json();
      if (d.book) {
        setEditSlug(slug);
        setForm({
          title:d.book.title||'',author:d.book.author||'',translator:d.book.translator||'',publisher:d.book.publisher||'',
          sku:d.book.sku||'',language:d.book.language||'Arabic',
          category:d.book.category||'Aqeedah',description:d.book.description||'',
          volumes:d.book.volumes||1,binding:d.book.binding||'Hardcover',pages:d.book.pages||'',
          mrp:d.book.mrp||'',price:d.book.price||'',offerType:d.book.offerType||'',
          stockCount:d.book.stockCount??'',inStock:d.book.inStock!==false,visible:d.book.visible!==false,
          tags:d.book.tags||[],coverUrl:d.book.coverUrl||'',gallery:d.book.gallery||[],
        });
        setImgMode('url'); setSlugInput(slug); setView('bookEditor');
      }
    } catch { showToast('Failed to load.','error'); }
    finally { setLoading(false); }
  }

  async function renameSlug() {
    if (!slugInput.trim() || slugInput === editSlug) return;
    setSlugSaving(true);
    try {
      const r = await fetch(`/api/books/${editSlug}/rename`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session,newSlug:slugInput})});
      const d = await r.json();
      if (!r.ok) throw new Error(d.error||'Failed to rename.');
      showToast(`✓ URL changed to /book/${d.newSlug}`,'success');
      setEditSlug(d.newSlug); setSlugInput(d.newSlug);
      await loadBooks();
    } catch(e) { showToast(e.message,'error'); }
    finally { setSlugSaving(false); }
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

  async function openEditSlide(slide) {
    setEditSlideId(slide.id);
    setSlideForm({
      mode: slide.mode || 'book', bookSlug: slide.bookSlug || '', imageUrl: slide.imageUrl || '',
      eyebrow: slide.eyebrow || '', title: slide.title || '', subtitle: slide.subtitle || '',
      ctaLabel: slide.ctaLabel || '', ctaUrl: slide.ctaUrl || '', active: slide.active !== false,
    });
    setSlideImgMode('url');
    setView('slideEditor');
  }

  function missingBookFields() {
    return MANDATORY_BOOK_FIELDS.filter(k => !String(form[k] ?? '').trim()).map(k => FIELD_LABELS[k] || k);
  }

  async function saveBook() {
    const missing = missingBookFields();
    if (missing.length) { showToast(`Please fill in: ${missing.join(', ')}.`,'error'); return; }
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

  async function saveSlide() {
    if (slideForm.mode === 'book' && !slideForm.bookSlug) { showToast('Select a book to feature.','error'); return; }
    if (slideForm.mode === 'custom' && !slideForm.imageUrl.trim()) { showToast('An image is required for a custom slide.','error'); return; }
    if (slideForm.mode === 'custom' && !slideForm.title.trim()) { showToast('Title is required for a custom slide.','error'); return; }
    setLoading(true);
    try {
      const r = editSlideId
        ? await fetch(`/api/hero-slides/${editSlideId}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session,...slideForm})})
        : await fetch('/api/hero-slides',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session,...slideForm})});
      const d = await r.json();
      if (!r.ok) throw new Error(d.error||'Failed');
      showToast(editSlideId?'✓ Slide updated!':'✓ Slide added!','success');
      await loadSlides(); setView('dashboard'); setTab('slides');
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

  async function toggleBookVisible(slug, visible) {
    try {
      await fetch(`/api/books/${slug}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session,visible})});
      await loadBooks(); showToast(visible?'Book shown on site.':'Book hidden from site.','success');
    } catch { showToast('Failed.','error'); }
  }

  async function delSlide(id) {
    if (!confirm('Delete this slide?')) return;
    try {
      await fetch(`/api/hero-slides/${id}`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session})});
      showToast('Slide deleted.'); await loadSlides();
    } catch { showToast('Failed.','error'); }
  }

  async function toggleSlideActive(id, active) {
    try {
      await fetch(`/api/hero-slides/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session,active})});
      await loadSlides(); showToast(active?'Slide shown on homepage.':'Slide hidden.','success');
    } catch { showToast('Failed.','error'); }
  }

  async function moveSlide(id, dir) {
    const ordered = [...slides].sort((a,b)=>(a.order??0)-(b.order??0));
    const idx = ordered.findIndex(s=>s.id===id);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= ordered.length) return;
    const a = ordered[idx], b = ordered[swapIdx];
    try {
      await Promise.all([
        fetch(`/api/hero-slides/${a.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session,order:b.order??0})}),
        fetch(`/api/hero-slides/${b.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session,order:a.order??0})}),
      ]);
      await loadSlides();
    } catch { showToast('Failed to reorder.','error'); }
  }

  function handleImg(e) {
    const file=e.target.files?.[0]; if(!file) return;
    new Promise((res,rej)=>{const r=new FileReader();r.onload=ev=>res(ev.target.result);r.onerror=rej;r.readAsDataURL(file);}).then(d=>f('coverUrl',d));
  }
  function handleSlideImg(e) {
    const file=e.target.files?.[0]; if(!file) return;
    new Promise((res,rej)=>{const r=new FileReader();r.onload=ev=>res(ev.target.result);r.onerror=rej;r.readAsDataURL(file);}).then(d=>sf('imageUrl',d));
  }

  function exportBooksCsv() {
    const cols = ['slug','sku','title','author','translator','publisher','category','language','binding','volumes','pages','mrp','price','offerType','stockCount','inStock','tags','coverUrl','createdAt'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g,'""')}"`;
    const rows = [cols.join(',')].concat(
      books.map(b => cols.map(c => esc(Array.isArray(b[c]) ? b[c].join('|') : b[c])).join(','))
    );
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `maktabah-an-noor-books-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  function toggleTag(tag) { f('tags',form.tags.includes(tag)?form.tags.filter(t=>t!==tag):[...form.tags,tag]); }
  function addGalleryUrl(url) {
    if (!url?.trim()) return;
    f('gallery', [...(form.gallery||[]), url.trim()]);
  }
  function removeGalleryUrl(idx) {
    f('gallery', form.gallery.filter((_,i) => i !== idx));
  }
  function toggleBookInBundle(slug) {
    const s = bundleForm.bookSlugs;
    const next = s.includes(slug) ? s.filter(x=>x!==slug) : [...s,slug];
    bf('bookSlugs', next);
    // Auto-calc total MRP from selected books
    const selected = books.filter(b => next.includes(b.slug));
    const total = selected.reduce((acc,b) => acc + (b.mrp || b.price || 0), 0);
    if (total > 0) bf('totalMrp', total);
  }

  const filteredBooks = useMemo(()=>{
    const list = books.filter(b=>!search||b.title?.toLowerCase().includes(search.toLowerCase())||b.author?.toLowerCase().includes(search.toLowerCase()));
    // Out-of-stock books sink to the bottom of the admin table by default too.
    return [...list].sort((a,b)=>(a.inStock?0:1)-(b.inStock?0:1));
  },[books,search]);
  const totalBookPages = Math.max(1, Math.ceil(filteredBooks.length / BOOK_PAGE_SIZE));
  const pagedBooks = useMemo(()=>filteredBooks.slice((bookPage-1)*BOOK_PAGE_SIZE, bookPage*BOOK_PAGE_SIZE),[filteredBooks,bookPage]);

  function toggleSelect(slug) {
    setSelected(prev => { const next = new Set(prev); next.has(slug) ? next.delete(slug) : next.add(slug); return next; });
  }
  function toggleSelectAllVisible() {
    setSelected(prev => {
      const allSelected = pagedBooks.every(b => prev.has(b.slug));
      const next = new Set(prev);
      pagedBooks.forEach(b => allSelected ? next.delete(b.slug) : next.add(b.slug));
      return next;
    });
  }
  async function bulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} selected book(s)? This cannot be undone.`)) return;
    setLoading(true);
    try {
      await Promise.all([...selected].map(slug =>
        fetch(`/api/books/${slug}`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session})})
      ));
      setSelected(new Set());
      await loadBooks();
      showToast('Selected books deleted.','success');
    } catch { showToast('Some deletes failed.','error'); }
    finally { setLoading(false); }
  }
  async function bulkMarkOutOfStock() {
    if (selected.size === 0) return;
    setLoading(true);
    try {
      await Promise.all([...selected].map(slug =>
        fetch(`/api/books/${slug}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:session,stockCount:0})})
      ));
      setSelected(new Set());
      await loadBooks();
      showToast('Marked as out of stock.','success');
    } catch { showToast('Some updates failed.','error'); }
    finally { setLoading(false); }
  }
  const stats = useMemo(()=>({
    total:books.length,inStock:books.filter(b=>b.inStock).length,
    out:books.filter(b=>!b.inStock).length,cats:[...new Set(books.map(b=>b.category))].length,
    bundles:bundles.length,pendingOrders:orders.filter(o=>!o.fulfilled).length,
  }),[books,bundles,orders]);

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
          <div style={{marginBottom:16}}>
            <Label>Title *</Label>
            <FInput value={form.title} onChange={e=>f('title',e.target.value)} placeholder="e.g. Sahih Al-Bukhari"/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:16}}>
            <div><Label>Author *</Label><FInput value={form.author} onChange={e=>f('author',e.target.value)} placeholder="e.g. Imam Al-Bukhari"/></div>
            <div><Label hint="Optional">Translator</Label><FInput value={form.translator} onChange={e=>f('translator',e.target.value)} placeholder="e.g. Dr. Muhammad Muhsin Khan"/></div>
            <div><Label hint="Optional">Publisher</Label><FInput value={form.publisher} onChange={e=>f('publisher',e.target.value)} placeholder="e.g. Darussalam"/></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
            <div><Label hint="Optional · unique product code">SKU / Book Code</Label><FInput value={form.sku} onChange={e=>f('sku',e.target.value)} placeholder="e.g. HAD-001"/></div>
            <div><Label>Category *</Label><TaxonomySelect value={form.category} onChange={e=>f('category',e.target.value)} options={taxonomy.categories} onAddOption={v=>addTaxonomyOption('categories',v)}/></div>
            <div><Label>Language *</Label><TaxonomySelect value={form.language} onChange={e=>f('language',e.target.value)} options={taxonomy.languages} onAddOption={v=>addTaxonomyOption('languages',v)}/></div>
          </div>
        </Card>

        {editSlug && (
          <Card title="URL Slug">
            <p style={{fontSize:11,color:'#a09890',margin:'-10px 0 14px',lineHeight:1.6}}>
              This is the book's web address: yoursite.com/book/<b>{editSlug}</b>. Changing it updates every link on the site automatically (bundles, homepage picks, hero slides) — but any old link already shared (e.g. on Instagram) will stop working.
            </p>
            <div style={{display:'flex',gap:8}}>
              <div style={{flex:1}}><FInput value={slugInput} onChange={e=>setSlugInput(e.target.value.toLowerCase())} placeholder="book-slug"/></div>
              <Btn onClick={renameSlug} disabled={slugSaving || !slugInput.trim() || slugInput===editSlug}>{slugSaving?'Saving…':'Change URL'}</Btn>
            </div>
          </Card>
        )}

        {/* Pricing */}
        <Card title="Pricing">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:16,marginBottom:16}}>
            <div><Label hint="Optional · original / MRP">Actual Price (₹)</Label><FInput type="number" value={form.mrp} onChange={e=>f('mrp',e.target.value)} placeholder="350" prefix="₹"/></div>
            <div><Label>Sale Price (₹) *</Label><FInput type="number" value={form.price} onChange={e=>f('price',e.target.value)} placeholder="299" prefix="₹"/></div>
            <div><Label hint="Optional">Offer Type</Label>
              <TaxonomySelect value={form.offerType} onChange={e=>f('offerType',e.target.value)} options={taxonomy.offerTypes} placeholder="None" onAddOption={v=>addTaxonomyOption('offerTypes',v)}/>
            </div>
            <div><Label hint="Exact pieces available">Stock Count *</Label><FInput type="number" min="0" value={form.stockCount} onChange={e=>f('stockCount',e.target.value)} placeholder="50"/></div>
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
            <div><Label>Binding *</Label><FSelect value={form.binding} onChange={e=>f('binding',e.target.value)} options={BINDINGS} placeholder="— Select —"/></div>
            <div><Label hint="Optional">Volumes</Label><FInput type="number" value={form.volumes} onChange={e=>f('volumes',e.target.value)}/></div>
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
                {form.coverUrl?<img src={form.coverUrl} alt="Preview" style={{width:'100%',maxHeight:240,objectFit:'contain',borderRadius:10}} loading="lazy"/>:<><div style={{fontSize:13,color:'#6b6460',marginBottom:6}}>Click to upload cover image</div><div style={{fontSize:11,color:'#a09890'}}>JPG or PNG</div></>}
                <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleImg}/>
              </div>
            )
          }
          {form.coverUrl && <button onClick={()=>f('coverUrl','')} style={{marginTop:8,fontSize:11,color:'#a09890',background:'none',border:'none',cursor:'pointer',padding:0}}>✕ Remove image</button>}

          <div style={{marginTop:24,paddingTop:20,borderTop:'1px solid rgba(27,67,50,0.07)'}}>
            <Label hint="Extra photos (back cover, sample pages) shown on the book detail page">Additional Images</Label>
            <div style={{display:'flex',gap:8,marginBottom:12}}>
              <div style={{flex:1}}>
                <FInput value={galleryInput} onChange={e=>setGalleryInput(e.target.value)} placeholder="https://… (additional image URL)"/>
              </div>
              <button onClick={()=>{addGalleryUrl(galleryInput);setGalleryInput('');}} style={{padding:'0 20px',borderRadius:10,border:'none',background:'#1b4332',color:'#fff',fontSize:12,cursor:'pointer',flexShrink:0}}>+ Add</button>
            </div>
            {form.gallery?.length > 0 && (
              <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
                {form.gallery.map((url,idx) => (
                  <div key={idx} style={{position:'relative',width:72,height:96,borderRadius:8,overflow:'hidden',border:'1px solid rgba(27,67,50,0.12)'}}>
                    <img src={url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/>
                    <button onClick={()=>removeGalleryUrl(idx)} style={{position:'absolute',top:2,right:2,width:20,height:20,borderRadius:'50%',border:'none',background:'rgba(0,0,0,0.6)',color:'#fff',fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Tags */}
        <Card title="Tags & Visibility">
          <div style={{marginBottom:20}}>
            <Label>Tags</Label>
            <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:4}}>
              {TAGS.map(t=>(
                <label key={t} onClick={()=>toggleTag(t)} style={{padding:'7px 16px',borderRadius:20,border:`1.5px solid ${form.tags.includes(t)?'#1b4332':'rgba(27,67,50,0.15)'}`,background:form.tags.includes(t)?'rgba(27,67,50,0.07)':'transparent',color:form.tags.includes(t)?'#1b4332':'#6b6460',fontSize:12,cursor:'pointer',userSelect:'none'}}>
                  {t}
                </label>
              ))}
            </div>
          </div>
          <div style={{paddingTop:16,borderTop:'1px solid rgba(27,67,50,0.07)'}}>
            <Label hint="Hidden books stay in your catalog and are still reachable by direct link, but won't appear in the storefront's collection, search, filters, or homepage.">Storefront Visibility</Label>
            <label onClick={()=>f('visible',!form.visible)} style={{display:'flex',alignItems:'center',gap:12,cursor:'pointer',width:'fit-content',marginTop:6}}>
              <div style={{width:44,height:26,borderRadius:13,background:form.visible?'#1b4332':'rgba(27,67,50,0.15)',position:'relative',transition:'background .25s',flexShrink:0}}>
                <div style={{position:'absolute',top:3,left:form.visible?20:3,width:20,height:20,borderRadius:'50%',background:'#fff',transition:'left .25s',boxShadow:'0 1px 4px rgba(0,0,0,.2)'}}/>
              </div>
              <span style={{fontSize:14,color:form.visible?'#1b4332':'#6b6460'}}>{form.visible?'Visible (shown on site)':'Hidden (unlisted)'}</span>
            </label>
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
                    {b.coverUrl && <img src={b.coverUrl} alt="" style={{width:36,height:48,objectFit:'cover',borderRadius:5,flexShrink:0}} loading="lazy"/>}
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
            <div><Label hint="Optional">Offer Type</Label>
              <TaxonomySelect value={bundleForm.offerType} onChange={e=>bf('offerType',e.target.value)} options={taxonomy.offerTypes} placeholder="None" onAddOption={v=>addTaxonomyOption('offerTypes',v)}/>
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

  /* ── SLIDE EDITOR ── */
  if (view==='slideEditor') return (
    <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',fontFamily:"'DM Sans',sans-serif"}}>
      <PageBackground subtle/>
      <header style={{position:'sticky',top:0,zIndex:40,height:68,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 clamp(20px,5vw,48px)',background:'rgba(250,249,245,0.92)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(27,67,50,0.08)'}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <Image src="/logo.png" alt="Logo" width={36} height={36} style={{height:36,width:'auto'}}/>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:'#1b4332'}}>{editSlideId?'Edit Slide':'Add Slide'}</div>
            <div style={{fontSize:10,color:'#b8965a',letterSpacing:'1.5px',textTransform:'uppercase'}}>Admin · Homepage Slider</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <Btn variant="ghost" onClick={()=>setView('dashboard')}>← Dashboard</Btn>
          <Btn onClick={saveSlide} disabled={loading}>{loading?'Saving…':editSlideId?'Save Changes':'Add Slide'}</Btn>
        </div>
      </header>

      <div style={{position:'relative',zIndex:1,maxWidth:900,margin:'0 auto',padding:'40px clamp(20px,5vw,48px) 80px',display:'flex',flexDirection:'column',gap:20}}>

        <Card title="Slide Type">
          <div style={{display:'flex',gap:8}}>
            {[{id:'book',label:'Feature a Book'},{id:'custom',label:'Custom Slide'}].map(m=>(
              <button key={m.id} onClick={()=>sf('mode',m.id)} style={{padding:'9px 20px',borderRadius:20,border:`1.5px solid ${slideForm.mode===m.id?'#1b4332':'rgba(27,67,50,0.15)'}`,background:slideForm.mode===m.id?'rgba(27,67,50,0.07)':'transparent',color:slideForm.mode===m.id?'#1b4332':'#6b6460',fontSize:13,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                {m.label}
              </button>
            ))}
          </div>
          <p style={{fontSize:12,color:'#a09890',marginTop:12,marginBottom:0}}>
            {slideForm.mode==='book'
              ? "Pick a book below — its cover, title and description feed the slide automatically. You can still override any of it."
              : 'Build a standalone promotional slide with your own image, text and link.'}
          </p>
        </Card>

        {slideForm.mode==='book' && (
          <Card title="Select Book">
            {books.length === 0 ? (
              <div style={{textAlign:'center',padding:'24px 0',color:'#a09890',fontSize:13}}>No books found. Add a book first.</div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:340,overflowY:'auto',paddingRight:4}}>
                {books.map(b => {
                  const sel = slideForm.bookSlug === b.slug;
                  return (
                    <div key={b.slug} onClick={()=>sf('bookSlug',b.slug)}
                      style={{display:'flex',alignItems:'center',gap:14,padding:'12px 16px',borderRadius:10,border:`1.5px solid ${sel?'#1b4332':'rgba(27,67,50,0.1)'}`,background:sel?'rgba(27,67,50,0.05)':'#fff',cursor:'pointer',transition:'all .15s'}}>
                      <span style={{width:18,height:18,borderRadius:'50%',border:`1.5px solid ${sel?'#1b4332':'rgba(27,67,50,0.22)'}`,background:sel?'#1b4332':'transparent',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {sel && <span style={{width:7,height:7,borderRadius:'50%',background:'#fff'}}/>}
                      </span>
                      {b.coverUrl && <img src={b.coverUrl} alt="" style={{width:36,height:48,objectFit:'cover',borderRadius:5,flexShrink:0}} loading="lazy"/>}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,color:'#1a1712',fontWeight:400,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{b.title}</div>
                        <div style={{fontSize:11,color:'#a09890'}}>{b.author} · {b.category}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {slideForm.mode==='custom' && (
          <Card title="Slide Image">
            <div style={{display:'flex',gap:8,marginBottom:14}}>
              {['url','upload'].map(m=>(
                <button key={m} onClick={()=>setSlideImgMode(m)} style={{padding:'7px 18px',borderRadius:20,border:`1.5px solid ${slideImgMode===m?'#1b4332':'rgba(27,67,50,0.15)'}`,background:slideImgMode===m?'rgba(27,67,50,0.07)':'transparent',color:slideImgMode===m?'#1b4332':'#6b6460',fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                  {m==='url'?'Paste URL':'Upload Image'}
                </button>
              ))}
            </div>
            {slideImgMode==='url'
              ? <FInput value={slideForm.imageUrl.startsWith('data:')?'':slideForm.imageUrl} onChange={e=>sf('imageUrl',e.target.value)} placeholder="https://… (image URL)"/>
              : (
                <div onClick={()=>document.getElementById('slide-img-input')?.click()} style={{border:'2px dashed rgba(27,67,50,0.15)',borderRadius:12,padding:slideForm.imageUrl?0:32,textAlign:'center',cursor:'pointer',overflow:'hidden',background:'#faf9f5'}} onMouseEnter={e=>e.currentTarget.style.borderColor='#1b4332'} onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(27,67,50,0.15)'}>
                  {slideForm.imageUrl?<img src={slideForm.imageUrl} alt="Preview" style={{width:'100%',maxHeight:240,objectFit:'contain',borderRadius:10}} loading="lazy"/>:<><div style={{fontSize:13,color:'#6b6460',marginBottom:6}}>Click to upload an image</div><div style={{fontSize:11,color:'#a09890'}}>JPG or PNG</div></>}
                  <input id="slide-img-input" type="file" accept="image/*" style={{display:'none'}} onChange={handleSlideImg}/>
                </div>
              )
            }
            {slideForm.imageUrl && <button onClick={()=>sf('imageUrl','')} style={{marginTop:8,fontSize:11,color:'#a09890',background:'none',border:'none',cursor:'pointer',padding:0}}>✕ Remove image</button>}
          </Card>
        )}

        <Card title={slideForm.mode==='book' ? 'Text Overrides (optional)' : 'Slide Text'}>
          <div style={{marginBottom:16}}>
            <Label hint="Small label above the title, e.g. ISLAMIC BOOKS">Eyebrow</Label>
            <FInput value={slideForm.eyebrow} onChange={e=>sf('eyebrow',e.target.value)} placeholder="e.g. Islamic Books"/>
          </div>
          <div style={{marginBottom:16}}>
            <Label hint={slideForm.mode==='book' ? 'Optional — defaults to the book title' : undefined}>Title{slideForm.mode==='custom' && ' *'}</Label>
            <FInput value={slideForm.title} onChange={e=>sf('title',e.target.value)} placeholder="e.g. Where Is Allah?"/>
          </div>
          <div style={{marginBottom:16}}>
            <Label hint={slideForm.mode==='book' ? 'Optional — defaults to the book description' : 'Optional'}>Subtitle</Label>
            <textarea value={slideForm.subtitle} onChange={e=>sf('subtitle',e.target.value)} placeholder="A short line under the title…" rows={2}
              style={{width:'100%',padding:'12px 14px',background:'#faf9f5',border:'1.5px solid rgba(27,67,50,0.12)',borderRadius:10,color:'#1a1712',fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:'none',resize:'vertical',lineHeight:1.65,transition:'border-color .2s'}}
              onFocus={e=>e.target.style.borderColor='#1b4332'} onBlur={e=>e.target.style.borderColor='rgba(27,67,50,0.12)'}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div><Label hint="Optional — defaults to 'Shop Now'">Button Text</Label><FInput value={slideForm.ctaLabel} onChange={e=>sf('ctaLabel',e.target.value)} placeholder="Shop Now"/></div>
            <div><Label hint={slideForm.mode==='book' ? "Optional — defaults to this book's page" : undefined}>Button Link{slideForm.mode==='custom' && ' *'}</Label><FInput value={slideForm.ctaUrl} onChange={e=>sf('ctaUrl',e.target.value)} placeholder="/books?category=Aqeedah"/></div>
          </div>
        </Card>

        <Card title="Visibility">
          <label onClick={()=>sf('active',!slideForm.active)} style={{display:'flex',alignItems:'center',gap:12,cursor:'pointer',width:'fit-content'}}>
            <div style={{width:44,height:26,borderRadius:13,background:slideForm.active?'#1b4332':'rgba(27,67,50,0.15)',position:'relative',transition:'background .25s',flexShrink:0}}>
              <div style={{position:'absolute',top:3,left:slideForm.active?20:3,width:20,height:20,borderRadius:'50%',background:'#fff',transition:'left .25s',boxShadow:'0 1px 4px rgba(0,0,0,.2)'}}/>
            </div>
            <span style={{fontSize:14,color:slideForm.active?'#1b4332':'#6b6460'}}>{slideForm.active?'Live (shown on homepage)':'Hidden (paused)'}</span>
          </label>
        </Card>

        <div style={{display:'flex',gap:10}}>
          <Btn variant="ghost" onClick={()=>setView('dashboard')}>Cancel</Btn>
          <Btn onClick={saveSlide} disabled={loading}>{loading?'Saving…':editSlideId?'Save Changes':'Add Slide'}</Btn>
        </div>
      </div>
      <Toast t={toast}/>
    </div>
  );

  /* ── ACCESSORY EDITOR ── */
  if (view==='accEditor') return (
    <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',fontFamily:"'DM Sans',sans-serif"}}>
      <PageBackground subtle/>
      <header style={{position:'sticky',top:0,zIndex:40,height:68,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 clamp(20px,5vw,48px)',background:'rgba(250,249,245,0.92)',borderBottom:'1px solid rgba(27,67,50,0.08)'}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:'#1b4332'}}>{editAccId?'Edit Accessory':'Add Accessory'}</div>
        <div style={{display:'flex',gap:10}}>
          <Btn variant="ghost" onClick={()=>setView('dashboard')}>← Dashboard</Btn>
          <Btn onClick={saveAcc} disabled={loading}>{loading?'Saving…':'Save'}</Btn>
        </div>
      </header>
      <div style={{position:'relative',zIndex:1,maxWidth:700,margin:'0 auto',padding:'40px clamp(20px,5vw,48px) 80px',display:'flex',flexDirection:'column',gap:20}}>
        <Card title="Details">
          <div style={{marginBottom:16}}><Label>Name *</Label><FInput value={accForm.name} onChange={e=>af('name',e.target.value)} placeholder="e.g. Wooden Tasbih Watch"/></div>
          <div style={{marginBottom:16}}><Label hint="Optional">Description</Label><FInput value={accForm.description} onChange={e=>af('description',e.target.value)}/></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
            <div><Label hint="Optional · original">MRP (₹)</Label><FInput type="number" value={accForm.mrp} onChange={e=>af('mrp',e.target.value)}/></div>
            <div><Label>Price (₹) *</Label><FInput type="number" value={accForm.price} onChange={e=>af('price',e.target.value)}/></div>
            <div><Label>Stock Count *</Label><FInput type="number" value={accForm.stockCount} onChange={e=>af('stockCount',e.target.value)}/></div>
          </div>
        </Card>
        <Card title="Image">
          <div style={{display:'flex',gap:8,marginBottom:14}}>
            {['url','upload'].map(m=>(
              <button key={m} onClick={()=>setAccImgMode(m)} style={{padding:'7px 18px',borderRadius:20,border:`1.5px solid ${accImgMode===m?'#1b4332':'rgba(27,67,50,0.15)'}`,background:accImgMode===m?'rgba(27,67,50,0.07)':'transparent',color:accImgMode===m?'#1b4332':'#6b6460',fontSize:12,cursor:'pointer'}}>{m==='url'?'Paste URL':'Upload'}</button>
            ))}
          </div>
          {accImgMode==='url'
            ? <FInput value={accForm.coverUrl.startsWith('data:')?'':accForm.coverUrl} onChange={e=>af('coverUrl',e.target.value)} placeholder="https://…"/>
            : (
              <div onClick={()=>document.getElementById('acc-img-input')?.click()} style={{border:'2px dashed rgba(27,67,50,0.15)',borderRadius:12,padding:accForm.coverUrl?0:32,textAlign:'center',cursor:'pointer',overflow:'hidden'}}>
                {accForm.coverUrl?<img src={accForm.coverUrl} alt="" style={{width:'100%',maxHeight:200,objectFit:'contain'}} loading="lazy"/>:<div style={{fontSize:13,color:'#6b6460'}}>Click to upload</div>}
                <input id="acc-img-input" type="file" accept="image/*" style={{display:'none'}} onChange={handleAccImg}/>
              </div>
            )}
        </Card>
        <Card title="Colors (optional)">
          <p style={{fontSize:11,color:'#a09890',margin:'-10px 0 14px'}}>Add color options like on Amazon — each with its own stock count. Leave empty for a single-color product.</p>
          {accForm.variants.map(v => (
            <div key={v.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <input type="color" value={v.color} onChange={e=>updVariant(v.id,'color',e.target.value)} style={{width:36,height:36,padding:0,border:'1.5px solid rgba(27,67,50,0.15)',borderRadius:8,cursor:'pointer',flexShrink:0}}/>
              <div style={{flex:1}}><FInput value={v.label} onChange={e=>updVariant(v.id,'label',e.target.value)} placeholder="e.g. Black"/></div>
              <div style={{width:90}}><FInput type="number" min="0" value={v.stockCount} onChange={e=>updVariant(v.id,'stockCount',e.target.value)} placeholder="Stock"/></div>
              <button onClick={()=>rmVariant(v.id)} style={{width:36,height:36,borderRadius:8,border:'1.5px solid rgba(27,67,50,0.12)',background:'transparent',cursor:'pointer',flexShrink:0}}>✕</button>
            </div>
          ))}
          <button onClick={addVariant} style={{marginTop:4,padding:'8px 16px',borderRadius:20,border:'1.5px dashed rgba(27,67,50,0.25)',background:'transparent',color:'#1b4332',fontSize:12,cursor:'pointer'}}>+ Add Color</button>
        </Card>
        <Card title="Visibility">
          <label onClick={()=>af('visible',!accForm.visible)} style={{display:'flex',alignItems:'center',gap:12,cursor:'pointer',width:'fit-content'}}>
            <div style={{width:44,height:26,borderRadius:13,background:accForm.visible?'#1b4332':'rgba(27,67,50,0.15)',position:'relative'}}>
              <div style={{position:'absolute',top:3,left:accForm.visible?20:3,width:20,height:20,borderRadius:'50%',background:'#fff'}}/>
            </div>
            <span style={{fontSize:14,color:accForm.visible?'#1b4332':'#6b6460'}}>{accForm.visible?'Visible (shown on site)':'Hidden'}</span>
          </label>
        </Card>
        <div style={{display:'flex',gap:10}}>
          <Btn variant="ghost" onClick={()=>setView('dashboard')}>Cancel</Btn>
          <Btn onClick={saveAcc} disabled={loading}>{loading?'Saving…':'Save'}</Btn>
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
          {tab==='books' && <Btn variant="ghost" onClick={exportBooksCsv}>Export CSV</Btn>}
          {tab==='books'
            ? <Btn onClick={()=>{setEditSlug(null);setForm(EMPTY_BOOK);setImgMode('url');setView('bookEditor');}}>+ Add Book</Btn>
            : tab==='bundles'
              ? <Btn onClick={()=>{setEditBundleId(null);setBundleForm(EMPTY_BUNDLE);setView('bundleEditor');}}>+ Create Bundle</Btn>
              : tab==='slides'
                ? <Btn onClick={()=>{setEditSlideId(null);setSlideForm(EMPTY_SLIDE);setSlideImgMode('url');setView('slideEditor');}}>+ Add Slide</Btn>
                : tab==='accessories'
                  ? <Btn onClick={()=>{setEditAccId(null);setAccForm(EMPTY_ACCESSORY);setAccImgMode('url');setView('accEditor');}}>+ Add Accessory</Btn>
                  : null
          }
          <Btn variant="ghost" onClick={()=>{setSession('');setView('login');}}>Log Out</Btn>
        </div>
      </header>

      <div style={{position:'relative',zIndex:1,maxWidth:1100,margin:'0 auto',padding:'40px clamp(20px,5vw,48px) 80px'}}>
        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:12,marginBottom:36}}>
          {[{num:stats.total,label:'Total Books',ar:'كتاب'},{num:stats.inStock,label:'In Stock',ar:'متاح'},{num:stats.out,label:'Out of Stock',ar:'غير متاح'},{num:stats.cats,label:'Categories',ar:'تصنيف'},{num:stats.bundles,label:'Bundles',ar:'حزم'},{num:stats.pendingOrders,label:'Pending Orders',ar:'طلبات'}].map((s,i)=>(
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
          {[{id:'books',label:`Books (${books.length})`},{id:'bundles',label:`Bundles (${bundles.length})`},{id:'slides',label:'Homepage'},{id:'accessories',label:`Accessories (${accessories.length})`},{id:'coupons',label:`Coupons (${coupons.length})`},{id:'orders',label:`Orders (${orders.length})`}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'9px 22px',borderRadius:26,border:'none',background:tab===t.id?'#1b4332':'transparent',color:tab===t.id?'#fff':'#6b6460',fontSize:12,fontWeight:tab===t.id?500:300,letterSpacing:.5,cursor:'pointer',transition:'all .2s',fontFamily:"'DM Sans',sans-serif'"}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* BOOKS LIST */}
        {tab==='books' && (
          <div style={{background:'#fff',borderRadius:20,border:'1px solid rgba(27,67,50,0.07)',boxShadow:'0 4px 20px rgba(27,67,50,0.06)',overflow:'hidden'}}>
            <div style={{padding:'20px 24px',borderBottom:'1px solid rgba(27,67,50,0.07)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:500,color:'#1b4332'}}>Book Collection</div>
              <div style={{position:'relative',maxWidth:260}}>
                <svg style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',width:14,height:14,color:'#a09890'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input type="text" placeholder="Search books…" value={search} onChange={e=>{setSearch(e.target.value);setBookPage(1);}}
                  style={{width:'100%',padding:'8px 14px 8px 36px',background:'#faf9f5',border:'1.5px solid rgba(27,67,50,0.1)',borderRadius:30,fontSize:13,fontFamily:"'DM Sans',sans-serif",color:'#1a1712',outline:'none'}}/>
              </div>
            </div>
            {selected.size > 0 && (
              <div style={{padding:'12px 24px',background:'rgba(27,67,50,0.05)',borderBottom:'1px solid rgba(27,67,50,0.07)',display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
                <span style={{fontSize:12,color:'#1b4332',fontWeight:500}}>{selected.size} selected</span>
                <button onClick={bulkMarkOutOfStock} style={{padding:'6px 14px',borderRadius:20,border:'1.5px solid rgba(27,67,50,0.2)',background:'transparent',color:'#1b4332',fontSize:11,cursor:'pointer'}}>Mark Out of Stock</button>
                <button onClick={bulkDelete} style={{padding:'6px 14px',borderRadius:20,border:'1.5px solid rgba(180,60,60,0.3)',background:'transparent',color:'#b44',fontSize:11,cursor:'pointer'}}>Delete Selected</button>
                <button onClick={()=>setSelected(new Set())} style={{padding:'6px 14px',borderRadius:20,border:'none',background:'transparent',color:'#a09890',fontSize:11,cursor:'pointer'}}>Clear</button>
              </div>
            )}
            {books.length===0 ? (
              <div style={{textAlign:'center',padding:'60px 24px'}}>
                <div style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:56,color:'rgba(27,67,50,0.08)',marginBottom:12}}>الكتب</div>
                <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#6b6460',margin:'0 0 20px'}}>No books yet.</p>
                <Btn onClick={()=>{setEditSlug(null);setForm(EMPTY_BOOK);setImgMode('url');setView('bookEditor');}}>+ Add First Book</Btn>
              </div>
            ) : (
              <div>
                <div style={{display:'flex',alignItems:'center',gap:14,padding:'10px 24px',borderBottom:'1px solid rgba(27,67,50,0.05)',background:'rgba(27,67,50,0.015)'}}>
                  <input type="checkbox" checked={pagedBooks.length>0 && pagedBooks.every(b=>selected.has(b.slug))} onChange={toggleSelectAllVisible}
                    style={{width:16,height:16,accentColor:'#1b4332',cursor:'pointer'}}/>
                  <span style={{fontSize:10,color:'#a09890',letterSpacing:1,textTransform:'uppercase'}}>Select all on this page</span>
                </div>
                {pagedBooks.map((b,i)=>(
                  <div key={b.slug} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 24px',borderBottom:i<pagedBooks.length-1?'1px solid rgba(27,67,50,0.05)':'none',transition:'background .15s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(27,67,50,0.02)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <input type="checkbox" checked={selected.has(b.slug)} onChange={()=>toggleSelect(b.slug)} style={{width:16,height:16,accentColor:'#1b4332',cursor:'pointer',flexShrink:0}}/>
                    <div style={{width:40,height:54,borderRadius:5,overflow:'hidden',flexShrink:0,background:'linear-gradient(155deg,#2d6a4f,#1b4332)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {b.coverUrl?<img src={b.coverUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/>:<span style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:16,color:'#d4ab70'}}>ك</span>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                        <span style={{fontSize:14,color:'#1a1712',fontWeight:400,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:240}}>{b.title}</span>
                        {b.sku && <span style={{fontSize:9,color:'#a09890',background:'rgba(27,67,50,0.05)',padding:'2px 8px',borderRadius:8,letterSpacing:.8,textTransform:'uppercase'}}>{b.sku}</span>}
                        {b.offerType && <OfferBadge type={b.offerType}/>}
                        {b.visible === false && <span style={{fontSize:9,color:'#a09890',background:'rgba(0,0,0,0.06)',padding:'2px 8px',borderRadius:8,letterSpacing:.8,textTransform:'uppercase'}}>Hidden</span>}
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
                      {views[b.slug] > 0 && <div style={{fontSize:10,color:'#a09890',marginTop:2}}>👁 {views[b.slug]} views</div>}
                    </div>
                    <div style={{display:'flex',gap:6,flexShrink:0}}>
                      <button onClick={()=>toggleBookVisible(b.slug,b.visible===false)} style={{padding:'5px 12px',borderRadius:20,border:`1.5px solid ${b.visible!==false?'rgba(45,106,79,0.3)':'rgba(27,67,50,0.15)'}`,background:b.visible!==false?'rgba(45,106,79,0.07)':'transparent',color:b.visible!==false?'#2d6a4f':'#6b6460',fontSize:10,cursor:'pointer',letterSpacing:.8,textTransform:'uppercase',transition:'all .2s',flexShrink:0}}>
                        {b.visible!==false?'Visible':'Hidden'}
                      </button>
                      <button onClick={()=>openEditBook(b.slug)} style={{width:32,height:32,borderRadius:8,border:'1.5px solid rgba(27,67,50,0.12)',background:'transparent',color:'#6b6460',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .2s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(27,67,50,0.07)';e.currentTarget.style.color='#1b4332';}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#6b6460';}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
                      </button>
                      <button onClick={()=>delBook(b.slug)} style={{width:32,height:32,borderRadius:8,border:'1.5px solid rgba(27,67,50,0.12)',background:'transparent',color:'#6b6460',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .2s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(180,60,60,0.07)';e.currentTarget.style.color='#b44';}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#6b6460';}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
                {totalBookPages > 1 && (
                  <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'18px 24px'}}>
                    <button onClick={()=>setBookPage(p=>Math.max(1,p-1))} disabled={bookPage===1}
                      style={{padding:'6px 14px',borderRadius:20,border:'1.5px solid rgba(27,67,50,0.15)',background:'transparent',color:bookPage===1?'#c9c4be':'#1b4332',fontSize:12,cursor:bookPage===1?'default':'pointer'}}>← Prev</button>
                    <span style={{fontSize:12,color:'#6b6460'}}>Page {bookPage} of {totalBookPages}</span>
                    <button onClick={()=>setBookPage(p=>Math.min(totalBookPages,p+1))} disabled={bookPage===totalBookPages}
                      style={{padding:'6px 14px',borderRadius:20,border:'1.5px solid rgba(27,67,50,0.15)',background:'transparent',color:bookPage===totalBookPages?'#c9c4be':'#1b4332',fontSize:12,cursor:bookPage===totalBookPages?'default':'pointer'}}>Next →</button>
                  </div>
                )}
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

        {/* HOMEPAGE PICKS + SLIDES */}
        {tab==='slides' && (
          <>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
            <BookPicker
              title="Featured Books" max={4}
              hint="Shown in the 'Featured Books' section on the homepage. Pick up to 4 — if you don't pick any, books tagged 'Featured' are shown automatically instead."
              selected={picks.featured} books={books}
              onChange={(next)=>setPicks(p=>({...p,featured:next}))}
            />
            <BookPicker
              title="New Arrivals" max={4}
              hint="Shown in the 'New Arrivals' section on the homepage. Pick up to 4 — if you don't pick any, books tagged 'New Arrival' are shown automatically instead."
              selected={picks.newArrivals} books={books}
              onChange={(next)=>setPicks(p=>({...p,newArrivals:next}))}
            />
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:20}}>
            <Btn onClick={savePicks} disabled={loading}>{loading?'Saving…':'Save Homepage Picks'}</Btn>
          </div>

          <div style={{background:'#fff',borderRadius:20,border:'1px solid rgba(27,67,50,0.07)',boxShadow:'0 4px 20px rgba(27,67,50,0.06)',overflow:'hidden'}}>
            <div style={{padding:'20px 24px',borderBottom:'1px solid rgba(27,67,50,0.07)'}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:500,color:'#1b4332'}}>Homepage Featured Slider</div>
              <p style={{margin:'6px 0 0',fontSize:12,color:'#a09890'}}>These slides rotate on the homepage, right below the hero. Feature a book directly, or build a custom promotional slide.</p>
            </div>
            {slides.length===0 ? (
              <div style={{textAlign:'center',padding:'60px 24px'}}>
                <div style={{fontSize:44,marginBottom:12,opacity:.2}}>🖼️</div>
                <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#6b6460',margin:'0 0 20px'}}>No slides yet.</p>
                <Btn onClick={()=>{setEditSlideId(null);setSlideForm(EMPTY_SLIDE);setSlideImgMode('url');setView('slideEditor');}}>+ Add First Slide</Btn>
              </div>
            ) : (
              <div>
                {[...slides].sort((a,b)=>(a.order??0)-(b.order??0)).map((s,i,arr)=>(
                  <div key={s.id} style={{display:'flex',alignItems:'center',gap:16,padding:'16px 24px',borderBottom:i<arr.length-1?'1px solid rgba(27,67,50,0.05)':'none',transition:'background .15s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(27,67,50,0.02)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <div style={{display:'flex',flexDirection:'column',gap:2,flexShrink:0}}>
                      <button onClick={()=>moveSlide(s.id,-1)} disabled={i===0} style={{width:22,height:18,border:'1px solid rgba(27,67,50,0.15)',borderRadius:5,background:'transparent',color:i===0?'#d8d3cb':'#6b6460',cursor:i===0?'default':'pointer',fontSize:10,display:'flex',alignItems:'center',justifyContent:'center'}}>▲</button>
                      <button onClick={()=>moveSlide(s.id,1)} disabled={i===arr.length-1} style={{width:22,height:18,border:'1px solid rgba(27,67,50,0.15)',borderRadius:5,background:'transparent',color:i===arr.length-1?'#d8d3cb':'#6b6460',cursor:i===arr.length-1?'default':'pointer',fontSize:10,display:'flex',alignItems:'center',justifyContent:'center'}}>▼</button>
                    </div>
                    <div style={{width:44,height:58,borderRadius:6,overflow:'hidden',flexShrink:0,background:'linear-gradient(155deg,#2d6a4f,#1b4332)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {s.imageUrl?<img src={s.imageUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/>:<span style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:16,color:'#d4ab70'}}>ك</span>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                        <span style={{fontSize:15,color:'#1a1712',fontWeight:400}}>{s.title || (s.mode==='book'?'(Book slide — no title override)':'(Untitled)')}</span>
                        <span style={{fontSize:9,color:'#a09890',background:'rgba(27,67,50,0.05)',padding:'2px 8px',borderRadius:8,letterSpacing:.8,textTransform:'uppercase'}}>{s.mode==='book'?'Book':'Custom'}</span>
                        {!s.active && <span style={{fontSize:9,color:'#a09890',background:'rgba(0,0,0,0.06)',padding:'2px 8px',borderRadius:8,letterSpacing:.8,textTransform:'uppercase'}}>Hidden</span>}
                      </div>
                      <div style={{fontSize:12,color:'#a09890'}}>{s.mode==='book' ? `Featuring: ${s.bookSlug}` : (s.ctaUrl || 'No link set')}</div>
                    </div>
                    <div style={{display:'flex',gap:6,flexShrink:0,alignItems:'center'}}>
                      <button onClick={()=>toggleSlideActive(s.id,!s.active)} style={{padding:'5px 12px',borderRadius:20,border:`1.5px solid ${s.active?'rgba(45,106,79,0.3)':'rgba(27,67,50,0.15)'}`,background:s.active?'rgba(45,106,79,0.07)':'transparent',color:s.active?'#2d6a4f':'#6b6460',fontSize:10,cursor:'pointer',letterSpacing:.8,textTransform:'uppercase',transition:'all .2s'}}>
                        {s.active?'Live':'Hidden'}
                      </button>
                      <button onClick={()=>openEditSlide(s)} style={{width:32,height:32,borderRadius:8,border:'1.5px solid rgba(27,67,50,0.12)',background:'transparent',color:'#6b6460',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .2s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(27,67,50,0.07)';e.currentTarget.style.color='#1b4332';}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#6b6460';}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
                      </button>
                      <button onClick={()=>delSlide(s.id)} style={{width:32,height:32,borderRadius:8,border:'1.5px solid rgba(27,67,50,0.12)',background:'transparent',color:'#6b6460',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .2s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(180,60,60,0.07)';e.currentTarget.style.color='#b44';}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#6b6460';}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </>
        )}

        {/* ACCESSORIES LIST */}
        {tab==='accessories' && (
          <div style={{background:'#fff',borderRadius:20,border:'1px solid rgba(27,67,50,0.07)',overflow:'hidden'}}>
            {accessories.length===0 ? (
              <div style={{textAlign:'center',padding:'60px 24px'}}>
                <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#6b6460',margin:'0 0 20px'}}>No accessories yet.</p>
                <Btn onClick={()=>{setEditAccId(null);setAccForm(EMPTY_ACCESSORY);setAccImgMode('url');setView('accEditor');}}>+ Add First Accessory</Btn>
              </div>
            ) : accessories.map((a,i)=>(
              <div key={a.id} style={{display:'flex',alignItems:'center',gap:16,padding:'16px 24px',borderBottom:i<accessories.length-1?'1px solid rgba(27,67,50,0.05)':'none'}}>
                <div style={{width:44,height:44,borderRadius:6,overflow:'hidden',flexShrink:0,background:'linear-gradient(155deg,#2d6a4f,#1b4332)'}}>
                  {a.coverUrl && <img src={a.coverUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:15,color:'#1a1712'}}>{a.name} {a.visible===false && <span style={{fontSize:9,color:'#a09890',background:'rgba(0,0,0,0.06)',padding:'2px 8px',borderRadius:8,marginLeft:6}}>HIDDEN</span>}</div>
                  <div style={{fontSize:12,color:'#a09890'}}>₹{a.price} · Stock: {a.stockCount}</div>
                </div>
                <button onClick={()=>toggleAccVisible(a.id,a.visible===false)} style={{padding:'5px 12px',borderRadius:20,border:'1.5px solid rgba(27,67,50,0.15)',background:'transparent',color:'#6b6460',fontSize:10,cursor:'pointer'}}>{a.visible!==false?'Visible':'Hidden'}</button>
                <button onClick={()=>openEditAcc(a)} style={{width:32,height:32,borderRadius:8,border:'1.5px solid rgba(27,67,50,0.12)',background:'transparent',cursor:'pointer'}}>✎</button>
                <button onClick={()=>delAcc(a.id)} style={{width:32,height:32,borderRadius:8,border:'1.5px solid rgba(27,67,50,0.12)',background:'transparent',cursor:'pointer'}}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* COUPONS */}
        {tab==='coupons' && (
          <>
          <Card title="Create Coupon">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:16,marginBottom:16}}>
              <div><Label>Code *</Label><FInput value={couponForm.code} onChange={e=>cf('code',e.target.value.toUpperCase())} placeholder="RAMADAN10"/></div>
              <div><Label>Type</Label><FSelect value={couponForm.type} onChange={e=>cf('type',e.target.value)} options={['percent','flat']}/></div>
              <div><Label>{couponForm.type==='percent'?'Percent Off *':'Amount Off (₹) *'}</Label><FInput type="number" min="0" value={couponForm.value} onChange={e=>cf('value',e.target.value)} placeholder={couponForm.type==='percent'?'10':'100'}/></div>
              <div><Label hint="Optional">Min Order (₹)</Label><FInput type="number" min="0" value={couponForm.minOrder} onChange={e=>cf('minOrder',e.target.value)}/></div>
            </div>
            <div style={{display:'flex',gap:16,alignItems:'flex-end'}}>
              <div style={{flex:1}}><Label hint="Optional">Expires</Label><FInput type="date" value={couponForm.expiresAt} onChange={e=>cf('expiresAt',e.target.value)}/></div>
              <Btn onClick={saveCoupon} disabled={loading}>{loading?'Saving…':'+ Create Coupon'}</Btn>
            </div>
          </Card>

          <div style={{background:'#fff',borderRadius:20,border:'1px solid rgba(27,67,50,0.07)',overflow:'hidden',marginTop:20}}>
            {coupons.length===0 ? (
              <div style={{textAlign:'center',padding:'40px 24px',color:'#a09890',fontSize:13}}>No coupons yet.</div>
            ) : coupons.map((c,i)=>(
              <div key={c.code} style={{display:'flex',alignItems:'center',gap:16,padding:'14px 24px',borderBottom:i<coupons.length-1?'1px solid rgba(27,67,50,0.05)':'none'}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:15,color:'#1a1712',fontWeight:600,letterSpacing:.5}}>{c.code}</div>
                  <div style={{fontSize:12,color:'#a09890'}}>
                    {c.type==='percent' ? `${c.value}% off` : `₹${c.value} off`}
                    {c.minOrder>0 && ` · Min ₹${c.minOrder}`}
                    {c.expiresAt && ` · Expires ${c.expiresAt}`}
                    {` · Used ${c.usedCount||0}x`}
                  </div>
                </div>
                <button onClick={()=>toggleCouponActive(c.code,c.active===false)} style={{padding:'5px 12px',borderRadius:20,border:`1.5px solid ${c.active!==false?'rgba(45,106,79,0.3)':'rgba(27,67,50,0.15)'}`,background:c.active!==false?'rgba(45,106,79,0.07)':'transparent',color:c.active!==false?'#2d6a4f':'#6b6460',fontSize:10,cursor:'pointer'}}>{c.active!==false?'Active':'Inactive'}</button>
                <button onClick={()=>delCoupon(c.code)} style={{width:32,height:32,borderRadius:8,border:'1.5px solid rgba(27,67,50,0.12)',background:'transparent',cursor:'pointer'}}>✕</button>
              </div>
            ))}
          </div>
          </>
        )}

        {/* ORDERS LIST */}
        {tab==='orders' && (
          <div style={{background:'#fff',borderRadius:20,border:'1px solid rgba(27,67,50,0.07)',boxShadow:'0 4px 20px rgba(27,67,50,0.06)',overflow:'hidden'}}>
            <div style={{padding:'20px 24px',borderBottom:'1px solid rgba(27,67,50,0.07)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:500,color:'#1b4332'}}>WhatsApp Orders</div>
              <button onClick={()=>loadOrders()} style={{padding:'7px 16px',borderRadius:20,border:'1.5px solid rgba(27,67,50,0.15)',background:'transparent',color:'#1b4332',fontSize:11,cursor:'pointer',letterSpacing:.5,textTransform:'uppercase'}}>Refresh</button>
            </div>
            {orders.length===0 ? (
              <div style={{textAlign:'center',padding:'60px 24px'}}>
                <div style={{fontSize:44,marginBottom:12,opacity:.2}}>🧾</div>
                <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#6b6460',margin:0}}>No orders logged yet.</p>
                <p style={{fontSize:12,color:'#a09890',marginTop:8}}>Orders are recorded automatically when a customer sends their cart via WhatsApp.</p>
              </div>
            ) : (
              <div>
                {orders.map((o,i)=>(
                  <div key={o.orderRef} style={{padding:'16px 24px',borderBottom:i<orders.length-1?'1px solid rgba(27,67,50,0.05)':'none'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:8,flexWrap:'wrap'}}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600,color:'#1b4332'}}>{o.orderRef}</span>
                        <span style={{fontSize:11,color:'#a09890'}}>{new Date(o.createdAt).toLocaleString('en-IN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:14,fontWeight:500,color:'#1b4332'}}>{o.total > 0 ? `₹${Number(o.total).toLocaleString('en-IN')}` : ''}</span>
                        <button onClick={()=>toggleOrderFulfilled(o.orderRef,!o.fulfilled)}
                          style={{padding:'5px 14px',borderRadius:20,border:`1.5px solid ${o.fulfilled?'rgba(45,106,79,0.3)':'rgba(184,150,90,0.35)'}`,background:o.fulfilled?'rgba(45,106,79,0.07)':'rgba(184,150,90,0.08)',color:o.fulfilled?'#2d6a4f':'#b8965a',fontSize:10,cursor:'pointer',letterSpacing:.6,textTransform:'uppercase'}}>
                          {o.fulfilled?'Fulfilled':'Pending'}
                        </button>
                        <button onClick={()=>delOrder(o.orderRef)} style={{width:28,height:28,borderRadius:8,border:'1.5px solid rgba(27,67,50,0.12)',background:'transparent',color:'#6b6460',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                        </button>
                      </div>
                    </div>
                    <div style={{fontSize:12,color:'#6b6460',lineHeight:1.7}}>
                      {(o.items||[]).map((it,idx)=>(
                        <span key={idx}>{it.title}{it.qty>1?` × ${it.qty}`:''}{idx<o.items.length-1?', ':''}</span>
                      ))}
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

// A book multi-select with manual reordering, used to curate the homepage's
// Featured Books / New Arrivals sections. `selected` is an ordered array of
// slugs; `onChange` receives the full next array.
function BookPicker({ title, hint, max, selected, books, onChange }) {
  const [q, setQ] = useState('');
  const bySlug = Object.fromEntries(books.map(b => [b.slug, b]));
  const atMax = max && selected.length >= max;
  const filtered = books.filter(b =>
    !q || b.title?.toLowerCase().includes(q.toLowerCase()) || b.author?.toLowerCase().includes(q.toLowerCase())
  );

  function toggle(slug) {
    if (selected.includes(slug)) onChange(selected.filter(s => s !== slug));
    else if (!atMax) onChange([...selected, slug]);
  }
  function move(slug, dir) {
    const idx = selected.indexOf(slug);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= selected.length) return;
    const next = [...selected];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    onChange(next);
  }

  const smallBtn = {width:22,height:22,border:'1px solid rgba(27,67,50,0.15)',borderRadius:5,background:'transparent',color:'#6b6460',cursor:'pointer',fontSize:10,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0};

  return (
    <Card title={`${title} (${selected.length}${max?`/${max}`:''})`}>
      {hint && <p style={{fontSize:11,color:'#a09890',margin:'-10px 0 16px',lineHeight:1.6}}>{hint}</p>}
      {selected.length > 0 && (
        <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:16,paddingBottom:16,borderBottom:'1px solid rgba(27,67,50,0.07)'}}>
          {selected.map((slug, i) => (
            <div key={slug} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:8,background:'rgba(27,67,50,0.04)'}}>
              <span style={{fontSize:11,color:'#a09890',width:14,flexShrink:0}}>{i+1}.</span>
              <span style={{flex:1,fontSize:12.5,color:'#1a1712',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{bySlug[slug]?.title || slug}</span>
              <button onClick={()=>move(slug,-1)} disabled={i===0} style={{...smallBtn,color:i===0?'#d8d3cb':'#6b6460'}}>▲</button>
              <button onClick={()=>move(slug,1)} disabled={i===selected.length-1} style={{...smallBtn,color:i===selected.length-1?'#d8d3cb':'#6b6460'}}>▼</button>
              <button onClick={()=>toggle(slug)} style={smallBtn}>✕</button>
            </div>
          ))}
        </div>
      )}
      <FInput value={q} onChange={e=>setQ(e.target.value)} placeholder="Search books to add…"/>
      <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:220,overflowY:'auto',marginTop:10,paddingRight:2}}>
        {filtered.length === 0 && <div style={{fontSize:12,color:'#a09890',padding:'8px 0'}}>No books match.</div>}
        {filtered.slice(0,40).map(b => {
          const sel = selected.includes(b.slug);
          const disabled = !sel && atMax;
          return (
            <div key={b.slug} onClick={()=>!disabled && toggle(b.slug)}
              style={{display:'flex',alignItems:'center',gap:10,padding:'7px 12px',borderRadius:8,border:`1px solid ${sel?'#1b4332':'rgba(27,67,50,0.1)'}`,background:sel?'rgba(27,67,50,0.05)':'#fff',cursor:disabled?'default':'pointer',opacity:disabled?0.45:1,fontSize:12.5}}>
              <span style={{width:15,height:15,borderRadius:4,border:`1.5px solid ${sel?'#1b4332':'rgba(27,67,50,0.22)'}`,background:sel?'#1b4332':'transparent',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                {sel && <svg width="8" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </span>
              <span style={{flex:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{b.title}</span>
              <span style={{fontSize:11,color:'#a09890',flexShrink:0}}>{b.author}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Toast({t}) {
  return (
    <div style={{position:'fixed',bottom:24,left:'50%',transform:`translateX(-50%) translateY(${t.show?0:16}px)`,background:'#fff',border:`1px solid ${t.type==='success'?'rgba(45,106,79,0.3)':t.type==='error'?'rgba(180,60,60,0.3)':'rgba(27,67,50,0.12)'}`,borderRadius:12,padding:'12px 24px',fontSize:13,color:t.type==='success'?'#2d6a4f':t.type==='error'?'#b44':'#1a1712',boxShadow:'0 8px 32px rgba(27,67,50,0.12)',zIndex:999,opacity:t.show?1:0,transition:'opacity .3s,transform .3s',pointerEvents:'none',whiteSpace:'nowrap'}}>
      {t.msg}
    </div>
  );
}

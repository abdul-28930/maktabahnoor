'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { EMAIL, WA_NUMBER, nameSlug, splitAuthors, splitTranslators, getBookCategories } from '@/lib/constants';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import PageBackground from '@/components/PageBackground';
import Navbar from '@/components/Navbar';
import { renderDescription } from '@/components/FormattedDescription';
import ReviewSection from '@/components/ReviewSection';
import ProductRatingSummary from '@/components/ProductRatingSummary';

const CAT_AR = {
  'Aqeedah':'عقيدة','Fiqh':'فقه','Hadith':'حديث','Tafsir':'تفسير',
  'Seerah':'سيرة','Manners & Character':'أخلاق','History':'تاريخ',
  'Arabic Language':'لغة','Dua & Dhikr':'دعاء','Quran & Tajweed':'قرآن','General':'عام',
};
const COVER_BG = 'linear-gradient(155deg,#2d6a4f 0%,#1b4332 100%)';

export default function EbookPageClient() {
  const { slug } = useParams();
  const [ebook, setEbook]       = useState(null);
  const [activeImg, setActiveImg] = useState('');
  const [qty, setQty]           = useState(1);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [related, setRelated]   = useState([]);
  const { addToCart, isInCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/ebooks/${slug}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then(d => {
        if (d) {
          setEbook(d.ebook);
          setActiveImg(d.ebook?.coverUrl || '');
          setLoading(false);
        }
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  // Related ebooks: same category, excluding this one
  useEffect(() => {
    if (!ebook?.category) return;
    fetch(`/api/ebooks?category=${encodeURIComponent(ebook.category)}`)
      .then(r => r.json())
      .then(d => setRelated((d.ebooks || []).filter(b => b.slug !== ebook.slug).slice(0, 4)))
      .catch(() => {});
  }, [ebook?.category, ebook?.slug]);

  if (loading) return (
    <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',fontFamily:"'DM Sans',sans-serif"}}>
      <PageBackground subtle/>
      <Navbar active="ebooks" />
      <div style={{position:'relative',zIndex:1,display:'flex',alignItems:'center',justifyContent:'center',minHeight:'70vh',flexDirection:'column',gap:16}}>
        <div style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:64,color:'rgba(27,67,50,0.1)',animation:'pulseRays 2s ease-in-out infinite'}}>النور</div>
        <div style={{fontSize:13,color:'#a09890',letterSpacing:1}}>Loading…</div>
      </div>
    </div>
  );

  if (notFound || !ebook) return (
    <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',fontFamily:"'DM Sans',sans-serif"}}>
      <PageBackground subtle/>
      <Navbar active="ebooks" />
      <div style={{position:'relative',zIndex:1,textAlign:'center',padding:'100px 24px'}}>
        <div style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:80,color:'rgba(27,67,50,0.08)',marginBottom:20}}>كتاب</div>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,color:'#1b4332',marginBottom:12}}>E-Book Not Found</h1>
        <p style={{color:'#6b6460',marginBottom:28}}>This e-book does not exist or may have been removed.</p>
        <Link href="/ebooks" style={{textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8,background:'#1b4332',color:'#fff',padding:'14px 28px',borderRadius:40,fontSize:13}}>← Back to E-Books</Link>
      </div>
    </div>
  );

  const cats = getBookCategories(ebook);
  const primaryCat = cats[0] || ebook.category || 'General';
  const ar = CAT_AR[primaryCat] || 'كتاب';
  const specs = [
    ebook.binding    && { label:'Binding',    val:ebook.binding },
    ebook.volumes    && { label:'Volumes',    val:ebook.volumes===1?'Single Volume':`${ebook.volumes} Volumes` },
    ebook.pages > 0  && { label:'Pages',      val:ebook.pages },
    ebook.language   && { label:'Language',   val:ebook.language },
    cats.length > 0  && { label: cats.length > 1 ? 'Categories' : 'Category', val: cats.join(', ') },
    ebook.translator && { label: splitTranslators(ebook.translator).length > 1 ? 'Translators' : 'Translator', val: ebook.translator, isTranslator: true },
  ].filter(Boolean);

  return (
    <div style={{position:'relative',minHeight:'100vh',background:'#faf9f5',fontFamily:"'DM Sans',sans-serif",overflowX:'hidden'}}>
      <PageBackground subtle/>
      <Navbar active="ebooks" />

      {/* BREADCRUMB */}
      <div style={{position:'relative',zIndex:1,padding:'20px clamp(20px,5vw,72px)',borderBottom:'1px solid rgba(27,67,50,0.06)'}}>
        <div style={{maxWidth:1200,margin:'0 auto',display:'flex',alignItems:'center',gap:10,fontSize:12,color:'#a09890',letterSpacing:.5}}>
          <Link href="/"      style={{textDecoration:'none',color:'#a09890'}}>Home</Link>
          <span style={{color:'rgba(27,67,50,0.2)'}}>›</span>
          <Link href="/ebooks" style={{textDecoration:'none',color:'#a09890'}}>E-Books</Link>
          <span style={{color:'rgba(27,67,50,0.2)'}}>›</span>
          <span style={{color:'#1b4332'}}>{ebook.title}</span>
        </div>
      </div>

      {/* MAIN */}
      <div className="detail-main-grid" style={{position:'relative',zIndex:1,maxWidth:1200,margin:'0 auto',padding:'56px clamp(20px,5vw,72px) 100px',display:'grid',gridTemplateColumns:'auto 1fr',gap:56,alignItems:'start'}}>

        {/* COVER & GALLERY SECTION */}
        <div className="detail-cover-sticky" style={{position:'sticky',top:92,display:'flex',gap:16,alignItems:'flex-start'}}>
          {/* Thumbnails on Left-Hand Side */}
          {ebook.gallery?.length > 0 && (
            <div className="detail-thumb-col" style={{display:'flex',flexDirection:'column',gap:12,maxHeight:'70vh',overflowY:'auto',paddingRight:4,flexShrink:0}}>
              {ebook.coverUrl && (
                <div
                  onClick={() => setActiveImg(ebook.coverUrl)}
                  style={{
                    width: 76, height: 102, borderRadius: 10, overflow: 'hidden',
                    border: (activeImg === ebook.coverUrl || !activeImg) ? '2.5px solid #1b4332' : '1.5px solid rgba(27,67,50,0.15)',
                    boxShadow: (activeImg === ebook.coverUrl || !activeImg) ? '0 4px 14px rgba(27,67,50,0.2)' : 'none',
                    cursor: 'pointer', background: '#f5f0f5', transition: 'all .2s ease',
                    opacity: (activeImg === ebook.coverUrl || !activeImg) ? 1 : 0.7,
                  }}
                  title="Front Cover"
                >
                  <img src={ebook.coverUrl} alt="Cover" style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/>
                </div>
              )}
              {ebook.gallery.map((url, i) => {
                const isSelected = activeImg === url;
                return (
                  <div key={i} onClick={() => setActiveImg(url)}
                    style={{
                      width: 76, height: 102, borderRadius: 10, overflow: 'hidden',
                      border: isSelected ? '2.5px solid #1b4332' : '1.5px solid rgba(27,67,50,0.15)',
                      boxShadow: isSelected ? '0 4px 14px rgba(27,67,50,0.2)' : 'none',
                      cursor: 'pointer', background: '#f5f0f5', transition: 'all .2s ease',
                      opacity: isSelected ? 1 : 0.7,
                    }}
                    title={`View ${i + 1}`}
                  >
                    <img src={url} alt={`${ebook.title} view ${i + 1}`} style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/>
                  </div>
                );
              })}
            </div>
          )}

          {/* Main Selected Image Display */}
          <div style={{width: 320, maxWidth: '100%'}}>
            <div style={{borderRadius:18,overflow:'hidden',boxShadow:'0 20px 60px rgba(27,67,50,0.18)',animation:'floatBook 6s ease-in-out infinite',aspectRatio:'3/4',background:'#f3f1ea'}}>
              {activeImg || ebook.coverUrl ? (
                <img src={activeImg || ebook.coverUrl} alt={ebook.title} style={{width:'100%',height:'100%',objectFit:'contain',background:'#f5f0f5'}} loading="lazy"/>
              ) : (
                <div style={{width:'100%',height:'100%',background:COVER_BG,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,padding:32,position:'relative'}}>
                  <div style={{position:'absolute',inset:16,border:'1px solid rgba(212,171,112,0.4)',borderRadius:10}}/>
                  <span style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:56,color:'#d4ab70'}}>{ar}</span>
                  <span style={{color:'rgba(255,255,255,0.4)',fontSize:20}}>✦</span>
                  <span style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic',fontSize:20,color:'rgba(255,255,255,0.85)',textAlign:'center',lineHeight:1.3}}>{ebook.title}</span>
                </div>
              )}
            </div>
            {/* E-Book badge */}
            <div style={{marginTop:12,display:'flex',justifyContent:'center'}}>
              <span style={{padding:'5px 16px',background:'rgba(184,150,90,0.12)',border:'1px solid rgba(184,150,90,0.3)',borderRadius:20,fontSize:10,fontWeight:600,letterSpacing:1.5,textTransform:'uppercase',color:'#b8965a'}}>📱 E-Book</span>
            </div>
          </div>
        </div>

        {/* DETAILS */}
        <div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:20,flexWrap:'wrap'}}>
            {cats.map(c => (
              <Link key={c} href={`/ebooks?category=${encodeURIComponent(c)}`} style={{textDecoration:'none'}}>
                <span style={{padding:'5px 14px',background:'rgba(27,67,50,0.07)',borderRadius:20,fontSize:10,fontWeight:500,letterSpacing:1,textTransform:'uppercase',color:'#1b4332'}}>{c}</span>
              </Link>
            ))}
            <span style={{padding:'5px 14px',background:'rgba(184,150,90,0.08)',borderRadius:20,fontSize:10,fontWeight:500,letterSpacing:1,textTransform:'uppercase',color:'#b8965a',border:'1px solid rgba(184,150,90,0.25)'}}>{ebook.language}</span>
          </div>

          <h1 style={{margin:'0 0 10px',fontFamily:"'Cormorant Garamond',serif",fontWeight:500,fontSize:'clamp(32px,4.5vw,52px)',color:'#1b4332',lineHeight:1.12}}>
            {ebook.title}
          </h1>
          {ebook.author && (
            <div style={{fontSize:15,color:'#6b6460',marginBottom:8,fontWeight:300}}>
              <span style={{fontWeight:500,color:'#4a453f'}}>{splitAuthors(ebook.author).length > 1 ? 'Authors:' : 'Author:'}</span>{' '}
              {splitAuthors(ebook.author).map((a, i, arr) => (
                <span key={a}>
                  <Link href={`/author/${nameSlug(a)}`} style={{color:'#1a1712',fontWeight:400,textDecoration:'none',borderBottom:'1px solid rgba(27,67,50,0.25)'}}>{a}</Link>
                  {i < arr.length - 1 && ', '}
                </span>
              ))}
            </div>
          )}
          {ebook.publisher && (
            <div style={{fontSize:15,color:'#6b6460',marginBottom:28,fontWeight:300}}>
              <span style={{fontWeight:500,color:'#4a453f'}}>Publisher:</span>{' '}
              <Link href={`/publisher/${nameSlug(ebook.publisher)}`} style={{color:'#1a1712',fontWeight:400,textDecoration:'none',borderBottom:'1px solid rgba(27,67,50,0.2)'}}>{ebook.publisher}</Link>
            </div>
          )}
          {!ebook.author && !ebook.publisher && <div style={{marginBottom:20}}/>}

          <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:28}}>
            <span style={{flex:1,height:1,background:'linear-gradient(90deg,rgba(27,67,50,0.2),transparent)'}}/>
            <span style={{color:'#b8965a',fontSize:12}}>✦</span>
          </div>

          <ProductRatingSummary itemId={`ebook:${ebook.slug}`} />

          {/* SKU */}
          {ebook.sku && (
            <div style={{fontSize:11,color:'#a09890',letterSpacing:1.5,textTransform:'uppercase',marginBottom:16}}>
              SKU: <span style={{color:'#6b6460',fontWeight:500}}>{ebook.sku}</span>
            </div>
          )}

          {/* Pricing */}
          {ebook.comingSoon ? (
            <div style={{marginBottom:20,padding:'20px 24px',background:'linear-gradient(135deg,rgba(184,150,90,0.08),rgba(27,67,50,0.04))',borderRadius:16,border:'1px solid rgba(184,150,90,0.25)'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <span style={{fontSize:24,color:'#b8965a'}}>✦</span>
                <div>
                  <div style={{fontSize:24,fontWeight:600,color:'#1b4332',fontFamily:"'Cormorant Garamond',serif"}}>Coming Soon</div>
                  <div style={{fontSize:13,color:'#6b6460',marginTop:2,fontWeight:300}}>This title is arriving soon. Price and availability will be updated once in stock.</div>
                </div>
              </div>
            </div>
          ) : (ebook.mrp || ebook.price) ? (
            <div style={{marginBottom:20,padding:'20px 24px',background:'linear-gradient(135deg,rgba(27,67,50,0.04),rgba(184,150,90,0.04))',borderRadius:16,border:'1px solid rgba(27,67,50,0.08)'}}>
              <div style={{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
                {ebook.mrp && ebook.price && ebook.mrp > ebook.price && (
                  <span style={{fontSize:20,color:'#a09890',textDecoration:'line-through',fontFamily:"'Cormorant Garamond',serif"}}>
                    ₹{Number(ebook.mrp).toLocaleString('en-IN')}
                  </span>
                )}
                <span style={{fontSize:36,fontWeight:500,color:'#1b4332',fontFamily:"'Cormorant Garamond',serif",lineHeight:1}}>
                  ₹{Number(ebook.price || ebook.mrp).toLocaleString('en-IN')}
                </span>
                {ebook.mrp && ebook.price && ebook.mrp > ebook.price && (
                  <span style={{padding:'5px 14px',borderRadius:20,background:'rgba(27,67,50,0.12)',color:'#1b4332',fontSize:13,fontWeight:500}}>
                    {Math.round((1 - ebook.price/ebook.mrp)*100)}% off
                  </span>
                )}
                {ebook.offerType && (
                  <span style={{padding:'5px 14px',borderRadius:20,fontSize:11,fontWeight:500,letterSpacing:1,textTransform:'uppercase',
                    background:ebook.offerType==='Sale'?'rgba(220,38,38,0.1)':ebook.offerType==='Limited Edition'?'rgba(124,58,237,0.1)':'rgba(184,150,90,0.1)',
                    border:ebook.offerType==='Sale'?'1px solid rgba(220,38,38,0.3)':ebook.offerType==='Limited Edition'?'1px solid rgba(124,58,237,0.3)':'1px solid rgba(184,150,90,0.3)',
                    color:ebook.offerType==='Sale'?'#dc2626':ebook.offerType==='Limited Edition'?'#7c3aed':'#b8965a'}}>
                    {ebook.offerType}
                  </span>
                )}
              </div>
              {ebook.mrp && ebook.price && ebook.mrp > ebook.price && (
                <div style={{fontSize:13,color:'#6b6460',marginTop:8,fontWeight:300}}>
                  You save ₹{(ebook.mrp - ebook.price).toLocaleString('en-IN')}
                </div>
              )}
            </div>
          ) : null}

          {/* Stock badge */}
          {(() => {
            if (ebook.comingSoon) {
              return (
                <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'9px 20px',borderRadius:30,marginBottom:28,
                  background:'rgba(184,150,90,0.1)',border:'1px solid rgba(184,150,90,0.3)',
                  color:'#b8965a',fontSize:12,fontWeight:600,letterSpacing:1,textTransform:'uppercase'}}>
                  <span style={{width:7,height:7,borderRadius:'50%',background:'currentColor'}}/>
                  Coming Soon
                </div>
              );
            }
            const isOut = ebook.stockCount !== undefined && ebook.stockCount !== null ? ebook.stockCount <= 0 : !ebook.inStock;
            const isLow = !isOut && ebook.stockCount !== undefined && ebook.stockCount !== null && ebook.stockCount <= 5;
            const urgent = isOut || isLow;
            return (
              <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'9px 20px',borderRadius:30,marginBottom:28,
                background:urgent?'rgba(192,57,43,0.08)':'rgba(27,67,50,0.08)',
                border:`1px solid ${urgent?'rgba(192,57,43,0.25)':'rgba(27,67,50,0.2)'}`,
                color:urgent?'#c0392b':'#1b4332',fontSize:12,fontWeight:600,letterSpacing:1,textTransform:'uppercase'}}>
                <span style={{width:7,height:7,borderRadius:'50%',background:'currentColor'}}/>
                {isOut ? 'Out of Stock' : isLow ? `Only ${ebook.stockCount} left!` : 'In Stock'}
              </div>
            );
          })()}

          {ebook.description && (
            <div style={{marginBottom:36,paddingBottom:36,borderBottom:'1px solid rgba(27,67,50,0.08)'}}>
              {renderDescription(ebook.description)}
            </div>
          )}

          {specs.length > 0 && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:36}}>
              {specs.map(s => (
                <div key={s.label} style={{padding:'16px 20px',background:'#fff',borderRadius:12,border:'1px solid rgba(27,67,50,0.08)',boxShadow:'0 2px 8px rgba(27,67,50,0.04)'}}>
                  <div style={{fontSize:9,letterSpacing:'2px',textTransform:'uppercase',color:'#b8965a',marginBottom:5}}>{s.label}</div>
                  <div style={{fontSize:15,color:'#1a1712',fontWeight:400}}>
                    {s.isTranslator
                      ? splitTranslators(s.val).map((t, idx, arr) => (
                          <span key={t}>
                            <Link href={`/translator/${nameSlug(t)}`} style={{color:'#1a1712',textDecoration:'none',borderBottom:'1px solid rgba(27,67,50,0.2)'}}>{t}</Link>
                            {idx < arr.length - 1 && ', '}
                          </span>
                        ))
                      : s.val}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{display:'flex',gap:14,flexWrap:'wrap',marginBottom:24,alignItems:'center'}}>
            {ebook.comingSoon ? (
              <a
                href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Assalamualaikum! I am interested in the upcoming e-book "${ebook.title}". Please notify me when it arrives.`)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  textDecoration:'none',display:'inline-flex',alignItems:'center',gap:10,
                  background:'#1b4332',color:'#fff',padding:'16px 28px',borderRadius:40,
                  fontSize:14,letterSpacing:.4,fontWeight:500,
                  boxShadow:'0 6px 20px rgba(27,67,50,0.2)',transition:'all .2s ease',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                Inquire / Notify Me on WhatsApp
              </a>
            ) : (
              <>
                {/* Quantity stepper */}
                {ebook.inStock !== false && !isInCart(ebook.slug) && (
                  <div style={{display:'flex',alignItems:'center',border:'1.5px solid rgba(27,67,50,0.15)',borderRadius:40,overflow:'hidden'}}>
                    <button onClick={()=>setQty(q=>Math.max(1,q-1))} aria-label="Decrease quantity"
                      style={{width:40,height:48,border:'none',background:'transparent',color:'#1b4332',fontSize:18,cursor:'pointer'}}>−</button>
                    <span style={{minWidth:32,textAlign:'center',fontSize:15,color:'#1a1712'}}>{qty}</span>
                    <button onClick={()=>setQty(q=>ebook.stockCount>0?Math.min(ebook.stockCount,q+1):q+1)} aria-label="Increase quantity"
                      style={{width:40,height:48,border:'none',background:'transparent',color:'#1b4332',fontSize:18,cursor:'pointer'}}>+</button>
                  </div>
                )}
                {/* Add to Cart */}
                {ebook.inStock !== false && (
                  <button
                    className={`book-add-to-cart book-add-to-cart--lg${isInCart(ebook.slug)?' book-add-to-cart--in':''}`}
                    onClick={() => { addToCart({ ...ebook, itemType: 'ebook' }, qty); setQty(1); }}
                  >
                    {isInCart(ebook.slug) ? (
                      <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Added to Cart</>
                    ) : (
                      <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>Add to Cart</>
                    )}
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => toggleWishlist(ebook)}
              aria-label={isWishlisted(ebook.slug) ? 'Remove from wishlist' : 'Add to wishlist'}
              style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:52,height:52,borderRadius:'50%',border:'1.5px solid rgba(27,67,50,0.15)',background:'#fff',cursor:'pointer',flexShrink:0}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill={isWishlisted(ebook.slug) ? '#c44' : 'none'} stroke={isWishlisted(ebook.slug) ? '#c44' : '#6b6460'} strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
            </button>
            <Link href="/ebooks"
              style={{textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8,border:'1.5px solid rgba(27,67,50,0.2)',color:'#1b4332',padding:'16px 28px',borderRadius:40,fontSize:14,letterSpacing:.4}}>
              ← Back to E-Books
            </Link>
          </div>

          <div style={{padding:'16px 20px',background:'rgba(184,150,90,0.06)',borderRadius:12,border:'1px solid rgba(184,150,90,0.18)',display:'flex',alignItems:'flex-start',gap:12}}>
            <span style={{color:'#b8965a',fontSize:16,marginTop:1}}>✦</span>
            <div>
              <div style={{fontSize:12,fontWeight:500,color:'#1b4332',marginBottom:3,letterSpacing:.3}}>How to Order</div>
              <p style={{margin:0,fontSize:13,color:'#6b6460',lineHeight:1.65,fontWeight:300}}>
                Add it to your cart, then tap <span style={{color:'#1b4332',fontWeight:400}}>Order via WhatsApp</span> to send us your order. We&apos;ll confirm availability and arrange swift delivery — or reach us anytime at <a href={`mailto:${EMAIL}`} style={{color:'#1b4332',fontWeight:400}}>{EMAIL}</a>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RELATED E-BOOKS */}
      {related.length > 0 && (
        <div style={{position:'relative',zIndex:1,maxWidth:1200,margin:'0 auto',padding:'0 clamp(20px,5vw,72px) 80px'}}>
          <div style={{fontSize:11,letterSpacing:'2px',textTransform:'uppercase',color:'#b8965a',marginBottom:18,display:'flex',alignItems:'center',gap:8}}>
            <span style={{width:16,height:1,background:'#b8965a',display:'inline-block'}}/>More E-Books in {primaryCat}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:18}}>
            {related.map(rb => (
              <Link key={rb.slug} href={`/ebook/${rb.slug}`} style={{textDecoration:'none',display:'block',background:'#fff',borderRadius:14,border:'1px solid rgba(27,67,50,0.08)',overflow:'hidden',boxShadow:'0 2px 12px rgba(27,67,50,0.05)',transition:'transform .2s'}}
                onMouseEnter={e=>e.currentTarget.style.transform='translateY(-3px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                <div style={{aspectRatio:'3/4',background:'linear-gradient(155deg,#2d6a4f,#1b4332)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {rb.coverUrl ? <img src={rb.coverUrl} alt={rb.title} style={{width:'100%',height:'100%',objectFit:'contain',background:'#f5f0f5'}} loading="lazy"/>
                    : <span style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:24,color:'#d4ab70'}}>{CAT_AR[rb.category]||'كتاب'}</span>}
                </div>
                <div style={{padding:'12px 14px'}}>
                  <div style={{fontSize:13,color:'#1a1712',fontWeight:400,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',marginBottom:3}}>{rb.title}</div>
                  <div style={{fontSize:11,color:'#a09890',marginBottom:6}}>{rb.author}</div>
                  {(rb.price || rb.mrp) && <div style={{fontSize:13,color:'#1b4332',fontWeight:500}}>₹{Number(rb.price || rb.mrp).toLocaleString('en-IN')}</div>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* REVIEWS */}
      <div style={{position:'relative',zIndex:1,maxWidth:1200,margin:'0 auto',padding:'0 clamp(20px,5vw,72px) 80px'}}>
        <ReviewSection itemId={`ebook:${ebook.slug}`} itemType="ebook" />
      </div>

      {/* Footer */}
      <footer style={{position:'relative',zIndex:1,background:'#1b4332',padding:'48px clamp(20px,5vw,72px)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:20}}>
        <Link href="/" style={{textDecoration:'none',fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:'#fff'}}>Maktabah An Noor</Link>
        <div dir="rtl" style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:22,color:'#b8965a'}}>مكتبة النور</div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',letterSpacing:1}}>© 2026 · Books That Illuminate The Heart</div>
      </footer>
      <style jsx global>{`
        @media (max-width:960px) {
          .detail-main-grid { grid-template-columns:1fr!important; gap:40px!important; }
          .detail-cover-sticky { position:static!important; max-width:420px; margin:0 auto; }
        }
        @media (max-width:600px) {
          .detail-cover-sticky { flex-direction:column-reverse!important; align-items:center!important; }
          .detail-thumb-col { flex-direction:row!important; max-height:none!important; overflow-x:auto!important; padding-bottom:6px; max-width:100%!important; }
        }
      `}</style>
    </div>
  );
}

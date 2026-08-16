'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function BooksNavDropdown({ active, className, style }) {
  const [open, setOpen] = useState(false);
  const [cats, setCats] = useState([]);

  useEffect(() => {
    fetch('/api/taxonomy').then(r=>r.json()).then(d=>setCats(d.taxonomy?.categories||[])).catch(()=>{});
  }, []);

  return (
    <div style={{position:'relative'}} onMouseEnter={()=>setOpen(true)} onMouseLeave={()=>setOpen(false)}>
      <Link href="/books" className={className}
        style={{textDecoration:'none',padding:'7px 14px',borderRadius:20,fontSize:12,letterSpacing:.3,
          color:active?'#1b4332':'#6b6460',fontWeight:active?500:400,background:active?'rgba(27,67,50,0.07)':'transparent',
          display:'inline-flex',alignItems:'center',gap:4,...style}}>
        Books <span style={{fontSize:8,marginTop:1}}>{open?'▲':'▼'}</span>
      </Link>
      {open && cats.length > 0 && (
        <div style={{position:'absolute',top:'100%',left:0,marginTop:4,background:'#fff',border:'1px solid rgba(27,67,50,0.1)',borderRadius:12,boxShadow:'0 12px 30px rgba(27,67,50,0.14)',padding:6,minWidth:190,zIndex:60}}>
          {cats.map(c => (
            <Link key={c} href={`/books?category=${encodeURIComponent(c)}`}
              style={{display:'block',padding:'8px 12px',borderRadius:8,textDecoration:'none',color:'#1a1712',fontSize:13,whiteSpace:'nowrap'}}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(27,67,50,0.06)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              {c}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';
import { useEffect } from 'react';
import { IG_FEATURED_POSTS, IG_URL, IG_HANDLE } from '@/lib/constants';

// Renders Instagram's official embed blockquote for each configured post URL,
// then loads Instagram's embed.js to hydrate them into real post cards.
// This does NOT pull a live/auto-updating feed — Instagram's Graph API
// (needed for that) requires app review + a connected Business account,
// which isn't set up here. Add post URLs to IG_FEATURED_POSTS in
// lib/constants.js to feature them; nothing renders until you do.
export default function InstagramEmbed() {
  useEffect(() => {
    if (IG_FEATURED_POSTS.length === 0) return;
    if (window.instgrm) { window.instgrm.Embeds.process(); return; }
    const script = document.createElement('script');
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  if (IG_FEATURED_POSTS.length === 0) return null;

  return (
    <section style={{position:'relative',zIndex:1,padding:'64px clamp(20px,5vw,72px)',background:'#faf9f5',borderTop:'1px solid rgba(27,67,50,0.07)'}}>
      <div style={{maxWidth:1140,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:36}}>
          <div style={{fontSize:10,letterSpacing:'2.5px',textTransform:'uppercase',color:'#b8965a',marginBottom:12}}>Follow Along</div>
          <h2 style={{margin:'0 0 8px',fontFamily:"'Cormorant Garamond',serif",fontWeight:500,fontSize:'clamp(26px,3.4vw,36px)',color:'#1b4332'}}>From Our Instagram</h2>
          <a href={IG_URL} target="_blank" rel="noreferrer" style={{fontSize:14,color:'#6b6460',textDecoration:'none'}}>{IG_HANDLE} →</a>
        </div>
        <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(IG_FEATURED_POSTS.length,3)},1fr)`,gap:20}}>
          {IG_FEATURED_POSTS.map((url) => (
            <blockquote
              key={url}
              className="instagram-media"
              data-instgrm-permalink={url}
              data-instgrm-version="14"
              style={{margin:0,width:'100%',background:'#fff',borderRadius:12,border:'1px solid rgba(27,67,50,0.1)'}}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

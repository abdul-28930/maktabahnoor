'use client';
import { useEffect, useState } from 'react';
import { IG_URL, IG_HANDLE } from '@/lib/constants';

// Renders Instagram's official embed blockquote for each post URL the admin
// has configured, then loads Instagram's embed.js to hydrate them into real
// post cards. This does NOT pull a live/auto-updating feed — Instagram's
// Graph API (needed for that) requires app review + a connected Business
// account, which isn't set up here. Manage which posts show from the admin
// panel's Homepage tab; nothing renders until at least one is added.
export default function InstagramEmbed() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch('/api/ig-posts').then(r => r.json()).then(d => setPosts(d.posts || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (posts.length === 0) return;
    if (window.instgrm) { window.instgrm.Embeds.process(); return; }
    const script = document.createElement('script');
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, [posts]);

  if (posts.length === 0) return null;

  return (
    <section style={{position:'relative',zIndex:1,padding:'64px clamp(20px,5vw,72px)',background:'#faf9f5',borderTop:'1px solid rgba(27,67,50,0.07)'}}>
      <div style={{maxWidth:1140,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:36}}>
          <div style={{fontSize:10,letterSpacing:'2.5px',textTransform:'uppercase',color:'#b8965a',marginBottom:12}}>Follow Along</div>
          <h2 style={{margin:'0 0 8px',fontFamily:"'Cormorant Garamond',serif",fontWeight:500,fontSize:'clamp(26px,3.4vw,36px)',color:'#1b4332'}}>From Our Instagram</h2>
          <a href={IG_URL} target="_blank" rel="noreferrer" style={{fontSize:14,color:'#6b6460',textDecoration:'none'}}>{IG_HANDLE} →</a>
        </div>
        <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(posts.length,3)},1fr)`,gap:20}}>
          {posts.map((p) => (
            <blockquote
              key={p.url}
              className="instagram-media"
              data-instgrm-permalink={p.url}
              data-instgrm-version="14"
              style={{margin:0,width:'100%',background:'#fff',borderRadius:12,border:'1px solid rgba(27,67,50,0.1)'}}
            />
          ))}
        </div>
      </div>
    </section>
  );
}


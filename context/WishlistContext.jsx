'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [items, setItems] = useState([]); // [{ slug, title, author, category, coverUrl, price, mrp, inStock }]
  const [hydrated, setHydrated] = useState(false);
  const { user } = useAuth();
  const syncingRef = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mn_wishlist');
      if (saved) setItems(JSON.parse(saved));
    } catch {}
    setHydrated(true);
  }, []);

  /* ── When user logs in, pull cloud wishlist and merge ── */
  useEffect(() => {
    if (!user) return;
    syncingRef.current = true;
    fetch('/api/user/sync')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.wishlist) && d.wishlist.length > 0) {
          setItems(prev => {
            const seen = new Set(prev.map(i => i.slug));
            const merged = [...prev];
            for (const item of d.wishlist) {
              if (!seen.has(item.slug)) {
                merged.push(item);
                seen.add(item.slug);
              }
            }
            try { localStorage.setItem('mn_wishlist', JSON.stringify(merged)); } catch {}
            return merged;
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        setTimeout(() => { syncingRef.current = false; }, 500);
      });
  }, [user]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem('mn_wishlist', JSON.stringify(items)); } catch {}

    if (user && !syncingRef.current) {
      fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wishlist: items }),
      }).catch(() => {});
    }
  }, [items, hydrated, user]);

  const addToWishlist = useCallback((book) => {
    setItems(prev => {
      if (prev.some(i => i.slug === book.slug)) return prev;
      return [...prev, {
        slug: book.slug, title: book.title,
        author: book.author, category: book.category || '', coverUrl: book.coverUrl || '',
        price: book.price || null, mrp: book.mrp || null, inStock: book.inStock !== false,
      }];
    });
  }, []);

  const removeFromWishlist = useCallback((slug) => {
    setItems(prev => prev.filter(i => i.slug !== slug));
  }, []);

  const toggleWishlist = useCallback((book) => {
    setItems(prev => prev.some(i => i.slug === book.slug)
      ? prev.filter(i => i.slug !== book.slug)
      : [...prev, {
          slug: book.slug, title: book.title,
          author: book.author, category: book.category || '', coverUrl: book.coverUrl || '',
          price: book.price || null, mrp: book.mrp || null, inStock: book.inStock !== false,
        }]);
  }, []);

  const isWishlisted = useCallback((slug) => items.some(i => i.slug === slug), [items]);

  return (
    <WishlistContext.Provider value={{ items, addToWishlist, removeFromWishlist, toggleWishlist, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside <WishlistProvider>');
  return ctx;
}

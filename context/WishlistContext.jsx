'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [items, setItems] = useState([]); // [{ slug, title, titleAr, author, category, coverUrl, price, mrp, inStock }]
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mn_wishlist');
      if (saved) setItems(JSON.parse(saved));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem('mn_wishlist', JSON.stringify(items)); } catch {}
  }, [items, hydrated]);

  const addToWishlist = useCallback((book) => {
    setItems(prev => {
      if (prev.some(i => i.slug === book.slug)) return prev;
      return [...prev, {
        slug: book.slug, title: book.title, titleAr: book.titleAr || '',
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
          slug: book.slug, title: book.title, titleAr: book.titleAr || '',
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

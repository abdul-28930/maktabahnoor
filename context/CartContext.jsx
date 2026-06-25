'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems]     = useState([]);   // [{ slug, title, author, titleAr, category, coverUrl, price, mrp, qty }]
  const [isOpen, setIsOpen]   = useState(false);
  const [hydrated, setHydrated] = useState(false);

  /* ── Load from localStorage once on mount ── */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mn_cart');
      if (saved) setItems(JSON.parse(saved));
    } catch {}
    setHydrated(true);
  }, []);

  /* ── Persist to localStorage on every change ── */
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem('mn_cart', JSON.stringify(items)); } catch {}
  }, [items, hydrated]);

  /* ── Actions ── */
  const addToCart = useCallback((book) => {
    setItems(prev => {
      const exists = prev.find(i => i.slug === book.slug);
      if (exists) {
        return prev.map(i => i.slug === book.slug ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, {
        slug:     book.slug,
        title:    book.title,
        titleAr:  book.titleAr  || '',
        author:   book.author,
        category: book.category || '',
        coverUrl: book.coverUrl || '',
        price:    book.price    || null,
        mrp:      book.mrp      || null,
        qty:      1,
      }];
    });
    setIsOpen(true);
  }, []);

  const removeFromCart = useCallback((slug) => {
    setItems(prev => prev.filter(i => i.slug !== slug));
  }, []);

  const updateQty = useCallback((slug, qty) => {
    if (qty < 1) return;
    setItems(prev => prev.map(i => i.slug === slug ? { ...i, qty } : i));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const isInCart = useCallback((slug) => items.some(i => i.slug === slug), [items]);

  const cartCount = items.reduce((sum, i) => sum + i.qty, 0);

  const openCart  = useCallback(() => setIsOpen(true),  []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  return (
    <CartContext.Provider value={{
      items, cartCount, isOpen,
      addToCart, removeFromCart, updateQty, clearCart,
      isInCart, openCart, closeCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}

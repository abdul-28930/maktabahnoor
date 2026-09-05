'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems]     = useState([]);   // [{ slug, title, author, category, coverUrl, price, mrp, qty }]
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
  const addToCart = useCallback((book, qty = 1) => {
    const cap = book.stockCount > 0 ? book.stockCount : Infinity;
    setItems(prev => {
      const exists = prev.find(i => i.slug === book.slug);
      if (exists) {
        return prev.map(i => i.slug === book.slug ? { ...i, qty: Math.min(cap, i.qty + qty) } : i);
      }
      return [...prev, {
        type:     'book',
        slug:     book.slug,
        title:    book.title,
        author:   book.author,
        category: book.category || '',
        coverUrl: book.coverUrl || '',
        price:    book.price    || null,
        mrp:      book.mrp      || null,
        stockCount: book.stockCount ?? null,
        qty: Math.min(cap, qty),
      }];
    });
    setIsOpen(true);
  }, []);

  /* ── Add a bundle deal to cart ── */
  const addBundleToCart = useCallback((bundle) => {
    const slug = `bundle:${bundle.id}`;
    const cap = bundle.stockCount > 0 ? bundle.stockCount : Infinity;
    setItems(prev => {
      const exists = prev.find(i => i.slug === slug);
      if (exists) {
        return prev.map(i => i.slug === slug ? { ...i, qty: Math.min(cap, i.qty + 1) } : i);
      }
      return [...prev, {
        type:      'bundle',
        slug,
        bundleId:  bundle.id,
        title:     bundle.name,
        author:    bundle.books?.length ? `${bundle.books.length} books` : '',
        category:  'Bundle',
        coverUrl:  bundle.books?.find(b => b.coverUrl)?.coverUrl || '',
        price:     bundle.bundlePrice || null,
        mrp:       bundle.totalMrp     || null,
        stockCount: bundle.stockCount ?? null,
        qty:       1,
      }];
    });
    setIsOpen(true);
  }, []);

  /* ── Add an accessory to cart ── */
  const addAccessoryToCart = useCallback((item, variant) => {
    const slug = `accessory:${item.id}${variant ? ':' + variant.id : ''}`;
    const effectiveStock = variant ? variant.stockCount : item.stockCount;
    const cap = effectiveStock > 0 ? effectiveStock : Infinity;
    setItems(prev => {
      const exists = prev.find(i => i.slug === slug);
      if (exists) return prev.map(i => i.slug === slug ? { ...i, qty: Math.min(cap, i.qty + 1) } : i);
      return [...prev, {
        type: 'accessory', slug, accessoryId: item.id,
        title: item.name + (variant ? ` (${variant.label})` : ''), author: '', category: 'Accessory',
        stockCount: effectiveStock ?? null,
        coverUrl: item.coverUrl || '', price: item.price || null, mrp: item.mrp || null, qty: 1,
      }];
    });
    setIsOpen(true);
  }, []);

  const addClothingToCart = useCallback((item, variant) => {
    const slug = `clothing:${item.id}${variant ? ':' + variant.id : ''}`;
    const effectiveStock = variant ? variant.stockCount : item.stockCount;
    const cap = effectiveStock > 0 ? effectiveStock : Infinity;
    setItems(prev => {
      const exists = prev.find(i => i.slug === slug);
      if (exists) return prev.map(i => i.slug === slug ? { ...i, qty: Math.min(cap, i.qty + 1) } : i);
      return [...prev, {
        type: 'clothing', slug, clothingId: item.id,
        title: item.name + (variant ? ` (${variant.label})` : ''), author: '', category: 'Clothing',
        stockCount: effectiveStock ?? null,
        coverUrl: item.coverUrl || '', price: item.price || null, mrp: item.mrp || null, qty: 1,
      }];
    });
    setIsOpen(true);
  }, []);

  const removeFromCart = useCallback((slug) => {
    setItems(prev => prev.filter(i => i.slug !== slug));
  }, []);

  const updateQty = useCallback((slug, qty) => {
    if (qty < 1) return;
    setItems(prev => prev.map(i => {
      if (i.slug !== slug) return i;
      const cap = i.stockCount > 0 ? i.stockCount : Infinity;
      return { ...i, qty: Math.min(cap, qty) };
    }));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const isInCart = useCallback((slug) => items.some(i => i.slug === slug), [items]);

  const cartCount = items.reduce((sum, i) => sum + i.qty, 0);

  const openCart  = useCallback(() => setIsOpen(true),  []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  return (
    <CartContext.Provider value={{
      items, cartCount, isOpen,
      addToCart, addBundleToCart, addAccessoryToCart, addClothingToCart, removeFromCart, updateQty, clearCart,
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

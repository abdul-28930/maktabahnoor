import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { logOrder } from '@/lib/orders';

// Atomically decrement a dedicated stock counter key. decrby is a single Redis
// operation, so two simultaneous orders for the same item can't both read a
// stale count and both succeed — one of them will correctly see 0 remain.
// If the decrement pushes the counter below 0 (oversold), we clamp it back up
// to 0 rather than let it go negative.
async function decrementStock(key, qty) {
  const next = await redis.decrby(key, qty);
  if (next < 0) {
    await redis.incrby(key, -next); // clamp back to 0
    return 0;
  }
  return next;
}

export async function POST(req) {
  try {
    const { items, orderRef } = await req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided.' }, { status: 400 });
    }

    const bookItems   = items.filter(i => i.type !== 'bundle' && i.slug);
    const bundleItems = items.filter(i => i.type === 'bundle');
    let total = 0;

    // Books: atomic decrement on dedicated key, then best-effort sync the
    // display copies (meta list + full record) so the storefront reflects it.
    if (bookItems.length) {
      const meta = await redis.get('mn_books_meta') || [];
      for (const item of bookItems) {
        const qty = item.qty || 1;
        const stockKey = `mn_stock:book:${item.slug}`;
        const next = await decrementStock(stockKey, qty);

        const idx = meta.findIndex(b => b.slug === item.slug);
        if (idx >= 0) {
          meta[idx] = { ...meta[idx], stockCount: next, inStock: next > 0 };
          total += Number(meta[idx].price || meta[idx].mrp || 0) * qty;
        }
        const full = await redis.get(`mn_book:${item.slug}`);
        if (full) await redis.set(`mn_book:${item.slug}`, { ...full, stockCount: next, inStock: next > 0 });
      }
      await redis.set('mn_books_meta', meta);
    }

    // Bundles: same pattern.
    if (bundleItems.length) {
      const metaB = await redis.get('mn_bundles_meta') || [];
      for (const item of bundleItems) {
        const qty = item.qty || 1;
        const bundleId = item.bundleId || (item.slug || '').replace('bundle:', '');
        const stockKey = `mn_stock:bundle:${bundleId}`;
        const next = await decrementStock(stockKey, qty);

        const idx = metaB.findIndex(b => b.id === bundleId);
        if (idx >= 0) {
          metaB[idx] = { ...metaB[idx], stockCount: next };
          total += Number(metaB[idx].bundlePrice || 0) * qty;
        }
        const full = await redis.get(`mn_bundle:${bundleId}`);
        if (full) await redis.set(`mn_bundle:${bundleId}`, { ...full, stockCount: next });
      }
      await redis.set('mn_bundles_meta', metaB);
    }

    if (orderRef) {
      await logOrder({ orderRef, items, total }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    // Never block the WhatsApp order flow on a stock-sync failure.
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

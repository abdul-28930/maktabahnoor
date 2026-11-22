import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { buildDefaultCurrencies } from '@/lib/currencies';

export const dynamic = 'force-dynamic';

const KEY = 'mn_currencies';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const showAll = searchParams.get('all') === '1';
    const adminPassword = req.headers.get('x-admin-password');

    let data = await redis.get(KEY);

    // If never initialized in DB, create default list (all hidden by default except INR)
    if (!data || !Array.isArray(data.currencies) || data.currencies.length === 0) {
      const initialCurrencies = buildDefaultCurrencies();
      data = {
        base: 'INR',
        lastUpdated: null,
        currencies: initialCurrencies,
      };
      await redis.set(KEY, data);
    }

    // Admin request for full list with hidden currencies
    if (showAll && adminPassword === process.env.ADMIN_PASSWORD) {
      return NextResponse.json({
        base: data.base || 'INR',
        lastUpdated: data.lastUpdated || null,
        currencies: data.currencies || [],
      });
    }

    // Customer public request: only return currencies enabled / visible by admin
    const visibleCurrencies = (data.currencies || []).filter(
      c => c.visible === true || c.code === 'INR'
    );

    return NextResponse.json({
      base: data.base || 'INR',
      lastUpdated: data.lastUpdated || null,
      currencies: visibleCurrencies,
    });
  } catch (err) {
    console.error('Error fetching currencies:', err);
    // Safe fallback so customers never crash
    const fallback = buildDefaultCurrencies().filter(c => c.code === 'INR');
    return NextResponse.json({
      base: 'INR',
      lastUpdated: null,
      currencies: fallback,
    });
  }
}

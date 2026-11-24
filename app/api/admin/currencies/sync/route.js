import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import {
  fetchExchangeRates,
  getCurrencyName,
  getCurrencySymbol,
  ALL_CURRENCY_CODES,
} from '@/lib/currencies';

export const dynamic = 'force-dynamic';

const KEY = 'mn_currencies';

export async function POST(req) {
  try {
    const { password } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // 1. Fetch live rates from ExchangeRate-API (fallback Frankfurter)
    const { provider, date, rates } = await fetchExchangeRates();

    // 2. Load existing stored currencies from Redis
    const stored = await redis.get(KEY);
    const existingList = (stored && Array.isArray(stored.currencies)) ? stored.currencies : [];
    const existingMap = new Map();
    for (const c of existingList) {
      existingMap.set(c.code, c);
    }

    // 3. Build unified list of all currencies (all from rates + any in standard list)
    const allCodes = Array.from(
      new Set(['INR', ...ALL_CURRENCY_CODES, ...Object.keys(rates || {})])
    );

    const nowIso = new Date().toISOString();
    const updatedCurrencies = allCodes.map(code => {
      const existing = existingMap.get(code);
      const rate = code === 'INR' ? 1 : (rates[code] !== undefined ? Number(rates[code]) : (existing?.rate || 0));
      
      // Preserve existing visibility setting if previously saved; otherwise default to "Hide" (false)
      const visible = existing !== undefined
        ? Boolean(existing.visible)
        : (code === 'INR'); // only INR visible initially, all others hidden

      const name = existing?.name || getCurrencyName(code);
      const symbol = existing?.symbol || getCurrencySymbol(code);

      return {
        code,
        name,
        symbol,
        rate,
        visible,
        isBase: code === 'INR',
        updatedAt: nowIso,
      };
    });

    // Sort: Base currency (INR) first, then alphabetical by code
    updatedCurrencies.sort((a, b) => {
      if (a.code === 'INR') return -1;
      if (b.code === 'INR') return 1;
      return a.code.localeCompare(b.code);
    });

    const payload = {
      base: 'INR',
      provider: provider || 'ExchangeRate-API',
      lastUpdated: nowIso,
      rateDate: date,
      currencies: updatedCurrencies,
    };

    // 4. Save to Redis DB
    await redis.set(KEY, payload);

    return NextResponse.json({
      success: true,
      provider: provider || 'ExchangeRate-API',
      lastUpdated: nowIso,
      rateDate: date,
      currencies: updatedCurrencies,
    });
  } catch (err) {
    console.error('Failed to sync currencies from ExchangeRate-API:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to update currencies from ExchangeRate-API.' },
      { status: 500 }
    );
  }
}

import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { buildDefaultCurrencies } from '@/lib/currencies';

export const dynamic = 'force-dynamic';

const KEY = 'mn_currencies';

export async function POST(req) {
  try {
    const { password, code, visible } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (!code) {
      return NextResponse.json({ error: 'Currency code is required.' }, { status: 400 });
    }

    let data = await redis.get(KEY);
    if (!data || !Array.isArray(data.currencies)) {
      data = {
        base: 'INR',
        lastUpdated: null,
        currencies: buildDefaultCurrencies(),
      };
    }

    let found = false;
    data.currencies = data.currencies.map(c => {
      if (c.code === code) {
        found = true;
        return {
          ...c,
          visible: Boolean(visible),
        };
      }
      return c;
    });

    if (!found) {
      return NextResponse.json({ error: `Currency ${code} not found.` }, { status: 404 });
    }

    await redis.set(KEY, data);

    return NextResponse.json({
      success: true,
      code,
      visible: Boolean(visible),
      currencies: data.currencies,
    });
  } catch (err) {
    console.error('Failed to toggle currency:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to toggle currency.' },
      { status: 500 }
    );
  }
}

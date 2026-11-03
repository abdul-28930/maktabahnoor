import redis from '@/lib/redis';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

const KEY = 'mn_sale_bar';

const DEFAULT_SALE_BAR = {
  enabled: false,
  text1: 'On-going limited time sale',
  timerLabel: 'Sale countdown',
  endTime: '',
  text2: 'Any text admin can add here',
  link: '',
};

export async function GET() {
  try {
    const data = await redis.get(KEY);
    return NextResponse.json({ saleBar: data || DEFAULT_SALE_BAR });
  } catch (e) {
    console.error('Error fetching sale bar:', e);
    return NextResponse.json({ saleBar: DEFAULT_SALE_BAR });
  }
}

export async function POST(req) {
  try {
    const { password, saleBar } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (!saleBar || typeof saleBar !== 'object') {
      return NextResponse.json({ error: 'Invalid data.' }, { status: 400 });
    }

    const payload = {
      enabled: Boolean(saleBar.enabled),
      text1: String(saleBar.text1 || '').trim(),
      timerLabel: String(saleBar.timerLabel || 'Sale countdown').trim(),
      endTime: String(saleBar.endTime || '').trim(),
      text2: String(saleBar.text2 || '').trim(),
      link: String(saleBar.link || '').trim(),
      updatedAt: new Date().toISOString(),
    };

    await redis.set(KEY, payload);

    try {
      revalidatePath('/', 'layout');
    } catch {}

    return NextResponse.json({ success: true, saleBar: payload });
  } catch (e) {
    console.error('Error saving sale bar:', e);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

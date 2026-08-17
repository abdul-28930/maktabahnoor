import redis from '@/lib/redis';
import { NextResponse } from 'next/server';

const KEY = 'mn_accessories';
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const isAdmin = searchParams.get('password') === process.env.ADMIN_PASSWORD;
  try {
    const all = await redis.get(KEY) || [];
    const list = isAdmin ? all : all.filter(a => a.visible !== false);
    return NextResponse.json({ accessories: list });
  } catch { return NextResponse.json({ accessories: [] }); }
}

export async function POST(req) {
  try {
    const { password, ...data } = await req.json();
    if (password !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    if (!data.name?.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    if (data.price === undefined || data.price === '') return NextResponse.json({ error: 'Price is required.' }, { status: 400 });
    if (data.stockCount === undefined || data.stockCount === '') return NextResponse.json({ error: 'Stock count is required.' }, { status: 400 });

    const all = await redis.get(KEY) || [];
    const now = new Date().toISOString();
    const item = {
      id: uid(),
      name: data.name.trim(),
      description: data.description?.trim() || '',
      price: Number(data.price),
      mrp: data.mrp ? Number(data.mrp) : null,
      stockCount: parseInt(data.stockCount) || 0,
      coverUrl: data.coverUrl?.trim() || '',
      variants: Array.isArray(data.variants) ? data.variants
        .filter(v => v.label?.trim())
        .map(v => ({ id: v.id || uid(), label: v.label.trim(), color: v.color || '#1b4332', stockCount: Math.max(0, parseInt(v.stockCount) || 0) }))
        : [],
      visible: data.visible !== false,
      createdAt: now, updatedAt: now,
    };
    await redis.set(KEY, [...all, item]);
    return NextResponse.json({ success: true, item });
  } catch (e) { return NextResponse.json({ error: 'Failed to save.' }, { status: 500 }); }
}

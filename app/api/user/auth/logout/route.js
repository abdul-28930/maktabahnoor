import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/userAuth';

export async function POST(req) {
  try {
    const token = req.cookies.get('mn_user_token')?.value;
    if (token) {
      await deleteSession(token);
    }

    const res = NextResponse.json({ success: true });
    res.cookies.delete('mn_user_token');
    return res;
  } catch {
    const res = NextResponse.json({ success: true });
    res.cookies.delete('mn_user_token');
    return res;
  }
}

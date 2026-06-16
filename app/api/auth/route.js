import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { password } = await req.json();
    if (!process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'ADMIN_PASSWORD not set.' }, { status: 500 });
    }
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Auth failed.' }, { status: 500 });
  }
}

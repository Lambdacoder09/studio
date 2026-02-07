
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  return NextResponse.json(db.users);
}

export async function POST(req: NextRequest) {
  const newUser = await req.json();
  newUser.id = db.users.length + 1;
  db.users.push(newUser);
  return NextResponse.json(newUser, { status: 201 });
}

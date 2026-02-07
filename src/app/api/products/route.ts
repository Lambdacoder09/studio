
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  return NextResponse.json(db.products);
}

export async function POST(req: NextRequest) {
  const newProduct = await req.json();
  newProduct.id = db.products.length + 1;
  db.products.push(newProduct);
  return NextResponse.json(newProduct, { status: 201 });
}

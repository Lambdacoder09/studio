
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const product = db.products.find(product => product.id === parseInt(params.id));
  if (product) {
    return NextResponse.json(product);
  } else {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const productIndex = db.products.findIndex(product => product.id === parseInt(params.id));
  if (productIndex !== -1) {
    const updatedProduct = await req.json();
    db.products[productIndex] = { ...db.products[productIndex], ...updatedProduct };
    return NextResponse.json(db.products[productIndex]);
  } else {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const productIndex = db.products.findIndex(product => product.id === parseInt(params.id));
  if (productIndex !== -1) {
    db.products.splice(productIndex, 1);
    return NextResponse.json({ message: "Product deleted" });
  } else {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
}

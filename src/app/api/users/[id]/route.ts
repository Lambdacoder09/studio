
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = db.users.find(user => user.id === parseInt(params.id));
  if (user) {
    return NextResponse.json(user);
  } else {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const userIndex = db.users.findIndex(user => user.id === parseInt(params.id));
  if (userIndex !== -1) {
    const updatedUser = await req.json();
    db.users[userIndex] = { ...db.users[userIndex], ...updatedUser };
    return NextResponse.json(db.users[userIndex]);
  } else {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userIndex = db.users.findIndex(user => user.id === parseInt(params.id));
  if (userIndex !== -1) {
    db.users.splice(userIndex, 1);
    return NextResponse.json({ message: "User deleted" });
  } else {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}

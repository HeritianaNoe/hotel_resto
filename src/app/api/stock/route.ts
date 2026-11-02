import { auth, hasRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session || !hasRole(session.user.roles, "ADMIN", "MANAGER", "STOCK_KEEPER", "CHEF")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const items = await prisma.stockItem.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(serializeBigInt(items));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !hasRole(session.user.roles, "ADMIN", "MANAGER", "STOCK_KEEPER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const item = await prisma.stockItem.create({
    data: {
      name: body.name,
      quantity: body.quantity,
      unit: body.unit || null,
      minLevel: body.minLevel ?? null,
      supplier: body.supplier || null,
    },
  });
  return NextResponse.json(serializeBigInt(item), { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || !hasRole(session.user.roles, "ADMIN", "MANAGER", "STOCK_KEEPER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.quantity !== undefined) data.quantity = body.quantity;
  if (body.unit !== undefined) data.unit = body.unit || null;
  if (body.minLevel !== undefined) data.minLevel = body.minLevel;
  if (body.supplier !== undefined) data.supplier = body.supplier || null;

  const item = await prisma.stockItem.update({
    where: { id: BigInt(body.id) },
    data,
  });
  return NextResponse.json(serializeBigInt(item));
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || !hasRole(session.user.roles, "ADMIN", "MANAGER", "STOCK_KEEPER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  await prisma.stockItem.delete({ where: { id: BigInt(id) } });
  return NextResponse.json({ success: true });
}

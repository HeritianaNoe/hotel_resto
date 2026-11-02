import { auth, hasRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.menuItem.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });
  return NextResponse.json(serializeBigInt(items));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !hasRole(session.user.roles, "ADMIN", "MANAGER", "CHEF")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const item = await prisma.menuItem.create({
    data: {
      name: body.name,
      description: body.description || null,
      price: body.price,
      category: body.category || null,
      available: body.available ?? true,
    },
  });
  return NextResponse.json(serializeBigInt(item), { status: 201 });
}

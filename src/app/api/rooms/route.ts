import { auth, hasRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rooms = await prisma.room.findMany({ orderBy: { number: "asc" } });
  return NextResponse.json(serializeBigInt(rooms));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !hasRole(session.user.roles, "ADMIN", "MANAGER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const room = await prisma.room.create({
    data: {
      number: body.number,
      type: body.type,
      pricePerNight: body.pricePerNight,
      status: body.status || "AVAILABLE",
    },
  });
  return NextResponse.json(serializeBigInt(room), { status: 201 });
}

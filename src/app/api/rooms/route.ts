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

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || !hasRole(session.user.roles, "ADMIN", "MANAGER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.number !== undefined) data.number = body.number;
  if (body.type !== undefined) data.type = body.type;
  if (body.pricePerNight !== undefined) data.pricePerNight = body.pricePerNight;
  if (body.status !== undefined) data.status = body.status;

  try {
    const room = await prisma.room.update({
      where: { id: BigInt(body.id) },
      data,
    });
    return NextResponse.json(serializeBigInt(room));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "Numéro de chambre déjà utilisé" }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || !hasRole(session.user.roles, "ADMIN", "MANAGER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  // Check if room has active reservations
  const active = await prisma.reservation.count({
    where: {
      roomId: BigInt(id),
      status: { in: ["CONFIRMED", "CHECKED_IN"] },
    },
  });
  if (active > 0) {
    return NextResponse.json(
      { error: "Impossible de supprimer : réservation active liée à cette chambre" },
      { status: 400 }
    );
  }

  await prisma.room.delete({ where: { id: BigInt(id) } });
  return NextResponse.json({ success: true });
}

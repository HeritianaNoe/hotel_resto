import { auth, hasRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isGuestOnly =
    hasRole(session.user.roles, "GUEST") &&
    !hasRole(session.user.roles, "ADMIN", "MANAGER", "RECEPTIONIST");

  const reservations = await prisma.reservation.findMany({
    where: isGuestOnly ? { guestId: BigInt(session.user.id) } : undefined,
    include: {
      room: true,
      guest: { select: { id: true, fullName: true, username: true, email: true } },
    },
    orderBy: { checkIn: "desc" },
  });

  return NextResponse.json(serializeBigInt(reservations));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  let guestId = body.guestId ? BigInt(body.guestId) : BigInt(session.user.id);

  // Guests can only create for themselves
  if (
    hasRole(session.user.roles, "GUEST") &&
    !hasRole(session.user.roles, "ADMIN", "MANAGER", "RECEPTIONIST")
  ) {
    guestId = BigInt(session.user.id);
  }

  const checkIn = new Date(body.checkIn);
  const checkOut = new Date(body.checkOut);
  if (checkOut <= checkIn) {
    return NextResponse.json({ error: "check_out must be after check_in" }, { status: 400 });
  }

  const room = await prisma.room.findUnique({ where: { id: BigInt(body.roomId) } });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const totalPrice = Number(room.pricePerNight) * nights;

  const reservation = await prisma.reservation.create({
    data: {
      roomId: BigInt(body.roomId),
      guestId,
      checkIn,
      checkOut,
      status: body.status || "CONFIRMED",
      totalPrice,
    },
    include: { room: true, guest: true },
  });

  // Mark room reserved if needed
  if (reservation.status === "CONFIRMED" || reservation.status === "CHECKED_IN") {
    await prisma.room.update({
      where: { id: room.id },
      data: { status: reservation.status === "CHECKED_IN" ? "OCCUPIED" : "RESERVED" },
    });
  }

  return NextResponse.json(serializeBigInt(reservation), { status: 201 });
}

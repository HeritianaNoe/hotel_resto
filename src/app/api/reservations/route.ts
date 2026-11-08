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
      invoice: true,
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

  // Parse as date-only (YYYY-MM-DD) to avoid timezone shift
  const checkIn = new Date(body.checkIn + (String(body.checkIn).includes("T") ? "" : "T12:00:00"));
  const checkOut = new Date(body.checkOut + (String(body.checkOut).includes("T") ? "" : "T12:00:00"));
  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }
  if (checkOut <= checkIn) {
    return NextResponse.json({ error: "check_out must be after check_in" }, { status: 400 });
  }

  const roomId = BigInt(body.roomId);
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  // Prevent overlapping active reservations on the same room
  const overlap = await prisma.reservation.findFirst({
    where: {
      roomId,
      status: { in: ["CONFIRMED", "CHECKED_IN"] },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
    },
  });
  if (overlap) {
    return NextResponse.json(
      { error: "Efitrano efa voatokana amin'ity daty ity (chevauchement)" },
      { status: 400 }
    );
  }

  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const totalPrice = Number(room.pricePerNight) * nights;

  const reservation = await prisma.reservation.create({
    data: {
      roomId,
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

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || !hasRole(session.user.roles, "ADMIN", "MANAGER", "RECEPTIONIST")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  const existing = await prisma.reservation.findUnique({
    where: { id: BigInt(body.id) },
    include: { room: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (body.status !== undefined) data.status = body.status;
  if (body.roomId !== undefined) data.roomId = BigInt(body.roomId);
  if (body.guestId !== undefined) data.guestId = BigInt(body.guestId);

  // Recalculate total if dates or room changed
  const roomId = body.roomId ? BigInt(body.roomId) : existing.roomId;
  const checkIn = body.checkIn
    ? new Date(body.checkIn + (String(body.checkIn).includes("T") ? "" : "T12:00:00"))
    : existing.checkIn;
  const checkOut = body.checkOut
    ? new Date(body.checkOut + (String(body.checkOut).includes("T") ? "" : "T12:00:00"))
    : existing.checkOut;

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }
  if (checkOut <= checkIn) {
    return NextResponse.json({ error: "check_out must be after check_in" }, { status: 400 });
  }

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  // Overlap check (exclude current reservation)
  const newStatus = (data.status as string) || existing.status;
  if (newStatus === "CONFIRMED" || newStatus === "CHECKED_IN") {
    const overlap = await prisma.reservation.findFirst({
      where: {
        roomId,
        id: { not: BigInt(body.id) },
        status: { in: ["CONFIRMED", "CHECKED_IN"] },
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
    });
    if (overlap) {
      return NextResponse.json(
        { error: "Efitrano efa voatokana amin'ity daty ity (chevauchement)" },
        { status: 400 }
      );
    }
  }

  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  data.totalPrice = Number(room.pricePerNight) * nights;
  data.checkIn = checkIn;
  data.checkOut = checkOut;

  const reservation = await prisma.$transaction(async (tx) => {
    const updated = await tx.reservation.update({
      where: { id: BigInt(body.id) },
      data,
      include: { room: true, guest: true, invoice: true },
    });

    // Update room status based on new status
    const newStatus = (data.status as string) || existing.status;
    if (newStatus === "CHECKED_IN") {
      await tx.room.update({ where: { id: roomId }, data: { status: "OCCUPIED" } });
    } else if (newStatus === "CONFIRMED") {
      await tx.room.update({ where: { id: roomId }, data: { status: "RESERVED" } });
    } else if (newStatus === "CHECKED_OUT" || newStatus === "CANCELLED") {
      // Free the room if no other active reservation
      const otherActive = await tx.reservation.count({
        where: {
          roomId,
          id: { not: BigInt(body.id) },
          status: { in: ["CONFIRMED", "CHECKED_IN"] },
        },
      });
      if (otherActive === 0) {
        await tx.room.update({ where: { id: roomId }, data: { status: "AVAILABLE" } });
      }
    }

    return updated;
  });

  return NextResponse.json(serializeBigInt(reservation));
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || !hasRole(session.user.roles, "ADMIN", "MANAGER", "RECEPTIONIST")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: BigInt(id) },
    include: { invoice: true },
  });
  if (!reservation) {
    return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
  }

  if (reservation.invoice) {
    return NextResponse.json(
      { error: "Impossible de supprimer : facture déjà émise pour cette réservation" },
      { status: 400 }
    );
  }

  if (reservation.status === "CHECKED_IN") {
    return NextResponse.json(
      { error: "Impossible de supprimer une réservation en cours (CHECKED_IN). Changez le statut d'abord." },
      { status: 400 }
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.reservation.delete({ where: { id: BigInt(id) } });

    // Free room if no other active
    const otherActive = await tx.reservation.count({
      where: {
        roomId: reservation.roomId,
        status: { in: ["CONFIRMED", "CHECKED_IN"] },
      },
    });
    if (otherActive === 0) {
      await tx.room.update({
        where: { id: reservation.roomId },
        data: { status: "AVAILABLE" },
      });
    }
  });

  return NextResponse.json({ success: true });
}

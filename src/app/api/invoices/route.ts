import { NextRequest, NextResponse } from "next/server";
import { auth, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session || !hasRole(session.user.roles, "ADMIN", "MANAGER", "CASHIER", "RECEPTIONIST")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const invoices = await prisma.invoice.findMany({
    include: {
      foodOrder: {
        include: {
          diningTable: true,
          orderItems: { include: { menuItem: true } },
        },
      },
      reservation: {
        include: {
          room: true,
          guest: { select: { fullName: true, username: true } },
        },
      },
      cashier: { select: { fullName: true, username: true } },
    },
    orderBy: { paidAt: "desc" },
  });
  return NextResponse.json(serializeBigInt(invoices));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !hasRole(session.user.roles, "ADMIN", "MANAGER", "CASHIER", "RECEPTIONIST")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  // Room / Reservation payment
  if (body.reservationId) {
    const reservationId = BigInt(body.reservationId);
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { invoice: true, room: true },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }
    if (reservation.invoice) {
      return NextResponse.json({ error: "Déjà facturée" }, { status: 400 });
    }

    const amount = body.amount ?? Number(reservation.totalPrice || 0);

    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          reservationId,
          cashierId: BigInt(session.user.id),
          amount,
          method: body.method || "CASH",
          paidAt: new Date(),
          type: "ROOM",
        },
      });

      // Optionally mark as CHECKED_OUT if still active
      if (reservation.status === "CHECKED_IN" || reservation.status === "CONFIRMED") {
        await tx.reservation.update({
          where: { id: reservationId },
          data: { status: "CHECKED_OUT" },
        });
        // Free the room
        const otherActive = await tx.reservation.count({
          where: {
            roomId: reservation.roomId,
            id: { not: reservationId },
            status: { in: ["CONFIRMED", "CHECKED_IN"] },
          },
        });
        if (otherActive === 0) {
          await tx.room.update({
            where: { id: reservation.roomId },
            data: { status: "AVAILABLE" },
          });
        }
      }

      return inv;
    });

    return NextResponse.json(serializeBigInt(invoice), { status: 201 });
  }

  // Food order payment (existing logic)
  const orderId = BigInt(body.foodOrderId);
  const order = await prisma.foodOrder.findUnique({
    where: { id: orderId },
    include: { orderItems: true, invoice: true },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.invoice) return NextResponse.json({ error: "Already invoiced" }, { status: 400 });

  const amount =
    body.amount ??
    order.orderItems.reduce((s, oi) => s + Number(oi.unitPrice) * oi.quantity, 0);

  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        foodOrderId: orderId,
        cashierId: BigInt(session.user.id),
        amount,
        method: body.method || "CASH",
        paidAt: new Date(),
        type: "FOOD",
      },
    });
    await tx.foodOrder.update({
      where: { id: orderId },
      data: { status: "PAID" },
    });
    return inv;
  });

  return NextResponse.json(serializeBigInt(invoice), { status: 201 });
}

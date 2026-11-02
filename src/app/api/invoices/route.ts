import { NextRequest, NextResponse } from "next/server";
import { auth, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session || !hasRole(session.user.roles, "ADMIN", "MANAGER", "CASHIER")) {
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
      cashier: { select: { fullName: true, username: true } },
    },
    orderBy: { paidAt: "desc" },
  });
  return NextResponse.json(serializeBigInt(invoices));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !hasRole(session.user.roles, "ADMIN", "MANAGER", "CASHIER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
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

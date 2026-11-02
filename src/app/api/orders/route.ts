import { auth, hasRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.foodOrder.findMany({
    include: {
      diningTable: true,
      waiter: { select: { fullName: true, username: true } },
      guest: { select: { fullName: true, username: true } },
      orderItems: { include: { menuItem: true } },
      invoice: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(serializeBigInt(orders));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (
    !session ||
    !hasRole(session.user.roles, "ADMIN", "MANAGER", "WAITER", "GUEST")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  if (!body.diningTableId || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const menuIds = body.items.map((i: { menuItemId: string }) => BigInt(i.menuItemId));
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuIds }, available: true },
  });
  if (menuItems.length !== menuIds.length) {
    return NextResponse.json({ error: "Some menu items unavailable" }, { status: 400 });
  }

  const priceMap = new Map(menuItems.map((m) => [m.id.toString(), m.price]));

  const isWaiter = hasRole(session.user.roles, "WAITER", "ADMIN", "MANAGER");
  const waiterId = isWaiter ? BigInt(session.user.id) : null;
  const guestId = body.guestId
    ? BigInt(body.guestId)
    : hasRole(session.user.roles, "GUEST")
      ? BigInt(session.user.id)
      : null;

  const order = await prisma.foodOrder.create({
    data: {
      diningTableId: BigInt(body.diningTableId),
      waiterId,
      guestId,
      status: "PENDING",
      createdAt: new Date(),
      orderItems: {
        create: body.items.map((i: { menuItemId: string; quantity: number }) => ({
          menuItemId: BigInt(i.menuItemId),
          quantity: i.quantity,
          unitPrice: priceMap.get(i.menuItemId)!,
        })),
      },
    },
    include: {
      diningTable: true,
      orderItems: { include: { menuItem: true } },
    },
  });

  return NextResponse.json(serializeBigInt(order), { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (
    !session ||
    !hasRole(session.user.roles, "ADMIN", "MANAGER", "WAITER", "CHEF", "CASHIER")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id, status } = body;
  if (!id || !status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }

  const allowed = ["PENDING", "PREPARING", "READY", "SERVED", "CANCELLED", "PAID"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const order = await prisma.foodOrder.update({
    where: { id: BigInt(id) },
    data: { status },
    include: {
      orderItems: { include: { menuItem: true } },
      diningTable: true,
    },
  });

  return NextResponse.json(serializeBigInt(order));
}

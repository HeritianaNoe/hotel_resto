import { auth, hasRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session || !hasRole(session.user.roles, "ADMIN", "MANAGER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    include: {
      roles: { include: { role: true } },
    },
    orderBy: { username: "asc" },
  });
  return NextResponse.json(
    serializeBigInt(
      users.map((u) => ({
        ...u,
        password: undefined,
        roles: u.roles.map((r) => r.role.name),
      }))
    )
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !hasRole(session.user.roles, "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const hash = await bcrypt.hash(body.password || "password123", 10);

  const user = await prisma.user.create({
    data: {
      username: body.username,
      email: body.email,
      fullName: body.fullName || null,
      password: hash,
      enabled: true,
      roles: body.role
        ? {
            create: {
              role: { connect: { name: body.role } },
            },
          }
        : undefined,
    },
    include: { roles: { include: { role: true } } },
  });

  return NextResponse.json(
    serializeBigInt({
      ...user,
      password: undefined,
      roles: user.roles.map((r) => r.role.name),
    }),
    { status: 201 }
  );
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || !hasRole(session.user.roles, "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.email !== undefined) data.email = body.email;
  if (body.fullName !== undefined) data.fullName = body.fullName || null;
  if (body.enabled !== undefined) data.enabled = body.enabled;
  if (body.password && body.password.trim()) {
    data.password = await bcrypt.hash(body.password, 10);
  }

  // Update basic fields
  const user = await prisma.user.update({
    where: { id: BigInt(body.id) },
    data,
  });

  // Update role if provided
  if (body.role) {
    const role = await prisma.role.findUnique({ where: { name: body.role } });
    if (role) {
      await prisma.userRole.deleteMany({ where: { userId: user.id } });
      await prisma.userRole.create({
        data: { userId: user.id, roleId: role.id },
      });
    }
  }

  const updated = await prisma.user.findUnique({
    where: { id: user.id },
    include: { roles: { include: { role: true } } },
  });

  return NextResponse.json(
    serializeBigInt({
      ...updated,
      password: undefined,
      roles: updated?.roles.map((r) => r.role.name) || [],
    })
  );
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || !hasRole(session.user.roles, "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  // Prevent deleting yourself
  if (session.user.id === id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas supprimer votre propre compte" },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id: BigInt(id) } });
  return NextResponse.json({ success: true });
}

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Roles
  const roles = [
    "ADMIN",
    "MANAGER",
    "RECEPTIONIST",
    "WAITER",
    "CHEF",
    "CASHIER",
    "STOCK_KEEPER",
    "GUEST",
  ];

  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Users (password = password123 for all demo accounts)
  const passwordHash = await bcrypt.hash("password123", 10);

  const usersData = [
    { username: "admin", email: "admin@hotel.local", fullName: "Administrateur", role: "ADMIN" },
    { username: "manager1", email: "manager1@hotel.local", fullName: "Rakoto Manager", role: "MANAGER" },
    { username: "reception1", email: "reception1@hotel.local", fullName: "Rasoa Reception", role: "RECEPTIONIST" },
    { username: "waiter1", email: "waiter1@hotel.local", fullName: "Randria Serveur", role: "WAITER" },
    { username: "chef1", email: "chef1@hotel.local", fullName: "Rabe Chef", role: "CHEF" },
    { username: "cashier1", email: "cashier1@hotel.local", fullName: "Hery Caissier", role: "CASHIER" },
    { username: "stock1", email: "stock1@hotel.local", fullName: "Faly Magasinier", role: "STOCK_KEEPER" },
    { username: "guest1", email: "guest1@hotel.local", fullName: "Vahiny Iray", role: "GUEST" },
  ];

  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: {
        password: passwordHash,
        enabled: true,
        fullName: u.fullName,
        email: u.email,
      },
      create: {
        username: u.username,
        email: u.email,
        fullName: u.fullName,
        password: passwordHash,
        enabled: true,
      },
    });

    const role = await prisma.role.findUnique({ where: { name: u.role } });
    if (role) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        update: {},
        create: { userId: user.id, roleId: role.id },
      });
    }
  }

  // Rooms
  const rooms = [
    { number: "101", type: "SINGLE", pricePerNight: 80000, status: "AVAILABLE" },
    { number: "102", type: "DOUBLE", pricePerNight: 120000, status: "AVAILABLE" },
    { number: "201", type: "FAMILY", pricePerNight: 180000, status: "AVAILABLE" },
    { number: "301", type: "SUITE", pricePerNight: 350000, status: "AVAILABLE" },
  ];

  for (const r of rooms) {
    await prisma.room.upsert({
      where: { number: r.number },
      update: {},
      create: r,
    });
  }

  // Dining tables
  const tables = [
    { number: 1, seats: 4 },
    { number: 2, seats: 4 },
    { number: 3, seats: 4 },
    { number: 4, seats: 4 },
    { number: 5, seats: 6 },
    { number: 6, seats: 6 },
  ];

  for (const t of tables) {
    await prisma.diningTable.upsert({
      where: { number: t.number },
      update: {},
      create: t,
    });
  }

  // Menu items (Malagasy cuisine)
  const menu = [
    { name: "Romazava", description: "Hena omby sy anamalaho", price: 15000, category: "Plat" },
    { name: "Ravitoto sy henakisoa", description: "Ravitoto voatoto miaraka amin'ny henakisoa", price: 16000, category: "Plat" },
    { name: "Henomby ritra", description: "Hena omby ritra sy vary", price: 18000, category: "Plat" },
    { name: "Salady", description: "Salady vaovao", price: 8000, category: "Entrée" },
    { name: "Mofo gasy", description: "Mofo gasy 5 pcs", price: 2500, category: "Snack" },
    { name: "Ranon'ampango", description: "Rano mafana", price: 1000, category: "Boisson" },
    { name: "THB", description: "Labiera malagasy 65cl", price: 5000, category: "Boisson" },
  ];

  for (const m of menu) {
    const existing = await prisma.menuItem.findFirst({ where: { name: m.name } });
    if (!existing) {
      await prisma.menuItem.create({ data: { ...m, available: true } });
    }
  }

  // Stock items
  const stock = [
    { name: "Vary", quantity: 120, unit: "kg", minLevel: 30, supplier: "Mpamatsy Vary" },
    { name: "Hena omby", quantity: 25, unit: "kg", minLevel: 10, supplier: "Boucherie Centrale" },
    { name: "THB (cageot)", quantity: 8, unit: "cageot", minLevel: 5, supplier: "Star Brasserie" },
    { name: "Menaka", quantity: 4, unit: "L", minLevel: 5, supplier: "Mpamatsy Menaka" },
  ];

  for (const s of stock) {
    await prisma.stockItem.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    });
  }

  console.log("✅ Seed completed successfully");
  console.log("Demo accounts (password: password123):");
  usersData.forEach((u) => console.log(`  - ${u.username} (${u.role})`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

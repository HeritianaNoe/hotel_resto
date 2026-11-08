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
    { number: "001", type: "SINGLE", pricePerNight: 80000, status: "AVAILABLE" },
    { number: "101", type: "DOUBLE", pricePerNight: 120000, status: "AVAILABLE" },
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
    { name: "Romazava", description: "Miaraka @ vary", price: 15000, category: "Plat" },
    { name: "Henakisoa sy Ravitoto", description: "Miaraka @ vary", price: 16000, category: "Plat" },
    { name: "Henomby ritra", description: "Miaraka @ vary", price: 18000, category: "Plat" },
    { name: "Lasary karaoty", description: "Vinaigrette", price: 4000, category: "Entrée" },
    { name: "Salady", description: "Vinaigrette", price: 4000, category: "Entrée" },
    { name: "Maskita", description: "5 pcs", price: 5000, category: "Snack" },
    { name: "Nem", description: "5 pcs", price: 4000, category: "Snack" },
    { name: "Sambos", description: "5 pcs", price: 4000, category: "Snack" },
    { name: "Coca-Cola", description: "1 litre", price: 5000, category: "Boisson" },
    { name: "THB", description: "65 cl", price: 5000, category: "Boisson" },
    { name: "Limonade", description: "1 litre", price: 5000, category: "Boisson" },
  ];

  for (const m of menu) {
    const existing = await prisma.menuItem.findFirst({ where: { name: m.name } });
    if (!existing) {
      await prisma.menuItem.create({ data: { ...m, available: true } });
    }
  }

  // Demo commercial data for charts (current year)
  const menuItems = await prisma.menuItem.findMany();
  const diningTables = await prisma.diningTable.findMany();
  const waiter = await prisma.user.findUnique({ where: { username: "waiter1" } });
  const cashier = await prisma.user.findUnique({ where: { username: "cashier1" } });
  const guest = await prisma.user.findUnique({ where: { username: "guest1" } });

  if (menuItems.length > 0 && diningTables.length > 0 && waiter && cashier) {
    const existingOrders = await prisma.foodOrder.count();
    if (existingOrders < 5) {
      const year = new Date().getFullYear();
      // Create sample orders + invoices across months
      const sampleMonths = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; // Jan–Oct
      for (const month of sampleMonths) {
        const ordersThisMonth = 3 + Math.floor(Math.random() * 5); // 3–7
        for (let i = 0; i < ordersThisMonth; i++) {
          const day = 1 + Math.floor(Math.random() * 27);
          const createdAt = new Date(year, month, day, 12 + Math.floor(Math.random() * 8));
          const table = diningTables[Math.floor(Math.random() * diningTables.length)];
          const order = await prisma.foodOrder.create({
            data: {
              diningTableId: table.id,
              waiterId: waiter.id,
              guestId: guest?.id ?? null,
              status: "SERVED",
              createdAt,
            },
          });

          // 1–3 items per order
          const itemCount = 1 + Math.floor(Math.random() * 3);
          let orderTotal = 0;
          const used = new Set<number>();
          for (let j = 0; j < itemCount; j++) {
            let idx = Math.floor(Math.random() * menuItems.length);
            while (used.has(idx) && used.size < menuItems.length) {
              idx = Math.floor(Math.random() * menuItems.length);
            }
            used.add(idx);
            const mi = menuItems[idx];
            const qty = 1 + Math.floor(Math.random() * 2);
            const unitPrice = Number(mi.price);
            orderTotal += unitPrice * qty;
            await prisma.orderItem.create({
              data: {
                foodOrderId: order.id,
                menuItemId: mi.id,
                quantity: qty,
                unitPrice,
              },
            });
          }

          // Invoice for this order
          await prisma.invoice.create({
            data: {
              foodOrderId: order.id,
              cashierId: cashier.id,
              amount: orderTotal,
              method: ["CASH", "CARD", "MOBILE"][Math.floor(Math.random() * 3)],
              paidAt: createdAt,
              type: "FOOD",
            },
          });
        }
      }
      console.log("📊 Demo commercial data (orders + invoices) generated for charts");
    }
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

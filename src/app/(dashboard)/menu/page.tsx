import { auth, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import { redirect } from "next/navigation";
import { MenuForm } from "./MenuForm";
import { MenuItemActions } from "./MenuItemActions";

export default async function MenuPage() {
  const session = await auth();
  if (
    !session ||
    !hasRole(session.user.roles, "ADMIN", "MANAGER", "CHEF", "WAITER")
  ) {
    redirect("/dashboard");
  }

  const items = await prisma.menuItem.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  const canEdit = hasRole(session.user.roles, "ADMIN", "MANAGER", "CHEF");

  const byCategory = items.reduce<Record<string, typeof items>>((acc, item) => {
    const cat = item.category || "Autre";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Menu</h1>
          <p className="text-slate-500">Plats et boissons</p>
        </div>
        {canEdit && <MenuForm />}
      </div>

      <div className="space-y-8">
        {Object.entries(byCategory).map(([cat, list]) => (
          <div key={cat}>
            <h2 className="mb-3 text-lg font-semibold text-teal-700">{cat}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((item) => (
                <div key={item.id.toString()} className="card flex flex-col">
                  <h3 className="font-semibold text-slate-900">{item.name}</h3>
                  {item.description && (
                    <p className="mt-1 text-sm text-slate-500">
                      {item.description}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    <p className="text-lg font-bold text-teal-700">
                      {formatMoney(item.price)}
                    </p>
                    {canEdit && (
                      <MenuItemActions
                        item={{
                          id: item.id.toString(),
                          name: item.name,
                          description: item.description,
                          price: item.price.toString(),
                          category: item.category,
                          available: item.available,
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="py-12 text-center text-slate-400">
            Aucun élément de menu
          </p>
        )}
      </div>
    </div>
  );
}

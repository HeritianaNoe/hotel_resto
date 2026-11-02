# Hotel & Resto Management

Système de gestion Hôtel + Restaurant (Next.js 15 + Prisma + PostgreSQL + NextAuth v5 / Auth.js).

## Rôles (8)

| Rôle | Accès principal |
|------|-----------------|
| **ADMIN** | Tout + gestion utilisateurs |
| **MANAGER** | Tout sauf création users |
| **RECEPTIONIST** | Efitrano, réservations |
| **WAITER** | Menu, commandes tables |
| **CHEF** | Menu, commandes (préparation), stock |
| **CASHIER** | Commandes, faktiora / paiement |
| **STOCK_KEEPER** | Stock |
| **GUEST** | Ses réservations + commandes |

## Installation

```bash
# 1. Dependencies
npm install

# 2. Configurer .env
cp .env.example .env
# Éditer DATABASE_URL et NEXTAUTH_SECRET (ou AUTH_SECRET)

# 3. Base de données (PostgreSQL doit tourner)
npx prisma db push
npm run db:seed

# 4. Lancer
npm run dev
```

Ouvrir http://localhost:3000

## Comptes demo

Mot de passe pour tous : **`password123`**

| Username | Rôle |
|----------|------|
| admin | ADMIN |
| manager1 | MANAGER |
| reception1 | RECEPTIONIST |
| waiter1 | WAITER |
| chef1 | CHEF |
| cashier1 | CASHIER |
| stock1 | STOCK_KEEPER |
| guest1 | GUEST |

## Fonctionnalités

- **Auth** : login/password (bcrypt), JWT session 8h, protection middleware + layout
- **Efitrano** : liste + création (ADMIN/MANAGER)
- **Réservation** : création (staff + guest), calcul prix auto
- **Menu** : plats malagasy (Romazava, Ravitoto…), CRUD
- **Commandes** : table + items, workflow PENDING → PREPARING → READY → SERVED → PAID
- **Faktiora** : encaissement Cash / Carte / Mobile
- **Stock** : alertes niveau minimum
- **Utilisateurs** : multi-rôles via table `user_roles`

## Structure

```
prisma/schema.prisma   # schéma
prisma/seed.ts         # données initiales
src/app/(auth)/login
src/app/(dashboard)/   # pages protégées
src/app/api/           # routes API REST + auth
src/lib/auth.ts        # NextAuth v5 (Auth.js)
src/middleware.ts      # protection routes
```

## Notes

- Les IDs sont `BigInt` (sérialisés en string côté API).
- Devise affichée : **Ar (MGA)**.
- Interface bilingue FR / Malagasy.
- NextAuth v5 (Auth.js) configuré avec Credentials provider.
"# hotel_resto" 

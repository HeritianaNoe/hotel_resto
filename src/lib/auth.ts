import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username?.toString().trim();
        const password = credentials?.password?.toString();

        if (!username || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { username },
          include: {
            roles: {
              include: { role: true },
            },
          },
        });

        if (!user || !user.enabled) {
          return null;
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          return null;
        }

        const roles = user.roles.map((ur) => ur.role.name);

        return {
          id: user.id.toString(),
          name: user.fullName || user.username,
          email: user.email,
          username: user.username,
          roles,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.roles = (user as any).roles;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).username = token.username as string;
        (session.user as any).roles = (token.roles as string[]) || [];
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  trustHost: true,
});

export function hasRole(userRoles: string[] | undefined, ...allowed: string[]) {
  if (!userRoles) return false;
  return allowed.some((r) => userRoles.includes(r));
}

export function isStaff(userRoles: string[] | undefined) {
  return hasRole(
    userRoles,
    "ADMIN",
    "MANAGER",
    "RECEPTIONIST",
    "WAITER",
    "CHEF",
    "CASHIER",
    "STOCK_KEEPER"
  );
}

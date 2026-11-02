import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    username: string;
    roles: string[];
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      username: string;
      roles: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    roles: string[];
  }
}

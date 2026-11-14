import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    username?: string;
    role: string;
    sessionVersion?: number;
  }
  interface Session {
    user: {
      id: string;
      username?: string;
      role: string;
      name?: string | null;
      email?: string | null;
      sessionVersion?: number;
    };
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    username?: string;
    role?: string;
    sessionVersion?: number;
  }
}

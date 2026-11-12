import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { normalizeEmail, permitAttempt, requestIp } from "@/lib/account/security";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "customer",
      name: "Akun Pembeli",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const email = credentials?.email ? normalizeEmail(credentials.email) : "";
        if (!email || !credentials?.password) return null;
        try {
          const ip = requestIp(request);
          const byIp = await permitAttempt("login-ip", ip, 35, 15);
          const byEmail = await permitAttempt("login-email", email, 10, 15);
          if (!byIp || !byEmail) return null;
          const account = await prisma.customerAccount.findUnique({
            where: { email }, include: { customer: true },
          });
          if (!account || !account.emailVerifiedAt ||
              !(await bcrypt.compare(credentials.password, account.passwordHash))) return null;
          return {
            id: account.customerId,
            email: account.email,
            name: account.customer.name,
            role: "customer",
            sessionVersion: account.sessionVersion,
          };
        } catch (error) {
          console.error("Buyer auth unavailable", error);
          return null; // fail closed on limiter/database outage
        }
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          // Keep the existing admin provider separate, but protect it as well.
          const ipOk = await permitAttempt("admin-login-ip", requestIp(request), 35, 15);
          const nameOk = await permitAttempt("admin-login-name", credentials.username, 10, 15);
          if (!ipOk || !nameOk) return null;
          const user = await prisma.adminUser.findUnique({
            where: { username: credentials.username },
          });

          if (!user) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password,
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            username: user.username,
            role: user.role,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.username = user.username;
        token.sessionVersion = user.sessionVersion;
      }
      // Check customer session version on every NextAuth session refresh.
      // Old tokens are demoted after password reset; owner-only APIs deny them.
      if (token.role === "customer") {
        try {
          const account = await prisma.customerAccount.findUnique({
            where: { customerId: token.sub! },
            select: { emailVerifiedAt: true, sessionVersion: true, email:true, customer:{select:{name:true}} },
          });
          if (!account?.emailVerifiedAt || token.sessionVersion !== account.sessionVersion) {
            token.role = "revoked";
          } else {
            token.name=account.customer.name;
            token.email=account.email;
          }
        } catch {
          token.role = "revoked";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.username = token.username as string;
        session.user.name=token.name;
        session.user.email=token.email;
      }
      return session;
    },
  },
};

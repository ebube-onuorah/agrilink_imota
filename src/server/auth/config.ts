// Edge-safe Auth.js base configuration.
//
// This file contains NO database or Node-only imports, so it can be loaded by
// the edge `proxy.ts` for optimistic route protection. The Credentials provider
// (which touches bcrypt + the database) lives in src/auth.ts and runs on Node.

import type { NextAuthConfig } from "next-auth";
import type { UserType } from "@/server/lib/constants";

const PROTECTED_PREFIXES = [
  "/farmer",
  "/buyer",
  "/admin",
  "/messages",
  "/transactions",
  "/notifications",
  "/account",
  "/dashboard",
  "/search",
  "/listings",
];

export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [], // real providers are injected in src/auth.ts (Node runtime)
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.userType = user.userType as UserType;
        token.fullName = (user.fullName ?? user.name ?? "") as string;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.userType = token.userType;
        session.user.name = token.fullName;
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const role = auth?.user?.userType;
      const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
      if (!needsAuth) return true;
      if (!auth) return false; // → redirect to /login
      if (pathname.startsWith("/admin") && role !== "admin") return false;
      return true;
    },
  },
} satisfies NextAuthConfig;

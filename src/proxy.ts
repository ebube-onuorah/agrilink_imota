// Next.js 16 "proxy" (formerly middleware). Runs on the edge runtime and uses
// the edge-safe Auth.js base config for optimistic role-based route protection.
// Authoritative authorization is re-checked in layouts and Server Actions.

import NextAuth from "next-auth";
import { authConfig } from "@/server/auth/config";

export default NextAuth(authConfig).auth;

export const config = {
  // Run on everything except static assets and files with an extension.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

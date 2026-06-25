import type { UserType } from "@/server/lib/constants";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      userType: UserType;
    };
  }
  interface User {
    userType?: UserType;
    fullName?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    userType: UserType;
    fullName: string;
  }
}

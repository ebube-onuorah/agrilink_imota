"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      onClick={() => {
        void signOut({ callbackUrl: "/" });
      }}
    >
      Sign out
    </button>
  );
}

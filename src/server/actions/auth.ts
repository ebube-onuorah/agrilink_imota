"use server";

// Authentication Server Actions: registration (FR-01), login, logout,
// email verification, and password reset (FR-12).

import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { getDb } from "@/server/db";
import { users, farmerProfiles, buyerProfiles } from "@/server/db/schema";
import { registerSchema, resetRequestSchema, resetSchema } from "@/server/validation/schemas";
import { sendEmail, appUrl } from "@/server/email/resend";

export type FormState = { error?: string; success?: string; fieldErrors?: Record<string, string> };

function flatten(err: import("zod").ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

// ── Registration (FR-01) ──────────────────────────────────────────────────────
export async function registerUser(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };

  const { fullName, email, phone, userType, password } = parsed.data;
  const db = await getDb();

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  if (existing.length) return { fieldErrors: { email: "An account with this email already exists" } };

  const passwordHash = await bcrypt.hash(password, 10);
  const emailEnabled = !!process.env.RESEND_API_KEY;
  const verificationToken = randomBytes(24).toString("hex");

  const [created] = await db
    .insert(users)
    .values({
      fullName,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      userType,
      isVerified: !emailEnabled, // auto-verify locally when email isn't configured
      verificationToken: emailEnabled ? verificationToken : null,
    })
    .returning();

  // Create the matching empty profile row.
  if (userType === "farmer") {
    await db.insert(farmerProfiles).values({ userId: created.id });
  } else {
    await db.insert(buyerProfiles).values({ userId: created.id });
  }

  if (emailEnabled) {
    const link = appUrl(`/verify-email?token=${verificationToken}`);
    await sendEmail({
      to: email,
      subject: "Verify your AgriLink Imota account",
      html: `<p>Welcome to AgriLink Imota, ${fullName}.</p><p>Please verify your email by clicking <a href="${link}">this link</a>.</p>`,
    });
    return { success: "Account created. Check your email to verify your account before signing in." };
  }

  return { success: "Account created. You can now sign in." };
}

// ── Login ─────────────────────────────────────────────────────────────────────
export async function authenticate(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/dashboard",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password, or your account is not yet verified." };
    }
    throw error; // re-throw redirect signals
  }
}

export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

// ── Email verification ──────────────────────────────────────────────────────
export async function verifyEmailToken(token: string): Promise<boolean> {
  if (!token) return false;
  const db = await getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.verificationToken, token))
    .limit(1);
  if (!user) return false;
  await db
    .update(users)
    .set({ isVerified: true, verificationToken: null, updatedAt: new Date() })
    .where(eq(users.id, user.id));
  return true;
}

// ── Password reset (FR-12) ──────────────────────────────────────────────────
export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };

  const db = await getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email.toLowerCase()))
    .limit(1);

  // Always report success to avoid leaking which emails are registered.
  if (user) {
    const token = randomBytes(24).toString("hex");
    const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    await db
      .update(users)
      .set({ resetToken: token, resetTokenExpiry: expiry })
      .where(eq(users.id, user.id));
    const link = appUrl(`/reset-password?token=${token}`);
    await sendEmail({
      to: user.email,
      subject: "Reset your AgriLink Imota password",
      html: `<p>Use <a href="${link}">this link</a> to reset your password. It expires in 1 hour.</p><p>If you did not request this, ignore this email.</p>`,
    });
  }
  return { success: "If an account exists for that email, a reset link has been sent." };
}

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };

  const { token, password } = parsed.data;
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.resetToken, token)).limit(1);

  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    return { error: "This reset link is invalid or has expired." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db
    .update(users)
    .set({ passwordHash, resetToken: null, resetTokenExpiry: null, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return { success: "Your password has been reset. You can now sign in." };
}

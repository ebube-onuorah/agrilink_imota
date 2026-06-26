// Email delivery via Resend. Degrades gracefully in local development: if no
// RESEND_API_KEY is configured, the message (including any action link) is
// logged to the server console instead of being sent, so flows stay testable.

import { Resend } from "resend";

type Mail = { to: string; subject: string; html: string };

export async function sendEmail({ to, subject, html }: Mail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "AgriLink Imota <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(
      `\n[email:dev] (RESEND_API_KEY not set — logging instead of sending)\n` +
        `  to:      ${to}\n  subject: ${subject}\n  body:\n${html.replace(/<[^>]+>/g, " ").trim()}\n`,
    );
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({ from, to, subject, html });
}

export function appUrl(path = ""): string {
  const base = process.env.AUTH_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}

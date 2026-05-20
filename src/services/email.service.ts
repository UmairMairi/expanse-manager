import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { logger } from "@/lib/logger";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error(
      "SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in env.",
    );
  }
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    pool: true,
    maxConnections: 3,
  });
  return transporter;
}

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
  );
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  body: ReactElement;
  attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }>;
  replyTo?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const from = process.env.EMAIL_FROM ?? process.env.SMTP_USER;
  if (!from) throw new Error("EMAIL_FROM/SMTP_USER not set");

  const html = await render(opts.body);
  const text = await render(opts.body, { plainText: true });

  try {
    const info = await getTransporter().sendMail({
      from,
      to: opts.to,
      replyTo: opts.replyTo,
      subject: opts.subject,
      html,
      text,
      attachments: opts.attachments,
    });
    logger.info({ messageId: info.messageId, to: opts.to, subject: opts.subject }, "email_sent");
  } catch (error) {
    logger.error({ error, to: opts.to, subject: opts.subject }, "email_send_failed");
    throw error;
  }
}

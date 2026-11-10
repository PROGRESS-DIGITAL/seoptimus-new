import nodemailer from "nodemailer";

export async function sendMail(to: string, subject: string, text: string) {
  const url = process.env.SMTP_URL;
  if (!url) {
    // Демо-режим: без SMTP письмо пишется в лог сервера
    console.log(`[mail] to=${to} subject="${subject}"\n${text}`);
    return;
  }
  const transport = nodemailer.createTransport(url);
  await transport.sendMail({ from: process.env.MAIL_FROM, to, subject, text });
}

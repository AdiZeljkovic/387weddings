import nodemailer, { type Transporter } from 'nodemailer';
import { pool } from './db.js';

/**
 * Inquiry notifications.
 *
 * The form used to only write to the database, so the client had to open the
 * admin to notice a new inquiry. This sends a copy to whatever address they set
 * in Admin → Postavke → Kontakt.
 *
 * SMTP credentials live in the environment, never in the admin, and the whole
 * thing is optional: with no SMTP configured nothing is sent and the submission
 * still saves. A failure here must never fail the visitor's request.
 */

type Submission = {
  name: string;
  email: string;
  phone?: string | null;
  date?: string | null;
  location?: string | null;
  guests?: string | null;
  coverage?: string | null;
  video?: string | null;
  places?: string | null;
  message?: string | null;
};

const smtpConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transport: Transporter | null = null;

const getTransport = () => {
  if (transport) return transport;
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transport;
};

const row = (label: string, value?: string | null) =>
  value ? `<tr><td style="padding:6px 16px 6px 0;color:#6b6358;white-space:nowrap">${label}</td><td style="padding:6px 0;color:#151311">${escape(value)}</td></tr>` : '';

const escape = (s: string) =>
  String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] as string));

export async function sendInquiry(s: Submission): Promise<void> {
  if (!smtpConfigured()) return;

  const { rows } = await pool.query(
    "SELECT value FROM site_settings WHERE key = 'contact_recipient'"
  );
  const to = (rows[0]?.value || '').trim();
  if (!to) return;

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:640px">
      <h2 style="font-weight:400;color:#151311">Novi upit sa sajta</h2>
      <table style="border-collapse:collapse;font-size:14px">
        ${row('Ime i prezime', s.name)}
        ${row('E-mail', s.email)}
        ${row('Telefon', s.phone)}
        ${row('Datum vjenčanja', s.date)}
        ${row('Lokacija', s.location)}
        ${row('Broj gostiju', s.guests)}
        ${row('Trajanje', s.coverage)}
        ${row('Video', s.video)}
      </table>
      ${s.places ? `<p style="font-size:14px"><strong>Mjesta fotografisanja</strong><br>${escape(s.places).replace(/\n/g, '<br>')}</p>` : ''}
      ${s.message ? `<p style="font-size:14px"><strong>Dodatne informacije</strong><br>${escape(s.message).replace(/\n/g, '<br>')}</p>` : ''}
    </div>`;

  await getTransport().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    // Hitting reply writes straight back to the couple
    replyTo: s.email,
    subject: `Novi upit — ${s.name}`,
    html,
  });
}

/**
 * The couple's own copy. Without it the only sign the message went anywhere was
 * a line on the page, which is gone as soon as they close the tab.
 *
 * The reply time quoted here has to match the site, so it is read from the same
 * CMS row the Kontakt page shows rather than written out again.
 */
export async function sendConfirmation(s: Submission): Promise<void> {
  if (!smtpConfigured() || !s.email) return;

  const { rows } = await pool.query(
    `SELECT key, value_bs FROM page_content
      WHERE key IN ('contact.form.success.title', 'contact.response.note')`
  );
  const copy: Record<string, string> = {};
  for (const r of rows) copy[r.key] = (r.value_bs || '').trim();

  const title = copy['contact.form.success.title'] || 'Hvala Vam na upitu';
  const note = copy['contact.response.note'] || 'Odgovaramo u roku od 4-8 sati.';

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;color:#151311">
      <h2 style="font-weight:400">${escape(title)}</h2>
      <p style="font-size:14px;line-height:1.7;color:#3a352f">${escape(note).replace(/\n/g, '<br>')}</p>
      <p style="font-size:13px;line-height:1.7;color:#6b6358">
        Ovo je automatska potvrda da je Vaš upit primljen. Ne treba odgovarati na ovu poruku.
      </p>
      <p style="font-size:13px;color:#6b6358">— 387 Weddings</p>
    </div>`;

  await getTransport().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: s.email,
    subject: title,
    html,
  });
}

/** Fire and forget: the visitor never waits on, or fails because of, email. */
export function sendInquiryInBackground(s: Submission): void {
  sendInquiry(s).catch(err => console.error('[mail] inquiry notification failed:', err?.message || err));
  sendConfirmation(s).catch(err => console.error('[mail] confirmation failed:', err?.message || err));
}

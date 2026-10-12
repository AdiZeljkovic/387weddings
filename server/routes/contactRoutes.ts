import { Router } from 'express';
import { pool } from '../db.js';
import { sendInquiryInBackground } from '../mailer.js';

const router = Router();

// Every field arrives as text or not at all. Anything else (an object or
// array from a crafted request) is refused: String() on such a value used to
// throw outside the try and take the whole server down.
const FIELDS: Record<string, number> = {
  name: 255, email: 255, date: 100, location: 255, message: 5000,
  phone: 50, guests: 50, coverage: 255, video: 255, places: 5000,
};

// POST /api/contact — public (main site contact form)
router.post('/', async (req, res) => {
  const body = (req.body && typeof req.body === 'object') ? req.body as Record<string, unknown> : {};

  // A field people never see. Bots fill every input; a filled one gets a
  // normal-looking success and nothing is stored or mailed — so the form
  // cannot be used to send the confirmation email to strangers.
  if (typeof body.website === 'string' && body.website.trim()) {
    res.json({ success: true });
    return;
  }

  const v: Record<string, string> = {};
  for (const [key, max] of Object.entries(FIELDS)) {
    const raw = body[key];
    if (raw === undefined || raw === null) { v[key] = ''; continue; }
    if (typeof raw !== 'string' && typeof raw !== 'number') {
      res.status(400).json({ error: 'Neispravan unos.' });
      return;
    }
    const text = String(raw).trim();
    if (text.length > max) {
      res.status(400).json({ error: 'Unos je predug.' });
      return;
    }
    v[key] = text;
  }
  const { name, email, date, location, message, phone, guests, coverage, video, places } = v;

  // Only name + email are enforced here. The form asks for more, but the
  // server stays lenient so an inquiry is never lost over a dropdown.
  if (!name || !email) {
    res.status(400).json({ error: 'Ime i email su obavezni.' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Email adresa nije ispravna.' });
    return;
  }
  try {
    await pool.query(
      `INSERT INTO contact_submissions
         (name, email, wedding_date, location, message,
          phone, guest_count, coverage, needs_video, photo_locations)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        name, email, date || null, location || null, message || null,
        phone || null, guests || null, coverage || null, video || null, places || null,
      ]
    );
    // Saved first, then notified — a mail outage must not lose the inquiry
    sendInquiryInBackground({ name, email, phone, date, location, guests, coverage, video, places, message });

    res.json({ success: true, message: 'Thank you for your inquiry. We will get back to you soon.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

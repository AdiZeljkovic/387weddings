/**
 * Migration: insert all page_content keys that were missing from the DB.
 * Safe to run multiple times — uses ON CONFLICT DO NOTHING.
 */
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// [key, label, page, section, type, en, bs, sort]
const ITEMS = [
  // ── HOME — testimonials ───────────────────────────────────────────────────
  ['home.testimonials.tag',   'Testimonials: Tag',    'home', 'testimonials', 'text',     'Kind Words',        'Lijepe Riječi',    0],
  ['home.testimonials.title', 'Testimonials: Naslov', 'home', 'testimonials', 'text',     'From Our Couples',  'Od Naših Parova',  1],
  ['home.fallback.quote',     'Fallback citat',       'home', 'testimonials', 'textarea', 'Every couple has a rhythm; every wedding has a pulse. Our mission is to find the quiet, cinematic moments that define your unique narrative.', 'Svaki par ima ritam; svako vjenčanje ima puls. Naša misija je pronaći tihe, kinematske trenutke koji definišu vaš jedinstveni narativ.', 2],

  // ── HOME — explore / about section ───────────────────────────────────────
  ['home.explore',     'Gumb: Istraži portfolio', 'home', 'intro',   'text', 'Explore the Portfolio', 'Istražite Portfolio', 5],
  ['home.about.title', 'O nama: Naslov (O / About)', 'home', 'about_section', 'text', 'About', 'O', 0],
  ['home.about.and',   'O nama: Veznik (and / i)',   'home', 'about_section', 'text', 'and',   'i',  1],
  ['home.about.cta',   'O nama: CTA gumb',           'home', 'about_section', 'text', 'Get to know us', 'Upoznajte nas', 2],

  // ── ABOUT — artists label ─────────────────────────────────────────────────
  ['about.artists', 'Oznaka: Umjetnici', 'about', 'story', 'text', 'The Artists', 'Umjetnici', 10],

  // ── ABOUT — experience / how we work ─────────────────────────────────────
  ['about.experience.tag',   'Iskustvo: Tag',    'about', 'experience', 'text', 'The Experience', 'Iskustvo',    0],
  ['about.experience.title', 'Iskustvo: Naslov', 'about', 'experience', 'text', 'How We Work',    'Kako Radimo', 1],
  ['about.step.1.title', 'Korak 1: Naslov', 'about', 'experience', 'text',     'Consultation & Planning',   'Konsultacije i planiranje', 2],
  ['about.step.1.desc',  'Korak 1: Opis',   'about', 'experience', 'textarea', 'We begin with a conversation to align our vision. Together, we\'ll plan the story, location, and scenography to ensure every detail is intentional.', 'Počinjemo razgovorom kako bismo uskladili našu viziju. Zajedno ćemo planirati priču, lokaciju i scenografiju kako bismo osigurali da svaki detalj bude namjeran.', 3],
  ['about.step.2.title', 'Korak 2: Naslov', 'about', 'experience', 'text',     'Preparation & Guidance',    'Priprema i vođenje', 4],
  ['about.step.2.desc',  'Korak 2: Opis',   'about', 'experience', 'textarea', 'Receive a curated guide on posing and styling. We provide the advice you need to feel relaxed, confident, and ready for the camera.', 'Dobijte kurirani vodič o poziranju i stilizovanju. Pružamo savjete koji su vam potrebni da se osjećate opušteno, samouvjereno i spremno za kameru.', 5],
  ['about.step.3.title', 'Korak 3: Naslov', 'about', 'experience', 'text',     'The Shoot & Experience',    'Snimanje i iskustvo', 6],
  ['about.step.3.desc',  'Korak 3: Opis',   'about', 'experience', 'textarea', 'On the day of the shoot, we bring the magic to life. We handle the logistics — including transportation to the location — so you can focus entirely on the moment.', 'Na dan snimanja, oživljavamo magiju. Mi brinemo o logistici — uključujući prevoz do lokacije — tako da se možete u potpunosti fokusirati na trenutak.', 7],
  ['about.step.4.title', 'Korak 4: Naslov', 'about', 'experience', 'text',     'Post-Production',           'Postprodukcija', 8],
  ['about.step.4.desc',  'Korak 4: Opis',   'about', 'experience', 'textarea', 'Every chosen frame undergoes a meticulous editing process to ensure a timeless aesthetic. Your final gallery is delivered via a private digital space.', 'Svaki odabrani kadar prolazi kroz pedantan proces uređivanja kako bi se osigurala bezvremenska estetika. Vaša finalna galerija se dostavlja putem privatnog digitalnog prostora.', 9],

  // ── ABOUT / PORTFOLIO — shared CTA ───────────────────────────────────────
  ['stories.ready',   'CTA: Linija 1', 'about', 'cta', 'text', 'Ready to tell',   'Spremni da ispričate', 0],
  ['stories.yourOwn', 'CTA: Linija 2', 'about', 'cta', 'text', 'your own?',       'svoju priču?',         1],
  ['stories.start',   'CTA: Gumb',     'about', 'cta', 'text', 'Start the Dialogue', 'Započnite Dijalog', 2],

  // ── PORTFOLIO ─────────────────────────────────────────────────────────────
  ['portfolio.empty',    'Prazna kategorija', 'portfolio', 'approach', 'text', 'No images in this category', 'Nema slika u ovoj kategoriji', 10],
  ['portfolio.ready',    'CTA: Linija 1',     'portfolio', 'cta',      'text', 'Ready to start',  'Spremni da započnete', 0],
  ['portfolio.dialogue', 'CTA: Linija 2',     'portfolio', 'cta',      'text', 'the dialogue?',   'dijalog?',             1],

  // ── CONTACT ───────────────────────────────────────────────────────────────
  ['contact.email.tag',  'Email oznaka',   'contact', 'connect', 'text', 'Email Us',    'Pišite nam',   5],
  ['contact.follow.tag', 'Follow oznaka',  'contact', 'connect', 'text', 'Follow',      'Pratite nas',  6],

  ['contact.form.name',              'Forma: Naziv polja Ime',       'contact', 'form', 'text', 'Your Name',       'Vaše Ime',          0],
  ['contact.form.name.placeholder',  'Forma: Placeholder Ime',       'contact', 'form', 'text', 'John & Jane',     'Ime i Prezime',     1],
  ['contact.form.email',             'Forma: Naziv polja Email',     'contact', 'form', 'text', 'Email Address',   'Email Adresa',      2],
  ['contact.form.date',              'Forma: Naziv polja Datum',     'contact', 'form', 'text', 'Wedding Date',    'Datum Vjenčanja',   3],
  ['contact.form.date.placeholder',  'Forma: Placeholder Datum',     'contact', 'form', 'text', 'June 2026',       'Juni 2026',         4],
  ['contact.form.location',          'Forma: Naziv polja Lokacija',  'contact', 'form', 'text', 'Location',        'Lokacija',          5],
  ['contact.form.location.placeholder','Forma: Placeholder Lokacija','contact', 'form', 'text', 'Sarajevo, BIH',   'Sarajevo, BIH',     6],
  ['contact.form.story',             'Forma: Naziv polja Priča',     'contact', 'form', 'text', 'Your Story',      'Vaša Priča',        7],
  ['contact.form.story.placeholder', 'Forma: Placeholder Priča',     'contact', 'form', 'textarea', 'Tell us about your vision...', 'Ispričajte nam o svojoj viziji...', 8],
  ['contact.form.submit',            'Forma: Gumb Pošalji',          'contact', 'form', 'text', 'Send Inquiry',    'Pošalji Upit',      9],
  ['contact.form.sending',           'Forma: Slanje u toku',         'contact', 'form', 'text', 'Sending...',      'Slanje...',         10],
  ['contact.form.close',             'Forma: Zatvori modal',         'contact', 'form', 'text', 'Close Window',    'Zatvori',           11],
  ['contact.form.success.title',     'Uspjeh: Naslov',               'contact', 'form', 'text', 'Thank You',       'Hvala Vam',         12],
  ['contact.form.success.desc',      'Uspjeh: Opis',                 'contact', 'form', 'textarea', 'Your message has been received. We look forward to hearing more about your story.', 'Vaša poruka je primljena. Veselimo se što ćemo čuti više o vašoj priči.', 13],
  ['contact.form.success.another',   'Uspjeh: Pošalji još jednu',    'contact', 'form', 'text', 'Send Another Message', 'Pošalji Novu Poruku', 14],
  ['contact.form.error',             'Greška: Poruka',               'contact', 'form', 'text', 'Something went wrong. Please try again later.', 'Nešto je pošlo po krivu. Molimo pokušajte ponovo.', 15],

  // ── SERVICES — journey section ────────────────────────────────────────────
  ['experience.journey.tag',   'Putovanje: Tag',    'services', 'journey', 'text', 'The Journey',        'Putovanje',            0],
  ['experience.journey.title', 'Putovanje: Naslov', 'services', 'journey', 'text', 'How we work with you', 'Kako radimo s vama', 1],
  ['experience.journey.step.1.title', 'Korak 1: Naslov', 'services', 'journey', 'text',     'Consultation & Planning',   'Konsultacije i planiranje', 2],
  ['experience.journey.step.1.desc',  'Korak 1: Opis',   'services', 'journey', 'textarea', 'We begin with a conversation to align our vision. Together, we\'ll plan the story, location, and scenography to ensure every detail is intentional.', 'Počinjemo razgovorom kako bismo uskladili našu viziju.', 3],
  ['experience.journey.step.2.title', 'Korak 2: Naslov', 'services', 'journey', 'text',     'Preparation & Guidance',    'Priprema i vođenje', 4],
  ['experience.journey.step.2.desc',  'Korak 2: Opis',   'services', 'journey', 'textarea', 'Receive a curated guide on posing and styling. We provide the advice you need to feel relaxed, confident, and ready for the camera.', 'Dobijte kurirani vodič o poziranju i stilizovanju.', 5],
  ['experience.journey.step.3.title', 'Korak 3: Naslov', 'services', 'journey', 'text',     'The Shoot & Experience',    'Snimanje i iskustvo', 6],
  ['experience.journey.step.3.desc',  'Korak 3: Opis',   'services', 'journey', 'textarea', 'On the day of the shoot, we bring the magic to life. We handle the logistics so you can focus entirely on the moment.', 'Na dan snimanja, oživljavamo magiju. Mi brinemo o logistici.', 7],
  ['experience.journey.step.4.title', 'Korak 4: Naslov', 'services', 'journey', 'text',     'Post-Production',           'Postprodukcija', 8],
  ['experience.journey.step.4.desc',  'Korak 4: Opis',   'services', 'journey', 'textarea', 'Every chosen frame undergoes a meticulous editing process to ensure a timeless aesthetic. Your final gallery is delivered via a private digital space.', 'Svaki odabrani kadar prolazi kroz pedantan proces uređivanja.', 9],

  // ── SERVICES — addons ─────────────────────────────────────────────────────
  ['experience.addons.1.title', 'Addon 1: Naslov', 'services', 'addons', 'text',     'A Personal Narrative', 'Lična Naracija', 0],
  ['experience.addons.1.desc',  'Addon 1: Opis',   'services', 'addons', 'textarea', 'Two dedicated artists (Photography & Filmmaking) capturing your day from complementary perspectives.', 'Dva posvećena umjetnika (Fotografija i Film) koji bilježe vaš dan iz komplementarnih perspektiva.', 1],
  ['experience.addons.2.title', 'Addon 2: Naslov', 'services', 'addons', 'text',     'The Blueprint',    'Plan',             2],
  ['experience.addons.2.desc',  'Addon 2: Opis',   'services', 'addons', 'textarea', 'A pre-wedding creative consultation to discuss scenography, lighting, and the flow of your story.', 'Kreativna konsultacija prije vjenčanja za diskusiju o scenografiji, osvjetljenju i toku vaše priče.', 3],
  ['experience.addons.3.title', 'Addon 3: Naslov', 'services', 'addons', 'text',     'The Experience',   'Iskustvo',         4],
  ['experience.addons.3.desc',  'Addon 3: Opis',   'services', 'addons', 'textarea', 'We handle the details — from location scouting to seamless coordination — so you can remain fully present in the moment.', 'Brinemo o detaljima — od izviđanja lokacije do besprijekorne koordinacije.', 5],
  ['experience.addons.4.title', 'Addon 4: Naslov', 'services', 'addons', 'text',     'The Travel',       'Putovanje',        6],
  ['experience.addons.4.desc',  'Addon 4: Opis',   'services', 'addons', 'textarea', 'Seamless logistics for all local and destination locations, allowing us to follow your story wherever it leads.', 'Besprijekorna logistika za sve lokalne i destinacijske lokacije.', 7],
];

const client = await pool.connect();
try {
  let inserted = 0, skipped = 0;
  for (const [key, label, page, section, type, en, bs, sort] of ITEMS) {
    const r = await client.query(
      `INSERT INTO page_content (key, label, page, section, type, value_en, value_bs, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (key) DO NOTHING`,
      [key, label, page, section, type, en, bs, sort]
    );
    if (r.rowCount > 0) { inserted++; console.log(`  ✓ ${key}`); }
    else { skipped++; }
  }
  console.log(`\nDone — ${inserted} inserted, ${skipped} already existed.`);
} finally {
  client.release();
  await pool.end();
}

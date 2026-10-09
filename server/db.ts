import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                          // max concurrent connections in the pool
  idleTimeoutMillis: 30_000,        // release idle clients after 30s
  connectionTimeoutMillis: 5_000,   // fail fast if a connection can't be acquired
  statement_timeout: 15_000,        // kill any query that runs longer than 15s
});

export async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS gallery_images (
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL,
        category VARCHAR(50) NOT NULL CHECK (category IN ('WEDDINGS', 'STUDIO', 'PORTRAITS')),
        layout VARCHAR(20) DEFAULT 'TALL',
        title VARCHAR(255),
        location VARCHAR(255),
        sort_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS layout VARCHAR(20) DEFAULT 'TALL';





      CREATE TABLE IF NOT EXISTS contact_submissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        wedding_date VARCHAR(100),
        location VARCHAR(255),
        message TEXT,
        status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived')),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Inquiry form gained six fields with the 2026 contact redesign
      ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS phone           VARCHAR(50)  DEFAULT NULL;
      ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS guest_count     VARCHAR(50)  DEFAULT NULL;
      ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS coverage        VARCHAR(255) DEFAULT NULL;
      ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS needs_video     VARCHAR(255) DEFAULT NULL;
      ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS photo_locations TEXT         DEFAULT NULL;

      -- ── Stories (one per couple) ─────────────────────────────────────────
      -- Drives the Radovi cards and the /portfolio/:slug story page. Numbering on the
      -- cards (01-09) is derived from sort_order, never stored.
      CREATE TABLE IF NOT EXISTS stories (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(160) UNIQUE NOT NULL,
        couple VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'WEDDINGS'
          CHECK (category IN ('WEDDINGS', 'STUDIO', 'PORTRAITS')),
        location VARCHAR(255),
        date_text VARCHAR(100),
        tag VARCHAR(120),
        cover_url TEXT,
        cover_alt VARCHAR(255),
        cover_layout VARCHAR(20) DEFAULT 'TALL',
        quote_bs TEXT, quote_en TEXT,
        text_bs TEXT,  text_en TEXT,
        sort_order INT DEFAULT 0,
        is_published BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- The focal point the owner clicks on the photograph. Where a frame's
      -- shape differs from the photograph's by a few percent, this is what
      -- keeps the crop off somebody's face.
      ALTER TABLE stories ADD COLUMN IF NOT EXISTS cover_focus VARCHAR(40) DEFAULT NULL;
      -- The type shown on the story ("Foto", "Foto i video"). It was one
      -- untranslated column, so the English site read "PHOTO".
      ALTER TABLE stories ADD COLUMN IF NOT EXISTS tag_bs VARCHAR(120) DEFAULT NULL;
      ALTER TABLE stories ADD COLUMN IF NOT EXISTS tag_en VARCHAR(120) DEFAULT NULL;
      UPDATE stories SET tag_bs = tag WHERE tag_bs IS NULL AND tag IS NOT NULL;
      UPDATE stories SET tag_en = tag WHERE tag_en IS NULL AND tag IS NOT NULL;

      CREATE TABLE IF NOT EXISTS story_images (
        id SERIAL PRIMARY KEY,
        story_id INT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        alt VARCHAR(255),
        caption VARCHAR(255),
        layout VARCHAR(20) DEFAULT 'TALL' CHECK (layout IN ('TALL', 'WIDE', 'SQUARE')),
        sort_order INT DEFAULT 0
      );

      ALTER TABLE story_images ADD COLUMN IF NOT EXISTS focus VARCHAR(40) DEFAULT NULL;

      -- ── Image dimensions ─────────────────────────────────────────────────
      -- Read off the file at upload time and kept, so the site can set each
      -- frame's aspect-ratio from the photograph itself. Without this the
      -- owner had to pick a shape by hand and anything that did not fit was
      -- cropped. Keyed by the stored file name, so settings images and story
      -- images both find their own dimensions.
      CREATE TABLE IF NOT EXISTS image_meta (
        file VARCHAR(255) PRIMARY KEY,
        width INT NOT NULL,
        height INT NOT NULL,
        orientation VARCHAR(10) NOT NULL
          CHECK (orientation IN ('portrait', 'landscape', 'square')),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS site_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT
      );

      CREATE TABLE IF NOT EXISTS page_content (
        id SERIAL PRIMARY KEY,
        key VARCHAR(200) UNIQUE NOT NULL,
        label VARCHAR(200) NOT NULL,
        page VARCHAR(50) NOT NULL,
        section VARCHAR(100) NOT NULL,
        type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'textarea')),
        value_en TEXT DEFAULT '',
        value_bs TEXT DEFAULT '',
        sort_order INT DEFAULT 0
      );

      ALTER TABLE page_content ADD COLUMN IF NOT EXISTS font_size   TEXT DEFAULT NULL;
      ALTER TABLE page_content ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT NULL;
      ALTER TABLE page_content ADD COLUMN IF NOT EXISTS text_color  TEXT DEFAULT NULL;
    `);

    // Seed default site settings if empty
    await client.query(`
      INSERT INTO site_settings (key, value) VALUES
        ('email', 'hello@387weddings.ba'),
        ('contact_recipient', ''),
        ('phone', '+387 61 000 000'),
        ('instagram', '#'),
        ('instagram_handle', '387.weddings'),
        ('facebook', '#'),
        ('pinterest', '#'),
        ('twitter', '#'),
        ('youtube', '#'),
        ('tiktok', '#'),
        ('coming_soon', 'false'),
        ('availability_text', 'Now booking 2025 & 2026'),
        ('location', 'Sarajevo — Worldwide'),
        ('seo.site_name', '387 Cinematic Weddings'),
        ('seo.og_image', ''),
        ('seo.home.title', 'Art in the Moments | 387 Cinematic Weddings'),
        ('seo.home.desc', 'Fine art wedding photography documenting love stories with a focus on raw emotion and timeless elegance. Based in Sarajevo, traveling worldwide.'),
        ('seo.about.title', 'About Us | 387 Cinematic Weddings'),
        ('seo.about.desc', 'Get to know Melisa and Aldin — the husband-and-wife team behind 387 Cinematic Weddings.'),
        ('seo.services.title', 'Experience | 387 Cinematic Weddings'),
        ('seo.services.desc', 'Explore our cinematic wedding photography packages. Editorial, emotional, and timeless — two artists, one story.'),
        ('seo.portfolio.title', 'Portfolio | 387 Cinematic Weddings'),
        ('seo.portfolio.desc', 'Explore our curated collection of fine art wedding stories from Sarajevo and around the world.'),
        ('seo.contact.title', 'Inquire | 387 Cinematic Weddings'),
        ('seo.contact.desc', 'Let''s connect and start the dialogue about your wedding story. Based in Sarajevo, available worldwide.'),
        ('analytics.ga_id', ''),
        ('analytics.gtm_id', ''),
        ('analytics.gsc_verification', ''),
        ('sitemap.base_url', 'https://387weddings.ba'),
        ('robots_txt', E'User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: https://387weddings.ba/sitemap.xml'),
        ('img.home.hero.1', ''), ('img.home.hero.2', ''), ('img.home.hero.3', ''),
        ('img.home.hero.4', ''), ('img.home.hero.5', ''),
        ('img.home.grid.1', ''), ('img.home.grid.2', ''), ('img.home.grid.3', ''),
        ('img.home.grid.4', ''), ('img.home.grid.5', ''), ('img.home.grid.6', ''),
        ('img.home.grid.7', ''), ('img.home.grid.8', ''), ('img.home.grid.9', ''),
        ('img.home.process.1', ''), ('img.home.process.2', ''), ('img.home.process.3', ''),
        ('img.home.team.aldin', ''), ('img.home.team.melisa', ''),
        ('img.about.hero', ''), ('img.about.story', ''),
        ('img.about.melisa', ''), ('img.about.aldin', ''),
        ('img.about.cta.1', ''), ('img.about.cta.2', ''), ('img.about.cta.3', ''),
        ('img.services.hero', ''), ('img.services.pkg.1', ''), ('img.services.pkg.2', ''),
        ('img.services.cta', ''),
        ('img.portfolio.hero', ''),
        ('img.contact.hero', ''),
        ('img.contact.ornament', ''),
        ('img.contact.hero.mobile', ''),
        ('instagram_section_tag', 'Social'),
        ('instagram_section_heading', 'Follow Our Journey'),
        ('img.instagram.1', ''), ('img.instagram.2', ''), ('img.instagram.3', ''),
        ('img.instagram.4', ''), ('img.instagram.5', ''), ('img.instagram.6', ''),
        ('img.instagram.7', ''), ('img.instagram.8', '')
      ON CONFLICT (key) DO NOTHING;
    `);

    // Content seed. Generated from the live schema so the file and the database
    // cannot drift: every key the site renders is here, and nothing else. New
    // installs get the full set; existing rows are never overwritten.
    await client.query(`
      INSERT INTO page_content (key, label, page, section, type, value_en, value_bs, sort_order) VALUES
        ('about.bio.1.tag', 'Biografija 1: Tag', 'about', 'bio', 'text', 'Behind the lens', 'Iza objektiva', 0),
        ('about.bio.1.title.part1', 'Biografija 1: Naslov linija 1', 'about', 'bio', 'text', 'Meet', 'Upoznajte', 1),
        ('about.bio.1.title.part2', 'Biografija 1: Naslov linija 2', 'about', 'bio', 'text', 'Melisa', 'Melisu', 2),
        ('about.bio.1.p1', 'Biografija 1: Paragraf 1 (prazno = sakriveno)', 'about', 'bio', 'textarea', 'Photography has been part of my life for as long as I can remember. I grew up among people who believed the most important things cannot be put into words, and somewhere in there came the need to record them in pictures.', 'Fotografija je dio mog života otkad znam za sebe. Odrasla sam među ljudima koji su vjerovali da se najvažnije stvari ne daju ispričati riječima, i negdje tu se rodila potreba da ih zabilježim slikom.', 3),
        ('about.bio.1.p2', 'Biografija 1: Paragraf 2 (prazno = sakriveno)', 'about', 'bio', 'textarea', 'Over the years I learned to be quiet at weddings. To take a step back, wait, and let the moment happen on its own. Patience became a tool as important as the camera.', 'Godinama sam učila da budem tiha na vjenčanjima. Da stanem korak unazad, sačekam i pustim da se trenutak dogodi sam. Strpljenje mi je postalo alat jednako važan kao i fotoaparat.', 4),
        ('about.bio.1.p3', 'Biografija 1: Paragraf 3 (prazno = sakriveno)', 'about', 'bio', 'textarea', 'I am not after the perfect frame but the honest one. The warmth, the joy and the love that radiate through your day, because those are the moments you will keep long after the celebration ends.', 'Ne tražim savršen kadar nego iskren. Toplinu, radost i ljubav koja zrači kroz vaš dan, jer to su trenuci koje ćete čuvati dugo nakon što proslava prođe.', 5),
        ('about.bio.2.tag', 'Biografija 2: Tag', 'about', 'bio', 'text', 'Behind our films', 'Iza kamere', 6),
        ('about.bio.2.title.part1', 'Biografija 2: Naslov linija 1', 'about', 'bio', 'text', 'Meet', 'Upoznajte', 7),
        ('about.bio.2.title.part2', 'Biografija 2: Naslov linija 2', 'about', 'bio', 'text', 'Aldin', 'Aldina', 8),
        ('about.bio.2.p1', 'Biografija 2: Paragraf 1 (prazno = sakriveno)', 'about', 'bio', 'textarea', 'Film won me over long before I ever shot a wedding. I was fascinated by the idea that a moving image can tell a story without a single word, and that led me exactly here.', 'Film me osvojio davno prije nego što sam prvi put snimao vjenčanje. Fascinirala me ideja da se pokretnom slikom može ispričati priča bez ijedne riječi, i to me je dovelo tačno ovdje.', 9),
        ('about.bio.2.p2', 'Biografija 2: Paragraf 2 (prazno = sakriveno)', 'about', 'bio', 'textarea', 'Before weddings I shot music videos and commercials. That school taught me to watch rhythm, light and detail, and I bring the same into every film we make.', 'Prije vjenčanja snimao sam muzičke spotove i reklame. Ta škola me naučila da pazim na ritam, svjetlo i detalj, a danas to isto unosim u svaki film koji napravimo.', 10),
        ('about.bio.2.p3', 'Biografija 2: Paragraf 3 (prazno = sakriveno)', 'about', 'bio', 'textarea', 'The greatest reward is when a couple plays their film a year later and feels exactly what they felt that day. A sound, a glance, someone laughing in the background: things a photograph cannot keep, but a film can.', 'Najveća nagrada mi je kada par nakon godinu dana pusti svoj film i ponovo osjeti isto što i tog dana. Zvuk, pogled, nečiji smijeh u pozadini: stvari koje fotografija ne može sačuvati, a film može.', 11),
        ('about.invite.title.part1', 'Poziv: Naslov linija 1', 'about', 'invite', 'text', 'We would love to hear', 'Želimo čuti', 0),
        ('about.invite.title.part2', 'Poziv: Naslov linija 2', 'about', 'invite', 'text', 'from you', 'vašu priču', 1),
        ('about.invite.p1', 'Poziv: Paragraf 1 (prazno = sakriveno)', 'about', 'invite', 'textarea', 'We believe the best stories begin with an honest conversation. That is why we never rush, we want to know you first.', 'Vjerujemo da najbolje priče počinju iskrenim razgovorom. Zato ne žurimo, prvo želimo upoznati vas.', 2),
        ('about.invite.p2', 'Poziv: Paragraf 2 (prazno = sakriveno)', 'about', 'invite', 'textarea', 'Write to us and tell us how you imagined your day. We reply within 24 to 48 hours.', 'Javite nam se i ispričajte kako ste zamislili svoj dan. Odgovaramo u roku od 24 do 48 sati.', 3),
        ('about.invite.button', 'Poziv: Tekst gumba', 'about', 'invite', 'text', 'Get in touch', 'Javite nam se', 4),
        ('contact.response.note', 'Napomena o odgovoru', 'contact', 'connect', 'textarea', 'We typically respond within 24-48 hours. If you haven''t heard from us, please check your spam folder or reach out via Instagram.', 'Obično odgovaramo u roku od 4-8 sati. 
Ako niste dobili odgovor, provjerite spam ili nam pišite na Instagram. ', 3),
        ('contact.group.you', 'Obrazac: Naslov grupe 1', 'contact', 'form', 'text', 'About you', 'O vama', -3),
        ('contact.group.wedding', 'Obrazac: Naslov grupe 2', 'contact', 'form', 'text', 'About the wedding', 'O vjenčanju', -2),
        ('contact.group.story', 'Obrazac: Naslov grupe 3', 'contact', 'form', 'text', 'Your story', 'Vaša priča', -1),
        ('contact.form.name', 'Forma: Naziv polja Ime', 'contact', 'form', 'text', 'Full name', 'Ime i prezime', 0),
        ('contact.form.name.placeholder', 'Forma: Placeholder Ime', 'contact', 'form', 'text', 'Enter your full name', 'Unesite vaše ime i prezime', 1),
        ('contact.form.email', 'Forma: Naziv polja Email', 'contact', 'form', 'text', 'Email address', 'E-mail adresa', 2),
        ('contact.form.date', 'Forma: Naziv polja Datum', 'contact', 'form', 'text', 'Wedding date', 'Datum vjenčanja', 3),
        ('contact.form.email.placeholder', 'Polje: E-mail — placeholder', 'contact', 'form', 'text', 'Enter your email address', 'Unesite e-mail adresu', 3),
        ('contact.form.date.placeholder', 'Forma: Placeholder Datum', 'contact', 'form', 'text', 'Choose a date', 'Odaberite datum', 4),
        ('contact.form.phone', 'Polje: Telefon — labela', 'contact', 'form', 'text', 'Phone number', 'Broj telefona', 4),
        ('contact.form.location', 'Forma: Naziv polja Lokacija', 'contact', 'form', 'text', 'Wedding location / city', 'Lokacija vjenčanja / grad', 5),
        ('contact.form.phone.placeholder', 'Polje: Telefon — placeholder', 'contact', 'form', 'text', 'Enter phone number (optional)', 'Unesite broj telefona (opciono)', 5),
        ('contact.form.location.placeholder', 'Forma: Placeholder Lokacija', 'contact', 'form', 'text', 'Enter location / city', 'Unesite lokaciju / grad', 6),
        ('contact.form.story', 'Forma: Naziv polja Priča', 'contact', 'form', 'text', 'Additional information / your story', 'Dodatne informacije / vaša priča', 7),
        ('contact.form.guests', 'Polje: Broj gostiju — labela', 'contact', 'form', 'text', 'Approximate number of guests', 'Približan broj gostiju', 8),
        ('contact.form.story.placeholder', 'Forma: Placeholder Priča', 'contact', 'form', 'textarea', 'Tell us anything else you would like us to know', 'Napišite nam sve što želite da znamo', 8),
        ('contact.form.guests.placeholder', 'Polje: Broj gostiju — placeholder', 'contact', 'form', 'text', 'Enter number of guests', 'Unesite broj gostiju', 9),
        ('contact.form.submit', 'Forma: Gumb Pošalji', 'contact', 'form', 'text', 'Send message', 'Pošalji poruku', 9),
        ('contact.form.coverage', 'Polje: Trajanje angažmana — labela', 'contact', 'form', 'text', 'Approximate length of our coverage', 'Okvirno vrijeme trajanja našeg angažmana', 10),
        ('contact.form.sending', 'Forma: Slanje u toku', 'contact', 'form', 'text', 'Sending...', 'Slanje...', 10),
        ('contact.form.close', 'Forma: Zatvori modal', 'contact', 'form', 'text', 'Close Window', 'Zatvori', 11),
        ('contact.form.coverage.placeholder', 'Polje: Trajanje angažmana — placeholder', 'contact', 'form', 'text', 'Select duration', 'Odaberite trajanje', 11),
        ('contact.form.coverage.opt.1', 'Trajanje: Opcija 1 (prazno = sakriveno)', 'contact', 'form', 'text', 'Up to 4 hours', 'Do 4 sata', 12),
        ('contact.form.success.title', 'Uspjeh: Naslov', 'contact', 'form', 'text', 'Thank You', 'Hvala Vam', 12),
        ('contact.form.coverage.opt.2', 'Trajanje: Opcija 2 (prazno = sakriveno)', 'contact', 'form', 'text', '4–8 hours', '4–8 sati', 13),
        ('contact.form.success.desc', 'Uspjeh: Opis', 'contact', 'form', 'textarea', 'Your message has been received. We look forward to hearing more about your story.', 'Vaša poruka je primljena. Veselimo se što ćemo čuti više o vašoj priči.', 13),
        ('contact.form.coverage.opt.3', 'Trajanje: Opcija 3 (prazno = sakriveno)', 'contact', 'form', 'text', '8–12 hours', '8–12 sati', 14),
        ('contact.form.success.another', 'Uspjeh: Pošalji još jednu', 'contact', 'form', 'text', 'Send Another Message', 'Pošalji Novu Poruku', 14),
        ('contact.form.coverage.opt.4', 'Trajanje: Opcija 4 (prazno = sakriveno)', 'contact', 'form', 'text', 'Full day', 'Cijeli dan', 15),
        ('contact.form.error', 'Greška: Poruka', 'contact', 'form', 'text', 'Something went wrong. Please try again later.', 'Nešto je pošlo po krivu. Molimo pokušajte ponovo.', 15),
        ('contact.form.coverage.opt.5', 'Trajanje: Opcija 5 (prazno = sakriveno)', 'contact', 'form', 'text', 'Multiple days', 'Više dana', 16),
        ('contact.form.video', 'Polje: Video — labela', 'contact', 'form', 'text', 'Do you need video?', 'Treba li vam video?', 17),
        ('contact.form.video.placeholder', 'Polje: Video — placeholder', 'contact', 'form', 'text', 'Select an option', 'Odaberite opciju', 18),
        ('contact.form.video.opt.1', 'Video: Opcija 1 (prazno = sakriveno)', 'contact', 'form', 'text', 'Yes', 'Da', 19),
        ('contact.form.video.opt.2', 'Video: Opcija 2 (prazno = sakriveno)', 'contact', 'form', 'text', 'No', 'Ne', 20),
        ('contact.form.video.opt.3', 'Video: Opcija 3 (prazno = sakriveno)', 'contact', 'form', 'text', 'Not sure yet', 'Još nisam siguran/na', 21),
        ('contact.form.places', 'Polje: Mjesta fotografisanja — labela', 'contact', 'form', 'text', 'Photo locations (if already known)', 'Mjesta fotografisanja (ako su već poznata)', 22),
        ('contact.form.places.placeholder', 'Polje: Mjesta fotografisanja — placeholder', 'contact', 'form', 'text', 'Write the locations', 'Napišite lokacije', 23),
        ('contact.form.consent', 'Obrazac: Tekst uz kvačicu (saglasnost)', 'contact', 'form', 'textarea', 'I agree that my data may be used to respond to this inquiry.', 'Prihvatam da se moji podaci koriste u svrhu odgovora na upit.', 30),
        ('contact.hero.title.part1', 'Hero: Naslov — linija 1', 'contact', 'hero', 'text', 'Tell us', 'Ispričajte nam', 2),
        ('contact.hero.title.part2', 'Hero: Naslov — linija 2', 'contact', 'hero', 'text', 'your', 'svoju', 3),
        ('contact.hero.desc', 'Hero: Opis ispod naslova', 'contact', 'hero', 'textarea', 'Fill in the form and tell us the details of your wedding. We will get back to you as soon as possible.', 'Ispunite formu i javite nam detalje o vašem vjenčanju. Javićemo vam se u najkraćem mogućem roku.', 4),
        ('contact.hero.title.part3', 'Hero: Naslov — istaknuta riječ', 'contact', 'hero', 'text', 'story', 'priču', 5),
        ('footer.tagline', 'Footer: Tagline tekst', 'footer', 'brand', 'textarea', 'We capture emotions that last when everything else has passed.', 'Zabilježimo emocije koje traju kada sve drugo prođe.', 0),
        ('footer.contact', 'Footer: Naslov kontakt kolone', 'footer', 'contact', 'text', 'Contact', 'Kontakt', 0),
        ('instagram.tag', 'Instagram blok: Tag', 'footer', 'instagram', 'text', 'More moments', 'Još trenutaka', 0),
        ('instagram.title.part1', 'Instagram blok: Naslov dio 1', 'footer', 'instagram', 'text', 'See more on', 'Pogledajte još na', 1),
        ('instagram.title.part2', 'Instagram blok: Naslov dio 2 (kurziv)', 'footer', 'instagram', 'text', 'Instagram', 'Instagramu', 2),
        ('footer.rights', 'Footer: Copyright tekst', 'footer', 'legal', 'text', 'All rights reserved.', 'Sva prava zadržana.', 0),
        ('footer.designed', 'Footer: "Dizajnirano..." tekst', 'footer', 'legal', 'text', 'Design and build', 'Dizajn i izrada', 1),
        ('footer.top', 'Footer: Tekst "Na vrh"', 'footer', 'legal', 'text', 'Back to top', 'Na vrh', 5),
        ('footer.navigation', 'Footer: Naslov navigacije', 'footer', 'nav', 'text', 'Navigation', 'Navigacija', 0),
        ('nav.home', 'Navigacija: Link "Početna"', 'footer', 'nav', 'text', 'Home', 'Početna', 0),
        ('nav.work', 'Navigacija: Link "Radovi"', 'footer', 'nav', 'text', 'Work', 'Radovi', 1),
        ('nav.experience', 'Navigacija: Link "Iskustvo"', 'footer', 'nav', 'text', 'Services', 'Usluge', 2),
        ('nav.stories', 'Navigacija: Link "O nama"', 'footer', 'nav', 'text', 'About Us', 'O nama', 3),
        ('nav.inquire', 'Navigacija: Link "Upit"', 'footer', 'nav', 'text', 'Contact', 'Kontakt', 4),
        ('footer.link.about.sub', 'Footer: Podnaslov uz "O nama"', 'footer', 'nav', 'text', 'Meet Melisa and Aldin', 'Upoznajte Melisu i Aldina', 10),
        ('footer.link.work.sub', 'Footer: Podnaslov uz "Radovi"', 'footer', 'nav', 'text', 'See our stories', 'Pogledajte naše priče', 11),
        ('footer.link.contact.sub', 'Footer: Podnaslov uz "Kontakt"', 'footer', 'nav', 'text', 'Check an available date', 'Provjerite slobodan datum', 12),
        ('home.about.cta', 'O nama: CTA gumb', 'home', 'about_section', 'text', 'Get to know us', 'Upoznajte nas', 2),
        ('home.about.desc.1', 'O nama: Paragraf 1', 'home', 'about_section', 'text', 'We have followed couples across Bosnia and the Balkans for years, and the same thing amazes us every time: how many different stories love can tell.', 'Pratimo parove kroz Bosnu i Balkan već godinama, i svaki put ista stvar nas oduševi, koliko različitih priča ljubav zna ispričati.', 2),
        ('home.about.desc.2', 'O nama: Paragraf 2', 'home', 'about_section', 'text', 'We do not like posing or stiff frames. We like the moment when nobody is pretending.', 'Ne volimo poziranje ni ukočene kadrove. Volimo trenutak kad se niko ne pretvara.', 3),
        ('home.about.desc.3', 'O nama: Paragraf 3', 'home', 'about_section', 'text', 'Every frame is intentional. Every story is unique.', 'Svaki kadar je namjeran. Svaka priča je jedinstvena.', 4),
        ('home.about.tag', 'O nama: Tag iznad naslova', 'home', 'about_section', 'text', 'About us', 'O nama', 9),
        ('home.about.heading.part1', 'O nama: Naslov — linija 1', 'home', 'about_section', 'text', 'More than photographs.', 'Više od fotografija.', 10),
        ('home.about.heading.part2', 'O nama: Naslov — linija 2', 'home', 'about_section', 'text', 'It is your story.', 'To je vaša priča.', 11),
        ('home.featured.title', 'Istaknuti radovi: Naslov sekcije', 'home', 'featured', 'text', 'Featured works', 'Istaknuti radovi', 0),
        ('home.featured.cta', 'Istaknuti radovi: Tekst gumba', 'home', 'featured', 'text', 'View more work', 'Pogledaj više radova', 1),
        ('home.featured.heading.part1', 'Istaknuti radovi: Naslov — linija 1', 'home', 'featured', 'text', 'Moments.', 'Trenuci.', 2),
        ('home.featured.heading.part2', 'Istaknuti radovi: Naslov — linija 2', 'home', 'featured', 'text', 'Emotion.', 'Emocija.', 3),
        ('home.featured.heading.part3', 'Istaknuti radovi: Naslov — linija 3', 'home', 'featured', 'text', 'Forever.', 'Zauvijek.', 4),
        ('hero.title.part1', 'Naslov: 1. linija', 'home', 'hero', 'text', 'Your story.', 'Vaša priča.', 0),
        ('hero.title.part2', 'Naslov: 2. linija (kurziv)', 'home', 'hero', 'text', 'Our art.', 'Naša umjetnost.', 1),
        ('hero.inquire', 'Gumb: Upit', 'home', 'hero', 'text', 'Inquire Now', 'Pošaljite Upit', 3),
        ('hero.portfolio', 'Gumb: Portfolio', 'home', 'hero', 'text', 'View our work', 'Pogledajte radove', 4),
        ('hero.desc', 'Hero: Kratki opis ispod naslova', 'home', 'hero', 'textarea', 'We capture the emotions that remain long after everything else has passed.', 'Zabilježimo emocije koje traju kada sve drugo prođe.', 5),
        ('home.scroll', 'Hero: Scroll indicator tekst', 'home', 'hero', 'text', 'Scroll', 'Skroluj', 10),
        ('portfolio.approach.title', 'Pristup: Tag', 'portfolio', 'approach', 'text', 'The Approach', 'Pristup', 0),
        ('portfolio.approach.desc', 'Pristup: Opis', 'portfolio', 'approach', 'textarea', 'These are the stories we have had the honour of telling: every frame, every moment, every couple. See what we make when you trust us with your day.', 'Ovo su priče koje smo imali čast ispričati, svaki kadar, svaki trenutak, svaki par. Pogledajte šta stvaramo kad nam povjerite svoj dan.', 3),
        ('portfolio.empty', 'Prazna kategorija', 'portfolio', 'approach', 'text', 'No images in this category', 'Nema slika u ovoj kategoriji', 10),
        ('portfolio.filter.all', 'Filter: Sve', 'portfolio', 'filter', 'text', 'ALL', 'SVE', 0),
        ('portfolio.filter.weddings', 'Filter: Vjenčanja', 'portfolio', 'filter', 'text', 'WEDDINGS', 'VJENČANJA', 1),
        ('portfolio.filter.studio', 'Filter: Studio', 'portfolio', 'filter', 'text', 'STUDIO', 'STUDIO', 2),
        ('portfolio.filter.portraits', 'Filter: Portreti', 'portfolio', 'filter', 'text', 'PORTRAITS', 'PORTRETI', 3),
        ('portfolio.card.wedding', 'Kartica: Oznaka "Vjenčanje"', 'portfolio', 'filter', 'text', 'Wedding', 'Vjenčanje', 10),
        ('portfolio.card.studio', 'Kartica: Oznaka "Studio"', 'portfolio', 'filter', 'text', 'Studio', 'Studio', 11),
        ('portfolio.card.portrait', 'Kartica: Oznaka "Portreti"', 'portfolio', 'filter', 'text', 'Portrait', 'Portreti', 12),
        ('portfolio.hero.tag', 'Hero: Oznaka iznad naslova', 'portfolio', 'hero', 'text', 'Work', 'Radovi', -1),
        ('portfolio.hero.title', 'Hero: Naslov', 'portfolio', 'hero', 'text', 'Stories that', 'Priče koje', 0),
        ('portfolio.hero.subtitle', 'Hero: Podnaslov', 'portfolio', 'hero', 'text', 'last', 'traju', 1),
        ('cookie.text', 'Cookie baner: Tekst', 'privacy', 'cookie', 'textarea', 'We use cookies to understand how the site is used. Analytics only runs if you agree.', 'Koristimo kolačiće da razumijemo kako se sajt koristi. Analitika se pokreće samo ako pristanete.', 0),
        ('cookie.more', 'Cookie baner: Link', 'privacy', 'cookie', 'text', 'Read more', 'Saznajte više', 1),
        ('cookie.accept', 'Cookie baner: Prihvatam', 'privacy', 'cookie', 'text', 'Accept', 'Prihvatam', 2),
        ('cookie.decline', 'Cookie baner: Odbijam', 'privacy', 'cookie', 'text', 'Decline', 'Odbijam', 3),
        ('cookie.title', 'Cookie baner: Naslov (za čitače ekrana)', 'privacy', 'cookie', 'text', 'Cookies', 'Kolačići', 4),
        ('privacy.title', 'Privatnost: Naslov', 'privacy', 'page', 'text', 'Privacy policy', 'Politika privatnosti', 0),
        ('privacy.body', 'Privatnost: Tekst (prazan red = novi pasus, red koji završava sa : = podnaslov)', 'privacy', 'page', 'textarea', '', '', 1),
        ('privacy.empty', 'Privatnost: Poruka dok tekst nije unesen', 'privacy', 'page', 'text', 'The policy text is being prepared.', 'Tekst politike je u pripremi.', 2),
        ('story.back', 'Priča: Povratni link', 'story', 'labels', 'text', 'All work', 'Svi radovi', 0),
        ('story.tag', 'Priča: Oznaka uz tekst', 'story', 'labels', 'text', 'The story', 'Priča', 1),
        ('story.prev', 'Priča: Prethodna priča', 'story', 'labels', 'text', 'Previous story', 'Prethodna priča', 2),
        ('story.next', 'Priča: Sljedeća priča', 'story', 'labels', 'text', 'Next story', 'Sljedeća priča', 3),
        ('story.close', 'Priča: Zatvori (lightbox)', 'story', 'labels', 'text', 'Close', 'Zatvori', 4)
      ON CONFLICT (key) DO NOTHING
    `);

    // Homepage redesign (client mockup) — only rewrites rows still sitting at an
    // older seed default or empty, so anything edited in the admin is preserved.
    await client.query(`
      UPDATE page_content SET value_en = 'Your story.', value_bs = 'Vaša priča.'
        WHERE key = 'hero.title.part1' AND value_bs IN ('Umjetnost u', '');
      UPDATE page_content SET value_en = 'Our art.', value_bs = 'Naša umjetnost.'
        WHERE key = 'hero.title.part2' AND value_bs IN ('Trenucima', '');
      UPDATE page_content SET value_en = 'View our work', value_bs = 'Pogledajte radove'
        WHERE key = 'hero.portfolio' AND value_bs IN ('Pogledajte Portfolio', '');
      UPDATE page_content SET value_en = 'Scroll', value_bs = 'Skroluj'
        WHERE key = 'home.scroll' AND value_bs IN ('Skrolaj za više', '');
      UPDATE page_content SET value_en = 'View more work', value_bs = 'Pogledaj više radova'
        WHERE key = 'home.featured.cta' AND value_bs IN ('Pogledajte sve radove', '');
      UPDATE page_content
        SET value_en = 'We are a team that believes the best photographs come from real emotion and honest moments. Our mission is to record your story in an authentic and timeless way.',
            value_bs = 'Mi smo tim koji vjeruje da su najbolje fotografije one nastale iz stvarnih emocija i iskrenih trenutaka. Naša misija je da vašu priču zabilježimo na autentičan i bezvremenski način.'
        WHERE key = 'home.about.desc.1'
          AND value_bs IN ('Mi smo vjenčani fotografski tim iz Bosne, bilježimo priče ljubavi diljem Balkana i dalje.', '');
      UPDATE page_content
        SET value_en = 'From the first meeting to the final photograph, we are here to give you an experience full of trust, ease and professionalism.',
            value_bs = 'Od prvog susreta do posljednje fotografije, tu smo da vam pružimo iskustvo puno povjerenja, opuštenosti i profesionalnosti.'
        WHERE key = 'home.about.desc.2'
          AND value_bs IN ('Kinematskim okom i dokumentarnim srcem pretvaramo prolazne trenutke u vječne slike.', '');
      UPDATE page_content SET value_en = 'Services', value_bs = 'Usluge'
        WHERE key = 'nav.experience' AND value_bs IN ('Iskustvo', '');
      UPDATE page_content SET value_en = 'Contact', value_bs = 'Kontakt'
        WHERE key = 'nav.inquire' AND value_bs IN ('Upit', '');
      UPDATE page_content
        SET value_en = 'We capture emotions that last when everything else has passed.',
            value_bs = 'Zabilježimo emocije koje traju kada sve drugo prođe.'
        WHERE key = 'footer.tagline'
          AND value_bs IN ('Fine-art vjenčana fotografija koja dokumentuje ljubavne priče s fokusom na sirovu emociju i bezvremensku eleganciju.', '');
      UPDATE page_content SET value_en = 'Design and build', value_bs = 'Dizajn i izrada'
        WHERE key = 'footer.designed' AND value_bs IN ('Dizajnirano s namjerom.', '');
    `);

    // Contact redesign — these rows predate the new form and were seeded with
    // older copy, so each update is guarded on the exact value it replaces.
    await client.query(`
      UPDATE page_content SET value_en = 'Full name', value_bs = 'Ime i prezime'
        WHERE key = 'contact.form.name' AND value_bs IN ('Vaše Ime', '');
      UPDATE page_content SET value_en = 'Enter your full name', value_bs = 'Unesite vaše ime i prezime'
        WHERE key = 'contact.form.name.placeholder' AND value_bs IN ('Ime i Prezime', '');
      UPDATE page_content SET value_en = 'Email address', value_bs = 'E-mail adresa'
        WHERE key = 'contact.form.email' AND value_bs IN ('Email Adresa', '');
      UPDATE page_content SET value_en = 'Wedding date', value_bs = 'Datum vjenčanja'
        WHERE key = 'contact.form.date' AND value_bs IN ('Datum Vjenčanja', '');
      UPDATE page_content SET value_en = 'Choose a date', value_bs = 'Odaberite datum'
        WHERE key = 'contact.form.date.placeholder' AND value_bs IN ('DD/MM/YYYY', '');
      UPDATE page_content SET value_en = 'Wedding location / city', value_bs = 'Lokacija vjenčanja / grad'
        WHERE key = 'contact.form.location' AND value_bs IN ('Lokacija', '');
      UPDATE page_content SET value_en = 'Enter location / city', value_bs = 'Unesite lokaciju / grad'
        WHERE key = 'contact.form.location.placeholder' AND value_bs IN ('Sarajevo, BIH', '');
      UPDATE page_content SET value_en = 'Additional information / your story', value_bs = 'Dodatne informacije / vaša priča'
        WHERE key = 'contact.form.story' AND value_bs IN ('Vaša Priča', '');
      UPDATE page_content SET value_en = 'Tell us anything else you would like us to know', value_bs = 'Napišite nam sve što želite da znamo'
        WHERE key = 'contact.form.story.placeholder' AND value_bs IN ('Ispričajte nam o svojoj viziji...', '');
      UPDATE page_content
        SET value_en = 'We have followed couples across Bosnia and the Balkans for years, and the same thing amazes us every time: how many different stories love can tell.',
            value_bs = 'Pratimo parove kroz Bosnu i Balkan već godinama, i svaki put ista stvar nas oduševi, koliko različitih priča ljubav zna ispričati.'
        WHERE key = 'home.about.desc.1'
          AND value_bs LIKE 'Mi smo tim koji vjeruje%';
      UPDATE page_content
        SET value_en = 'We do not like posing or stiff frames. We like the moment when nobody is pretending.',
            value_bs = 'Ne volimo poziranje ni ukočene kadrove. Volimo trenutak kad se niko ne pretvara.'
        WHERE key = 'home.about.desc.2'
          AND value_bs LIKE 'Od prvog susreta%';
      UPDATE page_content SET value_en = 'Stories that', value_bs = 'Priče koje'
        WHERE key = 'portfolio.hero.title' AND value_bs IN ('Radovi', 'Work', '');
      UPDATE page_content SET value_en = 'last', value_bs = 'traju'
        WHERE key = 'portfolio.hero.subtitle'
          AND value_bs IN ('Vizuelno Naslijedje', 'Vizuelno Nasljedje', 'Nas portfolio, vasa inspiracija', 'Naš portfolio, vaša inspiracija', 'A Visual Legacy', '');
      UPDATE page_content SET value_en = 'Stories that', value_bs = 'Priče koje'
        WHERE key = 'portfolio.hero.title' AND value_bs IN ('Radovi', 'Work', '');
      UPDATE page_content SET value_en = 'last', value_bs = 'traju'
        WHERE key = 'portfolio.hero.subtitle' AND value_bs IN ('Vizuelno Naslijeđe', '');
      UPDATE page_content
        SET value_en = 'These are the stories we have had the honour of telling: every frame, every moment, every couple. See what we make when you trust us with your day.',
            value_bs = 'Ovo su priče koje smo imali čast ispričati, svaki kadar, svaki trenutak, svaki par. Pogledajte šta stvaramo kad nam povjerite svoj dan.'
        WHERE key = 'portfolio.approach.desc' AND value_bs LIKE 'Od tihog iščekivanja%';
      -- The board sets one key word of this sentence in italic red. Asterisks
      -- around it are the marker the page reads, so the owner keeps control of
      -- which word it is.
      UPDATE page_content
        SET value_en = replace(value_en, 'every couple', '*every couple*'),
            value_bs = replace(value_bs, 'svaki par', '*svaki par*')
        WHERE key = 'portfolio.approach.desc'
          AND value_bs NOT LIKE '%*%' AND value_en NOT LIKE '%*%';
      UPDATE page_content SET value_en = 'Tell us', value_bs = 'Ispričajte nam'
        WHERE key = 'contact.hero.title.part1' AND value_bs IN ('Pošaljite', '');
      UPDATE page_content SET value_en = 'your', value_bs = 'svoju'
        WHERE key = 'contact.hero.title.part2' AND value_bs IN ('nam poruku', '');
      UPDATE page_content SET value_en = 'Send message', value_bs = 'Pošalji poruku'
        WHERE key = 'contact.form.submit' AND value_bs IN ('Pošalji Upit', 'Pošaljite Upit', '');
    `);

    // Update promo section to Custom Package design (only if still at seed defaults)
    await client.query(`
      UPDATE page_content
        SET value_bs = 'Prilagođeni paket', value_en = 'Custom Package'
        WHERE key = 'experience.promo.tag'
          AND value_bs IN ('Posebna promo ponuda 2026', '');
      UPDATE page_content
        SET value_bs = 'Prilagođena pokrivenost · Vjenčanja na destinacijama · Višednevni događaji · Prilagođeni albumi · Miks filma i digitalne fotografije',
            value_en = 'Custom coverage · Destination weddings · Multi-day events · Custom albums · Mix of film and digital photography'
        WHERE key = 'experience.promo.desc'
          AND value_bs IN ('Rezervišite fotografisanje vjenčanja i dobijte besplatan kinematski highlight film.', '');
    `);

    // Domain migration — the site answered on 387cinematicweddings.com while the
    // brief names 387weddings.ba as the canonical host. Each update is guarded on
    // the exact old value, so anything already corrected in the admin survives.
    await client.query(`
      UPDATE site_settings SET value = 'https://387weddings.ba'
        WHERE key = 'sitemap.base_url' AND value = 'https://387cinematicweddings.com';
      UPDATE site_settings SET value = replace(value, '387cinematicweddings.com', '387weddings.ba')
        WHERE key = 'robots_txt' AND value LIKE '%387cinematicweddings.com%';
      UPDATE site_settings SET value = 'hello@387weddings.ba'
        WHERE key = 'email' AND value = 'hello@387cinematicweddings.com';
      UPDATE site_settings SET value = '387.weddings'
        WHERE key = 'instagram_handle' AND value = '387cinematicweddings';
      UPDATE site_settings SET value = replace(value, '387cinematicweddings.com', '387weddings.ba')
        WHERE value LIKE '%387cinematicweddings.com%';
    `);

    // The Radovi cards used to fall back to gallery_images, which have no slug,
    // so nothing was clickable and every filter said WEDDINGS. Each active image
    // becomes a real story once, keeping its photo, title and category, and the
    // client edits the rest in Admin → Priče.
    await client.query(`
      INSERT INTO stories (slug, couple, category, cover_url, cover_alt, cover_layout, sort_order, is_published)
      SELECT
        'rad-' || g.id,
        COALESCE(NULLIF(btrim(g.title), ''), 'Priča ' || g.id),
        g.category,
        g.url,
        NULLIF(btrim(g.title), ''),
        COALESCE(g.layout, 'TALL'),
        g.sort_order,
        TRUE
      FROM gallery_images g
      WHERE g.is_active = TRUE
        AND NOT EXISTS (SELECT 1 FROM stories)
      ON CONFLICT (slug) DO NOTHING;

      -- the cover also becomes the story's first gallery photo
      INSERT INTO story_images (story_id, url, alt, layout, sort_order)
      SELECT s.id, s.cover_url, s.cover_alt, s.cover_layout, 0
      FROM stories s
      WHERE s.slug LIKE 'rad-%'
        AND s.cover_url IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM story_images i WHERE i.story_id = s.id);
    `);

    // Indexes for the hot public queries (filter by is_active, order by sort_order).
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_gallery_active_sort   ON gallery_images (is_active, sort_order);
      CREATE INDEX IF NOT EXISTS idx_gallery_category      ON gallery_images (category);
      CREATE INDEX IF NOT EXISTS idx_submissions_status    ON contact_submissions (status);
      CREATE INDEX IF NOT EXISTS idx_page_content_ordering ON page_content (page, section, sort_order);
      CREATE INDEX IF NOT EXISTS idx_stories_pub_sort  ON stories (is_published, sort_order);
      CREATE INDEX IF NOT EXISTS idx_stories_category  ON stories (category);
      CREATE INDEX IF NOT EXISTS idx_story_images_sort ON story_images (story_id, sort_order);
    `);

    console.log('Database initialized successfully');
  } finally {
    client.release();
  }
}

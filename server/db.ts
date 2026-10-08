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
      -- Drives the Radovi cards and the new /prica/:slug page. Numbering on the
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

      CREATE TABLE IF NOT EXISTS story_images (
        id SERIAL PRIMARY KEY,
        story_id INT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        alt VARCHAR(255),
        caption VARCHAR(255),
        layout VARCHAR(20) DEFAULT 'TALL' CHECK (layout IN ('TALL', 'WIDE', 'SQUARE')),
        sort_order INT DEFAULT 0
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

    // Seed page content if empty
    const existing = await client.query('SELECT COUNT(*) FROM page_content');
    if (parseInt(existing.rows[0].count) === 0) {
      const items = [
        // HOME — hero
        { key: 'hero.title.part1', label: 'Naslov: 1. linija', page: 'home', section: 'hero', type: 'text', en: 'Art in the', bs: 'Umjetnost u', sort: 0 },
        { key: 'hero.title.part2', label: 'Naslov: 2. linija (kurziv)', page: 'home', section: 'hero', type: 'text', en: 'Moments', bs: 'Trenucima', sort: 1 },
        { key: 'hero.location', label: 'Lokacija tagline', page: 'home', section: 'hero', type: 'text', en: 'BASED IN SARAJEVO — TRAVELING WORLDWIDE', bs: 'SARAJEVO — PUTUJEMO ŠIROM SVIJETA', sort: 2 },
        { key: 'hero.inquire', label: 'Gumb: Upit', page: 'home', section: 'hero', type: 'text', en: 'Inquire Now', bs: 'Pošaljite Upit', sort: 3 },
        { key: 'hero.portfolio', label: 'Gumb: Portfolio', page: 'home', section: 'hero', type: 'text', en: 'View Portfolio', bs: 'Pogledajte Portfolio', sort: 4 },
        // HOME — intro
        { key: 'home.intro.tag', label: 'Tag', page: 'home', section: 'intro', type: 'text', en: 'The Art of Storytelling', bs: 'Umjetnost pripovijedanja', sort: 0 },
        { key: 'home.intro.title.part1', label: 'Naslov: dio 1', page: 'home', section: 'intro', type: 'text', en: 'Fine-art,', bs: 'Fine-art,', sort: 1 },
        { key: 'home.intro.title.part2', label: 'Naslov: dio 2 (kurziv)', page: 'home', section: 'intro', type: 'text', en: 'Editorial', bs: 'Editorijalna', sort: 2 },
        { key: 'home.intro.title.part3', label: 'Naslov: dio 3', page: 'home', section: 'intro', type: 'text', en: 'Wedding Photography', bs: 'Vjenčana Fotografija', sort: 3 },
        { key: 'home.intro.desc', label: 'Opis', page: 'home', section: 'intro', type: 'textarea', en: 'Our approach is rooted in the belief that every wedding is a unique masterpiece. We blend editorial sophistication with documentary honesty to capture the quiet grandeur and fleeting magic of your most significant day.', bs: 'Naš pristup temelji se na uvjerenju da je svako vjenčanje jedinstveno remek-djelo. Spajamo editorijalnu sofisticiranost s dokumentarnom iskrenošću kako bismo zabilježili tihu raskoš i prolaznu magiju vašeg najznačajnijeg dana.', sort: 4 },
        // HOME — process
        { key: 'home.process.01.title', label: 'Korak 1: Naslov', page: 'home', section: 'process', type: 'text', en: 'We begin with your vision', bs: 'Počinjemo s vašom vizijom', sort: 0 },
        { key: 'home.process.01.tag', label: 'Korak 1: Tag', page: 'home', section: 'process', type: 'text', en: 'And our artistic style', bs: 'I našim umjetničkim stilom', sort: 1 },
        { key: 'home.process.01.desc', label: 'Korak 1: Opis', page: 'home', section: 'process', type: 'textarea', en: 'If you have ideas or specific requests, please let us know. The pre-wedding shoot is a big collaboration — whilst we are happy to direct, we also love working with couples to create truly remarkable images.', bs: 'Ako imate ideje ili specifične zahtjeve, slobodno nam javite. Fotografisanje prije vjenčanja je velika saradnja — rado usmjeravamo, ali volimo i raditi s parovima na stvaranju izvanrednih slika.', sort: 2 },
        { key: 'home.process.02.title', label: 'Korak 2: Naslov', page: 'home', section: 'process', type: 'text', en: 'You choose the location', bs: 'Vi birate lokaciju', sort: 3 },
        { key: 'home.process.02.tag', label: 'Korak 2: Tag', page: 'home', section: 'process', type: 'text', en: 'We document the moments', bs: 'Mi dokumentujemo trenutke', sort: 4 },
        { key: 'home.process.02.desc', label: 'Korak 2: Opis', page: 'home', section: 'process', type: 'textarea', en: "Often it's possible to shoot in the city and the countryside to get beautiful variation. We handle all logistics and transport, so you can focus entirely on being present.", bs: 'Često je moguće obaviti fotografisanje u gradu i na selu kako bismo dobili lijepu varijaciju. Brinemo o svoj logistici i prevozu kako biste se mogli potpuno posvetiti trenutku.', sort: 5 },
        { key: 'home.process.03.title', label: 'Korak 3: Naslov', page: 'home', section: 'process', type: 'text', en: 'We create art that lasts a lifetime', bs: 'Zajedno stvaramo umjetnost koja traje vječno', sort: 6 },
        { key: 'home.process.03.tag', label: 'Korak 3: Tag', page: 'home', section: 'process', type: 'text', en: 'Heirloom images for generations', bs: 'Naslijedne slike za generacije', sort: 7 },
        { key: 'home.process.03.desc', label: 'Korak 3: Opis', page: 'home', section: 'process', type: 'textarea', en: 'Our shoots are relaxed and filled with laughter — there are never any stiff poses. Just beautiful, natural moments and genuine connection. We often explore different locations and many couples choose to bring a change of outfit.', bs: 'Naša fotografisanja su opuštena i puna smijeha — nikada nema ukočenih poza. Samo lijepi, prirodni trenuci i iskrena veza. Često istražujemo različite lokacije, a mnogi parovi biraju i promjenu odjeće.', sort: 8 },
        { key: 'home.process.03.cta', label: 'Korak 3: CTA gumb', page: 'home', section: 'process', type: 'text', en: "Let's Connect", bs: 'Povežimo se', sort: 9 },
        // ABOUT — hero
        { key: 'about.hero.title', label: 'Hero: Naslov', page: 'about', section: 'hero', type: 'text', en: 'About Us', bs: 'O Nama', sort: 0 },
        { key: 'about.hero.subtitle', label: 'Hero: Podnaslov', page: 'about', section: 'hero', type: 'text', en: 'The Artists Behind the Lens', bs: 'Umjetnici iza objektiva', sort: 1 },
        // ABOUT — story
        { key: 'about.title', label: 'Priča: Glavni naslov', page: 'about', section: 'story', type: 'text', en: 'Hi, we are Melisa & Aldin.', bs: 'Zdravo, mi smo Melisa i Aldin.', sort: 0 },
        { key: 'about.desc.1', label: 'Priča: Paragraf 1', page: 'about', section: 'story', type: 'textarea', en: 'Partners in life and lens. As photographers and filmmakers — and husband and wife — our work is a dialogue between editorial fashion and the moving image. Inspired by emotion, we take an intentional approach to your narrative.', bs: 'Partneri u životu i iza objektiva. Kao fotografi i filmaši — i muž i žena — naš rad je dijalog između editorijalne mode i pokretne slike. Inspirisani emocijama, pristupamo vašoj priči s namjerom.', sort: 1 },
        { key: 'about.desc.2', label: 'Priča: Paragraf 2', page: 'about', section: 'story', type: 'textarea', en: 'Just a bunch of ordinary people utterly in love with creating images of love for the past 8 years. And the next images we create could be of your love.', bs: 'Samo grupa običnih ljudi zaljubljenih u stvaranje slika ljubavi proteklih 8 godina. Sljedeće slike koje stvorimo mogle bi biti vaše.', sort: 2 },
        { key: 'about.desc.3', label: 'Priča: Paragraf 3 (citat)', page: 'about', section: 'story', type: 'textarea', en: "We spend our days at other people's weddings cracking half-witty jokes and trying to capture the quiet grandeur of love. We don't just capture moments; we craft elevated imagery that resonates with the soul of your unique journey.", bs: 'Provodimo dane na vjenčanjima zbijajući šale i pokušavajući uhvatiti tihu raskoš ljubavi. Mi ne bilježimo samo trenutke; mi stvaramo uzvišene slike koje rezonuju s dušom vašeg jedinstvenog putovanja.', sort: 3 },
        // SERVICES — hero
        { key: 'experience.hero.title', label: 'Hero: Naslov', page: 'services', section: 'hero', type: 'text', en: 'Experience', bs: 'Iskustvo', sort: 0 },
        { key: 'experience.hero.subtitle', label: 'Hero: Podnaslov', page: 'services', section: 'hero', type: 'text', en: 'The Art of Cinematic Documentation', bs: 'Umjetnost filmskog dokumentovanja', sort: 1 },
        // SERVICES — intro
        { key: 'experience.intro.tag', label: 'Uvod: Tag', page: 'services', section: 'intro', type: 'text', en: 'The Experience', bs: 'Iskustvo', sort: 0 },
        { key: 'experience.intro.title.part1', label: 'Uvod: Naslov dio 1', page: 'services', section: 'intro', type: 'text', en: 'More than just', bs: 'Više od', sort: 1 },
        { key: 'experience.intro.title.part2', label: 'Uvod: Naslov dio 2 (kurziv)', page: 'services', section: 'intro', type: 'text', en: 'vendors.', bs: 'dobavljača.', sort: 2 },
        { key: 'experience.intro.desc', label: 'Uvod: Opis', page: 'services', section: 'intro', type: 'textarea', en: "When you hire us, you aren't just getting \"vendors.\" You are getting a team that works as one. We've spent years refining our silent language, knowing exactly where the other is and what they are seeing.", bs: 'Kada nas angažujete, ne dobijate samo "dobavljače". Dobijate tim koji radi kao jedno. Proveli smo godine usavršavajući naš tihi jezik, znajući tačno gdje je drugi i što vidi.', sort: 3 },
        // SERVICES — philosophy
        { key: 'experience.benefit.tag', label: 'Korist: Tag', page: 'services', section: 'philosophy', type: 'text', en: 'The Benefit', bs: 'Korist', sort: 0 },
        { key: 'experience.benefit.desc', label: 'Korist: Opis', page: 'services', section: 'philosophy', type: 'textarea', en: 'While one of us focuses on the grand, epic "hero" shot, the other is hunting for the quiet, emotional detail — the way your hand shakes, the tear your father wipes away, or the wild energy on the dance floor.', bs: 'Dok se jedan od nas fokusira na veliki, epski kadar, drugi traži tihi, emocionalni detalj — način na koji vam ruka drhti, suzu koju vaš otac briše ili divlju energiju na plesnom podiju.', sort: 1 },
        { key: 'experience.result.tag', label: 'Rezultat: Tag', page: 'services', section: 'philosophy', type: 'text', en: 'The Result', bs: 'Rezultat', sort: 2 },
        { key: 'experience.result.desc', label: 'Rezultat: Opis', page: 'services', section: 'philosophy', type: 'textarea', en: 'Your photos and your film will feel like they belong together. The same colors, the same mood, and the same soul. A cohesive visual legacy that tells your story from every angle.', bs: 'Vaše fotografije i vaš film će izgledati kao da idu zajedno. Iste boje, isto raspoloženje i ista duša. Kohezivno vizualno naslijeđe koje priča vašu priču iz svakog kuta.', sort: 3 },
        { key: 'experience.philosophy', label: 'Filozofija: Citat', page: 'services', section: 'philosophy', type: 'textarea', en: '"We believe that the most powerful images aren\'t staged; they are felt."', bs: '"Vjerujemo da najmoćnije slike nisu postavljene; one se osjećaju."', sort: 4 },
        // SERVICES — investment
        { key: 'experience.investment.tag', label: 'Investicija: Tag', page: 'services', section: 'investment', type: 'text', en: 'Investment', bs: 'Investicija', sort: 0 },
        { key: 'experience.investment.title', label: 'Investicija: Naslov', page: 'services', section: 'investment', type: 'text', en: 'Curated Collections', bs: 'Odabrane Kolekcije', sort: 1 },
        { key: 'experience.investment.availability', label: 'Dostupnost (obavijest)', page: 'services', section: 'investment', type: 'text', en: 'Limited Availability for 2026 Weddings', bs: 'Ograničena dostupnost za vjenčanja 2026.', sort: 2 },
        // SERVICES — promo
        { key: 'experience.promo.tag', label: 'Promo: Tag', page: 'services', section: 'promo', type: 'text', en: 'Special 2026 Promo', bs: 'Posebna promo ponuda 2026', sort: 0 },
        { key: 'experience.promo.desc', label: 'Promo: Opis', page: 'services', section: 'promo', type: 'textarea', en: 'Book your wedding photography and receive a complimentary cinematic highlight film.', bs: 'Rezervišite fotografisanje vjenčanja i dobijte besplatan kinematski highlight film.', sort: 1 },
        // SERVICES — faq
        { key: 'experience.faq.1.q', label: 'Pitanje 1', page: 'services', section: 'faq', type: 'text', en: 'How would you describe your artistic approach on the wedding day?', bs: 'Kako biste opisali vaš artistički pristup na dan vjenčanja?', sort: 0 },
        { key: 'experience.faq.1.a', label: 'Odgovor 1', page: 'services', section: 'faq', type: 'textarea', en: 'We describe our style as cinematic and editorial. We find the perfect balance between being discreet observers — capturing those raw, unscripted emotions — and providing intentional, high-end direction during portraits. Our goal is to make you feel like yourselves, never like you are performing for the camera.', bs: 'Naš stil opisujemo kao kinematski i editorijalni. Nalazimo savršenu ravnotežu između diskretnih promatrača i pružanja namjerne, vrhunske direkcije tokom portreta. Naš cilj je da se osjećate kao vi sami.', sort: 1 },
        { key: 'experience.faq.2.q', label: 'Pitanje 2', page: 'services', section: 'faq', type: 'text', en: 'How many artists will be present at our wedding?', bs: 'Koliko umjetnika će biti prisutno na našem vjenčanju?', sort: 2 },
        { key: 'experience.faq.2.a', label: 'Odgovor 2', page: 'services', section: 'faq', type: 'textarea', en: 'You will always have two dedicated artists with you. As a husband-and-wife team, we move in unison to ensure no moment is missed. This dual perspective allows us to capture the grand architecture of the ceremony while simultaneously focusing on the quiet, whispered details and guest reactions.', bs: 'Uvijek ćete imati dva posvećena umjetnika uz vas. Kao tim muža i žene, krećemo se unisono kako bismo osigurali da nijedan trenutak ne bude propušten.', sort: 3 },
        { key: 'experience.faq.3.q', label: 'Pitanje 3', page: 'services', section: 'faq', type: 'text', en: 'When can we expect to see our final wedding gallery?', bs: 'Kada možemo očekivati finalnu galeriju vjenčanja?', sort: 4 },
        { key: 'experience.faq.3.a', label: 'Odgovor 3', page: 'services', section: 'faq', type: 'textarea', en: 'Quality and artistry take time, but we know you are eager to relive the magic. You will receive a curated "sneak peek" collection within 48 hours of your wedding. Your complete portfolio will be delivered in approximately 6 to 8 weeks.', bs: 'Kvaliteta i umjetnost zahtijevaju vrijeme. U roku od 48 sati primit ćete "sneak peek" kolekciju, a kompletni portfolio za otprilike 6 do 8 sedmica.', sort: 5 },
        { key: 'experience.faq.4.q', label: 'Pitanje 4', page: 'services', section: 'faq', type: 'text', en: 'Do you offer travel for destination weddings?', bs: 'Nudite li putovanje za destinacijska vjenčanja?', sort: 6 },
        { key: 'experience.faq.4.a', label: 'Odgovor 4', page: 'services', section: 'faq', type: 'textarea', en: 'Absolutely. We are driven by unique stories and beautiful landscapes, and we are available for travel worldwide. We handle all our own travel logistics to ensure a seamless experience for you.', bs: 'Apsolutno. Pokreću nas jedinstvene priče i lijepi krajolici, dostupni smo za putovanje širom svijeta i brinemo o svim putnim logistikama.', sort: 7 },
        // PORTFOLIO — hero
        { key: 'portfolio.hero.title', label: 'Hero: Naslov', page: 'portfolio', section: 'hero', type: 'text', en: 'Work', bs: 'Radovi', sort: 0 },
        { key: 'portfolio.hero.subtitle', label: 'Hero: Podnaslov', page: 'portfolio', section: 'hero', type: 'text', en: 'A Visual Legacy', bs: 'Vizuelno Naslijeđe', sort: 1 },
        // PORTFOLIO — approach
        { key: 'portfolio.approach.title', label: 'Pristup: Tag', page: 'portfolio', section: 'approach', type: 'text', en: 'The Approach', bs: 'Pristup', sort: 0 },
        { key: 'portfolio.approach.heading', label: 'Pristup: Naslov', page: 'portfolio', section: 'approach', type: 'text', en: 'Preserving every', bs: 'Čuvamo svako', sort: 1 },
        { key: 'portfolio.approach.subheading', label: 'Pristup: Podnaslov', page: 'portfolio', section: 'approach', type: 'text', en: 'chapter of your story.', bs: 'poglavlje vaše priče.', sort: 2 },
        { key: 'portfolio.approach.desc', label: 'Pristup: Opis', page: 'portfolio', section: 'approach', type: 'textarea', en: 'From the quiet anticipation of the morning to the wild energy of the dance floor, we document the moments that define your celebration. Every detail, no matter how small, is a vital part of the visual legacy we create together — a timeless reminder of the love and joy that filled your day.', bs: 'Od tihog iščekivanja jutra do divlje energije plesnog podija, dokumentujemo trenutke koji definišu vašu proslavu. Svaki detalj je vitalni dio vizuelnog naslijeđa koje stvaramo zajedno.', sort: 3 },
        // CONTACT — hero
        { key: 'contact.hero.title', label: 'Hero: Naslov', page: 'contact', section: 'hero', type: 'text', en: 'Inquire', bs: 'Upit', sort: 0 },
        { key: 'contact.hero.subtitle', label: 'Hero: Podnaslov', page: 'contact', section: 'hero', type: 'text', en: "Let's create something timeless together", bs: 'Stvorimo nešto bezvremensko zajedno', sort: 1 },
        // CONTACT — connect
        { key: 'home.about.cta', label: 'O nama: CTA gumb', page: 'home', section: 'about_section', type: 'text', en: 'Get to know us', bs: 'Upoznajte nas', sort: 0 },
        { key: 'contact.connect.tag', label: 'Kontakt: Tag', page: 'contact', section: 'connect', type: 'text', en: 'Inquiries', bs: 'Upiti', sort: 0 },
        { key: 'contact.connect.title.part1', label: 'Kontakt: Naslov dio 1', page: 'contact', section: 'connect', type: 'text', en: "Let's", bs: 'Započnimo', sort: 1 },
        { key: 'contact.connect.title.part2', label: 'Kontakt: Naslov dio 2 (kurziv)', page: 'contact', section: 'connect', type: 'text', en: 'Connect', bs: 'Dijalog', sort: 2 },
        { key: 'contact.response.note', label: 'Napomena o odgovoru', page: 'contact', section: 'connect', type: 'textarea', en: "We typically respond within 24-48 hours. If you haven't heard from us, please check your spam folder or reach out via Instagram.", bs: 'Obično odgovaramo u roku od 24-48 sati. Ako niste dobili odgovor, provjerite spam ili nam pišite na Instagram.', sort: 3 },
        { key: 'contact.note.tag', label: 'Napomena: Tag oznaka', page: 'contact', section: 'connect', type: 'text', en: 'Note', bs: 'Napomena', sort: 10 },
      ];
      for (const item of items) {
        await client.query(
          `INSERT INTO page_content (key, label, page, section, type, value_en, value_bs, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (key) DO NOTHING`,
          [item.key, item.label, item.page, item.section, item.type, item.en, item.bs, item.sort]
        );
      }
    }

    // Migration-safe: insert new page_content keys that may not exist on older installs
    await client.query(`
      INSERT INTO page_content (key, label, page, section, type, value_en, value_bs, sort_order) VALUES
        ('contact.form.submit',    'Gumb: Pošaljite upit',                               'contact', 'form',       'text',     'Send Your Inquiry',                                                                                       'Pošaljite Upit',                                                                                                 0),
        ('portfolio.filter.all',       'Filter: Sve',                  'portfolio', 'filter', 'text', 'ALL',                             'SVE',                               0),
        ('portfolio.filter.weddings',  'Filter: Vjenčanja',            'portfolio', 'filter', 'text', 'WEDDINGS',                        'VJENČANJA',                         1),
        ('portfolio.filter.studio',    'Filter: Studio',               'portfolio', 'filter', 'text', 'STUDIO',                          'STUDIO',                            2),
        ('portfolio.filter.portraits', 'Filter: Portreti',             'portfolio', 'filter', 'text', 'PORTRAITS',                       'PORTRETI',                          3),
        ('portfolio.empty',            'Prazna galerija — poruka',     'portfolio', 'filter', 'text', 'No images in this category yet.', 'Nema slika u ovoj kategoriji.',     4),
        ('home.scroll',                'Hero: Scroll indicator tekst',     'home', 'hero',         'text', 'Scroll to explore',               'Skrolaj za više',                   10),
        ('home.about.desc.1',          'O nama: Paragraf 1',               'home', 'about_section','text', 'We are wedding photographers based in Bosnia, capturing love stories across the Balkans and beyond.', 'Mi smo vjenčani fotografski tim iz Bosne, bilježimo priče ljubavi diljem Balkana i dalje.', 2),
        ('home.about.desc.2',          'O nama: Paragraf 2',               'home', 'about_section','text', 'With a cinematic eye and a documentary heart, we turn fleeting moments into timeless imagery.', 'Kinematskim okom i dokumentarnim srcem pretvaramo prolazne trenutke u vječne slike.', 3),
        ('home.about.desc.3',          'O nama: Paragraf 3',               'home', 'about_section','text', 'Every frame is intentional. Every story is unique.',  'Svaki kadar je namjeran. Svaka priča je jedinstvena.', 4),
        ('footer.tagline',   'Footer: Tagline tekst',          'footer', 'brand', 'textarea', 'Fine art wedding photography documenting love stories with a focus on raw emotion and timeless elegance.', 'Fine-art vjenčana fotografija koja dokumentuje ljubavne priče s fokusom na sirovu emociju i bezvremensku eleganciju.', 0),
        ('footer.navigation','Footer: Naslov navigacije',      'footer', 'nav',   'text',     'Navigation',          'Navigacija',           0),
        ('footer.rights',    'Footer: Copyright tekst',        'footer', 'legal', 'text',     'All rights reserved.','Sva prava zadržana.',  0),
        ('footer.designed',  'Footer: "Dizajnirano..." tekst', 'footer', 'legal', 'text',     'Designed with intention.', 'Dizajnirano s namjerom.', 1),
        ('nav.work',         'Navigacija: Link "Radovi"',      'footer', 'nav',   'text',     'Work',                'Radovi',               1),
        ('nav.experience',   'Navigacija: Link "Iskustvo"',    'footer', 'nav',   'text',     'Experience',          'Iskustvo',             2),
        ('nav.stories',      'Navigacija: Link "O nama"',      'footer', 'nav',   'text',     'About Us',            'O nama',               3),
        ('nav.inquire',      'Navigacija: Link "Upit"',        'footer', 'nav',   'text',     'Inquire',             'Upit',                 4),
        ('hero.desc', 'Hero: Kratki opis ispod naslova', 'home', 'hero', 'textarea',
         'We capture the emotions that remain long after everything else has passed.',
         'Zabilježimo emocije koje traju kada sve drugo prođe.', 5)
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
        WHERE key = 'portfolio.hero.subtitle' AND value_bs IN ('Vizuelno Naslijeđe', '');
      UPDATE page_content
        SET value_en = 'These are the stories we have had the honour of telling: every frame, every moment, every couple. See what we make when you trust us with your day.',
            value_bs = 'Ovo su priče koje smo imali čast ispričati, svaki kadar, svaki trenutak, svaki par. Pogledajte šta stvaramo kad nam povjerite svoj dan.'
        WHERE key = 'portfolio.approach.desc' AND value_bs LIKE 'Od tihog iščekivanja%';
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

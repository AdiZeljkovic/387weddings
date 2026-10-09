-- Postavke uklonjene iz admina (grupa 4), 2026-10-09
-- Vrati ih ovim INSERTom ako zatreba.

INSERT INTO site_settings (key, value) VALUES ('availability_text', 'Now booking 2025 & 2026') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('facebook', '#') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('pinterest', '#') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('seo.services.desc', 'Explore our cinematic wedding photography packages. Editorial, emotional, and timeless — two artists, one story.') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('seo.services.desc.bs', 'Pogledajte naše pakete vjenčane fotografije i filma. Dva posvećena umjetnika za vaš poseban dan. Rezervirajte za 2026. vjenčanja u BiH i inostranstvu.') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('seo.services.desc.en', 'Explore our cinematic wedding photography & film packages. Two dedicated artists, one wedding day. Booking 2026 weddings in Sarajevo & worldwide. Limited availability.') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('seo.services.title', 'Experience | 387 Cinematic Weddings') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('seo.services.title.bs', 'Paketi Fotografije Vjenčanja Sarajevo | 387 Cinematic') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('seo.services.title.en', 'Wedding Photography Packages Sarajevo | 387 Cinematic') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('tiktok', '#') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('twitter', '#') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('youtube', '#') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Slotovi slika za sekcije koje sajt vise nema (provjera po maketi)
INSERT INTO site_settings (key, value) VALUES ('img.about.hero', '/uploads/1776326286748-309811983.jpg') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('img.contact.ornament', '') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('img.home.process.1', '/uploads/1776326299436-552409690.jpg') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('img.home.process.2', '/uploads/1776326301012-448451730.jpg') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('img.home.process.3', '/uploads/1776326302360-311487280.jpg') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('img.portfolio.hero', '') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Instagram admin stranica, /services i stari About slotovi
INSERT INTO site_settings (key, value) VALUES ('img.about.story', '/uploads/1776326204975-191808164.jpg') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('img.instagram.1', '') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('img.instagram.2', '') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('img.instagram.3', '') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('img.instagram.4', '') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('img.instagram.5', '') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('img.instagram.6', '') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('img.instagram.7', '') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('img.instagram.8', '') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('img.services.cta', '') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('img.services.hero', '') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('img.services.pkg.1', '') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('img.services.pkg.2', '') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('instagram_section_heading', 'Follow Our Journey') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('instagram_section_tag', 'Social') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

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

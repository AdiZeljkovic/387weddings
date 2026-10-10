-- Mozaik (9 slika) i stara fotografija O nama na pocetnoj, prije zamjene lepezom i hrpom
INSERT INTO site_settings (key, value) VALUES ('img.home.grid.1', '/uploads/1776326304656-117104188.jpg') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('img.home.grid.2', '/uploads/1776326306028-517578225.jpg') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('img.home.grid.3', '/uploads/1776326307577-967633657.jpg') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('img.home.grid.4', '/uploads/1776326309059-651345472.jpg') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('img.home.grid.5', '/uploads/1776326310602-548551901.jpg') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('img.home.grid.6', '/uploads/1776326312636-237365495.jpg') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('img.home.grid.7', '/uploads/1776326314288-754193955.jpg') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('img.home.grid.8', '/uploads/1776326316543-512718379.jpg') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('img.home.grid.9', '/uploads/1776326318402-887196378.jpg') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('img.home.team.aldin', '/uploads/1776326293404-928903420.jpg') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('img.home.team.melisa', '/uploads/1776326296784-224699927.png') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

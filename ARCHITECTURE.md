# 387 Cinematic Weddings — Arhitektonska mapa

> Detaljna mapa projekta: kako je šta napravljeno, gdje je šta postavljeno, sa čim je šta povezano.
> Generisano 2026-07-25 kao priprema za veće izmjene.

---

## 1. Tehnološki stack

| Sloj | Tehnologija |
|---|---|
| Frontend | React 19, React Router 7 (`BrowserRouter`), Tailwind CSS **v4** (CSS-first `@theme`, bez config fajla), `motion` (Framer Motion 12, import iz `motion/react`), `lucide-react` |
| Backend | Express 4 (TypeScript preko `tsx`), jedan proces servira i API i frontend |
| Baza | PostgreSQL (`pg` Pool), baza `art_studio`, port 5432 |
| Build | Vite 6 — u dev modu radi kao middleware unutar Express-a; u produkciji (`NODE_ENV=production`) servira se statični `dist/` |
| Auth | JWT u `httpOnly` cookie `admin_token` (7 dana), bcryptjs hash |
| Slike | multer (10MB limit) → sharp (resize 1920, webp q82) → `uploads/` folder |

**Pokretanje:** `npm run dev` → `tsx server.ts` na portu 3000. Health: `/api/health`.

---

## 2. Big picture — tok podataka

```
                    ┌─────────────────────────────────────────┐
                    │              PostgreSQL                 │
                    │  admin_users, gallery_images, packages, │
                    │  testimonials, contact_submissions,     │
                    │  site_settings, page_content            │
                    └───────────────┬─────────────────────────┘
                                    │ server/db.ts (Pool + initDB migracije/seed)
                    ┌───────────────┴─────────────────────────┐
                    │       Express (server.ts)               │
                    │  helmet(CSP) → cors → compression →     │
                    │  json → cookies → /uploads static →     │
                    │  /api/* rute → sitemap/robots →         │
                    │  Vite middleware (dev) / dist (prod)    │
                    └───────────────┬─────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │ JAVNI SAJT                │                ADMIN PANEL │
        │ /api/settings ──► settingsCache.ts (singleton)        │
        │ /api/content  ──► LanguageContext (t() + stilovi)     │
        │ /api/gallery  ──► Portfolio    /api/*/all + CRUD      │
        │ /api/packages ──► Services     /api/auth/* (JWT)      │
        │ /api/contact  ──► Contact      /api/gallery/upload    │
        └───────────────────────────────────────────────────────┘
```

**TRI paralelna izvora sadržaja** (ključno za razumijevanje):
1. **`page_content`** — CMS tekstovi + tipografija (font/boja/veličina). Frontend: `t(key)` + `getContentStyle(key)` iz `LanguageContext`. Admin: **PagesManager** (`/admin/pages`).
2. **`site_settings`** — key-value: slike (`img.*`), social linkovi, SEO (`seo.*`), analytics, `coming_soon`, Instagram sekcija. Frontend: `loadSettings()` iz `settingsCache.ts`. Admin: **AdminSettings, ImagesManager, InstagramManager**.
3. **Domenske tabele** — `gallery_images`, `packages`, `testimonials`, `contact_submissions`. Direktan fetch po stranici, bez keša.

---

## 3. Backend — server.ts i rute

### Middleware pipeline (redoslijed)
`helmet` (eksplicitan CSP u prod: Google Fonts/GTM/GA/Unsplash allowlist) → `cors` (prod: `SITE_URL`; dev: localhost 3000/5173) → `compression` → `express.json({limit:'2mb'})` → `cookieParser` → `/uploads` static (`maxAge 1y, immutable`) → `initDB()` → `/api/health` → API rute → `seoRoutes` (sitemap.xml, robots.txt iz baze) → Vite middleware (dev) ili `dist/` + SPA fallback (prod). Graceful shutdown na SIGTERM/SIGINT.

### Rate limiti
- `/api/auth/*`: **10 / 15 min** po IP-u
- `/api/contact`: **5 / 15 min** po IP-u

### Rute (server/routes/)

| Fajl | Javne rute | Admin rute (requireAuth) |
|---|---|---|
| `authRoutes.ts` | `POST /login`, `POST /logout`, `POST /setup` (samo `ALLOW_SETUP=true` + nema admina) | `GET /me` |
| `galleryRoutes.ts` | `GET /api/gallery` (cache 60s) | `GET /all`, `POST`, `PUT /:id`, `DELETE /:id`, `POST /upload` (multer→sharp→webp; neispravna slika se briše i odbija) |
| `packageRoutes.ts` | `GET /api/packages` (cache 60s) | `GET /all`, `POST`, `PUT /:id`, `DELETE /:id` — piše i legacy (`name`) i lokalizovane kolone (`name_en/bs`...) |
| `testimonialRoutes.ts` | `GET /api/testimonials` (cache 60s) | `GET /all`, `POST`, `PUT /:id`, `DELETE /:id` |
| `contactRoutes.ts` | `POST /api/contact` (validacija email + dužine) | — |
| `submissionRoutes.ts` | — | `GET`, `PUT /:id` (samo status new/read/archived), `DELETE /:id` |
| `settingsRoutes.ts` | `GET /api/settings` (cache 60s) | `PUT` (bulk upsert u transakciji), `GET /stats` (dashboard brojači) |
| `contentRoutes.ts` | `GET /api/content` (cache 60s) | `GET /admin` (puni redovi), `POST /bulk` (unnest UPDATE u transakciji — **update-only, ne insertuje nove ključeve**), `PUT /:key` (UI ga ne koristi) |
| `seoRoutes.ts` | `GET /sitemap.xml`, `GET /robots.txt` (iz `site_settings`, cache 1h) | — |

### Baza (server/db.ts)
- Pool: `max 10`, `connectionTimeoutMillis 5s`, `statement_timeout 15s`.
- `initDB()`: CREATE TABLE IF NOT EXISTS + ALTER ADD COLUMN migracije + seed `site_settings` (~70 ključeva) + seed `page_content` (~150 ključeva EN/BS) + indeksi (`is_active/sort_order`, `category`, `status`, `page/section/sort_order`).
- SQL svuda parametrizovan.

### Tabele

| Tabela | Ključna polja |
|---|---|
| `admin_users` | username, password_hash (bcrypt 12) |
| `gallery_images` | url, category (`WEDDINGS\|STUDIO\|PORTRAITS` CHECK), layout (`TALL\|WIDE\|SQUARE`), title, location, sort_order, is_active |
| `packages` | name/price/description/features (**legacy**) + `name_en/bs`, `description_en/bs`, `features_en/bs` (JSONB) + `name_color`, `name_font_size`, `features_font_size`, is_featured, is_active, sort_order |
| `testimonials` | client_name, text, location, wedding_date (slobodan tekst), is_active, sort_order — **jednojezično** |
| `contact_submissions` | name, email, wedding_date, location, message, status (`new\|read\|archived` CHECK) |
| `site_settings` | key (PK) / value — flat key-value |
| `page_content` | key (UNIQUE), label, page, section, type (`text\|textarea`), value_en, value_bs, sort_order, font_size, font_family, text_color |

---

## 4. Frontend — rutiranje (src/App.tsx)

Provideri (izvana ka unutra): `ErrorBoundary → AuthProvider → LanguageProvider → Router → AnalyticsInjector + ScrollToTop → Routes`.

| Ruta | Komponenta | Napomena |
|---|---|---|
| `/` | `Home` | |
| `/portfolio` | `Portfolio` | |
| `/services` | `Services.tsx` (eksport **`Experience`**) | |
| `/about` | `About` | |
| `/contact` | `Contact` | |
| `*` | `NotFound` | unutar public layouta |
| `/admin/login` | `Login` | van ProtectedRoute |
| `/admin/*` | `ProtectedRoute → AdminLayout` → Dashboard, `/pages`, `/images`, `/instagram`, `/gallery`, `/packages`, `/testimonials`, `/submissions`, `/settings` | |

- Sve stranice `React.lazy` + `Suspense`. **Nema route parametara** — sve statične rute; Portfolio nema detail stranicu.
- Public layout: `ComingSoonGate → .grain → Navbar → main → InstagramFeed → Footer → BackToTop` — **InstagramFeed + Footer su na SVIM javnim stranicama** uklj. 404.
- `PageMetadata` (per-ruta): postavlja title/meta/OG/canonical iz settings ključeva `seo.{page}.title|desc[.{en|bs}]`; fallback je hardkodiran EN string u App.tsx.
- `AnalyticsInjector`: `requestIdleCallback` → GA4/GTM/GSC iz `analytics.*` (regex-validirani ID-jevi).
- `ComingSoonGate`: `coming_soon === 'true'` → posjetioci vide ComingSoon; ulogovani admin puni sajt + banner.

---

## 5. CMS mehanizam — LanguageContext (jezgro)

- **Jezik**: `'ENG' | 'BOS'`, default `BOS`, perzistira u `localStorage['387_language']`. Prekidač **samo u Navbaru**. Nema URL prefiksa, nema `hreflang`, nema `<html lang>` sync — jedna URL adresa za oba jezika (SEO ograničenje).
- **`t(key)` rezolucija** (4 nivoa): DB `value_en/bs` (ako neprazan) → hardkodirani `translations[language]` (~200 ključeva po jeziku, inline u fajlu, linije 13–399) → `translations['ENG']` → **sam ključ** (⚠️ uzrok bugova: `t(x) || fallback` nikad ne pada na fallback).
- **`getContentStyle(key)`** → `{fontSize, fontFamily, color}` iz `page_content` kolona; `fontFamily` token se mapira kroz `FONT_FAMILIES = {serif: Cormorant Garamond, sans: Montserrat, script: Caveat}`. Stilovi jezično neutralni. **Pravilo projekta: svaki content element mora imati i `t(key)` i `getContentStyle(key)`.**
- **Content cache**: module-level `_contentCache` + shared promise; `reloadContent()` = invalidate + refetch + re-apply → poziva ga samo PagesManager nakon save-a (jedina prava live-propagacija u UI).
- Promjena jezika je čist client-side re-render (content nosi oba jezika).
- Paketi u Services.tsx **zaobilaze `t()`** — ručni `language === 'ENG' ? name_en : name_bs`.

### settingsCache.ts
Isti singleton pattern za `site_settings`. `invalidateSettingsCache()` samo briše keš — **nema pretplatnika**, već montirane komponente se ne osvježe (vidljivo tek na sljedećoj navigaciji).

---

## 6. Javne stranice — šta koja koristi

| Stranica | API | Settings ključevi | CMS prefiksi | Sekcije |
|---|---|---|---|---|
| **Home** | settings | `img.home.hero.1-5`, `img.home.hero.mobile.1-5`, `img.home.grid.1-9`, `img.home.process.1-3`, `img.home.team.*`, `email`, `phone` | `hero.*`, `home.scroll`, `home.intro.*`, `home.explore`, `home.process.01-03.*`, `home.about.*`, `contact.response.note` | Hero slider (6s cross-fade, desktop/mobile set po `innerWidth<1024`) → Intro → Grid 3×3 → Process (3 koraka, ICON_MAP) → About (2 portreta + kontakt) |
| **About** | settings | `img.about.hero`, `img.about.story` | `about.hero.*`, `about.artists`, `about.title`, `about.desc.1-3`, `about.experience.*`, `about.step.1-4.*`, `stories.*` | Hero (parallax `useScroll`) → Story (drop-cap) → Process 4 koraka → CTA |
| **Services** | settings + `GET /api/packages` | `img.services.hero`, `img.services.pkg.1-2`, `img.services.cta` | `experience.*` (hero, intro, benefit, result, journey.step.1-4, philosophy, investment, package, promo, addons.1-4, faq.1-4, cta) | Hero → Intro → Benefit/Result → Journey → Philosophy → **Paketi** (featured=tamna kartica; per-paket stilovi iz baze; valuta `KM` fiksna) → Promo → Add-ons → FAQ → CTA |
| **Portfolio** | settings + `GET /api/gallery` | `img.portfolio.hero` | `portfolio.*` (hero, approach, filter, empty, ready, dialogue, cta) | Hero → Approach → Filter (klijentski, kategorije fiksne u kodu) → Grid 12-col `grid-flow-dense` (layout WIDE/TALL/SQUARE iz baze) → CTA. Bez paginacije/lightboxa |
| **Contact** | settings + `POST /api/contact` | `img.contact.hero`, social linkovi | `contact.*` (hero, connect, form.*, follow, note) | Success modal → Hero → Forma (status mašina idle/submitting/success/error; date input text→date trik) → Social → Napomena |
| **ComingSoon** | settings | `instagram`, `facebook`, `instagram_handle` | **NIŠTA — sav tekst hardkodiran, samo BS**; postavlja `noindex` meta | |
| **NotFound** | — | — | `notfound.*` (bez getContentStyle) | |

### Komponente
- **Navbar**: settings `email`; CMS `nav.*`; scroll state >50px; jezik switcher; mobilni full-screen overlay. ⚠️ Detekcija jezika preko `t('footer.navigation') === 'Navigation'`.
- **Footer**: social linkovi (filtrirani `!== '#'`); CMS `footer.*`, `nav.*`.
- **InstagramFeed**: `img.instagram.1-8`, `instagram`, `instagram_handle`, `instagram_section_tag/heading` — ⚠️ naslov sekcije ide kroz **settings**, ne kroz content; slike bez `loading="lazy"`; nema pravog IG API-ja.
- **BackToTop** (scroll >500px), **ScrollToTop** (scroll na 0 pri promjeni rute, važi i za admin).

### Dizajn sistem (src/index.css, Tailwind v4 `@theme`)
- Palete: **`gold-*`** (50–950, brand `#a6865d`/600), **`moody-*`** (neutralna, 950 tamne sekcije), `sage-*` (koristi se samo 1×).
- Fontovi: Cormorant Garamond (naslovi, globalno `h1-h6 font-serif font-light`), Montserrat (body), Caveat (script/logo).
- Klase: `.grain` (SVG noise, z-9999 — renderuje se višestruko), `.editorial-grid` (12 col), `.premium-border`, `.luxury-text-sm/base`, `.no-scrollbar`.
- Univerzalni easing `[0.16,1,0.3,1]`; `motion` sa `whileInView + viewport:{once:true}`.

---

## 7. Admin panel

### AuthContext
- Mount: `GET /api/auth/me` (credentials include) → `admin` state.
- Login: `POST /api/auth/login` → cookie; ⚠️ klijentski `id` hardkodiran na 0 do reloada.
- ⚠️ Nema globalnog 401 interceptora — istekao token ne redirectuje na login.

### AdminLayout — sidebar (9 stavki)
Dashboard → Stranice (`/pages`) → Fotografije (`/images`) → Instagram → Galerija → Paketi → Recenzije → Upiti → Postavke. Desktop fiksni sidebar + mobilni overlay. ⚠️ `Sidebar` definisan unutar komponente (remount na svaki render).

### Stranice

| Admin stranica | Entitet | API | Keš efekat |
|---|---|---|---|
| **Dashboard** | statistika | `GET /api/settings/stats` | — |
| **PagesManager** | `page_content` | `GET /api/content/admin`, `POST /api/content/bulk` | **`reloadContent()`** → live propagacija ✓ |
| **ImagesManager** | `site_settings` `img.*` | `GET/PUT /api/settings` (filter `img.`), upload preko `/api/gallery/upload` | `invalidateSettingsCache()` |
| **InstagramManager** | settings whitelist (`instagram*`, `img.instagram.1-8`) | isto | `invalidateSettingsCache()` |
| **GalleryManager** | `gallery_images` | full CRUD + upload (30s abort) | — (refetch liste) |
| **PackagesManager** | `packages` (dvojezično + stilovi) | full CRUD | — |
| **TestimonialsManager** | `testimonials` | full CRUD | — |
| **Submissions** | `contact_submissions` | GET, PUT status, DELETE; auto-mark-read pri otvaranju | — |
| **AdminSettings** | `site_settings` (5 tabova: contact/general/social/seo/technical) | `GET/PUT /api/settings` (**cijeli objekat**) | `invalidateSettingsCache()` |

- UX pattern svugdje: inline forma iznad liste (ne modal), load-after-mutate (puni refetch), skeleton + empty states.
- PagesManager: tabovi po stranici → akordeon sekcije → ENG/BOS input + tipografski red (font toggle, size 12–128px, color preseti + hex) → "Sačuvaj sekciju" po sekciji.
- Katalozi hardkodirani u kodu: `SECTIONS` (ImagesManager), `PAGE_LABELS/SECTION_LABELS/SECTION_ORDER` (PagesManager).

---

## 8. Poznati problemi / dugovi (stanje prije velikih izmjena)

### Bugovi
1. `t()` vraća ključ za nepostojeći unos → svi `t(x) || fallback` i `{t(x) && ...}` uslovi neispravni (promo sekcija u Services se uvijek renderuje; `experience.package.starting_at` vs `.starting` neusklađen ključ).
2. Home hero: `<img src={undefined}>` + `% 0 = NaN` dok se settings ne učitaju.
3. `.split('.')[0]` na CMS tekstovima (Home) — puca na skraćenicama.
4. Navbar jezik-detekcija poređenjem prevoda.
5. Contact: dvostruki success UI (modal + inline).
6. Submissions: auto-mark-read side-effect unutar state updatera (StrictMode double-invoke rizik).
7. Login: redirect u toku rendera umjesto `<Navigate>`.

### Duplikacija
8. `ICON_MAP` ×3 (Home/About/Services, različiti skupovi).
9. Hero blok ×4 copy-paste (About/Services/Portfolio/Contact) → kandidat `<PageHero>`.
10. `ImageSlot` vs `InstagramSlot` near-duplikat; `Field` ×2; `FONT_SIZE_OPTIONS`/`COLOR_PRESETS` ×2 (PagesManager/PackagesManager).
11. Dva identična singleton keša (settingsCache + contentCache).
12. `src/types.ts` potpuno neiskorišten — svaka stranica ima lokalni interface (i tipovi se razlikuju: `id: string` vs `number`).
13. TikTok ikona: custom SVG (Contact) vs `Music2` (Footer).
14. `translations` dict (~400 linija) u LanguageContext duplira seed iz baze.

### Mrtav kod
15. **Testimonials: kompletna vertikala (API + admin manager + CMS ključevi) postoji, ali se NIGDJE ne renderuje na javnom sajtu.**
16. Neiskorišteni CMS ključevi: `stories.hero.*`, `stories.card.*`, `contact.email.tag`, `experience.carousel.hint`...
17. `sage-*` paleta (1 upotreba).

### Hardkodirano što pripada u CMS
18. Naslovi/lokacije 9 grid slika na Home (EN, neprevedeno).
19. Cijela ComingSoon stranica (samo BS).
20. Portfolio kategorije (`WEDDINGS/STUDIO/PORTRAITS` — i CHECK constraint u bazi).
21. Valuta `KM`, `Est. 2016`, potpis `Melisa & Aldin`, brand ime.
22. ~30 Unsplash fallback URL-ova rasutih po fajlovima.
23. Fallback SEO title/desc po ruti (EN) u App.tsx.

### Arhitektonski dugovi
24. Nema deljenog API klijenta — `fetch` + `credentials: 'include'` ponovljen ~30×, bez centralnog error/401 handlinga.
25. Invalidacija settings keša ≠ re-render (nema pretplatnika).
26. Legacy kolone u `packages` (name/description/features) uz lokalizovane.
27. `content/bulk` je update-only — novi CMS ključ zahtijeva insert kroz `initDB` seed ili ručno.
28. Jezik nije u URL-u (SEO za dvojezičnost).

# 387 Cinematic Weddings — Setup & Deployment

Kompletno uputstvo za pokretanje lokalno i deploy na produkciju.

---

## 1. Preduslovi (instalirati jednom)

### Node.js
Instaliraj **Node.js v20 ili noviji** sa <https://nodejs.org> (LTS verzija).
Provjera:
```bash
node --version    # v20.x.x ili noviji (testirano na v24)
```

### PostgreSQL
Instaliraj **PostgreSQL 14 ili noviji** sa <https://www.postgresql.org/download/windows/>.
- Zapamti **superuser (postgres) lozinku** — treba u koraku 3.
- Port ostavi na `5432` (default).
- pgAdmin 4 je koristan za pregled baze (opciono).

---

## 2. Instalacija paketa

U folderu projekta:
```bash
npm install
```

---

## 3. Kreiranje i uvoz baze

Projekt ima **jedan** backup fajl: `art_studio_backup.sql`.
On sadrži kompletnu šemu + sav sadržaj (galerija, paketi, tekstovi, postavke).
> Napomena: backup **ne** sadrži admin korisnika ni stare kontakt-upite —
> admin se kreira u koraku 5 (`/api/auth/setup`).

### Kreiraj bazu
**Windows PowerShell:**
```powershell
$env:PGPASSWORD="TVOJA_POSTGRES_LOZINKA"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE art_studio;"
```
(zamijeni `18` sa `17`/`16` ako imaš drugu verziju)

### Uvezi sadržaj
```powershell
$env:PGPASSWORD="TVOJA_POSTGRES_LOZINKA"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -d art_studio -f art_studio_backup.sql
```
Na kraju treba pisati niz `CREATE TABLE`, `COPY`, `ALTER TABLE` — znak da je prošlo uspješno.

> Tabele se i automatski kreiraju pri prvom pokretanju servera (`initDB`),
> tako da uvoz backup-a služi da dobiješ **postojeći sadržaj**. Na potpuno praznu bazu
> aplikacija će sama napraviti tabele i seed vrijednosti.

---

## 4. Konfiguracija `.env`

Kopiraj `.env.example` u `.env` i popuni:

```env
# Obavezno
DATABASE_URL="postgresql://postgres:TVOJA_POSTGRES_LOZINKA@localhost:5432/art_studio"

# JWT tajni ključ — OBAVEZNO nasumičan za produkciju. Generiši sa:
#   node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
JWT_SECRET="<nasumičan-string>"

# Admin kredencijali (koriste se samo pri prvom setup-u)
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="<jaka-lozinka>"

# Opciono
# PORT=3000
# NODE_ENV=development
# SITE_URL=https://387cinematicweddings.com   # za CORS u produkciji
# ALLOW_SETUP=true                             # samo dok kreiraš prvog admina
```

> **Sigurnost:** `.env` je u `.gitignore` i **nikad** se ne commit-uje.
> Nikad ne koristi default/slabe vrijednosti (`admin123`, dev JWT ključ) na produkciji.

---

## 5. Kreiranje admin korisnika (prvi put)

1. U `.env` privremeno postavi `ALLOW_SETUP=true`.
2. Pokreni server (`npm run dev`).
3. Pozovi setup endpoint (kreira admina iz `ADMIN_USERNAME`/`ADMIN_PASSWORD`):
   ```bash
   curl -X POST http://localhost:3000/api/auth/setup
   ```
4. **Odmah ukloni** `ALLOW_SETUP=true` iz `.env` (ili postavi na `false`).

---

## 6. Pokretanje

### Development
```bash
npm run dev
```
Ispisuje:
```
Server running on http://localhost:3000
Admin panel: http://localhost:3000/admin
```
- Stranica: <http://localhost:3000>
- Admin panel: <http://localhost:3000/admin>
- Health check: <http://localhost:3000/api/health> → `{"status":"ok","db":"up"}`

### Prijava u admin
Korisničko ime/lozinka iz `.env` (`ADMIN_USERNAME` / `ADMIN_PASSWORD`).

---

## 7. Produkcija (deployment)

> **Ključno:** u produkciji server MORA raditi sa `NODE_ENV=production`.
> Tada servira izgrađeni statični `dist/` umjesto da pokreće Vite u procesu
> (mnogo lakše), a aktiviraju se i `secure` cookie i produkcijski CSP.

### 1) Build
```bash
npm run build      # kreira dist/
```

### 2) Env za produkciju
```env
NODE_ENV=production
DATABASE_URL=...            # produkcijska baza
JWT_SECRET=...             # jak, nasumičan
SITE_URL=https://387cinematicweddings.com
PORT=3000
```

### 3) Pokretanje sa auto-restartom (npr. pm2)
```bash
npm install -g pm2
NODE_ENV=production pm2 start "npx tsx server.ts" --name art-studio
pm2 save && pm2 startup
```

### 4) Reverse proxy + HTTPS
Aplikacija sluša HTTP na `0.0.0.0:3000`. Ispred nje mora stajati
**nginx** ili **Caddy** koji terminira TLS (HTTPS) i prosljeđuje na `:3000`.
`secure` cookie radi samo preko HTTPS-a.

### 5) CSP napomena
Produkcijski Content-Security-Policy (u `server.ts`) već dozvoljava:
Google Fonts, Google Tag Manager/Analytics i Unsplash slike.
Ako dodaš novi eksterni servis (npr. drugi CDN), dopuni odgovarajući `directive`.

---

## 8. Backup i restore baze

### Napravi backup (samo sadržaj, bez admin/upita)
```powershell
$env:PGPASSWORD="LOZINKA"
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U postgres -h localhost -d art_studio `
  --no-owner --no-privileges `
  --exclude-table-data=admin_users `
  --exclude-table-data=contact_submissions `
  -f art_studio_backup.sql
```

### Potpuni backup (uključujući admina i upite — čuvati privatno!)
```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U postgres -h localhost -d art_studio -f full_backup.sql
```

### Restore
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -d art_studio -f art_studio_backup.sql
```

> Slike iz admin panela čuvaju se u `uploads/` folderu (van baze).
> Za potpuni backup sajta backup-uj i `uploads/`.

---

## 9. Sigurnosne napomene

- `.env` se nikad ne commit-uje (već u `.gitignore`).
- JWT_SECRET i admin lozinka moraju biti jaki i jedinstveni po okruženju.
- Login je rate-limited na **10 pokušaja / 15 min** po IP-u.
- Kontakt forma je rate-limited na **5 / 15 min** po IP-u.
- Upload prima samo slike (jpg/png/webp/avif, ≤10 MB); svaka se reprocesira u `.webp`.
- Cookie je `httpOnly` + `sameSite=strict`; `secure` u produkciji.

---

## 10. Česti problemi

| Problem | Rješenje |
|---|---|
| `password authentication failed` | Provjeri lozinku u `DATABASE_URL` unutar `.env` |
| `Port 3000 already in use` | Ugasi drugi proces ili postavi `PORT=3001` u `.env` |
| `relation "..." does not exist` | Uvezi `art_studio_backup.sql` ili pusti server da napravi tabele |
| Fontovi/analytics ne rade u produkciji | Provjeri CSP `directives` u `server.ts` |
| Admin login ne prolazi | Ponovi setup (korak 5) ili resetuj hash u `admin_users` |

---

## 11. Zaustavljanje servera
U terminalu gdje radi server: **Ctrl + C** (dev), ili `pm2 stop art-studio` (prod).

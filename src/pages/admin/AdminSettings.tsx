import React, { useEffect, useState } from 'react';
import {
  Check, Loader2, Globe,
  Search, Languages, BarChart2, FileText, MapPin, ExternalLink, RefreshCw,
  Tag, AlertCircle, Copy, CheckCheck, Mail, AtSign,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { invalidateSettingsCache } from '../../lib/settingsCache';
import { adminFetch, json, errorText } from '../../lib/adminFetch';

type Tab = 'contact' | 'general' | 'seo' | 'technical' | 'security';


// In the order of the site's menu
const SEO_PAGES = [
  // The Bosnian address of each page (the English one is under /en)
  { key: 'home',      label: 'Naslovna',   path: '/',            defaultTitle: 'Art in the Moments | 387 Weddings' },
  { key: 'portfolio', label: 'Radovi',     path: '/radovi',      defaultTitle: 'Radovi | Vjenčane fotografije Sarajevo | 387 Weddings' },
  { key: 'story',     label: 'Priča',      path: '/radovi/...',  defaultTitle: 'Ime para | 387 Weddings' },
  { key: 'about',     label: 'O nama',     path: '/o-nama',      defaultTitle: 'O nama | 387 Weddings' },
  { key: 'contact',   label: 'Kontakt',    path: '/kontakt',     defaultTitle: 'Kontakt | 387 Weddings' },
  { key: 'privacy',   label: 'Privatnost', path: '/privatnost',  defaultTitle: 'Politika privatnosti | 387 Weddings' },
];

export default function AdminSettings() {
  const [tab, setTab] = useState<Tab>('contact');
  const [settings, setSettings] = useState<Record<string, string>>({});
  // What the server holds: only real changes are sent, so saving here never
  // writes back photographs or texts changed meanwhile in another tab
  const [stored, setStored] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<Record<string, string>>('/api/settings')
      .then(data => { setSettings(data ?? {}); setStored(data ?? {}); })
      .catch(err => setLoadError(errorText(err)))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: string, value: string) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  const changed = Object.fromEntries(
    Object.entries(settings).filter(([k, v]) => (stored[k] ?? '') !== (v ?? ''))
  );
  const dirty = Object.keys(changed).length > 0;

  // Leaving with unsaved settings asks first
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await adminFetch('/api/settings', json('PUT', changed));
      setStored(prev => ({ ...prev, ...changed }));
      invalidateSettingsCache();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-white/20" />
      </div>
    );
  }
  if (loadError) {
    return <p className="text-red-400 text-sm py-10">Postavke se nisu učitale: {loadError}</p>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Postavke sajta</h1>
        <p className="text-white/40 text-sm mt-1">
          Kontakt i Instagram, SEO, Coming Soon, analitika i sigurnost
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {([
          { id: 'contact',   label: 'Kontakt i Instagram' },
          { id: 'seo',       label: 'SEO' },
          { id: 'general',   label: 'Sajt' },
          { id: 'technical', label: 'Analitika i tehničko' },
          { id: 'security',  label: 'Sigurnost' },
        ] as { id: Tab; label: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2 rounded-sm text-xs font-bold tracking-widest uppercase transition-all duration-200',
              tab === t.id
                ? 'bg-gold-600/20 text-gold-400 border border-gold-600/30'
                : 'text-white/30 hover:text-white/60 hover:bg-white/5 border border-transparent'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Kontakt i Instagram ── */}
      {tab === 'contact' && (
        <div className="space-y-4">
          {/* Email + Telefon */}
          <div className="bg-moody-950/60 border border-white/5 rounded-sm p-6 space-y-5">
            <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold tracking-widest uppercase">
              <Mail size={13} /> Kontakt podaci
            </div>
            <Field label="Email adresa" placeholder="hello@387weddings.ba"
              value={settings['email'] ?? ''} onChange={v => set('email', v)}
              hint="Javna adresa studija: Google je prikazuje u podacima o firmi." />
            <Field label="Telefon" placeholder="+387 61 000 000"
              value={settings['phone'] ?? ''} onChange={v => set('phone', v)}
              hint="Google ga prikazuje u podacima o firmi. Prazno = ne prikazuje se." />
            <Field label="Upiti stižu na" placeholder="upiti@387weddings.ba"
              value={settings['contact_recipient'] ?? ''} onChange={v => set('contact_recipient', v)}
              hint="Adresa na koju se šalje obavijest kad neko pošalje kontakt formu. Upit se uvijek sprema i u panel, pod Upiti." />
          </div>

          {/* Instagram */}
          <div className="bg-moody-950/60 border border-white/5 rounded-sm p-6 space-y-5">
            <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold tracking-widest uppercase">
              <AtSign size={13} /> Instagram
            </div>
            <Field label="Korisničko ime (bez @)" placeholder="387.weddings"
              value={settings['instagram_handle'] ?? ''} onChange={v => set('instagram_handle', v)}
              hint="Prikazuje se kao @korisničkoime u footeru, meniju i bloku „Pogledajte još na Instagramu“." />
            <Field label="URL profila" placeholder="https://instagram.com/387.weddings"
              value={settings['instagram'] ?? ''} onChange={v => set('instagram', v)}
              hint="Prazno = link vodi na profil iz korisničkog imena." />
          </div>

          <p className="text-white/20 text-[10px] leading-relaxed pt-1">
            Tekstovi stranice Kontakt (naslov, polja forme, napomena o odgovoru) uređuju se u <strong className="text-white/40">Stranice → Kontakt</strong>.
          </p>
        </div>
      )}

      {/* ── Tab: Sajt ── */}
      {tab === 'general' && (
        <div className="space-y-4">
          {/* Coming Soon toggle */}
          <div className={cn(
            'border rounded-sm p-5 flex items-start justify-between gap-6 transition-colors',
            settings['coming_soon'] === 'true'
              ? 'bg-gold-600/8 border-gold-600/25'
              : 'bg-moody-950/60 border-white/5'
          )}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white text-sm font-medium">Coming Soon mod</span>
                {settings['coming_soon'] === 'true' && (
                  <span className="text-[8px] tracking-[0.3em] uppercase font-bold text-gold-400 bg-gold-600/10 border border-gold-600/20 px-2 py-0.5 rounded-sm">
                    Uključen
                  </span>
                )}
              </div>
              <p className="text-white/30 text-xs leading-relaxed">
                Kada je uključen, posjetioci vide Coming Soon stranicu umjesto sajta.<br />
                Ti kao admin i dalje vidiš puni sajt (sa podsjetnim bannerom na dnu).
              </p>
            </div>
            <button
              type="button"
              onClick={() => set('coming_soon', settings['coming_soon'] === 'true' ? 'false' : 'true')}
              className={cn(
                'relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none mt-0.5',
                settings['coming_soon'] === 'true' ? 'bg-gold-600' : 'bg-white/10'
              )}
              aria-label="Toggle Coming Soon"
            >
              <span className={cn(
                'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow',
                settings['coming_soon'] === 'true' ? 'translate-x-7' : 'translate-x-1'
              )} />
            </button>
          </div>

        </div>
      )}

      {/* ── Tab: SEO ── */}
      {tab === 'seo' && (
        <div className="space-y-4">
          {/* Global */}
          <div className="bg-moody-950/60 border border-white/5 rounded-sm p-5 space-y-4">
            <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold tracking-widest uppercase">
              <Globe size={13} /> Globalno
            </div>
            <Field label="Ime sajta" placeholder="387 Weddings"
              value={settings['seo.site_name'] ?? ''} onChange={v => set('seo.site_name', v)}
              hint="Dodaje se na kraj svakog meta naslova koji nije ručno postavljen." />
            <Field label="OG slika — podrazumijevana (URL)" placeholder="https://387weddings.ba/og-image.jpg"
              value={settings['seo.og_image'] ?? ''} onChange={v => set('seo.og_image', v)}
              hint="Slika koja se prikazuje pri dijeljenju na Facebooku, Instagramu, Viberu... Preporučeno: 1200×630 px JPG." />
          </div>

          {/* Column headers */}
          <div className="hidden md:grid md:grid-cols-[180px_1fr_1fr] gap-4 px-1 pb-1">
            <div />
            <div className="flex items-center gap-1.5 text-[9px] tracking-widest uppercase text-gold-500/40 font-bold">
              <Languages size={10} /> Engleski (ENG)
            </div>
            <div className="flex items-center gap-1.5 text-[9px] tracking-widest uppercase text-gold-500/40 font-bold">
              <Languages size={10} /> Bosanski (BOS)
            </div>
          </div>

          {/* Per-page — bilingual */}
          {SEO_PAGES.map(page => (
            <div key={page.key} className="bg-moody-950/60 border border-white/5 rounded-sm p-5 space-y-5">
              <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold tracking-widest uppercase">
                <Search size={13} />
                <span>{page.label}</span>
                <span className="text-white/20 font-mono normal-case tracking-normal font-normal">{page.path}</span>
              </div>

              {/* Meta naslov — not for a story: its title is always the couple's name */}
              {page.key === 'story' ? (
                <p className="text-white/30 text-[11px] leading-relaxed">
                  Naslov svake priče je ime para (npr. „Amra & Tarik | 387 Weddings"). Opis ispod koristi se samo za
                  priče bez vlastitog „Opisa za Google" i s kratkim tekstom.
                </p>
              ) : (
              <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-[180px_1fr_1fr] md:gap-4 md:items-start">
                <div className="md:pt-1.5">
                  <span className="text-white/50 text-xs font-medium block">Meta naslov</span>
                  <span className="text-white/20 text-[10px]">max 60 znakova</span>
                </div>
                <div>
                  <div className="md:hidden text-[9px] tracking-widest uppercase text-gold-500/40 font-bold mb-1.5">ENG</div>
                  <SeoField value={settings[`seo.${page.key}.title.en`] ?? ''}
                    onChange={v => set(`seo.${page.key}.title.en`, v)}
                    maxChars={60} placeholder={page.defaultTitle} />
                </div>
                <div>
                  <div className="md:hidden text-[9px] tracking-widest uppercase text-gold-500/40 font-bold mb-1.5">BOS</div>
                  <SeoField value={settings[`seo.${page.key}.title.bs`] ?? ''}
                    onChange={v => set(`seo.${page.key}.title.bs`, v)}
                    maxChars={60} placeholder={`${page.label} | 387 Weddings`} />
                </div>
              </div>
              )}

              {/* Meta opis */}
              <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-[180px_1fr_1fr] md:gap-4 md:items-start">
                <div className="md:pt-1.5">
                  <span className="text-white/50 text-xs font-medium block">Meta opis</span>
                  <span className="text-white/20 text-[10px]">max 160 znakova</span>
                </div>
                <div>
                  <div className="md:hidden text-[9px] tracking-widest uppercase text-gold-500/40 font-bold mb-1.5">ENG</div>
                  <SeoField value={settings[`seo.${page.key}.desc.en`] ?? ''}
                    onChange={v => set(`seo.${page.key}.desc.en`, v)}
                    maxChars={160} placeholder="Short description shown in Google results..." multiline />
                </div>
                <div>
                  <div className="md:hidden text-[9px] tracking-widest uppercase text-gold-500/40 font-bold mb-1.5">BOS</div>
                  <SeoField value={settings[`seo.${page.key}.desc.bs`] ?? ''}
                    onChange={v => set(`seo.${page.key}.desc.bs`, v)}
                    maxChars={160} placeholder="Kratki opis koji se prikazuje u Google rezultatima..." multiline />
                </div>
              </div>
            </div>
          ))}

          <p className="text-white/20 text-[10px] leading-relaxed pt-1">
            Promjene se odmah primjenjuju za dijeljenje na društvenim mrežama.
            Google indeksira promjene u roku od 1–7 dana.
          </p>
        </div>
      )}

      {/* ── Tab: Analitika & Tehnički ── */}
      {tab === 'security' && <SecurityPanel />}

      {tab === 'technical' && <DiskPanel />}

      {tab === 'technical' && (
        <div className="space-y-4">

          {/* Google Analytics */}
          <TechGroup icon={<BarChart2 size={14} />} label="Google Analytics 4">
            <Field
              label="Measurement ID"
              placeholder="G-XXXXXXXXXX"
              value={settings['analytics.ga_id'] ?? ''}
              onChange={v => set('analytics.ga_id', v)}
              hint="Pronađi na: Google Analytics → Admin → Data Streams → tvoj stream → Measurement ID."
            />
            <GaStatusBadge value={settings['analytics.ga_id'] ?? ''} />
          </TechGroup>

          {/* Google Tag Manager */}
          <TechGroup icon={<Tag size={14} />} label="Google Tag Manager">
            <Field
              label="Container ID"
              placeholder="GTM-XXXXXXX"
              value={settings['analytics.gtm_id'] ?? ''}
              onChange={v => set('analytics.gtm_id', v)}
              hint="Ako koristiš GTM umjesto direktnog GA4 taga. Pronađi na: tagmanager.google.com → tvoj kontejner → ID."
            />
            {settings['analytics.ga_id'] && settings['analytics.gtm_id'] && (
              <div className="flex items-start gap-2 mt-1 p-3 bg-amber-500/5 border border-amber-500/20 rounded-sm">
                <AlertCircle size={13} className="text-amber-400 mt-0.5 shrink-0" />
                <p className="text-amber-400/80 text-[10px] leading-relaxed">
                  Postavljeni su i GA4 i GTM. Ako GTM već šalje GA4 event, dupliraš podatke.
                  Koristi samo jedan od dva načina.
                </p>
              </div>
            )}
          </TechGroup>

          {/* Google Search Console */}
          <TechGroup icon={<Search size={14} />} label="Google Search Console">
            <Field
              label="HTML verifikacijski kod"
              placeholder="abc123def456..."
              value={settings['analytics.gsc_verification'] ?? ''}
              onChange={v => set('analytics.gsc_verification', v)}
              hint='Pronađi na: Search Console → Dodaj property → HTML tag verifikacija. Kopiraj SAMO vrijednost content="" atributa, ne cijeli <meta> tag.'
            />
            {settings['analytics.gsc_verification'] && (
              <MetaTagPreview code={settings['analytics.gsc_verification']} />
            )}
            <GscLinks baseUrl={settings['sitemap.base_url'] || 'https://387weddings.ba'} />
          </TechGroup>

          {/* Sitemap */}
          <TechGroup icon={<MapPin size={14} />} label="Sitemap">
            <Field
              label="URL sajta (osnova za sitemap)"
              placeholder="https://387weddings.ba"
              value={settings['sitemap.base_url'] ?? ''}
              onChange={v => set('sitemap.base_url', v)}
              hint="Koristi se za generisanje sitemap.xml i robots.txt. Bez trailing slash-a."
            />
            <SitemapPreview baseUrl={settings['sitemap.base_url'] || 'https://387weddings.ba'} />
          </TechGroup>

          {/* Robots.txt */}
          <TechGroup icon={<FileText size={14} />} label="Robots.txt">
            <div>
              <label className="block text-[10px] tracking-[0.2em] uppercase font-bold text-white/40 mb-1.5">
                Sadržaj
              </label>
              <textarea
                value={settings['robots_txt'] ?? ''}
                onChange={e => set('robots_txt', e.target.value)}
                rows={8}
                spellCheck={false}
                className="w-full bg-moody-900 border border-white/10 rounded-sm px-4 py-3 text-white/80 text-xs font-mono focus:outline-none focus:border-gold-600/40 transition-colors resize-y leading-relaxed"
                placeholder={`User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: https://387weddings.ba/sitemap.xml`}
              />
              <p className="text-white/20 text-[10px] mt-1.5 leading-relaxed">
                Direktivom <span className="text-white/40 font-mono">Disallow: /admin/</span> spriječavaš indeksiranje admin panela.
                Izmjene su vidljive na <span className="text-white/40">/robots.txt</span> najkasnije za sat (pretraživači ga ionako čitaju rijetko).
              </p>
            </div>
            <RobotsLinks baseUrl={settings['sitemap.base_url'] || 'https://387weddings.ba'} />
          </TechGroup>

          <p className="text-white/20 text-[10px] leading-relaxed pt-1">
            GA4 i GTM skripte se automatski ubacuju u stranicu čim sačuvaš. Stranica ne mora biti ponovo pokrenuta.
          </p>
        </div>
      )}

      <div className={cn(
        'flex flex-wrap items-center justify-end gap-3 pt-2',
        dirty && 'sticky bottom-0 z-10 bg-moody-900/95 border-t border-gold-600/20 py-3',
      )}>
        {saveError && <p role="alert" className="mr-auto text-red-400 text-xs leading-snug max-w-xl">{saveError}</p>}
        {!saveError && dirty && !saving && (
          <p className="mr-auto text-amber-300/80 text-xs">Ima nesačuvanih promjena.</p>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="flex items-center gap-2 px-6 py-2.5 bg-gold-600/15 hover:bg-gold-600/25 border border-gold-600/25 hover:border-gold-600/40 text-gold-400 text-xs font-bold tracking-widest uppercase rounded-sm transition-all duration-200 disabled:opacity-40"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          {saving ? 'Čuvanje...' : saved ? 'Sačuvano!' : 'Sačuvaj postavke'}
        </button>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TechGroup({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="bg-moody-950/60 border border-white/5 rounded-sm p-5 space-y-4">
      <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold tracking-widest uppercase">
        {icon} {label}
      </div>
      {children}
    </div>
  );
}

// ── Sigurnost: password and sign-ins ──────────────────────────────────────────
function SecurityPanel() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const change = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== repeat) { setMsg({ ok: false, text: 'Nova lozinka i ponovljena se ne poklapaju.' }); return; }
    setBusy(true);
    setMsg(null);
    try {
      await adminFetch('/api/auth/password', json('POST', { current, next }));
      setCurrent(''); setNext(''); setRepeat('');
      setMsg({ ok: true, text: 'Lozinka je promijenjena. Sve ostale prijave (drugi uređaji, preglednici) su završene.' });
    } catch (err) {
      setMsg({ ok: false, text: errorText(err) });
    } finally {
      setBusy(false);
    }
  };

  const logoutAll = async () => {
    if (!confirm('Odjaviti sve uređaje, uključujući ovaj? Morat ćeš se ponovo prijaviti.')) return;
    try {
      await adminFetch('/api/auth/logout-all', { method: 'POST' });
      window.location.assign('/admin/login');
    } catch (err) {
      setMsg({ ok: false, text: errorText(err) });
    }
  };

  const input = 'w-full bg-moody-950/60 border border-white/10 rounded-sm px-3 py-2.5 text-sm text-white/85 outline-none focus:border-gold-600';
  return (
    <div className="space-y-4">
      <form onSubmit={change} className="bg-moody-950/60 border border-white/5 rounded-sm p-6 space-y-4">
        <div className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Promjena lozinke</div>
        <input type="password" autoComplete="current-password" placeholder="Trenutna lozinka" className={input}
          value={current} onChange={e => setCurrent(e.target.value)} />
        <input type="password" autoComplete="new-password" placeholder="Nova lozinka (najmanje 10 znakova)" className={input}
          value={next} onChange={e => setNext(e.target.value)} />
        <input type="password" autoComplete="new-password" placeholder="Ponovi novu lozinku" className={input}
          value={repeat} onChange={e => setRepeat(e.target.value)} />
        <p className="text-white/25 text-[11px]">Promjenom lozinke završavaju se sve ostale prijave; ovaj uređaj ostaje prijavljen.</p>
        <button type="submit" disabled={busy || !current || next.length < 10}
          className="px-5 py-2.5 bg-gold-600/15 hover:bg-gold-600/25 border border-gold-600/25 text-gold-400 text-xs font-bold tracking-widest uppercase rounded-sm disabled:opacity-40">
          {busy ? 'Mijenjam…' : 'Promijeni lozinku'}
        </button>
      </form>
      <div className="bg-moody-950/60 border border-white/5 rounded-sm p-6 space-y-3">
        <div className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Prijave</div>
        <p className="text-white/30 text-xs">Ako si se prijavio/la na tuđem računaru ili je telefon izgubljen: ovo odmah završava sve prijave.</p>
        <button type="button" onClick={logoutAll}
          className="px-5 py-2.5 border border-red-500/30 text-red-300 hover:bg-red-500/10 text-xs font-bold tracking-widest uppercase rounded-sm">
          Odjavi sve uređaje
        </button>
      </div>
      {msg && <p role="status" className={cn('text-xs', msg.ok ? 'text-emerald-300' : 'text-red-300')}>{msg.text}</p>}
    </div>
  );
}

// ── Prostor na disku: photographs nothing uses any more ──────────────────────
function DiskPanel() {
  const [list, setList] = useState<{ file: string; size: number }[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const mb = (n: number) => `${(n / 1048576).toFixed(1)} MB`;

  const find = async () => {
    setBusy(true); setMsg(null);
    try {
      const r = await adminFetch<{ files: { file: string; size: number }[] }>('/api/settings/uploads/orphans');
      setList(r.files);
    } catch (err) { setMsg(errorText(err)); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    if (!list?.length) return;
    const total = list.reduce((a, f) => a + f.size, 0);
    if (!confirm(`Trajno obrisati ${list.length} fotografija (${mb(total)}) koje se nigdje na sajtu ne koriste?`)) return;
    setBusy(true);
    try {
      const r = await adminFetch<{ deleted: number; freed: number }>(
        '/api/settings/uploads/orphans/delete', json('POST', { files: list.map(f => f.file) }));
      setMsg(`Obrisano ${r.deleted} fotografija, oslobođeno ${mb(r.freed)}.`);
      setList(null);
    } catch (err) { setMsg(errorText(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="bg-moody-950/60 border border-white/5 rounded-sm p-6 space-y-3 mb-4">
      <div className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Prostor na disku</div>
      <p className="text-white/30 text-xs leading-relaxed">
        Fotografije obrisanih priča brišu se same. Fotografije koje su zamijenjene novim ostaju na disku dok ih ovdje ne
        pregledaš i obrišeš. Prvo se prikaže popis; ništa se ne briše bez potvrde.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={find} disabled={busy}
          className="px-4 py-2 border border-white/10 text-white/70 hover:bg-white/5 text-xs rounded-sm disabled:opacity-40">
          Pronađi nekorištene fotografije
        </button>
        {list && list.length > 0 && (
          <button type="button" onClick={remove} disabled={busy}
            className="px-4 py-2 border border-red-500/30 text-red-300 hover:bg-red-500/10 text-xs rounded-sm disabled:opacity-40">
            Obriši {list.length} ({mb(list.reduce((a, f) => a + f.size, 0))})
          </button>
        )}
      </div>
      {list && (list.length === 0
        ? <p className="text-white/40 text-xs">Nema nekorištenih fotografija.</p>
        : (
          <ul className="max-h-48 overflow-y-auto text-[11px] text-white/40 font-mono space-y-0.5">
            {list.map(f => <li key={f.file}>{f.file} · {mb(f.size)}</li>)}
          </ul>
        ))}
      {msg && <p role="status" className="text-xs text-white/60">{msg}</p>}
    </div>
  );
}

function Field({ label, placeholder, value, onChange, hint }: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] tracking-[0.2em] uppercase font-bold text-white/40 mb-1.5">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-moody-900 border border-white/10 rounded-sm px-4 py-3 text-white text-sm focus:outline-none focus:border-gold-600/40 transition-colors placeholder:text-white/20"
      />
      {hint && <p className="text-white/20 text-[10px] mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  );
}

function SeoField({ placeholder, value, onChange, maxChars, multiline }: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  maxChars: number;
  multiline?: boolean;
}) {
  const len  = value.length;
  const over = len > maxChars;
  const near = len > maxChars * 0.85;

  return (
    <div>
      <div className="flex justify-end mb-1">
        <span className={cn(
          'text-[10px] font-mono tabular-nums',
          over ? 'text-red-400' : near ? 'text-gold-400/70' : 'text-white/20'
        )}>
          {len} / {maxChars}
        </span>
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={cn(
            'w-full bg-moody-900 border rounded-sm px-3 py-2.5 text-white/80 text-sm focus:outline-none transition-colors placeholder:text-white/20 resize-none leading-relaxed font-light',
            over ? 'border-red-500/40 focus:border-red-500/60' : 'border-white/10 focus:border-gold-600/40'
          )}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'w-full bg-moody-900 border rounded-sm px-3 py-2.5 text-white/80 text-sm focus:outline-none transition-colors placeholder:text-white/20 font-light',
            over ? 'border-red-500/40 focus:border-red-500/60' : 'border-white/10 focus:border-gold-600/40'
          )}
        />
      )}
    </div>
  );
}

// Shows active/inactive badge for GA4 ID
function GaStatusBadge({ value }: { value: string }) {
  const isValid = /^G-[A-Z0-9]{6,}$/.test(value.trim());
  if (!value.trim()) return null;
  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-bold tracking-widest uppercase',
      isValid
        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        : 'bg-red-500/10 text-red-400 border border-red-500/20'
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', isValid ? 'bg-emerald-400' : 'bg-red-400')} />
      {isValid ? 'Validan GA4 ID format' : 'Nevalidan format — mora biti G-XXXXXXXX'}
    </div>
  );
}

// Shows the full meta tag that will be injected
function MetaTagPreview({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const tag = `<meta name="google-site-verification" content="${code.trim()}" />`;
  const copy = () => {
    navigator.clipboard.writeText(tag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="mt-1">
      <p className="text-white/30 text-[10px] mb-1.5 uppercase tracking-widest font-bold">Ubacuje se u &lt;head&gt;:</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-moody-900/80 border border-white/10 rounded-sm px-3 py-2 text-white/50 text-[10px] font-mono overflow-x-auto whitespace-nowrap">
          {tag}
        </code>
        <button onClick={copy} className="shrink-0 p-2 text-white/30 hover:text-gold-400 transition-colors" title="Kopiraj">
          {copied ? <CheckCheck size={13} className="text-emerald-400" /> : <Copy size={13} />}
        </button>
      </div>
    </div>
  );
}

// Quick-links for GSC
function GscLinks({ baseUrl }: { baseUrl: string }) {
  return (
    <div className="flex flex-wrap gap-3 pt-1">
      <a
        href="https://search.google.com/search-console"
        target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[10px] text-gold-500/60 hover:text-gold-400 transition-colors"
      >
        <ExternalLink size={10} /> Otvori Search Console
      </a>
      <a
        href={`https://search.google.com/search-console/sitemaps?resource_id=${encodeURIComponent(baseUrl + '/')}`}
        target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[10px] text-gold-500/60 hover:text-gold-400 transition-colors"
      >
        <RefreshCw size={10} /> Pošalji Sitemap u GSC
      </a>
    </div>
  );
}

// Sitemap preview card
function SitemapPreview({ baseUrl }: { baseUrl: string }) {
  const url = `${baseUrl.replace(/\/$/, '')}/sitemap.xml`;
  return (
    <div className="flex items-center justify-between bg-moody-900/60 border border-white/8 rounded-sm px-4 py-3">
      <div>
        <p className="text-[10px] tracking-widest uppercase font-bold text-white/30 mb-0.5">URL sitemapa</p>
        <p className="text-white/60 text-xs font-mono">{url}</p>
      </div>
      <a
        href="/sitemap.xml"
        target="_blank" rel="noopener noreferrer"
        className="shrink-0 flex items-center gap-1.5 text-[10px] text-gold-500/60 hover:text-gold-400 transition-colors ml-4"
      >
        <ExternalLink size={11} /> Pregled
      </a>
    </div>
  );
}

// Robots.txt quick-links
function RobotsLinks({ baseUrl }: { baseUrl: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      <a
        href="/robots.txt"
        target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[10px] text-gold-500/60 hover:text-gold-400 transition-colors"
      >
        <ExternalLink size={10} /> Pregled robots.txt
      </a>
      <a
        href={`https://www.google.com/webmasters/tools/robots-testing-tool?url=${encodeURIComponent(baseUrl)}`}
        target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[10px] text-gold-500/60 hover:text-gold-400 transition-colors"
      >
        <ExternalLink size={10} /> Google Robots Tester
      </a>
    </div>
  );
}

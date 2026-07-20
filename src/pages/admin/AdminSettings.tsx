import React, { useEffect, useState } from 'react';
import {
  Check, Loader2, Globe, Instagram, Facebook, Twitter, Youtube, Music2,
  Search, Languages, BarChart2, FileText, MapPin, ExternalLink, RefreshCw,
  Tag, AlertCircle, Copy, CheckCheck, Phone, Mail, AtSign,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { invalidateSettingsCache } from '../../lib/settingsCache';

type Tab = 'contact' | 'general' | 'social' | 'seo' | 'technical';


const SEO_PAGES = [
  { key: 'home',      label: 'Naslovna', path: '/',          defaultTitle: 'Art in the Moments | 387 Cinematic Weddings' },
  { key: 'about',     label: 'O nama',   path: '/about',     defaultTitle: 'About Us | 387 Cinematic Weddings' },
  { key: 'services',  label: 'Usluge',   path: '/services',  defaultTitle: 'Experience | 387 Cinematic Weddings' },
  { key: 'portfolio', label: 'Portfolio', path: '/portfolio', defaultTitle: 'Portfolio | 387 Cinematic Weddings' },
  { key: 'contact',   label: 'Kontakt',  path: '/contact',   defaultTitle: 'Inquire | 387 Cinematic Weddings' },
];

export default function AdminSettings() {
  const [tab, setTab] = useState<Tab>('contact');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setSettings(data ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (key: string, value: string) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings),
      });
      invalidateSettingsCache();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
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

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Postavke sajta</h1>
        <p className="text-white/40 text-sm mt-1">
          Opšte informacije, društvene mreže, SEO i analitika
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {([
          { id: 'contact',   label: 'Kontakt & Social' },
          { id: 'general',   label: 'Opšte' },
          { id: 'social',    label: 'Društvene mreže' },
          { id: 'seo',       label: 'SEO' },
          { id: 'technical', label: 'Analitika & Tehnički' },
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

      {/* ── Tab: Kontakt & Social ── */}
      {tab === 'contact' && (
        <div className="space-y-4">
          {/* Email + Telefon */}
          <div className="bg-moody-950/60 border border-white/5 rounded-sm p-6 space-y-5">
            <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold tracking-widest uppercase">
              <Mail size={13} /> Kontakt podaci
            </div>
            <Field label="Email adresa" placeholder="hello@387cinematicweddings.com"
              value={settings['email'] ?? ''} onChange={v => set('email', v)} />
            <Field label="Telefon" placeholder="+387 61 000 000"
              value={settings['phone'] ?? ''} onChange={v => set('phone', v)} />
          </div>

          {/* Instagram */}
          <div className="bg-moody-950/60 border border-white/5 rounded-sm p-6 space-y-5">
            <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold tracking-widest uppercase">
              <AtSign size={13} /> Instagram
            </div>
            <Field label="Korisničko ime (bez @)" placeholder="art387weddings"
              value={settings['instagram_handle'] ?? ''} onChange={v => set('instagram_handle', v)}
              hint="Prikazuje se kao @korisničkoime na sajtu." />
            <Field label="URL profila" placeholder="https://instagram.com/art387weddings"
              value={settings['instagram'] ?? ''} onChange={v => set('instagram', v)} />
          </div>

          <p className="text-white/20 text-[10px] leading-relaxed pt-1">
            Tekstovi stranice (Napomena, "Pratite nas", tekst gumba...) uređuju se u <strong className="text-white/40">Pages → Upit</strong>.
          </p>
        </div>
      )}

      {/* ── Tab: Opšte ── */}
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

          <div className="bg-moody-950/60 border border-white/5 rounded-sm p-6 space-y-5">
            <Field label="Email adresa" placeholder="hello@387cinematicweddings.com"
              value={settings['email'] ?? ''} onChange={v => set('email', v)} />
            <Field label="Telefon" placeholder="+387 61 000 000"
              value={settings['phone'] ?? ''} onChange={v => set('phone', v)} />
            <Field label="Lokacija / Slogan" placeholder="Sarajevo — Worldwide"
              value={settings['location'] ?? ''} onChange={v => set('location', v)} />
            <Field label="Tekst dostupnosti (Hero badge)" placeholder="Now booking 2025 & 2026"
              value={settings['availability_text'] ?? ''} onChange={v => set('availability_text', v)} />
          </div>
        </div>
      )}

      {/* ── Tab: Društvene mreže ── */}
      {tab === 'social' && (
        <div className="space-y-4">
          <SocialGroup icon={<Instagram size={15} />} label="Instagram">
            <Field label="URL profila" placeholder="https://instagram.com/387cinematic"
              value={settings['instagram'] ?? ''} onChange={v => set('instagram', v)} />
            <Field label="Korisničko ime (bez @)" placeholder="387cinematic"
              value={settings['instagram_handle'] ?? ''} onChange={v => set('instagram_handle', v)}
              hint="Prikazuje se u Instagram Feed sekciji na sajtu." />
          </SocialGroup>

          <SocialGroup icon={<Facebook size={15} />} label="Facebook">
            <Field label="URL stranice" placeholder="https://facebook.com/387cinematic"
              value={settings['facebook'] ?? ''} onChange={v => set('facebook', v)} />
          </SocialGroup>

          <SocialGroup icon={<Twitter size={15} />} label="Twitter / X">
            <Field label="URL profila" placeholder="https://x.com/387cinematic"
              value={settings['twitter'] ?? ''} onChange={v => set('twitter', v)} />
          </SocialGroup>

          <SocialGroup icon={<Youtube size={15} />} label="YouTube">
            <Field label="URL kanala" placeholder="https://youtube.com/@387cinematic"
              value={settings['youtube'] ?? ''} onChange={v => set('youtube', v)} />
          </SocialGroup>

          <SocialGroup icon={<Music2 size={15} />} label="TikTok">
            <Field label="URL profila" placeholder="https://tiktok.com/@387cinematic"
              value={settings['tiktok'] ?? ''} onChange={v => set('tiktok', v)} />
          </SocialGroup>

          <div className="bg-moody-950/40 border border-white/5 rounded-sm px-4 py-3 text-[10px] text-white/25 leading-relaxed">
            Instagram Feed slike i tekst sekcije upravljaju se u <strong className="text-white/40">Admin → Instagram</strong>.
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
            <Field label="Ime sajta" placeholder="387 Cinematic Weddings"
              value={settings['seo.site_name'] ?? ''} onChange={v => set('seo.site_name', v)}
              hint="Dodaje se na kraj svakog meta naslova koji nije ručno postavljen." />
            <Field label="OG slika — podrazumijevana (URL)" placeholder="https://387cinematicweddings.com/og-image.jpg"
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

              {/* Meta naslov */}
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
                    maxChars={60} placeholder={`${page.label} | 387 Cinematic Weddings`} />
                </div>
              </div>

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
            <GscLinks baseUrl={settings['sitemap.base_url'] || 'https://387cinematicweddings.com'} />
          </TechGroup>

          {/* Sitemap */}
          <TechGroup icon={<MapPin size={14} />} label="Sitemap">
            <Field
              label="URL sajta (osnova za sitemap)"
              placeholder="https://387cinematicweddings.com"
              value={settings['sitemap.base_url'] ?? ''}
              onChange={v => set('sitemap.base_url', v)}
              hint="Koristi se za generisanje sitemap.xml i robots.txt. Bez trailing slash-a."
            />
            <SitemapPreview baseUrl={settings['sitemap.base_url'] || 'https://387cinematicweddings.com'} />
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
                placeholder={`User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: https://387cinematicweddings.com/sitemap.xml`}
              />
              <p className="text-white/20 text-[10px] mt-1.5 leading-relaxed">
                Direktivom <span className="text-white/40 font-mono">Disallow: /admin/</span> spriječavaš indeksiranje admin panela.
                Izmjene su vidljive odmah na <span className="text-white/40">/robots.txt</span>.
              </p>
            </div>
            <RobotsLinks baseUrl={settings['sitemap.base_url'] || 'https://387cinematicweddings.com'} />
          </TechGroup>

          <p className="text-white/20 text-[10px] leading-relaxed pt-1">
            GA4 i GTM skripte se automatski ubacuju u stranicu čim sačuvaš. Stranica ne mora biti ponovo pokrenuta.
          </p>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
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

function SocialGroup({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="bg-moody-950/60 border border-white/5 rounded-sm p-5 space-y-4">
      <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold tracking-widest uppercase">
        {icon} {label}
      </div>
      {children}
    </div>
  );
}

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

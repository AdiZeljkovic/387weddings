import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Image, Loader2, Upload, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { invalidateSettingsCache } from '../../lib/settingsCache';

// ── Image catalogue ───────────────────────────────────────────────────────────
// key   → stored in site_settings
// fallback → shown if no custom image set yet (current Unsplash placeholders)

const SECTIONS = [
  {
    page: 'home', label: 'Naslovna',
    groups: [
      {
        label: 'Hero — Desktop', hint: 'Naslovna trenutno prikazuje samo Slajd 1. Preporučeno: 2400×1600 px, pejzažna (horizontalna) orijentacija. Slajdovi 2–5 se čuvaju za slideshow i trenutno se ne prikazuju.',
        images: [
          { key: 'img.home.hero.1', label: 'Slajd 1', fallback: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.hero.2', label: 'Slajd 2', fallback: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.hero.3', label: 'Slajd 3', fallback: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.hero.4', label: 'Slajd 4 (opcija)', fallback: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.hero.5', label: 'Slajd 5 (opcija)', fallback: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=800' },
        ],
      },
      {
        label: 'Hero — Mobilna verzija', hint: 'Naslovna na mobitelu prikazuje samo Mob slajd 1. Preporučeno: 900×1200 px, portretna (vertikalna) orijentacija. Ako se ostavi prazno, koristi se desktop slika.',
        images: [
          { key: 'img.home.hero.mobile.1', label: 'Mob slajd 1', fallback: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.hero.mobile.2', label: 'Mob slajd 2', fallback: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.hero.mobile.3', label: 'Mob slajd 3', fallback: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.hero.mobile.4', label: 'Mob slajd 4 (opcija)', fallback: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.hero.mobile.5', label: 'Mob slajd 5 (opcija)', fallback: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=800' },
        ],
      },
      {
        label: 'Istaknuti radovi — mozaik (9 slika)', hint: 'Mozaik uz naslov "Istaknuti radovi". Redovi 1 i 2 stoje desno od naslova, red 3 ide punom širinom. Preporučeno: 1400×1000 px, pejzažna orijentacija (slike se režu u okvir).',
        images: [
          { key: 'img.home.grid.1', label: 'Red 1 — lijevo',   fallback: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.grid.2', label: 'Red 1 — sredina',  fallback: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.grid.3', label: 'Red 1 — desno',    fallback: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.grid.4', label: 'Red 2 — lijevo (usko)', fallback: 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.grid.5', label: 'Red 2 — sredina (široko)', fallback: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.grid.6', label: 'Red 2 — desno',    fallback: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.grid.7', label: 'Red 3 — lijevo',   fallback: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.grid.8', label: 'Red 3 — sredina',  fallback: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.grid.9', label: 'Red 3 — desno',    fallback: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800' },
        ],
      },
      {
        label: 'Proces — fotografije koraka', hint: 'Slike uz tekstualne blokove u sekciji "Kako radimo". Preporučeno: 1200×1500 px.',
        images: [
          { key: 'img.home.process.1', label: 'Korak 01', fallback: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.process.2', label: 'Korak 02', fallback: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.process.3', label: 'Korak 03', fallback: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800' },
        ],
      },
      {
        label: 'Sekcija "O nama" na naslovnoj', hint: 'Dvije fotografije uz tekst "Više od fotografija". Velika je pejzažna (preporučeno 1600×1280 px), mala je portretna i preklapa njen donji lijevi ugao (preporučeno 600×800 px).',
        images: [
          { key: 'img.home.team.aldin',  label: 'Velika fotografija',            fallback: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.team.melisa', label: 'Mala fotografija (sa 387 oznakom)', fallback: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=800' },
        ],
      },
    ],
  },
  {
    page: 'portfolio', label: 'Radovi',
    groups: [
      {
        label: 'Hero pozadina', hint: 'Velika fotografija u pozadini header-a stranice "Radovi". Preporučeno: 2400×1600 px, pejzažna orijentacija.',
        images: [
          { key: 'img.portfolio.hero', label: 'Hero', fallback: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&q=80&w=800' },
        ],
      },
    ],
  },
  {
    page: 'about', label: 'O nama',
    groups: [
      {
        label: 'Portreti uz biografije', hint: 'Po jedan portret uz svaku biografiju. Prikazuju se crno-bijelo (sajt ih sam prebacuje), pa boja originala nije bitna. Preporučeno: 1100×1375 px, portretna orijentacija.',
        images: [
          { key: 'img.about.melisa', label: 'Portret uz biografiju 1', fallback: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.about.aldin',  label: 'Portret uz biografiju 2', fallback: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800' },
        ],
      },
      {
        label: 'Poziv na kontakt — tri fotografije', hint: 'Fotografije oko završnog bloka "Želimo čuti vašu priču". Prikazuju se samo na širim ekranima. Preporučeno: 900×1200 px, portretna orijentacija.',
        images: [
          { key: 'img.about.cta.1', label: 'Lijevo — velika',  fallback: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.about.cta.2', label: 'Lijevo — mala',    fallback: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.about.cta.3', label: 'Desno',            fallback: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&q=80&w=800' },
        ],
      },
    ],
  },
  {
    page: 'contact', label: 'Kontakt',
    groups: [
      {
        label: 'Hero fotografija', hint: 'Desktop verzija stoji desno od naslova (preporučeno 1400×950 px, pejzažna). Mobilna je zasebna da možeš izabrati uži kadar (preporučeno 800×900 px); ako je ostaviš praznu, koristi se desktop slika.',
        images: [
          { key: 'img.contact.hero', label: 'Hero', fallback: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.contact.hero.mobile', label: 'Hero — mobitel', fallback: '' },
        ],
      },
      {
        label: 'Ukrasna grančica (opciono)', hint: 'Ilustracija u gornjem lijevom uglu hero sekcije. Mora biti PNG ili SVG s prozirnom pozadinom, preporučeno 600×500 px. Ako se ostavi prazno, prikazuje se ugrađena maslinova grančica.',
        images: [
          { key: 'img.contact.ornament', label: 'Grančica', fallback: '' },
        ],
      },
    ],
  },
] as const;

type ImageKey = typeof SECTIONS[number]['groups'][number]['images'][number]['key'];

export default function ImagesManager() {
  const [urls, setUrls]       = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [openPages, setOpenPages] = useState<Record<string, boolean>>({ home: true, portfolio: true, services: true, about: true, contact: true });

  useEffect(() => {
    fetch('/api/settings', { credentials: 'include' })
      .then(r => r.json())
      .then((data: Record<string, string>) => {
        setUrls(data ?? {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const setUrl = (key: string, value: string) =>
    setUrls(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      // Only send image keys
      const imgKeys = Object.fromEntries(
        Object.entries(urls).filter(([k]) => k.startsWith('img.'))
      );
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(imgKeys),
      });
      invalidateSettingsCache();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const togglePage = (page: string) =>
    setOpenPages(prev => ({ ...prev, [page]: !prev[page] }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-white/20" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Fotografije stranica</h1>
        <p className="text-white/40 text-sm mt-1">
          Uploadaj vlastite fotografije ili unesi URL. Sve promjene važe odmah nakon čuvanja.
        </p>
      </div>

      {/* Sections */}
      {SECTIONS.map(section => (
        <div key={section.page} className="border border-white/8 rounded-sm overflow-hidden">
          {/* Page header / toggle */}
          <button
            onClick={() => togglePage(section.page)}
            className="w-full flex items-center justify-between px-5 py-4 bg-moody-950/80 hover:bg-moody-950 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Image size={15} className="text-gold-500/60" />
              <span className="text-white/70 text-sm font-bold tracking-widest uppercase">{section.label}</span>
              <span className="text-white/20 text-[10px] font-mono">
                /{section.page === 'home' ? '' : section.page}
              </span>
            </div>
            <ChevronDown
              size={15}
              className={cn('text-white/30 transition-transform duration-200', openPages[section.page] ? 'rotate-180' : '')}
            />
          </button>

          {openPages[section.page] && (
            <div className="divide-y divide-white/5">
              {section.groups.map(group => (
                <div key={group.label} className="px-5 py-5 space-y-4 bg-moody-950/40">
                  {/* Group label */}
                  <div>
                    <p className="text-white/50 text-xs font-bold tracking-widest uppercase mb-1">{group.label}</p>
                    <p className="text-white/20 text-[10px] leading-relaxed">{group.hint}</p>
                  </div>

                  {/* Images grid */}
                  <div className={cn(
                    'grid gap-4',
                    group.images.length === 1 ? 'grid-cols-1 max-w-xs' :
                    group.images.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                    group.images.length === 3 ? 'grid-cols-1 sm:grid-cols-3' :
                    'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                  )}>
                    {group.images.map(img => (
                      <ImageSlot
                        key={img.key}
                        imageKey={img.key}
                        label={img.label}
                        fallback={img.fallback}
                        value={urls[img.key] || ''}
                        onChange={v => setUrl(img.key, v)}
                        alt={urls[`${img.key}.alt`] || ''}
                        onAltChange={v => setUrl(`${img.key}.alt`, v)}
                        focus={urls[`${img.key}.focus`] || ''}
                        onFocusChange={v => setUrl(`${img.key}.focus`, v)}
                        portrait={img.key.includes('.mobile.')}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Save */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-gold-600/15 hover:bg-gold-600/25 border border-gold-600/25 hover:border-gold-600/40 text-gold-400 text-xs font-bold tracking-widest uppercase rounded-sm transition-all duration-200 disabled:opacity-40"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          {saving ? 'Čuvanje...' : saved ? 'Sačuvano!' : 'Sačuvaj sve fotografije'}
        </button>
      </div>
    </div>
  );
}

// ── ImageSlot ─────────────────────────────────────────────────────────────────

function ImageSlot({
  imageKey, label, fallback, value, onChange, alt, onAltChange, focus, onFocusChange, portrait = false,
}: {
  imageKey: string;
  label: string;
  fallback: string;
  value: string;
  onChange: (v: string) => void;
  alt: string;
  onAltChange: (v: string) => void;
  focus: string;
  onFocusChange: (v: string) => void;
  portrait?: boolean;
}) {
  const fileRef  = useRef<HTMLInputElement>(null);
  const [uploading, setUploading]       = useState(false);
  const [urlInput, setUrlInput]         = useState(value);
  const [altInput, setAltInput]         = useState(alt);
  const [picking, setPicking]           = useState(false);
  const [imgError, setImgError]         = useState(false);
  const [uploadError, setUploadError]   = useState<string | null>(null);

  // keep local URL input in sync when parent state changes (on initial load)
  useEffect(() => { setUrlInput(value); }, [value]);
  useEffect(() => { setAltInput(alt); }, [alt]);

  const displaySrc = (value || fallback);
  const focusPos = focus || '50% 50%';

  // Click the preview to say which part of the photo must stay in frame when
  // it gets cropped. Stored as a CSS object-position string.
  const pickFocus = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!picking) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * 100);
    const y = Math.round(((e.clientY - r.top) / r.height) * 100);
    onFocusChange(`${Math.min(100, Math.max(0, x))}% ${Math.min(100, Math.max(0, y))}%`);
    setPicking(false);
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/gallery/upload', {
        method: 'POST',
        credentials: 'include',
        body: fd,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server greška (${res.status})`);
      }
      const data = await res.json();
      onChange(data.url);
      setUrlInput(data.url);
      setImgError(false);
    } catch (err: any) {
      clearTimeout(timeout);
      const msg = err?.name === 'AbortError'
        ? 'Upload prekinut — server nije odgovorio na vrijeme.'
        : (err?.message || 'Upload nije uspio.');
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleUrlCommit = () => {
    onChange(urlInput.trim());
    setImgError(false);
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
    setImgError(false);
  };

  return (
    <div className="space-y-2">
      {/* Thumbnail */}
      <div
        className={cn("relative group rounded-sm overflow-hidden bg-moody-900 border border-white/10 cursor-pointer", portrait ? "aspect-[3/4]" : "aspect-[4/3]")}
        onClick={e => {
          if (uploading) return;
          if (picking) { pickFocus(e); return; }
          fileRef.current?.click();
        }}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-moody-950/80">
            <Loader2 size={20} className="animate-spin text-gold-400" />
          </div>
        ) : (
          <>
            {imgError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/20">
                <Image size={20} />
                <span className="text-[9px] uppercase tracking-wider">Slika nije dostupna</span>
              </div>
            ) : (
              <img
                src={displaySrc}
                alt={label}
                style={{ objectPosition: focusPos }}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
              />
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex flex-col items-center gap-1.5 text-white">
                <Upload size={16} />
                <span className="text-[9px] tracking-widest uppercase font-bold">Zamijeni</span>
              </div>
            </div>

            {/* Focus marker */}
            {focus && !picking && (
              <span
                aria-hidden="true"
                className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full border-2 border-gold-400 bg-black/30 pointer-events-none"
                style={{ left: focusPos.split(' ')[0], top: focusPos.split(' ')[1] }}
              />
            )}

            {/* Custom image indicator */}
            {value && (
              <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-gold-400 shadow-md" title="Vlastita slika" />
            )}

            {/* Focus picker toggle */}
            <button
              onClick={e => { e.stopPropagation(); setPicking(v => !v); }}
              className={`absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-sm text-[9px] tracking-wider uppercase transition-colors ${
                picking ? 'bg-gold-600 text-white' : 'bg-black/60 text-white/60 hover:text-white opacity-0 group-hover:opacity-100'
              }`}
              title="Odaberi tačku fokusa — dio slike koji mora ostati vidljiv pri izrezivanju"
            >
              {picking ? 'Klikni na sliku' : 'Fokus'}
            </button>

            {/* Clear button */}
            {value && (
              <button
                onClick={e => { e.stopPropagation(); handleClear(); }}
                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-white/60 hover:text-red-400 hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
                title="Vrati na podrazumijevanu"
              >
                <X size={10} />
              </button>
            )}
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
        />
      </div>

      {/* Upload error */}
      {uploadError && (
        <p className="text-red-400 text-[10px] leading-snug">{uploadError}</p>
      )}

      {/* Label */}
      <p className="text-white/40 text-[10px] tracking-widest uppercase font-bold">{label}</p>

      {/* URL input */}
      <div className="flex gap-1">
        <input
          type="text"
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onBlur={handleUrlCommit}
          onKeyDown={e => e.key === 'Enter' && handleUrlCommit()}
          placeholder="URL ili upload ↑"
          className="flex-1 min-w-0 bg-moody-900 border border-white/10 rounded-sm px-2 py-1.5 text-white/60 text-[10px] focus:outline-none focus:border-gold-600/40 transition-colors placeholder:text-white/15 font-mono"
        />
      </div>

      {/* Alt text — the audit found 11 of 12 homepage images without one */}
      <input
        type="text"
        value={altInput}
        onChange={e => setAltInput(e.target.value)}
        onBlur={() => onAltChange(altInput.trim())}
        onKeyDown={e => e.key === 'Enter' && onAltChange(altInput.trim())}
        placeholder="Opis slike (alt tekst)"
        className="w-full bg-moody-900 border border-white/10 rounded-sm px-2 py-1.5 text-white/60 text-[10px] focus:outline-none focus:border-gold-600/40 transition-colors placeholder:text-white/15"
      />
    </div>
  );
}

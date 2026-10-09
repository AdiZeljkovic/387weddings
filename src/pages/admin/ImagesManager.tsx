import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Image, Loader2, Upload, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { invalidateSettingsCache } from '../../lib/settingsCache';

// ── Image catalogue ───────────────────────────────────────────────────────────
// key   → stored in site_settings
// fallback → shown if no custom image set yet (current Unsplash placeholders)

// Every slot says where on the site it appears and the shape it is shown at,
// so the owner can choose a photograph that fits rather than one that gets
// cropped. The shapes follow the mockup boards. Groups for sections the site
// no longer has (a "Kako radimo" process strip, a Radovi hero, a Kontakt
// ornament image) were removed — nothing on the site read them.
const SECTIONS = [
  {
    page: 'home', label: 'Naslovna',
    groups: [
      {
        label: 'Hero — desktop',
        hint: 'Smjenjuju se svake 4 sekunde; prikazuju se samo slotovi koje napuniš. Hero prekriva cijeli ekran, pa obavezno postavi točku fokusa (lica, mladenci). Najbolje vodoravna fotografija, 2400 px ili više po dužoj strani.',
        images: [
          { key: 'img.home.hero.1', label: 'Slajd 1', ratio: '16:9 · cijeli ekran', fallback: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.hero.2', label: 'Slajd 2', ratio: '16:9 · cijeli ekran', fallback: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.hero.3', label: 'Slajd 3', ratio: '16:9 · cijeli ekran', fallback: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.hero.4', label: 'Slajd 4', ratio: '16:9 · cijeli ekran', fallback: 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.hero.5', label: 'Slajd 5', ratio: '16:9 · cijeli ekran', fallback: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800' },
        ],
      },
      {
        label: 'Hero — mobitel (opciono, uz svaki slot)',
        hint: 'Uspravni kadar istog slajda za uski ekran. Ako ostaviš prazno, koristi se desktop slika, ali na telefonu se od nje vidi samo uzak isječak.',
        images: [
          { key: 'img.home.hero.mobile.1', label: 'Mob slajd 1', ratio: '2:3 · uspravno', fallback: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.hero.mobile.2', label: 'Mob slajd 2', ratio: '2:3 · uspravno', fallback: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.hero.mobile.3', label: 'Mob slajd 3', ratio: '2:3 · uspravno', fallback: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.hero.mobile.4', label: 'Mob slajd 4', ratio: '2:3 · uspravno', fallback: 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.hero.mobile.5', label: 'Mob slajd 5', ratio: '2:3 · uspravno', fallback: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800' },
        ],
      },
      {
        label: 'Istaknuti radovi — mozaik (9 slika)',
        hint: 'Desktop: lijevo jedna velika uspravna, pa dva stupca po tri vodoravne, pa red od dvije ispod. Mobitel: široka, dvije, dvije, široka, dvije, široka. Omjer uz svaki slot je onaj u kojem se prikazuje na desktopu.',
        images: [
          { key: 'img.home.grid.1', label: '1 · velika lijevo', ratio: '2:3', fallback: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.grid.2', label: '2 · stupac 1, gore', ratio: '3:2', fallback: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.grid.3', label: '3 · stupac 1, sredina', ratio: '3:2', fallback: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.grid.4', label: '4 · stupac 1, dolje', ratio: '3:2', fallback: 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.grid.5', label: '5 · stupac 2, gore', ratio: '3:2', fallback: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.grid.6', label: '6 · stupac 2, sredina', ratio: '3:2', fallback: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.grid.7', label: '7 · stupac 2, dolje', ratio: '3:2', fallback: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.grid.8', label: '8 · donji red, široka', ratio: '5:2', fallback: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.grid.9', label: '9 · donji red, uska', ratio: '5:4', fallback: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800' },
        ],
      },
      {
        label: 'Sekcija "O nama" na naslovnoj',
        hint: 'Velika uspravna fotografija uz tekst "Više od fotografija", i mala koja na desktopu preklapa njen donji lijevi ugao (na mobitelu se ne prikazuje).',
        images: [
          { key: 'img.home.team.aldin', label: 'Velika fotografija', ratio: '4:5', fallback: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.home.team.melisa', label: 'Mala fotografija (detalj)', ratio: '2:3', fallback: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=800' },
        ],
      },
    ],
  },
  {
    page: 'about', label: 'O nama',
    groups: [
      {
        label: 'Portreti uz biografije',
        hint: 'Po jedan portret uz svaku biografiju, u boji kako ga učitaš.',
        images: [
          { key: 'img.about.melisa', label: 'Portret uz biografiju 1', ratio: '4:5', fallback: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.about.aldin', label: 'Portret uz biografiju 2', ratio: '3:4', fallback: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800' },
        ],
      },
      {
        label: 'Poziv "Želimo čuti vašu priču" — tri fotografije',
        hint: 'Na desktopu stoje oko teksta (velika lijevo, mala preklapa njen donji desni ugao, visoka desno); na mobitelu tri u redu iznad teksta.',
        images: [
          { key: 'img.about.cta.1', label: 'Lijevo — velika', ratio: '3:4', fallback: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.about.cta.2', label: 'Lijevo — mala', ratio: '3:4', fallback: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.about.cta.3', label: 'Desno — visoka', ratio: '3:4', fallback: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&q=80&w=800' },
        ],
      },
    ],
  },
  {
    page: 'contact', label: 'Kontakt',
    groups: [
      {
        label: 'Hero fotografija',
        hint: 'Desktop slika stoji desno od naslova i stapa se u pozadinu. Mobilna je zasebna, da za uski ekran izabereš kadar koji odgovara; ako je ostaviš praznu, koristi se desktop slika.',
        images: [
          { key: 'img.contact.hero', label: 'Hero — desktop', ratio: '3:2', fallback: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800' },
          { key: 'img.contact.hero.mobile', label: 'Hero — mobitel', ratio: '16:9', fallback: '' },
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
  const [openPages, setOpenPages] = useState<Record<string, boolean>>({ home: true, about: true, contact: true });

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
                        ratio={img.ratio}
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
  imageKey, label, fallback, value, onChange, alt, onAltChange, focus, onFocusChange, ratio,
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
  /** The shape the site shows this slot at, e.g. "3:4" or "16:9 · cijeli ekran" */
  ratio: string;
}) {
  const fileRef  = useRef<HTMLInputElement>(null);
  const imgRef   = useRef<HTMLImageElement>(null);
  // "3:4 · uspravno" -> 3 / 4, for the preview box
  const [rw, rh] = (ratio.match(/(\d+):(\d+)/)?.slice(1).map(Number) ?? [4, 3]) as number[];
  const [uploading, setUploading]       = useState(false);
  const [urlInput, setUrlInput]         = useState(value);
  const [altInput, setAltInput]         = useState(alt);
  const [picking, setPicking]           = useState(false);
  const [imgError, setImgError]         = useState(false);
  const [uploadError, setUploadError]   = useState<string | null>(null);
  const [notice, setNotice]             = useState<string | null>(null);

  // keep local URL input in sync when parent state changes (on initial load)
  useEffect(() => { setUrlInput(value); }, [value]);
  useEffect(() => { setAltInput(alt); }, [alt]);

  const displaySrc = (value || fallback);
  const focusPos = focus || '50% 50%';

  // Click the preview to say which part of the photo must stay in frame when
  // it gets cropped. Stored as a CSS object-position string.
  const pickFocus = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!picking) return;
    const box = e.currentTarget.getBoundingClientRect();
    const im = imgRef.current;
    // Where the whole photograph sits inside the box while it is shown uncropped
    let left = box.left, top = box.top, w = box.width, h = box.height;
    if (im && im.naturalWidth && im.naturalHeight) {
      const scale = Math.min(box.width / im.naturalWidth, box.height / im.naturalHeight);
      w = im.naturalWidth * scale;
      h = im.naturalHeight * scale;
      left = box.left + (box.width - w) / 2;
      top = box.top + (box.height - h) / 2;
    }
    const x = Math.round(((e.clientX - left) / w) * 100);
    const y = Math.round(((e.clientY - top) / h) * 100);
    if (x < 0 || x > 100 || y < 0 || y > 100) return;  // a click beside the photo
    onFocusChange(`${x}% ${y}%`);
    setPicking(false);
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180_000);
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
      // The original is kept as sent, so a small file stays small — say so
      // rather than letting it look soft on a big screen later.
      setNotice(
        data.warning
          || (data.width ? `Učitano u originalu: ${data.width}×${data.height} px.` : null)
      );
    } catch (err: any) {
      clearTimeout(timeout);
      const msg = err?.name === 'AbortError'
        ? 'Upload prekinut — server nije odgovorio na vrijeme.'
        : (err?.message || 'Upload nije uspio.');
      setUploadError(msg);
      setNotice(null);
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
        className={cn("relative group rounded-sm overflow-hidden bg-moody-900 border border-white/10", picking ? "cursor-crosshair" : "cursor-pointer")}
        style={{ aspectRatio: `${rw} / ${rh}` }}
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
                ref={imgRef}
                src={displaySrc}
                alt={label}
                // Uncropped while choosing the focal point, cropped as the
                // site will show it the rest of the time
                style={picking ? undefined : { objectPosition: focusPos }}
                className={cn('w-full h-full', picking ? 'object-contain' : 'object-cover')}
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
      {notice && !uploadError && (
        <p className="text-gold-500/80 text-[10px] leading-snug">{notice}</p>
      )}
      {uploadError && (
        <p className="text-red-400 text-[10px] leading-snug">{uploadError}</p>
      )}

      {/* Label, and the shape the site shows this slot at */}
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-white/40 text-[10px] tracking-widest uppercase font-bold">{label}</p>
        <span className="flex-none text-gold-500/70 text-[9px] tracking-wider" title="Omjer u kojem se slika prikazuje na sajtu">
          {ratio}
        </span>
      </div>

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

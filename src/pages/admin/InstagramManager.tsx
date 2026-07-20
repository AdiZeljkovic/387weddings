import React, { useEffect, useRef, useState } from 'react';
import { AtSign, Check, Image, Instagram, Loader2, Type, Upload, X, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import { invalidateSettingsCache } from '../../lib/settingsCache';

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({
  label, placeholder, value, onChange, hint, type = 'text',
}: {
  label: string; placeholder?: string; value: string;
  onChange: (v: string) => void; hint?: string; type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-white/50 text-[10px] font-bold tracking-widest uppercase block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-moody-900 border border-white/10 rounded-sm px-3 py-2 text-white/80 text-sm focus:outline-none focus:border-gold-600/40 transition-colors placeholder:text-white/15"
      />
      {hint && <p className="text-white/25 text-[10px] leading-relaxed">{hint}</p>}
    </div>
  );
}

// ── InstagramSlot ─────────────────────────────────────────────────────────────
function InstagramSlot({
  n, value, onChange,
}: { n: number; value: string; onChange: (v: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(value);
  const [imgError, setImgError] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => { setUrlInput(value); }, [value]);

  const FALLBACK = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=400';
  const displaySrc = value || FALLBACK;

  const handleFile = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/gallery/upload', {
        method: 'POST', credentials: 'include', body: fd, signal: controller.signal,
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
      setUploadError(err?.name === 'AbortError' ? 'Upload prekinut.' : (err?.message || 'Upload nije uspio.'));
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleUrlCommit = () => { onChange(urlInput.trim()); setImgError(false); };
  const handleClear = () => { onChange(''); setUrlInput(''); setImgError(false); };

  return (
    <div className="space-y-1.5">
      {/* Square preview */}
      <div
        className="relative group aspect-square rounded-sm overflow-hidden bg-moody-900 border border-white/8 cursor-pointer"
        onClick={() => !uploading && fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-moody-950/80">
            <Loader2 size={18} className="animate-spin text-gold-400" />
          </div>
        ) : (
          <>
            {imgError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-white/20">
                <Image size={18} />
                <span className="text-[8px] uppercase tracking-wider text-center px-2">Slika nedostupna</span>
              </div>
            ) : (
              <img
                src={displaySrc}
                alt={`Instagram ${n}`}
                className={cn('w-full h-full object-cover transition-all duration-700', !value && 'opacity-20 grayscale')}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
              />
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-200 flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
              <Upload size={16} className="text-white" />
              <span className="text-[8px] tracking-widest uppercase font-bold text-white">Zamijeni</span>
            </div>

            {/* Custom image dot */}
            {value && <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-gold-400 shadow" />}

            {/* Clear */}
            {value && (
              <button
                onClick={e => { e.stopPropagation(); handleClear(); }}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center text-white/60 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                title="Ukloni sliku"
              >
                <X size={9} />
              </button>
            )}

            {/* Position number */}
            <div className="absolute bottom-1 left-1 text-[7px] font-bold text-white/30 tracking-wider">
              {String(n).padStart(2, '0')}
            </div>
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
      {uploadError && <p className="text-red-400 text-[9px] leading-snug">{uploadError}</p>}

      {/* URL input */}
      <input
        type="text"
        value={urlInput}
        onChange={e => setUrlInput(e.target.value)}
        onBlur={handleUrlCommit}
        onKeyDown={e => e.key === 'Enter' && handleUrlCommit()}
        placeholder="URL ili upload ↑"
        className="w-full bg-moody-900 border border-white/8 rounded-sm px-2 py-1 text-white/50 text-[9px] focus:outline-none focus:border-gold-600/30 transition-colors placeholder:text-white/12 font-mono"
      />
    </div>
  );
}

// ── InstagramManager ──────────────────────────────────────────────────────────
export default function InstagramManager() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings', { credentials: 'include' })
      .then(r => r.json())
      .then((data: Record<string, string>) => { setSettings(data ?? {}); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const set = (key: string, value: string) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const keys = [
        'instagram', 'instagram_handle',
        'instagram_section_tag', 'instagram_section_heading',
        ...([1,2,3,4,5,6,7,8].map(n => `img.instagram.${n}`)),
      ];
      const payload = Object.fromEntries(keys.map(k => [k, settings[k] ?? '']));
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      invalidateSettingsCache();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handle = settings['instagram_handle'] || '387.weddings';
  const profileUrl = settings['instagram'] || '';
  const filledCount = [1,2,3,4,5,6,7,8].filter(n => settings[`img.instagram.${n}`]).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-white/20" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Instagram size={18} className="text-gold-400" />
            Instagram Feed
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Ručno postavljaj slike koje se prikazuju u Instagram sekciji na svim stranicama sajta.
          </p>
        </div>
        {profileUrl && (
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase font-bold text-gold-400/60 hover:text-gold-400 transition-colors shrink-0 mt-1"
          >
            <ExternalLink size={12} />
            Otvori profil
          </a>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-3 bg-moody-950/60 border border-white/5 rounded-sm px-5 py-3">
        <Instagram size={14} className="text-gold-400/60" />
        <span className="text-white/50 text-xs">@{handle}</span>
        <span className="text-white/15 text-xs">•</span>
        <span className="text-white/30 text-[10px]">
          {filledCount}/8 slika postavljeno
        </span>
        <div className="ml-auto flex gap-1">
          {[1,2,3,4,5,6,7,8].map(n => (
            <div
              key={n}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-colors',
                settings[`img.instagram.${n}`] ? 'bg-gold-400' : 'bg-white/10'
              )}
            />
          ))}
        </div>
      </div>

      {/* Profil */}
      <div className="bg-moody-950/60 border border-white/5 rounded-sm p-6 space-y-4">
        <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold tracking-widest uppercase">
          <AtSign size={12} /> Profil
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Korisničko ime (bez @)"
            placeholder="387.weddings"
            value={settings['instagram_handle'] ?? ''}
            onChange={v => set('instagram_handle', v)}
            hint="Prikazuje se kao @korisničkoime u feedu i footeru."
          />
          <Field
            label="URL Instagram profila"
            placeholder="https://instagram.com/387.weddings"
            value={settings['instagram'] ?? ''}
            onChange={v => set('instagram', v)}
            hint="Klikom na slike vodi na ovaj profil."
          />
        </div>
      </div>

      {/* Tekst sekcije */}
      <div className="bg-moody-950/60 border border-white/5 rounded-sm p-6 space-y-4">
        <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold tracking-widest uppercase">
          <Type size={12} /> Tekst sekcije (prikazuje se iznad feeda)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label='Tag (mali tekst iznad naslova)'
            placeholder="Social"
            value={settings['instagram_section_tag'] ?? ''}
            onChange={v => set('instagram_section_tag', v)}
          />
          <Field
            label='Naslov sekcije'
            placeholder="Follow Our Journey"
            value={settings['instagram_section_heading'] ?? ''}
            onChange={v => set('instagram_section_heading', v)}
          />
        </div>
      </div>

      {/* Slike feeda */}
      <div className="bg-moody-950/60 border border-white/5 rounded-sm p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold tracking-widest uppercase">
            <Image size={12} /> Slike feeda
          </div>
          <span className="text-white/20 text-[9px]">Klikni na sliku ili drag & drop</span>
        </div>
        <p className="text-white/20 text-[10px] leading-relaxed mb-5">
          8 slika koje se prikazuju u redu s lijeva nadesno. Preporučeno: 800×800 px, kvadratna orijentacija.
        </p>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {[1,2,3,4,5,6,7,8].map(n => (
            <InstagramSlot
              key={n}
              n={n}
              value={settings[`img.instagram.${n}`] ?? ''}
              onChange={v => set(`img.instagram.${n}`, v)}
            />
          ))}
        </div>

        {/* Preview hint */}
        <p className="text-white/15 text-[9px] mt-4 leading-relaxed">
          Slike bez postavljene URL-a prikazuju placeholder na sajtu. Gold tačka = vlastita slika postavljena.
        </p>
      </div>

      {/* API napomena */}
      <div className="border border-white/5 rounded-sm p-4 bg-moody-950/30">
        <p className="text-white/25 text-[10px] leading-relaxed">
          <strong className="text-white/40">Zašto ručno?</strong> Instagram API zahtijeva OAuth autorizaciju putem Facebook Developer naloga.
          Za potpunu automatsku sinkronizaciju potrebno je registrovati aplikaciju na Meta for Developers.
          Preporučeno: ažuriraj slike svake 1–2 sedmice.
        </p>
      </div>

      {/* Save */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-gold-600/15 hover:bg-gold-600/25 border border-gold-600/25 hover:border-gold-600/40 text-gold-400 text-xs font-bold tracking-widest uppercase rounded-sm transition-all duration-200 disabled:opacity-40"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          {saving ? 'Čuvanje...' : saved ? 'Sačuvano!' : 'Sačuvaj'}
        </button>
      </div>
    </div>
  );
}

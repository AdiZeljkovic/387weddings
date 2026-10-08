import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Plus, Trash2, Upload, Loader2, Eye, EyeOff, ChevronDown, ChevronUp,
  Images, X, ArrowUp, ArrowDown, ExternalLink,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const CATEGORIES = [
  { value: 'WEDDINGS',  label: 'Vjenčanje' },
  { value: 'STUDIO',    label: 'Studio' },
  { value: 'PORTRAITS', label: 'Portreti' },
];
const LAYOUTS = [
  { value: 'TALL',   label: 'Portretna 3:4' },
  { value: 'WIDE',   label: 'Pejzažna 4:3' },
  { value: 'SQUARE', label: 'Kvadrat 1:1' },
];

interface StoryImage {
  id: number;
  url: string;
  alt: string | null;
  caption: string | null;
  layout: string;
  sort_order: number;
}

interface Story {
  id: number;
  slug: string;
  couple: string;
  category: string;
  location: string | null;
  date_text: string | null;
  tag: string | null;
  cover_url: string | null;
  cover_alt: string | null;
  cover_layout: string;
  quote_bs: string | null; quote_en: string | null;
  text_bs: string | null;  text_en: string | null;
  sort_order: number;
  is_published: boolean;
  image_count?: string;
}

const EMPTY = {
  couple: '', slug: '', category: 'WEDDINGS', location: '', date_text: '', tag: '',
  cover_url: '', cover_alt: '', cover_layout: 'TALL',
  quote_bs: '', quote_en: '', text_bs: '', text_en: '',
  sort_order: 0, is_published: true,
};

const field = 'w-full bg-moody-950/60 border border-white/10 rounded-sm px-3 py-2.5 text-sm text-white/85 placeholder:text-white/20 outline-none focus:border-gold-600 transition-colors';
const labelCls = 'block text-[10px] tracking-[0.2em] uppercase text-white/35 mb-1.5';

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div>
    <label className={labelCls}>{label}</label>
    {children}
    {hint && <p className="text-[10px] text-white/25 mt-1.5 leading-relaxed">{hint}</p>}
  </div>
);

export default function StoriesManager() {
  const [items, setItems] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);

  // Gallery editor, one story at a time
  const [openGallery, setOpenGallery] = useState<number | null>(null);
  const [gallery, setGallery] = useState<StoryImage[]>([]);
  const [galleryBusy, setGalleryBusy] = useState(false);
  const galleryRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stories/admin/all', { credentials: 'include' });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError('Učitavanje nije uspjelo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const upload = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append('image', file);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const res = await fetch('/api/gallery/upload', {
        method: 'POST', credentials: 'include', body: fd, signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Upload nije uspio.'); return null; }
      return data.url as string;
    } catch (err) {
      clearTimeout(timeout);
      setError((err as Error).name === 'AbortError'
        ? 'Upload je trajao predugo — pokušaj ponovo.'
        : 'Upload nije uspio.');
      return null;
    }
  };

  const onCoverPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await upload(file);
    if (url) setForm(f => ({ ...f, cover_url: url }));
    setUploading(false);
    if (coverRef.current) coverRef.current.value = '';
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.couple.trim()) { setError('Ime para je obavezno.'); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(editingId ? `/api/stories/${editingId}` : '/api/stories', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Spremanje nije uspjelo.'); return; }
      setForm({ ...EMPTY });
      setEditingId(null);
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const edit = (s: Story) => {
    setEditingId(s.id);
    setForm({
      couple: s.couple, slug: s.slug, category: s.category,
      location: s.location ?? '', date_text: s.date_text ?? '', tag: s.tag ?? '',
      cover_url: s.cover_url ?? '', cover_alt: s.cover_alt ?? '', cover_layout: s.cover_layout ?? 'TALL',
      quote_bs: s.quote_bs ?? '', quote_en: s.quote_en ?? '',
      text_bs: s.text_bs ?? '', text_en: s.text_en ?? '',
      sort_order: s.sort_order, is_published: s.is_published,
    });
    setShowForm(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (s: Story) => {
    if (!confirm(`Trajno obrisati priču "${s.couple}" i sve njene fotografije?`)) return;
    await fetch(`/api/stories/${s.id}`, { method: 'DELETE', credentials: 'include' });
    load();
  };

  const togglePublished = async (s: Story) => {
    await fetch(`/api/stories/${s.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...s, is_published: !s.is_published }),
    });
    load();
  };

  // ── Gallery ───────────────────────────────────────────────────────────────
  const loadGallery = useCallback(async (id: number) => {
    setGalleryBusy(true);
    try {
      const res = await fetch(`/api/stories/admin/${id}/images`, { credentials: 'include' });
      const data = await res.json();
      setGallery(Array.isArray(data) ? data : []);
    } catch {
      setGallery([]);
    } finally {
      setGalleryBusy(false);
    }
  }, []);

  const openStoryGallery = async (id: number) => {
    if (openGallery === id) { setOpenGallery(null); return; }
    setOpenGallery(id);
    await loadGallery(id);
  };

  const addImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || openGallery === null) return;
    setGalleryBusy(true);
    let order = gallery.length;
    for (const file of files) {
      const url = await upload(file);
      if (!url) continue;
      await fetch(`/api/stories/${openGallery}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url, layout: 'TALL', sort_order: order++ }),
      });
    }
    if (galleryRef.current) galleryRef.current.value = '';
    await loadGallery(openGallery);
    await load();
    setGalleryBusy(false);
  };

  const patchImage = async (img: StoryImage, patch: Partial<StoryImage>) => {
    setGallery(g => g.map(x => (x.id === img.id ? { ...x, ...patch } : x)));
    await fetch(`/api/stories/images/${img.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...img, ...patch }),
    });
  };

  const moveImage = async (idx: number, dir: -1 | 1) => {
    const next = [...gallery];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setGallery(next);
    await Promise.all(next.map((img, i) =>
      fetch(`/api/stories/images/${img.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...img, sort_order: i }),
      })
    ));
  };

  const deleteImage = async (img: StoryImage) => {
    if (!confirm('Obrisati ovu fotografiju iz priče?')) return;
    setGallery(g => g.filter(x => x.id !== img.id));
    await fetch(`/api/stories/images/${img.id}`, { method: 'DELETE', credentials: 'include' });
    load();
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-serif font-light text-white mb-1.5">Priče</h1>
          <p className="text-white/35 text-xs leading-relaxed max-w-xl">
            Svaka priča je jedan par. Pojavljuje se kao kartica na stranici <strong className="text-white/50">Radovi</strong>,
            a klik otvara njenu stranicu. Broj 01–09 na kartici računa se sam iz redoslijeda.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setEditingId(null); setForm({ ...EMPTY }); setError(null); }}
          className="flex-none flex items-center gap-2 bg-gold-600 hover:bg-gold-500 text-white px-4 py-2.5 rounded-sm text-xs tracking-[0.2em] uppercase font-bold transition-colors"
        >
          <Plus size={14} /> Nova priča
        </button>
      </div>

      {error && (
        <div className="mb-5 bg-red-500/10 border border-red-500/25 text-red-300 text-xs rounded-sm px-4 py-3">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={save} className="bg-moody-900/60 border border-white/10 rounded-sm p-5 mb-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Ime para *" hint="Napiši ga s & — na sajtu se & prikazuje u kurzivu i crvenoj.">
              <input className={field} placeholder="Amra & Tarik" value={form.couple}
                onChange={e => setForm(f => ({ ...f, couple: e.target.value }))} />
            </Field>
            <Field label="Adresa stranice (slug)" hint="Ostavi prazno i napravit će se iz imena para.">
              <input className={field} placeholder="amra-i-tarik" value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
            </Field>
            <Field label="Kategorija">
              <select className={field} value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Lokacija"><input className={field} placeholder="Jahorina" value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></Field>
            <Field label="Datum" hint="Slobodan tekst, npr. 14. juni 2025.">
              <input className={field} placeholder="14. juni 2025." value={form.date_text}
                onChange={e => setForm(f => ({ ...f, date_text: e.target.value }))} /></Field>
            <Field label="Oznaka"><input className={field} placeholder="Foto i video" value={form.tag}
              onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} /></Field>
          </div>

          <div className="border-t border-white/5 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Naslovna fotografija" hint="Preporučeno 1400×1050 px. Prikazuje se na kartici i na vrhu priče.">
              <div className="flex items-center gap-3">
                <input className={field} placeholder="/uploads/..." value={form.cover_url}
                  onChange={e => setForm(f => ({ ...f, cover_url: e.target.value }))} />
                <input ref={coverRef} type="file" accept="image/*" onChange={onCoverPick} className="hidden" id="cover-pick" />
                <label htmlFor="cover-pick"
                  className="flex-none flex items-center gap-2 bg-moody-800 hover:bg-moody-700 border border-white/10 text-white/70 px-3 py-2.5 rounded-sm text-xs cursor-pointer transition-colors">
                  {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} Učitaj
                </label>
              </div>
            </Field>
            <Field label="Alt tekst naslovne" hint="Kratki opis za čitače ekrana i Google.">
              <input className={field} placeholder="Mladenci na Jahorini" value={form.cover_alt}
                onChange={e => setForm(f => ({ ...f, cover_alt: e.target.value }))} /></Field>
            <Field label="Omjer kartice">
              <select className={field} value={form.cover_layout}
                onChange={e => setForm(f => ({ ...f, cover_layout: e.target.value }))}>
                {LAYOUTS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </Field>
            <Field label="Redoslijed" hint="Manji broj ide prije. Određuje i broj na kartici.">
              <input type="number" className={field} value={form.sort_order}
                onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} /></Field>
          </div>

          <div className="border-t border-white/5 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Uvodni citat (BOS)"><textarea rows={2} className={field} value={form.quote_bs}
              onChange={e => setForm(f => ({ ...f, quote_bs: e.target.value }))} /></Field>
            <Field label="Uvodni citat (ENG)"><textarea rows={2} className={field} value={form.quote_en}
              onChange={e => setForm(f => ({ ...f, quote_en: e.target.value }))} /></Field>
            <Field label="Tekst priče (BOS)" hint="Prazan red razdvaja pasuse.">
              <textarea rows={5} className={field} value={form.text_bs}
                onChange={e => setForm(f => ({ ...f, text_bs: e.target.value }))} /></Field>
            <Field label="Tekst priče (ENG)" hint="Prazan red razdvaja pasuse.">
              <textarea rows={5} className={field} value={form.text_en}
                onChange={e => setForm(f => ({ ...f, text_en: e.target.value }))} /></Field>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-5">
            <label className="flex items-center gap-2.5 text-xs text-white/60 cursor-pointer">
              <input type="checkbox" checked={form.is_published} className="accent-gold-600 w-4 h-4"
                onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} />
              Objavljeno na sajtu
            </label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
                className="text-white/40 hover:text-white/70 text-xs px-3 py-2.5 transition-colors">Odustani</button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 bg-gold-600 hover:bg-gold-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-sm text-xs tracking-[0.2em] uppercase font-bold transition-colors">
                {saving && <Loader2 size={13} className="animate-spin" />}
                {editingId ? 'Sačuvaj izmjene' : 'Dodaj priču'}
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white/[0.03] rounded-sm animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-sm">
          <p className="text-white/35 text-sm mb-1">Još nema nijedne priče.</p>
          <p className="text-white/20 text-xs">Dok ih nema, Radovi prikazuju stare fotografije iz Galerije.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((s, i) => (
            <div key={s.id} className="bg-moody-900/40 border border-white/5 rounded-sm overflow-hidden">
              <div className="flex items-center gap-4 p-3">
                <span className="text-gold-600 text-xs font-medium tracking-[0.2em] w-7 flex-none">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="w-14 h-14 flex-none bg-moody-950 rounded-sm overflow-hidden">
                  {s.cover_url && <img src={s.cover_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-white/85 text-sm truncate">{s.couple}</div>
                  <div className="text-white/30 text-[11px] truncate">
                    {CATEGORIES.find(c => c.value === s.category)?.label}
                    {s.location ? ` · ${s.location}` : ''} · /prica/{s.slug} · {s.image_count ?? 0} fotografija
                  </div>
                </div>

                <button onClick={() => togglePublished(s)}
                  title={s.is_published ? 'Sakrij sa sajta' : 'Objavi'}
                  className={cn('flex-none p-2 rounded-sm transition-colors',
                    s.is_published ? 'text-gold-400 hover:bg-white/5' : 'text-white/20 hover:text-white/50')}>
                  {s.is_published ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                {s.is_published && (
                  <a href={`/prica/${s.slug}`} target="_blank" rel="noopener noreferrer" title="Otvori na sajtu"
                    className="flex-none p-2 text-white/25 hover:text-white/60 transition-colors"><ExternalLink size={15} /></a>
                )}
                <button onClick={() => openStoryGallery(s.id)}
                  className="flex-none flex items-center gap-1.5 text-white/50 hover:text-white text-xs px-2.5 py-2 transition-colors">
                  <Images size={14} /> Galerija
                  {openGallery === s.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                <button onClick={() => edit(s)}
                  className="flex-none text-white/50 hover:text-white text-xs px-2.5 py-2 transition-colors">Uredi</button>
                <button onClick={() => remove(s)}
                  className="flex-none p-2 text-white/20 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
              </div>

              {openGallery === s.id && (
                <div className="border-t border-white/5 p-4 bg-moody-950/40">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <p className="text-white/30 text-[11px]">
                      Redoslijed određuje kako se slažu u galeriji i u lightboxu. Natpis je opcionalan.
                    </p>
                    <input ref={galleryRef} type="file" accept="image/*" multiple onChange={addImages}
                      className="hidden" id={`gal-${s.id}`} />
                    <label htmlFor={`gal-${s.id}`}
                      className="flex-none flex items-center gap-2 bg-moody-800 hover:bg-moody-700 border border-white/10 text-white/70 px-3 py-2 rounded-sm text-xs cursor-pointer transition-colors">
                      {galleryBusy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} Dodaj fotografije
                    </label>
                  </div>

                  {gallery.length === 0 ? (
                    <p className="text-white/20 text-xs py-6 text-center">Galerija je prazna.</p>
                  ) : (
                    <div className="space-y-2">
                      {gallery.map((img, idx) => (
                        <div key={img.id} className="flex items-center gap-3 bg-moody-900/50 rounded-sm p-2">
                          <div className="w-11 h-11 flex-none bg-moody-950 rounded-sm overflow-hidden">
                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                          </div>
                          <input className={`${field} py-1.5 text-xs`} placeholder="Alt tekst (opis slike)"
                            value={img.alt ?? ''} onChange={e => patchImage(img, { alt: e.target.value })} />
                          <input className={`${field} py-1.5 text-xs`} placeholder="Natpis u lightboxu (opcionalno)"
                            value={img.caption ?? ''} onChange={e => patchImage(img, { caption: e.target.value })} />
                          <select className={`${field} py-1.5 text-xs w-36 flex-none`} value={img.layout}
                            onChange={e => patchImage(img, { layout: e.target.value })}>
                            {LAYOUTS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                          </select>
                          <div className="flex-none flex items-center">
                            <button onClick={() => moveImage(idx, -1)} disabled={idx === 0}
                              className="p-1.5 text-white/30 hover:text-white disabled:opacity-20"><ArrowUp size={13} /></button>
                            <button onClick={() => moveImage(idx, 1)} disabled={idx === gallery.length - 1}
                              className="p-1.5 text-white/30 hover:text-white disabled:opacity-20"><ArrowDown size={13} /></button>
                            <button onClick={() => deleteImage(img)}
                              className="p-1.5 text-white/20 hover:text-red-400"><X size={13} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

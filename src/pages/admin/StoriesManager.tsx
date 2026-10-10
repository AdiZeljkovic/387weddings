import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Plus, Trash2, Upload, Loader2, Eye, EyeOff, ChevronDown, ChevronUp,
  Images, X, ArrowUp, ArrowDown, ExternalLink,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { FanBoard, FocusPicker, FanFullDialog } from '../../components/admin/FanAdmin';

const CATEGORIES = [
  { value: 'WEDDINGS',  label: 'Vjenčanje' },
  { value: 'STUDIO',    label: 'Studio' },
  { value: 'PORTRAITS', label: 'Portreti' },
];
// AUTO follows the photograph's own shape; the other three are a fixed frame
// the owner picks, cropped around the focal point
const LAYOUTS = [
  { value: 'AUTO',   label: 'Automatski — prema fotografiji' },
  { value: 'TALL',   label: 'Uspravna 3:4' },
  { value: 'WIDE',   label: 'Vodoravna 4:3' },
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
  tag_bs?: string | null;
  tag_en?: string | null;
  cover_focus?: string | null;
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
  fan_order?: number | null;
  fan_image?: string | null;
  fan_focus?: string | null;
  cover_width?: number | null;
  cover_height?: number | null;
  fan_width?: number | null;
  fan_height?: number | null;
}

// The same rule the server uses, so the address shown is the one it will get
const slugify = (input: string) =>
  String(input)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 150);

const EMPTY = {
  couple: '', slug: '', category: 'WEDDINGS', location: '', date_text: '', tag: '',
  tag_bs: '', tag_en: '', cover_focus: '',
  cover_url: '', cover_alt: '', cover_layout: 'AUTO',
  quote_bs: '', quote_en: '', text_bs: '', text_en: '',
  sort_order: 0, is_published: true,
  fan_on: false, fan_order: 0, fan_image: '', fan_focus: '',
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
  const fanRef = useRef<HTMLInputElement>(null);
  // The address follows the title until the owner types one of their own
  const [slugAuto, setSlugAuto] = useState(true);
  // Pixel size of the cover and the fan picture, to warn about a crop
  const [coverSize, setCoverSize] = useState<{ w: number; h: number } | null>(null);
  const [fanSize, setFanSize] = useState<{ w: number; h: number } | null>(null);
  const [fanFull, setFanFull] = useState<{ id: number; couple: string; fan_order: number }[] | null>(null);

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

  const upload = async (file: File): Promise<{ url: string; w?: number; h?: number } | null> => {
    const fd = new FormData();
    fd.append('image', file);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180_000);
    try {
      const res = await fetch('/api/gallery/upload', {
        method: 'POST', credentials: 'include', body: fd, signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Upload nije uspio.'); return null; }
      if (data.warning) setError(data.warning);
      return { url: data.url as string, w: data.width, h: data.height };
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
    const up = await upload(file);
    if (up) { setForm(f => ({ ...f, cover_url: up.url })); setCoverSize(up.w && up.h ? { w: up.w, h: up.h } : null); }
    setUploading(false);
    if (coverRef.current) coverRef.current.value = '';
  };

  const onFanPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const up = await upload(file);
    if (up) { setForm(f => ({ ...f, fan_image: up.url })); setFanSize(up.w && up.h ? { w: up.w, h: up.h } : null); }
    setUploading(false);
    if (fanRef.current) fanRef.current.value = '';
  };

  const reorderFan = async (ids: number[]) => {
    setItems(list => list.map(x => ({ ...x, fan_order: ids.includes(x.id) ? ids.indexOf(x.id) + 1 : x.fan_order })));
    await fetch('/api/stories/admin/fan', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ ids }),
    });
    load();
  };

  const save = async (e?: React.FormEvent, replace?: number) => {
    e?.preventDefault();
    if (!form.couple.trim()) { setError('Ime para je obavezno.'); return; }
    if (form.fan_on && !form.fan_image && !form.cover_url) {
      setError('Za lepezu treba slika: postavi "Sliku za lepezu" ili naslovnu fotografiju.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(editingId ? `/api/stories/${editingId}` : '/api/stories', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          slug: slugAuto ? '' : form.slug,
          fan_order: form.fan_on ? (form.fan_order || null) : null,
          fan_replace: replace ?? null,
        }),
      });
      const data = await res.json();
      // Never a sixth story added quietly: ask which one makes room
      if (res.status === 409 && data.error === 'fan_full') { setFanFull(data.fan); return; }
      if (!res.ok) { setError(data.error || 'Spremanje nije uspjelo.'); return; }
      setFanFull(null);
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
    setSlugAuto(s.slug === slugify(s.couple));
    setCoverSize(s.cover_width && s.cover_height ? { w: s.cover_width, h: s.cover_height } : null);
    setFanSize(s.fan_width && s.fan_height ? { w: s.fan_width, h: s.fan_height } : null);
    setForm({
      couple: s.couple, slug: s.slug, category: s.category,
      tag_bs: s.tag_bs || s.tag || '', tag_en: s.tag_en || s.tag || '',
      cover_focus: s.cover_focus || '',
      location: s.location ?? '', date_text: s.date_text ?? '', tag: s.tag ?? '',
      cover_url: s.cover_url ?? '', cover_alt: s.cover_alt ?? '', cover_layout: s.cover_layout ?? 'AUTO',
      quote_bs: s.quote_bs ?? '', quote_en: s.quote_en ?? '',
      text_bs: s.text_bs ?? '', text_en: s.text_en ?? '',
      sort_order: s.sort_order, is_published: s.is_published,
      fan_on: s.fan_order != null, fan_order: s.fan_order ?? 0,
      fan_image: s.fan_image ?? '', fan_focus: s.fan_focus ?? '',
    });
    setShowForm(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (s: Story) => {
    const inFan = s.fan_order != null ? '\n\nOva priča je u lepezi na naslovnoj i izaći će iz nje.' : '';
    if (!confirm(`Trajno obrisati priču "${s.couple}" i sve njene fotografije?${inFan}`)) return;
    await fetch(`/api/stories/${s.id}`, { method: 'DELETE', credentials: 'include' });
    load();
  };

  const togglePublished = async (s: Story) => {
    if (s.is_published && s.fan_order != null
      && !confirm(`"${s.couple}" je u lepezi na naslovnoj. Ako je sakriješ, izaći će i iz lepeze. Nastaviti?`)) return;
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
      const up = await upload(file);
      if (!up) continue;
      await fetch(`/api/stories/${openGallery}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url: up.url, sort_order: order++ }),
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
          onClick={() => {
            setShowForm(v => !v); setEditingId(null); setForm({ ...EMPTY }); setError(null);
            setSlugAuto(true); setCoverSize(null); setFanSize(null);
          }}
          className="flex-none flex items-center gap-2 bg-gold-600 hover:bg-gold-500 text-white px-4 py-2.5 rounded-sm text-xs tracking-[0.2em] uppercase font-bold transition-colors"
        >
          <Plus size={14} /> Nova priča
        </button>
      </div>

      {!loading && <FanBoard items={items.map(x => ({ ...x, fan_order: x.fan_order ?? null, fan_image: x.fan_image ?? null }))} onReorder={reorderFan} />}

      {fanFull && (
        <FanFullDialog fan={fanFull} onCancel={() => setFanFull(null)} onPick={id => save(undefined, id)} />
      )}

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
                onChange={e => {
                  const couple = e.target.value;
                  setForm(f => ({ ...f, couple, slug: slugAuto ? slugify(couple) : f.slug }));
                }} />
            </Field>
            <Field label="Adresa stranice"
              hint={`Prati ime para dok je ne promijeniš sama. Na sajtu: /radovi/${(slugAuto ? slugify(form.couple) : slugify(form.slug)) || '…'} (engleski /en/portfolio/…). Stara adresa nastavlja raditi i vodi na novu.`}>
              <div className="flex gap-2">
                <input className={field} placeholder="amra-i-tarik" value={slugAuto ? slugify(form.couple) : form.slug}
                  onChange={e => { setSlugAuto(false); setForm(f => ({ ...f, slug: e.target.value })); }} />
                {!slugAuto && (
                  <button type="button" onClick={() => setSlugAuto(true)}
                    className="flex-none text-[10px] text-white/40 hover:text-white/70 px-2">Iz imena</button>
                )}
              </div>
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
            <Field label="Oznaka vrste (BOS)" hint='Npr. "Foto" ili "Foto i video".'>
              <input className={field} placeholder="Foto i video" value={form.tag_bs}
                onChange={e => setForm(f => ({ ...f, tag_bs: e.target.value }))} /></Field>
            <Field label="Oznaka vrste (ENG)" hint='Npr. "Photo" ili "Photo and film".'>
              <input className={field} placeholder="Photo and film" value={form.tag_en}
                onChange={e => setForm(f => ({ ...f, tag_en: e.target.value }))} /></Field>
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
            <Field label="Veličina kartice u Radovima"
              hint="Automatski: okvir prati omjer fotografije, ništa se ne reže. Uspravna, vodoravna ili kvadrat: okvir je fiksan, a slika se reže oko točke fokusa. Promjena vrijedi odmah po spremanju.">
              <select className={field} value={form.cover_layout}
                onChange={e => setForm(f => ({ ...f, cover_layout: e.target.value }))}>
                {LAYOUTS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </Field>
            {form.cover_url && (
              <Field label="Točka fokusa naslovne" hint="Klikni na lice; koristi se kad okvir kartice reže sliku.">
                <FocusPicker src={form.cover_url} value={form.cover_focus}
                  onChange={v => setForm(f => ({ ...f, cover_focus: v }))}
                  ratio={form.cover_layout === 'WIDE' ? '4 / 3' : form.cover_layout === 'SQUARE' ? '1 / 1' : '3 / 4'} />
              </Field>
            )}
            <Field label="Redoslijed" hint="Manji broj ide prije. Određuje i broj na kartici.">
              <input type="number" className={field} value={form.sort_order}
                onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} /></Field>
          </div>

          <div className="border-t border-white/5 pt-5 space-y-4">
            <label className="flex items-center gap-2.5 text-xs text-white/70 cursor-pointer">
              <input type="checkbox" checked={form.fan_on} className="accent-gold-600 w-4 h-4"
                onChange={e => setForm(f => ({ ...f, fan_on: e.target.checked }))} />
              Prikaži u lepezi na početnoj
            </label>
            {form.fan_on && (() => {
              const pic = form.fan_image || form.cover_url;
              const size = form.fan_image ? fanSize : coverSize;
              const notUpright = size ? size.w >= size.h : false;
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6">
                  <Field label="Redoslijed u lepezi" hint="1 je lijevo, 5 desno. Mijenja se i povlačenjem na tabli iznad.">
                    <select className={field} value={form.fan_order}
                      onChange={e => setForm(f => ({ ...f, fan_order: Number(e.target.value) }))}>
                      <option value={0}>Prvo slobodno mjesto</option>
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </Field>
                  <Field label="Slika za lepezu (uspravna 2:3)"
                    hint="Naslovna u Radovima je često vodoravna, zato lepeza ima svoju. Ako je ne postaviš, koristi se naslovna.">
                    <div className="flex items-center gap-3">
                      <input className={field} placeholder="/uploads/..." value={form.fan_image}
                        onChange={e => setForm(f => ({ ...f, fan_image: e.target.value }))} />
                      <input ref={fanRef} type="file" accept="image/*" onChange={onFanPick} className="hidden" id="fan-pick" />
                      <label htmlFor="fan-pick"
                        className="flex-none flex items-center gap-2 bg-moody-800 hover:bg-moody-700 border border-white/10 text-white/70 px-3 py-2.5 rounded-sm text-xs cursor-pointer transition-colors">
                        {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} Učitaj
                      </label>
                    </div>
                  </Field>
                  {pic && (
                    <div className="sm:col-span-2">
                      {notUpright && (
                        <p className="text-amber-300/80 text-[11px] mb-2">
                          {form.fan_image ? 'Slika za lepezu' : 'Naslovna slika'} nije uspravna i bit će izrezana na 2:3.
                          {!form.fan_image && ' Bolje je postaviti posebnu uspravnu sliku za lepezu.'}
                        </p>
                      )}
                      <FocusPicker src={pic}
                        value={form.fan_image ? form.fan_focus : form.cover_focus}
                        onChange={v => setForm(f => (f.fan_image ? { ...f, fan_focus: v } : { ...f, cover_focus: v }))} />
                    </div>
                  )}
                </div>
              );
            })()}
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
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-white/85 text-sm truncate">{s.couple}</span>
                    {s.fan_order != null && s.is_published && (
                      <span className="flex-none text-[9px] tracking-widest uppercase text-gold-400 border border-gold-600/40 rounded-sm px-1.5 py-0.5">
                        Lepeza {s.fan_order}
                      </span>
                    )}
                  </div>
                  <div className="text-white/30 text-[11px] truncate">
                    {CATEGORIES.find(c => c.value === s.category)?.label}
                    {s.location ? ` · ${s.location}` : ''} · /radovi/{s.slug} · {s.image_count ?? 0} fotografija
                  </div>
                </div>

                <button onClick={() => togglePublished(s)}
                  title={s.is_published ? 'Sakrij sa sajta' : 'Objavi'}
                  className={cn('flex-none p-2 rounded-sm transition-colors',
                    s.is_published ? 'text-gold-400 hover:bg-white/5' : 'text-white/20 hover:text-white/50')}>
                  {s.is_published ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                {s.is_published && (
                  <a href={`/radovi/${s.slug}`} target="_blank" rel="noopener noreferrer" title="Otvori na sajtu"
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

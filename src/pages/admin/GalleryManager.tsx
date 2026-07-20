import React, { useEffect, useState, useRef } from 'react';
import { Plus, Trash2, Eye, EyeOff, Upload, X, Check, Image, Pencil } from 'lucide-react';
import { cn } from '../../lib/utils';

type Category = 'WEDDINGS' | 'STUDIO' | 'PORTRAITS';
type Layout = 'TALL' | 'WIDE' | 'SQUARE';

interface GalleryImage {
  id: number;
  url: string;
  category: Category;
  layout: Layout;
  title: string | null;
  location: string | null;
  sort_order: number;
  is_active: boolean;
}

const CATEGORIES: Category[] = ['WEDDINGS', 'STUDIO', 'PORTRAITS'];

const LAYOUTS: { value: Layout; label: string; shape: string }[] = [
  { value: 'TALL',   label: 'Vertikalna', shape: 'w-5 h-7'  },
  { value: 'WIDE',   label: 'Horizontalna', shape: 'w-10 h-6' },
  { value: 'SQUARE', label: 'Kvadrat',    shape: 'w-7 h-7'  },
];

const makeEmptyForm = (category: Category = 'WEDDINGS'): FormState => ({
  url: '', category, layout: 'TALL', title: '', location: '', sort_order: 0,
});

interface FormState {
  url: string;
  category: Category;
  layout: Layout;
  title: string;
  location: string;
  sort_order: number;
}

export default function GalleryManager() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(makeEmptyForm());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const res = await fetch('/api/gallery/all', { credentials: 'include' });
    const data = await res.json();
    setImages(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(makeEmptyForm(filter === 'ALL' ? 'WEDDINGS' : filter as Category));
    setUploadError(null);
    setShowForm(true);
  };

  const openEdit = (img: GalleryImage) => {
    setEditingId(img.id);
    setForm({
      url: img.url,
      category: img.category,
      layout: img.layout || 'TALL',
      title: img.title || '',
      location: img.location || '',
      sort_order: img.sort_order,
    });
    setUploadError(null);
    setShowForm(true);
    // Scroll to form
    setTimeout(() => document.getElementById('gallery-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setUploadError(null);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
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
      if (!res.ok) { setUploadError(data.error || 'Upload nije uspio.'); return; }
      if (data.url) setForm(f => ({ ...f, url: data.url }));
    } catch (err: any) {
      clearTimeout(timeout);
      setUploadError(err.name === 'AbortError' ? 'Upload trajao predugo — pokušaj ponovo.' : 'Upload nije uspio.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const url = editingId ? `/api/gallery/${editingId}` : '/api/gallery';
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        ...form,
        title: form.title || null,
        location: form.location || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.error || 'Greška pri čuvanju.');
      return;
    }
    closeForm();
    load();
  };

  const toggleActive = async (img: GalleryImage) => {
    await fetch(`/api/gallery/${img.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ is_active: !img.is_active }),
    });
    load();
  };

  const deleteImage = async (id: number) => {
    if (!confirm('Obrisati ovu sliku?')) return;
    await fetch(`/api/gallery/${id}`, { method: 'DELETE', credentials: 'include' });
    load();
  };

  const filtered = filter === 'ALL' ? images : images.filter(i => i.category === filter);

  const layoutLabel: Record<Layout, string> = { TALL: 'Vertikalna', WIDE: 'Horizontalna', SQUARE: 'Kvadrat' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-light text-white">Galerija</h2>
          <p className="text-white/40 text-sm mt-1">{images.length} slika ukupno</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-gold-600 hover:bg-gold-500 text-white px-4 py-2.5 rounded-sm text-xs tracking-[0.2em] uppercase font-bold transition-colors"
        >
          <Plus size={16} /> Dodaj sliku
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['ALL', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              'px-4 py-1.5 rounded-sm text-[10px] tracking-[0.2em] uppercase font-bold transition-colors',
              filter === cat
                ? 'bg-gold-600/15 text-gold-400 border border-gold-600/20'
                : 'text-white/30 hover:text-white border border-transparent'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div id="gallery-form" className="bg-moody-950/60 border border-white/10 rounded-sm p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white text-sm font-medium">
              {editingId ? 'Uredi sliku' : 'Nova slika'}
            </h3>
            <button onClick={closeForm} className="text-white/30 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSave} className="space-y-4">

            {/* URL + Upload */}
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="URL slike"
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                required
                className="flex-1 bg-moody-900 border border-white/10 rounded-sm px-3 py-2.5 text-white text-sm focus:outline-none focus:border-gold-600/40"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 bg-moody-800 hover:bg-moody-700 border border-white/10 text-white/60 hover:text-white px-3 py-2.5 rounded-sm text-xs transition-colors disabled:opacity-50"
              >
                <Upload size={14} />
                {uploading ? 'Upload...' : 'Upload'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </div>
            {uploadError && <p className="text-red-400 text-xs">{uploadError}</p>}

            {/* Preview */}
            {form.url && (
              <div className="relative w-32 h-24 rounded-sm overflow-hidden">
                <img src={form.url} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Category + Sort */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase text-white/40 font-bold mb-1.5">Kategorija</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
                  className="w-full bg-moody-900 border border-white/10 rounded-sm px-3 py-2.5 text-white text-sm focus:outline-none focus:border-gold-600/40"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase text-white/40 font-bold mb-1.5">Redoslijed</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-moody-900 border border-white/10 rounded-sm px-3 py-2.5 text-white text-sm focus:outline-none focus:border-gold-600/40"
                />
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase text-white/40 font-bold mb-1.5">Naslov (opciono)</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="npr. The Grand Entrance"
                  className="w-full bg-moody-900 border border-white/10 rounded-sm px-3 py-2.5 text-white text-sm focus:outline-none focus:border-gold-600/40"
                />
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase text-white/40 font-bold mb-1.5">Lokacija (opciono)</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="npr. Paris, 2024"
                  className="w-full bg-moody-900 border border-white/10 rounded-sm px-3 py-2.5 text-white text-sm focus:outline-none focus:border-gold-600/40"
                />
              </div>
            </div>

            {/* Layout selector */}
            <div>
              <label className="block text-[10px] tracking-[0.2em] uppercase text-white/40 font-bold mb-3">
                Raspored u gridu
              </label>
              <div className="flex gap-3">
                {LAYOUTS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, layout: opt.value }))}
                    className={cn(
                      'flex flex-col items-center gap-2 px-4 py-3 rounded-sm border transition-colors',
                      form.layout === opt.value
                        ? 'border-gold-600/60 bg-gold-600/10 text-gold-400'
                        : 'border-white/10 bg-moody-900 text-white/30 hover:text-white hover:border-white/20'
                    )}
                  >
                    {/* Shape preview */}
                    <div className={cn(
                      'rounded-[2px]',
                      opt.shape,
                      form.layout === opt.value ? 'bg-gold-400/50' : 'bg-white/20'
                    )} />
                    <span className="text-[9px] tracking-[0.15em] uppercase font-bold whitespace-nowrap">
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-white/20 text-[10px] mt-2">
                Vertikalna = 1/3 širine &nbsp;·&nbsp; Horizontalna = 2/3 širine &nbsp;·&nbsp; Kvadrat = 1/2 širine
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-gold-600 hover:bg-gold-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-sm text-xs tracking-[0.2em] uppercase font-bold transition-colors"
              >
                <Check size={14} /> {saving ? 'Čuvanje...' : (editingId ? 'Spremi izmjene' : 'Sačuvaj')}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="text-white/40 hover:text-white text-sm transition-colors px-3"
              >
                Otkaži
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Images Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-moody-950/40 rounded-sm animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(img => (
            <div key={img.id} className={cn('group relative rounded-sm overflow-hidden', !img.is_active && 'opacity-40')}>
              <div className="aspect-[3/4]">
                <img src={img.url} alt={img.title || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>

              {/* Badges: category + layout */}
              <div className="absolute top-1.5 left-1.5 flex gap-1">
                <span className="px-1.5 py-0.5 bg-black/60 rounded-sm text-[8px] tracking-[0.15em] uppercase font-bold text-gold-400">
                  {img.category}
                </span>
                <span className="px-1.5 py-0.5 bg-black/60 rounded-sm text-[8px] tracking-[0.1em] uppercase font-bold text-white/50">
                  {layoutLabel[img.layout] || img.layout}
                </span>
              </div>

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors" />
              <div className="absolute inset-0 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex justify-end gap-2">
                  <button onClick={() => openEdit(img)} className="p-1.5 bg-black/60 rounded-sm text-white hover:text-gold-400 transition-colors" title="Uredi">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => toggleActive(img)} className="p-1.5 bg-black/60 rounded-sm text-white hover:text-gold-400 transition-colors" title={img.is_active ? 'Sakrij' : 'Prikaži'}>
                    {img.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => deleteImage(img.id)} className="p-1.5 bg-black/60 rounded-sm text-white hover:text-red-400 transition-colors" title="Obriši">
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Quick layout switcher */}
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {LAYOUTS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={async () => {
                          await fetch(`/api/gallery/${img.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ layout: opt.value }),
                          });
                          load();
                        }}
                        className={cn(
                          'flex-1 py-1 rounded-sm text-[8px] tracking-[0.1em] uppercase font-bold transition-colors',
                          img.layout === opt.value
                            ? 'bg-gold-500 text-white'
                            : 'bg-black/60 text-white/60 hover:text-white'
                        )}
                        title={opt.label}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {img.title && <p className="text-white text-xs truncate">{img.title}</p>}
                  {img.location && <p className="text-white/50 text-[10px]">{img.location}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-white/20">
          <Image size={40} strokeWidth={1} className="mx-auto mb-4" />
          <p className="text-sm">Nema slika u ovoj kategoriji</p>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, X, Check, Star } from 'lucide-react';
import { cn } from '../../lib/utils';

const FONT_SIZE_OPTIONS = [
  { label: '— default —', value: '' },
  { label: '16px', value: '1rem' },
  { label: '18px', value: '1.125rem' },
  { label: '20px', value: '1.25rem' },
  { label: '24px', value: '1.5rem' },
  { label: '30px', value: '1.875rem' },
  { label: '36px', value: '2.25rem' },
  { label: '48px', value: '3rem' },
];

const COLOR_PRESETS = [
  { label: 'Default',    value: '',                        bg: 'transparent', border: true },
  { label: 'Bijela',     value: '#ffffff',                 bg: '#ffffff' },
  { label: 'Tamna',      value: '#1a1a1a',                 bg: '#1a1a1a' },
  { label: 'Gold',       value: '#a6865d',                 bg: '#a6865d' },
  { label: 'Gold 50%',   value: 'rgba(166,134,93,0.5)',    bg: '#a6865d' },
];

interface Package {
  id: number;
  name: string;
  name_en: string | null;
  name_bs: string | null;
  price: string;
  description: string | null;
  description_en: string | null;
  description_bs: string | null;
  features: string[];
  features_en: string[];
  features_bs: string[];
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  name_color: string | null;
  name_font_size: string | null;
  features_font_size: string | null;
}

const emptyForm = {
  name: '',
  name_en: '', name_bs: '',
  price: '',
  description: '',
  description_en: '', description_bs: '',
  features: [] as string[],
  features_en: [] as string[], features_bs: [] as string[],
  is_featured: false, is_active: true, sort_order: 0,
  name_color: '', name_font_size: '', features_font_size: '',
};

export default function PackagesManager() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [featureInputBs, setFeatureInputBs] = useState('');
  const [featureInputEn, setFeatureInputEn] = useState('');
  const [saving, setSaving] = useState(false);

  const parseFeatures = (raw: any): string[] => Array.isArray(raw) ? raw : JSON.parse(raw || '[]');

  const load = async () => {
    const res = await fetch('/api/packages/all', { credentials: 'include' });
    const data = await res.json();
    setPackages(data.map((p: any) => ({
      ...p,
      features:    parseFeatures(p.features),
      features_bs: parseFeatures(p.features_bs),
      features_en: parseFeatures(p.features_en),
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openEdit = (pkg: Package) => {
    setForm({
      name: pkg.name,
      name_en: pkg.name_en || '',
      name_bs: pkg.name_bs || pkg.name,
      price: pkg.price,
      description: pkg.description || '',
      description_en: pkg.description_en || '',
      description_bs: pkg.description_bs || pkg.description || '',
      features: [...pkg.features],
      features_en: [...(pkg.features_en ?? [])],
      features_bs: [...(pkg.features_bs ?? pkg.features ?? [])],
      is_featured: pkg.is_featured,
      is_active: pkg.is_active,
      sort_order: pkg.sort_order,
      name_color: pkg.name_color || '',
      name_font_size: pkg.name_font_size || '',
      features_font_size: pkg.features_font_size || '',
    });
    setFeatureInputBs('');
    setFeatureInputEn('');
    setEditId(pkg.id);
    setShowForm(true);
  };

  const openNew = () => {
    setForm(emptyForm);
    setFeatureInputBs('');
    setFeatureInputEn('');
    setEditId(null);
    setShowForm(true);
  };

  const addFeatureBs = () => {
    if (!featureInputBs.trim()) return;
    setForm(f => ({ ...f, features_bs: [...f.features_bs, featureInputBs.trim()] }));
    setFeatureInputBs('');
  };

  const addFeatureEn = () => {
    if (!featureInputEn.trim()) return;
    setForm(f => ({ ...f, features_en: [...f.features_en, featureInputEn.trim()] }));
    setFeatureInputEn('');
  };

  const removeFeatureBs = (i: number) => setForm(f => ({ ...f, features_bs: f.features_bs.filter((_, idx) => idx !== i) }));
  const removeFeatureEn = (i: number) => setForm(f => ({ ...f, features_en: f.features_en.filter((_, idx) => idx !== i) }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `/api/packages/${editId}` : '/api/packages';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setSaving(false);
    load();
  };

  const deletePackage = async (id: number) => {
    if (!confirm('Obrisati ovaj paket?')) return;
    await fetch(`/api/packages/${id}`, { method: 'DELETE', credentials: 'include' });
    load();
  };

  const inputClass = 'w-full bg-moody-900 border border-white/10 rounded-sm px-3 py-2.5 text-white text-sm focus:outline-none focus:border-gold-600/40';
  const labelClass = 'block text-[10px] tracking-[0.2em] uppercase font-bold mb-1.5';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-light text-white">Paketi</h2>
          <p className="text-white/40 text-sm mt-1">{packages.length} paketa</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-gold-600 hover:bg-gold-500 text-white px-4 py-2.5 rounded-sm text-xs tracking-[0.2em] uppercase font-bold transition-colors">
          <Plus size={16} /> Novi paket
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-moody-950/60 border border-white/10 rounded-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-white text-sm font-medium">{editId ? 'Uredi paket' : 'Novi paket'}</h3>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-white/30 hover:text-white" /></button>
          </div>

          <form onSubmit={handleSave} className="space-y-5">

            {/* Name BS / EN */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={cn(labelClass, 'text-white/40')}>
                  Naziv paketa <span className="text-gold-400/60 ml-1">BOS</span>
                </label>
                <input
                  type="text" required value={form.name_bs}
                  onChange={e => setForm(f => ({ ...f, name_bs: e.target.value }))}
                  className={inputClass}
                  placeholder="npr. The Signature"
                />
              </div>
              <div>
                <label className={cn(labelClass, 'text-white/40')}>
                  Package name <span className="text-gold-400/60 ml-1">ENG</span>
                </label>
                <input
                  type="text" value={form.name_en}
                  onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))}
                  className={inputClass}
                  placeholder="e.g. The Signature"
                />
              </div>
            </div>

            {/* Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={cn(labelClass, 'text-white/40')}>Cijena</label>
                <input
                  type="text" required value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  className={inputClass}
                  placeholder="npr. 2,400 ili On Request"
                />
              </div>
            </div>

            {/* Description BS / EN */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={cn(labelClass, 'text-white/40')}>
                  Opis <span className="text-gold-400/60 ml-1">BOS</span>
                </label>
                <textarea
                  value={form.description_bs}
                  onChange={e => setForm(f => ({ ...f, description_bs: e.target.value }))}
                  rows={2}
                  className={cn(inputClass, 'resize-none')}
                />
              </div>
              <div>
                <label className={cn(labelClass, 'text-white/40')}>
                  Description <span className="text-gold-400/60 ml-1">ENG</span>
                </label>
                <textarea
                  value={form.description_en}
                  onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))}
                  rows={2}
                  className={cn(inputClass, 'resize-none')}
                />
              </div>
            </div>

            {/* Name styling */}
            <div className="border border-white/8 rounded-sm p-4 space-y-3">
              <p className={cn(labelClass, 'text-white/40')}>Stil naziva paketa</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-white/30 mb-1.5">Veličina fonta</label>
                  <select
                    value={form.name_font_size}
                    onChange={e => setForm(f => ({ ...f, name_font_size: e.target.value }))}
                    className="w-full bg-moody-900 border border-white/10 rounded-sm px-3 py-2 text-white/70 text-xs focus:outline-none focus:border-gold-600/40"
                  >
                    {FONT_SIZE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-white/30 mb-1.5">Boja teksta</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {COLOR_PRESETS.map(preset => (
                      <button
                        key={preset.value}
                        type="button"
                        title={preset.label}
                        onClick={() => setForm(f => ({ ...f, name_color: preset.value }))}
                        className={cn(
                          'w-6 h-6 rounded-full border-2 transition-all',
                          form.name_color === preset.value ? 'border-gold-400 scale-110' : 'border-white/20',
                          (preset as any).border ? 'border-dashed' : ''
                        )}
                        style={{ background: preset.bg }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {(form.name_font_size || form.name_color) && (
                <p className="text-white/20 text-[10px]">Pregled: <span style={{ fontSize: form.name_font_size || undefined, color: form.name_color || undefined }}>{form.name_bs || 'Naziv paketa'}</span></p>
              )}
            </div>

            {/* Features font size */}
            <div className="border border-white/8 rounded-sm p-4 space-y-2">
              <p className={cn(labelClass, 'text-white/40')}>Veličina fonta — lista stavki (features)</p>
              <div className="flex items-center gap-4">
                <select
                  value={form.features_font_size}
                  onChange={e => setForm(f => ({ ...f, features_font_size: e.target.value }))}
                  className="bg-moody-900 border border-white/10 rounded-sm px-3 py-2 text-white/70 text-xs focus:outline-none focus:border-gold-600/40"
                >
                  {FONT_SIZE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {form.features_font_size && (
                  <span className="text-white/30 text-[10px]">Pregled: <span style={{ fontSize: form.features_font_size }}>4 sata pokrivenosti</span></span>
                )}
              </div>
            </div>

            {/* Features BOS / ENG side-by-side */}
            <div className="grid grid-cols-2 gap-4">
              {/* BOS features */}
              <div>
                <label className={cn(labelClass, 'text-white/40')}>
                  Stavke (features) <span className="text-gold-400/60 ml-1">BOS</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text" value={featureInputBs}
                    onChange={e => setFeatureInputBs(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeatureBs(); } }}
                    placeholder="Dodaj stavku, Enter"
                    className="flex-1 bg-moody-900 border border-white/10 rounded-sm px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-600/40"
                  />
                  <button type="button" onClick={addFeatureBs} className="bg-moody-800 border border-white/10 text-white/60 hover:text-white px-3 rounded-sm text-xs transition-colors">
                    +
                  </button>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {form.features_bs.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-moody-900/60 px-3 py-1.5 rounded-sm">
                      <span className="flex-1 text-white/70 text-xs">{f}</span>
                      <button type="button" onClick={() => removeFeatureBs(i)} className="text-white/20 hover:text-red-400 transition-colors">
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ENG features */}
              <div>
                <label className={cn(labelClass, 'text-white/40')}>
                  Features <span className="text-gold-400/60 ml-1">ENG</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text" value={featureInputEn}
                    onChange={e => setFeatureInputEn(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeatureEn(); } }}
                    placeholder="Add feature, Enter"
                    className="flex-1 bg-moody-900 border border-white/10 rounded-sm px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-600/40"
                  />
                  <button type="button" onClick={addFeatureEn} className="bg-moody-800 border border-white/10 text-white/60 hover:text-white px-3 rounded-sm text-xs transition-colors">
                    +
                  </button>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {form.features_en.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-moody-900/60 px-3 py-1.5 rounded-sm">
                      <span className="flex-1 text-white/70 text-xs">{f}</span>
                      <button type="button" onClick={() => removeFeatureEn(i)} className="text-white/20 hover:text-red-400 transition-colors">
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="w-4 h-4 accent-gold-600" />
                <span className="text-white/60 text-sm">Istaknuto (najpopularnije)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-gold-600" />
                <span className="text-white/60 text-sm">Aktivno</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-sm">Redoslijed:</span>
                <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} className="w-16 bg-moody-900 border border-white/10 rounded-sm px-2 py-1.5 text-white text-sm focus:outline-none" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="flex items-center gap-2 bg-gold-600 hover:bg-gold-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-sm text-xs tracking-[0.2em] uppercase font-bold transition-colors">
                <Check size={14} /> {saving ? 'Čuvanje...' : 'Sačuvaj'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-white/40 hover:text-white text-sm transition-colors px-3">
                Otkaži
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Packages list */}
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-moody-950/40 rounded-sm animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {packages.map(pkg => (
            <div key={pkg.id} className={cn('bg-moody-950/60 border rounded-sm p-5 flex items-center justify-between gap-4', pkg.is_featured ? 'border-gold-600/30' : 'border-white/5', !pkg.is_active && 'opacity-40')}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {pkg.is_featured && <Star size={12} className="text-gold-400 fill-gold-400 flex-shrink-0" />}
                  <span className="text-white font-medium">{pkg.name_bs || pkg.name}</span>
                  {pkg.name_en && <span className="text-white/30 text-xs">/ {pkg.name_en}</span>}
                  {!pkg.is_active && <span className="text-[9px] tracking-widest uppercase text-white/20 font-bold">skriveno</span>}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gold-400 font-serif text-lg">{pkg.price}</span>
                  <span className="text-white/30 text-xs">{(pkg.features_bs?.length || pkg.features?.length || 0)} stavki</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => openEdit(pkg)} className="p-2 text-white/30 hover:text-white transition-colors">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => deletePackage(pkg.id)} className="p-2 text-white/30 hover:text-red-400 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

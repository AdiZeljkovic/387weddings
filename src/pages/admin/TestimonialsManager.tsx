import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, X, Check, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Testimonial {
  id: number;
  client_name: string;
  text: string;
  location: string | null;
  wedding_date: string | null;
  is_active: boolean;
  sort_order: number;
}

const emptyForm = { client_name: '', text: '', location: '', wedding_date: '', is_active: true, sort_order: 0 };

export default function TestimonialsManager() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch('/api/testimonials/all', { credentials: 'include' });
    const data = await res.json();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openEdit = (t: Testimonial) => {
    setForm({ client_name: t.client_name, text: t.text, location: t.location || '', wedding_date: t.wedding_date || '', is_active: t.is_active, sort_order: t.sort_order });
    setEditId(t.id);
    setShowForm(true);
  };

  const openNew = () => { setForm(emptyForm); setEditId(null); setShowForm(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `/api/testimonials/${editId}` : '/api/testimonials';
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

  const toggleActive = async (t: Testimonial) => {
    await fetch(`/api/testimonials/${t.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ is_active: !t.is_active }),
    });
    load();
  };

  const deleteItem = async (id: number) => {
    if (!confirm('Obrisati ovu recenziju?')) return;
    await fetch(`/api/testimonials/${id}`, { method: 'DELETE', credentials: 'include' });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-light text-white">Recenzije</h2>
          <p className="text-white/40 text-sm mt-1">{items.length} recenzija</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-gold-600 hover:bg-gold-500 text-white px-4 py-2.5 rounded-sm text-xs tracking-[0.2em] uppercase font-bold transition-colors">
          <Plus size={16} /> Dodaj recenziju
        </button>
      </div>

      {showForm && (
        <div className="bg-moody-950/60 border border-white/10 rounded-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white text-sm font-medium">{editId ? 'Uredi recenziju' : 'Nova recenzija'}</h3>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-white/30 hover:text-white" /></button>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase text-white/40 font-bold mb-1.5">Ime klijenta</label>
                <input required type="text" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} placeholder="npr. Ana & Marko Petrović" className="w-full bg-moody-900 border border-white/10 rounded-sm px-3 py-2.5 text-white text-sm focus:outline-none focus:border-gold-600/40" />
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase text-white/40 font-bold mb-1.5">Lokacija vjenčanja</label>
                <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="npr. Sarajevo, 2024" className="w-full bg-moody-900 border border-white/10 rounded-sm px-3 py-2.5 text-white text-sm focus:outline-none focus:border-gold-600/40" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.2em] uppercase text-white/40 font-bold mb-1.5">Tekst recenzije</label>
              <textarea required value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} rows={4} placeholder="Tekst koji je klijent napisao..." className="w-full bg-moody-900 border border-white/10 rounded-sm px-3 py-2.5 text-white text-sm focus:outline-none focus:border-gold-600/40 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase text-white/40 font-bold mb-1.5">Datum vjenčanja</label>
                <input type="text" value={form.wedding_date} onChange={e => setForm(f => ({ ...f, wedding_date: e.target.value }))} placeholder="npr. Juni 2024" className="w-full bg-moody-900 border border-white/10 rounded-sm px-3 py-2.5 text-white text-sm focus:outline-none focus:border-gold-600/40" />
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase text-white/40 font-bold mb-1.5">Redoslijed</label>
                <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} className="w-full bg-moody-900 border border-white/10 rounded-sm px-3 py-2.5 text-white text-sm focus:outline-none focus:border-gold-600/40" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-gold-600" />
              <span className="text-white/60 text-sm">Prikaži na sajtu</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="flex items-center gap-2 bg-gold-600 hover:bg-gold-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-sm text-xs tracking-[0.2em] uppercase font-bold transition-colors">
                <Check size={14} /> {saving ? 'Čuvanje...' : 'Sačuvaj'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-white/40 hover:text-white text-sm transition-colors px-3">Otkaži</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-moody-950/40 rounded-sm animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {items.map(t => (
            <div key={t.id} className={cn('bg-moody-950/60 border border-white/5 rounded-sm p-5', !t.is_active && 'opacity-40')}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-white font-medium">{t.client_name}</span>
                    {t.location && <span className="text-white/30 text-xs">{t.location}</span>}
                    {!t.is_active && <span className="text-[9px] tracking-widest uppercase text-white/20 font-bold">skriveno</span>}
                  </div>
                  <p className="text-white/50 text-sm leading-relaxed line-clamp-2">"{t.text}"</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => toggleActive(t)} className="p-2 text-white/30 hover:text-white transition-colors" title={t.is_active ? 'Sakrij' : 'Prikaži'}>
                    {t.is_active ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  <button onClick={() => openEdit(t)} className="p-2 text-white/30 hover:text-white transition-colors">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => deleteItem(t.id)} className="p-2 text-white/30 hover:text-red-400 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center py-16 text-white/20">
              <p className="text-sm">Nema recenzija još. Dodajte prvu!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

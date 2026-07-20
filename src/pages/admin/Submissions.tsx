import React, { useEffect, useState } from 'react';
import { Mail, Archive, CheckCheck, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

interface Submission {
  id: number;
  name: string;
  email: string;
  wedding_date: string | null;
  location: string | null;
  message: string | null;
  status: 'new' | 'read' | 'archived';
  created_at: string;
}

const STATUS_LABELS = {
  new: { label: 'Novo', color: 'text-gold-400 bg-gold-400/10 border-gold-400/20' },
  read: { label: 'Pročitano', color: 'text-white/40 bg-white/5 border-white/10' },
  archived: { label: 'Arhivirano', color: 'text-white/20 bg-transparent border-white/5' },
};

export default function Submissions() {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'read' | 'archived'>('all');
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = async () => {
    const res = await fetch('/api/submissions', { credentials: 'include' });
    const data = await res.json();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: number, status: Submission['status']) => {
    await fetch(`/api/submissions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    load();
  };

  const deleteItem = async (id: number) => {
    if (!confirm('Trajno obrisati ovaj upit?')) return;
    await fetch(`/api/submissions/${id}`, { method: 'DELETE', credentials: 'include' });
    load();
  };

  const handleExpand = (id: number) => {
    setExpanded(prev => {
      if (prev === id) return null;
      // Mark as read when opened
      const item = items.find(i => i.id === id);
      if (item?.status === 'new') updateStatus(id, 'read');
      return id;
    });
  };

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter);
  const newCount = items.filter(i => i.status === 'new').length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-serif font-light text-white">Upiti</h2>
          <p className="text-white/40 text-sm mt-1">
            {items.length} ukupno
            {newCount > 0 && <span className="ml-2 text-gold-400 font-medium">• {newCount} novih</span>}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'new', 'read', 'archived'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-1.5 rounded-sm text-[10px] tracking-[0.2em] uppercase font-bold transition-colors',
              filter === f
                ? 'bg-gold-600/15 text-gold-400 border border-gold-600/20'
                : 'text-white/30 hover:text-white border border-transparent'
            )}
          >
            {f === 'all' ? 'Sve' : f === 'new' ? 'Nova' : f === 'read' ? 'Pročitana' : 'Arhivirana'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-moody-950/40 rounded-sm animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => {
            const isExpanded = expanded === item.id;
            const statusInfo = STATUS_LABELS[item.status];
            return (
              <div key={item.id} className={cn('bg-moody-950/60 border rounded-sm transition-colors', item.status === 'new' ? 'border-gold-600/20' : 'border-white/5')}>
                <button
                  onClick={() => handleExpand(item.id)}
                  className="w-full flex items-center gap-4 p-4 text-left"
                >
                  <Mail size={16} className={item.status === 'new' ? 'text-gold-400' : 'text-white/20'} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className={cn('font-medium text-sm', item.status === 'new' ? 'text-white' : 'text-white/60')}>{item.name}</span>
                      <span className={cn('text-[9px] tracking-[0.2em] uppercase font-bold px-2 py-0.5 rounded-full border', statusInfo.color)}>{statusInfo.label}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-white/30 text-xs">{item.email}</span>
                      {item.location && <span className="text-white/20 text-xs">• {item.location}</span>}
                      {item.wedding_date && <span className="text-white/20 text-xs">• {item.wedding_date}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-white/20 text-xs hidden sm:block">
                      {format(new Date(item.created_at), 'dd.MM.yyyy')}
                    </span>
                    {isExpanded ? <ChevronUp size={14} className="text-white/20" /> : <ChevronDown size={14} className="text-white/20" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/5 mt-0 pt-4 space-y-4">
                    {item.message && (
                      <p className="text-white/60 text-sm leading-relaxed bg-moody-900/50 rounded-sm p-4">
                        {item.message}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                      <a
                        href={`mailto:${item.email}`}
                        className="flex items-center gap-2 bg-gold-600 hover:bg-gold-500 text-white px-4 py-2 rounded-sm text-xs tracking-[0.2em] uppercase font-bold transition-colors"
                      >
                        <Mail size={12} /> Odgovori
                      </a>
                      {item.status !== 'read' && (
                        <button onClick={() => updateStatus(item.id, 'read')} className="flex items-center gap-2 bg-moody-800 hover:bg-moody-700 border border-white/10 text-white/60 hover:text-white px-4 py-2 rounded-sm text-xs transition-colors">
                          <CheckCheck size={12} /> Označi pročitano
                        </button>
                      )}
                      {item.status !== 'archived' && (
                        <button onClick={() => updateStatus(item.id, 'archived')} className="flex items-center gap-2 bg-moody-800 hover:bg-moody-700 border border-white/10 text-white/60 hover:text-white px-4 py-2 rounded-sm text-xs transition-colors">
                          <Archive size={12} /> Arhiviraj
                        </button>
                      )}
                      <button onClick={() => deleteItem(item.id)} className="flex items-center gap-2 text-white/20 hover:text-red-400 px-2 py-2 text-xs transition-colors ml-auto">
                        <Trash2 size={12} /> Obriši
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-white/20">
              <Mail size={40} strokeWidth={1} className="mx-auto mb-4" />
              <p className="text-sm">Nema upita u ovoj kategoriji</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

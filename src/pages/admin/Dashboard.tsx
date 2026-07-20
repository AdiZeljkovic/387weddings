import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Image, Package, Quote, Mail, ArrowRight } from 'lucide-react';

interface Stats {
  gallery: number;
  packages: number;
  testimonials: number;
  total_submissions: number;
  new_submissions: number;
}

const statCards = [
  { key: 'gallery', label: 'Slike u galeriji', icon: Image, path: '/admin/gallery', color: 'text-blue-400' },
  { key: 'packages', label: 'Aktivnih paketa', icon: Package, path: '/admin/packages', color: 'text-purple-400' },
  { key: 'testimonials', label: 'Recenzija', icon: Quote, path: '/admin/testimonials', color: 'text-green-400' },
  { key: 'total_submissions', label: 'Ukupno upita', icon: Mail, path: '/admin/submissions', color: 'text-gold-400' },
];

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/settings/stats', { credentials: 'include' })
      .then(r => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-serif font-light text-white mb-1">Dobrodošli</h2>
        <p className="text-white/40 text-sm">Pregled stanja vašeg sajta</p>
      </div>

      {/* New submissions banner */}
      {stats && stats.new_submissions > 0 && (
        <Link
          to="/admin/submissions"
          className="flex items-center justify-between bg-gold-600/10 border border-gold-600/20 rounded-sm px-6 py-4 hover:bg-gold-600/15 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-gold-400" />
            <span className="text-gold-300 text-sm font-medium">
              {stats.new_submissions} {stats.new_submissions === 1 ? 'novi upit' : 'nova upita'} čekaju odgovor
            </span>
          </div>
          <ArrowRight size={16} className="text-gold-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => {
          const Icon = card.icon;
          const value = stats ? (stats as any)[card.key] : '—';
          return (
            <Link
              key={card.key}
              to={card.path}
              className="bg-moody-950/60 border border-white/5 rounded-sm p-6 hover:border-white/10 transition-colors group"
            >
              <div className="flex items-center justify-between mb-4">
                <Icon size={20} className={`${card.color} opacity-70`} strokeWidth={1.5} />
                <ArrowRight size={14} className="text-white/10 group-hover:text-white/30 transition-colors" />
              </div>
              <div className="text-3xl font-serif font-light text-white mb-1">
                {value}
              </div>
              <div className="text-[10px] tracking-[0.2em] uppercase font-bold text-white/30">
                {card.label}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="bg-moody-950/60 border border-white/5 rounded-sm p-6">
        <h3 className="text-white/60 text-xs tracking-[0.3em] uppercase font-bold mb-4">Brze akcije</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link to="/admin/gallery" className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors py-2">
            <Image size={14} /> Dodaj sliku
          </Link>
          <Link to="/admin/packages" className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors py-2">
            <Package size={14} /> Uredi paket
          </Link>
          <Link to="/admin/testimonials" className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors py-2">
            <Quote size={14} /> Dodaj recenziju
          </Link>
          <Link to="/admin/submissions" className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors py-2">
            <Mail size={14} /> Provjeri upite
          </Link>
        </div>
      </div>
    </div>
  );
}

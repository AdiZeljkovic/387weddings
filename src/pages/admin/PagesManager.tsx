import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Loader2, Globe, RefreshCw, ServerCrash } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ContentItem {
  id: number;
  key: string;
  label: string;
  page: string;
  section: string;
  type: 'text' | 'textarea';
  value_en: string;
  value_bs: string;
  sort_order: number;
  font_size: string | null;
  font_family: string | null;
  text_color: string | null;
}

type EditMap = Record<string, { en: string; bs: string; fontSize: string; fontFamily: string; color: string }>;
type SectionStatus = Record<string, 'idle' | 'saving' | 'saved' | 'error'>;

const FONT_SIZE_OPTIONS = [
  { label: '— default —', value: '' },
  { label: '12px', value: '0.75rem' },
  { label: '14px', value: '0.875rem' },
  { label: '16px', value: '1rem' },
  { label: '18px', value: '1.125rem' },
  { label: '20px', value: '1.25rem' },
  { label: '24px', value: '1.5rem' },
  { label: '30px', value: '1.875rem' },
  { label: '36px', value: '2.25rem' },
  { label: '48px', value: '3rem' },
  { label: '60px', value: '3.75rem' },
  { label: '72px', value: '4.5rem' },
  { label: '96px', value: '6rem' },
  { label: '128px', value: '8rem' },
];

const COLOR_PRESETS = [
  { label: 'Bijela',     value: '#ffffff',              bg: '#ffffff' },
  { label: 'Bijela 70%', value: 'rgba(255,255,255,0.7)', bg: 'rgba(255,255,255,0.7)' },
  { label: 'Tamna',      value: '#1a1a1a',              bg: '#1a1a1a' },
  { label: 'Tamna 70%',  value: 'rgba(26,26,26,0.7)',   bg: 'rgba(26,26,26,0.7)' },
  { label: 'Gold',       value: '#a6865d',              bg: '#a6865d' },
  { label: 'Gold 50%',   value: 'rgba(166,134,93,0.5)', bg: 'rgba(166,134,93,0.5)' },
];

const PAGE_LABELS: Record<string, string> = {
  home:      'Naslovna',
  portfolio: 'Radovi',
  services:  'Iskustvo',
  about:     'O Nama',
  contact:   'Upit',
  footer:    'Footer',
};

// Subtitle shown under the tab (matches URL path)
const PAGE_PATHS: Record<string, string> = {
  home:      '/',
  portfolio: '/portfolio',
  services:  '/services',
  about:     '/about',
  contact:   '/contact',
  footer:    '(sve stranice)',
};

const SECTION_LABELS: Record<string, string> = {
  hero:          'Hero sekcija',
  intro:         'Uvod',
  process:       'Proces / Koraci',
  story:         'Priča',
  philosophy:    'Filozofija',
  investment:    'Investicija & Paketi',
  promo:         'Promocija',
  faq:           'Česta pitanja (FAQ)',
  approach:      'Pristup & Uvod',
  connect:       'Kontakt info',
  testimonials:  'Recenzije klijenata',
  about_section: 'O nama sekcija (naslovna)',
  experience:    'Kako radimo (koraci)',
  cta:           'CTA — poziv na akciju',
  form:          'Kontakt forma',
  journey:       'Putovanje — Kako radimo s vama',
  addons:        'Naša podrška — Tu smo za vas',
  filter:        'Filteri kategorija (ALL / Vjenčanja...)',
  brand:         'Brend & Tagline',
  nav:           'Navigacija',
  legal:         'Copyright & Legal',
};

// Explicit section order per page (sections not listed appear at the end)
const SECTION_ORDER: Record<string, string[]> = {
  home:      ['hero', 'intro', 'process', 'testimonials', 'about_section'],
  about:     ['hero', 'story', 'experience', 'cta'],
  services:  ['hero', 'intro', 'philosophy', 'journey', 'investment', 'promo', 'addons', 'faq', 'cta'],
  portfolio: ['hero', 'approach', 'filter', 'cta'],
  contact:   ['hero', 'connect', 'form'],
  footer:    ['brand', 'nav', 'legal'],
};

export default function PagesManager() {
  const { reloadContent } = useLanguage();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [editMap, setEditMap] = useState<EditMap>({});
  const [sectionStatus, setSectionStatus] = useState<SectionStatus>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [activePage, setActivePage] = useState('home');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchContent = useCallback(() => {
    setLoading(true);
    setFetchError(null);
    fetch('/api/content/admin', { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: ContentItem[]) => {
        if (!Array.isArray(data)) throw new Error('Unexpected response format');
        setContent(data);
        const map: EditMap = {};
        data.forEach(item => {
          map[item.key] = {
            en: item.value_en || '',
            bs: item.value_bs || '',
            fontSize:   item.font_size   || '',
            fontFamily: item.font_family || '',
            color:      item.text_color  || '',
          };
        });
        setEditMap(map);
      })
      .catch(err => {
        setFetchError(err.message || 'Unknown error');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  // Auto-open first section when page tab changes or content loads
  useEffect(() => {
    if (content.length === 0) return;
    const sections = getSections(activePage);
    if (sections.length > 0) {
      setOpenSections({ [sections[0]]: true });
    }
  }, [activePage, content]);

  const pages = Object.keys(PAGE_LABELS);

  const getSections = (page: string): string[] => {
    const present = Array.from(new Set(content.filter(i => i.page === page).map(i => i.section)));
    const order = SECTION_ORDER[page] ?? [];
    const ordered = order.filter(s => present.includes(s));
    const rest = present.filter(s => !order.includes(s));
    return [...ordered, ...rest];
  };

  const getFields = (page: string, section: string) =>
    content.filter(i => i.page === page && i.section === section);

  const handleChange = (key: string, lang: 'en' | 'bs', value: string) => {
    setEditMap(prev => ({ ...prev, [key]: { ...prev[key], [lang]: value } }));
  };

  const handleStyleChange = (key: string, styleField: 'fontSize' | 'fontFamily' | 'color', value: string) => {
    setEditMap(prev => ({ ...prev, [key]: { ...prev[key], [styleField]: value } }));
  };

  const saveSection = async (page: string, section: string) => {
    const sKey = `${page}:${section}`;
    setSectionStatus(prev => ({ ...prev, [sKey]: 'saving' }));

    const fields = getFields(page, section);
    const items = fields.map(f => ({
      key:         f.key,
      value_en:    editMap[f.key]?.en ?? '',
      value_bs:    editMap[f.key]?.bs ?? '',
      font_size:   editMap[f.key]?.fontSize   || null,
      font_family: editMap[f.key]?.fontFamily || null,
      text_color:  editMap[f.key]?.color      || null,
    }));

    try {
      const res = await fetch('/api/content/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error();
      setSectionStatus(prev => ({ ...prev, [sKey]: 'saved' }));
      reloadContent();
      setTimeout(() => setSectionStatus(prev => ({ ...prev, [sKey]: 'idle' })), 3000);
    } catch {
      setSectionStatus(prev => ({ ...prev, [sKey]: 'error' }));
      setTimeout(() => setSectionStatus(prev => ({ ...prev, [sKey]: 'idle' })), 3000);
    }
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 size={32} className="animate-spin text-gold-500" />
        <p className="text-white/30 text-sm">Učitavanje sadržaja...</p>
      </div>
    );
  }

  // ── Error state ──
  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-6 text-center">
        <ServerCrash size={40} className="text-red-400/60" />
        <div>
          <p className="text-white/60 font-medium mb-1">Greška pri učitavanju sadržaja</p>
          <p className="text-white/30 text-sm mb-2 font-mono">{fetchError}</p>
          <p className="text-white/20 text-xs max-w-sm">
            Provjerite da li je server pokrenut i da je baza podataka inicijalizirana.<br />
            Restartujte server pa pokušajte ponovo.
          </p>
        </div>
        <button
          onClick={fetchContent}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-sm rounded-sm transition-colors"
        >
          <RefreshCw size={14} /> Pokušaj ponovo
        </button>
      </div>
    );
  }

  // ── Empty state (server ran but table is empty — needs restart with new seed) ──
  if (content.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-6 text-center">
        <AlertCircle size={40} className="text-gold-500/40" />
        <div>
          <p className="text-white/60 font-medium mb-1">Nema podataka u bazi</p>
          <p className="text-white/30 text-sm max-w-sm">
            Tabela je prazna. Restartujte server da bi se automatski učitali podaci.
          </p>
        </div>
        <button
          onClick={fetchContent}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-sm rounded-sm transition-colors"
        >
          <RefreshCw size={14} /> Osvježi
        </button>
      </div>
    );
  }

  const sections = getSections(activePage);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Urednik stranica</h1>
          <p className="text-white/40 text-sm mt-1">
            Editujte naslove, opise i sadržaj za svaku stranicu — na oba jezika.
          </p>
        </div>
        <button
          onClick={fetchContent}
          className="flex items-center gap-2 text-white/30 hover:text-white/70 transition-colors text-sm"
        >
          <RefreshCw size={14} /> Osvježi
        </button>
      </div>

      {/* Page Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {pages.map(page => (
          <button
            key={page}
            onClick={() => setActivePage(page)}
            className={`px-4 py-2 rounded-sm text-xs font-bold tracking-widest uppercase transition-all duration-200 flex flex-col items-start ${
              activePage === page
                ? 'bg-gold-600/20 text-gold-400 border border-gold-600/30'
                : 'text-white/30 hover:text-white/60 hover:bg-white/5 border border-transparent'
            }`}
          >
            {PAGE_LABELS[page]}
            <span className="text-[8px] font-mono font-normal normal-case tracking-normal opacity-50 mt-0.5">
              {PAGE_PATHS[page]}
            </span>
          </button>
        ))}
      </div>

      {/* Sections */}
      {sections.length === 0 ? (
        <div className="text-center py-16 text-white/20 text-sm">
          Nema sekcija za ovu stranicu.
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map(section => {
            const sKey = `${activePage}:${section}`;
            const status = sectionStatus[sKey] || 'idle';
            const isOpen = openSections[section] ?? false;
            const fields = getFields(activePage, section);

            return (
              <div key={section} className="border border-white/10 rounded-sm bg-moody-900/50 overflow-hidden">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-white/80 font-medium text-sm">
                      {SECTION_LABELS[section] || section}
                    </span>
                    <span className="text-white/20 text-xs font-mono">{fields.length} polja</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {status === 'saving' && <Loader2 size={14} className="animate-spin text-gold-400" />}
                    {status === 'saved' && (
                      <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
                        <CheckCircle2 size={13} /> Sačuvano!
                      </span>
                    )}
                    {status === 'error' && (
                      <span className="flex items-center gap-1.5 text-red-400 text-xs">
                        <AlertCircle size={13} /> Greška!
                      </span>
                    )}
                    {isOpen
                      ? <ChevronUp size={16} className="text-white/30 flex-shrink-0" />
                      : <ChevronDown size={16} className="text-white/30 flex-shrink-0" />
                    }
                  </div>
                </button>

                {/* Section Body */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-2 space-y-5">

                        {/* Column labels (desktop) */}
                        <div className="hidden md:grid md:grid-cols-[200px_1fr_1fr] gap-4 border-b border-white/5 pb-3">
                          <div />
                          <div className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-gold-500/50 font-bold">
                            <Globe size={11} /> Engleski (ENG)
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-gold-500/50 font-bold">
                            <Globe size={11} /> Bosanski (BOS)
                          </div>
                        </div>

                        {/* Fields */}
                        {fields.map(field => {
                          const em = editMap[field.key] ?? { en: '', bs: '', fontSize: '', fontFamily: '', color: '' };
                          return (
                          <div key={field.key} className="space-y-2">
                            {/* Text row: Label | ENG | BOS */}
                            <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-[200px_1fr_1fr] md:gap-4 md:items-start">
                              {/* Label */}
                              <div className="md:pt-2">
                                <span className="text-white/60 text-xs font-medium leading-snug block">
                                  {field.label}
                                </span>
                                <span className="text-white/15 text-[10px] font-mono mt-0.5 block truncate" title={field.key}>
                                  {field.key}
                                </span>
                              </div>

                              {/* ENG */}
                              <div className="space-y-1">
                                <div className="md:hidden text-[9px] tracking-widest uppercase text-gold-500/40 font-bold">ENG</div>
                                {field.type === 'textarea' ? (
                                  <textarea
                                    value={em.en}
                                    onChange={e => handleChange(field.key, 'en', e.target.value)}
                                    rows={3}
                                    className="w-full bg-moody-950/60 border border-white/10 rounded-sm px-3 py-2.5 text-white/80 text-sm font-light resize-y focus:border-gold-500/40 focus:outline-none transition-colors leading-relaxed placeholder-white/20"
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={em.en}
                                    onChange={e => handleChange(field.key, 'en', e.target.value)}
                                    className="w-full bg-moody-950/60 border border-white/10 rounded-sm px-3 py-2.5 text-white/80 text-sm font-light focus:border-gold-500/40 focus:outline-none transition-colors"
                                  />
                                )}
                              </div>

                              {/* BOS */}
                              <div className="space-y-1">
                                <div className="md:hidden text-[9px] tracking-widest uppercase text-gold-500/40 font-bold">BOS</div>
                                {field.type === 'textarea' ? (
                                  <textarea
                                    value={em.bs}
                                    onChange={e => handleChange(field.key, 'bs', e.target.value)}
                                    rows={3}
                                    className="w-full bg-moody-950/60 border border-white/10 rounded-sm px-3 py-2.5 text-white/80 text-sm font-light resize-y focus:border-gold-500/40 focus:outline-none transition-colors leading-relaxed placeholder-white/20"
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={em.bs}
                                    onChange={e => handleChange(field.key, 'bs', e.target.value)}
                                    className="w-full bg-moody-950/60 border border-white/10 rounded-sm px-3 py-2.5 text-white/80 text-sm font-light focus:border-gold-500/40 focus:outline-none transition-colors"
                                  />
                                )}
                              </div>
                            </div>

                            {/* Typography row */}
                            <div className="ml-0 md:ml-[216px] flex flex-wrap items-center gap-x-5 gap-y-2 py-2 px-3 bg-white/[0.02] border border-white/5 rounded-sm">
                              {/* Font family */}
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] uppercase tracking-widest text-white/20 font-bold shrink-0">Font</span>
                                <div className="flex items-center gap-1">
                                  {(['serif', 'sans', 'script'] as const).map(ff => (
                                    <button
                                      key={ff}
                                      type="button"
                                      onClick={() => handleStyleChange(field.key, 'fontFamily', em.fontFamily === ff ? '' : ff)}
                                      title={ff === 'serif' ? 'Cormorant (serif)' : ff === 'sans' ? 'Montserrat (sans)' : 'Caveat (script)'}
                                      className={`px-2 py-0.5 text-[11px] rounded-sm border transition-all ${
                                        em.fontFamily === ff
                                          ? 'border-gold-500/50 bg-gold-500/10 text-gold-300'
                                          : 'border-white/10 text-white/30 hover:text-white/60 hover:border-white/20'
                                      }`}
                                      style={{ fontFamily: ff === 'serif' ? '"Cormorant Garamond", serif' : ff === 'sans' ? '"Montserrat", sans-serif' : '"Caveat", cursive' }}
                                    >
                                      {ff === 'serif' ? 'Serif' : ff === 'sans' ? 'Sans' : 'Script'}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Separator */}
                              <div className="w-[1px] h-4 bg-white/10 hidden sm:block" />

                              {/* Font size */}
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] uppercase tracking-widest text-white/20 font-bold shrink-0">Veličina</span>
                                <select
                                  value={em.fontSize}
                                  onChange={e => handleStyleChange(field.key, 'fontSize', e.target.value)}
                                  className="bg-moody-950/80 border border-white/10 text-white/50 text-[11px] px-2 py-0.5 rounded-sm focus:border-gold-500/40 focus:outline-none"
                                >
                                  {FONT_SIZE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Separator */}
                              <div className="w-[1px] h-4 bg-white/10 hidden sm:block" />

                              {/* Color */}
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] uppercase tracking-widest text-white/20 font-bold shrink-0">Boja</span>
                                <div className="flex items-center gap-1.5">
                                  {COLOR_PRESETS.map(preset => (
                                    <button
                                      key={preset.value}
                                      type="button"
                                      onClick={() => handleStyleChange(field.key, 'color', em.color === preset.value ? '' : preset.value)}
                                      title={preset.label}
                                      className={`w-4 h-4 rounded-full border-2 transition-all shrink-0 ${
                                        em.color === preset.value
                                          ? 'border-gold-400 scale-125'
                                          : 'border-white/20 hover:border-white/50'
                                      }`}
                                      style={{ background: preset.bg }}
                                    />
                                  ))}
                                  <input
                                    type="text"
                                    value={em.color}
                                    onChange={e => handleStyleChange(field.key, 'color', e.target.value)}
                                    placeholder="#hex / rgba"
                                    className="w-24 bg-moody-950/80 border border-white/10 rounded-sm px-2 py-0.5 text-white/40 text-[10px] font-mono focus:border-gold-500/40 focus:outline-none"
                                  />
                                  {em.color && (
                                    <button
                                      type="button"
                                      onClick={() => handleStyleChange(field.key, 'color', '')}
                                      className="text-white/20 hover:text-white/60 text-sm leading-none"
                                      title="Ukloni boju"
                                    >×</button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          );
                        })}

                        {/* Save button */}
                        <div className="flex justify-end pt-3 border-t border-white/5">
                          <button
                            onClick={() => saveSection(activePage, section)}
                            disabled={status === 'saving'}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gold-600/15 hover:bg-gold-600/25 border border-gold-600/25 hover:border-gold-600/40 text-gold-400 text-xs font-bold tracking-widest uppercase rounded-sm transition-all duration-200 disabled:opacity-40"
                          >
                            {status === 'saving'
                              ? <Loader2 size={13} className="animate-spin" />
                              : <Save size={13} />
                            }
                            Sačuvaj sekciju
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-white/15 text-xs text-center pb-4">
        Promjene se odmah primjenjuju na sajtu nakon snimanja. Sva polja podržavaju oba jezika.
      </p>
    </div>
  );
}

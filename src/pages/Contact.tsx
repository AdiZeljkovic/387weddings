import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';
import { respImg } from '../lib/img';
import { OliveBranch } from '../components/ornaments';

const HERO_FALLBACK =
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=1600';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const EMPTY = {
  name: '', email: '', phone: '', date: '', location: '',
  guests: '', coverage: '', video: '', places: '', message: '',
};

// Field skin from the board: 51px tall, hairline border, warm off-white fill
const INPUT =
  'box-border w-full h-[51px] px-4 py-3.5 border border-[#e0d9cc] rounded-none bg-cream-soft ' +
  'font-sans text-[14px] font-light text-[#1a1a1a] placeholder:text-[#b3aca2] ' +
  'outline-none focus:border-gold-600 transition-colors duration-250';
const AREA =
  'box-border w-full px-4 py-3.5 border border-[#e0d9cc] rounded-none bg-cream-soft ' +
  'font-sans text-[14px] font-light text-[#1a1a1a] placeholder:text-[#b3aca2] resize-none ' +
  'outline-none focus:border-gold-600 transition-colors duration-250';

const Label = ({ htmlFor, children, required, style }: {
  htmlFor: string; children: React.ReactNode; required?: boolean; style?: React.CSSProperties;
}) => (
  <label
    htmlFor={htmlFor}
    style={style}
    className="block text-[11px] font-semibold tracking-[0.18em] uppercase text-[#1a1a1a]/75 mb-2"
  >
    {children}
    {required && <span className="text-gold-600 opacity-55 ml-1" aria-hidden="true">*</span>}
  </label>
);

// Group heading: small gold caps followed by a rule that fills the row
const GroupLabel = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div className="flex items-center gap-4 -mb-1">
    <span
      style={style}
      className="text-[11px] font-medium tracking-[0.3em] uppercase text-gold-label whitespace-nowrap"
    >
      {children}
    </span>
    <span aria-hidden="true" className="flex-1 h-px bg-[#e6e2db]" />
  </div>
);

const Contact = () => {
  const { t, getContentStyle } = useLanguage();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({ ...EMPTY });
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [showModal, setShowModal] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    loadSettings().then(setSettings).catch(err => console.warn('Contact: settings load failed', err));
  }, []);

  const set = (k: keyof typeof EMPTY) => (v: string) => setFormData(p => ({ ...p, [k]: v }));

  const closeModal = useCallback(() => { setShowModal(false); setStatus('idle'); }, []);

  useEffect(() => {
    if (!showModal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [showModal, closeModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !consent) return;
    setStatus('submitting');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Server error');
      setStatus('success');
      setShowModal(true);
      setFormData({ ...EMPTY });
      setConsent(false);
    } catch {
      setStatus('error');
    }
  };

  const submitting = status === 'submitting';
  const today = new Date().toISOString().split('T')[0];

  // The brief asks for a separate mobile frame so a tall crop can be chosen
  const heroDesktop = respImg(settings['img.contact.hero'] || HERO_FALLBACK);
  const heroMobile = respImg(
    settings['img.contact.hero.mobile'] || settings['img.contact.hero'] || HERO_FALLBACK,
  );

  const optionsFor = (base: string, count: number) =>
    Array.from({ length: count }, (_, i) => t(`${base}.opt.${i + 1}`))
      .filter(v => v && !v.startsWith(`${base}.opt.`));
  const coverageOptions = optionsFor('contact.form.coverage', 5);
  const videoOptions = optionsFor('contact.form.video', 3);

  const heading = (
    <h1 className="font-serif font-light text-[clamp(22px,7vw,32px)] lg:text-[48px] leading-[1.2] lg:leading-[60px] tracking-[0.04em] lg:tracking-[0.1em] uppercase m-0 mb-3.5 max-w-full break-words">
      <span className="block" style={getContentStyle('contact.hero.title.part1')}>
        {t('contact.hero.title.part1')}
      </span>
      <span className="block">
        <span style={getContentStyle('contact.hero.title.part2')}>{t('contact.hero.title.part2')}</span>{' '}
        <span className="italic text-love" style={getContentStyle('contact.hero.title.part3')}>
          {t('contact.hero.title.part3')}
        </span>
      </span>
    </h1>
  );

  const ornament = (
    <div aria-hidden="true" className="flex items-center justify-center gap-3 mb-7 lg:mb-9">
      <span className="w-12 lg:w-16 h-px bg-gold-600 opacity-60" />
      <span className="w-1.5 h-1.5 bg-love rotate-45" />
      <span className="w-12 lg:w-16 h-px bg-gold-600 opacity-60" />
    </div>
  );

  const intro = (
    <p
      style={getContentStyle('contact.hero.desc')}
      className="text-[13px] lg:text-[14px] font-light leading-[1.95] lg:leading-[27.5px] text-[#6b6b6b] max-w-[340px] lg:max-w-[384px] m-0"
    >
      {t('contact.hero.desc')}
    </p>
  );

  return (
    <div className="bg-cream">
      {/* ── Success modal ──────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center p-5"
          role="dialog" aria-modal="true" aria-labelledby="contact-success-title">
          <div className="absolute inset-0 bg-ink-900/55" onClick={closeModal} aria-hidden="true" />
          <div className="relative w-full max-w-md bg-white border border-rule px-7 py-10 text-center shadow-2xl">
            <button ref={closeBtnRef} onClick={closeModal} aria-label={t('contact.form.close')}
              className="absolute top-3.5 right-3.5 w-11 h-11 flex items-center justify-center text-ink-400 hover:text-ink-900 transition-colors">
              <X size={17} />
            </button>
            <CheckCircle2 size={38} strokeWidth={1.2} className="text-gold-600 mx-auto mb-5" aria-hidden="true" />
            <h2 id="contact-success-title" style={getContentStyle('contact.form.success.title')}
              className="text-2xl font-serif font-light text-ink-900 mb-3">
              {t('contact.form.success.title')}
            </h2>
            <p style={getContentStyle('contact.form.success.desc')}
              className="text-ink-500 text-sm font-light leading-relaxed">
              {t('contact.form.success.desc')}
            </p>
          </div>
        </div>
      )}

      {/* ── Hero — text beside a slowly zooming frame on desktop, above its own
          frame on a phone. The title, ornament and intro are one set of
          elements; only the box around them changes. The two crops the brief
          asks for come from <picture>, so there is still a single <img>.     */}
      <section className="relative lg:flex bg-[#f7f6f3] lg:h-[464px] overflow-hidden">
        <div className="flex-1 min-w-0 flex flex-col items-center justify-center text-center px-6 lg:px-16 pt-12 pb-9 lg:py-0">
          {heading}{ornament}{intro}
        </div>

        <div className="relative flex-none w-full h-[320px] lg:w-[661px] lg:h-auto overflow-hidden">
          <picture className="block w-full h-full">
            <source media="(min-width: 1024px)" srcSet={heroDesktop.srcSet || heroDesktop.src} sizes="46vw" />
            <img
              src={heroMobile.src} srcSet={heroMobile.srcSet} sizes="100vw" alt="" aria-hidden="true"
              className="w-full h-full object-cover lg:animate-[slowZoom_18s_ease-in-out_infinite_alternate] motion-reduce:animate-none"
              loading="eager" fetchPriority="high" decoding="async" draggable={false} referrerPolicy="no-referrer"
            />
          </picture>
          {/* Desktop: the frame fades into the text column on its left */}
          <span aria-hidden="true"
            className="hidden lg:block absolute inset-y-0 left-0 w-[70%] bg-[linear-gradient(90deg,#f7f6f3_0%,rgba(247,246,243,.65)_45%,rgba(247,246,243,0)_100%)]" />
          {/* Phones: it fades into the page above and the form below */}
          <span aria-hidden="true" className="lg:hidden absolute inset-x-0 top-0 h-24 bg-[linear-gradient(#f7f6f3,rgba(247,246,243,0))]" />
          <span aria-hidden="true" className="lg:hidden absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(rgba(255,255,255,0),#ffffff)]" />
        </div>
      </section>

      {/* ── The form ───────────────────────────────────────────────────────── */}
      <section className="bg-white px-5 lg:px-6 pt-14 lg:pt-24 pb-16 lg:pb-20">
        <form
          onSubmit={handleSubmit}
          method="post"
          action="/api/contact"
          className="max-w-[768px] mx-auto flex flex-col gap-7"
        >
          {/* About you */}
          <GroupLabel style={getContentStyle('contact.group.you')}>{t('contact.group.you')}</GroupLabel>

          <div>
            <Label htmlFor="c-name" required style={getContentStyle('contact.form.name')}>{t('contact.form.name')}</Label>
            <input id="c-name" name="name" type="text" required autoComplete="name" className={INPUT}
              placeholder={t('contact.form.name.placeholder')}
              value={formData.name} onChange={e => set('name')(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
            <div>
              <Label htmlFor="c-email" required style={getContentStyle('contact.form.email')}>{t('contact.form.email')}</Label>
              <input id="c-email" name="email" type="email" required autoComplete="email" className={INPUT}
                placeholder={t('contact.form.email.placeholder')}
                value={formData.email} onChange={e => set('email')(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="c-phone" style={getContentStyle('contact.form.phone')}>{t('contact.form.phone')}</Label>
              <input id="c-phone" name="phone" type="tel" autoComplete="tel" className={INPUT}
                placeholder={t('contact.form.phone.placeholder')}
                value={formData.phone} onChange={e => set('phone')(e.target.value)} />
            </div>
          </div>

          {/* About the wedding */}
          <GroupLabel style={getContentStyle('contact.group.wedding')}>{t('contact.group.wedding')}</GroupLabel>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
            <div>
              <Label htmlFor="c-date" required style={getContentStyle('contact.form.date')}>{t('contact.form.date')}</Label>
              <input id="c-date" name="date" type="text" required min={today} className={INPUT}
                placeholder={t('contact.form.date.placeholder')}
                onFocus={e => { e.target.type = 'date'; }}
                onBlur={e => { if (!e.target.value) e.target.type = 'text'; }}
                value={formData.date} onChange={e => set('date')(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="c-location" required style={getContentStyle('contact.form.location')}>{t('contact.form.location')}</Label>
              <input id="c-location" name="location" type="text" required className={INPUT}
                placeholder={t('contact.form.location.placeholder')}
                value={formData.location} onChange={e => set('location')(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="c-guests" required style={getContentStyle('contact.form.guests')}>{t('contact.form.guests')}</Label>
              <input id="c-guests" name="guests" type="number" required min="1"
                className={`${INPUT} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                placeholder={t('contact.form.guests.placeholder')}
                value={formData.guests} onChange={e => set('guests')(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="c-coverage" required style={getContentStyle('contact.form.coverage')}>{t('contact.form.coverage')}</Label>
              <select id="c-coverage" name="coverage" required
                className={`${INPUT} appearance-none cursor-pointer ${!formData.coverage ? 'text-[#b3aca2]' : ''}`}
                value={formData.coverage} onChange={e => set('coverage')(e.target.value)}>
                <option value="">{t('contact.form.coverage.placeholder')}</option>
                {coverageOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="c-video" style={getContentStyle('contact.form.video')}>{t('contact.form.video')}</Label>
            <select id="c-video" name="video"
              className={`${INPUT} appearance-none cursor-pointer ${!formData.video ? 'text-[#b3aca2]' : ''}`}
              value={formData.video} onChange={e => set('video')(e.target.value)}>
              <option value="">{t('contact.form.video.placeholder')}</option>
              {videoOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* Your story */}
          <GroupLabel style={getContentStyle('contact.group.story')}>{t('contact.group.story')}</GroupLabel>

          <div>
            <Label htmlFor="c-places" style={getContentStyle('contact.form.places')}>{t('contact.form.places')}</Label>
            <textarea id="c-places" name="places" rows={3} className={AREA}
              placeholder={t('contact.form.places.placeholder')}
              value={formData.places} onChange={e => set('places')(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="c-message" style={getContentStyle('contact.form.story')}>{t('contact.form.story')}</Label>
            <textarea id="c-message" name="message" rows={4} className={`${AREA} h-[114px]`}
              placeholder={t('contact.form.story.placeholder')}
              value={formData.message} onChange={e => set('message')(e.target.value)} />
          </div>

          <label htmlFor="c-consent" className="flex items-center gap-3 text-[13px] font-light text-[#6b6b6b] -mt-1 min-h-11 cursor-pointer">
            <input id="c-consent" name="consent" type="checkbox" required checked={consent}
              onChange={e => setConsent(e.target.checked)}
              className="w-4 h-4 m-0 flex-none accent-ink-900 cursor-pointer" />
            <span style={getContentStyle('contact.form.consent')}>{t('contact.form.consent')}</span>
          </label>

          {status === 'error' && (
            <p role="alert" style={getContentStyle('contact.form.error')}
              className="flex items-center gap-2.5 text-[13px] text-red-700 font-light">
              <AlertCircle size={15} className="flex-none" aria-hidden="true" />
              {t('contact.form.error')}
            </p>
          )}

          <div className="flex justify-center mt-4">
            <button type="submit" disabled={submitting}
              style={getContentStyle('contact.form.submit')}
              className="btn btn-solid w-full sm:w-[280px] h-[54px] border-0 bg-ink-900 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[11px] font-semibold tracking-[0.25em] uppercase flex items-center justify-center gap-3">
              {submitting && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
              {submitting ? t('contact.form.sending') : `${t('contact.form.submit')} →`}
            </button>
          </div>
        </form>
      </section>

      {/* ── Response note ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#f7f6f3] text-center px-6 pt-[72px] pb-20">
        <OliveBranch className="hidden lg:block absolute top-10 w-[300px] left-[calc(50%-620px)] animate-[drift_16s_ease-in-out_infinite_alternate] motion-reduce:animate-none" />
        <OliveBranch className="hidden lg:block absolute top-10 w-[300px] right-[calc(50%-620px)] animate-[drift_16s_ease-in-out_infinite_alternate] motion-reduce:animate-none" flip />
        <p
          style={getContentStyle('contact.response.note')}
          className="relative text-[14px] font-light leading-[26px] text-[#6b6b6b] max-w-[460px] mx-auto whitespace-pre-line"
        >
          {t('contact.response.note')}
        </p>
      </section>
    </div>
  );
};

export default Contact;

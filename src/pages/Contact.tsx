import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';
import { respImg } from '../lib/img';
import { OliveBranch } from '../components/ornaments';
import Reveal from '../components/Reveal';

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

// The one-line reason a field is not accepted, under the field itself
const FieldError = ({ id, message }: { id: string; message?: string }) =>
  message ? (
    <p id={`${id}-err`} role="alert" className="flex items-center gap-1.5 mt-1.5 text-[12px] font-light text-red-700">
      <AlertCircle size={12} className="flex-none" aria-hidden="true" />
      {message}
    </p>
  ) : null;

const errRing = (bad?: string) => (bad ? ' !border-red-600 focus:!border-red-600' : '');

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
const GroupLabel = ({ children, style, delay = 0 }: {
  children: React.ReactNode; style?: React.CSSProperties; delay?: number;
}) => (
  <Reveal delay={delay} className="flex items-center gap-4 -mb-1">
    <span
      style={style}
      className="text-[11px] font-medium tracking-[0.3em] uppercase text-gold-label whitespace-nowrap"
    >
      {children}
    </span>
    <span aria-hidden="true" className="flex-1 h-px bg-[#e6e2db]" />
  </Reveal>
);

const Contact = () => {
  const { t, getContentStyle } = useLanguage();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({ ...EMPTY });
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings().then(setSettings).catch(err => console.warn('Contact: settings load failed', err));
  }, []);

  const set = (k: keyof typeof EMPTY) => (v: string) => setFormData(p => ({ ...p, [k]: v }));
  // Typing into a field clears its complaint rather than leaving it red
  const clearErr = (k: string) =>
    setErrors(p => (p[k] ? { ...p, [k]: '' } : p));


  // A press on the button with an empty form used to return silently: nothing
  // happened and nothing said what was missing.
  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = t('contact.err.name');
    if (!formData.email.trim()) e.email = t('contact.err.email');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email.trim())) e.email = t('contact.err.email.bad');
    if (!formData.date.trim()) e.date = t('contact.err.date');
    if (!consent) e.consent = t('contact.err.consent');
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // Put the cursor on the first thing that needs filling in
      const first = ['name', 'email', 'date', 'consent'].find(k => found[k]);
      document.getElementById(`c-${first}`)?.focus();
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Server error');
      setStatus('success');
      setFormData({ ...EMPTY });
      setConsent(false);
      setErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <Reveal as="h1" className="font-serif font-light text-[clamp(22px,7.2vw,28px)] lg:text-[clamp(32px,2.8vw,40px)] leading-[1.36] lg:leading-[1.3] tracking-[0.1em] uppercase m-0 mb-3.5 max-w-full break-words">
      <span className="block" style={getContentStyle('contact.hero.title.part1')}>
        {t('contact.hero.title.part1')}
      </span>
      <span className="block">
        <span style={getContentStyle('contact.hero.title.part2')}>{t('contact.hero.title.part2')}</span>{' '}
        <span className="italic text-love" style={getContentStyle('contact.hero.title.part3')}>
          {t('contact.hero.title.part3')}
        </span>
      </span>
    </Reveal>
  );

  const ornament = (
    <div aria-hidden="true" className="flex items-center justify-center gap-3 mb-6 lg:mb-9">
      <Reveal as="span" kind="line" className="block w-12 lg:w-16 h-px bg-gold-600 opacity-60" />
      <span className="w-1.5 h-1.5 bg-love rotate-45" />
      <Reveal as="span" kind="line" className="block w-12 lg:w-16 h-px bg-gold-600 opacity-60" />
    </div>
  );

  const intro = (
    <Reveal
      as="p"
      delay={0.1}
      style={getContentStyle('contact.hero.desc')}
      className="text-[13px] lg:text-[14px] font-light leading-[1.95] lg:leading-[27.5px] text-[#6b6b6b] max-w-[340px] lg:max-w-[384px] m-0"
    >
      {t('contact.hero.desc')}
    </Reveal>
  );

  return (
    <div className="bg-cream">
      {/* ── Hero — text beside a slowly zooming frame on desktop, above its own
          frame on a phone. The title, ornament and intro are one set of
          elements; only the box around them changes. The two crops the brief
          asks for come from <picture>, so there is still a single <img>.     */}
      <section className="relative lg:flex bg-[#f7f6f3] lg:h-[min(640px,40vw)] overflow-hidden">
        <div className="flex-1 min-w-0 flex flex-col items-center justify-center text-center px-6 lg:px-16 pt-11 pb-7 lg:py-0">
          {heading}{ornament}{intro}
        </div>

        <Reveal kind="mask" className="rv-zoom relative flex-none w-full h-[220px] lg:w-auto lg:flex-[0_0_50%] lg:h-auto overflow-hidden">
          <picture className="block w-full h-full">
            <source media="(min-width: 1024px)" srcSet={heroDesktop.srcSet || heroDesktop.src} sizes="50vw" />
            <img
              src={heroMobile.src} srcSet={heroMobile.srcSet} sizes="100vw" alt="" aria-hidden="true"
              className="w-full h-full object-cover lg:animate-[slowZoom_18s_ease-in-out_infinite_alternate] motion-reduce:animate-none"
              loading="eager" fetchPriority="high" decoding="async" draggable={false} referrerPolicy="no-referrer"
            />
          </picture>
          {/* Desktop: the frame fades into the text column on its left */}
          <span aria-hidden="true"
            className="hidden lg:block absolute inset-y-0 left-0 w-1/2 bg-[linear-gradient(90deg,#f7f6f3_0%,rgba(247,246,243,.65)_45%,rgba(247,246,243,0)_100%)]" />
          {/* Phones: it fades into the page above and the form below */}
          <span aria-hidden="true" className="lg:hidden absolute inset-x-0 top-0 h-24 bg-[linear-gradient(#f7f6f3,rgba(247,246,243,0))]" />
          <span aria-hidden="true" className="lg:hidden absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(rgba(255,255,255,0),#ffffff)]" />
        </Reveal>
      </section>

      {/* ── The form ───────────────────────────────────────────────────────── */}
      <section className="bg-white px-5 lg:px-6 pt-12 lg:pt-24 pb-14 lg:pb-20">
        {status === 'success' ? (
          <div
            role="status"
            className="max-w-[560px] mx-auto border border-rule bg-cream-soft text-center px-6 lg:px-10 py-14 lg:py-16"
          >
            <CheckCircle2 size={38} strokeWidth={1.2} className="text-gold-600 mx-auto mb-5" aria-hidden="true" />
            <h2
              style={getContentStyle('contact.form.success.title')}
              className="font-serif font-light text-[24px] lg:text-[28px] text-ink-900 m-0 mb-3"
            >
              {t('contact.form.success.title')}
            </h2>
            <p
              style={getContentStyle('contact.form.success.desc')}
              className="text-ink-500 text-[14px] font-light leading-[1.85] max-w-[400px] mx-auto m-0"
            >
              {t('contact.form.success.desc')}
            </p>
            <button
              type="button"
              onClick={() => setStatus('idle')}
              style={getContentStyle('contact.form.again')}
              className="btn mt-9 inline-block border border-ink-900/30 text-ink-900 text-[11px] font-medium tracking-[0.22em] uppercase px-8 py-3.5 hover:text-white"
            >
              {t('contact.form.again')}
            </button>
          </div>
        ) : (
        <form
          onSubmit={handleSubmit}
          method="post"
          action="/api/contact"
          className="max-w-[768px] mx-auto flex flex-col gap-7"
        >
          {/* About you */}
          <GroupLabel delay={0.06} style={getContentStyle('contact.group.you')}>{t('contact.group.you')}</GroupLabel>

          <div>
            <Label htmlFor="c-name" required style={getContentStyle('contact.form.name')}>{t('contact.form.name')}</Label>
            <input id="c-name" name="name" type="text" autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'c-name-err' : undefined}
              className={INPUT + errRing(errors.name)}
              placeholder={t('contact.form.name.placeholder')}
              value={formData.name} onChange={e => { set('name')(e.target.value); clearErr('name'); }} />
            <FieldError id="c-name" message={errors.name} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
            <div>
              <Label htmlFor="c-email" required style={getContentStyle('contact.form.email')}>{t('contact.form.email')}</Label>
              <input id="c-email" name="email" type="email" autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'c-email-err' : undefined}
                className={INPUT + errRing(errors.email)}
                placeholder={t('contact.form.email.placeholder')}
                value={formData.email} onChange={e => { set('email')(e.target.value); clearErr('email'); }} />
              <FieldError id="c-email" message={errors.email} />
            </div>
            <div>
              <Label htmlFor="c-phone" style={getContentStyle('contact.form.phone')}>{t('contact.form.phone')}</Label>
              <input id="c-phone" name="phone" type="tel" autoComplete="tel" className={INPUT}
                placeholder={t('contact.form.phone.placeholder')}
                value={formData.phone} onChange={e => set('phone')(e.target.value)} />
            </div>
          </div>

          {/* About the wedding */}
          <GroupLabel delay={0.12} style={getContentStyle('contact.group.wedding')}>{t('contact.group.wedding')}</GroupLabel>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
            <div>
              <Label htmlFor="c-date" required style={getContentStyle('contact.form.date')}>{t('contact.form.date')}</Label>
              <input id="c-date" name="date" type="date" min={today}
                aria-invalid={Boolean(errors.date)}
                aria-describedby={errors.date ? 'c-date-err' : undefined}
                className={INPUT + errRing(errors.date)}
                value={formData.date} onChange={e => { set('date')(e.target.value); clearErr('date'); }} />
              <FieldError id="c-date" message={errors.date} />
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
          <GroupLabel delay={0.18} style={getContentStyle('contact.group.story')}>{t('contact.group.story')}</GroupLabel>

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

          <div className="-mt-1">
            <label htmlFor="c-consent" className="flex items-center gap-3 text-[13px] font-light text-[#6b6b6b] min-h-11 cursor-pointer">
              <input id="c-consent" name="consent" type="checkbox" checked={consent}
                aria-invalid={Boolean(errors.consent)}
                aria-describedby={errors.consent ? 'c-consent-err' : undefined}
                onChange={e => { setConsent(e.target.checked); clearErr('consent'); }}
                className={`w-4 h-4 m-0 flex-none accent-ink-900 cursor-pointer${
                  errors.consent ? ' outline outline-1 outline-red-600 outline-offset-2' : ''}`} />
              <span style={getContentStyle('contact.form.consent')}>{t('contact.form.consent')}</span>
            </label>
            <FieldError id="c-consent" message={errors.consent} />
          </div>

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
        )}
      </section>

      {/* ── Response note ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white lg:bg-[#f7f6f3] text-center px-6 pt-14 lg:pt-[72px] pb-0 lg:pb-20">
        <OliveBranch className="hidden lg:block absolute top-10 w-[300px] left-[calc(50%-620px)] animate-[drift_16s_ease-in-out_infinite_alternate] motion-reduce:animate-none" />
        <OliveBranch className="hidden lg:block absolute top-10 w-[300px] right-[calc(50%-620px)] animate-[drift_16s_ease-in-out_infinite_alternate] motion-reduce:animate-none" flip />
        <Reveal
          as="p"
          style={getContentStyle('contact.response.note')}
          className="relative text-[14px] font-light leading-[26px] text-[#6b6b6b] max-w-[460px] mx-auto whitespace-pre-line"
        >
          {t('contact.response.note')}
        </Reveal>
      </section>
    </div>
  );
};

export default Contact;

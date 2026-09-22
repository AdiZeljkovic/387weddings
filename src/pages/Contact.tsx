import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Instagram, Facebook, Youtube, CheckCircle2, AlertCircle, Loader2,
  User, Users, Mail, Phone, MapPin, Calendar, ChevronDown, Heart, X,
} from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';
import { respImg } from '../lib/img';
import { EASE } from '../components/anim';

const TikTokIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.87a8.18 8.18 0 0 0 4.78 1.52V7a4.85 4.85 0 0 1-1.02-.31z" />
  </svg>
);

const HERO_FALLBACK =
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=1600';

// Olive sprig in the top corner. Purely decorative — the client can replace it
// with their own artwork through the `img.contact.ornament` slot.
const OliveSprig = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 220 180" fill="none" className={className} aria-hidden="true">
    <path d="M6 4C42 22 74 52 96 92c12 22 20 46 24 70" stroke="#8a9470" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
    <path d="M30 12c26 4 48 20 60 44" stroke="#8a9470" strokeWidth="1.1" strokeLinecap="round" opacity="0.6" />
    {[
      [22, 20, -32], [44, 36, -20], [66, 56, -12], [86, 80, -4], [100, 106, 6], [112, 134, 14],
      [50, 16, 28], [74, 30, 36], [94, 50, 44], [36, 48, -64], [58, 72, -56], [78, 100, -48],
    ].map(([cx, cy, rot], i) => (
      <ellipse
        key={i}
        cx={cx}
        cy={cy}
        rx="13"
        ry="6.5"
        fill="#9aa47e"
        opacity={i % 2 === 0 ? 0.55 : 0.38}
        transform={`rotate(${rot} ${cx} ${cy})`}
      />
    ))}
  </svg>
);

// ── Field chrome ─────────────────────────────────────────────────────────────
// Label above, white box below, accent icon parked on the right edge.
const Field = ({ id, label, labelStyle, required, children, icon, iconTop = false, className = '', delay = 0 }: {
  id: string;
  label: string;
  labelStyle?: React.CSSProperties;
  required?: boolean;
  children: React.ReactNode;
  icon: React.ReactNode;
  iconTop?: boolean;
  className?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0 }}
    transition={{ duration: 0.75, delay, ease: EASE }}
    className={className}
  >
    <label
      htmlFor={id}
      style={labelStyle}
      className="block text-[10px] md:text-[11px] tracking-[0.18em] uppercase font-semibold text-ink-900/75 mb-2.5"
    >
      {label}
      {required && <span className="text-gold-600 ml-1" aria-hidden="true">*</span>}
    </label>

    <div className="relative">
      {children}
      <span
        className={`pointer-events-none absolute right-4 text-gold-500 ${
          iconTop ? 'top-4' : 'top-1/2 -translate-y-1/2'
        }`}
        aria-hidden="true"
      >
        {icon}
      </span>
    </div>
  </motion.div>
);

const BOX =
  'w-full bg-white border border-canvas-200 rounded-[3px] px-4 py-3.5 pr-11 ' +
  'text-[14px] text-ink-900 font-light placeholder:text-ink-400 placeholder:font-light ' +
  'outline-none focus:border-gold-500 transition-colors duration-300';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const EMPTY = {
  name: '', email: '', phone: '', date: '', location: '',
  guests: '', coverage: '', video: '', places: '', message: '',
};

const Contact = () => {
  const { t, getContentStyle } = useLanguage();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({ ...EMPTY });
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [showModal, setShowModal] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    loadSettings()
      .then(setSettings)
      .catch(err => console.warn('Contact: settings load failed', err));
  }, []);

  const set = (k: keyof typeof EMPTY) => (v: string) =>
    setFormData(prev => ({ ...prev, [k]: v }));

  const closeModal = useCallback(() => {
    setShowModal(false);
    setStatus('idle');
  }, []);

  // Trap Escape + lock scroll while the success dialog is open
  useEffect(() => {
    if (!showModal) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', handleEsc);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = prevOverflow;
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
  const hero = respImg(settings['img.contact.hero'] || HERO_FALLBACK, [640, 1024, 1600]);
  const ornament = settings['img.contact.ornament'];

  // Dropdown options live in the CMS; a blank entry simply disappears
  const optionsFor = (base: string, count: number) =>
    Array.from({ length: count }, (_, i) => t(`${base}.opt.${i + 1}`))
      .filter(v => v && !v.startsWith(`${base}.opt.`));

  const coverageOptions = optionsFor('contact.form.coverage', 5);
  const videoOptions = optionsFor('contact.form.video', 3);

  const socials = [
    { icon: <Instagram size={19} strokeWidth={1.5} />, href: settings.instagram, label: 'Instagram' },
    { icon: <Facebook size={19} strokeWidth={1.5} />, href: settings.facebook, label: 'Facebook' },
    { icon: <Youtube size={19} strokeWidth={1.5} />, href: settings.youtube, label: 'YouTube' },
    { icon: <TikTokIcon size={18} />, href: settings.tiktok, label: 'TikTok' },
  ].filter(s => s.href && s.href !== '#');

  return (
    <div className="bg-canvas-50">
      {/* ── Success modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <div
            className="fixed inset-0 z-[1500] flex items-center justify-center p-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-success-title"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="absolute inset-0 bg-ink-900/55 backdrop-blur-sm"
              onClick={closeModal}
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.55, ease: EASE }}
              className="relative w-full max-w-md bg-canvas-50 border border-canvas-200 rounded-[4px] px-7 py-10 text-center shadow-2xl"
            >
              <button
                ref={closeBtnRef}
                onClick={closeModal}
                className="absolute top-3.5 right-3.5 w-9 h-9 flex items-center justify-center text-ink-400 hover:text-ink-900 transition-colors"
                aria-label={t('contact.form.close')}
              >
                <X size={17} />
              </button>

              <CheckCircle2 size={38} strokeWidth={1.2} className="text-gold-500 mx-auto mb-5" aria-hidden="true" />
              <h2
                id="contact-success-title"
                style={getContentStyle('contact.form.success.title')}
                className="text-2xl font-serif font-light text-ink-900 mb-3"
              >
                {t('contact.form.success.title')}
              </h2>
              <p
                style={getContentStyle('contact.form.success.desc')}
                className="text-ink-500 text-sm font-light leading-relaxed"
              >
                {t('contact.form.success.desc')}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Hero — statement on paper, photograph bleeding off the right ───── */}
      <section className="relative bg-canvas-100 overflow-hidden">
        {/* Photograph: a band on top for phones, the right column on desktop */}
        <div className="relative lg:absolute lg:inset-y-0 lg:right-0 lg:w-[46%]">
          <img
            src={hero.src}
            srcSet={hero.srcSet}
            sizes="(min-width: 1024px) 46vw, 100vw"
            alt=""
            aria-hidden="true"
            className="w-full h-[200px] sm:h-[280px] lg:h-full object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            draggable={false}
            referrerPolicy="no-referrer"
          />
          {/* Soft dissolve into the paper — sideways on desktop, upward on phones */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-canvas-100 via-canvas-100/15 to-transparent lg:bg-gradient-to-r lg:from-canvas-100 lg:via-canvas-100/35 lg:to-transparent"
            aria-hidden="true"
          />
        </div>

        {/* Sprig in the corner */}
        <div className="absolute -top-2 -left-3 w-32 sm:w-44 lg:w-56 pointer-events-none select-none" aria-hidden="true">
          {ornament
            ? <img src={ornament} alt="" className="w-full h-auto" draggable={false} referrerPolicy="no-referrer" />
            : <OliveSprig className="w-full h-auto" />}
        </div>

        <div className="relative max-w-[1500px] mx-auto px-6 sm:px-8 lg:px-16 py-14 sm:py-16 lg:py-28 lg:pr-[50%]">
          <div className="text-center">
            <h1 className="font-serif font-light text-ink-900 text-[1.9rem] sm:text-4xl lg:text-[3rem] uppercase tracking-[0.1em] leading-[1.3] lg:leading-[1.25]">
              {(['part1', 'part2'] as const).map((part, i) => (
                <motion.span
                  key={part}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.95, delay: 0.15 + i * 0.13, ease: EASE }}
                  style={getContentStyle(`contact.hero.title.${part}`)}
                  className="block"
                >
                  {t(`contact.hero.title.${part}`)}
                </motion.span>
              ))}
            </h1>

            {/* Rule — heart — rule */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.5, ease: EASE }}
              className="flex items-center justify-center gap-3 mt-6 mb-7"
              aria-hidden="true"
            >
              <span className="w-12 sm:w-16 h-[1px] bg-gold-500/55" />
              <Heart size={13} strokeWidth={1.4} className="text-gold-500" />
              <span className="w-12 sm:w-16 h-[1px] bg-gold-500/55" />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.95, delay: 0.6, ease: EASE }}
              style={getContentStyle('contact.hero.desc')}
              className="text-ink-500 font-light text-[13px] sm:text-sm leading-[1.95] max-w-sm mx-auto"
            >
              {t('contact.hero.desc')}
            </motion.p>
          </div>
        </div>
      </section>

      {/* ── The form ───────────────────────────────────────────────────────── */}
      <section className="bg-canvas-50 py-14 md:py-20 px-6 sm:px-8 lg:px-16">
        <form onSubmit={handleSubmit} noValidate={false} className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-7 gap-y-7">
            {/* Name — full width */}
            <Field
              id="c-name"
              label={t('contact.form.name')}
              labelStyle={getContentStyle('contact.form.name')}
              required
              icon={<User size={17} strokeWidth={1.4} />}
              className="md:col-span-2"
            >
              <input
                id="c-name"
                type="text"
                required
                autoComplete="name"
                value={formData.name}
                onChange={e => set('name')(e.target.value)}
                placeholder={t('contact.form.name.placeholder')}
                className={BOX}
              />
            </Field>

            <Field
              id="c-email"
              label={t('contact.form.email')}
              labelStyle={getContentStyle('contact.form.email')}
              required
              icon={<Mail size={17} strokeWidth={1.4} />}
              delay={0.05}
            >
              <input
                id="c-email"
                type="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={e => set('email')(e.target.value)}
                placeholder={t('contact.form.email.placeholder')}
                className={BOX}
              />
            </Field>

            <Field
              id="c-phone"
              label={t('contact.form.phone')}
              labelStyle={getContentStyle('contact.form.phone')}
              icon={<Phone size={17} strokeWidth={1.4} />}
              delay={0.05}
            >
              <input
                id="c-phone"
                type="tel"
                autoComplete="tel"
                value={formData.phone}
                onChange={e => set('phone')(e.target.value)}
                placeholder={t('contact.form.phone.placeholder')}
                className={BOX}
              />
            </Field>

            {/* Date — stays a text box until focused, so the placeholder reads */}
            <Field
              id="c-date"
              label={t('contact.form.date')}
              labelStyle={getContentStyle('contact.form.date')}
              required
              icon={<Calendar size={17} strokeWidth={1.4} />}
              delay={0.1}
            >
              <input
                id="c-date"
                type="text"
                required
                min={today}
                value={formData.date}
                onChange={e => set('date')(e.target.value)}
                onFocus={e => { e.target.type = 'date'; }}
                onBlur={e => { if (!e.target.value) e.target.type = 'text'; }}
                placeholder={t('contact.form.date.placeholder')}
                className={`${BOX} [&::-webkit-calendar-picker-indicator]:opacity-0`}
              />
            </Field>

            <Field
              id="c-location"
              label={t('contact.form.location')}
              labelStyle={getContentStyle('contact.form.location')}
              required
              icon={<MapPin size={17} strokeWidth={1.4} />}
              delay={0.1}
            >
              <input
                id="c-location"
                type="text"
                required
                value={formData.location}
                onChange={e => set('location')(e.target.value)}
                placeholder={t('contact.form.location.placeholder')}
                className={BOX}
              />
            </Field>

            <Field
              id="c-guests"
              label={t('contact.form.guests')}
              labelStyle={getContentStyle('contact.form.guests')}
              required
              icon={<Users size={17} strokeWidth={1.4} />}
              delay={0.15}
            >
              <input
                id="c-guests"
                type="number"
                required
                min="1"
                value={formData.guests}
                onChange={e => set('guests')(e.target.value)}
                placeholder={t('contact.form.guests.placeholder')}
                className={`${BOX} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
              />
            </Field>

            <Field
              id="c-coverage"
              label={t('contact.form.coverage')}
              labelStyle={getContentStyle('contact.form.coverage')}
              required
              icon={<ChevronDown size={17} strokeWidth={1.4} />}
              delay={0.15}
            >
              <select
                id="c-coverage"
                required
                value={formData.coverage}
                onChange={e => set('coverage')(e.target.value)}
                className={`${BOX} appearance-none cursor-pointer ${!formData.coverage ? 'text-ink-400' : ''}`}
              >
                <option value="">{t('contact.form.coverage.placeholder')}</option>
                {coverageOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>

            {/* Video — full width */}
            <Field
              id="c-video"
              label={t('contact.form.video')}
              labelStyle={getContentStyle('contact.form.video')}
              icon={<ChevronDown size={17} strokeWidth={1.4} />}
              className="md:col-span-2"
              delay={0.2}
            >
              <select
                id="c-video"
                value={formData.video}
                onChange={e => set('video')(e.target.value)}
                className={`${BOX} appearance-none cursor-pointer ${!formData.video ? 'text-ink-400' : ''}`}
              >
                <option value="">{t('contact.form.video.placeholder')}</option>
                {videoOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>

            <Field
              id="c-places"
              label={t('contact.form.places')}
              labelStyle={getContentStyle('contact.form.places')}
              icon={<MapPin size={17} strokeWidth={1.4} />}
              iconTop
              className="md:col-span-2"
              delay={0.2}
            >
              <textarea
                id="c-places"
                rows={3}
                value={formData.places}
                onChange={e => set('places')(e.target.value)}
                placeholder={t('contact.form.places.placeholder')}
                className={`${BOX} resize-none`}
              />
            </Field>

            <Field
              id="c-message"
              label={t('contact.form.story')}
              labelStyle={getContentStyle('contact.form.story')}
              icon={<Heart size={17} strokeWidth={1.4} />}
              iconTop
              className="md:col-span-2"
              delay={0.25}
            >
              <textarea
                id="c-message"
                rows={4}
                value={formData.message}
                onChange={e => set('message')(e.target.value)}
                placeholder={t('contact.form.story.placeholder')}
                className={`${BOX} resize-none`}
              />
            </Field>
          </div>

          {/* Consent */}
          <div className="flex items-start gap-3 mt-8">
            <input
              id="c-consent"
              type="checkbox"
              required
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 flex-none rounded-[2px] border-canvas-200 accent-gold-600 cursor-pointer"
            />
            <label
              htmlFor="c-consent"
              style={getContentStyle('contact.form.consent')}
              className="text-[12px] md:text-[13px] text-ink-500 font-light leading-relaxed cursor-pointer"
            >
              {t('contact.form.consent')}
            </label>
          </div>

          {/* Error */}
          <AnimatePresence>
            {status === 'error' && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                role="alert"
                style={getContentStyle('contact.form.error')}
                className="flex items-center gap-2.5 mt-6 text-[13px] text-red-700 font-light"
              >
                <AlertCircle size={15} className="flex-none" aria-hidden="true" />
                {t('contact.form.error')}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Submit */}
          <div className="flex justify-center mt-9 md:mt-11">
            <button
              type="submit"
              disabled={submitting}
              className="group relative w-full sm:w-auto min-w-[240px] px-14 py-4 rounded-[3px] bg-gold-500 hover:bg-gold-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-500"
            >
              <span
                style={getContentStyle('contact.form.submit')}
                className="flex items-center justify-center gap-3 text-[11px] tracking-[0.25em] uppercase font-semibold text-white"
              >
                {submitting && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                {submitting ? t('contact.form.sending') : t('contact.form.submit')}
              </span>
            </button>
          </div>
        </form>
      </section>

      {/* ── Follow + response note ─────────────────────────────────────────── */}
      {(socials.length > 0 || t('contact.response.note')) && (
        <section className="bg-canvas-100 py-14 md:py-20 px-6 sm:px-8 lg:px-16">
          <div className="max-w-2xl mx-auto text-center">
            {socials.length > 0 && (
              <>
                <span
                  style={getContentStyle('contact.follow.tag')}
                  className="block text-[10px] md:text-[11px] tracking-[0.4em] uppercase font-semibold text-ink-500 mb-6"
                >
                  {t('contact.follow.tag')}
                </span>
                <div className="flex items-center justify-center gap-5 mb-10">
                  {socials.map(s => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="w-11 h-11 rounded-full border border-canvas-200 bg-white flex items-center justify-center text-gold-600 hover:bg-gold-500 hover:border-gold-500 hover:text-white transition-colors duration-500"
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>
              </>
            )}

            <p
              style={getContentStyle('contact.response.note')}
              className="text-ink-500 font-light text-[13px] leading-[1.95] max-w-md mx-auto"
            >
              {t('contact.response.note')}
            </p>
          </div>
        </section>
      )}
    </div>
  );
};

export default Contact;

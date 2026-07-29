import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Instagram, Facebook, Youtube, CheckCircle2, AlertCircle,
  ArrowRight, Loader2, Mail, Phone, MapPin, Sparkles,
} from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';
import { respImg } from '../lib/img';
import { EASE, ParallaxY, RevealImage, SectionTag, WordReveal } from '../components/anim';

const TikTokIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.87a8.18 8.18 0 0 0 4.78 1.52V7a4.85 4.85 0 0 1-1.02-.31z"/>
  </svg>
);

const HERO_FALLBACK = 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=2400';

// Shared input skin — transparent field, the underline carries the state
const FIELD_INPUT =
  'w-full bg-transparent py-3 md:py-4 pr-6 text-moody-900 font-light text-sm md:text-base ' +
  'placeholder:text-moody-900/25 placeholder:font-light outline-none focus:outline-none';

// ── Field chrome ─────────────────────────────────────────────────────────────
// Label rides above the field and warms to gold on focus; a gold rule wipes in
// from the left over the resting hairline; a small gold dot marks a filled field.
const FieldFrame = ({ id, label, labelStyle, focused, filled, delay = 0, optionalLabel, children }: {
  id: string;
  label: string;
  labelStyle?: React.CSSProperties;
  focused: boolean;
  filled: boolean;
  delay?: number;
  optionalLabel?: string;
  children: React.ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.9, delay, ease: EASE }}
    className="relative"
  >
    <div className="flex items-baseline justify-between gap-3 mb-3">
      <label
        htmlFor={id}
        style={labelStyle}
        className={`block text-[9px] md:text-[10px] tracking-[0.45em] uppercase font-bold transition-colors duration-500 ${
          focused ? 'text-gold-600' : 'text-moody-900/40'
        }`}
      >
        {label}
      </label>
      {/* Only name + email are required — say so, so nobody abandons the form */}
      {optionalLabel && (
        <span className="text-[9px] tracking-[0.2em] uppercase text-moody-900/25 font-medium flex-none">
          {optionalLabel}
        </span>
      )}
    </div>

    {children}

    <span aria-hidden="true" className="absolute left-0 bottom-0 h-px w-full bg-gold-600/20" />
    <motion.span
      aria-hidden="true"
      initial={false}
      animate={{ scaleX: focused ? 1 : 0 }}
      transition={{ duration: 0.7, ease: EASE }}
      className="absolute left-0 bottom-0 h-[1.5px] w-full bg-gold-600 origin-left"
    />

    <AnimatePresence>
      {filled && !focused && (
        <motion.span
          key="dot"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          aria-hidden="true"
          className="absolute right-0 bottom-3.5 w-1.5 h-1.5 rounded-full bg-gold-600/70"
        />
      )}
    </AnimatePresence>
  </motion.div>
);

const TextField = ({
  id, label, labelStyle, placeholder, value, onValueChange,
  type = 'text', min, delay, inputClassName = '', autoComplete, required = false, optionalLabel,
  onFocusExtra, onBlurExtra,
}: {
  id: string;
  label: string;
  labelStyle?: React.CSSProperties;
  placeholder: string;
  value: string;
  onValueChange: (v: string) => void;
  type?: string;
  min?: string;
  delay?: number;
  inputClassName?: string;
  autoComplete?: string;
  required?: boolean;
  optionalLabel?: string;
  onFocusExtra?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlurExtra?: (e: React.FocusEvent<HTMLInputElement>) => void;
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <FieldFrame
      id={id}
      label={label}
      labelStyle={labelStyle}
      focused={focused}
      filled={value.trim().length > 0}
      delay={delay}
      optionalLabel={optionalLabel}
    >
      <input
        id={id}
        required={required}
        type={type}
        min={min}
        autoComplete={autoComplete}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onValueChange(e.target.value)}
        onFocus={(e) => { setFocused(true); onFocusExtra?.(e); }}
        onBlur={(e) => { setFocused(false); onBlurExtra?.(e); }}
        className={`${FIELD_INPUT} ${inputClassName}`}
      />
    </FieldFrame>
  );
};

const TextAreaField = ({
  id, label, labelStyle, placeholder, value, onValueChange, rows = 4, delay, optionalLabel,
}: {
  id: string;
  label: string;
  labelStyle?: React.CSSProperties;
  placeholder: string;
  value: string;
  onValueChange: (v: string) => void;
  rows?: number;
  delay?: number;
  optionalLabel?: string;
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <FieldFrame
      id={id}
      label={label}
      labelStyle={labelStyle}
      focused={focused}
      filled={value.trim().length > 0}
      delay={delay}
      optionalLabel={optionalLabel}
    >
      <textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onValueChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`${FIELD_INPUT} resize-none leading-relaxed`}
      />
    </FieldFrame>
  );
};

const Contact = () => {
  const { t, getContentStyle, language } = useLanguage();
  const reduced = useReducedMotion();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    date: '',
    location: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [showModal, setShowModal] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});

  const formRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    loadSettings().then(setSettings).catch(err => { console.warn('Contact: failed to load settings', err); });
  }, []);

  // Single success surface: closing the modal returns the form to its idle state
  const closeModal = useCallback(() => {
    setShowModal(false);
    setStatus('idle');
  }, []);

  const sendAnother = useCallback(() => {
    closeModal();
    formRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  }, [closeModal, reduced]);

  useEffect(() => {
    if (!showModal) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
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

    // Only name + email are required (matches the server contract) — a couple
    // without a booked venue or date must still be able to inquire.
    if (!formData.name || !formData.email) {
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
      setShowModal(true);
      setFormData({ name: '', email: '', date: '', location: '', message: '' });
    } catch (error) {
      setStatus('error');
    }
  };

  const submitting = status === 'submitting';
  const today = new Date().toISOString().split('T')[0];
  const optionalLabel = language === 'ENG' ? 'optional' : 'opcionalno';

  const hero = respImg(settings['img.contact.hero'] || HERO_FALLBACK, [640, 1024, 1600, 2000]);

  const socials = [
    { icon: <Instagram size={20} strokeWidth={1.5} />, href: settings.instagram, label: 'Instagram' },
    { icon: <Facebook size={20} strokeWidth={1.5} />, href: settings.facebook, label: 'Facebook' },
    { icon: <Youtube size={20} strokeWidth={1.5} />, href: settings.youtube, label: 'YouTube' },
    { icon: <TikTokIcon size={19} />, href: settings.tiktok, label: 'TikTok' },
  ].filter(s => s.href && s.href !== '#');

  const heroBand = (
    <div className="relative">
      <div className="absolute -inset-3 md:-inset-5 border border-gold-600/25 pointer-events-none" aria-hidden="true" />
      <RevealImage
        src={hero.src}
        srcSet={hero.srcSet}
        sizes="100vw"
        alt={t('contact.hero.title')}
        className="w-full aspect-[16/11] sm:aspect-[2/1] lg:aspect-[21/9]"
        eager
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-moody-950/25 via-transparent to-transparent pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );

  return (
    <div className="bg-gold-50 overflow-hidden">
      {/* ── Success modal — the single success surface ───────────────────── */}
      <AnimatePresence>
        {showModal && (
          <div
            className="fixed inset-0 z-[1500] flex items-center justify-center p-5 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-success-title"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              onClick={closeModal}
              className="absolute inset-0 bg-moody-950/85 backdrop-blur-md"
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 26 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.75, ease: EASE }}
              className="relative w-full max-w-lg bg-gold-50 border border-gold-600/15 shadow-2xl px-8 py-12 md:px-14 md:py-16 text-center"
            >
              <div className="absolute inset-3 border border-gold-600/15 pointer-events-none" aria-hidden="true" />

              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
                className="relative w-20 h-20 rounded-full bg-gold-100 flex items-center justify-center mx-auto mb-8"
                aria-hidden="true"
              >
                <CheckCircle2 className="text-gold-600" size={38} strokeWidth={1.2} />
              </motion.div>

              <h2
                id="contact-success-title"
                style={getContentStyle('contact.form.success.title')}
                className="relative text-3xl md:text-4xl font-serif font-light text-moody-900 mb-5"
              >
                {t('contact.form.success.title')}
              </h2>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
                className="w-12 h-px bg-gold-600/45 mx-auto mb-7"
                aria-hidden="true"
              />

              <p
                style={getContentStyle('contact.form.success.desc')}
                className="relative text-moody-900/55 font-light leading-relaxed mb-10"
              >
                {t('contact.form.success.desc')}
              </p>

              <button
                ref={closeBtnRef}
                onClick={closeModal}
                className="relative w-full rounded-full py-4 md:py-5 bg-moody-900 hover:bg-gold-600 transition-colors duration-500"
              >
                <span
                  style={getContentStyle('contact.form.close')}
                  className="text-[10px] tracking-[0.45em] uppercase font-semibold text-white"
                >
                  {t('contact.form.close')}
                </span>
              </button>

              <button onClick={sendAnother} className="group relative mt-6 inline-block">
                <span
                  style={getContentStyle('contact.form.success.another')}
                  className="text-[10px] tracking-[0.35em] uppercase font-bold text-moody-900/45 group-hover:text-gold-600 border-b border-gold-600/25 pb-1 transition-colors duration-500"
                >
                  {t('contact.form.success.another')}
                </span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Hero statement ───────────────────────────────────────────────── */}
      <section className="relative bg-white pt-10 md:pt-16 pb-16 md:pb-24 overflow-hidden">
        {/* Soft gold glow behind the statement */}
        <div
          className="absolute inset-x-0 top-0 h-[26rem] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 55% 60% at 50% 30%, rgba(166,134,93,0.10) 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="relative max-w-5xl mx-auto px-6 sm:px-8 text-center">
          {/* Sparkle ornament */}
          <motion.div
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            whileInView={{ opacity: 1, rotate: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, delay: 0.1, ease: EASE }}
            className="flex justify-center mb-6"
            aria-hidden="true"
          >
            <Sparkles size={20} strokeWidth={1.2} className="text-gold-600/70" />
          </motion.div>

          {/* Title — per-word mask reveal */}
          <h1
            aria-label={t('contact.hero.title')}
            className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-light text-moody-900 leading-[1.02] tracking-tight uppercase mb-3"
          >
            <WordReveal
              delay={0.2}
              words={t('contact.hero.title').split(' ').filter(Boolean).map(w => ({
                w,
                style: getContentStyle('contact.hero.title'),
              }))}
            />
          </h1>

          {/* Hand-drawn flourish that draws itself in */}
          <motion.svg
            viewBox="0 0 300 22"
            fill="none"
            className="w-44 md:w-64 h-auto mx-auto mb-8 md:mb-10 text-gold-600/80"
            aria-hidden="true"
          >
            <motion.path
              d="M6 16 Q 80 2 150 9 T 294 8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.3, delay: 0.85, ease: 'easeInOut' }}
            />
          </motion.svg>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.55, ease: EASE }}
            style={getContentStyle('contact.hero.subtitle')}
            className="text-[10px] md:text-xs tracking-[0.4em] md:tracking-[0.5em] uppercase font-bold text-moody-900/50 max-w-xl mx-auto leading-loose"
          >
            {t('contact.hero.subtitle')}
          </motion.p>

          {/* Availability — set in Admin → Postavke; reassures the couple we're taking bookings */}
          {settings.availability_text && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.7, ease: EASE }}
              className="flex justify-center mt-8"
            >
              <span className="inline-flex items-center gap-3 text-[9px] md:text-[10px] tracking-[0.35em] uppercase font-bold text-gold-700 bg-gold-50 px-6 py-2.5 border border-gold-600/20 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-600 animate-pulse" aria-hidden="true" />
                {settings.availability_text}
              </span>
            </motion.div>
          )}
        </div>

        {/* Cinematic band — curtain reveal inside an offset gold frame */}
        <div className="relative max-w-[1800px] mx-auto px-6 sm:px-8 lg:px-16 mt-16 md:mt-24">
          {reduced ? heroBand : <ParallaxY from={26} to={-26}>{heroBand}</ParallaxY>}
        </div>
      </section>

      {/* ── The inquiry ──────────────────────────────────────────────────── */}
      <section className="relative bg-gold-100/40 py-24 md:py-36 px-6 sm:px-8 lg:px-16 overflow-hidden">
        {/* Decorative script watermark */}
        <div
          className="absolute -left-12 top-1/3 text-[16rem] xl:text-[22rem] font-script text-gold-600/[0.05] leading-none select-none pointer-events-none hidden lg:block"
          aria-hidden="true"
        >
          387
        </div>

        <div className="relative max-w-[1400px] mx-auto">
          <div className="text-center mb-14 md:mb-20">
            <SectionTag style={getContentStyle('contact.connect.tag')} className="mb-6 md:mb-8">
              {t('contact.connect.tag')}
            </SectionTag>

            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-light text-moody-900 leading-[1.05] tracking-tight">
              <WordReveal
                delay={0.2}
                words={[
                  ...t('contact.connect.title.part1').split(' ').filter(Boolean).map(w => ({
                    w, style: getContentStyle('contact.connect.title.part1'),
                  })),
                  ...t('contact.connect.title.part2').split(' ').filter(Boolean).map(w => ({
                    w, style: getContentStyle('contact.connect.title.part2'), italic: true,
                  })),
                ]}
              />
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-16 items-start">
            {/* Form — paper card floating over an offset gold frame */}
            <div ref={formRef} className="lg:col-span-7 relative scroll-mt-32">
              <div
                className="absolute -top-4 -left-4 md:-top-6 md:-left-6 w-full h-full border border-gold-600/25 pointer-events-none hidden sm:block"
                aria-hidden="true"
              />

              <motion.div
                initial={{ opacity: 0, y: 44 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 1.2, ease: EASE }}
                className="relative bg-white border border-gold-600/10 shadow-xl shadow-moody-900/[0.06] p-7 sm:p-10 lg:p-14 overflow-hidden"
              >
                <div
                  className="absolute -top-28 -right-28 w-72 h-72 bg-gold-200/25 blur-3xl rounded-full pointer-events-none"
                  aria-hidden="true"
                />

                <form onSubmit={handleSubmit} className="relative z-10 space-y-9 md:space-y-11">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-9 md:gap-10">
                    <TextField
                      id="contact-name"
                      label={t('contact.form.name')}
                      labelStyle={getContentStyle('contact.form.name')}
                      placeholder={t('contact.form.name.placeholder')}
                      value={formData.name}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, name: v }))}
                      autoComplete="name"
                      required
                      delay={0}
                    />
                    <TextField
                      id="contact-email"
                      label={t('contact.form.email')}
                      labelStyle={getContentStyle('contact.form.email')}
                      placeholder="hello@example.com"
                      type="email"
                      value={formData.email}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, email: v }))}
                      autoComplete="email"
                      required
                      delay={0.08}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-9 md:gap-10">
                    {/* Date — starts as text so the placeholder shows, becomes a
                        real date picker the moment it is focused */}
                    <TextField
                      id="contact-date"
                      label={t('contact.form.date')}
                      labelStyle={getContentStyle('contact.form.date')}
                      placeholder={t('contact.form.date.placeholder')}
                      value={formData.date}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, date: v }))}
                      min={today}
                      inputClassName="cursor-pointer"
                      onFocusExtra={(e) => {
                        e.target.type = 'date';
                        if ('showPicker' in HTMLInputElement.prototype) {
                          try { e.target.showPicker(); } catch { /* unsupported / blocked */ }
                        }
                      }}
                      onBlurExtra={(e) => {
                        if (!e.target.value) e.target.type = 'text';
                      }}
                      optionalLabel={optionalLabel}
                      delay={0.16}
                    />
                    <TextField
                      id="contact-location"
                      label={t('contact.form.location')}
                      labelStyle={getContentStyle('contact.form.location')}
                      placeholder={t('contact.form.location.placeholder')}
                      value={formData.location}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, location: v }))}
                      optionalLabel={optionalLabel}
                      delay={0.24}
                    />
                  </div>

                  <TextAreaField
                    id="contact-message"
                    label={t('contact.form.story')}
                    labelStyle={getContentStyle('contact.form.story')}
                    placeholder={t('contact.form.story.placeholder')}
                    value={formData.message}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, message: v }))}
                    rows={5}
                    optionalLabel={optionalLabel}
                    delay={0.32}
                  />

                  {/* Submit — filled gold pill with a hover shine and idle pulse */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: 0.4, ease: EASE }}
                    className="pt-2"
                  >
                    <button
                      type="submit"
                      disabled={submitting}
                      aria-busy={submitting}
                      className={`group relative w-full overflow-hidden rounded-full py-5 md:py-6 bg-gold-600 hover:bg-gold-700 disabled:hover:bg-gold-600 disabled:cursor-wait transition-colors duration-500 shadow-lg shadow-gold-600/25 ${
                        submitting ? '' : 'animate-[ctaPulse_3s_ease-in-out_infinite]'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:left-full transition-[left] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      />
                      {submitting ? (
                        <span
                          style={getContentStyle('contact.form.sending')}
                          className="relative z-10 flex items-center justify-center gap-4 text-[10px] md:text-[11px] tracking-[0.45em] md:tracking-[0.5em] uppercase font-semibold text-white"
                        >
                          <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                          {t('contact.form.sending')}
                        </span>
                      ) : (
                        <span
                          style={getContentStyle('contact.form.submit')}
                          className="relative z-10 flex items-center justify-center gap-4 text-[10px] md:text-[11px] tracking-[0.45em] md:tracking-[0.5em] uppercase font-semibold text-white"
                        >
                          {t('contact.form.submit')}
                          <ArrowRight size={15} className="group-hover:translate-x-1.5 transition-transform duration-500" aria-hidden="true" />
                        </span>
                      )}
                    </button>
                  </motion.div>

                  <div aria-live="polite">
                    <AnimatePresence>
                      {status === 'error' && (
                        <motion.div
                          key="error"
                          role="alert"
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5, ease: EASE }}
                          className="flex items-center justify-center gap-3 text-red-600/90 text-xs md:text-sm font-light"
                        >
                          <AlertCircle size={16} aria-hidden="true" />
                          <span style={getContentStyle('contact.form.error')}>{t('contact.form.error')}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </form>
              </motion.div>
            </div>

            {/* Studio rail — details + response note, sticky beside the form */}
            <div className="lg:col-span-5 lg:sticky lg:top-32 space-y-10">
              {(settings.email || settings.phone || settings.location) && (
                <motion.ul
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.15, ease: EASE }}
                  className="divide-y divide-gold-600/10 border-y border-gold-600/10"
                >
                  {settings.email && (
                    <li>
                      <a
                        href={`mailto:${settings.email}`}
                        className="group flex items-center gap-4 py-5 text-moody-900/70 hover:text-gold-600 transition-colors duration-500"
                      >
                        <Mail size={15} strokeWidth={1.5} className="text-gold-600 flex-shrink-0" aria-hidden="true" />
                        <span className="text-[11px] md:text-xs tracking-[0.2em] uppercase font-bold break-all">{settings.email}</span>
                        <ArrowRight size={14} className="ml-auto text-gold-600/50 group-hover:translate-x-1 transition-transform duration-500 flex-shrink-0" aria-hidden="true" />
                      </a>
                    </li>
                  )}
                  {settings.phone && (
                    <li>
                      <a
                        href={`tel:${settings.phone.replace(/\s/g, '')}`}
                        className="group flex items-center gap-4 py-5 text-moody-900/70 hover:text-gold-600 transition-colors duration-500"
                      >
                        <Phone size={15} strokeWidth={1.5} className="text-gold-600 flex-shrink-0" aria-hidden="true" />
                        <span className="text-[11px] md:text-xs tracking-[0.2em] uppercase font-bold">{settings.phone}</span>
                        <ArrowRight size={14} className="ml-auto text-gold-600/50 group-hover:translate-x-1 transition-transform duration-500 flex-shrink-0" aria-hidden="true" />
                      </a>
                    </li>
                  )}
                  {settings.location && (
                    <li className="flex items-center gap-4 py-5 text-moody-900/70">
                      <MapPin size={15} strokeWidth={1.5} className="text-gold-600 flex-shrink-0" aria-hidden="true" />
                      <span className="text-[11px] md:text-xs tracking-[0.2em] uppercase font-bold">{settings.location}</span>
                    </li>
                  )}
                </motion.ul>
              )}

              {/* Response note */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.25, ease: EASE }}
                className="relative border border-gold-600/15 bg-white/60 p-8 md:p-10"
              >
                <span style={getContentStyle('contact.note.tag')} className="luxury-text-sm block mb-4">
                  {t('contact.note.tag')}
                </span>
                <p
                  style={getContentStyle('contact.response.note')}
                  className="text-moody-900/55 font-light text-sm leading-relaxed italic"
                >
                  {t('contact.response.note')}
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Follow ───────────────────────────────────────────────────────── */}
      {socials.length > 0 && (
        <section className="bg-white py-20 md:py-28 px-6 sm:px-8 lg:px-16">
          <div className="max-w-3xl mx-auto text-center">
            <SectionTag style={getContentStyle('contact.follow.tag')} className="mb-9 md:mb-11">
              {t('contact.follow.tag')}
            </SectionTag>

            <div className="flex justify-center gap-4 md:gap-6">
              {socials.map((social, i) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.09, ease: EASE }}
                  className="w-14 h-14 md:w-16 md:h-16 rounded-full border border-gold-600/25 flex items-center justify-center text-moody-900/70 hover:text-white hover:bg-gold-600 hover:border-gold-600 hover:-translate-y-1.5 transition-all duration-500"
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Contact;

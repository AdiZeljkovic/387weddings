import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Instagram, Facebook, Youtube, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

const TikTokIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.87a8.18 8.18 0 0 0 4.78 1.52V7a4.85 4.85 0 0 1-1.02-.31z"/>
  </svg>
);

import { useLanguage } from '../contexts/LanguageContext';
import { loadSettings } from '../lib/settingsCache';

const Contact = () => {
  const { t, getContentStyle } = useLanguage();
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

  useEffect(() => {
    loadSettings().then(setSettings).catch(err => { console.warn('Contact: failed to load settings', err); });
  }, []);

  useEffect(() => {
    if (!showModal) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation check (though 'required' attribute handles most)
    if (!formData.name || !formData.email || !formData.date || !formData.location || !formData.message) {
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

  return (
    <div className="bg-gold-50 overflow-hidden">
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-moody-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-gold-50 p-8 md:p-16 max-w-lg w-full text-center rounded-sm shadow-2xl border border-gold-600/10"
            >
              <div className="w-20 h-20 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="text-gold-600" size={40} strokeWidth={1.5} />
              </div>
              <h2 className="text-3xl md:text-4xl font-serif text-moody-900 mb-4">{t('contact.form.success.title')}</h2>
              <p className="text-moody-900/60 font-light mb-10 leading-relaxed">
                {t('contact.form.success.desc')}
              </p>
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-4 bg-moody-900 text-white text-[10px] tracking-[0.4em] uppercase font-bold hover:bg-gold-600 transition-colors duration-500"
              >
                {t('contact.form.close')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-moody-950">
        <div className="grain opacity-[0.05]" />
        <div className="absolute inset-0 z-0">
          <motion.img 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.5 }}
            transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
            src={settings['img.contact.hero'] || 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=2400'}
            alt="Contact Hero" 
            className="w-full h-full object-cover grayscale brightness-75"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
        </div>

        <div className="relative z-10 text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="space-y-8"
          >

            <h1 style={getContentStyle('contact.hero.title')} className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-light text-white leading-none tracking-tighter uppercase">
              {t('contact.hero.title')}
            </h1>
            <p style={getContentStyle('contact.hero.subtitle')} className="text-white/60 text-[10px] md:text-xs tracking-[0.5em] uppercase font-bold max-w-md mx-auto leading-relaxed">
              {t('contact.hero.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="grain opacity-[0.02]" />

      {/* Contact Content */}
      <section className="py-24 md:py-40 px-6 sm:px-8 lg:px-16 max-w-[1000px] mx-auto">
        {/* Centered Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
          className="text-center mb-16 md:mb-24"
        >
          <span style={getContentStyle('contact.connect.tag')} className="luxury-text-sm mb-6 md:mb-8 block">{t('contact.connect.tag')}</span>
          <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-light text-moody-900 leading-tight tracking-tight">
            <span style={getContentStyle('contact.connect.title.part1')}>{t('contact.connect.title.part1')}</span>{' '}
            <span style={getContentStyle('contact.connect.title.part2')} className="italic opacity-40 text-gold-600">{t('contact.connect.title.part2')}</span>
          </h2>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="bg-gold-100/30 border border-gold-600/10 p-8 sm:p-12 lg:p-20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold-200/20 blur-3xl -mr-32 -mt-32 rounded-full" />
          
          {status === 'success' && !showModal ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 md:py-20"
            >
              <CheckCircle2 className="mx-auto text-gold-600 mb-6 md:mb-8" size={48} strokeWidth={1} />
              <h2 className="text-3xl md:text-4xl font-serif text-moody-900 mb-4 md:mb-6">{t('contact.form.success.title')}</h2>
              <p className="text-moody-900/50 font-light mb-8 md:mb-12 text-sm md:text-base">{t('contact.form.success.desc')}</p>
              <button 
                onClick={() => setStatus('idle')}
                className="luxury-text-sm border-b border-gold-600/30 pb-2"
              >
                {t('contact.form.success.another')}
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8 md:space-y-12 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                <div className="space-y-3 md:space-y-4">
                  <label htmlFor="contact-name" className="luxury-text-sm">{t('contact.form.name')}</label>
                  <input
                    id="contact-name"
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-transparent border-b border-gold-600/20 py-3 md:py-4 text-moody-900 focus:border-gold-500 outline-none transition-colors font-light text-sm md:text-base"
                    placeholder={t('contact.form.name.placeholder')}
                  />
                </div>
                <div className="space-y-3 md:space-y-4">
                  <label htmlFor="contact-email" className="luxury-text-sm">{t('contact.form.email')}</label>
                  <input
                    id="contact-email"
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-transparent border-b border-gold-600/20 py-3 md:py-4 text-moody-900 focus:border-gold-500 outline-none transition-colors font-light text-sm md:text-base"
                    placeholder="hello@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                <div className="space-y-3 md:space-y-4">
                  <label htmlFor="contact-date" className="luxury-text-sm">{t('contact.form.date')}</label>
                  <input
                    id="contact-date"
                    required
                    type="text"
                    onFocus={(e) => {
                      e.target.type = 'date';
                      if ('showPicker' in HTMLInputElement.prototype) {
                        try { e.target.showPicker(); } catch (err) {}
                      }
                    }}
                    onBlur={(e) => {
                      if (!e.target.value) e.target.type = 'text';
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-transparent border-b border-gold-600/20 py-3 md:py-4 text-moody-900 focus:border-gold-500 outline-none transition-colors font-light text-sm md:text-base cursor-pointer"
                    placeholder={t('contact.form.date.placeholder')}
                  />
                </div>
                <div className="space-y-3 md:space-y-4">
                  <label htmlFor="contact-location" className="luxury-text-sm">{t('contact.form.location')}</label>
                  <input
                    id="contact-location"
                    required
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-transparent border-b border-gold-600/20 py-3 md:py-4 text-moody-900 focus:border-gold-500 outline-none transition-colors font-light text-sm md:text-base"
                    placeholder={t('contact.form.location.placeholder')}
                  />
                </div>
              </div>

              <div className="space-y-3 md:space-y-4">
                <label htmlFor="contact-message" className="luxury-text-sm">{t('contact.form.story')}</label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-transparent border-b border-gold-600/20 py-3 md:py-4 text-moody-900 focus:border-gold-500 outline-none transition-colors font-light text-sm md:text-base resize-none"
                  placeholder={t('contact.form.story.placeholder')}
                />
              </div>

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full py-6 md:py-8 border border-gold-600/30 text-moody-900 text-[11px] md:text-[13px] tracking-[0.5em] md:tracking-[0.7em] uppercase font-medium hover:bg-gold-600 hover:text-white hover:border-gold-600 transition-all duration-700 flex items-center justify-center gap-6 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gold-600 translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-[0.16, 1, 0.3, 1]" />
                <span className="relative z-10 flex items-center gap-6">
                  {status === 'submitting' ? t('contact.form.sending') : (
                    <>
                      {t('contact.form.submit')}
                      <ArrowRight size={18} strokeWidth={1} className="group-hover:translate-x-4 transition-all duration-700" />
                    </>
                  )}
                </span>
              </button>

              {status === 'error' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 text-red-500 text-xs md:text-sm font-light justify-center"
                >
                  <AlertCircle size={16} />
                  {t('contact.form.error')}
                </motion.div>
              )}
            </form>
          )}
        </motion.div>

        {/* Social Icons — below form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-center mt-16 md:mt-24 space-y-6"
        >
          <span className="luxury-text-sm text-gold-600/60 block">{t('contact.follow.tag')}</span>
          <div className="flex justify-center gap-8">
            {[
              { icon: <Instagram size={22} />, href: settings.instagram, label: 'Instagram' },
              { icon: <Facebook size={22} />, href: settings.facebook, label: 'Facebook' },
              { icon: <Youtube size={22} />, href: settings.youtube, label: 'YouTube' },
              { icon: <TikTokIcon size={22} />, href: settings.tiktok, label: 'TikTok' },
            ]
              .filter(s => s.href && s.href !== '#')
              .map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-moody-900 hover:text-gold-600 transition-all duration-500 hover:-translate-y-1"
                >
                  {social.icon}
                </a>
              ))}
          </div>
        </motion.div>

        {/* NAPOMENA — below social icons */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 0.4 }}
          className="mt-12 md:mt-16 p-8 border border-gold-600/10 bg-gold-50/50 rounded-sm text-center max-w-2xl mx-auto"
        >
          <span className="luxury-text-sm mb-4 block">{t('contact.note.tag')}</span>
          <p className="text-moody-900/50 font-light text-sm leading-relaxed italic">
            {t('contact.response.note')}
          </p>
        </motion.div>
      </section>
    </div>
  );
};

export default Contact;

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { langFromPath, pathFor, type Language } from '../lib/lang';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  getContentStyle: (key: string) => React.CSSProperties;
  reloadContent: () => void;
}

const translations: Record<Language, Record<string, string>> = {
  ENG: {
    // Navigation
    'nav.work': 'Work',
    'nav.experience': 'Experience',
    'nav.stories': 'About Us',
    'nav.inquire': 'Inquire',

    // Hero
    'hero.title.part1': 'Art in the',
    'hero.title.part2': 'Moments',
    'hero.desc': 'We capture the emotions that remain long after everything else has passed.',
    'hero.inquire': 'Inquire Now',
    'hero.portfolio': 'View Portfolio',

    // Home
    'home.scroll': 'Scroll to explore',
    'nav.home': 'Home',
    'home.featured.title': 'Featured works',
    'home.featured.cta': 'View all works',
    'home.about.cta': 'Get to know us',

    // Stories / Blog
    'stories.hero.title': 'Stories',
    'stories.hero.subtitle': 'A Journal of Visual Legacies',
    'stories.tag': 'Portfolio',
    'stories.card.1.title': 'Fine Art',
    'stories.card.2.title': 'Portraits',
    'stories.card.3.title': 'Clients',
    'stories.card.4.title': 'Travel',
    'stories.yourOwn': 'your own?',

    // Portfolio
    'portfolio.hero.title': 'Work',
    'portfolio.hero.subtitle': 'A Visual Legacy',
    'portfolio.approach.title': 'The Approach',
    'portfolio.approach.desc': 'From the quiet anticipation of the morning to the wild energy of the dance floor, we document the moments that define your celebration. Every detail, no matter how small, is a vital part of the visual legacy we create together — a timeless reminder of the love and joy that filled your day.',

    // About
    'about.stories.title': 'Our Journal',
    'about.stories.subtitle': 'A collection of visual legacies',

    // Contact
    'contact.note.tag': 'Note',
    'contact.response.note': 'We typically respond within 4-8 hours. If you haven\'t heard from us, please check your spam folder or reach out via Instagram.',
    'contact.form.name': 'Your Name',
    'contact.form.email': 'Email Address',
    'contact.form.date': 'Wedding Date',
    'contact.form.date.placeholder': 'DD/MM/YYYY',
    'contact.form.location': 'Location',
    'contact.form.location.placeholder': 'Sarajevo, BIH',
    'contact.form.story': 'Your Story',
    'contact.form.story.placeholder': 'Tell us about your vision...',
    'contact.form.name.placeholder': 'John & Jane',
    'contact.form.submit': 'Send Inquiry',
    'contact.form.sending': 'Sending...',
    'contact.form.close': 'Close Window',
    'contact.form.success.title': 'Thank You',
    'contact.form.success.desc': 'Your message has been received. We look forward to hearing more about your story.',
    'contact.form.success.another': 'Send Another Message',
    'contact.form.error': 'Something went wrong. Please try again later.',

    // Experience / Services
    'experience.package.starting': 'Starting at',
    'experience.carousel.hint': 'Hover to pause & explore',
    'experience.package.civil.name': 'The Civil',
    'experience.package.essential.name': 'The Essential',
    'experience.package.signature.name': 'The Signature',
    'experience.package.cinematic.name': 'The Cinematic',
    'experience.package.custom.name': 'The Custom',
    'experience.package.custom.price': 'On Request',

    // Footer
    'footer.tagline': 'Fine art wedding photography documenting love stories with a focus on raw emotion and timeless elegance.',
    'footer.navigation': 'Navigation',
    'footer.rights': 'All rights reserved.',
    'footer.designed': 'Designed with intention.',

    // 404
    'notfound.tag': 'Error 404',
    'notfound.title.part1': 'Lost in',
    'notfound.title.part2': 'the moment',
    'notfound.desc': 'The page you are looking for has drifted away like a fleeting memory. Let\'s guide you back to where the stories begin.',
    'notfound.home': 'Return Home',
    'notfound.portfolio': 'View Portfolio',

    // Home — misc

    // Portfolio — misc
    'portfolio.empty': 'No images in this category',

    // About — misc
  },

  BOS: {
    // Navigation
    'nav.work': 'Radovi',
    'nav.experience': 'Iskustvo',
    'nav.stories': 'O Nama',
    'nav.inquire': 'Upit',

    // Hero
    'hero.title.part1': 'Umjetnost u',
    'hero.title.part2': 'Trenucima',
    'hero.desc': 'Zabilježimo emocije koje traju kada sve drugo prođe.',
    'hero.inquire': 'Pošaljite Upit',
    'hero.portfolio': 'Pogledajte Portfolio',

    // Home
    'home.scroll': 'Skrolujte za istraživanje',
    'nav.home': 'Početna',
    'home.featured.title': 'Istaknuti radovi',
    'home.featured.cta': 'Pogledajte sve radove',
    'home.about.cta': 'Upoznajte nas',

    // Stories
    'stories.hero.title': 'Priče',
    'stories.hero.subtitle': 'Dnevnik vizuelnog naslijeđa',
    'stories.tag': 'Portfolio',
    'stories.card.1.title': 'Umjetnost',
    'stories.card.2.title': 'Portreti',
    'stories.card.3.title': 'Klijenti',
    'stories.card.4.title': 'Putovanja',
    'stories.yourOwn': 'svoju priču?',

    // Portfolio
    'portfolio.hero.title': 'Radovi',
    'portfolio.hero.subtitle': 'Vizuelno Naslijeđe',
    'portfolio.approach.title': 'Pristup',
    'portfolio.approach.desc': 'Od tihog iščekivanja jutra do divlje energije plesnog podija, dokumentujemo trenutke koji definišu vašu proslavu. Svaki detalj, ma koliko mali, vitalni je dio vizuelnog naslijeđa koje stvaramo zajedno — bezvremenski podsjetnik na ljubav i radost koji su ispunili vaš dan.',

    // About
    'about.stories.title': 'Naš Žurnal',
    'about.stories.subtitle': 'Kolekcija vizuelnih naslijeđa',

    // Contact
    'contact.note.tag': 'Napomena',
    'contact.response.note': 'Obično odgovaramo u roku od 4-8 sati. Ako niste dobili odgovor, provjerite spam ili nam pišite na Instagram.',
    'contact.form.name': 'Vaše Ime',
    'contact.form.email': 'Email Adresa',
    'contact.form.date': 'Datum Vjenčanja',
    'contact.form.date.placeholder': 'DD/MM/YYYY',
    'contact.form.location': 'Lokacija',
    'contact.form.location.placeholder': 'Sarajevo, BIH',
    'contact.form.story': 'Vaša Priča',
    'contact.form.story.placeholder': 'Ispričajte nam o vašoj viziji...',
    'contact.form.name.placeholder': 'Ana i Marko',
    'contact.form.submit': 'Pošaljite Upit',
    'contact.form.sending': 'Slanje...',
    'contact.form.close': 'Zatvorite prozor',
    'contact.form.success.title': 'Hvala Vam',
    'contact.form.success.desc': 'Vaša poruka je primljena. Radujemo se što ćemo čuti više o vašoj priči.',
    'contact.form.success.another': 'Pošaljite novu poruku',
    'contact.form.error': 'Nešto je pošlo po zlu. Molimo pokušajte kasnije.',

    // Experience / Services
    'experience.package.starting': 'Počevši od',
    'experience.carousel.hint': 'Zadržite kursor za pauzu',
    'experience.package.civil.name': 'Civilno vjenčanje',
    'experience.package.essential.name': 'Osnovni paket',
    'experience.package.signature.name': 'Potpisni paket',
    'experience.package.cinematic.name': 'Filmski paket',
    'experience.package.custom.name': 'Prilagođeni paket',
    'experience.package.custom.price': 'Na upit',

    // Footer
    'footer.tagline': 'Fine-art vjenčana fotografija koja dokumentuje ljubavne priče s fokusom na sirovu emociju i bezvremensku eleganciju.',
    'footer.navigation': 'Navigacija',
    'footer.rights': 'Sva prava zadržana.',
    'footer.designed': 'Dizajnirano s namjerom.',

    // 404
    'notfound.tag': 'Greška 404',
    'notfound.title.part1': 'Izgubljeni u',
    'notfound.title.part2': 'trenutku',
    'notfound.desc': 'Stranica koju tražite je nestala poput prolaznog sjećanja. Hajde da vas vratimo tamo gdje priče počinju.',
    'notfound.home': 'Povratak na početnu',
    'notfound.portfolio': 'Pogledajte portfolio',

    // Home — misc

    // Portfolio — misc
    'portfolio.empty': 'Nema slika u ovoj kategoriji',

    // About — misc
  }
};

// Module-level cache — same pattern as settingsCache, prevents refetch on remount
let _contentCache: { key: string; value_en: string; value_bs: string; font_size?: string; font_family?: string; text_color?: string }[] | null = null;
let _contentPromise: Promise<typeof _contentCache> | null = null;

function loadContent(): Promise<typeof _contentCache> {
  if (_contentCache) return Promise.resolve(_contentCache);
  if (_contentPromise) return _contentPromise;
  _contentPromise = fetch('/api/content')
    .then(r => r.json())
    .then(data => { _contentCache = Array.isArray(data) ? data : []; return _contentCache; })
    .catch(() => { _contentCache = []; return _contentCache; });
  return _contentPromise;
}

export function invalidateContentCache() {
  _contentCache = null;
  _contentPromise = null;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

type DbContent = Record<string, { en: string; bs: string }>;
type DbStyles = Record<string, { fontSize?: string; fontFamily?: string; color?: string }>;

const FONT_FAMILIES: Record<string, string> = {
  serif:  '"Playfair Display", serif',
  sans:   '"Montserrat", sans-serif',
  script: '"Caveat", cursive',
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // The address decides the language: /en/... is English, everything else is
  // Bosnian. A remembered choice only applies when the address says nothing,
  // so a shared link always opens in the language it was written in.
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      if (langFromPath(window.location.pathname) === 'ENG') return 'ENG';
      // ?lang= is still honoured for links sent before the move to /en
      const fromUrl = new URLSearchParams(window.location.search).get('lang');
      if (fromUrl === 'en') return 'ENG';
      if (fromUrl === 'bs') return 'BOS';
      const saved = localStorage.getItem('387_language');
      if (saved === 'ENG' || saved === 'BOS') return saved;
    } catch {}
    return 'BOS';
  });

  const [dbContent, setDbContent] = useState<DbContent>({});
  const [dbStyles, setDbStyles] = useState<DbStyles>({});

  const applyContent = useCallback((data: NonNullable<typeof _contentCache>) => {
    const map: DbContent = {};
    const styles: DbStyles = {};
    data.forEach(item => {
      map[item.key] = { en: item.value_en || '', bs: item.value_bs || '' };
      if (item.font_size || item.font_family || item.text_color) {
        styles[item.key] = {
          ...(item.font_size   ? { fontSize:   item.font_size }   : {}),
          ...(item.font_family ? { fontFamily: item.font_family } : {}),
          ...(item.text_color  ? { color:      item.text_color }  : {}),
        };
      }
    });
    setDbContent(map);
    setDbStyles(styles);
  }, []);

  const reloadContentFn = useCallback(() => {
    invalidateContentCache();
    loadContent().then(data => { if (data) applyContent(data); });
  }, [applyContent]);

  useEffect(() => { loadContent().then(data => { if (data) applyContent(data); }); }, [applyContent]);

  const setLanguage = (lang: Language) => {
    try { localStorage.setItem('387_language', lang); } catch {}
    if (lang === language) return;

    // Switching language moves to that language's address. The Router is
    // mounted with the prefix as its basename, which is fixed for the life of
    // the document, so this is a real navigation rather than a state change —
    // and it lets the server render the right meta tags for the new address.
    try {
      const target = pathFor(lang, window.location.pathname);
      const url = new URL(window.location.href);
      url.pathname = target;
      url.searchParams.delete('lang');  // the path carries it now
      window.location.assign(url.toString());
      return;
    } catch {
      setLanguageState(lang);
    }
  };

  // Keep the document language in step with the switch — it was hardcoded to
  // "bs" while og:locale claimed en_US, which search engines read as a mismatch.
  useEffect(() => {
    document.documentElement.lang = language === 'ENG' ? 'en' : 'bs';
  }, [language]);

  const t = (key: string): string => {
    const langCode = language === 'ENG' ? 'en' : 'bs';
    const dbVal = dbContent[key]?.[langCode];
    if (dbVal && dbVal.trim()) return dbVal;
    return translations[language][key] ?? translations['ENG'][key] ?? key;
  };

  const getContentStyle = (key: string): React.CSSProperties => {
    const s = dbStyles[key];
    if (!s) return {};
    const css: React.CSSProperties = {};
    if (s.fontSize)   css.fontSize   = s.fontSize;
    if (s.fontFamily) css.fontFamily = FONT_FAMILIES[s.fontFamily] ?? s.fontFamily;
    if (s.color)      css.color      = s.color;
    return css;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getContentStyle, reloadContent: reloadContentFn }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

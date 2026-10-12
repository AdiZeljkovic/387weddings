import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { langFromPath, pathFor, type Language } from '../lib/lang';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  getContentStyle: (key: string) => React.CSSProperties;
  reloadContent: () => void;
}

// Used only if the texts cannot be read from the database. Generated from
// the live texts (October 2026): exactly the keys the site uses.
const translations: Record<Language, Record<string, string>> = {
  ENG: {
    "about.bio.1.p1": "Photography has been part of my life for as long as I can remember. I grew up among people who believed the most important things cannot be put into words, and somewhere in there came the need to record them in pictures.",
    "about.bio.1.p2": "Over the years I learned to be quiet at weddings. To take a step back, wait, and let the moment happen on its own. Patience became a tool as important as the camera.",
    "about.bio.1.p3": "I am not after the perfect frame but the honest one. The warmth, the joy and the love that radiate through your day, because those are the moments you will keep long after the celebration ends.",
    "about.bio.1.tag": "Behind the lens",
    "about.bio.1.title.part1": "Meet",
    "about.bio.1.title.part2": "Melisa",
    "about.bio.2.p1": "Film won me over long before I ever shot a wedding. I was fascinated by the idea that a moving image can tell a story without a single word, and that led me exactly here.",
    "about.bio.2.p2": "Before weddings I shot music videos and commercials. That school taught me to watch rhythm, light and detail, and I bring the same into every film we make.",
    "about.bio.2.p3": "The greatest reward is when a couple plays their film a year later and feels exactly what they felt that day. A sound, a glance, someone laughing in the background: things a photograph cannot keep, but a film can.",
    "about.bio.2.tag": "Behind our films",
    "about.bio.2.title.part1": "Meet",
    "about.bio.2.title.part2": "Aldin",
    "about.invite.button": "Get in touch",
    "about.invite.p1": "We believe the best stories begin with an honest conversation. That is why we never rush, we want to know you first.",
    "about.invite.p2": "Write to us and tell us how you imagined your day. We reply within 4 to 8 hours.",
    "about.invite.title.part1": "We would love to hear",
    "about.invite.title.part2": "from you",
    "contact.err.consent": "Please agree before sending.",
    "contact.err.coverage": "Please choose the coverage you need.",
    "contact.err.date": "Please choose the date of your wedding.",
    "contact.err.email": "Please enter your email address.",
    "contact.err.email.bad": "That email address does not look right.",
    "contact.err.guests": "Please give an approximate number of guests.",
    "contact.err.location": "Please tell us where the wedding is.",
    "contact.err.name": "Please tell us your name.",
    "contact.form.again": "Send another message",
    "contact.form.consent": "I agree that my data may be used to respond to this inquiry.",
    "contact.form.coverage": "Approximate length of our coverage",
    "contact.form.coverage.opt.1": "Up to 4 hours",
    "contact.form.coverage.opt.2": "4–8 hours",
    "contact.form.coverage.opt.3": "8–12 hours",
    "contact.form.coverage.opt.4": "Full day",
    "contact.form.coverage.opt.5": "Multiple days",
    "contact.form.coverage.placeholder": "Select duration",
    "contact.form.date": "Wedding date",
    "contact.form.email": "Email address",
    "contact.form.email.placeholder": "Enter your email address",
    "contact.form.error": "Something went wrong. Please try again later.",
    "contact.form.guests": "Approximate number of guests",
    "contact.form.guests.placeholder": "Enter number of guests",
    "contact.form.location": "Wedding location / city",
    "contact.form.location.placeholder": "Enter location / city",
    "contact.form.name": "Full name",
    "contact.form.name.placeholder": "Enter your full name",
    "contact.form.phone": "Phone number",
    "contact.form.phone.placeholder": "Enter phone number (optional)",
    "contact.form.places": "Photo locations (if already known)",
    "contact.form.places.placeholder": "Write the locations",
    "contact.form.sending": "Sending...",
    "contact.form.story": "Additional information / your story",
    "contact.form.story.placeholder": "Tell us anything else you would like us to know",
    "contact.form.submit": "Send message",
    "contact.form.success.desc": "Your message has been received. We look forward to hearing more about your story.",
    "contact.form.success.title": "Thank You",
    "contact.form.video": "Do you need video?",
    "contact.form.video.opt.1": "Yes",
    "contact.form.video.opt.2": "No",
    "contact.form.video.opt.3": "Not sure yet",
    "contact.form.video.placeholder": "Select an option",
    "contact.group.story": "Your story",
    "contact.group.wedding": "About the wedding",
    "contact.group.you": "About you",
    "contact.hero.desc": "Fill in the form and tell us the details of your wedding. We will get back to you as soon as possible.",
    "contact.hero.title.part1": "Tell us",
    "contact.hero.title.part2": "your",
    "contact.hero.title.part3": "story",
    "contact.response.note": "We typically respond within 4-8 hours. If you haven't heard from us, please check your spam folder or reach out via Instagram.",
    "cookie.accept": "Accept",
    "cookie.decline": "Decline",
    "cookie.more": "Read more",
    "cookie.text": "We use cookies to understand how the site is used. Analytics only runs if you agree.",
    "cookie.title": "Cookies",
    "footer.link.about.sub": "Meet Melisa and Aldin",
    "footer.link.contact.sub": "Check an available date",
    "footer.link.work.sub": "See our stories",
    "footer.rights": "All rights reserved.",
    "footer.top": "Back to top",
    "hero.desc": "We capture the emotions that remain long after everything else has passed.",
    "hero.inquire": "Inquire Now",
    "hero.portfolio": "View our work",
    "hero.title.part1": "Your story.",
    "hero.title.part2": "Our art.",
    "home.about.cta": "Get to know us",
    "home.about.desc.1": "We have followed couples across Bosnia and the Balkans for years, and the same thing amazes us every time: how many different stories love can tell.",
    "home.about.desc.2": "We do not like posing or stiff frames. We like the moment when nobody is pretending.",
    "home.about.heading.part1": "More than photographs.",
    "home.about.heading.part2": "It is *your story.*",
    "home.about.tag": "About us",
    "home.featured.cta": "View more work",
    "home.featured.heading.part1": "Moments.",
    "home.featured.heading.part2": "Emotion.",
    "home.featured.heading.part3": "Forever.",
    "home.featured.title": "Featured works",
    "home.scroll": "Scroll",
    "instagram.tag": "More moments",
    "instagram.title.part1": "See more on",
    "instagram.title.part2": "Instagram",
    "nav.home": "Home",
    "nav.inquire": "Contact",
    "nav.stories": "About Us",
    "nav.work": "Work",
    "notfound.desc": "The page you are looking for has drifted away like a fleeting memory. Let's guide you back to where the stories begin.",
    "notfound.home": "Return home",
    "notfound.portfolio": "View our work",
    "notfound.tag": "Error 404",
    "notfound.title.part1": "Lost in",
    "notfound.title.part2": "the moment",
    "portfolio.approach.desc": "These are the stories we have had the honour of telling: every frame, every moment, every *couple*. See what we make when you trust us with your day.",
    "portfolio.card.portrait": "Portrait",
    "portfolio.card.studio": "Studio",
    "portfolio.card.wedding": "Wedding",
    "portfolio.empty": "No images in this category",
    "portfolio.filter.all": "ALL",
    "portfolio.filter.portraits": "PORTRAITS",
    "portfolio.filter.studio": "STUDIO",
    "portfolio.filter.weddings": "WEDDINGS",
    "portfolio.hero.subtitle": "last",
    "portfolio.hero.tag": "Work",
    "portfolio.hero.title": "Stories that",
    "privacy.empty": "The policy text is being prepared.",
    "privacy.title": "Privacy policy",
    "story.back": "All work",
    "story.close": "Close",
    "story.next": "Next story",
    "story.prev": "Previous story",
    "story.tag": "The story",
  },
  BOS: {
    "about.bio.1.p1": "Fotografija je dio mog života otkad znam za sebe. Odrasla sam među ljudima koji su vjerovali da se najvažnije stvari ne daju ispričati riječima, i negdje tu se rodila potreba da ih zabilježim slikom.",
    "about.bio.1.p2": "Godinama sam učila da budem tiha na vjenčanjima. Da stanem korak unazad, sačekam i pustim da se trenutak dogodi sam. Strpljenje mi je postalo alat jednako važan kao i fotoaparat.",
    "about.bio.1.p3": "Ne tražim savršen kadar nego iskren. Toplinu, radost i ljubav koja zrači kroz vaš dan, jer to su trenuci koje ćete čuvati dugo nakon što proslava prođe.",
    "about.bio.1.tag": "Iza objektiva",
    "about.bio.1.title.part1": "Upoznajte",
    "about.bio.1.title.part2": "Melisu",
    "about.bio.2.p1": "Film me osvojio davno prije nego što sam prvi put snimao vjenčanje. Fascinirala me ideja da se pokretnom slikom može ispričati priča bez ijedne riječi, i to me je dovelo tačno ovdje.",
    "about.bio.2.p2": "Prije vjenčanja snimao sam muzičke spotove i reklame. Ta škola me naučila da pazim na ritam, svjetlo i detalj, a danas to isto unosim u svaki film koji napravimo.",
    "about.bio.2.p3": "Najveća nagrada mi je kada par nakon godinu dana pusti svoj film i ponovo osjeti isto što i tog dana. Zvuk, pogled, nečiji smijeh u pozadini: stvari koje fotografija ne može sačuvati, a film može.",
    "about.bio.2.tag": "Iza kamere",
    "about.bio.2.title.part1": "Upoznajte",
    "about.bio.2.title.part2": "Aldina",
    "about.invite.button": "Javite nam se",
    "about.invite.p1": "Vjerujemo da najbolje priče počinju iskrenim razgovorom. Zato ne žurimo, prvo želimo upoznati vas.",
    "about.invite.p2": "Javite nam se i ispričajte kako ste zamislili svoj dan. Odgovaramo u roku od 4-8 sati.",
    "about.invite.title.part1": "Želimo čuti",
    "about.invite.title.part2": "vašu priču",
    "contact.err.consent": "Molimo potvrdite pristanak prije slanja.",
    "contact.err.coverage": "Molimo odaberite koliko pokrivanja trebate.",
    "contact.err.date": "Molimo odaberite datum vjenčanja.",
    "contact.err.email": "Molimo upišite svoju email adresu.",
    "contact.err.email.bad": "Ova email adresa ne izgleda ispravno.",
    "contact.err.guests": "Molimo upišite približan broj gostiju.",
    "contact.err.location": "Molimo upišite gdje je vjenčanje.",
    "contact.err.name": "Molimo upišite svoje ime.",
    "contact.form.again": "Pošalji novi upit",
    "contact.form.consent": "Prihvatam da se moji podaci koriste u svrhu odgovora na upit.",
    "contact.form.coverage": "Okvirno vrijeme trajanja našeg angažmana",
    "contact.form.coverage.opt.1": "Do 4 sata",
    "contact.form.coverage.opt.2": "4–8 sati",
    "contact.form.coverage.opt.3": "8–12 sati",
    "contact.form.coverage.opt.4": "Cijeli dan",
    "contact.form.coverage.opt.5": "Više dana",
    "contact.form.coverage.placeholder": "Odaberite trajanje",
    "contact.form.date": "Datum vjenčanja",
    "contact.form.email": "E-mail adresa",
    "contact.form.email.placeholder": "Unesite e-mail adresu",
    "contact.form.error": "Nešto je pošlo po krivu. Molimo pokušajte ponovo.",
    "contact.form.guests": "Približan broj gostiju",
    "contact.form.guests.placeholder": "Unesite broj gostiju",
    "contact.form.location": "Lokacija vjenčanja / grad",
    "contact.form.location.placeholder": "Unesite lokaciju / grad",
    "contact.form.name": "Ime i prezime",
    "contact.form.name.placeholder": "Unesite vaše ime i prezime",
    "contact.form.phone": "Broj telefona",
    "contact.form.phone.placeholder": "Unesite broj telefona (opciono)",
    "contact.form.places": "Mjesta fotografisanja (ako su već poznata)",
    "contact.form.places.placeholder": "Napišite lokacije",
    "contact.form.sending": "Slanje...",
    "contact.form.story": "Dodatne informacije / vaša priča",
    "contact.form.story.placeholder": "Napišite nam sve što želite da znamo",
    "contact.form.submit": "Pošalji poruku",
    "contact.form.success.desc": "Vaša poruka je primljena. Veselimo se što ćemo čuti više o vašoj priči.",
    "contact.form.success.title": "Hvala Vam",
    "contact.form.video": "Treba li vam video?",
    "contact.form.video.opt.1": "Da",
    "contact.form.video.opt.2": "Ne",
    "contact.form.video.opt.3": "Još nisam siguran/na",
    "contact.form.video.placeholder": "Odaberite opciju",
    "contact.group.story": "Vaša priča",
    "contact.group.wedding": "O vjenčanju",
    "contact.group.you": "O vama",
    "contact.hero.desc": "Ispunite formu i javite nam detalje o vašem vjenčanju. Javićemo vam se u najkraćem mogućem roku.",
    "contact.hero.title.part1": "Ispričajte nam",
    "contact.hero.title.part2": "svoju",
    "contact.hero.title.part3": "priču",
    "contact.response.note": "Obično odgovaramo u roku od 4-8 sati. \nAko niste dobili odgovor, provjerite spam ili nam pišite na Instagram. ",
    "cookie.accept": "Prihvatam",
    "cookie.decline": "Odbijam",
    "cookie.more": "Saznajte više",
    "cookie.text": "Koristimo kolačiće da razumijemo kako se sajt koristi. Analitika se pokreće samo ako pristanete.",
    "cookie.title": "Kolačići",
    "footer.link.about.sub": "Upoznajte Melisu i Aldina",
    "footer.link.contact.sub": "Provjerite slobodan datum",
    "footer.link.work.sub": "Pogledajte naše priče",
    "footer.rights": "Sva prava zadržana.",
    "footer.top": "Na vrh",
    "hero.desc": "Zabilježimo emocije koje traju kada sve drugo prođe.",
    "hero.inquire": "Pošaljite Upit",
    "hero.portfolio": "Pogledajte radove",
    "hero.title.part1": "Vaša priča.",
    "hero.title.part2": "Naša umjetnost.",
    "home.about.cta": "Upoznajte nas",
    "home.about.desc.1": "Pratimo parove kroz Bosnu i Balkan već godinama, i svaki put ista stvar nas oduševi, koliko različitih priča ljubav zna ispričati.",
    "home.about.desc.2": "Ne volimo poziranje ni ukočene kadrove. Volimo trenutak kad se niko ne pretvara.",
    "home.about.heading.part1": "Više od fotografija.",
    "home.about.heading.part2": "To je *vaša priča.*",
    "home.about.tag": "O nama",
    "home.featured.cta": "Pogledaj više radova",
    "home.featured.heading.part1": "Trenuci.",
    "home.featured.heading.part2": "Emocija.",
    "home.featured.heading.part3": "Zauvijek.",
    "home.featured.title": "Istaknuti radovi",
    "home.scroll": "Skroluj",
    "instagram.tag": "Još trenutaka",
    "instagram.title.part1": "Pogledajte još na",
    "instagram.title.part2": "Instagramu",
    "nav.home": "Početna",
    "nav.inquire": "Kontakt",
    "nav.stories": "O nama",
    "nav.work": "Radovi",
    "notfound.desc": "Stranica koju tražite je nestala poput prolaznog sjećanja. Hajde da vas vratimo tamo gdje priče počinju.",
    "notfound.home": "Povratak na početnu",
    "notfound.portfolio": "Pogledajte radove",
    "notfound.tag": "Greška 404",
    "notfound.title.part1": "Izgubljeni u",
    "notfound.title.part2": "trenutku",
    "portfolio.approach.desc": "Ovo su priče koje smo imali čast ispričati, svaki kadar, svaki trenutak, svaki *par*. Pogledajte šta stvaramo kad nam povjerite svoj dan.",
    "portfolio.card.portrait": "Portreti",
    "portfolio.card.studio": "Studio",
    "portfolio.card.wedding": "Vjenčanje",
    "portfolio.empty": "Nema slika u ovoj kategoriji",
    "portfolio.filter.all": "SVE",
    "portfolio.filter.portraits": "PORTRETI",
    "portfolio.filter.studio": "STUDIO",
    "portfolio.filter.weddings": "VJENČANJA",
    "portfolio.hero.subtitle": "traju",
    "portfolio.hero.tag": "Radovi",
    "portfolio.hero.title": "Priče koje",
    "privacy.empty": "Tekst politike je u pripremi.",
    "privacy.title": "Politika privatnosti",
    "story.back": "Svi radovi",
    "story.close": "Zatvori",
    "story.next": "Sljedeća priča",
    "story.prev": "Prethodna priča",
    "story.tag": "Priča",
  },
};

// Module-level cache — same pattern as settingsCache, prevents refetch on remount
type ContentRow = { key: string; value_en: string; value_bs: string; font_size?: string; font_family?: string; text_color?: string };
// Inlined by the server (window.__BOOT__), so the texts are right on the first
// render instead of switching from the built-in ones a moment later
let _contentCache: ContentRow[] | null = (typeof window !== 'undefined'
  ? (window as unknown as { __BOOT__?: { content?: ContentRow[] } }).__BOOT__?.content
  : undefined) ?? null;
let _contentPromise: Promise<typeof _contentCache> | null = null;

function loadContent(): Promise<typeof _contentCache> {
  if (_contentCache) return Promise.resolve(_contentCache);
  if (_contentPromise) return _contentPromise;
  // A failed request is not remembered: the next caller tries again, rather
  // than the whole visit showing the built-in fallback texts
  _contentPromise = fetch('/api/content', { cache: 'no-cache' })
    .then(r => (r.ok ? r.json() : Promise.reject(new Error(`content ${r.status}`))))
    .then(data => { _contentCache = Array.isArray(data) ? data : []; return _contentCache; })
    .catch(() => { _contentPromise = null; return null; });
  return _contentPromise;
}

export function invalidateContentCache() {
  _contentCache = null;
  _contentPromise = null;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/** The texts (and any font, size or colour set in the panel) by key */
function buildContent(data: ContentRow[]) {
  const map: Record<string, { en: string; bs: string }> = {};
  const styles: Record<string, { fontSize?: string; fontFamily?: string; color?: string }> = {};
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
  return { map, styles };
}

type DbContent = Record<string, { en: string; bs: string }>;
type DbStyles = Record<string, { fontSize?: string; fontFamily?: string; color?: string }>;

const FONT_FAMILIES: Record<string, string> = {
  serif:  '"Playfair Display", serif',
  sans:   '"Montserrat", sans-serif',
  script: '"Caveat", cursive',
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // The address alone decides the language: /en/... is English, everything
  // else is Bosnian. A remembered choice used to apply to Bosnian addresses
  // too, so anyone who had once clicked ENG got English text — and English
  // links without /en — on /radovi and every other Bosnian page. Old ?lang=
  // links are moved to the right address by the server before this runs.
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      return langFromPath(window.location.pathname);
    } catch {
      return 'BOS';
    }
  });

  // From the inlined texts when the server sent them, so nothing swaps
  const [dbContent, setDbContent] = useState<DbContent>(() => (_contentCache ? buildContent(_contentCache).map : {}));
  const [dbStyles, setDbStyles] = useState<DbStyles>(() => (_contentCache ? buildContent(_contentCache).styles : {}));

  const applyContent = useCallback((data: ContentRow[]) => {
    const { map, styles } = buildContent(data);
    setDbContent(map);
    setDbStyles(styles);
  }, []);

  const reloadContentFn = useCallback(() => {
    invalidateContentCache();
    loadContent().then(data => { if (data) applyContent(data); });
  }, [applyContent]);

  useEffect(() => { loadContent().then(data => { if (data) applyContent(data); }); }, [applyContent]);

  const setLanguage = (lang: Language) => {
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

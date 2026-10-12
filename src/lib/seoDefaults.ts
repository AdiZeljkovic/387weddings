/**
 * Page titles and descriptions for when the panel has none, in each page's
 * own language. Shared by the server (the HTML it sends) and the browser, so
 * the two never show different titles.
 */
export const DEFAULT_META: Record<string, { bs: [string, string]; en: [string, string] }> = {
  home: {
    bs: ['Vjenčana fotografija i film', 'Vjenčana fotografija i film iz Sarajeva: iskrene emocije i trenuci koji traju.'],
    en: ['Wedding photography and film', 'Fine art wedding photography and film from Sarajevo: honest emotion and moments that last.'],
  },
  portfolio: {
    bs: ['Radovi', 'Priče parova koje smo imali čast ispričati.'],
    en: ['Portfolio', 'The stories of couples we have had the honour of telling.'],
  },
  story: { bs: ['Priča', ''], en: ['Story', ''] },
  privacy: {
    bs: ['Politika privatnosti', 'Politika privatnosti i kolačića.'],
    en: ['Privacy policy', 'Privacy and cookie policy.'],
  },
  about: {
    bs: ['O nama', 'Upoznajte Melisu i Aldina, tim iza 387 Weddings.'],
    en: ['About us', 'Meet Melisa and Aldin, the team behind 387 Weddings.'],
  },
  contact: {
    bs: ['Kontakt', 'Ispričajte nam svoju priču i provjerite slobodan datum.'],
    en: ['Contact', 'Tell us your story and check if your date is free.'],
  },
  '404': { bs: ['Stranica nije pronađena', ''], en: ['Page not found', ''] },
};


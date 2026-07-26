import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

type Language = 'ENG' | 'BOS';

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
    'hero.location': 'BASED IN SARAJEVO — TRAVELING WORLDWIDE',
    'hero.inquire': 'Inquire Now',
    'hero.portfolio': 'View Portfolio',

    // Home
    'home.scroll': 'Scroll to explore',
    'home.collections.tag': 'Browse by',
    'home.collections.title': 'Collection',
    'home.intro.tag': 'The Art of Storytelling',
    'home.intro.title.part1': 'Fine-art,',
    'home.intro.title.part2': 'Editorial',
    'home.intro.title.part3': 'Wedding Photography',
    'home.intro.desc': 'Our approach is rooted in the belief that every wedding is a unique masterpiece. We blend editorial sophistication with documentary honesty to capture the quiet grandeur and fleeting magic of your most significant day.',
    'home.explore': 'Explore the Portfolio',
    'home.about.cta': 'Get to know us',
    'home.process.01.title': 'We begin with your vision',
    'home.process.01.tag': 'And our artistic style',
    'home.process.01.desc': 'If you have ideas or specific requests, please let us know. The pre-wedding shoot is a big collaboration — whilst we are happy to direct, we also love working with couples to create truly remarkable images.',
    'home.process.02.title': 'You choose the location',
    'home.process.02.tag': 'We document the moments',
    'home.process.02.desc': 'Often it\'s possible to shoot in the city and the countryside to get beautiful variation. We handle all logistics and transport, so you can focus entirely on being present.',
    'home.process.03.title': 'We create art that lasts a lifetime',
    'home.process.03.tag': 'Heirloom images for generations',
    'home.process.03.desc': 'Our shoots are relaxed and filled with laughter — there are never any stiff poses. Just beautiful, natural moments and genuine connection. We often explore different locations and many couples choose to bring a change of outfit.',
    'home.process.03.cta': 'Let\'s Connect',
    'home.testimonials.tag': 'Kind Words',
    'home.testimonials.title': 'From Our Couples',

    // Stories / Blog
    'stories.hero.title': 'Stories',
    'stories.hero.subtitle': 'A Journal of Visual Legacies',
    'stories.tag': 'Portfolio',
    'stories.card.1.title': 'Fine Art',
    'stories.card.2.title': 'Portraits',
    'stories.card.3.title': 'Clients',
    'stories.card.4.title': 'Travel',
    'stories.ready': 'Ready to tell',
    'stories.yourOwn': 'your own?',
    'stories.start': 'Start the Dialogue',

    // Portfolio
    'portfolio.hero.title': 'Work',
    'portfolio.hero.subtitle': 'A Visual Legacy',
    'portfolio.approach.title': 'The Approach',
    'portfolio.approach.heading': 'Preserving every',
    'portfolio.approach.subheading': 'chapter of your story.',
    'portfolio.approach.desc': 'From the quiet anticipation of the morning to the wild energy of the dance floor, we document the moments that define your celebration. Every detail, no matter how small, is a vital part of the visual legacy we create together — a timeless reminder of the love and joy that filled your day.',
    'portfolio.ready': 'Ready to start',
    'portfolio.dialogue': 'the dialogue?',

    // About
    'about.hero.title': 'About Us',
    'about.hero.subtitle': 'The Artists Behind the Lens',
    'about.title': 'Hi, we are Melisa & Aldin.',
    'about.desc.1': 'Partners in life and lens. As photographers and filmmakers — and husband and wife — our work is a dialogue between editorial fashion and the moving image. Inspired by emotion, we take an intentional approach to your narrative.',
    'about.desc.2': 'Just a bunch of ordinary people utterly in love with creating images of love for the past 8 years. And the next images we create could be of your love.',
    'about.desc.3': 'We spend our days at other people\'s weddings cracking half-witty jokes and trying to capture the quiet grandeur of love. We don\'t just capture moments; we craft elevated imagery that resonates with the soul of your unique journey.',
    'about.stories.title': 'Our Journal',
    'about.stories.subtitle': 'A collection of visual legacies',
    'about.experience.tag': 'The Experience',
    'about.experience.title': 'How We Work',
    'about.step.1.title': 'Consultation & Planning',
    'about.step.1.desc': 'We begin with a conversation to align our vision. Together, we\'ll plan the story, location, and scenography to ensure every detail is intentional.',
    'about.step.2.title': 'Preparation & Guidance',
    'about.step.2.desc': 'Receive a curated guide on posing and styling. We provide the advice you need to feel relaxed, confident, and ready for the camera.',
    'about.step.3.title': 'The Shoot & Experience',
    'about.step.3.desc': 'On the day of the shoot, we bring the magic to life. We handle the logistics — including transportation to the location — so you can focus entirely on the moment.',
    'about.step.4.title': 'Post-Production',
    'about.step.4.desc': 'Every chosen frame undergoes a meticulous editing process to ensure a timeless aesthetic. Your final gallery is delivered via a private digital space.',

    // Contact
    'contact.hero.title': 'Inquire',
    'contact.hero.subtitle': 'Let\'s create something timeless together',
    'contact.connect.tag': 'Inquiries',
    'contact.connect.title.part1': 'Let\'s',
    'contact.connect.title.part2': 'Connect',
    'contact.email.tag': 'Email Us',
    'contact.follow.tag': 'Follow',
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
    'experience.hero.title': 'Experience',
    'experience.hero.subtitle': 'The Art of Cinematic Documentation',
    'experience.intro.tag': 'The Experience',
    'experience.intro.title.part1': 'More than just',
    'experience.intro.title.part2': 'vendors.',
    'experience.intro.desc': 'When you hire us, you aren\'t just getting "vendors." You are getting a team that works as one. We\'ve spent years refining our silent language, knowing exactly where the other is and what they are seeing.',
    'experience.benefit.tag': 'The Benefit',
    'experience.benefit.desc': 'While one of us focuses on the grand, epic "hero" shot, the other is hunting for the quiet, emotional detail — the way your hand shakes, the tear your father wipes away, or the wild energy on the dance floor.',
    'experience.result.tag': 'The Result',
    'experience.result.desc': 'Your photos and your film will feel like they belong together. The same colors, the same mood, and the same soul. A cohesive visual legacy that tells your story from every angle.',
    'experience.journey.tag': 'The Journey',
    'experience.journey.title': 'How we work with you',
    'experience.journey.step.1.title': 'Consultation & Planning',
    'experience.journey.step.1.desc': 'We begin with a conversation to align our vision. Together, we\'ll plan the story, location, and scenography to ensure every detail is intentional.',
    'experience.journey.step.2.title': 'Preparation & Guidance',
    'experience.journey.step.2.desc': 'Receive a curated guide on posing and styling. We provide the advice you need to feel relaxed, confident, and ready for the camera.',
    'experience.journey.step.3.title': 'The Shoot & Experience',
    'experience.journey.step.3.desc': 'On the day of the shoot, we bring the magic to life. We handle the logistics — including transportation to the location — so you can focus entirely on the moment.',
    'experience.journey.step.4.title': 'Post-Production',
    'experience.journey.step.4.desc': 'Every chosen frame undergoes a meticulous editing process to ensure a timeless aesthetic. Your final gallery is delivered via a private digital space.',
    'experience.philosophy': '"We believe that the most powerful images aren\'t staged; they are felt."',
    'experience.investment.tag': 'Investment',
    'experience.investment.title': 'Curated Collections',
    'experience.investment.availability': 'Limited Availability for 2026 Weddings',
    'experience.promo.tag': 'Special 2026 Promo',
    'experience.promo.desc': 'Book your wedding photography and receive a complimentary cinematic highlight film.',
    'experience.package.starting': 'Starting at',
    'experience.package.inquire': 'Inquire',
    'experience.package.popular': 'Most Popular',
    'experience.package.collection': 'Collection',
    'experience.carousel.hint': 'Hover to pause & explore',
    'experience.package.civil.name': 'The Civil',
    'experience.package.essential.name': 'The Essential',
    'experience.package.signature.name': 'The Signature',
    'experience.package.cinematic.name': 'The Cinematic',
    'experience.package.custom.name': 'The Custom',
    'experience.package.custom.price': 'On Request',
    'experience.addons.tag': 'Our Support',
    'experience.addons.title.part1': 'We are here',
    'experience.addons.title.part2': 'for you',
    'experience.addons.1.title': 'A Personal Narrative',
    'experience.addons.1.desc': 'Two dedicated artists (Photography & Filmmaking) capturing your day from complementary perspectives.',
    'experience.addons.2.title': 'The Blueprint',
    'experience.addons.2.desc': 'A pre-wedding creative consultation to discuss scenography, lighting, and the flow of your story.',
    'experience.addons.3.title': 'The Experience',
    'experience.addons.3.desc': 'We handle the details — from location scouting to seamless coordination — so you can remain fully present in the moment.',
    'experience.addons.4.title': 'The Travel',
    'experience.addons.4.desc': 'Seamless logistics for all local and destination locations, allowing us to follow your story wherever it leads.',
    'experience.faq.title': 'Common Inquiries',
    'experience.faq.1.q': 'How would you describe your artistic approach on the wedding day?',
    'experience.faq.1.a': 'We describe our style as cinematic and editorial. We find the perfect balance between being discreet observers — capturing those raw, unscripted emotions — and providing intentional, high-end direction during portraits. Our goal is to make you feel like yourselves, never like you are performing for the camera.',
    'experience.faq.2.q': 'How many artists will be present at our wedding?',
    'experience.faq.2.a': 'You will always have two dedicated artists with you. As a husband-and-wife team, we move in unison to ensure no moment is missed. This dual perspective allows us to capture the grand architecture of the ceremony while simultaneously focusing on the quiet, whispered details and guest reactions.',
    'experience.faq.3.q': 'When can we expect to see our final wedding gallery?',
    'experience.faq.3.a': 'Quality and artistry take time, but we know you are eager to relive the magic. You will receive a curated "sneak peek" collection within 48 hours of your wedding. Your complete, high-resolution digital portfolio — meticulously edited with our signature color grade — will be delivered via a private gallery in approximately 6 to 8 weeks.',
    'experience.faq.4.q': 'Do you offer travel for destination weddings?',
    'experience.faq.4.a': 'Absolutely. We are driven by unique stories and beautiful landscapes, and we are available for travel worldwide. Whether your story unfolds in the heart of the city or a remote landscape, we handle all our own travel logistics to ensure a seamless experience for you.',
    'experience.cta.title.part1': 'Ready to start',
    'experience.cta.title.part2': 'the dialogue?',
    'experience.cta.button': 'Inquire Now',

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
    'home.about.title': 'About',
    'home.about.and': 'and',
    'home.fallback.quote': 'Every couple has a rhythm; every wedding has a pulse. Our mission is to find the quiet, cinematic moments that define your unique narrative.',

    // Portfolio — misc
    'portfolio.empty': 'No images in this category',

    // About — misc
    'about.artists': 'The Artists',
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
    'hero.location': 'SARAJEVO — PUTUJEMO ŠIROM SVIJETA',
    'hero.inquire': 'Pošaljite Upit',
    'hero.portfolio': 'Pogledajte Portfolio',

    // Home
    'home.scroll': 'Skrolujte za istraživanje',
    'home.collections.tag': 'Pregledajte po',
    'home.collections.title': 'Kolekcijama',
    'home.intro.tag': 'Umjetnost pripovijedanja',
    'home.intro.title.part1': 'Fine-art,',
    'home.intro.title.part2': 'Editorijalna',
    'home.intro.title.part3': 'Vjenčana Fotografija',
    'home.intro.desc': 'Naš pristup temelji se na uvjerenju da je svako vjenčanje jedinstveno remek-djelo. Spajamo editorijalnu sofisticiranost s dokumentarnom iskrenošću kako bismo zabilježili tihu raskoš i prolaznu magiju vašeg najznačajnijeg dana.',
    'home.explore': 'Istražite Portfolio',
    'home.about.cta': 'Upoznajte nas',
    'home.process.01.title': 'Počinjemo s vašom vizijom',
    'home.process.01.tag': 'I našim umjetničkim stilom',
    'home.process.01.desc': 'Ako imate ideje ili specifične zahtjeve, slobodno nam javite. Fotografisanje prije vjenčanja je velika saradnja — rado usmjeravamo, ali volimo i raditi s parovima na stvaranju izvanrednih slika.',
    'home.process.02.title': 'Vi birate lokaciju',
    'home.process.02.tag': 'Mi dokumentujemo trenutke',
    'home.process.02.desc': 'Često je moguće obaviti fotografisanje u gradu i na selu kako bismo dobili lijepu varijaciju. Brinemo o svoj logistici i prevozu kako biste se mogli potpuno posvetiti trenutku.',
    'home.process.03.title': 'Zajedno stvaramo umjetnost koja traje vječno',
    'home.process.03.tag': 'Naslijedne slike za generacije',
    'home.process.03.desc': 'Naša fotografisanja su opuštena i puna smijeha — nikada nema ukočenih poza. Samo lijepi, prirodni trenuci i iskrena veza. Često istražujemo različite lokacije, a mnogi parovi biraju i promjenu odjeće.',
    'home.process.03.cta': 'Povežimo se',
    'home.testimonials.tag': 'Lijepe Riječi',
    'home.testimonials.title': 'Od Naših Parova',

    // Stories
    'stories.hero.title': 'Priče',
    'stories.hero.subtitle': 'Dnevnik vizuelnog naslijeđa',
    'stories.tag': 'Portfolio',
    'stories.card.1.title': 'Umjetnost',
    'stories.card.2.title': 'Portreti',
    'stories.card.3.title': 'Klijenti',
    'stories.card.4.title': 'Putovanja',
    'stories.ready': 'Spremni da ispričate',
    'stories.yourOwn': 'svoju priču?',
    'stories.start': 'Započnite Dijalog',

    // Portfolio
    'portfolio.hero.title': 'Radovi',
    'portfolio.hero.subtitle': 'Vizuelno Naslijeđe',
    'portfolio.approach.title': 'Pristup',
    'portfolio.approach.heading': 'Čuvamo svako',
    'portfolio.approach.subheading': 'poglavlje vaše priče.',
    'portfolio.approach.desc': 'Od tihog iščekivanja jutra do divlje energije plesnog podija, dokumentujemo trenutke koji definišu vašu proslavu. Svaki detalj, ma koliko mali, vitalni je dio vizuelnog naslijeđa koje stvaramo zajedno — bezvremenski podsjetnik na ljubav i radost koji su ispunili vaš dan.',
    'portfolio.ready': 'Spremni da započnete',
    'portfolio.dialogue': 'dijalog?',

    // About
    'about.hero.title': 'O Nama',
    'about.hero.subtitle': 'Umjetnici iza objektiva',
    'about.title': 'Zdravo, mi smo Melisa i Aldin.',
    'about.desc.1': 'Partneri u životu i iza objektiva. Kao fotografi i filmaši — i muž i žena — naš rad je dijalog između editorijalne mode i pokretne slike. Inspirisani emocijama, pristupamo vašoj priči s namjerom.',
    'about.desc.2': 'Samo grupa običnih ljudi zaljubljenih u stvaranje slika ljubavi proteklih 8 godina. Sljedeće slike koje stvorimo mogle bi biti vaše.',
    'about.desc.3': 'Provodimo dane na vjenčanjima zbijajući šale i pokušavajući uhvatiti tihu raskoš ljubavi. Mi ne bilježimo samo trenutke; mi stvaramo uzvišene slike koje rezonuju s dušom vašeg jedinstvenog putovanja.',
    'about.stories.title': 'Naš Žurnal',
    'about.stories.subtitle': 'Kolekcija vizuelnih naslijeđa',
    'about.experience.tag': 'Iskustvo',
    'about.experience.title': 'Kako Radimo',
    'about.step.1.title': 'Konsultacije i planiranje',
    'about.step.1.desc': 'Počinjemo razgovorom kako bismo uskladili našu viziju. Zajedno ćemo planirati priču, lokaciju i scenografiju kako bismo osigurali da svaki detalj bude namjeran.',
    'about.step.2.title': 'Priprema i vođenje',
    'about.step.2.desc': 'Dobijte kurirani vodič o poziranju i stilizovanju. Pružamo savjete koji su vam potrebni da se osjećate opušteno, samouvjereno i spremno za kameru.',
    'about.step.3.title': 'Snimanje i iskustvo',
    'about.step.3.desc': 'Na dan snimanja, oživljavamo magiju. Mi brinemo o logistici — uključujući prevoz do lokacije — tako da se možete u potpunosti fokusirati na trenutak.',
    'about.step.4.title': 'Postprodukcija',
    'about.step.4.desc': 'Svaki odabrani kadar prolazi kroz pedantan proces uređivanja kako bi se osigurala bezvremenska estetika. Vaša finalna galerija se dostavlja putem privatnog digitalnog prostora.',

    // Contact
    'contact.hero.title': 'Upit',
    'contact.hero.subtitle': 'Stvorimo nešto bezvremensko zajedno',
    'contact.connect.tag': 'Upiti',
    'contact.connect.title.part1': 'Započnimo',
    'contact.connect.title.part2': 'Dijalog',
    'contact.email.tag': 'Pišite nam',
    'contact.follow.tag': 'Pratite nas',
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
    'experience.hero.title': 'Iskustvo',
    'experience.hero.subtitle': 'Umjetnost filmskog dokumentovanja',
    'experience.intro.tag': 'Iskustvo',
    'experience.intro.title.part1': 'Više od običnih',
    'experience.intro.title.part2': 'fotografa.',
    'experience.intro.desc': 'Kada nas angažujete, ne dobijate samo fotografe. Dobijate tim koji radi kao jedno. Proveli smo godine usavršavajući naš tihi jezik, znajući tačno gdje je onaj drugi i šta vidi.',
    'experience.benefit.tag': 'Prednost',
    'experience.benefit.desc': 'Dok se jedno od nas fokusira na velike, epske kadrove, drugo traga za tihim, emotivnim detaljima — načinom na koji vam ruka drhti, suzom koju otac obriše ili divljom energijom na podijumu.',
    'experience.result.tag': 'Rezultat',
    'experience.result.desc': 'Vaše fotografije i vaš film će se osjećati kao da pripadaju jedno drugom. Isti tonovi, isto raspoloženje i ista duša. Kohezivno vizuelno naslijeđe koje priča vašu priču iz svakog ugla.',
    'experience.journey.tag': 'Putovanje',
    'experience.journey.title': 'Kako radimo s vama',
    'experience.journey.step.1.title': 'Konsultacije i planiranje',
    'experience.journey.step.1.desc': 'Počinjemo razgovorom kako bismo uskladili našu viziju. Zajedno ćemo planirati priču, lokaciju i scenografiju kako bismo osigurali da svaki detalj bude namjeran.',
    'experience.journey.step.2.title': 'Priprema i vođenje',
    'experience.journey.step.2.desc': 'Dobijte kurirani vodič o poziranju i stilizovanju. Pružamo savjete koji su vam potrebni da se osjećate opušteno, samouvjereno i spremno za kameru.',
    'experience.journey.step.3.title': 'Snimanje i iskustvo',
    'experience.journey.step.3.desc': 'Na dan snimanja, oživljavamo magiju. Mi brinemo o logistici — uključujući prevoz do lokacije — tako da se možete u potpunosti fokusirati na trenutak.',
    'experience.journey.step.4.title': 'Postprodukcija',
    'experience.journey.step.4.desc': 'Svaki odabrani kadar prolazi kroz pedantan proces uređivanja kako bi se osigurala bezvremenska estetika. Vaša finalna galerija se dostavlja putem privatnog digitalnog prostora.',
    'experience.philosophy': '"Vjerujemo da najmoćnije slike nisu namještene; one se osjećaju."',
    'experience.investment.tag': 'Investicija',
    'experience.investment.title': 'Kurirane Kolekcije',
    'experience.investment.availability': 'Ograničena dostupnost za vjenčanja 2026',
    'experience.promo.tag': 'Specijalna 2026 Promocija',
    'experience.promo.desc': 'Rezervišite fotografisanje vjenčanja i dobijte besplatan cinematic highlight film.',
    'experience.package.starting': 'Počevši od',
    'experience.package.inquire': 'Pošaljite Upit',
    'experience.package.popular': 'Najpopularnije',
    'experience.package.collection': 'Kolekcija',
    'experience.carousel.hint': 'Zadržite kursor za pauzu',
    'experience.package.civil.name': 'Civilno vjenčanje',
    'experience.package.essential.name': 'Osnovni paket',
    'experience.package.signature.name': 'Potpisni paket',
    'experience.package.cinematic.name': 'Filmski paket',
    'experience.package.custom.name': 'Prilagođeni paket',
    'experience.package.custom.price': 'Na upit',
    'experience.addons.tag': 'Naša podrška',
    'experience.addons.title.part1': 'Tu smo',
    'experience.addons.title.part2': 'za vas',
    'experience.addons.1.title': 'Lični narativ',
    'experience.addons.1.desc': 'Dva posvećena umjetnika (fotografija i film) koji bilježe vaš dan iz komplementarnih perspektiva.',
    'experience.addons.2.title': 'Nacrt',
    'experience.addons.2.desc': 'Kreativne konsultacije prije vjenčanja o scenografiji, osvjetljenju i toku vaše priče.',
    'experience.addons.3.title': 'Iskustvo',
    'experience.addons.3.desc': 'Mi brinemo o detaljima — od odabira lokacija do besprijekorne koordinacije — tako da možete ostati potpuno prisutni u trenutku.',
    'experience.addons.4.title': 'Putovanje',
    'experience.addons.4.desc': 'Besprijekorna logistika za sve lokalne i svjetske lokacije, omogućavajući nam da pratimo vašu priču gdje god ona vodila.',
    'experience.faq.title': 'Česta Pitanja',
    'experience.faq.1.q': 'Kako biste opisali svoj umjetnički pristup na dan vjenčanja?',
    'experience.faq.1.a': 'Naš stil opisujemo kao filmski i editorijalni. Pronalazimo savršen balans između diskretnih posmatrača — bilježeći sirove, nescenirane emocije — i pružanja namjernog, vrhunskog usmjeravanja tokom portreta. Naš cilj je da se osjećate kao svoji, a ne kao da nastupate pred kamerom.',
    'experience.faq.2.q': 'Koliko će umjetnika biti prisutno na našem vjenčanju?',
    'experience.faq.2.a': 'Uvijek ćete imati dva posvećena umjetnika uz sebe. Kao tim muža i žene, krećemo se usklađeno kako bismo osigurali da nijedan trenutak ne bude propušten. Ova dvostruka perspektiva nam omogućava da zabilježimo grandioznu arhitekturu ceremonije dok se istovremeno fokusiramo na tihe, šaputane detalje i reakcije gostiju.',
    'experience.faq.3.q': 'Kada možemo očekivati našu finalnu galeriju vjenčanja?',
    'experience.faq.3.a': 'Kvalitet i umjetnost zahtijevaju vrijeme, ali znamo da ste nestrpljivi da ponovo proživite magiju. Primit ćete kuriranu kolekciju "sneak peek" u roku od 48 sati od vašeg vjenčanja. Vaš potpuni digitalni portfolio visoke rezolucije — pedantno uređen s našom prepoznatljivom obradom boja — bit će dostavljen putem privatne galerije za otprilike 6 do 8 sedmica.',
    'experience.faq.4.q': 'Da li nudite putovanja za vjenčanja na destinacijama?',
    'experience.faq.4.a': 'Apsolutno. Pokreću nas jedinstvene priče i prelijepi pejzaži, te smo dostupni za putovanja širom svijeta. Bez obzira da li se vaša priča odvija u srcu grada ili u udaljenom pejzažu, mi brinemo o kompletnoj logistici putovanja kako bismo osigurali besprijekorno iskustvo za vas.',
    'experience.cta.title.part1': 'Spremni da započnete',
    'experience.cta.title.part2': 'dijalog?',
    'experience.cta.button': 'Pošaljite Upit',

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
    'home.about.title': 'O',
    'home.about.and': 'i',
    'home.fallback.quote': 'Svaki par ima ritam; svako vjenčanje ima puls. Naša misija je pronaći tihe, kinematske trenutke koji definišu vaš jedinstveni narativ.',

    // Portfolio — misc
    'portfolio.empty': 'Nema slika u ovoj kategoriji',

    // About — misc
    'about.artists': 'Umjetnici',
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
  const [language, setLanguageState] = useState<Language>(() => {
    try {
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
    setLanguageState(lang);
    try { localStorage.setItem('387_language', lang); } catch {}
  };

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

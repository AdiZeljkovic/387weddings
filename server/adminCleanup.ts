import type { PoolClient } from 'pg';

/**
 * The panel's data, tidied once (migration "admin_cleanup_2026_10").
 *
 * 1. Texts and settings the site no longer shows are moved out of the live
 *    tables into archive tables (archived_page_content, archived_site_settings)
 *    with the date they were moved — nothing is lost, anything can be put
 *    back. Among them: the old footer fields, "Usluge" in the menu, a third
 *    home paragraph, the date field's placeholder, the unused "Lokacija /
 *    Slogan" setting, and on production the old CMS fields of earlier
 *    versions of the site.
 * 2. The old gallery table, replaced by stories long ago, is archived whole
 *    (archived_gallery_images) and removed.
 * 3. Every text gets its page, its section, its place in the order the
 *    visitor sees it, and a plain label — so the editor reads like the site.
 *    Only page/section/label/order change; no text is touched.
 */

// Texts the site reads
const KEEP_CONTENT = new Set<string>(["about.bio.1.p1", "about.bio.1.p2", "about.bio.1.p3", "about.bio.1.tag", "about.bio.1.title.part1", "about.bio.1.title.part2", "about.bio.2.p1", "about.bio.2.p2", "about.bio.2.p3", "about.bio.2.tag", "about.bio.2.title.part1", "about.bio.2.title.part2", "about.invite.button", "about.invite.p1", "about.invite.p2", "about.invite.title.part1", "about.invite.title.part2", "contact.err.consent", "contact.err.coverage", "contact.err.date", "contact.err.email", "contact.err.email.bad", "contact.err.guests", "contact.err.location", "contact.err.name", "contact.form.again", "contact.form.consent", "contact.form.coverage", "contact.form.coverage.opt.1", "contact.form.coverage.opt.2", "contact.form.coverage.opt.3", "contact.form.coverage.opt.4", "contact.form.coverage.opt.5", "contact.form.coverage.placeholder", "contact.form.date", "contact.form.email", "contact.form.email.placeholder", "contact.form.error", "contact.form.guests", "contact.form.guests.placeholder", "contact.form.location", "contact.form.location.placeholder", "contact.form.name", "contact.form.name.placeholder", "contact.form.phone", "contact.form.phone.placeholder", "contact.form.places", "contact.form.places.placeholder", "contact.form.sending", "contact.form.story", "contact.form.story.placeholder", "contact.form.submit", "contact.form.success.desc", "contact.form.success.title", "contact.form.video", "contact.form.video.opt.1", "contact.form.video.opt.2", "contact.form.video.opt.3", "contact.form.video.placeholder", "contact.group.story", "contact.group.wedding", "contact.group.you", "contact.hero.desc", "contact.hero.title.part1", "contact.hero.title.part2", "contact.hero.title.part3", "contact.response.note", "cookie.accept", "cookie.decline", "cookie.more", "cookie.text", "cookie.title", "footer.link.about.sub", "footer.link.contact.sub", "footer.link.work.sub", "footer.rights", "footer.top", "hero.desc", "hero.inquire", "hero.portfolio", "hero.title.part1", "hero.title.part2", "home.about.cta", "home.about.desc.1", "home.about.desc.2", "home.about.heading.part1", "home.about.heading.part2", "home.about.tag", "home.featured.cta", "home.featured.heading.part1", "home.featured.heading.part2", "home.featured.heading.part3", "home.featured.title", "home.scroll", "instagram.tag", "instagram.title.part1", "instagram.title.part2", "nav.home", "nav.inquire", "nav.stories", "nav.work", "notfound.desc", "notfound.home", "notfound.portfolio", "notfound.tag", "notfound.title.part1", "notfound.title.part2", "portfolio.approach.desc", "portfolio.card.portrait", "portfolio.card.studio", "portfolio.card.wedding", "portfolio.empty", "portfolio.filter.all", "portfolio.filter.portraits", "portfolio.filter.studio", "portfolio.filter.weddings", "portfolio.hero.subtitle", "portfolio.hero.tag", "portfolio.hero.title", "privacy.body", "privacy.empty", "privacy.title", "story.back", "story.close", "story.next", "story.prev", "story.tag"]);

// Settings the site or the panel reads
const KEEP_SETTINGS = new Set<string>([
  'email', 'phone', 'contact_recipient', 'instagram', 'instagram_handle', 'coming_soon',
  'seo.site_name', 'seo.og_image', 'analytics.ga_id', 'analytics.gtm_id', 'analytics.gsc_verification',
  'sitemap.base_url', 'robots_txt',
]);
const KEEP_SETTING_PATTERNS = [
  /^migr\./,
  /^seo\.(home|portfolio|about|contact|privacy|story)\.(title|desc)\.(bs|en)$/,
  /^img\.home\.hero\.(mobile\.)?[1-5](\.alt|\.focus)?$/,
  /^img\.home\.stack\.[1-5](\.alt|\.focus)?$/,
  /^img\.about\.(melisa|aldin)(\.alt|\.focus)?$/,
  /^img\.about\.cta\.[1-3](\.alt|\.focus)?$/,
  /^img\.contact\.hero(\.mobile)?(\.alt|\.focus)?$/,
];

// [key, page, section, label] — the order within a section is the order here
const LAYOUT: [string, string, string, string][] = [
  ["hero.title.part1", "home", "hero", "Naslov — 1. red"],
  ["hero.title.part2", "home", "hero", "Naslov — 2. red (kurziv)"],
  ["hero.desc", "home", "hero", "Kratki opis ispod naslova"],
  ["hero.portfolio", "home", "hero", "Dugme „Pogledajte radove“"],
  ["hero.inquire", "home", "hero", "Dugme „Pošaljite upit“"],
  ["home.scroll", "home", "hero", "Natpis „Skroluj“ pri dnu"],
  ["home.featured.title", "home", "featured", "Mala oznaka iznad naslova"],
  ["home.featured.heading.part1", "home", "featured", "Naslov — 1. red"],
  ["home.featured.heading.part2", "home", "featured", "Naslov — 2. red"],
  ["home.featured.heading.part3", "home", "featured", "Naslov — 3. red (crveni kurziv)"],
  ["home.featured.cta", "home", "featured", "Dugme ispod lepeze"],
  ["home.about.tag", "home", "about_section", "Mala oznaka iznad naslova"],
  ["home.about.heading.part1", "home", "about_section", "Naslov — 1. red"],
  ["home.about.heading.part2", "home", "about_section", "Naslov — 2. red (riječi u *zvjezdicama* su crvene)"],
  ["home.about.desc.1", "home", "about_section", "Odlomak 1"],
  ["home.about.desc.2", "home", "about_section", "Odlomak 2"],
  ["home.about.cta", "home", "about_section", "Dugme „Upoznajte nas“"],
  ["portfolio.hero.tag", "portfolio", "hero", "Mala oznaka iznad naslova"],
  ["portfolio.hero.title", "portfolio", "hero", "Naslov — 1. dio"],
  ["portfolio.hero.subtitle", "portfolio", "hero", "Naslov — 2. dio (crveni kurziv)"],
  ["portfolio.approach.desc", "portfolio", "hero", "Uvodni tekst (riječ u *zvjezdicama* je crvena)"],
  ["portfolio.filter.all", "portfolio", "filter", "Filter „Sve“"],
  ["portfolio.filter.weddings", "portfolio", "filter", "Filter „Vjenčanja“"],
  ["portfolio.filter.studio", "portfolio", "filter", "Filter „Studio“"],
  ["portfolio.filter.portraits", "portfolio", "filter", "Filter „Portreti“"],
  ["portfolio.card.wedding", "portfolio", "filter", "Oznaka na kartici: vjenčanje"],
  ["portfolio.card.studio", "portfolio", "filter", "Oznaka na kartici: studio"],
  ["portfolio.card.portrait", "portfolio", "filter", "Oznaka na kartici: portret"],
  ["portfolio.empty", "portfolio", "filter", "Poruka kad kategorija nema priča"],
  ["story.back", "story", "labels", "Link „Svi radovi“ na vrhu"],
  ["story.tag", "story", "labels", "Oznaka iznad teksta priče"],
  ["story.prev", "story", "labels", "Link „Prethodna priča“"],
  ["story.next", "story", "labels", "Link „Sljedeća priča“"],
  ["story.close", "story", "labels", "Dugme „Zatvori“ u galeriji"],
  ["about.bio.1.tag", "about", "bio", "Melisa — mala oznaka"],
  ["about.bio.1.title.part1", "about", "bio", "Melisa — naslov, 1. red"],
  ["about.bio.1.title.part2", "about", "bio", "Melisa — naslov, 2. red (crveni kurziv)"],
  ["about.bio.1.p1", "about", "bio", "Melisa — uvodni odlomak (prazno = sakriveno)"],
  ["about.bio.1.p2", "about", "bio", "Melisa — odlomak 2 (prazno = sakriveno)"],
  ["about.bio.1.p3", "about", "bio", "Melisa — odlomak 3 (prazno = sakriveno)"],
  ["about.bio.2.tag", "about", "bio", "Aldin — mala oznaka"],
  ["about.bio.2.title.part1", "about", "bio", "Aldin — naslov, 1. red"],
  ["about.bio.2.title.part2", "about", "bio", "Aldin — naslov, 2. red (crveni kurziv)"],
  ["about.bio.2.p1", "about", "bio", "Aldin — uvodni odlomak (prazno = sakriveno)"],
  ["about.bio.2.p2", "about", "bio", "Aldin — odlomak 2 (prazno = sakriveno)"],
  ["about.bio.2.p3", "about", "bio", "Aldin — odlomak 3 (prazno = sakriveno)"],
  ["about.invite.title.part1", "about", "invite", "Naslov — 1. red"],
  ["about.invite.title.part2", "about", "invite", "Naslov — 2. red"],
  ["about.invite.p1", "about", "invite", "Odlomak 1 (prazno = sakriveno)"],
  ["about.invite.p2", "about", "invite", "Odlomak 2 (prazno = sakriveno)"],
  ["about.invite.button", "about", "invite", "Dugme"],
  ["contact.hero.title.part1", "contact", "hero", "Naslov — 1. red"],
  ["contact.hero.title.part2", "contact", "hero", "Naslov — 2. red"],
  ["contact.hero.title.part3", "contact", "hero", "Naslov — istaknuta riječ (crveni kurziv)"],
  ["contact.hero.desc", "contact", "hero", "Opis ispod naslova"],
  ["contact.group.you", "contact", "form", "Grupa 1 — naslov („O vama“)"],
  ["contact.form.name", "contact", "form", "Ime i prezime — naziv polja"],
  ["contact.form.name.placeholder", "contact", "form", "Ime i prezime — tekst u polju"],
  ["contact.form.email", "contact", "form", "E-mail — naziv polja"],
  ["contact.form.email.placeholder", "contact", "form", "E-mail — tekst u polju"],
  ["contact.form.phone", "contact", "form", "Telefon — naziv polja"],
  ["contact.form.phone.placeholder", "contact", "form", "Telefon — tekst u polju"],
  ["contact.group.wedding", "contact", "form", "Grupa 2 — naslov („O vjenčanju“)"],
  ["contact.form.date", "contact", "form", "Datum vjenčanja — naziv polja"],
  ["contact.form.location", "contact", "form", "Lokacija — naziv polja"],
  ["contact.form.location.placeholder", "contact", "form", "Lokacija — tekst u polju"],
  ["contact.form.guests", "contact", "form", "Broj gostiju — naziv polja"],
  ["contact.form.guests.placeholder", "contact", "form", "Broj gostiju — tekst u polju"],
  ["contact.form.coverage", "contact", "form", "Trajanje angažmana — naziv polja"],
  ["contact.form.coverage.placeholder", "contact", "form", "Trajanje angažmana — tekst u polju"],
  ["contact.form.coverage.opt.1", "contact", "form", "Trajanje — opcija 1 (prazno = sakriveno)"],
  ["contact.form.coverage.opt.2", "contact", "form", "Trajanje — opcija 2 (prazno = sakriveno)"],
  ["contact.form.coverage.opt.3", "contact", "form", "Trajanje — opcija 3 (prazno = sakriveno)"],
  ["contact.form.coverage.opt.4", "contact", "form", "Trajanje — opcija 4 (prazno = sakriveno)"],
  ["contact.form.coverage.opt.5", "contact", "form", "Trajanje — opcija 5 (prazno = sakriveno)"],
  ["contact.form.video", "contact", "form", "Video — naziv polja"],
  ["contact.form.video.placeholder", "contact", "form", "Video — tekst u polju"],
  ["contact.form.video.opt.1", "contact", "form", "Video — opcija 1 (prazno = sakriveno)"],
  ["contact.form.video.opt.2", "contact", "form", "Video — opcija 2 (prazno = sakriveno)"],
  ["contact.form.video.opt.3", "contact", "form", "Video — opcija 3 (prazno = sakriveno)"],
  ["contact.group.story", "contact", "form", "Grupa 3 — naslov („Vaša priča“)"],
  ["contact.form.places", "contact", "form", "Mjesta fotografisanja — naziv polja"],
  ["contact.form.places.placeholder", "contact", "form", "Mjesta fotografisanja — tekst u polju"],
  ["contact.form.story", "contact", "form", "Vaša priča — naziv polja"],
  ["contact.form.story.placeholder", "contact", "form", "Vaša priča — tekst u polju"],
  ["contact.form.consent", "contact", "form", "Tekst uz kvačicu (pristanak)"],
  ["contact.form.submit", "contact", "form", "Dugme „Pošalji“"],
  ["contact.form.sending", "contact", "form", "Dugme dok se šalje"],
  ["contact.err.name", "contact", "errors", "Nije upisano ime"],
  ["contact.err.email", "contact", "errors", "Nije upisan e-mail"],
  ["contact.err.email.bad", "contact", "errors", "E-mail nije ispravan"],
  ["contact.err.date", "contact", "errors", "Nije odabran datum"],
  ["contact.err.location", "contact", "errors", "Nije upisana lokacija"],
  ["contact.err.guests", "contact", "errors", "Nije upisan broj gostiju"],
  ["contact.err.coverage", "contact", "errors", "Nije odabrano trajanje"],
  ["contact.err.consent", "contact", "errors", "Nije označen pristanak"],
  ["contact.form.error", "contact", "errors", "Slanje nije uspjelo"],
  ["contact.form.success.title", "contact", "done", "Naslov potvrde"],
  ["contact.form.success.desc", "contact", "done", "Tekst potvrde"],
  ["contact.form.again", "contact", "done", "Dugme „Pošalji novi upit“"],
  ["contact.response.note", "contact", "note", "Napomena o vremenu odgovora (ispod forme)"],
  ["privacy.title", "privacy", "page", "Naslov"],
  ["privacy.body", "privacy", "page", "Tekst (prazan red = novi odlomak; red koji završava sa „:“ = podnaslov)"],
  ["privacy.empty", "privacy", "page", "Poruka dok tekst nije unesen"],
  ["nav.home", "layout", "nav", "Link „Početna“"],
  ["nav.work", "layout", "nav", "Link „Radovi“"],
  ["nav.stories", "layout", "nav", "Link „O nama“"],
  ["nav.inquire", "layout", "nav", "Link „Kontakt“"],
  ["footer.link.about.sub", "layout", "footer", "Podnaslov ispod „O nama“"],
  ["footer.link.work.sub", "layout", "footer", "Podnaslov ispod „Radovi“"],
  ["footer.link.contact.sub", "layout", "footer", "Podnaslov ispod „Kontakt“"],
  ["footer.rights", "layout", "footer", "Tekst o autorskim pravima (iza „© godina 387 Weddings.“)"],
  ["footer.top", "layout", "footer", "Link „Na vrh“"],
  ["instagram.tag", "layout", "instagram", "Mala oznaka („Još trenutaka“)"],
  ["instagram.title.part1", "layout", "instagram", "Naslov — 1. dio"],
  ["instagram.title.part2", "layout", "instagram", "Naslov — 2. dio (kurziv)"],
  ["cookie.text", "layout", "cookie", "Tekst"],
  ["cookie.more", "layout", "cookie", "Link na politiku privatnosti"],
  ["cookie.accept", "layout", "cookie", "Dugme „Prihvatam“"],
  ["cookie.decline", "layout", "cookie", "Dugme „Odbijam“"],
  ["cookie.title", "layout", "cookie", "Naziv za čitače ekrana (ne vidi se)"],
  ["notfound.tag", "notfound", "page", "Mala oznaka („Greška 404“)"],
  ["notfound.title.part1", "notfound", "page", "Naslov — 1. red"],
  ["notfound.title.part2", "notfound", "page", "Naslov — 2. red (crveni kurziv)"],
  ["notfound.desc", "notfound", "page", "Opis"],
  ["notfound.home", "notfound", "page", "Dugme „Početna“"],
  ["notfound.portfolio", "notfound", "page", "Dugme „Radovi“"],
];

export async function adminCleanup(client: PoolClient) {
  // 1. Archive what the site no longer uses
  await client.query(`
    CREATE TABLE IF NOT EXISTS archived_page_content
      AS SELECT *, NOW() AS archived_at FROM page_content WITH NO DATA;
    CREATE TABLE IF NOT EXISTS archived_site_settings
      AS SELECT *, NOW() AS archived_at FROM site_settings WITH NO DATA;
  `);
  const content = await client.query('SELECT key FROM page_content');
  const oldContent = content.rows.map(r => r.key as string).filter(k => !KEEP_CONTENT.has(k));
  if (oldContent.length) {
    await client.query('INSERT INTO archived_page_content SELECT *, NOW() FROM page_content WHERE key = ANY($1)', [oldContent]);
    await client.query('DELETE FROM page_content WHERE key = ANY($1)', [oldContent]);
  }
  const settings = await client.query('SELECT key FROM site_settings');
  const oldSettings = settings.rows.map(r => r.key as string)
    .filter(k => !KEEP_SETTINGS.has(k) && !KEEP_SETTING_PATTERNS.some(p => p.test(k)));
  if (oldSettings.length) {
    await client.query('INSERT INTO archived_site_settings SELECT *, NOW() FROM site_settings WHERE key = ANY($1)', [oldSettings]);
    await client.query('DELETE FROM site_settings WHERE key = ANY($1)', [oldSettings]);
  }
  console.log(`[migr] arhivirano: ${oldContent.length} tekstova, ${oldSettings.length} postavki`);

  // 2. The old gallery
  const hasGallery = await client.query("SELECT to_regclass('public.gallery_images') AS t");
  if (hasGallery.rows[0].t) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS archived_gallery_images AS SELECT *, NOW() AS archived_at FROM gallery_images;
      DROP TABLE gallery_images;
    `);
    console.log('[migr] stara galerija arhivirana (archived_gallery_images)');
  }

  // 3. Every text in its place
  const order: Record<string, number> = {};
  for (const [key, page, section, label] of LAYOUT) {
    const n = (order[`${page}/${section}`] = (order[`${page}/${section}`] ?? -1) + 1);
    await client.query(
      'UPDATE page_content SET page = $2, section = $3, label = $4, sort_order = $5 WHERE key = $1',
      [key, page, section, label, n]
    );
  }
}

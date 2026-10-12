/**
 * The studio's Instagram from the settings: the handle shown, and the
 * address it links to (the profile URL if the owner set one, else the
 * profile of the handle). One rule for the header menu, footer and pages.
 */
export function instagramOf(settings: Record<string, string>) {
  const handle = settings.instagram_handle?.trim() || '387.weddings';
  const url = settings.instagram && settings.instagram !== '#'
    ? settings.instagram
    : `https://instagram.com/${handle}`;
  return { handle, url };
}

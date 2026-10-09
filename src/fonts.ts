// Fonts are served from this site rather than from Google, as the brief asks:
// no third-party request on every page view, and the files arrive with the
// rest of the assets under the same long cache headers.
//
// Only the cuts the design uses are declared. Each file covers every subset
// with a unicode-range, so a browser fetches latin and latin-ext (č ć š ž đ)
// and nothing else. Caveat is only here because the panel offers it as a
// "script" option for a text field; its file is never fetched unless used.
import '@fontsource/playfair-display/400.css';
import '@fontsource/playfair-display/400-italic.css';
import '@fontsource/playfair-display/500.css';
import '@fontsource/montserrat/300.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/anton/400.css';
import '@fontsource/caveat/400.css';

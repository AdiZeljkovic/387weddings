// Fonts are served from this site rather than from Google, as the brief asks:
// no third-party request on every page view, and the files arrive with the
// rest of the assets under the same long cache headers.
//
// fonts.css declares, per cut, the latin file and a tiny file with only the
// Bosnian letters (Č č Ć ć Đ đ Š š Ž ž) — the full latin-ext files were about
// 160 KB across the cuts for those ten letters — plus fallback faces matched
// to the real fonts' size, so nothing reflows when they arrive.
// Caveat is only here because the panel offers it as a "script" option for a
// text field; its file is never fetched unless used.
import './fonts.css';
import '@fontsource/caveat/400.css';

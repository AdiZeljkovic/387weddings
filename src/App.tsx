import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { loadSettings } from './lib/settingsCache';
import { useLanguage } from './contexts/LanguageContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import BackToTop from './components/BackToTop';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/admin/ProtectedRoute';
import { AdminLayout } from './components/admin/AdminLayout';
import ComingSoon from './pages/ComingSoon';

// ── Error Boundary ────────────────────────────────────────────────────────────
type EBProps = { children: React.ReactNode };
type EBState = { hasError: boolean };
class ErrorBoundary extends React.Component<EBProps, EBState> {
  constructor(props: EBProps) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(): EBState { return { hasError: true }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-moody-950 text-center px-6">
          <p className="text-xs tracking-[0.3em] uppercase text-gold-400 mb-4">Something went wrong</p>
          <h1 className="text-2xl font-light text-white/85 mb-6">An unexpected error occurred</h1>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="px-6 py-2.5 border border-gold-500/50 text-gold-300 text-xs tracking-widest uppercase hover:bg-gold-600/10 transition-colors"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Public pages
const Home = lazy(() => import('./pages/Home'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Experience = lazy(() => import('./pages/Services'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Admin pages
const AdminLogin = lazy(() => import('./pages/admin/Login'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const GalleryManager = lazy(() => import('./pages/admin/GalleryManager'));
const PackagesManager = lazy(() => import('./pages/admin/PackagesManager'));
const TestimonialsManager = lazy(() => import('./pages/admin/TestimonialsManager'));
const Submissions = lazy(() => import('./pages/admin/Submissions'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const PagesManager = lazy(() => import('./pages/admin/PagesManager'));
const ImagesManager = lazy(() => import('./pages/admin/ImagesManager'));
const InstagramManager = lazy(() => import('./pages/admin/InstagramManager'));

function PageMetadata({ title, description, pageKey }: { title: string; description: string; pageKey: string }) {
  const { language } = useLanguage();
  const langCode = language === 'ENG' ? 'en' : 'bs';
  const { pathname } = useLocation();

  React.useEffect(() => {
    loadSettings().then(s => {
      const siteName  = s['seo.site_name']?.trim() || '387 Cinematic Weddings';
      const finalTitle = s[`seo.${pageKey}.title.${langCode}`]?.trim()
        || s[`seo.${pageKey}.title`]?.trim()
        || `${title} | ${siteName}`;
      const finalDesc  = s[`seo.${pageKey}.desc.${langCode}`]?.trim()
        || s[`seo.${pageKey}.desc`]?.trim()
        || description;

      document.title = finalTitle;

      const setMeta = (sel: string, value: string) => {
        const el = document.querySelector(sel);
        if (el) el.setAttribute('content', value);
      };

      setMeta('meta[name="description"]',        finalDesc);
      setMeta('meta[property="og:title"]',        finalTitle);
      setMeta('meta[property="og:description"]',  finalDesc);
      setMeta('meta[name="twitter:title"]',       finalTitle);
      setMeta('meta[name="twitter:description"]', finalDesc);

      const ogImage = s['seo.og_image']?.trim();
      if (ogImage) {
        setMeta('meta[property="og:image"]', ogImage);
        setMeta('meta[name="twitter:image"]', ogImage);
      }

      const baseUrl = (s['sitemap.base_url']?.trim() || 'https://387cinematicweddings.com').replace(/\/$/, '');
      const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (canonical) canonical.href = `${baseUrl}${pathname}`;
    });
  }, [title, description, pageKey, langCode, pathname]);
  return null;
}

// ── Analytics Injector ────────────────────────────────────────────────────────
// Reads GA4 / GTM / GSC settings from DB and injects the appropriate scripts
// into <head> once. Re-runs if settings change (e.g. after admin save + reload).
function AnalyticsInjector() {
  React.useEffect(() => {
    const inject = () => loadSettings().then(s => {
      const gaId  = s['analytics.ga_id']?.trim();
      const gtmId = s['analytics.gtm_id']?.trim();
      const gsc   = s['analytics.gsc_verification']?.trim();

      // Google Search Console — meta verification tag
      if (gsc && !document.querySelector('meta[name="google-site-verification"]')) {
        const meta = document.createElement('meta');
        meta.name    = 'google-site-verification';
        meta.content = gsc;
        document.head.appendChild(meta);
      }

      // GA4 — only inject if ID looks valid and not already present
      if (gaId && /^G-[A-Z0-9]{6,}$/.test(gaId) && !document.querySelector(`script[data-ga="${gaId}"]`)) {
        const s1 = document.createElement('script');
        s1.async = true;
        s1.src   = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        s1.setAttribute('data-ga', gaId);
        document.head.appendChild(s1);

        const s2 = document.createElement('script');
        s2.setAttribute('data-ga', gaId);
        s2.innerHTML = [
          'window.dataLayer=window.dataLayer||[];',
          'function gtag(){dataLayer.push(arguments);}',
          "gtag('js',new Date());",
          `gtag('config','${gaId}');`,
        ].join('');
        document.head.appendChild(s2);
      }

      // GTM — only if no GA4 conflict warning was shown; inject once
      if (gtmId && /^GTM-[A-Z0-9]{4,}$/.test(gtmId) && !document.querySelector(`script[data-gtm="${gtmId}"]`)) {
        const s1 = document.createElement('script');
        s1.setAttribute('data-gtm', gtmId);
        s1.innerHTML = [
          '(function(w,d,s,l,i){',
          'w[l]=w[l]||[];',
          "w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});",
          "var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';",
          "j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;",
          "f.parentNode.insertBefore(j,f);",
          `})(window,document,'script','dataLayer','${gtmId}');`,
        ].join('');
        document.head.appendChild(s1);

        // GTM <noscript> fallback in <body>
        if (!document.querySelector(`noscript[data-gtm="${gtmId}"]`)) {
          const ns = document.createElement('noscript');
          ns.setAttribute('data-gtm', gtmId);
          ns.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
          document.body.insertBefore(ns, document.body.firstChild);
        }
      }
    });
    if ('requestIdleCallback' in window) {
      requestIdleCallback(inject, { timeout: 3000 });
    } else {
      setTimeout(inject, 1500);
    }
  }, []);
  return null;
}

const PublicLoadingFallback = (
  <div className="h-screen w-full flex items-center justify-center bg-moody-950">
    <div className="w-12 h-[1px] bg-gold-300 animate-pulse" />
  </div>
);

const AdminLoadingFallback = (
  <div className="h-screen w-full flex items-center justify-center bg-moody-950">
    <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// ── Coming Soon Gate ─────────────────────────────────────────────────────────
function ComingSoonGate({ children }: { children: React.ReactNode }) {
  const { admin, isLoading: authLoading } = useAuth();
  const [comingSoon, setComingSoon] = React.useState<boolean>(false);

  React.useEffect(() => {
    loadSettings()
      .then(s => setComingSoon(s['coming_soon'] === 'true'))
      .catch(() => {});
  }, []);

  // Default false — site renders immediately; switches to ComingSoon only if API confirms
  if (!comingSoon) return <>{children}</>;

  // Coming soon is ON — wait for auth to resolve
  if (authLoading) return <>{PublicLoadingFallback}</>;

  // Admin bypass: logged-in admin sees the full site + reminder banner
  if (admin) {
    return (
      <>
        {children}
        <div className="fixed bottom-0 left-0 right-0 z-[999] bg-moody-950/95 backdrop-blur-sm border-t border-gold-600/20 px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse flex-shrink-0" />
            <span className="text-white/60 text-xs font-medium">
              <span className="text-gold-400 font-bold">Coming Soon</span> mod je uključen — posjetioci vide Coming Soon stranicu
            </span>
          </div>
          <Link
            to="/admin/settings"
            className="text-[10px] tracking-[0.25em] uppercase font-bold text-gold-400 hover:text-white transition-colors whitespace-nowrap border border-gold-600/30 px-3 py-1.5 rounded-sm hover:border-gold-400/60"
          >
            Isključi
          </Link>
        </div>
      </>
    );
  }

  // Regular visitor — show Coming Soon
  return <ComingSoon />;
}

function App() {
  React.useEffect(() => { loadSettings(); }, []); // Pre-warm settings cache

  return (
    <ErrorBoundary>
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <AnalyticsInjector />
          <ScrollToTop />
          <Routes>
            {/* Admin routes — own layout, no Navbar/Footer */}
            <Route
              path="/admin/login"
              element={
                <Suspense fallback={AdminLoadingFallback}>
                  <AdminLogin />
                </Suspense>
              }
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Suspense fallback={AdminLoadingFallback}>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/pages" element={<PagesManager />} />
                        <Route path="/images" element={<ImagesManager />} />
                        <Route path="/instagram" element={<InstagramManager />} />
                        <Route path="/gallery" element={<GalleryManager />} />
                        <Route path="/packages" element={<PackagesManager />} />
                        <Route path="/testimonials" element={<TestimonialsManager />} />
                        <Route path="/submissions" element={<Submissions />} />
                        <Route path="/settings" element={<AdminSettings />} />
                      </Routes>
                    </Suspense>
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* Public site routes */}
            <Route
              path="/*"
              element={
                <ComingSoonGate>
                <div className="relative min-h-screen bg-moody-950">
                  <div className="grain" />
                  <Navbar />
                  <main>
                    <Suspense fallback={PublicLoadingFallback}>
                      <Routes>
                        <Route path="/" element={
                          <>
                            <PageMetadata title="Home" description="Fine art wedding photography documenting love stories with a focus on raw emotion and timeless elegance." pageKey="home" />
                            <Home />
                          </>
                        } />
                        <Route path="/portfolio" element={
                          <>
                            <PageMetadata title="Portfolio" description="Explore our curated collection of wedding, engagement, and elopement stories." pageKey="portfolio" />
                            <Portfolio />
                          </>
                        } />
                        <Route path="/services" element={
                          <>
                            <PageMetadata title="Experience" description="Learn about our collaborative dialogue between high-end editorial fashion and raw emotion." pageKey="services" />
                            <Experience />
                          </>
                        } />
                        <Route path="/about" element={
                          <>
                            <PageMetadata title="About Us" description="Get to know Melisa and Aldin, the artists behind 387 Cinematic Weddings." pageKey="about" />
                            <About />
                          </>
                        } />
                        <Route path="/contact" element={
                          <>
                            <PageMetadata title="Inquire" description="Let's connect and start the dialogue about your wedding story." pageKey="contact" />
                            <Contact />
                          </>
                        } />
                        <Route path="*" element={
                          <>
                            <PageMetadata title="404 Not Found" description="The page you are looking for doesn't exist." pageKey="404" />
                            <NotFound />
                          </>
                        } />
                      </Routes>
                    </Suspense>
                  </main>
                  <Footer />
                  <BackToTop />
                </div>
                </ComingSoonGate>
              }
            />
          </Routes>
        </Router>
      </LanguageProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

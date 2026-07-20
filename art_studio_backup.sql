--
-- PostgreSQL database dump
--

\restrict jURLWrNAKmpgiy3wafgua4ThU8qt0UyRnwB2g3FmhfbjYlmhb3rzzIhFJk2OR2g

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: admin_users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_users_id_seq OWNED BY public.admin_users.id;


--
-- Name: contact_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_submissions (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    wedding_date character varying(100),
    location character varying(255),
    message text,
    status character varying(20) DEFAULT 'new'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT contact_submissions_status_check CHECK (((status)::text = ANY (ARRAY[('new'::character varying)::text, ('read'::character varying)::text, ('archived'::character varying)::text])))
);


--
-- Name: contact_submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contact_submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contact_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contact_submissions_id_seq OWNED BY public.contact_submissions.id;


--
-- Name: gallery_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gallery_images (
    id integer NOT NULL,
    url text NOT NULL,
    category character varying(50) NOT NULL,
    title character varying(255),
    location character varying(255),
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    layout character varying(20) DEFAULT 'TALL'::character varying,
    CONSTRAINT gallery_images_category_check CHECK (((category)::text = ANY (ARRAY[('WEDDINGS'::character varying)::text, ('STUDIO'::character varying)::text, ('PORTRAITS'::character varying)::text])))
);


--
-- Name: gallery_images_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gallery_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: gallery_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.gallery_images_id_seq OWNED BY public.gallery_images.id;


--
-- Name: packages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.packages (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    price character varying(100) NOT NULL,
    description text,
    features jsonb DEFAULT '[]'::jsonb,
    is_featured boolean DEFAULT false,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    name_color text,
    name_font_size text,
    name_en text,
    name_bs text,
    description_en text,
    description_bs text,
    features_en jsonb DEFAULT '[]'::jsonb,
    features_bs jsonb DEFAULT '[]'::jsonb,
    features_font_size text
);


--
-- Name: packages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.packages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: packages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.packages_id_seq OWNED BY public.packages.id;


--
-- Name: page_content; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_content (
    id integer NOT NULL,
    key character varying(200) NOT NULL,
    label character varying(200) NOT NULL,
    page character varying(50) NOT NULL,
    section character varying(100) NOT NULL,
    type character varying(20) DEFAULT 'text'::character varying,
    value_en text DEFAULT ''::text,
    value_bs text DEFAULT ''::text,
    sort_order integer DEFAULT 0,
    font_size text,
    font_family text,
    text_color text,
    CONSTRAINT page_content_type_check CHECK (((type)::text = ANY (ARRAY[('text'::character varying)::text, ('textarea'::character varying)::text])))
);


--
-- Name: page_content_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.page_content_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: page_content_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.page_content_id_seq OWNED BY public.page_content.id;


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_settings (
    key character varying(100) NOT NULL,
    value text
);


--
-- Name: testimonials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.testimonials (
    id integer NOT NULL,
    client_name character varying(255) NOT NULL,
    text text NOT NULL,
    location character varying(255),
    wedding_date character varying(100),
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: testimonials_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.testimonials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: testimonials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.testimonials_id_seq OWNED BY public.testimonials.id;


--
-- Name: admin_users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users ALTER COLUMN id SET DEFAULT nextval('public.admin_users_id_seq'::regclass);


--
-- Name: contact_submissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_submissions ALTER COLUMN id SET DEFAULT nextval('public.contact_submissions_id_seq'::regclass);


--
-- Name: gallery_images id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_images ALTER COLUMN id SET DEFAULT nextval('public.gallery_images_id_seq'::regclass);


--
-- Name: packages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.packages ALTER COLUMN id SET DEFAULT nextval('public.packages_id_seq'::regclass);


--
-- Name: page_content id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_content ALTER COLUMN id SET DEFAULT nextval('public.page_content_id_seq'::regclass);


--
-- Name: testimonials id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials ALTER COLUMN id SET DEFAULT nextval('public.testimonials_id_seq'::regclass);


--
-- Data for Name: gallery_images; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.gallery_images (id, url, category, title, location, sort_order, is_active, created_at, layout) FROM stdin;
1	/uploads/1776334300917-249303028.jpg	WEDDINGS	SLIKA GRMI	sarajevo	2	t	2026-04-16 12:11:54.729223+02	TALL
2	/uploads/1776334407125-2729021.jpg	WEDDINGS	SVI	SARAJEVO	0	t	2026-04-16 12:13:35.613908+02	TALL
3	/uploads/1776334424967-464666469.jpg	WEDDINGS	sarajevo	2024	0	t	2026-04-16 12:13:52.909893+02	TALL
4	/uploads/1776334449124-871625741.jpg	WEDDINGS	Sarajevo	Sarajevo	3	t	2026-04-16 12:14:11.837884+02	TALL
5	/uploads/1776334538418-441130490.jpg	WEDDINGS	\N	\N	0	t	2026-04-16 12:15:40.332688+02	TALL
6	/uploads/1776334550038-477855330.jpg	WEDDINGS	\N	\N	0	t	2026-04-16 12:15:52.941345+02	TALL
7	/uploads/1776334561553-204571276.jpg	WEDDINGS	\N	\N	0	t	2026-04-16 12:16:03.377058+02	TALL
8	/uploads/1776334590141-681017623.jpg	WEDDINGS	23	334	5	t	2026-04-16 12:16:37.358743+02	TALL
9	/uploads/1776334650115-181557382.jpg	WEDDINGS	\N	\N	0	t	2026-04-16 12:17:31.210695+02	TALL
10	/uploads/1776334661893-403618324.jpg	WEDDINGS	\N	\N	0	t	2026-04-16 12:17:43.493933+02	TALL
11	/uploads/1776334670836-45563729.jpg	WEDDINGS	\N	\N	0	t	2026-04-16 12:17:52.062031+02	TALL
12	/uploads/1776334752604-674147696.jpg	WEDDINGS	\N	\N	0	t	2026-04-16 12:19:13.702178+02	TALL
13	/uploads/1776334761239-868513641.png	WEDDINGS	\N	\N	0	t	2026-04-16 12:19:23.444128+02	TALL
14	/uploads/1776334776338-21156248.jpg	WEDDINGS	\N	\N	0	t	2026-04-16 12:19:38.12859+02	TALL
15	/uploads/1776334785091-891221076.jpg	WEDDINGS	\N	\N	0	t	2026-04-16 12:19:45.953911+02	TALL
16	/uploads/1776335166571-649601612.jpg	WEDDINGS	\N	\N	1	t	2026-04-16 12:26:07.327251+02	TALL
17	/uploads/1776335179278-132022308.jpg	WEDDINGS	\N	\N	1	t	2026-04-16 12:26:20.228072+02	TALL
18	/uploads/1776339885623-697052870.jpg	WEDDINGS	\N	\N	0	t	2026-04-16 13:44:50.317232+02	TALL
19	/uploads/1776340051779-151502288.jpg	WEDDINGS	\N	\N	0	t	2026-04-16 13:47:34.960129+02	TALL
20	/uploads/1776340077164-506625543.jpg	WEDDINGS	\N	\N	0	t	2026-04-16 13:47:57.917989+02	TALL
21	/uploads/1776340083655-446162919.jpg	WEDDINGS	\N	\N	0	t	2026-04-16 13:48:04.74459+02	TALL
22	/uploads/1776340088860-755694890.jpg	WEDDINGS	\N	\N	0	t	2026-04-16 13:48:10.029152+02	TALL
\.


--
-- Data for Name: packages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.packages (id, name, price, description, features, is_featured, is_active, sort_order, name_color, name_font_size, name_en, name_bs, description_en, description_bs, features_en, features_bs, features_font_size) FROM stdin;
1	PAKET1	2000	POPIS	[]	t	t	0	\N	\N	\N	PAKET1	\N	POPIS	[]	[]	\N
2	sdfs	423423423	dsf	[]	t	t	0	\N	\N	\N	sdfs	\N	dsf	[]	[]	\N
\.


--
-- Data for Name: page_content; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.page_content (id, key, label, page, section, type, value_en, value_bs, sort_order, font_size, font_family, text_color) FROM stdin;
1	hero.title.part1	Naslov: 1. linija	home	hero	text	Art in the	Umjetnost u	0	\N	\N	\N
2	hero.title.part2	Naslov: 2. linija (kurziv)	home	hero	text	Moments	Trenucima	1	\N	\N	\N
3	hero.location	Lokacija tagline	home	hero	text	BASED IN SARAJEVO — TRAVELING WORLDWIDE	SARAJEVO — PUTUJEMO ŠIROM SVIJETA	2	\N	\N	\N
4	hero.inquire	Gumb: Upit	home	hero	text	Inquire Now	Pošaljite Upit	3	\N	\N	\N
5	hero.portfolio	Gumb: Portfolio	home	hero	text	View Portfolio	Pogledajte Portfolio	4	\N	\N	\N
6	home.intro.tag	Tag	home	intro	text	The Art of Storytelling	Umjetnost pripovijedanja	0	\N	\N	\N
7	home.intro.title.part1	Naslov: dio 1	home	intro	text	Fine-art,	Fine-art,	1	\N	\N	\N
8	home.intro.title.part2	Naslov: dio 2 (kurziv)	home	intro	text	Editorial	Editorijalna	2	\N	\N	\N
9	home.intro.title.part3	Naslov: dio 3	home	intro	text	Wedding Photography	Vjenčana Fotografija	3	\N	\N	\N
10	home.intro.desc	Opis	home	intro	textarea	Our approach is rooted in the belief that every wedding is a unique masterpiece. We blend editorial sophistication with documentary honesty to capture the quiet grandeur and fleeting magic of your most significant day.	Naš pristup temelji se na uvjerenju da je svako vjenčanje jedinstveno remek-djelo. Spajamo editorijalnu sofisticiranost s dokumentarnom iskrenošću kako bismo zabilježili tihu raskoš i prolaznu magiju vašeg najznačajnijeg dana.	4	\N	\N	\N
11	home.process.01.title	Korak 1: Naslov	home	process	text	We begin with your vision	Počinjemo s vašom vizijom	0	\N	\N	\N
12	home.process.01.tag	Korak 1: Tag	home	process	text	And our artistic style	I našim umjetničkim stilom	1	\N	\N	\N
13	home.process.01.desc	Korak 1: Opis	home	process	textarea	If you have ideas or specific requests, please let us know. The pre-wedding shoot is a big collaboration — whilst we are happy to direct, we also love working with couples to create truly remarkable images.	Ako imate ideje ili specifične zahtjeve, slobodno nam javite. Fotografisanje prije vjenčanja je velika saradnja — rado usmjeravamo, ali volimo i raditi s parovima na stvaranju izvanrednih slika.	2	\N	\N	\N
14	home.process.02.title	Korak 2: Naslov	home	process	text	You choose the location	Vi birate lokaciju	3	\N	\N	\N
15	home.process.02.tag	Korak 2: Tag	home	process	text	We document the moments	Mi dokumentujemo trenutke	4	\N	\N	\N
16	home.process.02.desc	Korak 2: Opis	home	process	textarea	Often it's possible to shoot in the city and the countryside to get beautiful variation. We handle all logistics and transport, so you can focus entirely on being present.	Često je moguće obaviti fotografisanje u gradu i na selu kako bismo dobili lijepu varijaciju. Brinemo o svoj logistici i prevozu kako biste se mogli potpuno posvetiti trenutku.	5	\N	\N	\N
17	home.process.03.title	Korak 3: Naslov	home	process	text	We create art that lasts a lifetime	Zajedno stvaramo umjetnost koja traje vječno	6	\N	\N	\N
18	home.process.03.tag	Korak 3: Tag	home	process	text	Heirloom images for generations	Naslijedne slike za generacije	7	\N	\N	\N
19	home.process.03.desc	Korak 3: Opis	home	process	textarea	Our shoots are relaxed and filled with laughter — there are never any stiff poses. Just beautiful, natural moments and genuine connection. We often explore different locations and many couples choose to bring a change of outfit.	Naša fotografisanja su opuštena i puna smijeha — nikada nema ukočenih poza. Samo lijepi, prirodni trenuci i iskrena veza. Često istražujemo različite lokacije, a mnogi parovi biraju i promjenu odjeće.	8	\N	\N	\N
20	home.process.03.cta	Korak 3: CTA gumb	home	process	text	Let's Connect	Povežimo se	9	\N	\N	\N
21	about.hero.title	Hero: Naslov	about	hero	text	About Us	O Nama	0	\N	\N	\N
22	about.hero.subtitle	Hero: Podnaslov	about	hero	text	The Artists Behind the Lens	Umjetnici iza objektiva	1	\N	\N	\N
27	experience.hero.title	Hero: Naslov	services	hero	text	Experience	Iskustvo	0	\N	\N	\N
28	experience.hero.subtitle	Hero: Podnaslov	services	hero	text	The Art of Cinematic Documentation	Umjetnost filmskog dokumentovanja	1	\N	\N	\N
29	experience.intro.tag	Uvod: Tag	services	intro	text	The Experience	Iskustvo	0	\N	\N	\N
30	experience.intro.title.part1	Uvod: Naslov dio 1	services	intro	text	More than just	Više od	1	\N	\N	\N
31	experience.intro.title.part2	Uvod: Naslov dio 2 (kurziv)	services	intro	text	vendors.	dobavljača.	2	\N	\N	\N
32	experience.intro.desc	Uvod: Opis	services	intro	textarea	When you hire us, you aren't just getting "vendors." You are getting a team that works as one. We've spent years refining our silent language, knowing exactly where the other is and what they are seeing.	Kada nas angažujete, ne dobijate samo "dobavljače". Dobijate tim koji radi kao jedno. Proveli smo godine usavršavajući naš tihi jezik, znajući tačno gdje je drugi i što vidi.	3	\N	\N	\N
33	experience.benefit.tag	Korist: Tag	services	philosophy	text	The Benefit	Korist	0	\N	\N	\N
34	experience.benefit.desc	Korist: Opis	services	philosophy	textarea	While one of us focuses on the grand, epic "hero" shot, the other is hunting for the quiet, emotional detail — the way your hand shakes, the tear your father wipes away, or the wild energy on the dance floor.	Dok se jedan od nas fokusira na veliki, epski kadar, drugi traži tihi, emocionalni detalj — način na koji vam ruka drhti, suzu koju vaš otac briše ili divlju energiju na plesnom podiju.	1	\N	\N	\N
35	experience.result.tag	Rezultat: Tag	services	philosophy	text	The Result	Rezultat	2	\N	\N	\N
72	about.experience.title	Iskustvo: Naslov	about	experience	text	How We Work	Kako Radimo	1	\N	\N	\N
36	experience.result.desc	Rezultat: Opis	services	philosophy	textarea	Your photos and your film will feel like they belong together. The same colors, the same mood, and the same soul. A cohesive visual legacy that tells your story from every angle.	Vaše fotografije i vaš film će izgledati kao da idu zajedno. Iste boje, isto raspoloženje i ista duša. Kohezivno vizualno naslijeđe koje priča vašu priču iz svakog kuta.	3	\N	\N	\N
37	experience.philosophy	Filozofija: Citat	services	philosophy	textarea	"We believe that the most powerful images aren't staged; they are felt."	"Vjerujemo da najmoćnije slike nisu postavljene; one se osjećaju."	4	\N	\N	\N
38	experience.investment.tag	Investicija: Tag	services	investment	text	Investment	Investicija	0	\N	\N	\N
39	experience.investment.title	Investicija: Naslov	services	investment	text	Curated Collections	Odabrane Kolekcije	1	\N	\N	\N
40	experience.investment.availability	Dostupnost (obavijest)	services	investment	text	Limited Availability for 2026 Weddings	Ograničena dostupnost za vjenčanja 2026.	2	\N	\N	\N
43	experience.faq.1.q	Pitanje 1	services	faq	text	How would you describe your artistic approach on the wedding day?	Kako biste opisali vaš artistički pristup na dan vjenčanja?	0	\N	\N	\N
44	experience.faq.1.a	Odgovor 1	services	faq	textarea	We describe our style as cinematic and editorial. We find the perfect balance between being discreet observers — capturing those raw, unscripted emotions — and providing intentional, high-end direction during portraits. Our goal is to make you feel like yourselves, never like you are performing for the camera.	Naš stil opisujemo kao kinematski i editorijalni. Nalazimo savršenu ravnotežu između diskretnih promatrača i pružanja namjerne, vrhunske direkcije tokom portreta. Naš cilj je da se osjećate kao vi sami.	1	\N	\N	\N
45	experience.faq.2.q	Pitanje 2	services	faq	text	How many artists will be present at our wedding?	Koliko umjetnika će biti prisutno na našem vjenčanju?	2	\N	\N	\N
46	experience.faq.2.a	Odgovor 2	services	faq	textarea	You will always have two dedicated artists with you. As a husband-and-wife team, we move in unison to ensure no moment is missed. This dual perspective allows us to capture the grand architecture of the ceremony while simultaneously focusing on the quiet, whispered details and guest reactions.	Uvijek ćete imati dva posvećena umjetnika uz vas. Kao tim muža i žene, krećemo se unisono kako bismo osigurali da nijedan trenutak ne bude propušten.	3	\N	\N	\N
47	experience.faq.3.q	Pitanje 3	services	faq	text	When can we expect to see our final wedding gallery?	Kada možemo očekivati finalnu galeriju vjenčanja?	4	\N	\N	\N
48	experience.faq.3.a	Odgovor 3	services	faq	textarea	Quality and artistry take time, but we know you are eager to relive the magic. You will receive a curated "sneak peek" collection within 48 hours of your wedding. Your complete portfolio will be delivered in approximately 6 to 8 weeks.	Kvaliteta i umjetnost zahtijevaju vrijeme. U roku od 48 sati primit ćete "sneak peek" kolekciju, a kompletni portfolio za otprilike 6 do 8 sedmica.	5	\N	\N	\N
49	experience.faq.4.q	Pitanje 4	services	faq	text	Do you offer travel for destination weddings?	Nudite li putovanje za destinacijska vjenčanja?	6	\N	\N	\N
50	experience.faq.4.a	Odgovor 4	services	faq	textarea	Absolutely. We are driven by unique stories and beautiful landscapes, and we are available for travel worldwide. We handle all our own travel logistics to ensure a seamless experience for you.	Apsolutno. Pokreću nas jedinstvene priče i lijepi krajolici, dostupni smo za putovanje širom svijeta i brinemo o svim putnim logistikama.	7	\N	\N	\N
51	portfolio.hero.title	Hero: Naslov	portfolio	hero	text	Work	Radovi	0	\N	\N	\N
52	portfolio.hero.subtitle	Hero: Podnaslov	portfolio	hero	text	A Visual Legacy	Vizuelno Naslijeđe	1	\N	\N	\N
53	portfolio.approach.title	Pristup: Tag	portfolio	approach	text	The Approach	Pristup	0	\N	\N	\N
54	portfolio.approach.heading	Pristup: Naslov	portfolio	approach	text	Preserving every	Čuvamo svako	1	\N	\N	\N
55	portfolio.approach.subheading	Pristup: Podnaslov	portfolio	approach	text	chapter of your story.	poglavlje vaše priče.	2	\N	\N	\N
56	portfolio.approach.desc	Pristup: Opis	portfolio	approach	textarea	From the quiet anticipation of the morning to the wild energy of the dance floor, we document the moments that define your celebration. Every detail, no matter how small, is a vital part of the visual legacy we create together — a timeless reminder of the love and joy that filled your day.	Od tihog iščekivanja jutra do divlje energije plesnog podija, dokumentujemo trenutke koji definišu vašu proslavu. Svaki detalj je vitalni dio vizuelnog naslijeđa koje stvaramo zajedno.	3	\N	\N	\N
57	contact.hero.title	Hero: Naslov	contact	hero	text	Inquire	Upit	0	\N	\N	\N
58	contact.hero.subtitle	Hero: Podnaslov	contact	hero	text	Let's create something timeless together	Stvorimo nešto bezvremensko zajedno	1	\N	\N	\N
63	home.testimonials.tag	Testimonials: Tag	home	testimonials	text	Kind Words	Lijepe Riječi	0	\N	\N	\N
64	home.testimonials.title	Testimonials: Naslov	home	testimonials	text	From Our Couples	Od Naših Parova	1	\N	\N	\N
65	home.fallback.quote	Fallback citat	home	testimonials	textarea	Every couple has a rhythm; every wedding has a pulse. Our mission is to find the quiet, cinematic moments that define your unique narrative.	Svaki par ima ritam; svako vjenčanje ima puls. Naša misija je pronaći tihe, kinematske trenutke koji definišu vaš jedinstveni narativ.	2	\N	\N	\N
66	home.explore	Gumb: Istraži portfolio	home	intro	text	Explore the Portfolio	Istražite Portfolio	5	\N	\N	\N
71	about.experience.tag	Iskustvo: Tag	about	experience	text	The Experience	Iskustvo	0	\N	\N	\N
67	home.about.title	O nama: Naslov (O / About)	home	about_section	text	About	O	0	\N	\N	\N
59	contact.connect.tag	Kontakt: Tag	contact	connect	text	Inquiries	Upiti	0	\N	\N	\N
60	contact.connect.title.part1	Kontakt: Naslov dio 1	contact	connect	text	Let's	Započnimo	1	\N	\N	\N
61	contact.connect.title.part2	Kontakt: Naslov dio 2 (kurziv)	contact	connect	text	Connect	Dijalog	2	\N	\N	\N
73	about.step.1.title	Korak 1: Naslov	about	experience	text	Consultation & Planning	Konsultacije i planiranje	2	\N	\N	\N
74	about.step.1.desc	Korak 1: Opis	about	experience	textarea	We begin with a conversation to align our vision. Together, we'll plan the story, location, and scenography to ensure every detail is intentional.	Počinjemo razgovorom kako bismo uskladili našu viziju. Zajedno ćemo planirati priču, lokaciju i scenografiju kako bismo osigurali da svaki detalj bude namjeran.	3	\N	\N	\N
75	about.step.2.title	Korak 2: Naslov	about	experience	text	Preparation & Guidance	Priprema i vođenje	4	\N	\N	\N
76	about.step.2.desc	Korak 2: Opis	about	experience	textarea	Receive a curated guide on posing and styling. We provide the advice you need to feel relaxed, confident, and ready for the camera.	Dobijte kurirani vodič o poziranju i stilizovanju. Pružamo savjete koji su vam potrebni da se osjećate opušteno, samouvjereno i spremno za kameru.	5	\N	\N	\N
77	about.step.3.title	Korak 3: Naslov	about	experience	text	The Shoot & Experience	Snimanje i iskustvo	6	\N	\N	\N
78	about.step.3.desc	Korak 3: Opis	about	experience	textarea	On the day of the shoot, we bring the magic to life. We handle the logistics — including transportation to the location — so you can focus entirely on the moment.	Na dan snimanja, oživljavamo magiju. Mi brinemo o logistici — uključujući prevoz do lokacije — tako da se možete u potpunosti fokusirati na trenutak.	7	\N	\N	\N
79	about.step.4.title	Korak 4: Naslov	about	experience	text	Post-Production	Postprodukcija	8	\N	\N	\N
80	about.step.4.desc	Korak 4: Opis	about	experience	textarea	Every chosen frame undergoes a meticulous editing process to ensure a timeless aesthetic. Your final gallery is delivered via a private digital space.	Svaki odabrani kadar prolazi kroz pedantan proces uređivanja kako bi se osigurala bezvremenska estetika. Vaša finalna galerija se dostavlja putem privatnog digitalnog prostora.	9	\N	\N	\N
84	portfolio.empty	Prazna kategorija	portfolio	approach	text	No images in this category	Nema slika u ovoj kategoriji	10	\N	\N	\N
85	portfolio.ready	CTA: Linija 1	portfolio	cta	text	Ready to start	Spremni da započnete	0	\N	\N	\N
86	portfolio.dialogue	CTA: Linija 2	portfolio	cta	text	the dialogue?	dijalog?	1	\N	\N	\N
105	experience.journey.tag	Putovanje: Tag	services	journey	text	The Journey	Putovanje	0	\N	\N	\N
106	experience.journey.title	Putovanje: Naslov	services	journey	text	How we work with you	Kako radimo s vama	1	\N	\N	\N
107	experience.journey.step.1.title	Korak 1: Naslov	services	journey	text	Consultation & Planning	Konsultacije i planiranje	2	\N	\N	\N
108	experience.journey.step.1.desc	Korak 1: Opis	services	journey	textarea	We begin with a conversation to align our vision. Together, we'll plan the story, location, and scenography to ensure every detail is intentional.	Počinjemo razgovorom kako bismo uskladili našu viziju.	3	\N	\N	\N
109	experience.journey.step.2.title	Korak 2: Naslov	services	journey	text	Preparation & Guidance	Priprema i vođenje	4	\N	\N	\N
110	experience.journey.step.2.desc	Korak 2: Opis	services	journey	textarea	Receive a curated guide on posing and styling. We provide the advice you need to feel relaxed, confident, and ready for the camera.	Dobijte kurirani vodič o poziranju i stilizovanju.	5	\N	\N	\N
111	experience.journey.step.3.title	Korak 3: Naslov	services	journey	text	The Shoot & Experience	Snimanje i iskustvo	6	\N	\N	\N
112	experience.journey.step.3.desc	Korak 3: Opis	services	journey	textarea	On the day of the shoot, we bring the magic to life. We handle the logistics so you can focus entirely on the moment.	Na dan snimanja, oživljavamo magiju. Mi brinemo o logistici.	7	\N	\N	\N
113	experience.journey.step.4.title	Korak 4: Naslov	services	journey	text	Post-Production	Postprodukcija	8	\N	\N	\N
114	experience.journey.step.4.desc	Korak 4: Opis	services	journey	textarea	Every chosen frame undergoes a meticulous editing process to ensure a timeless aesthetic. Your final gallery is delivered via a private digital space.	Svaki odabrani kadar prolazi kroz pedantan proces uređivanja.	9	\N	\N	\N
115	experience.addons.1.title	Addon 1: Naslov	services	addons	text	A Personal Narrative	Lična Naracija	0	\N	\N	\N
116	experience.addons.1.desc	Addon 1: Opis	services	addons	textarea	Two dedicated artists (Photography & Filmmaking) capturing your day from complementary perspectives.	Dva posvećena umjetnika (Fotografija i Film) koji bilježe vaš dan iz komplementarnih perspektiva.	1	\N	\N	\N
87	contact.email.tag	Email oznaka	contact	connect	text	Email Us	Pišite nam	5	\N	\N	\N
88	contact.follow.tag	Follow oznaka	contact	connect	text	Follow	Pratite nas	6	\N	\N	\N
89	contact.form.name	Forma: Naziv polja Ime	contact	form	text	Your Name	Vaše Ime	0	\N	\N	\N
90	contact.form.name.placeholder	Forma: Placeholder Ime	contact	form	text	John & Jane	Ime i Prezime	1	\N	\N	\N
91	contact.form.email	Forma: Naziv polja Email	contact	form	text	Email Address	Email Adresa	2	\N	\N	\N
117	experience.addons.2.title	Addon 2: Naslov	services	addons	text	The Blueprint	Plan	2	\N	\N	\N
118	experience.addons.2.desc	Addon 2: Opis	services	addons	textarea	A pre-wedding creative consultation to discuss scenography, lighting, and the flow of your story.	Kreativna konsultacija prije vjenčanja za diskusiju o scenografiji, osvjetljenju i toku vaše priče.	3	\N	\N	\N
119	experience.addons.3.title	Addon 3: Naslov	services	addons	text	The Experience	Iskustvo	4	\N	\N	\N
120	experience.addons.3.desc	Addon 3: Opis	services	addons	textarea	We handle the details — from location scouting to seamless coordination — so you can remain fully present in the moment.	Brinemo o detaljima — od izviđanja lokacije do besprijekorne koordinacije.	5	\N	\N	\N
121	experience.addons.4.title	Addon 4: Naslov	services	addons	text	The Travel	Putovanje	6	\N	\N	\N
122	experience.addons.4.desc	Addon 4: Opis	services	addons	textarea	Seamless logistics for all local and destination locations, allowing us to follow your story wherever it leads.	Besprijekorna logistika za sve lokalne i destinacijske lokacije.	7	\N	\N	\N
23	about.title	Priča: Glavni naslov	about	story	text	Hi, we are Melisa & Aldin.	Zdravo, mi smo Melisa i Aldin.	0	\N	\N	\N
24	about.desc.1	Priča: Paragraf 1	about	story	textarea	Partners in life and lens. As photographers and filmmakers — and husband and wife — our work is a dialogue between editorial fashion and the moving image. Inspired by emotion, we take an intentional approach to your narrative.	Partneri u životu i iza objektiva. Kao fotografi i filmaši — i muž i žena — naš rad je dijalog između editorijalne mode i pokretne slike. Inspirisani emocijama, pristupamo vašoj priči s namjerom.	1	\N	\N	\N
25	about.desc.2	Priča: Paragraf 2	about	story	textarea	Just a bunch of ordinary people utterly in love with creating images of love for the past 8 years. And the next images we create could be of your love.	Samo dvoje zaljubljenih u stvaranje slika ljubavi proteklih 8 godina. Sljedeće slike koje stvorimo mogle bi biti vaše.	2	\N	\N	\N
26	about.desc.3	Priča: Paragraf 3 (citat)	about	story	textarea	We spend our days at other people's weddings cracking half-witty jokes and trying to capture the quiet grandeur of love. We don't just capture moments; we craft elevated imagery that resonates with the soul of your unique journey.	Provodimo dane na vjenčanjima zbijajući šale i pokušavajući uhvatiti tihu raskoš ljubavi. Mi ne bilježimo samo trenutke; mi stvaramo uzvišene slike koje rezonuju s dušom vašeg jedinstvenog putovanja.	3	\N	\N	\N
70	about.artists	Oznaka: Umjetnici	about	story	text	The Artists	Umjetnici	10	\N	\N	\N
81	stories.ready	CTA: Linija 1	about	cta	text	Ready to tell	Spremni da ispričate	0	\N	\N	\N
82	stories.yourOwn	CTA: Linija 2	about	cta	text	your own?	svoju priču?	1	\N	\N	\N
83	stories.start	CTA: Gumb	about	cta	text	Start the Dialogue	Započnite Dijalog	2	\N	\N	\N
68	home.about.and	O nama: Veznik (and / i)	home	about_section	text	and	i	1	\N	\N	\N
69	home.about.cta	O nama: CTA gumb	home	about_section	text	Get to know us	Upoznajte nas	2	\N	\N	\N
62	contact.response.note	Napomena o odgovoru	contact	connect	textarea	We typically respond within 24-48 hours. If you haven't heard from us, please check your spam folder or reach out via Instagram.	Obično odgovaramo u roku od 4-8 sati. \nAko niste dobili odgovor, provjerite spam ili nam pišite na Instagram. 	3	\N	\N	\N
93	contact.form.date.placeholder	Forma: Placeholder Datum	contact	form	text	DD/MM/YYYY	DD/MM/YYYY	4	\N	\N	\N
92	contact.form.date	Forma: Naziv polja Datum	contact	form	text	Wedding Date	Datum Vjenčanja	3	\N	\N	\N
94	contact.form.location	Forma: Naziv polja Lokacija	contact	form	text	Location	Lokacija	5	\N	\N	\N
95	contact.form.location.placeholder	Forma: Placeholder Lokacija	contact	form	text	Sarajevo, BIH	Sarajevo, BIH	6	\N	\N	\N
96	contact.form.story	Forma: Naziv polja Priča	contact	form	text	Your Story	Vaša Priča	7	\N	\N	\N
97	contact.form.story.placeholder	Forma: Placeholder Priča	contact	form	textarea	Tell us about your vision...	Ispričajte nam o svojoj viziji...	8	\N	\N	\N
98	contact.form.submit	Forma: Gumb Pošalji	contact	form	text	Send Inquiry	Pošalji Upit	9	\N	\N	\N
99	contact.form.sending	Forma: Slanje u toku	contact	form	text	Sending...	Slanje...	10	\N	\N	\N
100	contact.form.close	Forma: Zatvori modal	contact	form	text	Close Window	Zatvori	11	\N	\N	\N
101	contact.form.success.title	Uspjeh: Naslov	contact	form	text	Thank You	Hvala Vam	12	\N	\N	\N
103	contact.form.success.another	Uspjeh: Pošalji još jednu	contact	form	text	Send Another Message	Pošalji Novu Poruku	14	\N	\N	\N
102	contact.form.success.desc	Uspjeh: Opis	contact	form	textarea	Your message has been received. We look forward to hearing more about your story.	Vaša poruka je primljena. Veselimo se što ćemo čuti više o vašoj priči.	13	\N	\N	\N
104	contact.form.error	Greška: Poruka	contact	form	text	Something went wrong. Please try again later.	Nešto je pošlo po krivu. Molimo pokušajte ponovo.	15	\N	\N	\N
128	about.step.1.num	Korak 1: Broj (npr. 01)	about	experience	text	01	01	2	\N	\N	\N
131	about.step.1.icon	Korak 1: Ikona (chat/star/camera/image/heart/film)	about	experience	text	chat	chat	5	\N	\N	\N
132	about.step.2.num	Korak 2: Broj (npr. 02)	about	experience	text	02	02	6	\N	\N	\N
135	about.step.2.icon	Korak 2: Ikona (chat/star/camera/image/heart/film)	about	experience	text	star	star	9	\N	\N	\N
136	about.step.3.num	Korak 3: Broj (npr. 03)	about	experience	text	03	03	10	\N	\N	\N
139	about.step.3.icon	Korak 3: Ikona (chat/star/camera/image/heart/film)	about	experience	text	camera	camera	13	\N	\N	\N
140	about.step.4.num	Korak 4: Broj (npr. 04)	about	experience	text	04	04	14	\N	\N	\N
143	about.step.4.icon	Korak 4: Ikona (chat/star/camera/image/heart/film)	about	experience	text	image	image	17	\N	\N	\N
149	experience.journey.step.1.num	Korak 1: Broj (npr. 01)	services	journey	text	01	01	2	\N	\N	\N
152	experience.journey.step.1.icon	Korak 1: Ikona (chat/star/camera/image/heart/film)	services	journey	text	chat	chat	5	\N	\N	\N
153	experience.journey.step.2.num	Korak 2: Broj (npr. 02)	services	journey	text	02	02	6	\N	\N	\N
156	experience.journey.step.2.icon	Korak 2: Ikona (chat/star/camera/image/heart/film)	services	journey	text	star	star	9	\N	\N	\N
157	experience.journey.step.3.num	Korak 3: Broj (npr. 03)	services	journey	text	03	03	10	\N	\N	\N
160	experience.journey.step.3.icon	Korak 3: Ikona (chat/star/camera/image/heart/film)	services	journey	text	camera	camera	13	\N	\N	\N
161	experience.journey.step.4.num	Korak 4: Broj (npr. 04)	services	journey	text	04	04	14	\N	\N	\N
164	experience.journey.step.4.icon	Korak 4: Ikona (chat/star/camera/image/heart/film)	services	journey	text	image	image	17	\N	\N	\N
165	experience.addons.tag	Podrška: Tag oznaka	services	addons	text	Our Support	Naša podrška	0	\N	\N	\N
166	experience.addons.title.part1	Podrška: Naslov linija 1	services	addons	text	Here for you	Tu smo za vas	1	\N	\N	\N
167	experience.addons.title.part2	Podrška: Naslov linija 2 (kurziv)	services	addons	text	every step.	na svakom koraku.	2	\N	\N	\N
170	experience.addons.1.icon	Podrška 1: Ikona (camera/map/sparkles/globe/heart/film)	services	addons	text	camera	camera	5	\N	\N	\N
173	experience.addons.2.icon	Podrška 2: Ikona (camera/map/sparkles/globe/heart/film)	services	addons	text	map	map	8	\N	\N	\N
176	experience.addons.3.icon	Podrška 3: Ikona (camera/map/sparkles/globe/heart/film)	services	addons	text	sparkles	sparkles	11	\N	\N	\N
179	experience.addons.4.icon	Podrška 4: Ikona (camera/map/sparkles/globe/heart/film)	services	addons	text	globe	globe	14	\N	\N	\N
180	experience.faq.title	FAQ: Naslov sekcije	services	faq	text	Frequently Asked Questions	Česta pitanja	0	\N	\N	\N
181	experience.cta.title.part1	CTA: Naslov linija 1	services	cta	text	Ready to start	Započnite dijalog	0	\N	\N	\N
182	experience.cta.title.part2	CTA: Naslov linija 2 (kurziv)	services	cta	text	the dialogue?	sa vašom pričom.	1	\N	\N	\N
183	experience.cta.button	CTA: Tekst gumba	services	cta	text	Pošaljite upit	Pošaljite upit	2	\N	\N	\N
184	experience.package.collection	Paketi: "Kolekcija" tekst	services	investment	text	Collection	Kolekcija	3	\N	\N	\N
185	experience.package.popular	Paketi: "Popularno" badge	services	investment	text	Most popular	Najpopularnije	4	\N	\N	\N
186	experience.package.inquire	Paketi: Gumb "Inquire"	services	investment	text	Inquire	Pošaljite upit	5	\N	\N	\N
187	experience.package.starting_at	Paketi: "Starting at" / "Počinje od"	services	investment	text	Starting at	Počinje od	6	\N	\N	\N
188	experience.promo.cta	Promocija: Tekst gumba	services	promo	text	Send Inquiry	Pošaljite Upit	2	\N	\N	\N
189	portfolio.filter.all	Filter: Sve	portfolio	filter	text	ALL	SVE	0	\N	\N	\N
190	portfolio.filter.weddings	Filter: Vjenčanja	portfolio	filter	text	WEDDINGS	VJENČANJA	1	\N	\N	\N
191	portfolio.filter.studio	Filter: Studio	portfolio	filter	text	STUDIO	STUDIO	2	\N	\N	\N
192	portfolio.filter.portraits	Filter: Portreti	portfolio	filter	text	PORTRAITS	PORTRETI	3	\N	\N	\N
196	portfolio.cta.button	CTA: Tekst gumba	portfolio	cta	text	Inquire Now	Pošaljite upit	2	\N	\N	\N
198	home.scroll	Hero: Scroll indicator tekst	home	hero	text	Scroll to explore	Skrolaj za više	10	\N	\N	\N
199	home.process.01.num	Proces: Broj koraka 01	home	process	text	01.	01.	10	\N	\N	\N
200	home.process.01.icon	Proces: Ikona 01 (sparkles/camera/heart/star/film/users)	home	process	text	sparkles	sparkles	11	\N	\N	\N
201	home.process.02.num	Proces: Broj koraka 02	home	process	text	02.	02.	20	\N	\N	\N
202	home.process.02.icon	Proces: Ikona 02 (sparkles/camera/heart/star/film/users)	home	process	text	mappin	mappin	21	\N	\N	\N
203	home.process.03.num	Proces: Broj koraka 03	home	process	text	03.	03.	30	\N	\N	\N
204	home.process.03.icon	Proces: Ikona 03 (sparkles/camera/heart/star/film/users)	home	process	text	heart	heart	31	\N	\N	\N
210	home.about.desc.1	O nama: Paragraf 1	home	about_section	text	We are wedding photographers based in Bosnia, capturing love stories across the Balkans and beyond.	Mi smo vjenčani fotografski tim iz Bosne, bilježimo priče ljubavi diljem Balkana i dalje.	2	\N	\N	\N
211	home.about.desc.2	O nama: Paragraf 2	home	about_section	text	With a cinematic eye and a documentary heart, we turn fleeting moments into timeless imagery.	Kinematskim okom i dokumentarnim srcem pretvaramo prolazne trenutke u vječne slike.	3	\N	\N	\N
212	home.about.desc.3	O nama: Paragraf 3	home	about_section	text	Every frame is intentional. Every story is unique.	Svaki kadar je namjeran. Svaka priča je jedinstvena.	4	\N	\N	\N
213	footer.tagline	Footer: Tagline tekst	footer	brand	textarea	Fine art wedding photography documenting love stories with a focus on raw emotion and timeless elegance.	Fine-art vjenčana fotografija koja dokumentuje ljubavne priče s fokusom na sirovu emociju i bezvremensku eleganciju.	0	\N	\N	\N
214	footer.navigation	Footer: Naslov navigacije	footer	nav	text	Navigation	Navigacija	0	\N	\N	\N
215	footer.rights	Footer: Copyright tekst	footer	legal	text	All rights reserved.	Sva prava zadržana.	0	\N	\N	\N
216	footer.designed	Footer: "Dizajnirano..." tekst	footer	legal	text	Designed with intention.	Dizajnirano s namjerom.	1	\N	\N	\N
217	nav.work	Navigacija: Link "Radovi"	footer	nav	text	Work	Radovi	1	\N	\N	\N
218	nav.experience	Navigacija: Link "Iskustvo"	footer	nav	text	Experience	Iskustvo	2	\N	\N	\N
219	nav.stories	Navigacija: Link "O nama"	footer	nav	text	About Us	O nama	3	\N	\N	\N
220	nav.inquire	Navigacija: Link "Upit"	footer	nav	text	Inquire	Upit	4	\N	\N	\N
41	experience.promo.tag	Promo: Tag	services	promo	text	Custom Package	Prilagođeni paket	0	\N	\N	\N
42	experience.promo.desc	Promo: Opis	services	promo	textarea	Custom coverage · Destination weddings · Multi-day events · Custom albums · Mix of film and digital photography	Prilagođena pokrivenost · Vjenčanja na destinacijama · Višednevni događaji · Prilagođeni albumi · Miks filma i digitalne fotografije	1	\N	\N	\N
\.


--
-- Data for Name: site_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.site_settings (key, value) FROM stdin;
email	hello@387cinematicweddings.com
phone	+387 61 000 000
instagram	#
facebook	#
twitter	#
youtube	#
tiktok	#
availability_text	Now booking 2025 & 2026
location	Sarajevo — Worldwide
instagram_handle	387cinematicweddings
seo.home.title	Art in the Moments | 387 Cinematic Weddings
seo.home.desc	Fine art wedding photography documenting love stories with a focus on raw emotion and timeless elegance. Based in Sarajevo, traveling worldwide.
seo.about.title	About Us | 387 Cinematic Weddings
seo.about.desc	Get to know Melisa and Aldin — the husband-and-wife team behind 387 Cinematic Weddings.
seo.services.title	Experience | 387 Cinematic Weddings
seo.services.desc	Explore our cinematic wedding photography packages. Editorial, emotional, and timeless — two artists, one story.
seo.portfolio.title	Portfolio | 387 Cinematic Weddings
seo.portfolio.desc	Explore our curated collection of fine art wedding stories from Sarajevo and around the world.
seo.contact.title	Inquire | 387 Cinematic Weddings
seo.contact.desc	Let's connect and start the dialogue about your wedding story. Based in Sarajevo, available worldwide.
seo.site_name	387 Cinematic Weddings
seo.og_image	
seo.home.title.en	Fine Art Wedding Photography Sarajevo | 387 Cinematic
seo.home.desc.en	Fine art wedding photography & cinematic film in Sarajevo. Editorial, emotional, timeless — two artists, one story. Based in Bosnia, traveling worldwide. Limited 2026 dates.
seo.home.title.bs	Vjenčana Fotografija Sarajevo | 387 Cinematic Weddings
seo.home.desc.bs	Fine art vjenčana fotografija i kinematski film u Sarajevu. Editorijalni, emotivni, bezvremeni stil. Putujemo širom svijeta. Slobodnih termina za 2026. je malo.
seo.about.title.en	About Melisa & Aldin | Wedding Photographers Sarajevo
seo.about.desc.en	Melisa & Aldin — a husband-and-wife fine art photography and film team from Sarajevo. Two perspectives, one shared vision. Meet the artists who will tell your wedding story.
seo.about.title.bs	O Melisi i Aldinu | Vjenčani Fotografi Sarajevo
seo.about.desc.bs	Melisa i Aldin — muž i žena tim fotografa i filmaša iz Sarajeva. Dvije perspektive, jedna vizija. Upoznajte umjetnike koji će ispričati vašu priču.
seo.services.title.en	Wedding Photography Packages Sarajevo | 387 Cinematic
seo.services.desc.en	Explore our cinematic wedding photography & film packages. Two dedicated artists, one wedding day. Booking 2026 weddings in Sarajevo & worldwide. Limited availability.
seo.services.title.bs	Paketi Fotografije Vjenčanja Sarajevo | 387 Cinematic
seo.services.desc.bs	Pogledajte naše pakete vjenčane fotografije i filma. Dva posvećena umjetnika za vaš poseban dan. Rezervirajte za 2026. vjenčanja u BiH i inostranstvu.
seo.portfolio.title.en	Wedding Photography Portfolio | 387 Cinematic Weddings
seo.portfolio.desc.en	Real weddings from Sarajevo, Europe and beyond. Fine art documentary storytelling at its most intimate — cinematic photography and film by Melisa & Aldin.
seo.portfolio.title.bs	Portfolio Vjenčane Fotografije | 387 Cinematic Weddings
seo.portfolio.desc.bs	Stvarna vjenčanja iz Sarajeva, Europe i cijelog svijeta. Fine art dokumentarni i kinematski stil — iskreni trenuci, vječna sjećanja, vaša priča.
seo.contact.title.en	Book Your Wedding Photographer Sarajevo | 387 Cinematic
seo.contact.desc.en	Ready to tell your story? Contact Melisa & Aldin — Sarajevo's fine art wedding photography team. We travel worldwide. Limited 2026 dates remaining.
seo.contact.title.bs	Rezervirajte Vjenčanog Fotografa Sarajevo | 387 Cinematic
seo.contact.desc.bs	Pošaljite upit Melisi i Aldinu — fine art vjenčani tim iz Sarajeva, putujemo širom svijeta. Slobodnih termina za 2026. je malo — kontaktirajte nas danas.
analytics.ga_id	
analytics.gtm_id	
analytics.gsc_verification	
sitemap.base_url	https://387cinematicweddings.com
robots_txt	User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: https://387cinematicweddings.com/sitemap.xml
img.home.hero.1	/uploads/1776321821090-123632377.jpg
img.home.hero.2	/uploads/1776289681582-514070369.jpg
img.home.hero.3	/uploads/1776289689273-770267431.jpg
img.home.grid.1	/uploads/1776326304656-117104188.jpg
img.home.grid.2	/uploads/1776326306028-517578225.jpg
img.home.grid.3	/uploads/1776326307577-967633657.jpg
img.home.grid.4	/uploads/1776326309059-651345472.jpg
img.home.grid.5	/uploads/1776326310602-548551901.jpg
img.home.grid.6	/uploads/1776326312636-237365495.jpg
img.home.grid.7	/uploads/1776326314288-754193955.jpg
img.home.grid.8	/uploads/1776326316543-512718379.jpg
img.home.grid.9	/uploads/1776326318402-887196378.jpg
img.home.process.1	/uploads/1776326299436-552409690.jpg
img.home.process.2	/uploads/1776326301012-448451730.jpg
img.home.process.3	/uploads/1776326302360-311487280.jpg
img.home.team.aldin	/uploads/1776326293404-928903420.jpg
img.home.team.melisa	/uploads/1776326296784-224699927.png
img.about.hero	/uploads/1776326286748-309811983.jpg
img.about.story	/uploads/1776326204975-191808164.jpg
img.services.hero	/uploads/1776326284180-39170420.jpg
img.services.pkg.1	/uploads/1776326280877-272996478.jpg
img.services.pkg.2	/uploads/1776326282406-15425951.jpg
img.services.cta	/uploads/1776326277037-17455955.jpg
coming_soon	false
img.home.hero.4	
img.home.hero.5	
img.portfolio.hero	
img.contact.hero	
instagram_section_tag	Social
instagram_section_heading	Follow Our Journey
img.instagram.1	
img.instagram.2	
img.instagram.3	
img.instagram.4	
img.instagram.5	
img.instagram.6	
img.instagram.7	
img.instagram.8	
\.


--
-- Data for Name: testimonials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.testimonials (id, client_name, text, location, wedding_date, is_active, sort_order, created_at) FROM stdin;
\.


--
-- Name: admin_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.admin_users_id_seq', 1, true);


--
-- Name: contact_submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contact_submissions_id_seq', 3, true);


--
-- Name: gallery_images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.gallery_images_id_seq', 22, true);


--
-- Name: packages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.packages_id_seq', 2, true);


--
-- Name: page_content_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.page_content_id_seq', 220, true);


--
-- Name: testimonials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.testimonials_id_seq', 1, false);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_username_key UNIQUE (username);


--
-- Name: contact_submissions contact_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_submissions
    ADD CONSTRAINT contact_submissions_pkey PRIMARY KEY (id);


--
-- Name: gallery_images gallery_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_images
    ADD CONSTRAINT gallery_images_pkey PRIMARY KEY (id);


--
-- Name: packages packages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.packages
    ADD CONSTRAINT packages_pkey PRIMARY KEY (id);


--
-- Name: page_content page_content_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_content
    ADD CONSTRAINT page_content_key_key UNIQUE (key);


--
-- Name: page_content page_content_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_content
    ADD CONSTRAINT page_content_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (key);


--
-- Name: testimonials testimonials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials
    ADD CONSTRAINT testimonials_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict jURLWrNAKmpgiy3wafgua4ThU8qt0UyRnwB2g3FmhfbjYlmhb3rzzIhFJk2OR2g


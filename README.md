# Wonderfall website

Static HTML/CSS/JavaScript deployed by GitHub Pages from `main`. Publishing happens on push to `main`; review locally before publishing.

## Edit and generate

- `content/en.json`, `content/uk.json`: homepage, FAQ, support and metadata.
- `content/articles/en.html`, `content/articles/uk.html`: article body sources.
- `content/privacy.json`, `content/privacy-template.html`: existing policy content.
- `content/site.json`: canonical HTTPS origin and actual publish/update dates. The local launch configuration targets `https://getwonderfall.com`; live production remains `https://snowmyscreen.app` until a separate authorized deployment. The build does not change `CNAME`, DNS or hosting settings.
- `content/app-store.json`: checked public release facts, US download price, Ukrainian rating summary and attributed review excerpts. Storefront ratings and text-review counts are separate measurements.
- `content/download-template.html`, `content/llms-template.txt`: domain-independent sources for the existing download handoff and the optional AI source index.
- `scripts/build_site.py`: dependency-free generator for EN/UK pages, the download page, RSS, sitemap, robots and the AI source index.
- `js/reviews.js`: an Expensa-style review row. Original quotes occur once in HTML; decorative copies are hidden from assistive technology. Pause, keyboard scrolling, reduced motion and offscreen/hidden-tab suspension are supported.
- `css/site.css`, `js/preview.js`, `js/heading.js`: shared layout, seasonal video preview and rotating hero headline.
- `css/features.css`, `js/features.js`: the seven supporting feature cards, with weather choices, canvas cleaning, independent garland controls and display-layer choices. Custom images and motion settings use compact SF Symbol illustrations. Copy and accessible labels live in each locale's `showcase` object.
- `fonts/`: self-hosted Geist for body text and controls, Nunito for headings and the wordmark. Latin/Cyrillic subsets use `font-display: swap`; font licenses are included alongside them.
- `css/navigation.css`, `js/navigation.js`: floating navigation adapted from getexpensa.com, including mobile links, language choices and the download button after the hero. Labels live in `navigation_ui` in both content locales.
- `images/icon.png`, `images/wonderfall-icon.png`, `images/favicon/`: Wonderfall brand exports from the approved `falling-v1` icon in `../marketing/assets/wonderfall/dock-icon-xdx06oui/`. The 256px PNG is used in navigation and the original 1024px icon in share metadata.
- `images/hero/wonderfall-sky.webp`: optimized homepage sky, fading into the page; `js/shooting-star.js` adds a single falling star with a fading trail and pauses it off screen, in hidden tabs and for reduced motion. The original background lives in `../marketing/assets/wonderfall/backgrounds/`.
- `css/cookies.css`, `js/cookie-banner.js`, `js/analytics.js`: consent UI adapted from Expensa and GA4 `G-VB76JMX2B6`.
- `index.html`, `uk/`, `blog/`, `support/`, `privacy.html`, `download.html`, `sitemap.xml`, `robots.txt`, `llms.txt`: generated outputs; commit them with their content sources.

```sh
python3 scripts/build_site.py
python3 scripts/validate_site.py
python3 -m http.server 8000 --bind 127.0.0.1
```

For a phone preview, start the server with `python3 -m http.server 8000 --bind 0.0.0.0` instead. Open `http://<Mac-Wi-Fi-IP>:8000/` on a phone connected to the same Wi-Fi network; `127.0.0.1` only reaches the device opening that address.

New content is present in the HTML without JavaScript. The website supports English at `/` and Ukrainian at `/uk/`. Each page has its own canonical URL and reciprocal `en`/`uk` hreflang. The preview and rotating headline honor reduced motion and pause off screen and in hidden tabs.

The website brand is Wonderfall. The purchased launch domain is `getwonderfall.com`. The local `content/site.json` and `CNAME` are prepared for it; neither file has been pushed. Production still serves `snowmyscreen.app` from GitHub Pages, branch `main` of `saintsereda/SnowMyScreen`. The existing App Store destination and consent storage identifiers stay unchanged. Canonical URLs, EN/UK hreflang, social metadata, schema IDs, RSS, sitemap and the AI source index use the configured origin. The validator checks that it matches the local `CNAME`. The generator versions CSS, homepage JavaScript, navigation JavaScript and icon URLs by file content; regenerate pages after editing them.

The new domain's DNS checked on 2026-10-20 still uses Namecheap parking (`192.64.119.4`; `www` points to `parkingpage.namecheap.com`). No DNS, registrar, repository settings or production changes were made. For a future GitHub Pages connection, the [official DNS records](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) are:

| Type | Host | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | saintsereda.github.io |

Changing GitHub Pages' custom domain, replacing parking DNS and publishing the prepared changes are separate live operations. The user's instruction not to move or publish the site still applies; do not perform those operations based only on the purchase announcement.

Analytics stays blocked until the visitor opts in (basic Consent Mode v2). The shared scripts are included on all pages, including the blog, privacy, download and 404. Consent is stored under `snowmyscreen_cookie_consent_v1`, version `1`; keep the version synchronized in both scripts when the purposes change. Cookie settings in the footer reopen preferences. Withdrawal removes GA cookies and reloads to unload the tag. Advertising storage, user data and personalization stay denied. The website privacy section describes this separately from the app's local data.

## Release availability

Apple's public listing checked on 2026-10-20 still names the app SnowMyScreen, version 1.1.2, with snowfall and custom PNGs. The homepage, FAQ, support, guide and `llms.txt` distinguish that download from the upcoming Wonderfall seasonal update. `SoftwareApplication` contains the checked store name, version, compatibility, US offer, developer, download URL and released features; it does not claim that previewed rain, leaves, petals, fireflies or garlands are already released.

The Ukrainian [Apple reviews page](https://apps.apple.com/ua/app/snowmyscreen/id6755106853?see-all=reviews&platform=mac) showed 5.0/5 from 12 ratings and three written reviews. The public iTunes lookup returned zero ratings, so the displayed regional summary comes from the reviews page's server data. The checked RSS feeds for 77 storefronts contained written reviews only in Ukraine. Cards keep the original author names, ratings and short English excerpts; the Ukrainian page identifies the original language. No global score is inferred from these selected reviews.

Normal builds do not access the network. To recheck live sources without editing the snapshot:

```sh
python3 scripts/refresh_app_store.py --check
```

To refresh the snapshot, run the script without `--check`, inspect its diff, update any release-related copy and regenerate. The script verifies existing excerpts against Apple's feed and stops if a quote, author or individual rating no longer matches. New review selection and released-feature claims require editorial review.

## Add a blog post

Add localized article sources, then extend the article definitions in `scripts/build_site.py` and the localized content records. Each post needs its own canonical URL, title, description, author, accurate publish/update dates, BlogPosting and breadcrumb data, internal links, RSS entry and sitemap entry. Do not point new posts to the homepage canonical.

`llms.txt` is an optional content index, not a Google indexing requirement or a ranking guarantee. Imported App Store reviews and their regional score are displayed with attribution, but are not republished as `Review` or `AggregateRating` JSON-LD: [Google's review guidelines](https://developers.google.com/search/docs/appearance/structured-data/review-snippet) prohibit aggregating ratings from other websites. The visible FAQ and corresponding schema stay synchronized. [Google's AI guidance](https://developers.google.com/search/docs/appearance/ai-features) calls for accessible, helpful text and matching structured data rather than special AI markup.

The Pages workflow regenerates and validates the site, then rejects stale generated outputs before deployment. Local checks do not submit URLs to Google or Bing, verify domain ownership, measure field Core Web Vitals or guarantee indexing and AI citations. Those production checks remain separate from this local preparation.

## Effect videos

The homepage shows each recording in a bounded, rounded 16:9 video panel, inspired by LookAway's in-page demo. Its dimensions stay constant while scrolling; the five season choices sit below it and remain visible without scroll pinning or expansion. `content/preview-videos.json` maps the themes to `src` and optional `poster` paths inside this repository. The 2560×1440, 60 fps H.264 recordings and matching posters live in `videos/`; they are encoded from the original 4096×2304, 60 fps clips in `~/Desktop/Screen Recording 2026-10-07 clips/`. The generator rejects missing files. Clips use a real HTML poster and native controls without JavaScript. Enhanced playback starts when the video enters the viewport, so an offscreen recording does not compete with the hero download. Clips loop muted, have a keyboard-accessible pause/resume button, pause when hidden or off screen, and respect reduced motion. An explicit press of Play can start the preview when reduced motion is enabled.

The five seasonal effects appear once in the large video section. The feature showcase below adds seven complementary details: a wide weather-matching demo, cleaning and garlands side by side, then custom PNGs, motion, placement and multiple displays. The custom-image and motion cards use 32px SF Symbols (`photo.on.rectangle.angled.fill` and `gear`), rendered from macOS at 4× resolution into transparent PNGs in `images/features/symbols/`. Cleaning erases real canvas pixels and offers keyboard-accessible clear/reset controls; horizontal swipes preserve normal phone scrolling. Renderer stills in `images/features/` supply the leaf piles and raindrops; source stills remain in `app/output/rain-preview/` in the separate app repository. Interactive controls progressively enhance static artwork; the upcoming update is labeled separately from the available App Store release.

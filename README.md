# Wonderfall website

Static HTML/CSS/JavaScript deployed by GitHub Pages from `main`. Publishing happens on push to `main`; review locally before publishing.

## Edit and generate

- `content/en.json`, `content/uk.json`: homepage, FAQ, support and metadata. Heading/subheading copy omits sentence periods; numeric version separators stay intact. App Store title punctuation is formatted for display, with original source data retained in its snapshot.
- `content/articles/en.html`, `content/articles/uk.html`: article body sources.
- `content/privacy.json`, `content/privacy-template.html`: existing policy content.
- `content/site.json`: canonical HTTPS origin and actual publish/update dates. The launch configuration targets `https://getwonderfall.com`. The build does not change `CNAME`, DNS or hosting settings.
- `content/app-store.json`: checked public release facts, US download price, Ukrainian rating summary and attributed review excerpts. Storefront ratings and text-review counts are separate measurements.
- `content/download-template.html`, `content/llms-template.txt`: domain-independent sources for the existing download handoff and the optional AI source index.
- `scripts/build_site.py`: dependency-free generator for EN/UK pages, the download page, RSS, sitemap, robots and the AI source index.
- `js/reviews.js`: the original CSS-animated review ribbon. Decorative copies make its transform animation continuous and are hidden from assistive technology; each attributed original appears once. Hover pauses the animation. Keyboard focus exposes a static native scrollable row, and reduced motion keeps that finite fallback without decorative copies. JavaScript only prepares the copies and animation distance/duration, rebuilds after resizing and pauses offscreen or in hidden tabs; it does not intercept the wheel, drag pointers or rewrite scroll positions. There is no separate pause button. Integration checks live in `tests/reviews.test.mjs`.
- `js/faq.js`: progressive enhancement of native FAQ details. Answer height and opacity animate from their current values, so rapid clicks reverse smoothly. The plus icon follows the requested state, reduced motion stays instant, and resizing retargets an in-progress transition. Native keyboard controls, find-in-page and the no-JavaScript fallback remain available.
- `css/site.css`, `js/preview.js`, `js/heading.js`: shared layout, seasonal video preview and rotating hero headline.
- `src/components/JellyRadio.jsx`, `src/components/JellyRadio.css`, `src/weather-switch.jsx`, `src/weather-switch.css`: React Bits JellyRadio and the seasonal video adapter. The five localized choices use spring motion and retain keyboard navigation and reduced-motion support. Choices wrap into centered rows whenever their labels no longer fit, with vertical space for the spring and horizontal neighbour movement limited to the selected row. The generated `js/weather-switch.js` and `css/weather-switch.css` contain React and Motion locally; no CDN is needed. Native HTML buttons remain the fallback. Upstream and runtime licenses live in `licenses/`.
- `css/features.css`, `js/features.js`, `content/feature-media.json`: four interactive feature cards for cleaning, garlands, custom images and placement, after three text points for weather matching, displays and motion settings. Copy and accessible labels live in each locale's `showcase` object. Feature symbols are native SF Symbols; regenerate with `xcrun swift scripts/export_feature_symbols.swift images/features/symbols`. The cleaning picker uses the app's own shovel, broom and squeegee cursor art, exported by `scripts/export_cleaning_tool_icons.swift`. Placement uses three native SF Symbols without colored icon backgrounds; regenerate with `xcrun swift scripts/export_placement_symbols.swift images/features/placement`.
- `css/desktop-preview.css` and `desktop_menu_bar()` in the generator: decorative menu bars over the seasonal video. Icons in `images/menu-bar/` are native SF Symbols, exported with `NSImage(systemSymbolName:)` as transparent 4× PNGs with their original proportions. Regenerate on macOS with `xcrun swift scripts/export_menu_bar_symbols.swift images/menu-bar`. The app icon follows the native effect symbols in `app/Snowflakes/EffectStyle.swift`. The transparent bar stays outside the accessibility tree. A small bottom-anchored zoom hides the recorded menu bar, and source media is unchanged.
- `fonts/`: self-hosted Geist for body text and controls, Nunito for headings and the wordmark. Latin/Cyrillic subsets use `font-display: swap`; font licenses are included alongside them.
- `css/navigation.css`, `js/navigation.js`: the existing floating header retains its layout, with 6px right padding at the mobile breakpoint. At 900px and below, its opened menu uses five irregular white bubbles in a compact 2–1–2 cluster: Effects/Features, FAQ, then Blog/App Store. The FAQ item reserves a full row while its link stays sized to its text. Bubble widths follow their localized labels plus padding (`fit-content`), with varied heights, offsets and rotations. At 380px and below, tighter text/padding keep both localized pairs together. Rotation belongs to the outer item so it survives GSAP's scale animation on the link. `src/mobile-menu.js` adapts the supplied React Bits BubbleMenu's staggered spring-like reveal and interruptible close, bundled locally as `js/mobile-menu.js` and loaded only at the mobile breakpoint. The menu remains usable if that bundle fails. Background scrolling and focus stay within the open overlay; Escape, links, language changes, desktop resize and page exit close it and restore prior inert state. Reduced motion settles immediately. Labels live in `navigation_ui` and existing navigation/CTA strings in both content locales.
- `images/icon.png`, `images/wonderfall-icon.png`, `images/favicon/`: Wonderfall brand exports from the approved `falling-v1` icon in `../marketing/assets/wonderfall/dock-icon-xdx06oui/`. The 256px PNG is used in navigation and the original 1024px icon in share metadata.
- `css/site.css`: the shared `--sky-glow` stack of CSS gradients draws the hero's cyan and pink light, repeated in two masked background washes anchored to the feature showcase and the full-width FAQ region. Each wash has a viewport-width-based offset and height, so expanding FAQ answers cannot shift its position. The pseudo-elements sit behind all section content within main's stacking context. Percent-based positions inside each wash keep both colored edges visible on phones. The former `images/hero/wonderfall-sky.webp` remains as a visual reference and is no longer loaded or preloaded. `js/shooting-star.js` creates independent random flights in a fixed decorative layer above the background washes and behind the content. Positions, directions, sizes, speeds and delays vary; short intervals sometimes create clusters, capped at three simultaneous stars. Hidden tabs, page exit and reduced motion cancel timers and remove active stars. Original background artwork lives in `../marketing/assets/wonderfall/backgrounds/`.
- `css/cookies.css`, `js/cookie-banner.js`, `js/analytics.js`: consent UI adapted from Expensa and GA4 `G-VB76JMX2B6`.
- `index.html`, `uk/`, `blog/`, `support/`, `privacy.html`, `download.html`, `sitemap.xml`, `robots.txt`, `llms.txt`: generated outputs; commit them with their content sources.

```sh
python3 scripts/build_site.py
python3 scripts/validate_site.py
python3 -m http.server 8000 --bind 127.0.0.1
```

For changes in `src/`, use Node.js 20 or newer and rebuild the UI before generating pages:

```sh
npm ci
npm run test:ui
python3 scripts/validate_site.py
```

`npm run build:ui` bundles the React island and mobile menu motion with esbuild. Commit their JavaScript, CSS, license files and `content/ui-build.json` alongside the sources and generated HTML. The Python validator checks their hashes, so existing static deployment can verify the committed bundles without installing Node dependencies. `npm run test:ui` rebuilds the UI and pages, then checks video integration, menu interactions, keyboard controls, localization, fallbacks and motion preferences in a DOM environment.

For a phone preview, start the server with `python3 -m http.server 8000 --bind 0.0.0.0` instead. Open `http://<Mac-Wi-Fi-IP>:8000/` on a phone connected to the same Wi-Fi network; `127.0.0.1` only reaches the device opening that address.

New content is present in the HTML without JavaScript. The website supports English at `/` and Ukrainian at `/uk/`. Each page has its own canonical URL and reciprocal `en`/`uk` hreflang. The preview and rotating headline honor reduced motion and pause off screen and in hidden tabs.

The website brand is Wonderfall. GitHub Pages serves `getwonderfall.com` from branch `main` of `saintsereda/SnowMyScreen`. The local `content/site.json` and `CNAME` target that domain; publishing them requires a separate authorized push. The existing App Store destination and consent storage identifiers stay unchanged. Canonical URLs, EN/UK hreflang, social metadata, schema IDs, RSS, sitemap and the AI source index use the configured origin. The validator checks that it matches the local `CNAME`. The generator versions CSS, homepage JavaScript, navigation JavaScript and icon URLs by file content; regenerate pages after editing them.

DNS checked on 2026-10-22 points the apex domain to GitHub Pages and `www` to `saintsereda.github.io`. The GitHub Pages custom domain is `getwonderfall.com`; HTTPS responds successfully. The remote `main` branch still contains the old `snowmyscreen.app` CNAME and canonical metadata, so the live page has mismatched metadata until the prepared changes are published. The [official DNS records](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) are:

| Type | Host | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | saintsereda.github.io |

Publishing the prepared changes is a separate live operation from the domain and DNS changes already made. A push to `main` triggers the production deployment.

Analytics stays blocked until the visitor opts in (basic Consent Mode v2). The shared scripts are included on all pages, including the blog, privacy, download and 404. Consent is stored under `snowmyscreen_cookie_consent_v1`, version `1`; keep the version synchronized in both scripts when the purposes change. Cookie settings in the footer reopen preferences. Withdrawal removes GA cookies and reloads to unload the tag. Advertising storage, user data and personalization stay denied. The website privacy section describes this separately from the app's local data.

## Release preparation

Apple's public listing checked on 2026-10-22 still names the app SnowMyScreen, version 1.1.2, with snowfall and custom PNGs. The prepared Wonderfall site describes the intended complete product without presenting seasonal features as a future update. Before publishing, verify that the released app matches every feature and support instruction on the site. `SoftwareApplication` omits a version number so the old 1.1.2 number is not attached to the new feature list. The public RSS review feed returned no entries on 2026-10-22, although the Apple reviews page still contained the attributed reviews, so `refresh_app_store.py --check` could not complete.

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

The homepage shows each recording in a bounded, rounded 16:9 video panel, inspired by LookAway's in-page demo. Its layout dimensions stay constant while scrolling; the five season choices sit below it without scroll pinning or expansion. `js/preview-perspective.js` applies Expensa's 42-degree perspective to the complete screen, including its menu bar, and straightens it as it enters the viewport. It measures the untransformed wrapper, responds to reverse scrolling, suspends work off screen and in hidden tabs, and leaves a flat panel without JavaScript or with reduced motion. `content/preview-videos.json` maps the themes to `src` and optional `poster` paths inside this repository. The 2560×1440, 60 fps H.264 recordings and matching posters live in `videos/`; they are encoded from the original 4096×2304, 60 fps clips in `~/Desktop/Screen Recording 2026-10-07 clips/`. The generator rejects missing files. Clips use a real HTML poster, which stays visible without JavaScript. Enhanced playback starts when the video enters the viewport, so an offscreen recording does not compete with the hero download. Clips loop muted, pause when hidden or off screen, and respect reduced motion.

The five seasonal effects appear once in the large video section. The feature showcase starts with three compact points for weather matching, connected displays and motion settings. Below them, four feature cards for cleaning, garlands, custom artwork and placement alternate their media and copy sides on desktop and stack on narrower screens. The cleaning card fills its frame from the bottom left and has no decorative menu bar. All four feature cards use equally wide media columns on desktop; cleaning, custom artwork and placement have 372px-tall frames, while the garland frame keeps its 16:9 ratio. The placement card crops the recording from the bottom to keep its upper content in view.

`content/feature-media.json` has separate `src` and `poster` paths for each cleaning tool, the garland montage and three placement modes. The cleaning clips begin with the tool visible (snow and leaves trimmed by 5 seconds, rain by 7.5 seconds), and their switcher sits below the feature description. The garland video cycles through ten designs with varied holds and short dissolves, without a scene picker. The placement buttons switch between over-windows, desktop-only and top-strip recordings; over-windows begins with snow already visible over the browser. Run `python3 scripts/edit_feature_recordings.py GARLAND_MOV PLACEMENT_MOV` with the source recordings and ffmpeg to regenerate the optimized H.264 videos and JPEG posters. The source MOVs remain outside this repository. The generator rejects missing configured files. The custom artwork card accepts one local PNG, JPEG or WebP up to 5 MB through the centered picker, shown on hover or keyboard focus and always visible on touch devices. Its Canvas preview uses the app's snow motion defaults and does not upload the file.

Configured feature videos show their posters without JavaScript. Enhanced playback starts only in view, pauses off screen and in hidden tabs, and honors reduced motion. Failed recordings fall back to their poster or scene preview. The source recordings and main seasonal switcher stay independent. Feature interaction checks live in `tests/features.test.mjs`.

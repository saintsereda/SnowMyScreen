# Wonderfall website

Static HTML/CSS/JavaScript deployed by GitHub Pages from `main`. Publishing happens on push to `main`; review locally before publishing.

## Edit and generate

- `content/en.json`, `content/uk.json`: homepage, FAQ, support and metadata.
- `content/articles/en.html`, `content/articles/uk.html`: article body sources.
- `content/privacy.json`, `content/privacy-template.html`: existing policy content.
- `scripts/build_site.py`: dependency-free generator for EN/UK pages, RSS and sitemap.
- `css/site.css`, `js/preview.js`, `js/heading.js`, `js/features.js`: shared layout, video preview, rotating hero headline and feature demo.
- `fonts/`: self-hosted Geist for body text and controls, Nunito for headings and the wordmark. Latin/Cyrillic subsets use `font-display: swap`; font licenses are included alongside them.
- `css/navigation.css`, `js/navigation.js`: floating navigation adapted from getexpensa.com, including mobile links, language choices and the download button after the hero. Labels live in `navigation_ui` in both content locales.
- `images/icon.png`, `images/wonderfall-icon.png`, `images/favicon/`: Wonderfall brand exports from the approved `falling-v1` icon in `../marketing/assets/wonderfall/dock-icon-xdx06oui/`. The 256px PNG is used in navigation and the original 1024px icon in share metadata.
- `images/hero/wonderfall-sky.webp`: optimized homepage sky, fading into the page; `js/shooting-star.js` adds a single falling star with a fading trail and pauses it off screen, in hidden tabs and for reduced motion. The original background lives in `../marketing/assets/wonderfall/backgrounds/`.
- `css/cookies.css`, `js/cookie-banner.js`, `js/analytics.js`: consent UI adapted from Expensa and GA4 `G-VB76JMX2B6`.
- `index.html`, `uk/`, `blog/`, `support/`, `privacy.html`, `sitemap.xml`: generated outputs; commit them with their content sources.
- `download.html`: existing App Store handoff, preserved for external links.

```sh
python3 scripts/build_site.py
python3 scripts/validate_site.py
python3 -m http.server 8000 --bind 127.0.0.1
```

For a phone preview, start the server with `python3 -m http.server 8000 --bind 0.0.0.0` instead. Open `http://<Mac-Wi-Fi-IP>:8000/` on a phone connected to the same Wi-Fi network; `127.0.0.1` only reaches the device opening that address.

New content is present in the HTML without JavaScript. The website supports English at `/` and Ukrainian at `/uk/`. Each page has its own canonical URL and reciprocal `en`/`uk` hreflang. The preview and rotating headline honor reduced motion and pause off screen and in hidden tabs.

The website brand is Wonderfall. The existing `snowmyscreen.app` domain, App Store destination and consent storage identifiers remain the production integration points. The generator versions CSS, navigation JavaScript and icon URLs by file content; regenerate pages after editing them.

Analytics stays blocked until the visitor opts in (basic Consent Mode v2). The shared scripts are included on all pages, including the blog, privacy, download and 404. Consent is stored under `snowmyscreen_cookie_consent_v1`, version `1`; keep the version synchronized in both scripts when the purposes change. Cookie settings in the footer reopen preferences. Withdrawal removes GA cookies and reloads to unload the tag. Advertising storage, user data and personalization stay denied. The website privacy section describes this separately from the app's local data.

## Release availability

Apple's public listing last checked on 2026-10-09 reports version 1.1.2 (snowfall/custom images). The homepage release pill links to that listing and names its Polish language and custom-image shuffle update. The website describes the seasonal feature set in the local app. `app_schema()` currently limits the released feature list to snowfall and custom images. Check the available App Store release before expanding release availability claims and regenerate after changes.

## Add a blog post

Add localized article sources, then extend the article definitions in `scripts/build_site.py` and the localized content records. Each post needs its own canonical URL, title, description, author, accurate publish/update dates, BlogPosting and breadcrumb data, internal links, RSS entry and sitemap entry. Do not point new posts to the homepage canonical.

`llms.txt` is an optional content index. It is not a Google indexing requirement or a ranking guarantee. No reviews, ratings, prices or invented purchase notifications are used in the new pages.

## Effect videos

The homepage shows each recording in a rounded video panel without a device mockup. `content/preview-videos.json` maps the five switcher themes to `src` and optional `poster` paths inside this repository. The 2560×1440, 60 fps H.264 recordings and matching posters live in `videos/`; they are encoded from the original 4096×2304, 60 fps clips in `~/Desktop/Screen Recording 2026-10-07 clips/`. The generator rejects missing files. Clips loop muted, pause when hidden or off screen, and respect reduced motion.

The four-part feature showcase uses a working display-layer switch, an illustrated garland and settings panel, and optimized renderer stills in `images/features/` for leaf piles and raindrops. The source stills remain in `app/output/rain-preview/` in the separate app repository.

# SnowMyScreen website

Static HTML/CSS/JavaScript deployed by GitHub Pages from `main`. Publishing happens on push to `main`; review locally before publishing.

## Edit and generate

- `content/en.json`, `content/uk.json`: homepage, FAQ, support and metadata.
- `content/articles/en.html`, `content/articles/uk.html`: article body sources.
- `content/privacy.json`, `content/privacy-template.html`: existing policy content.
- `scripts/build_site.py`: dependency-free generator for EN/UK pages, RSS and sitemap.
- `css/site.css`, `js/preview.js`, `js/heading.js`: shared layout, video preview and rotating hero headline.
- `css/cookies.css`, `js/cookie-banner.js`, `js/analytics.js`: consent UI adapted from Expensa and GA4 `G-VB76JMX2B6`.
- `index.html`, `uk/`, `blog/`, `support/`, `privacy.html`, `sitemap.xml`: generated outputs; commit them with their content sources.
- `download.html`: existing App Store handoff, preserved for external links.

```sh
python3 scripts/build_site.py
python3 scripts/validate_site.py
python3 -m http.server 8000 --bind 127.0.0.1
```

New content is present in the HTML without JavaScript. The website supports English at `/` and Ukrainian at `/uk/`. Each page has its own canonical URL and reciprocal `en`/`uk` hreflang. The preview and rotating headline honor reduced motion. The headline transition comes from the local Expensa website and pauses off screen and in hidden tabs.

Analytics stays blocked until the visitor opts in (basic Consent Mode v2). The shared scripts are included on all pages, including the blog, privacy, download and 404. Consent is stored under `snowmyscreen_cookie_consent_v1`, version `1`; keep the version synchronized in both scripts when the purposes change. Cookie settings in the footer reopen preferences. Withdrawal removes GA cookies and reloads to unload the tag. Advertising storage, user data and personalization stay denied. The website privacy section describes this separately from the app's local data.

## Release availability

Apple's public listing last checked on 2026-10-05 reports version 1.1.2 (snowfall/custom images). The website describes the seasonal feature set in the local app. `app_schema()` currently limits the released feature list to snowfall and custom images. Check the available App Store release before expanding release availability claims and regenerate after changes.

## Add a blog post

Add localized article sources, then extend the article definitions in `scripts/build_site.py` and the localized content records. Each post needs its own canonical URL, title, description, author, accurate publish/update dates, BlogPosting and breadcrumb data, internal links, RSS entry and sitemap entry. Do not point new posts to the homepage canonical.

`llms.txt` is an optional content index. It is not a Google indexing requirement or a ranking guarantee. No reviews, ratings, prices or invented purchase notifications are used in the new pages.

## Effect videos

The display frame remains the supplied PNG. `content/preview-videos.json` maps the five switcher themes to `src` and optional `poster` paths inside this repository. All slots are currently `null` and render the static placeholder. Add actual recordings under `videos/`, update the paths, then regenerate; the generator rejects missing files. Clips loop muted, pause when hidden or off screen, and respect reduced motion. The pause control appears only for a configured video.

#!/usr/bin/env python3
"""Generate crawlable EN/UK pages using only the Python standard library."""
from pathlib import Path
import html
import hashlib
import json
import re
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SITE = json.loads((ROOT/'content/site.json').read_text())
ORIGIN = SITE['origin'].rstrip('/')
origin_parts = urlsplit(ORIGIN)
assert origin_parts.scheme == 'https' and origin_parts.hostname and not origin_parts.path and not origin_parts.query and not origin_parts.fragment and not origin_parts.username, 'Set a plain HTTPS origin in content/site.json.'
STORE_DATA = json.loads((ROOT/'content/app-store.json').read_text())
STORE = 'https://apps.apple.com/app/id6755106853'
DATE = SITE['article_published']
UPDATED = SITE['content_updated']
SLUG = 'mac-desktop-effects'
LANGS = ('en', 'uk')
E = html.escape

def asset(path):
    version=hashlib.sha256((ROOT/path.lstrip('/')).read_bytes()).hexdigest()[:10]
    return f'{path}?v={version}'

def home(lang):
    return '/' if lang == 'en' else '/uk/'

def url(lang, suffix=''):
    return home(lang) + suffix

def dump(value):
    return json.dumps(value, ensure_ascii=False).replace('<', '\\u003c')

def app_schema(c):
    return {'@type':'SoftwareApplication','@id':ORIGIN+'/#app','name':'Wonderfall',
            'alternateName':STORE_DATA['name'],'identifier':STORE_DATA['bundle_id'],
            'url':ORIGIN+'/', 'downloadUrl':STORE,'applicationCategory':'EntertainmentApplication',
            'sameAs':STORE,'image':ORIGIN+'/images/wonderfall-icon.png',
            'operatingSystem':f'macOS {STORE_DATA["minimum_os"]} or later',
            'softwareVersion':STORE_DATA['version'],'description':c['released_description'],
            'featureList':c['released_features'],'author':{'@id':ORIGIN+'/#andrew'},
            'offers':{'@type':'Offer','url':STORE_DATA['offer']['url'],
                      'price':STORE_DATA['offer']['price'],'priceCurrency':STORE_DATA['offer']['currency']}}

def navigation(c, suffix='', preview=False):
    lang=c['lang']; ui=c['navigation_ui']
    links=''.join(f'<a href="{url(lang)}#{anchor}">{E(label)}</a>' for anchor,label in zip(('effects','features','faq'),c['nav'][:3]))
    current=' aria-current="page"' if suffix=='blog/' else ''
    links+=f'<a href="{url(lang,"blog/")}"{current}>{E(c["nav"][3])}</a>'
    languages=''.join(f'<a href="{url(locale,suffix)}" lang="{locale}" hreflang="{locale}"'+(' aria-current="page"' if locale==lang else '')+f'>{label}</a>' for locale,label in (('en','English'),('uk','Українська')))
    return f'''<header class="site-navigation{' has-hero' if preview else ''}" data-site-navigation>
<nav class="site-navigation__capsule" aria-label="{E(ui['main'])}">
<a class="site-navigation__brand" href="{url(lang)}" aria-label="Wonderfall — {E(ui['home'])}"><img src="{asset('/images/icon.png')}" width="36" height="36" alt=""><span class="site-navigation__wordmark">Wonderfall</span></a>
<div class="site-navigation__links">{links}</div>
<button class="site-navigation__toggle" type="button" data-nav-toggle hidden aria-label="{E(ui['menu'])}" aria-expanded="false" aria-controls="site-mobile-menu"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path class="nav-menu-lines" d="M3 5h14M3 10h14M3 15h14"/><path class="nav-menu-close" d="m5 5 10 10M15 5 5 15"/></svg></button>
<a class="site-navigation__download" href="{STORE}"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.05 12.536c.027 3.143 2.757 4.188 2.787 4.2-.023.074-.436 1.49-1.438 2.952-.866 1.264-1.765 2.523-3.18 2.55-1.39.026-1.838-.824-3.428-.824-1.589 0-2.086.798-3.402.85-1.366.052-2.406-1.366-3.28-2.625-1.785-2.576-3.149-7.28-1.317-10.455.91-1.576 2.536-2.574 4.3-2.6 1.344-.026 2.612.902 3.429.902.816 0 2.349-1.115 3.956-.951.672.028 2.56.271 3.773 2.047-.098.061-2.253 1.31-2.2 3.954ZM14.453 4.93c.726-.879 1.214-2.102 1.08-3.32-1.047.042-2.313.698-3.064 1.577-.673.777-1.263 2.022-1.104 3.216 1.167.09 2.36-.593 3.088-1.473Z"/></svg>{E(c['short_cta'])}</a>
<div class="site-navigation__mobile" id="site-mobile-menu" data-nav-menu hidden>{links}</div>
</nav>
<details class="site-navigation__language" data-nav-language><summary class="site-navigation__round" aria-label="{E(ui['language'])}: {lang.upper()}" aria-expanded="false">{lang.upper()}</summary><div class="site-navigation__languages">{languages}</div></details>
<noscript><nav class="site-navigation__fallback" aria-label="{E(ui['sections'])}">{links}</nav></noscript>
</header>'''

def page(c, suffix, title, description, body, schemas=(), article=False, preview=False):
    lang=c['lang']; canonical=ORIGIN+url(lang,suffix)
    webpage={'@type':'WebPage','@id':canonical+'#page','url':canonical,'name':title,
             'description':description,'inLanguage':lang,'isPartOf':{'@id':ORIGIN+'/#website'},
             'dateModified':UPDATED,'about':{'@id':ORIGIN+'/#app'}}
    if preview:webpage['mainEntity']={'@id':ORIGIN+'/#app'}
    graph=[{'@type':'WebSite','@id':ORIGIN+'/#website','name':'Wonderfall','alternateName':'SnowMyScreen',
            'url':ORIGIN+'/','inLanguage':list(LANGS),'publisher':{'@id':ORIGIN+'/#andrew'}},
           {'@type':'Person','@id':ORIGIN+'/#andrew','name':'Andrew Sereda',
            'alternateName':'Andrii Sereda','url':'https://github.com/saintsereda',
            'sameAs':['https://x.com/andrew_sereda','https://www.threads.com/@saintsereda']},
           webpage, *schemas]
    alternates=''.join(f'<link rel="alternate" hreflang="{locale}" href="{ORIGIN+url(locale,suffix)}">' for locale in LANGS)
    feed=url(lang,'blog/feed.xml')
    hero_preload='<link rel="preload" as="image" href="/images/hero/wonderfall-sky.webp" type="image/webp">\n' if preview else ''
    feature_styles=f'<link rel="stylesheet" href="{asset("/css/features.css")}">\n' if preview else ''
    hero_atmosphere='<div class="hero-atmosphere" aria-hidden="true"><span class="shooting-star" data-shooting-star></span></div>\n' if preview else ''
    preview_script=''.join(f'<script src="{asset(path)}" defer></script>' for path in ('/js/preview.js','/js/features.js','/js/shooting-star.js','/js/reviews.js')) if preview else ''
    article_meta=f'<meta property="article:published_time" content="{DATE}T09:00:00+02:00"><meta property="article:modified_time" content="{UPDATED}T09:00:00+02:00">' if article else ''
    return f'''<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{E(title)}</title><meta name="description" content="{E(description)}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<link rel="canonical" href="{canonical}">{alternates}
<link rel="alternate" hreflang="x-default" href="{ORIGIN+url('en',suffix)}">
<meta property="og:type" content="{'article' if article else 'website'}"><meta property="og:site_name" content="Wonderfall">
<meta property="og:title" content="{E(title)}"><meta property="og:description" content="{E(description)}">
<meta property="og:url" content="{canonical}"><meta property="og:locale" content="{c['locale']}">
<meta property="og:locale:alternate" content="{'uk_UA' if lang=='en' else 'en_US'}">
<meta property="og:image" content="{ORIGIN}/images/wonderfall-icon.png"><meta property="og:image:width" content="1024"><meta property="og:image:height" content="1024"><meta property="og:image:alt" content="{'Wonderfall app icon' if lang=='en' else 'Іконка Wonderfall'}">
<meta name="twitter:card" content="summary"><meta name="twitter:title" content="{E(title)}">
<meta name="twitter:description" content="{E(description)}"><meta name="twitter:image" content="{ORIGIN}/images/wonderfall-icon.png">
<meta name="twitter:image:alt" content="{'Wonderfall app icon' if lang=='en' else 'Іконка Wonderfall'}">
{article_meta}
<link rel="icon" href="{asset('/images/favicon/favicon.ico')}"><link rel="apple-touch-icon" href="{asset('/images/favicon/apple-touch-icon.png')}">
<link rel="manifest" href="{asset('/images/favicon/site.webmanifest')}"><meta name="theme-color" content="{'#3983dc' if preview else '#f8f7f3'}">
<link rel="alternate" type="application/rss+xml" title="Wonderfall Blog ({lang})" href="{feed}">
{hero_preload}<link rel="stylesheet" href="{asset('/css/site.css')}">
<link rel="stylesheet" href="{asset('/css/navigation.css')}">
{feature_styles}<link rel="stylesheet" href="/css/cookies.css">
<script src="/js/analytics.js" defer></script>
<script src="/js/cookie-banner.js" defer></script>
<script src="{asset('/js/navigation.js')}" defer></script>
<script type="application/ld+json">{dump({'@context':'https://schema.org','@graph':graph})}</script>
{preview_script}
</head>
<body class="{'home-page' if preview else 'inner-page'}">
<a class="skip-link" href="#main">{E(c['skip'])}</a>
{hero_atmosphere}{navigation(c,suffix,preview)}
<main id="main">{body}</main>
<footer class="footer wrap"><div><a class="brand" href="{url(lang)}"><img src="{asset('/images/icon.png')}" width="30" height="30" alt="">Wonderfall</a><p>{E(c['footer_line'])}</p></div>
<nav aria-label="{'Footer navigation' if lang=='en' else 'Навігація в підвалі'}"><a href="{url(lang,'blog/')}">{c['nav'][3]}</a><a href="{url(lang,'support/')}">{E(c['support'])}</a><a href="{url(lang,'privacy.html')}">{E(c['privacy'])}</a><button type="button" data-cookie-settings>{E(c['cookie_settings'])}</button><a href="mailto:hello@andrewsereda.com">{E(c['contact'])}</a><a href="https://x.com/andrew_sereda">X</a><a href="https://www.threads.com/@saintsereda">Threads</a></nav></footer>
</body></html>'''

def cta(c):
    return f'<section class="final-cta wrap"><p class="eyebrow">Wonderfall</p><h2>{E(c["cta_title"])}</h2><p>{E(c["cta_text"])}</p><a class="button" href="{STORE}">{E(c["download"])}</a><p class="compat">{E(c["compat"])}</p></section>'

def article_card(c):
    return f'<article class="article-card"><div class="article-art" aria-hidden="true"><span>❄</span><span>✿</span><span>✦</span></div><div><p class="eyebrow">{E(c["article_label"])} · {E(c["minutes"])}</p><h3><a href="{url(c["lang"],"blog/"+SLUG+"/")}">{E(c["article_title"])}</a></h3><p>{E(c["article_summary"])}</p><a class="text-link" href="{url(c["lang"],"blog/"+SLUG+"/")}">{E(c["read"])} <span aria-hidden="true">↗</span></a></div></article>'

def feature_icon(kind):
    paths={
        'snow':'<path d="M12 2v20M3.34 7l17.32 10M3.34 17 20.66 7M8.5 4.5 12 8l3.5-3.5M8.5 19.5 12 16l3.5 3.5M4.5 10l4.8-1.3L8 4M16 20l-1.3-4.7 4.8-1.3M4.5 14l4.8 1.3L8 20M16 4l-1.3 4.7 4.8 1.3"/>',
        'rain':'<path d="M6 14a4 4 0 1 1 .8-7.9A5 5 0 0 1 16.4 6 4 4 0 1 1 18 14M7 17l-1 3m6-3-1 3m6-3-1 3"/>',
        'leaves':'<path d="M20 3C9 2 3 7 4 14c1 7 12 8 15-2 1-3 1-6 1-9ZM3 22 16 8m-6 6V9m0 5h5"/>',
        'sun':'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
        'arrow':'<path d="M4 12h16m-5-5 5 5-5 5"/>',
        'clear':'<path d="m5 15 9-10a2 2 0 0 1 3 0l3 3a2 2 0 0 1 0 3l-9 9H8l-3-3a1.5 1.5 0 0 1 0-2Zm4-4 7 7M8 20h13"/>',
        'reset':'<path d="M4 11a8 8 0 1 1 2 6M4 4v7h7"/>',
    }
    return f'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{paths[kind]}</svg>'

def feature_showcase(c):
    f=c['showcase']
    def control(key,label,attribute,pressed=False,extra=''):
        return f'<button class="feature-control" type="button" {attribute}="{key}" aria-label="{E(label)}" title="{E(label)}" aria-pressed="{str(pressed).lower()}" {extra}>{feature_icon(key)}</button>'
    def copy(title,text,symbol=None):
        icon=f'<img class="feature-symbol" src="{asset("/images/features/symbols/"+symbol+".png")}" width="32" height="32" alt="">' if symbol else ''
        return f'<div class="feature-story__copy">{icon}<h3>{E(f[title])}</h3><p>{E(f[text])}</p></div>'
    weather_buttons=''.join(f'<button class="feature-choice" type="button" data-weather-choice="{mode}" data-description="{E(f["weather_"+mode+"_description"])}" aria-pressed="{str(mode=="snow").lower()}">{feature_icon("sun" if mode=="clear" else mode)}<span>{E(f["weather_"+mode])}</span></button>' for mode in ('snow','rain','clear'))
    cleaning_images={'snow':'/videos/snow-1440p.jpg','leaves':'/images/features/leaf-piles.jpg','rain':'/images/features/rain-droplets.jpg'}
    cleaning_buttons=''.join(control(key,f['cleaning_'+key],'data-cleaning-choice',key=='snow',f'data-source="{image}"') for key,image in cleaning_images.items())
    palettes=''.join(f'<button class="light-palette light-palette--{key}" type="button" data-light-palette="{key}" aria-label="{E(f["palette_"+key])}" title="{E(f["palette_"+key])}" aria-pressed="{str(key=="color").lower()}"><span></span><span></span><span></span></button>' for key in ('warm','color','ice'))
    snow=''.join('<span></span>' for _ in range(13))
    bulbs=''.join('<span></span>' for _ in range(11))
    return f'''<section class="feature-showcase" id="features" aria-labelledby="features-title"><div class="wrap">
<div class="feature-showcase__heading"><p class="eyebrow">{E(f['eyebrow'])}</p><h2 id="features-title">{E(f['title'])}</h2><p class="feature-showcase__note">{E(f['preview_note'])}</p></div>
<div class="feature-grid-primary">
<article class="feature-story feature-story--weather" data-feature="weather">
{copy('weather_title','weather_text')}
<div class="feature-story__visual weather-demo" data-weather-demo data-weather="snow">
<div class="feature-stage weather-demo__scene" role="img" aria-label="{E(f['weather_snow_description'])}" data-weather-scene>
<div class="weather-demo__outside"><span class="weather-demo__label">{E(f['weather_outside'])}</span><span data-weather-symbol>{feature_icon('snow')}</span></div>
<span class="weather-demo__arrow" aria-hidden="true">{feature_icon('arrow')}</span>
<div class="weather-demo__result"><span class="weather-demo__label">{E(f['weather_desktop'])}</span><div class="weather-demo__screen" aria-hidden="true"><div class="weather-demo__particles">{snow}</div></div></div>
</div><div class="feature-toolbar" role="group" aria-label="{E(f['weather_label'])}" data-demo-controls hidden>{weather_buttons}</div>
<p class="visually-hidden" data-weather-status aria-live="polite">{E(f['weather_snow_description'])}</p>
</div></article>
<article class="feature-story feature-story--cleaning" data-feature="cleaning">
{copy('cleaning_title','cleaning_text')}
<div class="feature-story__visual cleaning-demo" data-cleaning-demo data-cleaning-mode="snow" data-hint="{E(f['cleaning_hint'])}" data-cleared="{E(f['cleaning_cleared'])}">
<div class="feature-stage cleaning-demo__scene"><img src="/videos/snow-1440p.jpg" width="2560" height="1440" alt="" loading="lazy" data-cleaning-image><canvas data-cleaning-canvas aria-hidden="true"></canvas><p class="cleaning-demo__hint" data-cleaning-hint>{E(f['cleaning_hint'])}</p></div>
<div class="feature-toolbar" data-demo-controls hidden><div class="feature-tools" role="group" aria-label="{E(f['cleaning_label'])}">{cleaning_buttons}</div><span class="feature-toolbar__divider" aria-hidden="true"></span><button class="feature-control" type="button" data-cleaning-clear aria-label="{E(f['cleaning_clear'])}" title="{E(f['cleaning_clear'])}">{feature_icon('clear')}</button><button class="feature-control" type="button" data-cleaning-reset aria-label="{E(f['cleaning_reset'])}" title="{E(f['cleaning_reset'])}">{feature_icon('reset')}</button></div>
<p class="visually-hidden" data-cleaning-status aria-live="polite"></p>
</div></article>
<article class="feature-story feature-story--lights" data-feature="garlands">
{copy('garland_title','garland_text')}
<div class="feature-story__visual garland-demo" data-garland-demo data-palette="color" data-menu="true" data-dock="true">
<div class="feature-stage garland-demo__scene" aria-hidden="true"><div class="garland-demo__menu"><span>Wonderfall</span><span>◔ &nbsp; ▰ &nbsp; ◌</span></div><div class="garland-demo__strand garland-demo__strand--top">{bulbs}</div><div class="garland-demo__glow"></div><div class="garland-demo__dock"><i></i><i></i><i></i><i></i><i></i></div><div class="garland-demo__strand garland-demo__strand--dock">{bulbs}</div></div>
<div class="feature-toolbar feature-toolbar--lights" data-demo-controls hidden><div class="feature-tools"><button class="feature-choice" type="button" data-light-placement="menu" aria-pressed="true">{E(f['garland_menu'])}</button><button class="feature-choice" type="button" data-light-placement="dock" aria-pressed="true">{E(f['garland_dock'])}</button></div><div class="feature-tools" role="group" aria-label="{E(f['palette_label'])}">{palettes}</div></div>
</div></article>
</div>
<div class="feature-grid-secondary">
<article class="feature-story feature-story--compact feature-story--symbol" data-feature="images">
{copy('images_title','images_text','photo.on.rectangle.angled.fill')}</article>
<article class="feature-story feature-story--compact feature-story--symbol" data-feature="motion">
{copy('motion_title','motion_text','gear')}</article>
<article class="feature-story feature-story--compact" data-feature="placement">
<div class="feature-mini-visual placement-demo" data-placement-demo data-mode="over" data-area="full" role="img" aria-label="{E(f['placement_over_description'])}"><div class="placement-demo__window" aria-hidden="true"><div class="placement-demo__toolbar"><span></span><span></span><span></span></div><div class="placement-demo__content"><i></i><i></i><i></i></div></div><div class="placement-demo__snow" aria-hidden="true">{snow}</div></div>
{copy('placement_title','placement_text')}
<div class="placement-controls" data-demo-controls hidden><div class="placement-toggle" role="group" aria-label="{E(f['placement_title'])}" data-placement-toggle><button type="button" data-mode="over" data-description="{E(f['placement_over_description'])}" aria-pressed="true">{E(f['placement_over'])}</button><button type="button" data-mode="desktop" data-description="{E(f['placement_desktop_description'])}" aria-pressed="false">{E(f['placement_desktop'])}</button></div><label class="placement-strip"><input type="checkbox" data-placement-strip data-description="{E(f['placement_strip_description'])}" data-full-description="{E(f['placement_full_description'])}"><span>{E(f['placement_strip'])}</span></label></div><p class="visually-hidden" data-placement-status aria-live="polite">{E(f['placement_over_description'])}</p>
</article>
<article class="feature-story feature-story--compact" data-feature="displays">
<div class="feature-mini-visual displays-demo" role="img" aria-label="{E(f['displays_label'])}"><div class="displays-demo__monitor displays-demo__monitor--large"><div>{snow}</div></div><div class="displays-demo__monitor displays-demo__monitor--small"><div>{snow}</div></div></div>
{copy('displays_title','displays_text')}</article>
</div></div></section>'''

def product_overview(c):
    facts=''.join(f'<div><dt>{E(label)}</dt><dd>{E(value)}</dd></div>' for label,value in c['product_facts'])
    return f'''<section class="product-overview section wrap" aria-labelledby="product-title">
<div class="product-overview__copy"><p class="eyebrow">{E(c['product_kicker'])}</p><h2 id="product-title">{E(c['product_title'])}</h2><p>{E(c['product_summary'])}</p><a class="text-link" href="{url(c['lang'],'blog/'+SLUG+'/')}">{E(c['setup_link'])} <span aria-hidden="true">↗</span></a></div>
<div class="product-overview__details"><dl class="product-facts">{facts}</dl><p class="availability-note">{E(c['availability'])} <a href="{STORE}">{E(c['store_details'])} <span aria-hidden="true">↗</span></a></p></div></section>'''

def reviews_section(c):
    ui=c['reviews_ui']; cards=[]
    for review in STORE_DATA['reviews']:
        stars=''.join('<svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path d="m10 1.5 2.5 5.3 5.8.8-4.2 4.1 1 5.8L10 14.8l-5.1 2.7 1-5.8L1.7 7.6l5.8-.8Z"/></svg>' for _ in range(review['rating']))
        rating=ui['rating'].format(rating=review['rating'])
        ellipsis='…' if review['is_excerpt'] else ''
        cards.append(f'''<figure class="review-card" data-review-id="{review['id']}"><h3 lang="{review['language']}">{E(review['title'])}</h3><blockquote lang="{review['language']}" cite="{E(review['source'])}">{E(review['excerpt'])}{ellipsis}</blockquote><figcaption><div class="review-card__byline"><span>{E(review['author'])}</span><span class="review-card__stars" role="img" aria-label="{E(rating)}">{stars}</span></div><span class="review-card__source">App Store · {E(ui['country'])}</span></figcaption></figure>''')
    rating=STORE_DATA['ratings']
    value=f'{rating["value"]:.1f}'
    summary=ui['summary'].format(value=value.replace('.',',') if c['lang']=='uk' else value,count=rating['count'])
    return f'''<section class="reviews-section section" id="reviews" aria-labelledby="reviews-title" data-reviews>
<div class="reviews-heading wrap"><div><p class="eyebrow">{E(ui['eyebrow'])}</p><h2 id="reviews-title">{E(ui['title'])}</h2><a class="reviews-summary" href="{E(rating['source'])}" title="{E(ui['checked'].format(date=STORE_DATA['checked_at']))}"><span aria-hidden="true">★</span> {E(summary)} <span aria-hidden="true">↗</span></a></div><button class="reviews-pause" type="button" data-reviews-pause data-pause="{E(ui['pause'])}" data-play="{E(ui['play'])}" aria-label="{E(ui['pause'])}" aria-pressed="false" hidden><svg class="reviews-pause__stop" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M6 4h3v12H6zm5 0h3v12h-3z"/></svg><svg class="reviews-pause__play" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="m7 4 9 6-9 6z"/></svg></button></div>
<div class="reviews-marquee" data-reviews-marquee role="group" aria-labelledby="reviews-title" tabindex="0"><div class="reviews-track" data-reviews-track>{''.join(cards)}</div></div><p class="reviews-note wrap">{E(ui['note'])}</p></section>'''

def homepage(c):
    videos=json.loads((ROOT/'content/preview-videos.json').read_text())
    faq=''.join(f'<details><summary>{E(question)}</summary><p>{E(answer)}</p></details>' for question,answer in c['faq'])
    def media_attrs(key):
        values=videos[key]
        for path in values.values():
            if path:
                assert path.startswith('/') and (ROOT/path.lstrip('/')).is_file(), f'Missing preview media: {path}'
        return ''.join(f' data-{attribute}="{E(path)}"' for attribute,path in [('video',values['src']),('poster',values['poster'])] if path)
    buttons=''.join(f'<button class="theme-option theme-{key}" type="button" data-theme="{key}" data-description="{E(desc)}"{media_attrs(key)} aria-label="{E(name)}" aria-pressed="{"true" if key=="snow" else "false"}"><span class="theme-symbol" aria-hidden="true">{glyph}</span><span class="theme-name">{E(name)}</span></button>' for key,name,desc,glyph in c['themes'][:5])
    hero=f'<h1 class="hero__title">{E(c["hero_headline"])}</h1>'
    release=E(c['release_badge'].format(version=c['release_version']))
    steps=''.join(f'<li><span aria-hidden="true">0{i}</span><h3>{E(title)}</h3><p>{E(text)}</p></li>' for i,(title,text) in enumerate(c['steps'],1))
    body=f'''<section class="hero hero-with-preview"><div class="wrap hero__inner"><a class="release-pill" href="{STORE}"><span class="release-pill__text">{release}</span><svg class="release-pill__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a>{hero}<p class="hero-copy">{E(c['intro'])}</p><div class="hero-actions"><a class="button" href="{STORE}">{E(c['download'])}</a></div><p class="compat">{E(c['compat'])}</p></div></section>
<section class="seasons-preview wrap" id="effects" aria-label="{E(c['screen_label'])}"><div class="preview video-preview" data-preview data-effect="snow"><div class="preview-media" role="group" aria-label="{E(c['screen_label'])}"><video class="effect-video" data-effect-video src="{E(videos['snow']['src'] or '')}" poster="{E(videos['snow']['poster'] or '')}" muted loop playsinline preload="none" controls aria-label="{E(c['screen_label'])}"></video><div class="video-placeholder" data-video-placeholder hidden><span class="video-placeholder-mark" aria-hidden="true">▶</span><p class="video-placeholder-caption" data-video-caption>{E(c['themes'][0][1])}</p></div><button class="preview-pause" type="button" data-preview-pause data-pause="{E(c['pause'])}" data-play="{E(c['play'])}" aria-label="{E(c['pause'])}" aria-pressed="false" hidden><svg class="preview-pause__pause" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 5v14m6-14v14"/></svg><svg class="preview-pause__play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m9 5 11 7-11 7Z"/></svg></button></div><div class="control-panel" hidden><div class="theme-picker" role="group" aria-label="{E(c['preview_label'])}" hidden>{buttons}</div><p class="visually-hidden" data-theme-description aria-live="polite">{E(c['themes'][0][2])}</p></div></div></section>
{product_overview(c)}
{feature_showcase(c)}
{reviews_section(c)}
<section class="setup-section section wrap" aria-labelledby="setup-title"><h2 id="setup-title">{E(c['steps_title'])}</h2><ol class="steps">{steps}</ol></section>
<section class="section faq-section wrap" id="faq"><div><p class="eyebrow">{E(c['faq_kicker'])}</p><h2>{E(c['faq_title'])}</h2><a class="text-link" href="{url(c['lang'],'support/')}">{E(c['support'])} ↗</a></div><div class="faq-list">{faq}</div></section>
<section class="section wrap"><p class="eyebrow">{E(c['blog_kicker'])}</p><h2>{E(c['blog_title'])}</h2>{article_card(c)}</section>{cta(c)}'''
    faq_schema={'@type':'FAQPage','@id':ORIGIN+url(c['lang'])+'#faq','inLanguage':c['lang'],
                'mainEntity':[{'@type':'Question','name':q,'acceptedAnswer':{'@type':'Answer','text':a}} for q,a in c['faq']]}
    return page(c,'',c['title'],c['description'],body,[app_schema(c),faq_schema],preview=True)

def write(path,content):
    target=ROOT/path.lstrip('/')
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(content,encoding='utf-8')

ET.register_namespace('', 'http://www.sitemaps.org/schemas/sitemap/0.9')
ET.register_namespace('xhtml', 'http://www.w3.org/1999/xhtml')
ns='{http://www.sitemaps.org/schemas/sitemap/0.9}'
sitemap=ET.Element(ns+'urlset')
for lang in LANGS:
    c=json.loads((ROOT/'content'/f'{lang}.json').read_text())
    substitutions={'store_name':STORE_DATA['name'],'version':STORE_DATA['version'],
                   'minimum_os':STORE_DATA['minimum_os'],'us_price':f'US${STORE_DATA["offer"]["price"]:.2f}'}
    c['release_version']=STORE_DATA['version']
    for key in ('availability','released_description','compat'):
        c[key]=c[key].format(**substitutions)
    c['product_facts']=[[label,value.format(**substitutions)] for label,value in c['product_facts']]
    c['faq']=[[question,answer.format(**substitutions)] for question,answer in c['faq']]
    c['support_intro']=c['support_intro'].format(**substitutions)
    c['support_sections']=[[title,text.format(**substitutions)] for title,text in c['support_sections']]
    write(url(lang,'index.html'),homepage(c))
    collection={'@type':'CollectionPage','@id':ORIGIN+url(lang,'blog/')+'#collection','name':c['blog_meta_title'],'hasPart':{'@id':ORIGIN+url(lang,'blog/'+SLUG+'/')+'#article'}}
    body=f'<section class="page-heading wrap"><p class="eyebrow">{E(c["blog_kicker"])}</p><h1>{E(c["blog_title"])}</h1><p>{E(c["blog_intro"])}</p></section><section class="wrap blog-list">{article_card(c)}<p><a class="text-link" href="{url(lang,"blog/feed.xml")}">RSS ↗</a></p></section>'+cta(c)
    write(url(lang,'blog/index.html'),page(c,'blog/',c['blog_meta_title'],c['blog_description'],body,[collection]))
    article_url=ORIGIN+url(lang,'blog/'+SLUG+'/')
    article_schema={'@type':'BlogPosting','@id':article_url+'#article','headline':c['article_title'],
        'description':c['article_description'],'datePublished':DATE+'T09:00:00+02:00','dateModified':UPDATED+'T09:00:00+02:00',
        'inLanguage':lang,'author':{'@id':ORIGIN+'/#andrew'},'publisher':{'@type':'Organization','name':'Wonderfall','url':ORIGIN+'/'},
        'mainEntityOfPage':{'@id':article_url+'#page'},'image':ORIGIN+'/images/wonderfall-icon.png'}
    breadcrumb={'@type':'BreadcrumbList','itemListElement':[
        {'@type':'ListItem','position':1,'name':'Wonderfall','item':ORIGIN+url(lang)},
        {'@type':'ListItem','position':2,'name':c['nav'][3],'item':ORIGIN+url(lang,'blog/')},
        {'@type':'ListItem','position':3,'name':c['article_title'],'item':article_url}]}
    article=(ROOT/'content/articles'/f'{lang}.html').read_text().replace('__HOME__',url(lang)).replace('__STORE_NAME__',E(STORE_DATA['name']))
    # Derive read time from actual content rather than a fixed estimate.
    words=len(re.sub('<[^>]+>',' ',article).split()); minutes=max(1,(words+179)//180)
    read_time=f'{minutes} minute read' if lang=='en' else f'{minutes} хв читання'
    body=f'<article class="prose wrap"><nav class="breadcrumbs" aria-label="{"Breadcrumb" if lang=="en" else "Шлях до сторінки"}"><a href="{url(lang)}">Wonderfall</a> / <a href="{url(lang,"blog/")}">{c["nav"][3]}</a></nav><p class="eyebrow">{E(c["article_label"])}</p><h1>{E(c["article_title"])}</h1><p class="byline">{E(c["author"])}</p><p class="byline"><time datetime="{DATE}">{E(c["published"])}</time> · {read_time} · {E(c["updated_label"])} <time datetime="{UPDATED}">{E(c["updated_date"])}</time></p><p class="release-notice">{E(c["availability"])}</p>{article}<p><a class="text-link" href="{url(lang,"blog/")}">← {E(c["all_posts"])}</a></p></article>'+cta(c)
    write(url(lang,'blog/'+SLUG+'/index.html'),page(c,'blog/'+SLUG+'/',c['article_meta_title'],c['article_description'],body,[article_schema,breadcrumb],article=True))
    sections=''.join(f'<section><h2>{E(title)}</h2><p>{E(text)}</p></section>' for title,text in c['support_sections'])
    body=f'<div class="prose wrap"><p class="eyebrow">{E(c["support"])}</p><h1>{E(c["support_title"])}</h1><p class="answer">{E(c["support_intro"])}</p><p class="release-notice">{E(c["availability"])}</p>{sections}<p><a class="button" href="mailto:hello@andrewsereda.com">{E(c["contact"])}</a></p></div>'
    write(url(lang,'support/index.html'),page(c,'support/',c['support_title'],c['support_description'],body))
    # Generate both policies from the same template and localized privacy source.
    privacy=json.loads((ROOT/'content/privacy.json').read_text())[lang]
    def get(key):
        value=privacy
        for part in key.split('.')[1:]:
            value=value[int(part)] if isinstance(value,list) else value[part]
        return value
    policy=(ROOT/'content/privacy-template.html').read_text()
    policy=re.sub(r'<(h1|h2|p|li|strong)([^>]*data-i18n="(privacy\.[^"]+)"[^>]*)>.*?</\1>',lambda m:f'<{m[1]}>{E(get(m[3]))}</{m[1]}>',policy,flags=re.S)
    policy=re.sub(r'<a([^>]*?) data-i18n="(privacy\.[^"]+)"([^>]*)>.*?</a>',lambda m:f'<a{m[1]}{m[3]}>{E(get(m[2]))}</a>',policy,flags=re.S)
    privacy_description='How Wonderfall handles local app data, optional location and Apple WeatherKit, website analytics and cookie choices.' if lang=='en' else 'Як Wonderfall зберігає локальні дані, використовує необов’язкову геолокацію й Apple WeatherKit, аналітику сайту та cookie за вашою згодою.'
    write(url(lang,'privacy.html'),page(c,'privacy.html',privacy['pageTitle'],privacy_description,'<div class="prose wrap">'+policy+'</div>'))
    rss=ET.Element('rss',version='2.0'); channel=ET.SubElement(rss,'channel')
    for name,text in [('title','Wonderfall Blog'),('link',ORIGIN+url(lang,'blog/')),('description',c['blog_description']),('language',lang)]:
        ET.SubElement(channel,name).text=text
    item=ET.SubElement(channel,'item')
    for name,text in [('title',c['article_title']),('link',article_url),('guid',article_url),('description',c['article_description']),('pubDate','Mon, 05 Oct 2026 07:00:00 GMT')]:
        ET.SubElement(item,name).text=text
    write(url(lang,'blog/feed.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n'+ET.tostring(rss,encoding='unicode'))
    for suffix in ('','blog/','blog/'+SLUG+'/','support/','privacy.html'):
        entry=ET.SubElement(sitemap,ns+'url'); ET.SubElement(entry,ns+'loc').text=ORIGIN+url(lang,suffix); ET.SubElement(entry,ns+'lastmod').text=UPDATED
        for alternate in (*LANGS,'x-default'):
            ET.SubElement(entry,'{http://www.w3.org/1999/xhtml}link',rel='alternate',hreflang=alternate,href=ORIGIN+url('en' if alternate=='x-default' else alternate,suffix))
write('/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n'+ET.tostring(sitemap,encoding='unicode')+'\n')
write('/robots.txt','User-agent: *\nAllow: /\nDisallow: /content/\nDisallow: /scripts/\n\nSitemap: '+ORIGIN+'/sitemap.xml\n')
write('/llms.txt',(ROOT/'content/llms-template.txt').read_text().format(origin=ORIGIN,**substitutions,checked_at=STORE_DATA['checked_at']))
write('/download.html',(ROOT/'content/download-template.html').read_text().replace('__ORIGIN__',ORIGIN))
print('Generated 11 static pages, 2 RSS feeds, sitemap.xml, robots.txt and llms.txt.')

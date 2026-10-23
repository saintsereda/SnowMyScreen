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

def brand_icon():
    return (f'<span class="brand-icon" aria-hidden="true">'
            f'<img class="brand-icon__background" src="{asset("/images/brand/background.png")}" width="256" height="256" alt="">'
            f'<img class="brand-icon__star" src="{asset("/images/brand/star.svg")}" width="256" height="256" alt="">'
            f'</span>')

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
            'description':c['released_description'],
            'featureList':c['released_features'],'author':{'@id':ORIGIN+'/#andrew'},
            'offers':{'@type':'Offer','url':STORE_DATA['offer']['url'],
                      'price':STORE_DATA['offer']['price'],'priceCurrency':STORE_DATA['offer']['currency']}}

def navigation(c, suffix='', preview=False):
    lang=c['lang']; ui=c['navigation_ui']
    links=''.join(f'<a href="{url(lang)}#{anchor}">{E(label)}</a>' for anchor,label in zip(('effects','features','faq'),c['nav'][:3]))
    current=' aria-current="page"' if suffix=='blog/' else ''
    links+=f'<a href="{url(lang,"blog/")}"{current}>{E(c["nav"][3])}</a>'
    mobile_items=[(f'{url(lang)}#{anchor}',label,'') for anchor,label in zip(('effects','features','faq'),c['nav'][:3])]
    mobile_items.extend([(url(lang,'blog/'),c['nav'][3],current),(STORE,c['short_cta'],'')])
    mobile_links=''.join(f'<li class="pill-col"><a class="pill-link" href="{href}"{state}><span class="pill-label">{E(label)}</span></a></li>' for href,label,state in mobile_items)
    languages=''.join(f'<a href="{url(locale,suffix)}" lang="{locale}" hreflang="{locale}"'+(' aria-current="page"' if locale==lang else '')+f'>{label}</a>' for locale,label in (('en','English'),('uk','Українська')))
    return f'''<header class="site-navigation{' has-hero' if preview else ''}" data-site-navigation data-nav-motion="{asset('/js/mobile-menu.js')}">
<nav class="site-navigation__capsule" aria-label="{E(ui['main'])}">
<a class="site-navigation__brand" href="{url(lang)}" aria-label="Wonderfall — {E(ui['home'])}" data-brand-link>{brand_icon()}<span class="site-navigation__wordmark">Wonderfall</span></a>
<div class="site-navigation__links">{links}</div>
<button class="site-navigation__toggle" type="button" data-nav-toggle hidden aria-label="{E(ui['menu'])}" aria-expanded="false" aria-controls="site-mobile-menu"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path class="nav-menu-lines" d="M3 5h14M3 10h14M3 15h14"/><path class="nav-menu-close" d="m5 5 10 10M15 5 5 15"/></svg></button>
<a class="site-navigation__download" href="{STORE}"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.05 12.536c.027 3.143 2.757 4.188 2.787 4.2-.023.074-.436 1.49-1.438 2.952-.866 1.264-1.765 2.523-3.18 2.55-1.39.026-1.838-.824-3.428-.824-1.589 0-2.086.798-3.402.85-1.366.052-2.406-1.366-3.28-2.625-1.785-2.576-3.149-7.28-1.317-10.455.91-1.576 2.536-2.574 4.3-2.6 1.344-.026 2.612.902 3.429.902.816 0 2.349-1.115 3.956-.951.672.028 2.56.271 3.773 2.047-.098.061-2.253 1.31-2.2 3.954ZM14.453 4.93c.726-.879 1.214-2.102 1.08-3.32-1.047.042-2.313.698-3.064 1.577-.673.777-1.263 2.022-1.104 3.216 1.167.09 2.36-.593 3.088-1.473Z"/></svg>{E(c['short_cta'])}</a>
</nav>
<details class="site-navigation__language" data-nav-language><summary class="site-navigation__round" aria-label="{E(ui['language'])}: {lang.upper()}" aria-expanded="false">{lang.upper()}</summary><div class="site-navigation__languages">{languages}</div></details>
<div class="site-navigation__mobile bubble-menu-items" id="site-mobile-menu" data-nav-menu hidden><nav aria-label="{E(ui['sections'])}"><ul class="pill-list">{mobile_links}</ul></nav></div>
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
    feature_styles=''.join(f'<link rel="stylesheet" href="{asset(path)}">\n' for path in ('/css/features.css','/css/desktop-preview.css','/css/weather-switch.css')) if preview else ''
    hero_atmosphere='<div class="hero-atmosphere" aria-hidden="true"></div>\n' if preview else ''
    shooting_stars='<div class="shooting-stars" data-shooting-stars aria-hidden="true"></div>' if preview else ''
    preview_script=''.join(f'<script src="{asset(path)}" defer></script>' for path in ('/js/preview.js','/js/weather-switch.js','/js/preview-perspective.js','/js/features.js','/js/shooting-star.js','/js/reviews.js','/js/faq.js')) if preview else ''
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
<link rel="stylesheet" href="{asset('/css/site.css')}">
<link rel="stylesheet" href="{asset('/css/navigation.css')}">
<link rel="stylesheet" href="{asset('/css/brand-icon.css')}">
{feature_styles}<link rel="stylesheet" href="/css/cookies.css">
<script src="/js/analytics.js" defer></script>
<script src="/js/cookie-banner.js" defer></script>
<script src="{asset('/js/navigation.js')}" defer></script>
<script src="{asset('/js/brand-icon.js')}" defer></script>
<script type="application/ld+json">{dump({'@context':'https://schema.org','@graph':graph})}</script>
{preview_script}
</head>
<body class="{'home-page' if preview else 'inner-page'}">
<a class="skip-link" href="#main">{E(c['skip'])}</a>
{hero_atmosphere}{navigation(c,suffix,preview)}
<main id="main">{shooting_stars}{body}</main>
<footer class="footer wrap"><div><a class="brand" href="{url(lang)}" data-brand-link>{brand_icon()}Wonderfall</a><p>{E(c['footer_line'])}</p></div>
<nav aria-label="{'Footer navigation' if lang=='en' else 'Навігація в підвалі'}"><a href="{url(lang,'blog/')}">{c['nav'][3]}</a><a href="{url(lang,'support/')}">{E(c['support'])}</a><a href="{url(lang,'privacy.html')}">{E(c['privacy'])}</a><button type="button" data-cookie-settings>{E(c['cookie_settings'])}</button><a href="mailto:hello@andrewsereda.com">{E(c['contact'])}</a><a href="https://x.com/andrew_sereda">X</a><a href="https://www.threads.com/@saintsereda">Threads</a></nav></footer>
</body></html>'''

def cta(c):
    return f'<section class="final-cta wrap"><h2>{E(c["cta_title"])}</h2><p>{E(c["cta_text"])}</p><a class="button" href="{STORE}">{E(c["download"])}</a><p class="compat">{E(c["compat"])}</p></section>'

def article_card(c):
    return f'<article class="article-card"><div class="article-art" aria-hidden="true"><span>❄</span><span>✿</span><span>✦</span></div><div><h3><a href="{url(c["lang"],"blog/"+SLUG+"/")}">{E(c["article_title"])}</a></h3><p>{E(c["article_summary"])}</p><a class="text-link" href="{url(c["lang"],"blog/"+SLUG+"/")}">{E(c["read"])} <span aria-hidden="true">↗</span></a></div></article>'

MENU_EFFECT_SYMBOLS = {'snow':'snowflake', 'rain':'cloud.rain', 'leaves':'leaf',
                       'petals':'camera.macro', 'fireflies':'sparkles'}

def menu_symbol_asset(symbol):
    return asset('/images/menu-bar/'+symbol+'.png')

def desktop_menu_bar(app_symbol='snowflake'):
    """Native SF Symbols exported by export_menu_bar_symbols.swift, with AppDelegate's effect icons."""
    def icon(symbol, role, app=False):
        data=(ROOT/'images/menu-bar'/f'{symbol}.png').read_bytes()
        width=int.from_bytes(data[16:20], 'big'); height=int.from_bytes(data[20:24], 'big')
        classes='desktop-menu__apple' if role=='apple' else 'desktop-menu__icon desktop-menu__icon--'+role
        extra=' data-desktop-app-icon' if app else ''
        return f'<img class="{classes}" src="{menu_symbol_asset(symbol)}" width="{width}" height="{height}" alt=""{extra}>'
    status=''.join(icon(symbol,role) for symbol,role in (
        ('wifi','wifi'),('speaker.wave.2.fill','volume'),('battery.100percent','battery'),
        ('magnifyingglass','spotlight'),('switch.2','control-center')))
    return f'<div class="desktop-menu" aria-hidden="true">{icon("apple.logo","apple")}<div class="desktop-menu__status"><span class="desktop-menu__app">{icon(app_symbol,"effect",True)}</span>{status}</div></div>'

def feature_showcase(c):
    f=c['showcase']
    media=json.loads((ROOT/'content/feature-media.json').read_text())
    primary=(('cleaning','cleaning'),('garlands','garland'),('images','images'),('placement','placement'))
    assert set(media)=={key for key,_ in primary}, 'Configure the four feature media slots.'

    def symbol(name, classes):
        return f'<img class="{classes}" src="{asset("/images/features/symbols/"+name+".png")}" width="32" height="32" alt="" decoding="async">'

    variants={
        'cleaning':(('snow','cleaning_snow'),('leaves','cleaning_leaves'),('rain','cleaning_rain')),
        'garlands':tuple((scene,'scene_'+scene) for scene in ('winterNight','cozyEvening','springBloom','celebration')),
    }
    for key, choices in variants.items():
        assert set(media[key])=={name for name,_ in choices}, f'{key}: configure every choice.'
        for name,_ in choices:
            entry=media[key][name]
            assert set(entry)=={'src','poster'}, f'{key}.{name}: use src and poster.'
            for field,path in entry.items():
                assert isinstance(path,str), f'{key}.{name}.{field}: use a local path or empty string.'
                if path:
                    assert path.startswith('/') and (ROOT/path.lstrip('/')).is_file(), f'Missing {key}.{name} media: {path}'
    assert media['images']==media['placement']=={'type':'interactive'}

    def switcher(key, choices, label, selected):
        buttons=[]
        for name,text_key in choices:
            entry=media[key][name]
            paths=''.join(f' data-{field}="{E(asset(path) if path else "")}"' for field,path in entry.items())
            alt_key=('garland' if key=='garlands' else 'cleaning')+'_'+name+'_alt'
            alt=f' data-alt="{E(f[alt_key])}"' if key in ('cleaning','garlands') else ''
            tool={'snow':'shovel','leaves':'broom','rain':'squeegee'}.get(name) if key=='cleaning' else None
            icon=f'<img class="feature-tool-icon" src="{asset("/images/features/tools/"+tool+".png")}" alt="" width="64" height="64" loading="lazy" decoding="async">' if tool else ''
            buttons.append(f'<button type="button" data-feature-choice="{name}"{paths}{alt} aria-pressed="{str(name==selected).lower()}">{icon}<span>{E(f[text_key])}</span></button>')
        classes='feature-switcher feature-switcher--tools' if key=='cleaning' else 'feature-switcher'
        return f'<div class="{classes}" role="group" aria-label="{E(f[label])}">{"".join(buttons)}</div>'

    def pause_button(attribute, hidden=False):
        return f'<button class="feature-media__pause" type="button" {attribute} data-play="{E(c["play"])}" data-pause="{E(c["pause"])}" aria-label="{E(c["pause"])}" aria-pressed="false"{" hidden" if hidden else ""}><svg class="feature-media__pause-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 5v14m6-14v14"/></svg><svg class="feature-media__play-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m9 5 11 7-11 7Z"/></svg></button>'

    def video_content(key, prefix):
        first=variants[key][0][0]
        entry=media[key][first]
        poster=entry['poster']
        src=entry['src']
        alt=f['cleaning_snow_alt'] if key=='cleaning' else f['garland_winterNight_alt']
        preview=''
        if key=='garlands':
            bulbs=''.join(f'<span style="--bulb:{index}" aria-hidden="true"></span>' for index in range(16))
            preview=f'<div class="garland-preview" data-garland-preview data-scene="{first}" aria-hidden="true"{" hidden" if src else ""}><div class="garland-preview__wallpaper"></div><div class="garland-preview__lights">{bulbs}</div></div>'
        image=f'<img class="feature-media__image" data-feature-image src="{asset(poster)}" alt="{E(alt)}" loading="lazy" decoding="async"' + ('' if poster and not src else ' hidden') + '>' if key=='cleaning' else ''
        video=f'<video class="feature-media__video" data-feature-video{f" src={chr(34)}{asset(src)}{chr(34)}" if src else ""}{f" poster={chr(34)}{asset(poster)}{chr(34)}" if poster else ""} muted loop playsinline preload="none" controls aria-label="{E(alt)}"' + ('' if src else ' hidden') + '></video>'
        return preview+image+video+pause_button('data-feature-pause',True)+(pause_button('data-demo-pause',bool(src)) if key=='garlands' else '')

    def custom_content():
        return f'<div class="custom-preview" data-custom-preview><div class="custom-preview__wallpaper" aria-hidden="true"></div><canvas data-custom-canvas aria-label="{E(f["images_media_alt"])}"></canvas><div class="custom-preview__drop" aria-hidden="true">{symbol("photo.on.rectangle.angled.fill","feature-media__symbol")}<span>{E(f["image_drop"])}</span></div></div>'+pause_button('data-demo-pause')

    def placement_content():
        snow=''.join(f'<span style="--flake:{index};--x:{(index*37)%97}%" aria-hidden="true">✻</span>' for index in range(26))
        return f'<div class="placement-preview" data-placement-preview data-layer="over" role="img" aria-label="{E(f["placement_over_description"])}"><div class="placement-preview__wallpaper"></div><div class="placement-preview__snow">{snow}</div><div class="placement-preview__window placement-preview__window--back"><span></span><i></i><i></i><i></i></div><div class="placement-preview__window placement-preview__window--front"><span></span><i></i><i></i><i></i></div></div>'+pause_button('data-demo-pause')

    def media_slot(key, prefix):
        content=video_content(key,prefix) if key in variants else custom_content() if key=='images' else placement_content()
        app_symbol={'garlands':'lightbulb','images':'sparkles','placement':'switch.2'}.get(key)
        desktop=' desktop-screen desktop-screen--compact' if app_symbol else ''
        menu=desktop_menu_bar(app_symbol) if app_symbol else ''
        return f'<div class="feature-media feature-media--{key}{desktop}" data-feature-media="{key}" data-feature-media-state="{"video" if key in variants and media[key][variants[key][0][0]]["src"] else "interactive" if key not in variants else "preview"}">{menu}<div class="feature-media__viewport">{content}</div></div>'

    def controls(key):
        if key=='cleaning': return switcher(key,variants[key],'cleaning_label','snow')
        if key=='garlands': return switcher(key,variants[key],'garland_scenes_label','winterNight')
        if key=='images':
            motion=tuple((name,'image_motion_'+name) for name in ('snow','leaves','rain'))
            buttons=''.join(f'<button type="button" data-custom-motion="{name}" aria-pressed="{str(name=="snow").lower()}">{E(f[text_key])}</button>' for name,text_key in motion)
            return f'<div class="feature-controls"><label class="feature-upload"><input type="file" accept="image/png,image/jpeg,image/webp" data-custom-file><span>{E(f["image_choose"])}</span></label><div class="feature-switcher" role="group" aria-label="{E(f["image_motion_label"])}">{buttons}</div><span class="visually-hidden" data-custom-status data-error="{E(f["image_file_error"])}" data-ready="{E(f["image_ready"])}" role="status"></span></div>'
        choices=(('over','placement_over'),('desktop','placement_desktop'))
        buttons=''.join(f'<button type="button" data-placement-choice="{name}" data-description="{E(f["placement_"+name+"_description"])}" aria-pressed="{str(name=="over").lower()}">{E(f[text_key])}</button>' for name,text_key in choices)
        return f'<div class="feature-switcher" role="group" aria-label="{E(f["placement_label"])}">{buttons}</div>'

    stories=''.join(f'<article class="feature-story" data-feature="{key}" data-feature-presentation="media"><div class="feature-story__visual">{media_slot(key,prefix)}{controls(key) if key!="cleaning" else ""}</div><div class="feature-story__copy"><h3>{E(f[prefix+"_title"])}</h3><p>{E(f[prefix+"_text"])}</p>{controls(key) if key=="cleaning" else ""}</div></article>' for key,prefix in primary)
    points=''.join(f'<li class="feature-point" data-feature="{key}" data-feature-presentation="point"><span class="feature-point__tile" aria-hidden="true">{symbol(icon,"feature-point__icon")}</span><div><h3>{E(f[key+"_title"])}</h3><p>{E(f[key+"_text"])}</p></div></li>' for key,icon in (('weather','cloud.sun'),('displays','desktopcomputer.and.macbook'),('motion','gear')))
    return f"""<section class="feature-showcase" id="features" aria-labelledby="features-title"><div class="wrap">
<div class="feature-showcase__heading"><h2 id="features-title">{E(f['title'])}</h2></div>
<ul class="feature-points">{points}</ul>
<div class="feature-stories">{stories}</div>
</div></section>"""

def product_overview(c):
    facts=''.join(f'<div><dt>{E(label)}</dt><dd>{E(value)}</dd></div>' for label,value in c['product_facts'])
    return f'''<section class="product-overview section wrap" aria-labelledby="product-title">
<div class="product-overview__copy"><h2 id="product-title">{E(c['product_title'])}</h2><p>{E(c['product_summary'])}</p><a class="text-link" href="{url(c['lang'],'blog/'+SLUG+'/')}">{E(c['setup_link'])} <span aria-hidden="true">↗</span></a></div>
<div class="product-overview__details"><dl class="product-facts">{facts}</dl></div></section>'''

def reviews_section(c):
    ui=c['reviews_ui']; cards=[]
    for review in STORE_DATA['reviews']:
        stars=''.join('<svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path d="m10 1.5 2.5 5.3 5.8.8-4.2 4.1 1 5.8L10 14.8l-5.1 2.7 1-5.8L1.7 7.6l5.8-.8Z"/></svg>' for _ in range(review['rating']))
        rating=ui['rating'].format(rating=review['rating'])
        ellipsis='…' if review['is_excerpt'] else ''
        title=re.sub(r'(?<!\d)\.|\.(?!\d)|…','',review['title'])
        cards.append(f'''<figure class="review-card" data-review-id="{review['id']}"><h3 lang="{review['language']}">{E(title)}</h3><blockquote lang="{review['language']}" cite="{E(review['source'])}">{E(review['excerpt'])}{ellipsis}</blockquote><figcaption><div class="review-card__byline"><span>{E(review['author'])}</span><span class="review-card__stars" role="img" aria-label="{E(rating)}">{stars}</span></div><span class="review-card__source">App Store · {E(ui['country'])}</span></figcaption></figure>''')
    rating=STORE_DATA['ratings']
    value=f'{rating["value"]:.1f}'
    summary=ui['summary'].format(value=value.replace('.',',') if c['lang']=='uk' else value,count=rating['count'])
    return f'''<section class="reviews-section section" id="reviews" aria-labelledby="reviews-title" data-reviews>
<div class="reviews-heading wrap"><div><h2 id="reviews-title">{E(ui['title'])}</h2><a class="reviews-summary" href="{E(rating['source'])}" title="{E(ui['checked'].format(date=STORE_DATA['checked_at']))}"><span aria-hidden="true">★</span> {E(summary)} <span aria-hidden="true">↗</span></a></div></div>
<div class="reviews-marquee" data-reviews-marquee role="group" aria-labelledby="reviews-title" tabindex="0"><div class="reviews-track" data-reviews-track>{''.join(cards)}</div></div></section>'''

def homepage(c):
    videos=json.loads((ROOT/'content/preview-videos.json').read_text())
    faq=''.join(f'<details><summary><span>{E(question)}</span><svg class="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></summary><div class="faq-answer"><p>{E(answer)}</p></div></details>' for question,answer in c['faq'])
    def media_attrs(key):
        values=videos[key]
        for path in values.values():
            if path:
                assert path.startswith('/') and (ROOT/path.lstrip('/')).is_file(), f'Missing preview media: {path}'
        return ''.join(f' data-{attribute}="{E(path)}"' for attribute,path in [('video',values['src']),('poster',values['poster'])] if path)+f' data-menu-icon="{menu_symbol_asset(MENU_EFFECT_SYMBOLS[key])}"'
    buttons=''.join(f'<button class="theme-option theme-{key}" type="button" data-theme="{key}" data-description="{E(desc)}"{media_attrs(key)} aria-label="{E(name)}" aria-pressed="{"true" if key=="snow" else "false"}"><span class="theme-symbol" aria-hidden="true">{glyph}</span><span class="theme-name">{E(name)}</span></button>' for key,name,desc,glyph in c['themes'][:5])
    hero=f'<h1 class="hero__title">{E(c["hero_headline"])}</h1>'
    body=f'''<section class="hero hero-with-preview"><div class="wrap hero__inner">{hero}<p class="hero-copy">{E(c['intro'])}</p><div class="hero-actions"><a class="button" href="{STORE}">{E(c['download'])}</a></div><p class="compat">{E(c['compat'])}</p></div></section>
<section class="seasons-preview wrap" id="effects" aria-label="{E(c['screen_label'])}"><div class="preview video-preview" data-preview data-effect="snow"><div class="preview-media desktop-screen desktop-screen--video" role="group" aria-label="{E(c['screen_label'])}">{desktop_menu_bar()}<video class="effect-video desktop-screen__recording" data-effect-video src="{E(videos['snow']['src'] or '')}" poster="{E(videos['snow']['poster'] or '')}" muted loop playsinline preload="none" controls aria-label="{E(c['screen_label'])}"></video><div class="video-placeholder" data-video-placeholder hidden><span class="video-placeholder-mark" aria-hidden="true">▶</span><p class="video-placeholder-caption" data-video-caption>{E(c['themes'][0][1])}</p></div><button class="preview-pause" type="button" data-preview-pause data-pause="{E(c['pause'])}" data-play="{E(c['play'])}" aria-label="{E(c['pause'])}" aria-pressed="false" hidden><svg class="preview-pause__pause" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 5v14m6-14v14"/></svg><svg class="preview-pause__play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m9 5 11 7-11 7Z"/></svg></button></div><div class="control-panel" hidden><div class="theme-picker" data-weather-switch role="group" aria-label="{E(c['preview_label'])}" hidden>{buttons}</div><p class="visually-hidden" data-theme-description aria-live="polite">{E(c['themes'][0][2])}</p></div></div></section>
{feature_showcase(c)}
{reviews_section(c)}
<div class="faq-region"><section class="section faq-section wrap" id="faq"><div><h2>{E(c['faq_title'])}</h2><a class="text-link" href="{url(c['lang'],'support/')}">{E(c['support'])} ↗</a></div><div class="faq-list">{faq}</div></section></div>
{product_overview(c)}
<section class="section wrap"><h2>{E(c['blog_title'])}</h2>{article_card(c)}</section>{cta(c)}'''
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
    for key in ('released_description','compat'):
        c[key]=c[key].format(**substitutions)
    c['product_facts']=[[label,value.format(**substitutions)] for label,value in c['product_facts']]
    c['faq']=[[question,answer.format(**substitutions)] for question,answer in c['faq']]
    c['support_intro']=c['support_intro'].format(**substitutions)
    c['support_sections']=[[title,text.format(**substitutions)] for title,text in c['support_sections']]
    write(url(lang,'index.html'),homepage(c))
    collection={'@type':'CollectionPage','@id':ORIGIN+url(lang,'blog/')+'#collection','name':c['blog_meta_title'],'hasPart':{'@id':ORIGIN+url(lang,'blog/'+SLUG+'/')+'#article'}}
    body=f'<section class="page-heading wrap"><h1>{E(c["blog_title"])}</h1><p>{E(c["blog_intro"])}</p></section><section class="wrap blog-list">{article_card(c)}<p><a class="text-link" href="{url(lang,"blog/feed.xml")}">RSS ↗</a></p></section>'+cta(c)
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
    article=(ROOT/'content/articles'/f'{lang}.html').read_text().replace('__HOME__',url(lang))
    # Derive read time from actual content rather than a fixed estimate.
    words=len(re.sub('<[^>]+>',' ',article).split()); minutes=max(1,(words+179)//180)
    read_time=f'{minutes} minute read' if lang=='en' else f'{minutes} хв читання'
    body=f'<article class="prose wrap"><nav class="breadcrumbs" aria-label="{"Breadcrumb" if lang=="en" else "Шлях до сторінки"}"><a href="{url(lang)}">Wonderfall</a> / <a href="{url(lang,"blog/")}">{c["nav"][3]}</a></nav><h1>{E(c["article_title"])}</h1><p class="byline">{E(c["author"])}</p><p class="byline"><time datetime="{DATE}">{E(c["published"])}</time> · {read_time} · {E(c["updated_label"])} <time datetime="{UPDATED}">{E(c["updated_date"])}</time></p>{article}<p><a class="text-link" href="{url(lang,"blog/")}">← {E(c["all_posts"])}</a></p></article>'+cta(c)
    write(url(lang,'blog/'+SLUG+'/index.html'),page(c,'blog/'+SLUG+'/',c['article_meta_title'],c['article_description'],body,[article_schema,breadcrumb],article=True))
    sections=''.join(f'<section><h2>{E(title)}</h2><p>{E(text)}</p></section>' for title,text in c['support_sections'])
    body=f'<div class="prose wrap"><h1>{E(c["support_title"])}</h1><p class="answer">{E(c["support_intro"])}</p>{sections}<p><a class="button" href="mailto:hello@andrewsereda.com">{E(c["contact"])}</a></p></div>'
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

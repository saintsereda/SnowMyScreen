#!/usr/bin/env python3
"""Generate crawlable EN/UK pages using only the Python standard library."""
from pathlib import Path
import html
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://snowmyscreen.app'
STORE = 'https://apps.apple.com/app/id6755106853'
DATE = '2026-10-05'
SLUG = 'mac-desktop-effects'
LANGS = ('en', 'uk')
E = html.escape

def home(lang):
    return '/' if lang == 'en' else '/uk/'

def url(lang, suffix=''):
    return home(lang) + suffix

def dump(value):
    return json.dumps(value, ensure_ascii=False).replace('<', '\\u003c')

def app_schema(c):
    return {'@type':'SoftwareApplication','@id':ORIGIN+'/#app','name':'SnowMyScreen',
            'url':ORIGIN+'/', 'downloadUrl':STORE,'applicationCategory':'EntertainmentApplication',
            'operatingSystem':'macOS 14.6 or later','description':c['description'],
            'featureList':['Desktop snowfall','Custom PNG images']}

def page(c, suffix, title, description, body, schemas=(), article=False, preview=False):
    lang=c['lang']; canonical=ORIGIN+url(lang,suffix)
    other='uk' if lang=='en' else 'en'
    graph=[{'@type':'WebSite','@id':ORIGIN+'/#website','name':'SnowMyScreen','url':ORIGIN+'/'},
           {'@type':'Person','@id':ORIGIN+'/#andrew','name':'Andrew Sereda',
            'url':'https://github.com/saintsereda'},
           {'@type':'WebPage','@id':canonical+'#page','url':canonical,'name':title,
            'description':description,'inLanguage':lang,'isPartOf':{'@id':ORIGIN+'/#website'}}, *schemas]
    nav=''.join(f'<a href="{url(lang)}#{anchor}">{E(label)}</a>' for anchor,label in zip(('effects','features','faq'),c['nav'][:3]))
    alternates=''.join(f'<link rel="alternate" hreflang="{locale}" href="{ORIGIN+url(locale,suffix)}">' for locale in LANGS)
    feed=url(lang,'blog/feed.xml')
    preview_script='<script src="/js/preview.js" defer></script><script src="/js/heading.js" defer></script>' if preview else ''
    article_meta=f'<meta property="article:published_time" content="{DATE}T09:00:00+02:00"><meta property="article:modified_time" content="{DATE}T09:00:00+02:00">' if article else ''
    return f'''<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{E(title)}</title><meta name="description" content="{E(description)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="{canonical}">{alternates}
<link rel="alternate" hreflang="x-default" href="{ORIGIN+url('en',suffix)}">
<meta property="og:type" content="{'article' if article else 'website'}"><meta property="og:site_name" content="SnowMyScreen">
<meta property="og:title" content="{E(title)}"><meta property="og:description" content="{E(description)}">
<meta property="og:url" content="{canonical}"><meta property="og:locale" content="{c['locale']}">
<meta property="og:image" content="{ORIGIN}/images/preview.png"><meta property="og:image:alt" content="{'SnowMyScreen desktop effects for Mac' if lang=='en' else 'Ефекти SnowMyScreen для робочого столу Mac'}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{E(title)}">
<meta name="twitter:description" content="{E(description)}"><meta name="twitter:image" content="{ORIGIN}/images/preview.png">
{article_meta}
<link rel="icon" href="/images/favicon/favicon.ico"><link rel="apple-touch-icon" href="/images/favicon/apple-touch-icon.png">
<link rel="manifest" href="/images/favicon/site.webmanifest"><meta name="theme-color" content="#abddf5">
<link rel="alternate" type="application/rss+xml" title="SnowMyScreen Blog ({lang})" href="{feed}">
<link rel="stylesheet" href="/css/site.css">
<link rel="stylesheet" href="/css/cookies.css">
<script src="/js/analytics.js" defer></script>
<script src="/js/cookie-banner.js" defer></script>
<script type="application/ld+json">{dump({'@context':'https://schema.org','@graph':graph})}</script>
{preview_script}
</head>
<body>
<a class="skip-link" href="#main">{E(c['skip'])}</a>
<header class="header wrap">
<a class="brand" href="{url(lang)}"><img src="/images/icon.png" alt="" width="30" height="30">SnowMyScreen</a>
<nav class="navigation" aria-label="{'Main navigation' if lang=='en' else 'Основна навігація'}">{nav}<a href="{url(lang,'blog/')}">{c['nav'][3]}</a></nav>
<div class="header-actions"><a class="language-link" href="{url(other,suffix)}" lang="{other}" hreflang="{other}">{c['other_label']}</a><a class="button button-small" href="{STORE}">{E(c['short_cta'])}</a></div>
</header>
<main id="main">{body}</main>
<footer class="footer wrap"><div><a class="brand" href="{url(lang)}">SnowMyScreen</a><p>{E(c['footer_line'])}</p></div>
<nav aria-label="{'Footer navigation' if lang=='en' else 'Навігація в підвалі'}"><a href="{url(lang,'blog/')}">{c['nav'][3]}</a><a href="{url(lang,'support/')}">{E(c['support'])}</a><a href="{url(lang,'privacy.html')}">{E(c['privacy'])}</a><button type="button" data-cookie-settings>{E(c['cookie_settings'])}</button><a href="mailto:hello@andrewsereda.com">{E(c['contact'])}</a><a href="https://x.com/andrew_sereda">X</a><a href="https://www.threads.com/@saintsereda">Threads</a></nav></footer>
</body></html>'''

def cta(c):
    return f'<section class="final-cta wrap"><p class="eyebrow">SnowMyScreen</p><h2>{E(c["cta_title"])}</h2><p>{E(c["cta_text"])}</p><a class="button" href="{STORE}">{E(c["download"])}</a><p class="compat">{E(c["compat"])}</p></section>'

def article_card(c):
    return f'<article class="article-card"><div class="article-art" aria-hidden="true"><span>❄</span><span>✿</span><span>✦</span></div><div><p class="eyebrow">{E(c["article_label"])} · {E(c["minutes"])}</p><h3><a href="{url(c["lang"],"blog/"+SLUG+"/")}">{E(c["article_title"])}</a></h3><p>{E(c["article_summary"])}</p><a class="text-link" href="{url(c["lang"],"blog/"+SLUG+"/")}">{E(c["read"])} <span aria-hidden="true">↗</span></a></div></article>'

def homepage(c):
    themes=''.join(f'<article class="theme-card {key}"><div class="theme-art" aria-hidden="true"><span>{glyph}</span><span>{glyph}</span><span>{glyph}</span></div><h3>{E(name)}</h3><p>{E(desc)}</p></article>' for key,name,desc,glyph in c['themes'])
    features=''.join(f'<article><span class="feature-number" aria-hidden="true">0{i}</span><h3>{E(title)}</h3><p>{E(text)}</p></article>' for i,(title,text) in enumerate(c['features'],1))
    steps=''.join(f'<li><span aria-hidden="true">0{i}</span><h3>{E(title)}</h3><p>{E(text)}</p></li>' for i,(title,text) in enumerate(c['steps'],1))
    faq=''.join(f'<details><summary>{E(question)}</summary><p>{E(answer)}</p></details>' for question,answer in c['faq'])
    videos=json.loads((ROOT/'content/preview-videos.json').read_text())
    def media_attrs(key):
        values=videos[key]
        for path in values.values():
            if path:
                assert path.startswith('/') and (ROOT/path.lstrip('/')).is_file(), f'Missing preview media: {path}'
        return ''.join(f' data-{attribute}="{E(path)}"' for attribute,path in [('video',values['src']),('poster',values['poster'])] if path)
    buttons=''.join(f'<button class="theme-option theme-{key}" type="button" data-theme="{key}" data-description="{E(desc)}"{media_attrs(key)} aria-pressed="{"true" if key=="snow" else "false"}"><span class="theme-symbol" aria-hidden="true">{glyph}</span><span class="theme-name">{E(name)}</span><span class="theme-check" aria-hidden="true">✓</span></button>' for key,name,desc,glyph in c['themes'][:5])
    first=c['hero_phrases'][0]
    hero=f'<h1 class="hero__title" data-rotator="{E(dump(c["hero_phrases"][1:]))}"><span class="hero__line">{E(c["hero_line"])}</span> <span class="hero__line hero__slot"><span class="hero__phrase" data-text="{E(first["text"])}" data-icon="{E(first["icon"])}">{E(first["text"])}<span class="hero__emoji" aria-hidden="true">{E(first["icon"])}</span></span></span></h1>'
    body=f'''<section class="hero hero-with-preview wrap">{hero}<p class="hero-copy">{E(c['intro'])}</p><div class="hero-actions"><a class="button" href="{STORE}">{E(c['download'])} <span aria-hidden="true">↗</span></a></div><p class="compat">{E(c['compat'])}</p>
<div class="preview device-stage" data-preview data-effect="snow"><div class="device-display"><div class="device-screen preview-scene" role="group" aria-label="{E(c['screen_label'])}"><video class="effect-video" data-effect-video muted loop playsinline preload="metadata" aria-label="{E(c['screen_label'])}" hidden></video><div class="video-placeholder" data-video-placeholder><span class="video-placeholder-mark" aria-hidden="true">▶</span><p class="video-placeholder-caption" data-video-caption>{E(c['themes'][0][1])}</p></div></div><img class="device-frame" src="/images/MacBook%20Pro%2014%20Mockup.png" width="2001" height="1370" alt="{E(c['device_alt'])}"></div>
<aside class="control-panel" hidden><div class="panel-brand"><img src="/images/icon.png" width="22" height="22" alt=""><span>SnowMyScreen</span></div><p class="panel-label">{E(c['picker_title'])}</p><div class="theme-picker" role="group" aria-label="{E(c['preview_label'])}" hidden>{buttons}</div><p class="visually-hidden" data-theme-description aria-live="polite">{E(c['themes'][0][2])}</p><button class="preview-pause" type="button" data-pause data-play="{E(c['play'])}" data-stop="{E(c['pause'])}" aria-pressed="false" hidden>{E(c['pause'])}</button></aside></div></section>
<section class="effects-section" id="effects"><div class="mobile-control-slot" data-mobile-controls></div><p class="preview-note">{E(c['preview_note'])}</p><div class="section wrap"><p class="eyebrow">{E(c['effects_kicker'])}</p><h2>{E(c['effects_title'])}</h2><p class="section-intro">{E(c['effects_intro'])}</p><div class="theme-grid">{themes}</div></div></section>
<section class="section feature-section" id="features"><div class="wrap"><p class="eyebrow">{E(c['features_kicker'])}</p><h2>{E(c['features_title'])}</h2><div class="feature-grid">{features}</div></div></section>
<section class="section wrap"><h2>{E(c['steps_title'])}</h2><ol class="steps">{steps}</ol></section>
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
    write(url(lang,'index.html'),homepage(c))
    collection={'@type':'CollectionPage','@id':ORIGIN+url(lang,'blog/')+'#collection','name':c['blog_meta_title'],'hasPart':{'@id':ORIGIN+url(lang,'blog/'+SLUG+'/')+'#article'}}
    body=f'<section class="page-heading wrap"><p class="eyebrow">{E(c["blog_kicker"])}</p><h1>{E(c["blog_title"])}</h1><p>{E(c["blog_intro"])}</p></section><section class="wrap blog-list">{article_card(c)}<p><a class="text-link" href="{url(lang,"blog/feed.xml")}">RSS ↗</a></p></section>'+cta(c)
    write(url(lang,'blog/index.html'),page(c,'blog/',c['blog_meta_title'],c['blog_description'],body,[collection]))
    article_url=ORIGIN+url(lang,'blog/'+SLUG+'/')
    article_schema={'@type':'BlogPosting','@id':article_url+'#article','headline':c['article_title'],
        'description':c['article_description'],'datePublished':DATE+'T09:00:00+02:00','dateModified':DATE+'T09:00:00+02:00',
        'inLanguage':lang,'author':{'@id':ORIGIN+'/#andrew'},'publisher':{'@type':'Organization','name':'SnowMyScreen','url':ORIGIN+'/'},
        'mainEntityOfPage':{'@id':article_url+'#page'},'image':ORIGIN+'/images/preview.png'}
    breadcrumb={'@type':'BreadcrumbList','itemListElement':[
        {'@type':'ListItem','position':1,'name':'SnowMyScreen','item':ORIGIN+url(lang)},
        {'@type':'ListItem','position':2,'name':c['nav'][3],'item':ORIGIN+url(lang,'blog/')},
        {'@type':'ListItem','position':3,'name':c['article_title'],'item':article_url}]}
    article=(ROOT/'content/articles'/f'{lang}.html').read_text().replace('__HOME__',url(lang))
    # Derive read time from actual content rather than a fixed estimate.
    words=len(re.sub('<[^>]+>',' ',article).split()); minutes=max(1,(words+179)//180)
    read_time=f'{minutes} minute read' if lang=='en' else f'{minutes} хв читання'
    body=f'<article class="prose wrap"><nav class="breadcrumbs" aria-label="{"Breadcrumb" if lang=="en" else "Шлях до сторінки"}"><a href="{url(lang)}">SnowMyScreen</a> / <a href="{url(lang,"blog/")}">{c["nav"][3]}</a></nav><p class="eyebrow">{E(c["article_label"])}</p><h1>{E(c["article_title"])}</h1><p class="byline">{E(c["author"])}</p><p class="byline"><time datetime="{DATE}">{E(c["published"])}</time> · {read_time}</p>{article}<p><a class="text-link" href="{url(lang,"blog/")}">← {E(c["all_posts"])}</a></p></article>'+cta(c)
    write(url(lang,'blog/'+SLUG+'/index.html'),page(c,'blog/'+SLUG+'/',c['article_meta_title'],c['article_description'],body,[article_schema,breadcrumb],article=True))
    sections=''.join(f'<section><h2>{E(title)}</h2><p>{E(text)}</p></section>' for title,text in c['support_sections'])
    body=f'<div class="prose wrap"><p class="eyebrow">{E(c["support"])}</p><h1>{E(c["support_title"])}</h1><p class="answer">{E(c["support_intro"])}</p>{sections}<p><a class="button" href="mailto:hello@andrewsereda.com">{E(c["contact"])}</a></p></div>'
    write(url(lang,'support/index.html'),page(c,'support/',c['support_title'],c['support_description'],body))
    # Preserve the existing policy text as the source, with only factual product copy corrections.
    privacy=json.loads((ROOT/'content/privacy.json').read_text())[lang]
    def get(key):
        value=privacy
        for part in key.split('.')[1:]:
            value=value[int(part)] if isinstance(value,list) else value[part]
        return value
    policy=(ROOT/'content/privacy-template.html').read_text()
    policy=re.sub(r'<(h1|h2|p|li|strong)([^>]*data-i18n="(privacy\.[^"]+)"[^>]*)>.*?</\1>',lambda m:f'<{m[1]}>{E(get(m[3]))}</{m[1]}>',policy,flags=re.S)
    privacy_description='How SnowMyScreen handles local app data, optional website analytics and cookie choices.' if lang=='en' else 'Як SnowMyScreen зберігає дані застосунку локально та використовує необов’язкову аналітику й cookie на сайті за вашою згодою.'
    write(url(lang,'privacy.html'),page(c,'privacy.html',privacy['pageTitle'],privacy_description,'<div class="prose wrap">'+policy+'</div>'))
    rss=ET.Element('rss',version='2.0'); channel=ET.SubElement(rss,'channel')
    for name,text in [('title','SnowMyScreen Blog'),('link',ORIGIN+url(lang,'blog/')),('description',c['blog_description']),('language',lang)]:
        ET.SubElement(channel,name).text=text
    item=ET.SubElement(channel,'item')
    for name,text in [('title',c['article_title']),('link',article_url),('guid',article_url),('description',c['article_description']),('pubDate','Mon, 05 Oct 2026 07:00:00 GMT')]:
        ET.SubElement(item,name).text=text
    write(url(lang,'blog/feed.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n'+ET.tostring(rss,encoding='unicode'))
    for suffix in ('','blog/','blog/'+SLUG+'/','support/','privacy.html'):
        entry=ET.SubElement(sitemap,ns+'url'); ET.SubElement(entry,ns+'loc').text=ORIGIN+url(lang,suffix); ET.SubElement(entry,ns+'lastmod').text=DATE
        for alternate in (*LANGS,'x-default'):
            ET.SubElement(entry,'{http://www.w3.org/1999/xhtml}link',rel='alternate',hreflang=alternate,href=ORIGIN+url('en' if alternate=='x-default' else alternate,suffix))
write('/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n'+ET.tostring(sitemap,encoding='unicode')+'\n')
print('Generated 10 static EN/UK pages, 2 RSS feeds and sitemap.xml.')

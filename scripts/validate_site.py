#!/usr/bin/env python3
"""Validate crawlability, localized metadata and local navigation before deployment."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json, re, xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
SITE=json.loads((ROOT/'content/site.json').read_text())
STORE_DATA=json.loads((ROOT/'content/app-store.json').read_text())
ORIGIN=SITE['origin'].rstrip('/')
class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True);self.tags=[];self.ids=set();self.schemas=[];self.current=None;self.buffer='';self.lang=None
    def handle_starttag(self,tag,attrs):
        a=dict(attrs);self.tags.append((tag,a))
        if tag=='html':self.lang=a.get('lang')
        if 'id' in a:
            assert a['id'] not in self.ids, f'Duplicate id: {a["id"]}'
            self.ids.add(a['id'])
        if tag=='script' and a.get('type')=='application/ld+json':self.current='schema';self.buffer=''
    def handle_data(self,data):
        if self.current:self.buffer+=data
    def handle_endtag(self,tag):
        if tag=='script' and self.current:
            self.schemas.append(json.loads(self.buffer));self.current=None
    def attr(self,tag,key,value,out):
        return [a.get(out) for t,a in self.tags if t==tag and a.get(key)==value]
def target(path):
    p=ROOT/unquote(path).lstrip('/')
    return p/'index.html' if path.endswith('/') or p.is_dir() else p
pages={}
for p in ROOT.rglob('*.html'):
    if any(part in {'content','.git'} for part in p.relative_to(ROOT).parts):continue
    page=Page();page.feed(p.read_text());pages[p.resolve()]=page
assert len(pages)==12, f'Expected 11 generated pages plus 404; got {len(pages)}'
canonicals={};descriptions=set()
for path,page in pages.items():
    assert page.lang in {'en','uk'}, path
    for script in ('/js/analytics.js','/js/cookie-banner.js'):
        assert sum(t=='script' and a.get('src')==script for t,a in page.tags)==1,(path,script)
    assert sum(t=='link' and a.get('href')=='/css/cookies.css' for t,a in page.tags)==1,path
    assert any(t=='button' and 'data-cookie-settings' in a for t,a in page.tags),path
    robots=page.attr('meta','name','robots','content')
    noindex=any('noindex' in x for x in robots)
    if not noindex:
        assert len([t for t,a in page.tags if t=='h1'])==1,path
        canonical=page.attr('link','rel','canonical','href');assert len(canonical)==1,path
        canonical=canonical[0];assert canonical.startswith(ORIGIN),path
        assert target(urlsplit(canonical).path).resolve()==path,path
        assert canonical not in canonicals,path
        canonicals[canonical]=path
        assert page.schemas,path
        desc=page.attr('meta','name','description','content');assert len(desc)==1 and len(desc[0])>30,path
        assert desc[0] not in descriptions,path
        descriptions.add(desc[0])
        assert page.attr('meta','property','og:url','content')==[canonical],path
        assert page.attr('meta','property','og:image','content')==[ORIGIN+'/images/wonderfall-icon.png'],path
        assert page.attr('meta','name','twitter:image','content')==[ORIGIN+'/images/wonderfall-icon.png'],path
        alternates={a['hreflang']:a['href'] for t,a in page.tags if t=='link' and a.get('hreflang')}
        assert set(alternates)=={'en','uk','x-default'},path
        assert alternates[page.lang]==canonical,path
        for locale,link in alternates.items():
            peer=pages[target(urlsplit(link).path).resolve()]
            peer_links={a['hreflang']:a['href'] for t,a in peer.tags if t=='link' and a.get('hreflang')}
            assert peer_links==alternates,(path,locale)
    for tag,attrs in page.tags:
        if tag=='img':assert 'alt' in attrs,path
        for attribute in ('src','href','data-source','data-poster'):
            link=attrs.get(attribute)
            if not link:continue
            parsed=urlsplit(link)
            if (parsed.scheme or parsed.netloc) and parsed.netloc!=urlsplit(ORIGIN).netloc:continue
            linked=target(parsed.path) if parsed.path.startswith('/') else (path.parent/parsed.path).resolve()
            if not parsed.path:linked=path
            if linked.is_dir():linked/= 'index.html'
            assert linked.exists(),f'Broken local link in {path}: {link}'
            if parsed.fragment and linked.suffix=='.html':
                assert parsed.fragment in pages[linked.resolve()].ids,f'Missing fragment: {path}: {link}'
    for schema in page.schemas:
        graph=schema.get('@graph',[])
        for item in graph:
            if item.get('@type')=='FAQPage':
                details=sum(t=='details' and 'data-nav-language' not in a for t,a in page.tags)
                locale=json.loads((ROOT/'content'/f'{page.lang}.json').read_text())
                assert len(item['mainEntity'])==details==len(locale['faq']),path
                source=path.read_text()
                for q in item['mainEntity']:
                    assert __import__('html').escape(q['name']) in source,path
                    assert __import__('html').escape(q['acceptedAnswer']['text']) in source,path
            if item.get('@type')=='BlogPosting':
                assert item['mainEntityOfPage']['@id'].removesuffix('#page') in page.attr('link','rel','canonical','href'),path
                assert item['datePublished'] and item['author'] and item['image'],path
                assert item['datePublished'].startswith(SITE['article_published']),path
                assert item['dateModified'].startswith(SITE['content_updated']),path
            if item.get('@type')=='SoftwareApplication':
                assert item['name']=='Wonderfall' and item['alternateName']==STORE_DATA['name'],path
                assert item['softwareVersion']==STORE_DATA['version'],path
                assert item['operatingSystem']==f'macOS {STORE_DATA["minimum_os"]} or later',path
                assert item['offers']['price']==STORE_DATA['offer']['price'],path
                assert item['offers']['priceCurrency']==STORE_DATA['offer']['currency'],path
                assert 'aggregateRating' not in item and 'review' not in item,'Imported App Store reviews are shown with attribution, not marked up as ratings collected by this site.'
                locale=json.loads((ROOT/'content'/f'{page.lang}.json').read_text())
                assert item['featureList']==locale['released_features'],path
    if path in [(ROOT/'index.html').resolve(),(ROOT/'uk/index.html').resolve()]:
        source=path.read_text()
        topics=[a['data-feature'] for t,a in page.tags if 'data-feature' in a]
        assert topics==['weather','cleaning','garlands','images','motion','placement','displays'],f'Keep seven details below the existing seasonal preview: {path}'
        assert len([t for t,a in page.tags if t=='video'])==1,f'Do not duplicate the seasonal video in the feature section: {path}'
        themes=[a['data-theme'] for t,a in page.tags if t=='button' and 'data-theme' in a]
        assert themes==['snow','rain','leaves','petals','fireflies'],f'Preserve the seasonal preview above the feature section: {path}'
        ids=[a['data-review-id'] for t,a in page.tags if 'data-review-id' in a]
        assert len(ids)==len(set(ids))==len(STORE_DATA['reviews']),path
        assert set(ids)=={review['id'] for review in STORE_DATA['reviews']},path
        for review in STORE_DATA['reviews']:
            assert __import__('html').escape(review['excerpt']) in source,(path,review['id'])
            assert __import__('html').escape(review['author']) in source,(path,review['id'])
            assert __import__('html').escape(review['source']) in source,(path,review['id'])
        video=[a for t,a in page.tags if t=='video' and 'data-effect-video' in a]
        assert len(video)==1 and video[0].get('poster') and video[0].get('src') and 'controls' in video[0],f'Keep a working video/poster without JavaScript: {path}'
sitemap=ET.parse(ROOT/'sitemap.xml')
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
locations={element.text for element in sitemap.findall('.//s:loc',ns)}
assert locations==set(canonicals),f'Sitemap mismatch: {locations ^ set(canonicals)}'
for feed in [ROOT/'blog/feed.xml',ROOT/'uk/blog/feed.xml']:
    items=ET.parse(feed).findall('./channel/item');assert len(items)==1
    assert items[0].findtext('link') in locations,feed
assert (ROOT/'CNAME').read_text().strip()==urlsplit(ORIGIN).hostname
assert f'Sitemap: {ORIGIN}/sitemap.xml' in (ROOT/'robots.txt').read_text()
assert ORIGIN+'/support/' in (ROOT/'llms.txt').read_text()
assert STORE_DATA['version'] in (ROOT/'llms.txt').read_text()
assert '__ORIGIN__' not in (ROOT/'download.html').read_text()
assert f'href="{ORIGIN}/download.html"' in (ROOT/'download.html').read_text()
assert not (ROOT/'js/notifications.js').exists(),'Fabricated purchase notifications must be removed'
for p in (ROOT/'content').glob('*.json'):json.loads(p.read_text())
for p in (ROOT/'js').glob('*.json'):json.loads(p.read_text())
print(f'PASS: {len(pages)} pages, {len(locations)} canonical URLs; EN/UK metadata, JSON-LD, FAQ, attributed reviews, App Store facts, video fallback, local links, sitemap, RSS, consent assets and domain configuration.')

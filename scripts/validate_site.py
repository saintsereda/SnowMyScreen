#!/usr/bin/env python3
"""Validate crawlability, localized metadata and local navigation before deployment."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json, re, xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
ORIGIN='https://snowmyscreen.app'
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
assert len(pages)==12, f'Expected 10 generated pages plus download/404; got {len(pages)}'
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
        alternates={a['hreflang']:a['href'] for t,a in page.tags if t=='link' and a.get('hreflang')}
        assert set(alternates)=={'en','uk','x-default'},path
        assert alternates[page.lang]==canonical,path
        for locale,link in alternates.items():
            peer=pages[target(urlsplit(link).path).resolve()]
            peer_links={a['hreflang']:a['href'] for t,a in peer.tags if t=='link' and a.get('hreflang')}
            assert peer_links==alternates,(path,locale)
    for tag,attrs in page.tags:
        if tag=='img':assert 'alt' in attrs,path
        for attribute in ('src','href'):
            link=attrs.get(attribute)
            if not link:continue
            parsed=urlsplit(link)
            if parsed.scheme or parsed.netloc:continue
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
                details=sum(t=='details' for t,a in page.tags)
                assert len(item['mainEntity'])==details==10,path
                source=path.read_text()
                for q in item['mainEntity']:
                    assert __import__('html').escape(q['name']) in source,path
                    assert __import__('html').escape(q['acceptedAnswer']['text']) in source,path
            if item.get('@type')=='BlogPosting':
                assert item['mainEntityOfPage']['@id'].removesuffix('#page') in page.attr('link','rel','canonical','href'),path
                assert item['datePublished'] and item['author'] and item['image'],path
sitemap=ET.parse(ROOT/'sitemap.xml')
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
locations={element.text for element in sitemap.findall('.//s:loc',ns)}
assert locations==set(canonicals),f'Sitemap mismatch: {locations ^ set(canonicals)}'
for feed in [ROOT/'blog/feed.xml',ROOT/'uk/blog/feed.xml']:
    items=ET.parse(feed).findall('./channel/item');assert len(items)==1
    assert items[0].findtext('link') in locations,feed
assert (ROOT/'CNAME').read_text().strip()=='snowmyscreen.app'
assert 'Sitemap: https://snowmyscreen.app/sitemap.xml' in (ROOT/'robots.txt').read_text()
assert not (ROOT/'js/notifications.js').exists(),'Fabricated purchase notifications must be removed'
for p in (ROOT/'content').glob('*.json'):json.loads(p.read_text())
for p in (ROOT/'js').glob('*.json'):json.loads(p.read_text())
print(f'PASS: {len(pages)} pages, {len(locations)} canonical URLs; local links, anchors, EN/UK hreflang, metadata, JSON-LD, FAQ, RSS, sitemap and shared consent assets.')

#!/usr/bin/env python3
"""Refresh public App Store facts and verify the curated review excerpts.

Normal site builds stay offline. Review text is never invented or translated by
this script; a changed or removed source review requires an editorial decision.
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen
import argparse
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = ROOT / 'content/app-store.json'
APP_ID = '6755106853'


def fetch(url):
    request = Request(url, headers={'User-Agent': 'WonderfallWebsite/1.0'})
    with urlopen(request, timeout=25) as response:
        return response.read().decode('utf-8')


class ServerData(HTMLParser):
    def __init__(self):
        super().__init__()
        self.reading = False
        self.buffer = ''

    def handle_starttag(self, tag, attrs):
        if tag == 'script' and dict(attrs).get('id') == 'serialized-server-data':
            self.reading = True

    def handle_data(self, text):
        if self.reading:
            self.buffer += text

    def handle_endtag(self, tag):
        if tag == 'script':
            self.reading = False


def find_ratings(value):
    if isinstance(value, dict):
        if value.get('$kind') == 'Ratings' and value.get('productId') == APP_ID:
            return value
        children = value.values()
    elif isinstance(value, list):
        children = value
    else:
        return None
    for child in children:
        result = find_ratings(child)
        if result:
            return result
    return None


def reviews(country):
    feed = f'https://itunes.apple.com/{country}/rss/customerreviews/id={APP_ID}/sortBy=mostRecent/json'
    entries = json.loads(fetch(feed)).get('feed', {}).get('entry', [])
    return country, {entry['id']['label']: entry for entry in entries if 'im:rating' in entry}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Verify sources without replacing the snapshot.')
    args = parser.parse_args()
    snapshot = json.loads(SNAPSHOT.read_text())
    store = json.loads(fetch(snapshot['listing_source']))['results'][0]
    assert str(store['trackId']) == APP_ID and store['bundleId'] == 'sereda.Snowflakes'
    countries = snapshot['checked_storefronts']
    with ThreadPoolExecutor(max_workers=8) as pool:
        feeds = dict(pool.map(reviews, countries))
    for review in snapshot['reviews']:
        source = feeds[review['storefront']].get(review['id'])
        assert source, f'Review missing from the public feed: {review["id"]}'
        assert review['excerpt'] in source['content']['label'], f'Excerpt changed: {review["id"]}'
        assert review['title'] == source['title']['label'], f'Title changed: {review["id"]}'
        assert review['author'] == source['author']['name']['label'], f'Author changed: {review["id"]}'
        assert review['rating'] == int(source['im:rating']['label']), f'Rating changed: {review["id"]}'
        review['source_sha256'] = hashlib.sha256(source['content']['label'].encode()).hexdigest()
    ratings_page = ServerData()
    ratings_page.feed(fetch(snapshot['ratings']['source']))
    rating = find_ratings(json.loads(ratings_page.buffer))
    assert rating, 'No regional rating summary found on the public Apple reviews page.'
    snapshot['ratings'].update(value=rating['ratingAverage'], count=rating['totalNumberOfRatings'])
    snapshot.update(
        checked_at=datetime.now(timezone.utc).date().isoformat(),
        name=store['trackName'], version=store['version'], minimum_os=store['minimumOsVersion'],
        release_date=store['currentVersionReleaseDate'],
        offer={'price': store['price'], 'currency': store['currency'], 'storefront': 'us',
               'url': f'https://apps.apple.com/us/app/id{APP_ID}'},
        storefront_review_counts={country: len(entries) for country, entries in feeds.items()},
    )
    if not args.check:
        SNAPSHOT.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + '\n')
    print(f'Verified {len(snapshot["reviews"])} excerpts across {len(feeds)} storefronts; '
          f'{snapshot["name"]} {snapshot["version"]}; '
          f'{rating["ratingAverage"]}/5 from {rating["totalNumberOfRatings"]} Ukrainian ratings.')
    if args.check:
        saved = json.loads(SNAPSHOT.read_text())
        for field in ('name', 'version', 'minimum_os', 'offer', 'ratings'):
            assert saved[field] == snapshot[field], f'Outdated App Store snapshot: {field}; refresh and review the copy.'


if __name__ == '__main__':
    main()

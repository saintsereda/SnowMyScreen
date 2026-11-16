"""Telegram helpers shared by ops scripts."""
import html
import json
import re
import urllib.error
import urllib.request


def esc(value):
    return str(value).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def plain_text(message):
    return html.unescape(re.sub(r"</?[a-z][^>]*>", "", message))


def _telegram(payload, token):
    request = urllib.request.Request(
        "https://api.telegram.org/bot%s/sendMessage" % token,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def send_telegram(message, token, chat_id, call=_telegram):
    base = {"chat_id": chat_id, "disable_web_page_preview": True}
    try:
        result = call(dict(base, text=message, parse_mode="HTML"), token)
    except urllib.error.HTTPError as error:
        if error.code != 400:
            raise
        result = call(dict(base, text=plain_text(message)), token)
    if not result.get("ok"):
        raise RuntimeError("Telegram did not accept the report")

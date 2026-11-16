#!/usr/bin/env python3
"""Telegram message about a new blog draft PR (label blog-draft).

  blog_draft_notify.py --title T --url U --body-file F [--dry-run]

Reads the fixed `## <section>` headings the writer routine puts in the PR body
(see docs/blog/rules.md in the Wonderfall workspace) and sends them to TELEGRAM_CHAT_ID. A missing section
is left out of the message rather than failing it.
"""
import argparse
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import telegram  # noqa: E402

NOTHING = {"", "нічого", "-", "none", "nothing"}


def sections(body):
    """Text under each `## name` heading, up to the next one, stripped."""
    out, name, lines = {}, None, []
    for line in (body or "").splitlines():
        match = re.match(r"^##\s+(.+?)\s*$", line)
        if match:
            if name is not None:
                out[name] = "\n".join(lines).strip()
            name, lines = match.group(1), []
        elif name is not None:
            lines.append(line)
    if name is not None:
        out[name] = "\n".join(lines).strip()
    return out


def build_message(title, url, body):
    s = sections(body)
    esc = telegram.esc
    seasonal = s.get("Сезон", "").strip().lower() not in NOTHING | {"вічнозелена", "evergreen"}
    head = "❄️ " if seasonal else "📝 "
    lines = [head + "<b>Нова чернетка: %s</b>" % esc(s.get("Назва") or title)]
    if s.get("Опис"):
        lines += ["", esc(s["Опис"])]
    lines.append("")
    for label, key in (("Тип", "Тип"), ("Сезон", "Сезон"), ("SEO-запит", "SEO-запит")):
        if s.get(key):
            lines.append("<b>%s:</b> %s" % (label, esc(s[key])))
    if s.get("GEO-запити"):
        lines += ["<b>GEO-запити:</b>", esc(s["GEO-запити"])]
    if s.get("Цінність"):
        lines += ["", "<b>Цінність:</b> " + esc(s["Цінність"])]
    if s.get("Медіа"):
        lines += ["", "🎬 <b>Медіа:</b> " + esc(s["Медіа"])]
    unconfirmed = s.get("Не підтверджено", "")
    if unconfirmed.strip().lower() not in NOTHING:
        lines += ["", "⚠️ <b>Не підтверджено:</b>", esc(unconfirmed)]
    lines += ["", esc(url)]
    return "\n".join(lines)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--title", required=True)
    p.add_argument("--url", required=True)
    p.add_argument("--body-file", required=True)
    p.add_argument("--dry-run", action="store_true")
    a = p.parse_args()
    with open(a.body_file, encoding="utf-8") as f:
        message = build_message(a.title, a.url, f.read())
    token, chat = os.environ.get("TELEGRAM_TOKEN"), os.environ.get("TELEGRAM_CHAT_ID")
    if a.dry_run or not (token and chat):
        print(message)
        if not a.dry_run:
            print("TELEGRAM_TOKEN or TELEGRAM_CHAT_ID missing: printed instead of sent", file=sys.stderr)
        return
    telegram.send_telegram(message, token, chat)


if __name__ == "__main__":
    main()

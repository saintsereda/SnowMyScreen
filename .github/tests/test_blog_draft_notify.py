import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
import blog_draft_notify as n  # noqa: E402

BODY = """Intro line that is not a section.

## Назва
Christmas apps for Mac in 2026

## Опис
An honest roundup of festive desktop apps for December.

## Тип
Порівняння

## Сезон
Різдво, опублікувати до 2026-12-05

## SEO-запит
christmas apps for mac

## GEO-запити
- What are the best Christmas apps for Mac?
- How do I put Christmas lights on my Mac screen?

## Цінність
Seasonal peak in December, no fresh 2026 roundup ranks yet.

## Медіа
garland-showcase.mp4 as cover; record snow over a browser window

## Не підтверджено
нічого

## Джерела
- https://apps.apple.com/
"""


class Sections(unittest.TestCase):
    def test_text_under_each_heading(self):
        s = n.sections(BODY)
        self.assertEqual(s["SEO-запит"], "christmas apps for mac")
        self.assertTrue(s["GEO-запити"].startswith("- What are"))
        self.assertNotIn("Intro", " ".join(s.values()))


class Message(unittest.TestCase):
    def setUp(self):
        self.msg = n.build_message("PR title", "https://github.com/x/y/pull/7", BODY)

    def test_carries_every_field_and_link(self):
        for text in ("Christmas apps for Mac in 2026", "honest roundup", "Різдво, опублікувати до 2026-12-05",
                     "christmas apps for mac", "best Christmas apps", "Seasonal peak",
                     "record snow over a browser window", "https://github.com/x/y/pull/7"):
            self.assertIn(text, self.msg)

    def test_seasonal_draft_is_marked(self):
        self.assertTrue(self.msg.startswith("❄️"))

    def test_evergreen_is_not_marked(self):
        body = BODY.replace("Різдво, опублікувати до 2026-12-05", "вічнозелена")
        self.assertTrue(n.build_message("t", "u", body).startswith("📝"))

    def test_nothing_unconfirmed_is_left_out(self):
        self.assertNotIn("Не підтверджено", self.msg)

    def test_unconfirmed_claims_are_shown(self):
        body = BODY.replace("## Не підтверджено\nнічого", "## Не підтверджено\n- competitor price")
        self.assertIn("competitor price", n.build_message("t", "u", body))

    def test_html_is_escaped(self):
        body = BODY.replace("Christmas apps for Mac in 2026", "A <b> & B")
        self.assertIn("A &lt;b&gt; &amp; B", n.build_message("t", "u", body))

    def test_missing_sections_are_skipped(self):
        msg = n.build_message("Fallback title", "u", "## SEO-запит\nrain on desktop\n")
        self.assertTrue(msg.startswith("📝"))
        self.assertIn("Fallback title", msg)
        self.assertNotIn("GEO", msg)
        self.assertNotIn("Медіа", msg)


if __name__ == "__main__":
    unittest.main()

# Sky Flap

Canvas-based one-tap arcade game published at `/flappy-bird/` on DopaBrain.

## Current product

- One-tap keyboard, pointer, and touch play
- Local best score, daily challenge, and medal progression
- Sound controls and installable PWA shell
- 12 locales: Korean, English, Japanese, Chinese, Spanish, Portuguese, Indonesian, Turkish, German, French, Hindi, and Russian
- Four related games and three supporting articles

## Advertising status

Ad loading, placements, interstitials, and rewarded actions are disabled while the site is under an invalid-traffic review that began on 2026-09-03. Do not restore them without an explicit policy review and a separate verified release.

## Analytics contract

The game emits each private funnel stage at most once per page view:

`flappy_view -> flappy_start -> flappy_complete -> flappy_share / flappy_related_click`

These events contain no score, result, timing, URL, or other gameplay value. Share is recorded only after the share or clipboard operation succeeds.

## Structure

```text
index.html          Page shell and discovery links
css/style.css       Responsive game styles
js/app.js           Game and private funnel logic
js/i18n.js          Locale loader
js/locales/*.json   12 translations
manifest.json       App-scoped PWA metadata
sw.js               Same-origin, app-scoped offline cache
```

## Local run

Serve the repository root over HTTP and open `/flappy-bird/?lang=en`. Service worker and locale behavior cannot be validated reliably from a `file://` URL.

The repository-level `verify:flappy-suspension` command is the release gate for source mutations and real browser journeys.

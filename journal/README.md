# nbhas.xyz/journal

The journal section of the site. (Side quests is parked in `03_Pipeline/`; the build detects whether a `../sidequests/` folder exists and only then adds the second index and the nav link.) It is Plain HTML, one shared stylesheet, one small script, no build dependencies
beyond Node for the index generator. It inherits the V8 design system (cream ground, Fraunces, Inter,
Devanagari numerals in clay) but lives in its own folder, so `V8/` and `music/` are untouched.

## What's here

```
journal/
  index.html              landing page: hero, filter chips, grid of cards   ← generated
  feed.xml                RSS                                               ← generated
  snippets/home-section.html  "latest three" block for the homepage        ← generated
  entries.json            the list of everything in the journal (edit this)
  build.js                regenerates the three files above:  node build.js
  template-post.html      copy this to start a new essay page
  assets/journal.css      the only stylesheet
  assets/journal.js       the filters (progressive: everything shows with JS off)
  assets/favicon.svg      copied from V8
  <slug>/index.html       one folder per post, served at /journal/<slug>/
  <slug>/header.svg       placeholder header until a photograph replaces it
```

## Publishing: upload once, reveal weekly

All post pages are uploaded together. What is visible is controlled by one line per entry in `entries.json`:

- `"status": "unlisted"` — the page exists at its URL but is left off the index and the RSS feed, carries a
  `noindex` tag, keeps its Draft badge, and the previous post's "Next" link shows "coming soon" instead of linking.
- `"status": "draft"` — listed, but with the Draft badge.
- no status — live.

Weekly routine: delete the status line for the post going live → `node build.js` (it rewrites the index, the feed,
the snippet, and patches the post pages' robots tag, badge and next-links) → replace on GitHub:
`journal/index.html`, `journal/feed.xml`, `journal/sitemap.xml`, the post's own `index.html` and the previous post's
`index.html` (the next-link changes). Five files, no folders. Then paste `snippets/home-section.html` between the
JOURNAL markers in the homepage's `index.html` and upload that too, so the "latest three" block updates.

## Adding an entry

1. **Write the page.** Copy `template-post.html` to `<slug>/index.html` and fill the `{{…}}` fields
   (title, deck, date, Devanagari number, kicker, header image, body, prev/next, sources).
   Body paragraphs are plain `<p>`; section heads are `<h2>` (the clay dash is added by CSS);
   an inline SVG goes in `<figure class="inline">`.
2. **Add six lines to `entries.json`:** `slug`, `kind` (journal: Essay / Note; side quests: Music / Videos / Notes / Visuals),
   `title`, `deck`, `date` (YYYY-MM-DD), `tags`. Optional: `series` + `part`, `image` (path relative
   to /journal/), `quote` (text tile when there's no image), `audio` (adds the in-card player row: button, seek, time), `video` (a centred play button on the tile opens the clip in a lightbox; put the poster in `image` and the duration in `kicker`),
   `kicker` (small label shown after the kind, e.g. "Operating manual · 01"), `section: "sidequests"` (default is journal; decides which index the card appears on and which folder the page lives in), `url` (for entries that live elsewhere), `status: "draft"` (shows the badge).
3. **Run `node build.js`.** It rewrites `index.html`, `feed.xml` and `snippets/home-section.html`.
   Each index is sorted by date, newest first; chips and counts come from the data. `feed.xml` and the homepage
snippet are journal-only.
4. **Upload** the new folder plus `index.html`, `feed.xml` to the GitHub repo (per `DEPLOY.md`).

Kinds and tags the chips will show are listed under `site` in `entries.json`; a chip only appears
once something uses it, so adding "Comic" costs nothing until the first comic exists.

## Replacing a placeholder header

Drop the photograph in the post folder (3:2, ≤ 1600px wide, compressed), point the `<img>` and the
`og:image` meta at it, update the `image` field in `entries.json`, run `node build.js`. Keep the original
in `../_source/journal/<slug>/` (not uploaded).
The label card under the image (series · number · object · place · year) stays.

## Homepage

`snippets/home-section.html` is the block for section ०६ on the main page. It uses classes
`journal-latest`, `journal-item`, `journal-all` that still need styles in the next version of the
homepage; copy them from `.entry` in `journal.css` when that version is made. The homepage is not
edited by this folder.

## Status

Built 18 Nov 2026. Four essays are in as drafts (badge on). The five music pages are copied in as journal pages
(`tribes-of-sound/`, `finding-the-artist/`, `taking-the-artist-into-the-world/`, `the-terrain/`, `the-engine/`),
each with a date line added (file last-modified) and its back link pointed at the journal; the old `music/`
folder can be retired once this is live. Photographs to follow: Nolen Noir box, the Kolkata book, phuljharis, Moret-sur-Loing.

#!/usr/bin/env node
/* nbhas.xyz/journal — generator.
   Reads entries.json and writes:
     index.html                 the journal landing page (cards + filters)
     feed.xml                   RSS feed of the entries
     snippets/home-section.html the "latest three" block to paste into the homepage (section ०६)
   Post pages are plain HTML files you write by hand from template-post.html; this script does not touch them.
   Run:  node build.js            (plain Node, no dependencies) */

const fs = require('fs');
const path = require('path');

const here = __dirname;
const data = JSON.parse(fs.readFileSync(path.join(here, 'entries.json'), 'utf8'));
const site = data.site;
const series = data.series || {};
const seriesTotal = id => data.entries.filter(x => x.series === id).length;
const partLabel = e => `Part ${e.part} of ${seriesTotal(e.series)}`;

const year = new Date().getFullYear();

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtDate = iso => { const [y,m,d] = iso.split('-').map(Number); return `${d} ${months[m-1]} ${y}`; };
const rfc822 = iso => new Date(iso + 'T09:00:00+05:30').toUTCString();

const everything = data.entries.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
const all = everything.filter(e => e.status !== 'unlisted');   // unlisted: page exists at its URL, appears nowhere
const SECTIONS = {
  journal:    { dir: path.join(here),                 url: 'https://nbhas.xyz/journal/',    assets: 'assets',            home: '../',
                title: site.title, eyebrow: 'journal ↓',
                h1: "Questions I can’t put down, followed as far as I can take them.",
                intro: "",
                kinds: [] },
  sidequests: { dir: path.join(here, '..', 'sidequests'), url: 'https://nbhas.xyz/sidequests/', assets: '../journal/assets', home: '../',
                title: 'Side quests — Nishant Bhaskar', eyebrow: 'quests so far ↙', h1: 'This is where my side quests find a home.',
                intro: 'No grand plan. Just following the good kind of weird.',
                kinds: ['Music', 'Videos', 'Notes', 'Visuals'], css: 'sidequests.css' },
};
const sectionOf = e => e.section || 'journal';
const hrefOf = e => e.url ? `..${e.url}` : `${e.slug}/`;   // relative to the section folder (works from Finder and live)
const absOf  = e => e.url ? `https://nbhas.xyz${e.url}` : `${SECTIONS[sectionOf(e)].url}${e.slug}/`;
let entries = all; // set per section below


function tile(e) {
  const badge = sectionOf(e) === 'sidequests' ? `<span class="badge">${esc(e.kind)}</span>` : '';
  if (e.video) {
    return `<div class="tile media video"><img src="${esc(e.image)}" alt="${esc(e.image_alt || '')}" loading="lazy">${badge}
        <button class="watch" type="button" aria-label="Watch ${esc(e.title)}" data-video="${esc(e.video)}" data-title="${esc(e.title)}" data-deck="${esc(e.deck)}" data-href="${esc(hrefOf(e))}"><span class="ico" aria-hidden="true"></span></button>
        ${e.kicker ? `<span class="dur">${esc(e.kicker)}</span>` : ''}</div>`;
  }
  if (e.image && e.kind === 'Visuals') {
    return `<div class="tile media visual"><img src="${esc(e.image)}" alt="${esc(e.image_alt || '')}" loading="lazy">${badge}
        <button class="preview" type="button" aria-label="Preview ${esc(e.title)}" data-lightbox="${esc(e.image)}" data-alt="${esc(e.image_alt || '')}" data-title="${esc(e.title)}" data-deck="${esc(e.deck)}" data-href="${esc(hrefOf(e))}">↗</button></div>`;
  }
  if (e.image && sectionOf(e) === 'sidequests') {
    return `<div class="tile"><img src="${esc(e.image)}" alt="${esc(e.image_alt || '')}" loading="lazy">${badge}</div>`;
  }
  if (e.image) {
    return `<div class="tile"><img src="${esc(e.image)}" alt="${esc(e.image_alt || '')}" loading="lazy"></div>`;
  }
  if (e.quote && sectionOf(e) === 'sidequests') {
    return `<div class="tile quote"><p>${esc(e.quote)}</p>${badge}<span class="glyph" aria-hidden="true">✳</span></div>`;
  }
  if (e.quote) {
    return `<div class="tile quote"><p>${esc(e.quote)}</p></div>`;
  }
  const s = e.series && series[e.series];
  return `<div class="tile mark"><span class="num">✳</span></div>`;
}

function card(e) {
  const sq = sectionOf(e) === 'sidequests';
  const s = e.series && series[e.series];
  const seriesLine = s ? `<div class="series">${esc(s.title)} · ${partLabel(e)}</div>` : '';
  const player = e.audio ? `<div class="player">
          <button class="pp" type="button" aria-label="Play ${esc(e.title)}"><span class="ico" aria-hidden="true"></span></button>
          <input class="seek" type="range" min="0" max="1000" value="0" step="1" aria-label="Seek ${esc(e.title)}">
          <span class="time">0:00 / ${esc(e.kicker || '0:00')}</span>
          <audio preload="metadata" src="${esc(e.audio)}"></audio>
        </div>` : '';
  const note = sq && e.note ? `<div class="note" hidden>${e.note}</div>
        <button class="more" type="button" aria-expanded="false">Read the note ↗</button>` : '';
  const act = sq && e.video ? `<button class="act watch" type="button" data-video="${esc(e.video)}" data-title="${esc(e.title)}" data-deck="${esc(e.deck)}" data-href="${esc(hrefOf(e))}">Watch ↗</button>`
            : sq && e.kind === 'Visuals' ? `<button class="act preview" type="button" data-lightbox="${esc(e.image)}" data-alt="${esc(e.image_alt || '')}" data-title="${esc(e.title)}" data-deck="${esc(e.deck)}" data-href="${esc(hrefOf(e))}">Preview ↗</button>` : '';
  const title = sq ? `<h3>${esc(e.title)}</h3>` : `<h3><a href="${esc(hrefOf(e))}">${esc(e.title)}</a></h3>`;
  const meta = sq
    ? `<div class="meta"><span>${esc(e.meta || '')}</span><span class="date">${fmtDate(e.date)}</span></div>`
    : `<div class="meta">${e.kicker && !e.audio ? `<span>${esc(e.kicker)}</span>` : ``}<span>${fmtDate(e.date)}</span>${e.status === 'draft' ? `<span class="draft">Draft</span>` : ``}</div>`;
  return `
      <article class="entry" data-kind="${esc(e.kind)}" data-tags="${esc((e.tags||[]).join(' '))}">
        ${tile(e)}
        ${sq ? '' : meta}
        ${title}
        <p class="deck">${esc(e.deck)}</p>
        ${seriesLine}
        ${(e.tags||[]).length ? `<div class="tags">${e.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>` : ``}
        ${player}${note}${act}
        ${sq ? meta : ''}
      </article>`;
}

const head = (title, desc, canonical, S) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(canonical)}">
<link rel="icon" href="${S.assets}/favicon.svg" type="image/svg+xml">
<link rel="icon" href="${S.assets}/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="${S.assets}/apple-touch-icon.png">
<link rel="alternate" type="application/rss+xml" title="${esc(site.title)}" href="${S.assets === "assets" ? "feed.xml" : "../journal/feed.xml"}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:site_name" content="Nishant Bhaskar">
<meta property="og:image" content="https://nbhas.xyz/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@nbhaskar888">
<meta name="author" content="Nishant Bhaskar">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=Noto+Sans+Devanagari:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${S.assets}/journal.css">${S.css ? `\n<link rel="stylesheet" href="${S.assets}/${S.css}">` : ``}
</head>`;

const nav = (S, key) => `
<nav class="top">
  <div class="inner">
    <a href="../" class="brand">Nishant Bhaskar <span>/ ${key === 'journal' ? 'Journal' : 'Side quests<i class="glyph">✳</i>'}</span></a>
  </div>
</nav>`;

const LIGHTBOX = `
<dialog class="lightbox" aria-label="Preview">
  <div class="box">
    <button class="close" type="button" aria-label="Close">×</button>
    <h3></h3><p class="deck"></p>
    <video controls playsinline preload="metadata" hidden></video>
    <img alt="" hidden>
    <p class="open"><a href="#">Open the page →</a></p>
  </div>
</dialog>`;

const OUTRO = `
  <section class="outro">
    <p class="banner" aria-hidden="true"><span>Good things start with a what if</span><span>Good things start with a what if</span></p>
    <h2>Let’s make<br>something weird.<sup>*</sup></h2>
    <p class="ask">A half-baked idea? A wild experiment? A really good playlist?<br>I’m all ears.</p>
    <p class="ways"><a href="https://www.instagram.com/nbhaskar888/">Say hello on Instagram ↗</a><a href="https://x.com/nbhaskar888">or on X ↗</a></p>
    <p class="fn"><sup>*</sup>the good kind.</p>
  </section>`;

const footer = (key) => `
<footer class="site">
  ${key === 'sidequests' ? '<p class="motto">✳ Always exploring. Occasionally finishing.</p>' : ''}
  <p>© ${year} Nishant Bhaskar · <a href="../">nbhas.xyz</a>${key !== 'journal' ? ` · <a href="../journal/">Journal</a>` : ''}${SIDEQUESTS_ON && key !== 'sidequests' ? ` · <a href="../sidequests/">Side quests</a>` : ''} · <a href="${key === 'journal' ? 'feed.xml' : '../journal/feed.xml'}">RSS</a></p>
</footer>`;

// ---------- index.html, one per section ----------
function chips() {
  const kindCount = {}, tagCount = {};
  entries.forEach(e => { kindCount[e.kind] = (kindCount[e.kind]||0)+1; (e.tags||[]).forEach(t => tagCount[t] = (tagCount[t]||0)+1); });
  const kinds = (CUR.kinds || []).filter(k => kindCount[k]);
  const tags = site.tags.filter(t => tagCount[t]);
  const chip = (f, v, label, n) => `<button class="chip" type="button" data-filter="${f}" data-value="${esc(v)}" aria-pressed="false">${esc(label)}<span class="n">${n}</span></button>`;
  const allChip = `<button class="chip" type="button" data-filter="all" data-value="" aria-pressed="true">All<span class="n">${entries.length}</span></button>`;
  const kindGroup = kinds.length ? `
      <div class="group">
        ${allChip}
        ${kinds.map(k => chip('kind', k, k, kindCount[k])).join('\n        ')}
      </div>
      <span class="sep" aria-hidden="true"></span>` : '';
  const tagGroup = (tags.length || !kinds.length) ? `
      <div class="group">
        ${kinds.length ? '' : allChip}
        ${tags.map(t => chip('tag', t, t.replace(/-/g,' '), tagCount[t])).join('\n        ')}
      </div>` : '';
  return `
    <div class="filters" role="group" aria-label="Filter entries">${kindGroup.replace(/<span class="sep"[^>]*><\/span>$/, tags.length ? '<span class="sep" aria-hidden="true"></span>' : '')}${tagGroup}
    </div>`;
}
const SIDEQUESTS_ON = fs.existsSync(SECTIONS.sidequests.dir);
if (!SIDEQUESTS_ON) delete SECTIONS.sidequests;

let CUR = null;
for (const [key, S] of Object.entries(SECTIONS)) {
  CUR = S;
  entries = all.filter(e => sectionOf(e) === key);
  fs.mkdirSync(S.dir, { recursive: true });
  const page = `${head(S.title, S.intro || S.h1, S.url, S)}
<body>${nav(S, key)}
<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"Blog","name":S.title,"url":S.url,"description":S.intro || S.h1,"author":{"@type":"Person","name":"Nishant Bhaskar","url":"https://nbhas.xyz/"},"blogPost":entries.filter(e=>!e.url).map(e=>({"@type":"BlogPosting","headline":e.title,"url":absOf(e),"datePublished":e.date,"description":e.deck}))})}</script>
<main class="wrap">
  <header class="journal-hero">
    <p class="eyebrow">${esc(S.eyebrow)}</p>
    <h1>${S.h1}</h1>${S.intro ? `\n    <p>${esc(S.intro)}</p>` : ``}
  </header>
  ${chips()}
  <section class="entries" aria-live="polite">${entries.map(card).join('\n')}
  </section>
  <p class="empty">Nothing here yet under that combination.</p>${S.css ? OUTRO : ''}
</main>${footer(key)}${S.css ? LIGHTBOX : ''}
<script src="${S.assets}/journal.js" defer></script>
</body>
</html>
`;
  fs.writeFileSync(path.join(S.dir, 'index.html'), page);
  console.log(`${key}: ${entries.length} entries`);
}
entries = all.filter(e => sectionOf(e) === 'journal');   // feed and homepage snippet are journal-only

// ---------- patch the post pages: status, and generated header/footer nav ----------
// Nav lives between markers so it can be regenerated without touching hand-written content:
//   <!-- NAV:START --> ... <!-- NAV:END -->           in the page header
//   <!-- POSTNAV:START --> ... <!-- POSTNAV:END -->   in the page footer
// "Next" means the next NEWER entry by date. A link is only rendered when its target is
// listed, so unlisted drafts never leak; the slot is simply left empty instead.

const posts = everything.filter(e => sectionOf(e) === 'journal' && !e.url);  // newest first
const visible = e => e && e.status !== 'unlisted';

function navBlocks(e) {
  const i = posts.indexOf(e);
  const newer = i > 0 ? posts[i - 1] : null;          // "next"
  const older = i < posts.length - 1 ? posts[i + 1] : null;  // "previous"
  const nextTo = visible(newer) ? newer : null;
  const prevTo = visible(older) ? older : null;

  const header =
    `<a class="jnav-brand" href="../../">Nishant Bhaskar <span>/ Journal</span></a>\n` +
    `    <a class="jnav-all" href="../">← All posts</a>\n` +
    (nextTo
      ? `    <a class="jnav-next" href="../${esc(nextTo.slug)}/">Next: <span class="jt">${esc(nextTo.title)}</span> →</a>`
      : `    <span class="jnav-next jnav-empty" aria-hidden="true"></span>`);

  const seq =
    (prevTo ? `<a class="jseq-prev" href="../${esc(prevTo.slug)}/"><span class="d">← Previous</span><span class="t">${esc(prevTo.title)}</span></a>` : `<span class="jseq-gap"></span>`) +
    (nextTo
      ? `<a class="jseq-next" href="../${esc(nextTo.slug)}/"><span class="d">Next →</span><span class="t">${esc(nextTo.title)}</span></a>`
      : visible(e)
        // listed, and nothing newer is published: for a reader this really is the latest
        ? `<span class="jseq-newest"><span class="d">You’re at the newest</span><span class="t"><a href="../">All posts →</a></span></span>`
        // unlisted draft: the newer entry exists but isn't published, so claim nothing
        : `<span class="jseq-newest"><span class="t"><a href="../">All posts →</a></span></span>`);

  const footer =
    `<nav class="jseq" aria-label="More entries">${seq}</nav>\n` +
    `    <p class="jcredit">© ${year} Nishant Bhaskar · <a href="../../">nbhas.xyz</a> · <a href="../">Journal</a> · <a href="../feed.xml">RSS</a></p>`;

  return { header, footer };
}

function fillMarkers(h, name, body) {
  const re = new RegExp(`(<!--\\s*${name}:START\\s*-->)[\\s\\S]*?(<!--\\s*${name}:END\\s*-->)`);
  if (!re.test(h)) return { html: h, found: false };
  return { html: h.replace(re, `$1\n    ${body}\n    $2`), found: true };
}

let navDone = 0, navMissing = [];
for (const e of posts) {
  const f = path.join(here, e.slug, 'index.html');
  if (!fs.existsSync(f)) continue;
  let h = fs.readFileSync(f, 'utf8');
  const unlisted = e.status === 'unlisted', draft = e.status === 'draft' || unlisted;

  h = h.replace(/\n<meta name="robots" content="noindex">/g, '');
  if (unlisted) h = h.replace('<link rel="canonical"', '\n<meta name="robots" content="noindex">\n<link rel="canonical"'.slice(1));
  h = h.replace(/<span class="draft">Draft<\/span>/g, '');
  if (draft) h = h.replace(/(<p class="byline">.*?)(<\/p>)/s, '$1<span class="draft">Draft</span>$2');

  // entries.json is the source for plain-text metadata. Deliberately NOT generated:
  // <h1> (music pages carry <em> inside it) and the in-page deck/.sub (separate editorial copy).
  const pageTitle = `${e.title} — Journal — Nishant Bhaskar`;
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(pageTitle)}</title>`);
  h = h.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(e.title)}$2`);
  h = h.replace(/("headline":")(?:[^"\\]|\\.)*(")/, `$1${esc(e.title).replace(/"/g,'\\"')}$2`);
  const sObj = e.series && series[e.series];
  if (sObj) {
    const kick = `${esc(partLabel(e))} · ${esc(sObj.title)}`;
    // essays wrap the kicker in a span; the music pages don't
    h = h.replace(/(<div class="kicker"><span>)[^<]*(<\/span>)/, `$1${kick}$2`);
    h = h.replace(/(<div class="kicker">)([^<]*)(<\/div>)/, `$1${kick}$3`);
  }

  // keep every printed date in step with entries.json (both page lineages)
  const human = fmtDate(e.date);
  h = h.replace(/(<p class="byline"><span>Nishant Bhaskar<\/span><span>)[^<]*(<\/span>)/, `$1${human}$2`);
  h = h.replace(/(<p class="jdate"[^>]*>Nishant Bhaskar · )[^<]*(<\/p>)/, `$1${human}$2`);
  h = h.replace(/(<meta property="article:published_time" content=")[^"]*(")/, `$1${e.date}$2`);
  h = h.replace(/("datePublished":")[^"]*(")/, `$1${e.date}$2`);

  const blocks = navBlocks(e);
  const a = fillMarkers(h, 'NAV', blocks.header);
  const b = fillMarkers(a.html, 'POSTNAV', blocks.footer);
  h = b.html;
  if (a.found && b.found) navDone++; else navMissing.push(e.slug + (a.found ? '' : ' [no NAV]') + (b.found ? '' : ' [no POSTNAV]'));

  fs.writeFileSync(f, h);
}
console.log(`nav: ${navDone}/${posts.length} pages filled` + (navMissing.length ? `; missing markers -> ${navMissing.join(', ')}` : ''));

// ---------- feed.xml ----------
const items = entries.map(e => `  <item>
    <title>${esc(e.title)}</title>
    <link>${esc(absOf(e))}</link>
    <guid isPermaLink="true">${esc(absOf(e))}</guid>
    <pubDate>${rfc822(e.date)}</pubDate>
    <category>${esc(e.kind)}</category>${(e.tags||[]).map(t => `\n    <category>${esc(t)}</category>`).join('')}
    <description>${esc(e.deck)}</description>
  </item>`).join('\n');
const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(site.title)}</title>
  <link>${esc(site.url)}</link>
  <atom:link href="${esc(site.url)}feed.xml" rel="self" type="application/rss+xml"/>
  <description>${esc(site.description)}</description>
  <language>en</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
</channel>
</rss>
`;
fs.writeFileSync(path.join(here, 'feed.xml'), feed);

// ---------- homepage snippet (latest three, journal only, in the homepage's Places pattern: a swipe row on phones, a grid on desktop) ----------
fs.mkdirSync(path.join(here, 'snippets'), { recursive: true });
const latest = entries.slice(0, 3);
const homeTile = e => e.image
  ? `<div class="tile"><img src="journal/${esc(e.image)}" alt="${esc(e.image_alt || '')}" loading="lazy" decoding="async"></div>`
  : e.quote ? `<div class="tile journal-quote"><p>${esc(e.quote)}</p></div>`
  : `<div class="tile journal-mark"><span>✳</span></div>`;
const homeSource = e => esc(e.kicker && !e.audio ? e.kicker : (e.series ? series[e.series].title + ' · ' + partLabel(e) : 'Journal')) + ' · ' + fmtDate(e.date);
const snippet = `<!-- Journal: latest three. Generated by journal/build.js — paste over the block between the JOURNAL markers in index.html. -->
<p class="public-intro">${esc(SECTIONS.journal.h1)}</p>
<div class="swipe swipe--journal" aria-label="Journal">
${latest.map(e => `  <a class="swipe-item journal-card" href="${esc(e.url ? e.url.replace(/^\//,'') : 'journal/' + e.slug + '/')}">
    ${homeTile(e)}
    <div class="journal-source">${homeSource(e)}</div>
    <div class="journal-title">${esc(e.title)}</div>
    <div class="journal-deck">${esc(e.deck)}</div>
  </a>`).join('\n')}
</div>
<p class="journal-all"><a href="journal/">All entries →</a></p>
`;
fs.writeFileSync(path.join(here, 'snippets', 'home-section.html'), snippet);

// ---------- paste the snippet straight into the homepage ----------
// This used to be a manual copy after every build, and it got missed:
// the home page carried a stale alt long after the post's header changed.
const homePage = path.join(here, '..', 'V9', 'index.html');
if (fs.existsSync(homePage)) {
  const before = fs.readFileSync(homePage, 'utf8');
  const re = /([ \t]*)(<!-- JOURNAL:START[^>]*-->)[\s\S]*?([ \t]*)(<!-- JOURNAL:END[^>]*-->)/;
  if (!re.test(before)) {
    console.log('home page: JOURNAL markers not found - left untouched');
  } else {
    const marked = before.replace(re, (_m, i1, a, i2, b) =>
      `${i1}${a}\n${snippet.trim()}\n${i1}${b}`);
    if (marked === before) {
      console.log('home page: journal block already current');
    } else {
      fs.writeFileSync(homePage, marked);
      console.log('home page: journal block updated');
    }
  }
}

// ---------- sitemap (live journal pages only) ----------
const today = new Date().toISOString().slice(0,10);
const urls = [{loc: site.url, lastmod: today}].concat(entries.map(e => ({loc: absOf(e), lastmod: e.date > today ? today : e.date})));
fs.writeFileSync(path.join(here, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${esc(u.loc)}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('\n')}
</urlset>
`);
console.log('feed.xml, sitemap.xml and snippets/home-section.html written (journal only)');

// ---------- self-check ----------
// Runs on every build and exits non-zero on failure, so a regression is loud rather
// than something you notice weeks later on the live site. Add a check here whenever
// a class of mistake costs you time twice.
(function selfCheck() {
  const problems = [];
  const warn = [];
  const fail = m => problems.push(m);

  const seen = new Set();
  for (const e of data.entries) {
    if (seen.has(e.slug)) fail(`duplicate slug: ${e.slug}`);
    seen.add(e.slug);
  }

  for (const e of posts) {
    const dir = path.join(here, e.slug);
    const file = path.join(dir, 'index.html');
    if (!fs.existsSync(file)) { fail(`${e.slug}: no index.html`); continue; }
    const h = fs.readFileSync(file, 'utf8');

    if (e.image && !fs.existsSync(path.join(here, e.image))) fail(`${e.slug}: image missing on disk -> ${e.image}`);
    if (e.image && !e.image_alt) fail(`${e.slug}: has image but no image_alt`);

    for (const name of ['NAV', 'POSTNAV']) {
      const m = h.match(new RegExp(`<!--\\s*${name}:START\\s*-->([\\s\\S]*?)<!--\\s*${name}:END\\s*-->`));
      if (!m) fail(`${e.slug}: ${name} markers missing`);
      else if (!m[1].trim()) fail(`${e.slug}: ${name} block is empty`);
    }

    // every printed date agrees with entries.json
    const human = fmtDate(e.date);
    const shown = h.match(/<p class="byline"><span>Nishant Bhaskar<\/span><span>([^<]*)<\/span>/)
               || h.match(/<p class="jdate"[^>]*>Nishant Bhaskar · ([^<]*)<\/p>/);
    if (!shown) fail(`${e.slug}: no visible byline date (markup changed? build.js can no longer keep it in sync)`);
    else if (shown[1].trim() !== human) fail(`${e.slug}: byline "${shown[1].trim()}" != ${human}`);
    for (const [label, re] of [['article:published_time', /article:published_time" content="([^"]+)"/],
                               ['datePublished', /"datePublished":"([^"]+)"/]]) {
      const m = h.match(re);
      if (!m) fail(`${e.slug}: no ${label}`);
      else if (m[1] !== e.date) fail(`${e.slug}: ${label} ${m[1]} != ${e.date}`);
    }

    const t = h.match(/<title>([\s\S]*?)<\/title>/);
    if (t && !t[1].includes(e.title)) fail(`${e.slug}: <title> does not carry the entry title`);

    const ld = h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (ld) { try { JSON.parse(ld[1]); } catch (err) { fail(`${e.slug}: JSON-LD does not parse (${err.message})`); } }

    for (const [open, close] of [[/<style\b/g, /<\/style>/g], [/<figure\b/g, /<\/figure>/g],
                                 [/<footer\b/g, /<\/footer>/g], [/<nav\b/g, /<\/nav>/g]]) {
      const a = (h.match(open) || []).length, b = (h.match(close) || []).length;
      if (a !== b) fail(`${e.slug}: unbalanced ${open.source} (${a} open, ${b} close)`);
    }
    if ((h.match(/<\/html>/g) || []).length !== 1) fail(`${e.slug}: </html> not exactly once`);

    if (!/assets\/chrome\.css/.test(h)) fail(`${e.slug}: does not load chrome.css`);
    if (!/<body[^>]*class="[^"]*chrome-/.test(h)) fail(`${e.slug}: no chrome-* theme class on <body>`);

    // an unlisted draft must never be linked from a page that is listed
    if (e.status !== 'unlisted') {
      for (const other of posts) {
        if (other.status === 'unlisted' && h.includes(`href="../${other.slug}/"`))
          fail(`${e.slug} links to unlisted ${other.slug}`);
      }
    }
  }

  // unlisted entries stay out of the generated surfaces
  for (const f of ['index.html', 'feed.xml', 'sitemap.xml', path.join('snippets', 'home-section.html')]) {
    const p = path.join(here, f);
    if (!fs.existsSync(p)) continue;
    const c = fs.readFileSync(p, 'utf8');
    for (const e of posts) {
      if (e.status === 'unlisted' && c.includes(`${e.slug}/`)) fail(`${f}: leaks unlisted ${e.slug}`);
    }
  }

  warn.forEach(w => console.log(`  note: ${w}`));
  if (problems.length) {
    console.error(`\nself-check FAILED (${problems.length}):`);
    problems.forEach(p => console.error(`  ✗ ${p}`));
    process.exitCode = 1;
  } else {
    console.log(`self-check passed (${posts.length} pages)`);
  }
})();

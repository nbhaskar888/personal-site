/* nbhas.xyz/journal — filters.
   Progressive: with JS off every entry shows. With JS on, chips filter by kind (Essay, Song…)
   and by tag (culture, music…). One kind and one tag can be active at once; "All" clears. */
(function () {
  var grid = document.querySelector('.entries');
  if (!grid) return;
  var entries = Array.prototype.slice.call(grid.querySelectorAll('.entry'));
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var empty = document.querySelector('.empty');
  var state = { kind: null, tag: null };

  function apply() {
    var shown = 0;
    entries.forEach(function (el) {
      var okKind = !state.kind || el.getAttribute('data-kind') === state.kind;
      var tags = (el.getAttribute('data-tags') || '').split(' ');
      var okTag = !state.tag || tags.indexOf(state.tag) !== -1;
      var show = okKind && okTag;
      el.classList.toggle('is-hidden', !show);
      if (show) shown++;
    });
    chips.forEach(function (c) {
      var f = c.getAttribute('data-filter'), v = c.getAttribute('data-value');
      var on = f === 'all' ? (!state.kind && !state.tag) : state[f] === v;
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (empty) empty.style.display = shown ? 'none' : 'block';
    var h = [];
    if (state.kind) h.push('kind=' + state.kind);
    if (state.tag) h.push('tag=' + state.tag);
    history.replaceState(null, '', h.length ? '#' + h.join('&') : location.pathname);
  }

  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      var f = c.getAttribute('data-filter'), v = c.getAttribute('data-value');
      if (f === 'all') { state.kind = null; state.tag = null; }
      else state[f] = (state[f] === v) ? null : v;
      apply();
    });
  });

  // Restore from URL hash, e.g. /journal/#tag=music
  if (location.hash) {
    location.hash.slice(1).split('&').forEach(function (p) {
      var kv = p.split('=');
      if (kv[0] === 'kind' || kv[0] === 'tag') state[kv[0]] = decodeURIComponent(kv[1] || '');
    });
  }
  apply();
})();


/* Nav: hides on scroll-down, returns on scroll-up (small screens; CSS pins it on desktop). Same behaviour as the main site. */
(function () {
  var nav = document.querySelector('nav.top');
  if (!nav) return;
  var lastY = window.scrollY, ticking = false;
  function update() {
    var maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    var y = Math.max(0, Math.min(maxY, window.scrollY));
    nav.classList.toggle('is-scrolled', y > 20);
    if (maxY - y < 60) { lastY = y; ticking = false; return; }
    if (y < 80) nav.classList.remove('is-hidden');
    else if (y > lastY + 10 && y > 120) nav.classList.add('is-hidden');
    else if (y < lastY - 10) nav.classList.remove('is-hidden');
    lastY = y; ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
})();


/* In-card playback, as on the side-quests mock: songs play from a row under the deck
   (round button, seek slider, time); videos open in a lightbox with native controls.
   One thing plays at a time. Progressive: without JS the links still lead to the pages. */
(function () {
  var current = null;
  function fmt(s) { s = Math.floor(s || 0); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  document.querySelectorAll('.player').forEach(function (p) {
    var a = p.querySelector('audio'), pp = p.querySelector('.pp'), seek = p.querySelector('.seek'), time = p.querySelector('.time');
    if (!a || !pp) return;
    var total = time.textContent.split('/')[1].trim();
    pp.addEventListener('click', function () {
      if (a.paused) { if (current && current !== a) current.pause(); current = a; a.play(); } else { a.pause(); }
    });
    a.addEventListener('play',  function () { p.classList.add('is-playing'); pp.setAttribute('aria-label', 'Pause'); });
    a.addEventListener('pause', function () { p.classList.remove('is-playing'); pp.setAttribute('aria-label', 'Play'); });
    a.addEventListener('loadedmetadata', function () { if (a.duration) total = fmt(a.duration); time.textContent = '0:00 / ' + total; });
    a.addEventListener('timeupdate', function () {
      if (a.duration && !seek.matches(':active')) seek.value = Math.round(a.currentTime / a.duration * 1000);
      time.textContent = fmt(a.currentTime) + ' / ' + total;
      seek.style.setProperty('--p', (seek.value / 10) + '%');
    });
    a.addEventListener('ended', function () { seek.value = 0; seek.style.setProperty('--p', '0%'); time.textContent = '0:00 / ' + total; });
    seek.addEventListener('input', function () { if (a.duration) a.currentTime = seek.value / 1000 * a.duration; seek.style.setProperty('--p', (seek.value / 10) + '%'); });
  });

  var box = document.querySelector('dialog.lightbox');
  if (box) {
    var v = box.querySelector('video'), im = box.querySelector('img'), open = box.querySelector('.open a');
    function show(opts) {
      if (current) current.pause();
      box.querySelector('h3').textContent = opts.title || '';
      box.querySelector('.deck').textContent = opts.deck || '';
      open.href = opts.href || '#'; open.parentNode.hidden = !opts.href;
      if (opts.video) { im.hidden = true; v.hidden = false; v.src = opts.video; }
      else { v.hidden = true; im.hidden = false; im.src = opts.image; im.alt = opts.alt || ''; }
      box.showModal();
      if (opts.video) { v.play(); current = v; }
    }
    var opener = null;
    document.querySelectorAll('.watch').forEach(function (btn) {
      btn.addEventListener('click', function () {
        opener = btn;
        show({ title: btn.dataset.title, deck: btn.dataset.deck, video: btn.dataset.video, href: btn.dataset.href });
      });
    });
    document.querySelectorAll('.preview').forEach(function (btn) {
      btn.addEventListener('click', function () {
        opener = btn;
        show({ title: btn.dataset.title, deck: btn.dataset.deck, image: btn.dataset.lightbox, alt: btn.dataset.alt, href: btn.dataset.href });
      });
    });
    function shut() { v.pause(); v.removeAttribute('src'); v.load(); im.removeAttribute('src'); box.close(); if (opener) opener.focus(); }
    box.querySelector('.close').addEventListener('click', shut);
    box.addEventListener('click', function (ev) { if (ev.target === box) shut(); });
    box.addEventListener('cancel', function (ev) { ev.preventDefault(); shut(); });
  }
})();


/* Notes: "Read the note" expands the full text in the card; "A little less" folds it back. */
(function () {
  document.querySelectorAll('.entry .more').forEach(function (btn) {
    var note = btn.previousElementSibling;
    btn.addEventListener('click', function () {
      var open = note.hidden;
      note.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'A little less ↖' : 'Read the note ↗';
    });
  });
  document.querySelectorAll('.outro .ways a, footer.site a[href^="http"]').forEach(function (a) { a.target = '_blank'; a.rel = 'noopener'; });
})();

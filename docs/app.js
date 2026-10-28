/* Koto Square TOP design — page behaviour (no dependencies) */
(function () {
  'use strict';
  var root = document.querySelector('.ks');
  var isSP = document.body.getAttribute('data-page') === 'sp';
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var INK = '#111114', GHOST = '#E9EAEE';
  var op = document.querySelector('.op');
  var hero = document.querySelector('[role="group"][aria-label="ロゴに込めた3つの考え方"]');
  var pieces = hero.querySelectorAll('svg > polygon.pc');
  var sqb = hero.querySelector('.sqb');
  var nums = sqb.querySelectorAll('text[style*="opacity"]');
  var caps = hero.querySelectorAll('.cap');
  var tabs = hero.querySelectorAll('.tab');
  var ctl = hero.querySelector('.ctl');
  var capShift = isSP ? 10 : 12;

  var state = { stage: -1, playing: true, hover: false, skipped: false };
  var heroTimer = null, introTimer = null;

  var ICON_PAUSE = '<svg viewBox="0 0 16 16" aria-hidden="true" style="width:14px;height:14px"><rect x="3" y="2" width="3" height="12" style="fill:#111114"></rect><rect x="10" y="2" width="3" height="12" style="fill:#111114"></rect></svg>';
  var ICON_PLAY = '<svg viewBox="0 0 16 16" aria-hidden="true" style="width:14px;height:14px"><polygon points="4,2 14,8 4,14" style="fill:#111114"></polygon></svg>';

  function piece(el, on, dx, dy) {
    el.style.fill = on ? INK : GHOST;
    el.style.transform = on ? 'translate(0px, 0px)' : 'translate(' + dx + 'px, ' + dy + 'px)';
  }

  function render() {
    var s = state.stage, shown = Math.max(s, 0);
    piece(pieces[0], s >= 0, -12, -12);
    piece(pieces[1], s >= 1, 16, 0);
    piece(pieces[2], s >= 2, -12, 12);
    sqb.style.animationName = 'sqP' + shown;
    for (var i = 0; i < 3; i++) {
      nums[i].style.opacity = i === shown ? 1 : 0;
      caps[i].style.opacity = i === shown ? 1 : 0;
      caps[i].style.transform = i === shown ? 'none' : 'translateY(' + (i < shown ? -capShift : capShift) + 'px)';
      caps[i].setAttribute('aria-hidden', i === shown ? 'false' : 'true');
      tabs[i].setAttribute('aria-pressed', i === shown ? 'true' : 'false');
      var label = tabs[i].querySelector('span.en');
      if (label) label.style.color = i <= shown ? INK : '#686973';
      var bar = tabs[i].querySelector('.tbar i');
      bar.className = i < shown ? 'full' : (i === shown ? (state.playing && s >= 0 ? 'run' : 'full') : '');
      bar.style.animationPlayState = state.hover ? 'paused' : 'running';
    }
    ctl.setAttribute('aria-label', state.playing ? '自動再生を一時停止' : '自動再生を再開');
    ctl.innerHTML = state.playing ? ICON_PAUSE : ICON_PLAY;
  }

  function startHeroTimer() {
    clearInterval(heroTimer);
    heroTimer = setInterval(function () {
      if (!state.playing || state.hover) return;
      state.stage = (state.stage + 1) % 3;
      render();
    }, 3400);
  }

  function finishOpening(skipped) {
    clearTimeout(introTimer);
    op.classList.add('done');
    if (skipped) { state.skipped = true; root.className = 'ks skip'; }
    if (state.stage < 0) state.stage = 0;
    render();
    startHeroTimer();
  }

  tabs.forEach(function (t, k) {
    t.addEventListener('click', function () { state.stage = k; state.playing = false; render(); });
  });
  ctl.addEventListener('click', function () {
    if (state.playing) { state.playing = false; render(); return; }
    state.playing = true; render(); startHeroTimer();
  });
  if (!isSP) {
    hero.addEventListener('mouseenter', function () { state.hover = true; render(); });
    hero.addEventListener('mouseleave', function () { state.hover = false; render(); });
    hero.addEventListener('focusin', function () { state.hover = true; render(); });
    hero.addEventListener('focusout', function () { state.hover = false; render(); });
  }

  if (reduced) {
    state.stage = 2; state.playing = false; state.skipped = true;
    root.className = 'ks skip';
    op.classList.add('done');
    render();
  } else {
    render();
    op.addEventListener('click', function () { finishOpening(true); });
    introTimer = setTimeout(function () { finishOpening(false); }, 3400);
    vectorZoom();
  }

  /* ---- Opening zoom: animate the SVG viewBox instead of CSS scale(70),
     so the mark is re-drawn as vector every frame and stays sharp on high-DPI phones ---- */
  function vectorZoom() {
    var svg = op.querySelector('.op-mark svg');
    if (!svg || !window.requestAnimationFrame) return;
    var MARK = isSP ? 88 : 120, OX = 4, OY = 52, MAXS = 70;
    var DELAY = 1850, DUR = 1100;
    // cubic-bezier(.7,0,.2,1), same easing as the CSS opZoom
    function bez(t) {
      var x1 = .7, y1 = 0, x2 = .2, y2 = 1, u = t;
      for (var i = 0; i < 8; i++) {
        var x = 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u - t;
        var dx = 3 * (1 - u) * (1 - u) * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u * u * (1 - x2);
        if (Math.abs(x) < 1e-5 || !dx) break;
        u = Math.min(1, Math.max(0, u - x / dx));
      }
      return 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u;
    }
    function frame(s) {
      var vw = op.clientWidth || window.innerWidth, vh = op.clientHeight || window.innerHeight;
      var w = vw * 100 / MARK, h = vh * 100 / MARK;
      var x = 50 - w / 2, y = 50 - h / 2;
      svg.setAttribute('viewBox', [OX - (OX - x) / s, OY - (OY - y) / s, w / s, h / s].join(' '));
    }
    op.classList.add('vz');
    frame(1);
    // follow the CSS opOut clock when available so the zoom stays in sync with the fade
    var t0 = performance.now();
    var anim = op.getAnimations && op.getAnimations()[0];
    (function tick(now) {
      if (op.classList.contains('done')) return;
      var t = anim && typeof anim.currentTime === 'number' ? anim.currentTime : now - t0;
      var p = Math.min(1, Math.max(0, (t - DELAY) / DUR));
      frame(1 + (MAXS - 1) * bez(p));
      if (p < 1) requestAnimationFrame(tick);
    })(performance.now());
  }

  /* ---- News slider ---- */
  var ntrk = document.querySelector('.ntrk');
  var cards = ntrk.children.length;
  var step = isSP ? 312 : 408;
  var nMax = isSP ? cards - 1 : cards - 3;
  var ni = 0, newsHover = false;
  var newsSec = document.querySelector(isSP ? '#news-sp' : '#news');
  var nbar = newsSec.querySelector('div[style*="transition: width"]');
  var counter = null;
  newsSec.querySelectorAll('p.en').forEach(function (p) { if (/^\d\d \/ \d\d$/.test(p.textContent.trim())) counter = p; });
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function renderNews() {
    ntrk.style.transform = 'translateX(' + (-ni * step) + 'px)';
    nbar.style.width = ((ni + 1) / (nMax + 1) * 100) + '%';
    if (counter) counter.textContent = pad(ni + 1) + ' / ' + pad(nMax + 1);
  }
  var btnPrev = newsSec.querySelector('button[aria-label="前のお知らせ"]');
  var btnNext = newsSec.querySelector('button[aria-label="次のお知らせ"]');
  btnPrev.addEventListener('click', function () { ni = (ni + nMax) % (nMax + 1); renderNews(); });
  btnNext.addEventListener('click', function () { ni = (ni + 1) % (nMax + 1); renderNews(); });
  if (!isSP) {
    var wrap = ntrk.parentNode;
    wrap.addEventListener('mouseenter', function () { newsHover = true; });
    wrap.addEventListener('mouseleave', function () { newsHover = false; });
    wrap.addEventListener('focusin', function () { newsHover = true; });
    wrap.addEventListener('focusout', function () { newsHover = false; });
  }
  renderNews();
  if (!reduced) {
    setInterval(function () { if (newsHover) return; ni = (ni + 1) % (nMax + 1); renderNews(); }, 5000);
  }

  /* ---- SP menu ---- */
  var mb = document.querySelector('button.mb');
  if (mb) {
    var menu = document.getElementById('sp-menu');
    var bars = mb.querySelectorAll('span');
    function setMenu(open) {
      menu.hidden = !open;
      mb.setAttribute('aria-expanded', open ? 'true' : 'false');
      mb.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
      bars[0].style.transform = open ? 'translateY(3.75px) rotate(45deg)' : 'none';
      bars[1].style.transform = open ? 'translateY(-3.75px) rotate(-45deg)' : 'none';
    }
    mb.addEventListener('click', function () { setMenu(menu.hidden); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); mb.focus(); } });
  }
})();

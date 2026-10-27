/* ==========================================================================
   Crisoverde Digital — Vinheta de abertura
   JavaScript puro, sem dependências.

   Responsabilidades:
   - exibir a vinheta só na primeira visita da sessão (sessionStorage);
   - esperar a logo (e a fonte) carregarem antes de iniciar;
   - calcular o traçado da linha orgânica para o tamanho da tela;
   - gerar pouquíssimas partículas (pontos e folhas);
   - respeitar prefers-reduced-motion;
   - permitir pular (botão "Pular" ou tecla Esc);
   - ao iniciar a saída, disparar "intro:leave" (o main.js usa para animar o hero);
   - ao terminar (ou em qualquer erro), remover a vinheta e liberar a página.

   Extras:
   - ?intro=1 na URL força a exibição mesmo já vista na sessão;
   - evento "crisoverde:intro-end" é disparado em window ao terminar.
   ========================================================================== */
(function () {
  'use strict';

  var CONFIG = {
    storageKey: 'crisoverde:intro-seen',
    once: true,            // false = toda visita mostra a vinheta
    holdMs: 2900,          // quando a saída começa (contado a partir do início da animação)
    exitMs: 900,           // duração da dissolução (ver cv-leave no CSS)
    reducedHoldMs: 1400,   // permanência no modo movimento reduzido
    readyTimeoutMs: 1200   // espera máxima pela logo e pela fonte
  };

  var root = document.documentElement;
  var intro = document.getElementById('cv-intro');
  if (!intro) return;

  var leaving = false;
  var finished = false;
  var leaveAnnounced = false;
  var leaveTimer = 0;
  var backupTimer = 0;
  var resizeRaf = 0;

  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var forced = /[?&]intro=1(&|$)/.test(location.search);

  try {
    var seen = false;
    try { seen = sessionStorage.getItem(CONFIG.storageKey) === '1'; } catch (e) {}

    /* Já vista nesta sessão: não reproduz */
    if (CONFIG.once && seen && !forced) { finish(); return; }

    /* Rede de segurança do CSS já escondeu a vinheta (script chegou tarde demais) */
    if (window.getComputedStyle(intro).visibility === 'hidden') { finish(); return; }

    try { sessionStorage.setItem(CONFIG.storageKey, '1'); } catch (e) {}

    intro.setAttribute('data-cv-ready', '');           // o JS assumiu: desarma a rede de segurança do CSS
    root.classList.add('cv-intro-lock');
    buildLine();
    if (!reduced) buildParticles();

    var skipBtn = intro.querySelector('[data-cv-skip]');
    if (skipBtn) skipBtn.addEventListener('click', leave);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize, { passive: true });

    whenReady().then(start, start);
  } catch (err) {
    /* Qualquer erro: o site nunca fica preso atrás da vinheta */
    finish();
  }

  /* ---------------------------------------------------------------------- */

  function start() {
    if (finished || leaving) return;
    intro.classList.add('is-playing');
    leaveTimer = window.setTimeout(leave, reduced ? CONFIG.reducedHoldMs : CONFIG.holdMs);
  }

  function announceLeave() {
    if (leaveAnnounced) return;
    leaveAnnounced = true;
    root.classList.remove('cv-intro-active');          // libera a entrada do hero
    try { document.dispatchEvent(new Event('intro:leave')); } catch (e) {}
  }

  function leave() {
    if (leaving || finished) return;
    leaving = true;
    window.clearTimeout(leaveTimer);
    intro.classList.add('is-leaving');
    announceLeave();                                    // o hero anima junto com a dissolução
    root.classList.remove('cv-intro-lock');             // a página já pode rolar por baixo

    intro.addEventListener('animationend', function onEnd(ev) {
      if (ev.target !== intro) return;                  // ignora animações dos filhos
      intro.removeEventListener('animationend', onEnd);
      finish();
    });
    backupTimer = window.setTimeout(finish, CONFIG.exitMs + 400);   // plano B
  }

  function finish() {
    if (finished) return;
    finished = true;
    window.clearTimeout(leaveTimer);
    window.clearTimeout(backupTimer);
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
    root.classList.remove('cv-intro-lock');
    announceLeave();
    if (intro.parentNode) intro.parentNode.removeChild(intro);
    try { window.dispatchEvent(new CustomEvent('crisoverde:intro-end')); } catch (e) {}
  }

  function onKey(ev) {
    if (ev.key === 'Escape' || ev.key === 'Esc') leave();
  }

  function onResize() {
    if (resizeRaf) return;
    resizeRaf = window.requestAnimationFrame(function () { resizeRaf = 0; if (!finished) buildLine(); });
  }

  /* Logo (três camadas da mesma imagem) e fonte, ou o tempo limite */
  function whenReady() {
    var imgs = Array.prototype.slice.call(intro.querySelectorAll('.cv-logo img'));
    var waits = imgs.map(function (img) {
      if (img.complete && img.naturalWidth) return Promise.resolve();
      return new Promise(function (resolve) {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      });
    });
    if (document.fonts && document.fonts.load) {
      waits.push(Promise.all([
        document.fonts.load('500 12px Inter'),
        document.fonts.load('600 12px Inter')
      ]).catch(function () {}));
    }
    var timeout = new Promise(function (resolve) { window.setTimeout(resolve, CONFIG.readyTimeoutMs); });
    return Promise.race([Promise.all(waits), timeout]).then(function () {
      var first = imgs[0];
      return first && first.decode ? first.decode().catch(function () {}) : null;
    });
  }

  /* Linha orgânica: uma curva suave, de borda a borda, na parte baixa da tela.
     É calculada em pixels para manter a espessura constante em qualquer proporção. */
  function buildLine() {
    var svg = intro.querySelector('.cv-line');
    if (!svg) return;
    var w = Math.max(intro.clientWidth, 320);
    var h = Math.max(intro.clientHeight, 320);
    var wide = w / h > 1.8;                             // celular deitado: linha mais baixa e plana
    var amp = h > w ? 0.55 : (wide ? 0.7 : 1);          // em telas altas, ondulação mais contida
    var base = wide ? 0.83 : 0.76;

    function X(f) { return (f * w).toFixed(1); }
    function Y(f) { return ((base + (f - 0.76) * amp) * h).toFixed(1); }

    var d =
      'M' + X(-0.03) + ' ' + Y(0.80) +
      ' C' + X(0.16) + ' ' + Y(0.87) + ' ' + X(0.27) + ' ' + Y(0.70) + ' ' + X(0.45) + ' ' + Y(0.75) +
      ' S' + X(0.70) + ' ' + Y(0.88) + ' ' + X(0.84) + ' ' + Y(0.74) +
      ' S' + X(0.96) + ' ' + Y(0.63) + ' ' + X(1.03) + ' ' + Y(0.67);

    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    Array.prototype.forEach.call(svg.querySelectorAll('path'), function (p) { p.setAttribute('d', d); });
  }

  /* Pouquíssimas partículas, longe da logo, só transform/opacity */
  function buildParticles() {
    var holder = intro.querySelector('.cv-particles');
    if (!holder) return;
    var small = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
    var dots = small ? 5 : 8;
    var leaves = small ? 2 : 3;
    var NS = 'http://www.w3.org/2000/svg';
    var frag = document.createDocumentFragment();

    function rnd(a, b) { return a + Math.random() * (b - a); }

    /* Evita a região central (logo + frase) para não poluir a composição */
    function spot() {
      var x, y, tries = 0;
      do { x = rnd(4, 96); y = rnd(10, 92); tries++; }
      while (x > 20 && x < 80 && y > 24 && y < 66 && tries < 30);
      return { x: x, y: y };
    }

    for (var i = 0; i < dots; i++) {
      var d = document.createElement('i');
      var s = spot();
      d.className = 'cv-dot';
      d.style.cssText =
        '--x:' + s.x.toFixed(1) + '%;--y:' + s.y.toFixed(1) + '%;' +
        '--s:' + rnd(1.5, 2.8).toFixed(1) + 'px;--o:' + rnd(.18, .45).toFixed(2) + ';' +
        '--d:' + rnd(.6, 2.2).toFixed(2) + 's;--t:' + rnd(8, 13).toFixed(1) + 's;' +
        '--dx:' + rnd(-12, 12).toFixed(1) + 'px;--dy:' + rnd(-44, -16).toFixed(1) + 'px';
      frag.appendChild(d);
    }

    for (var j = 0; j < leaves; j++) {
      var l = document.createElementNS(NS, 'svg');
      var sp = spot();
      l.setAttribute('viewBox', '0 0 12 12');
      l.setAttribute('class', 'cv-leaf');
      l.setAttribute('aria-hidden', 'true');
      l.innerHTML = '<path d="M0 10C0 3 5 0 12 0C12 7 8 12 0 10Z"/>';
      l.style.cssText =
        '--x:' + sp.x.toFixed(1) + '%;--y:' + sp.y.toFixed(1) + '%;' +
        '--s:' + rnd(9, 14).toFixed(0) + 'px;--o:' + rnd(.16, .34).toFixed(2) + ';' +
        '--r:' + rnd(-60, 60).toFixed(0) + 'deg;' +
        '--d:' + rnd(.8, 2.2).toFixed(2) + 's;--t:' + rnd(9, 14).toFixed(1) + 's;' +
        '--dx:' + rnd(-18, 18).toFixed(1) + 'px;--dy:' + rnd(-50, -20).toFixed(1) + 'px';
      frag.appendChild(l);
    }

    holder.appendChild(frag);
  }
})();

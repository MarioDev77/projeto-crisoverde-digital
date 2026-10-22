/* ==========================================================================
   Crisoverde Digital — Vinheta de abertura
   JavaScript puro, sem dependências.

   Responsabilidades:
   - exibir a vinheta só na primeira visita da sessão (sessionStorage);
   - esperar a logo carregar antes de iniciar (evita revelação quebrada);
   - gerar pontos/folhas e as nervuras da folha;
   - respeitar prefers-reduced-motion;
   - permitir pular (botão "Pular" ou tecla Esc);
   - ao iniciar a saída, disparar "intro:leave" (o main.js usa para animar o hero);
   - ao terminar, remover a vinheta do DOM e liberar a rolagem.

   Extras:
   - ?intro=1 na URL força a exibição mesmo já vista na sessão;
   - evento "crisoverde:intro-end" é disparado em window ao terminar.
   ========================================================================== */
(function () {
  'use strict';

  var CONFIG = {
    storageKey: 'crisoverde:intro-seen',
    once: true,            // false = toda visita mostra a vinheta
    holdMs: 3700,          // quando a saída começa (animação de entrada ≈ 3,6 s)
    exitMs: 1100,          // duração da saída (dissolução)
    reducedHoldMs: 1400,   // permanência no modo movimento reduzido
    imageTimeoutMs: 1500   // espera máxima pela logo
  };

  var root = document.documentElement;
  var intro = document.getElementById('cv-intro');
  if (!intro) return;

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var forced = /[?&]intro=1(&|$)/.test(location.search);

  var seen = false;
  try { seen = sessionStorage.getItem(CONFIG.storageKey) === '1'; } catch (e) {}

  var leaving = false;
  var finished = false;
  var leaveTimer = 0;

  /* Já vista nesta sessão: não reproduz */
  if (CONFIG.once && seen && !forced) {
    finish();
    return;
  }

  try { sessionStorage.setItem(CONFIG.storageKey, '1'); } catch (e) {}

  root.classList.add('cv-intro-lock');
  buildVeins();
  if (!reduced) buildParticles();

  var skipBtn = intro.querySelector('[data-cv-skip]');
  if (skipBtn) skipBtn.addEventListener('click', leave);
  document.addEventListener('keydown', onKey);

  whenLogoReady().then(start);

  /* ---------------------------------------------------------------------- */

  function start() {
    if (finished) return;
    intro.classList.add('is-playing');
    leaveTimer = window.setTimeout(leave, reduced ? CONFIG.reducedHoldMs : CONFIG.holdMs);
  }

  function leave() {
    if (leaving || finished) return;
    leaving = true;
    window.clearTimeout(leaveTimer);
    intro.classList.add('is-leaving');
    root.classList.remove('cv-intro-active'); // libera a entrada do hero
    document.dispatchEvent(new Event('intro:leave')); // o hero do site anima junto com a dissolução
    root.classList.remove('cv-intro-lock'); // a página já pode rolar por baixo

    var done = function () { finish(); };
    intro.addEventListener('animationend', function onEnd(ev) {
      if (ev.target !== intro) return; // ignora animações dos filhos
      intro.removeEventListener('animationend', onEnd);
      done();
    });
    window.setTimeout(done, CONFIG.exitMs + 400); // plano B
  }

  function finish() {
    if (finished) return;
    finished = true;
    document.removeEventListener('keydown', onKey);
    root.classList.remove('cv-intro-lock', 'cv-intro-active');

    if (intro.parentNode) intro.parentNode.removeChild(intro);
    try { window.dispatchEvent(new CustomEvent('crisoverde:intro-end')); } catch (e) {}
  }

  function onKey(ev) {
    if (ev.key === 'Escape') leave();
  }

  /* Aguarda as três camadas da logo (mesma imagem) ou o tempo limite */
  function whenLogoReady() {
    var imgs = Array.prototype.slice.call(intro.querySelectorAll('.cv-logo img'));
    var waits = imgs.map(function (img) {
      if (img.complete && img.naturalWidth) return Promise.resolve();
      return new Promise(function (resolve) {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      });
    });
    var timeout = new Promise(function (resolve) { window.setTimeout(resolve, CONFIG.imageTimeoutMs); });
    return Promise.race([Promise.all(waits), timeout]).then(function () {
      var first = imgs[0];
      return first && first.decode ? first.decode().catch(function () {}) : null;
    });
  }

  /* Nervuras finas da folha, geradas ao longo da nervura central */
  function buildVeins() {
    var mid = intro.querySelector('#cv-midrib');
    var group = intro.querySelector('.cv-veins');
    if (!mid || !group || !mid.getTotalLength) return;
    var NS = 'http://www.w3.org/2000/svg';
    var len = mid.getTotalLength();
    var steps = 22;
    for (var i = 1; i <= steps; i++) {
      var t = 0.08 + 0.9 * (i / steps);
      var p = mid.getPointAtLength(len * t);
      var line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', p.x.toFixed(1));
      line.setAttribute('y1', p.y.toFixed(1));
      line.setAttribute('x2', (p.x + 70 * (1 - t * 0.3)).toFixed(1));
      line.setAttribute('y2', (p.y - 34 * (1 - t * 0.2)).toFixed(1));
      group.appendChild(line);
    }
  }

  /* Pontos e pequenas folhas flutuando devagar (só transform/opacity) */
  function buildParticles() {
    var holder = intro.querySelector('.cv-particles');
    if (!holder) return;
    var small = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
    var dots = small ? 10 : 18;
    var leaves = small ? 3 : 5;
    var NS = 'http://www.w3.org/2000/svg';
    var frag = document.createDocumentFragment();

    function rnd(a, b) { return a + Math.random() * (b - a); }

    /* Evita a região da logo (centro-alto) para não poluir o desenho */
    function spot() {
      var x, y, tries = 0;
      do { x = rnd(4, 96); y = rnd(12, 94); tries++; }
      while (x > 30 && x < 70 && y > 18 && y < 56 && tries < 20);
      return { x: x, y: y };
    }

    for (var i = 0; i < dots; i++) {
      var d = document.createElement('i');
      var s = spot();
      d.className = 'cv-dot';
      d.style.cssText =
        '--x:' + s.x.toFixed(1) + '%;--y:' + s.y.toFixed(1) + '%;' +
        '--s:' + rnd(1.5, 3.2).toFixed(1) + 'px;--o:' + rnd(.25, .7).toFixed(2) + ';' +
        '--d:' + rnd(.6, 2.4).toFixed(2) + 's;--t:' + rnd(6, 11).toFixed(1) + 's;' +
        '--dx:' + rnd(-14, 14).toFixed(1) + 'px;--dy:' + rnd(-34, -10).toFixed(1) + 'px';
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
        '--s:' + rnd(9, 15).toFixed(0) + 'px;--o:' + rnd(.3, .55).toFixed(2) + ';' +
        '--r:' + rnd(-60, 60).toFixed(0) + 'deg;' +
        '--d:' + rnd(.8, 2.2).toFixed(2) + 's;--t:' + rnd(7, 12).toFixed(1) + 's;' +
        '--dx:' + rnd(-18, 18).toFixed(1) + 'px;--dy:' + rnd(-40, -14).toFixed(1) + 'px';
      frag.appendChild(l);
    }

    holder.appendChild(frag);
  }
})();

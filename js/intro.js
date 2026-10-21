(function () {
  var intro = document.getElementById('intro');
  if (!intro) return;

  var DURATION = 4000;   // vinheta
  var FADE = 700;        // saída para o site (igual ao transition do CSS)
  var finished = false;

  function finish() {
    if (finished) return;
    finished = true;
    intro.classList.add('leaving');
    document.dispatchEvent(new Event('intro:leave'));   // o hero anima junto com o fade
    setTimeout(function () { if (intro.parentNode) intro.parentNode.removeChild(intro); }, FADE + 100);
  }

  // Quem prefere menos movimento vai direto ao site
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    finish();
    return;
  }

  /* ── Partículas (esmeralda e douradas) ── */
  var stage = intro.querySelector('.intro-stage');
  var cv = document.getElementById('introFx');
  var ctx = cv.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, t0 = 0, raf = 0, P = [];
  for (var i = 0; i < 46; i++) {
    P.push({ x: Math.random(), y: Math.random(), r: 0.8 + Math.random() * 1.9,
      vx: (Math.random() - 0.5) * 0.012, vy: -(0.006 + Math.random() * 0.014),
      ph: Math.random() * 6.28, gold: Math.random() < 0.22 });
  }
  function size() {
    var r = stage.getBoundingClientRect();
    W = cv.width = Math.round(r.width * dpr);
    H = cv.height = Math.round(r.height * dpr);
  }
  size();
  window.addEventListener('resize', size);

  function frame(now) {
    if (finished && !intro.parentNode) return;
    var t = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    var fadeIn = Math.min(1, Math.max(0, t) / 1.0);
    var out = t > 3 ? Math.min(1, (t - 3) / 1.2) : 0;   // partículas se afastam no fim
    var env = fadeIn * (1 - 0.65 * out);
    var boost = 1 + out * 2.2;
    for (var i = 0; i < P.length; i++) {
      var p = P[i];
      p.x += p.vx * 0.016 * boost;
      p.y += p.vy * 0.016 * boost * (1 + out);
      if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }
      if (p.x < -0.05) p.x = 1.05;
      if (p.x > 1.05) p.x = -0.05;
      var a = env * (0.55 + 0.45 * Math.sin(t * 1.6 + p.ph)) * 0.85;
      var x = p.x * W, y = p.y * H, r = p.r * dpr * 2.2;
      var g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
      var c = p.gold ? '255,214,110' : '110,255,170';
      g.addColorStop(0, 'rgba(' + c + ',' + a + ')');
      g.addColorStop(1, 'rgba(' + c + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r * 3, 0, 6.283); ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (t0) return;                       // já iniciou
    t0 = performance.now();
    intro.classList.add('play');
    raf = requestAnimationFrame(frame);
    setTimeout(finish, DURATION + 100);   // 4s de vinheta e abre o site
  }

  // Só começa a contar os 4s depois que a imagem estiver pronta,
  // para a animação não perder o primeiro segundo em conexões lentas.
  var img = new Image();
  img.onload = function () { (img.decode ? img.decode().catch(function () {}) : Promise.resolve()).then(start); };
  img.onerror = start;
  img.src = 'img/intro-crisoverde.jpg';
  setTimeout(start, 2500);                // limite de espera
})();

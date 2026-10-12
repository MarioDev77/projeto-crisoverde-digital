/* Partículas atmosféricas para o hero — canvas 2D nativo, sem dependências externas. */
(() => {
  const canvas = document.getElementById('heroAtmosphere');
  const hero = document.getElementById('inicio');
  if (!canvas || !hero) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const smallScreen = window.matchMedia('(max-width: 640px)');
  let width = 0, height = 0, raf = 0, active = false, last = 0;
  let particles = [];
  const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  const rand = (min, max) => min + Math.random() * (max - min);

  function resize() {
    const rect = hero.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = smallScreen.matches ? 22 : Math.min(54, Math.round(width / 24));
    particles = Array.from({ length: count }, () => ({
      x: rand(0, width), y: rand(0, height), r: rand(.6, 2.1),
      vx: rand(-.11, .11), vy: rand(-.22, -.045), phase: rand(0, Math.PI * 2),
      gold: Math.random() > .68, alpha: rand(.15, .55)
    }));
  }
  function draw(time) {
    raf = 0;
    if (!active || document.hidden) return;
    const dt = Math.min(32, time - (last || time)); last = time;
    ctx.clearRect(0, 0, width, height);
    pointer.x += (pointer.tx - pointer.x) * .025;
    pointer.y += (pointer.ty - pointer.y) * .025;
    for (const p of particles) {
      p.x += p.vx * dt + (pointer.x - .5) * -.06;
      p.y += p.vy * dt;
      p.phase += dt * .0012;
      if (p.y < -8) { p.y = height + 8; p.x = rand(0, width); }
      if (p.x < -8) p.x = width + 8;
      if (p.x > width + 8) p.x = -8;
      const pulse = .72 + Math.sin(p.phase) * .28;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * pulse, 0, Math.PI * 2);
      ctx.fillStyle = p.gold ? `rgba(236,190,91,${p.alpha * pulse})` : `rgba(114,224,163,${p.alpha * pulse})`;
      ctx.shadowBlur = p.r > 1.4 ? 10 : 4;
      ctx.shadowColor = p.gold ? 'rgba(236,190,91,.45)' : 'rgba(114,224,163,.4)';
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    raf = requestAnimationFrame(draw);
  }
  function start() { if (active || reduced.matches) return; active = true; last = 0; raf = requestAnimationFrame(draw); }
  function stop() { active = false; if (raf) cancelAnimationFrame(raf); raf = 0; ctx.clearRect(0, 0, width, height); }
  resize();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', e => { pointer.tx = e.clientX / Math.max(1, window.innerWidth); pointer.ty = e.clientY / Math.max(1, window.innerHeight); }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (hero.getBoundingClientRect().bottom > 0 && hero.getBoundingClientRect().top < window.innerHeight) start(); });
  const io = new IntersectionObserver(entries => entries[0].isIntersecting ? start() : stop(), { threshold: 0.01 });
  io.observe(hero);
  reduced.addEventListener('change', () => reduced.matches ? stop() : start());
  smallScreen.addEventListener('change', resize);
})();

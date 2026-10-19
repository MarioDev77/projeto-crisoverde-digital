/* Hero: garante que o vídeo de fundo toque em qualquer dispositivo.
   Alguns notebooks (modo economia de energia, políticas do navegador) bloqueiam o autoplay
   e deixam só o poster aparecendo. Aqui forçamos muted, tentamos tocar de novo em vários
   momentos e, se mesmo assim for bloqueado, tocamos no primeiro toque/clique/tecla. */
(() => {
  const video = document.getElementById('heroVideo');
  const hero = document.getElementById('inicio');
  if (!video || !hero) return;

  // Alguns navegadores ignoram o atributo HTML "muted" — força via propriedade.
  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;

  let unlocked = false;
  function tryPlay() {
    if (!video.paused && !video.ended) return;
    const p = video.play();
    if (p && typeof p.catch === 'function') p.catch(armUnlock);
  }

  // Último recurso: o navegador bloqueou o autoplay → toca na primeira interação do usuário.
  function armUnlock() {
    if (unlocked) return;
    unlocked = true;
    const events = ['pointerdown', 'touchstart', 'keydown', 'scroll', 'wheel'];
    const go = () => {
      events.forEach(e => window.removeEventListener(e, go));
      unlocked = false;
      tryPlay();
    };
    events.forEach(e => window.addEventListener(e, go, { once: true, passive: true }));
  }

  video.addEventListener('loadeddata', tryPlay);
  video.addEventListener('canplay', tryPlay);
  video.addEventListener('pause', () => { if (!document.hidden && isHeroVisible()) tryPlay(); });
  video.addEventListener('stalled', () => video.load());

  function isHeroVisible() {
    const r = hero.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  }

  // Pausa fora da tela (economiza bateria) e retoma ao voltar.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => (e.isIntersecting ? tryPlay() : video.pause()), { threshold: 0.05 }).observe(hero);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && isHeroVisible()) tryPlay(); });
  window.addEventListener('pageshow', tryPlay);

  tryPlay();
})();

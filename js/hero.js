/* Hero: crossfade poluído → limpo guiado pela rolagem + névoa (Canvas UI · Clouds).
   Tudo é melhoria progressiva: sem WebGL ou com movimento reduzido, o hero funciona só com HTML/CSS. */
import { createClouds } from './canvasui/clouds.js';

const hero = document.getElementById('inicio');
const out = document.getElementById('heroFog');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
let ticking = false, fog = null, visible = true;

function update() {
  ticking = false;
  const r = hero.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, -r.top / (r.height * 0.8)));
  hero.style.setProperty('--hero-p', p.toFixed(3));
}
function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

function startFog() {
  if (fog || reduce.matches || !out) return;
  try {
    // canvas-fonte "mudo": força o modo overlay (sem depender do html-in-canvas experimental)
    const src = document.createElement('canvas');
    src.getContext('webgl');
    fog = createClouds({ source: src, content: hero, output: out },
      { cover: 0.55, density: 0.6, opacity: 0.5, speed: 0.5, wind: 1, windRadius: 0.22,
        refraction: 0, fogBlur: 0, color: [0.74, 0.8, 0.77], quality: 0.7 });
  } catch (e) { fog = null; }
}
function stopFog() { if (fog) { fog.destroy(); fog = null; } }

update();
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll, { passive: true });
new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? startFog() : stopFog(); }).observe(hero);
reduce.addEventListener('change', () => (reduce.matches ? stopFog() : visible && startFog()));
startFog();

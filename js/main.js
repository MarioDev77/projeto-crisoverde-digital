(function () {
  /* ── Modal logic ── */
  const modal = document.getElementById('cvdModal');
  const modalBackdrop = document.getElementById('cvdModalBackdrop');
  const modalClose = document.getElementById('cvdModalClose');
  const modalPlayer = document.getElementById('cvdModalPlayer');
  const modalTitle = document.getElementById('cvdModalTitle');
  const modalDesc = document.getElementById('cvdModalDesc');

  // Only allow local, relative .mp4 paths to be played — blocks any
  // attempt to inject an external/attacker-controlled video source.
  function isSafeLocalVideoPath(path) {
    if (typeof path !== 'string' || !path) return false;
    if (/^https?:\/\//i.test(path)) return false; // no absolute/external URLs
    if (path.includes('..')) return false;         // no path traversal
    if (/^[a-z0-9/_\-. ]+\.mp4$/i.test(path.trim())) return true;
    return false;
  }

  function clearModalPlayer() {
    while (modalPlayer.firstChild) modalPlayer.removeChild(modalPlayer.firstChild);
  }

  let lastFocus = null;
  function openModal(videoId, title, desc) {
    lastFocus = document.activeElement;
    modalTitle.textContent = title || 'Vídeo';
    modalDesc.textContent = desc || '';
    clearModalPlayer();

    if (videoId && isSafeLocalVideoPath(videoId)) {
      const video = document.createElement('video');
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.style.cssText = 'width:100%;height:100%;border-radius:8px;background:#000';
      const source = document.createElement('source');
      source.src = videoId;
      source.type = 'video/mp4';
      video.appendChild(source);
      modalPlayer.appendChild(video);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'cvd-modal-placeholder';

      const icon = document.createElement('span');
      icon.style.fontSize = '3rem';
      icon.textContent = '▶';

      const comingSoon = document.createElement('p');
      comingSoon.className = 'cvd-modal-coming';
      comingSoon.textContent = 'Vídeo em breve!';

      const sub = document.createElement('p');
      sub.className = 'cvd-modal-sub';
      sub.textContent = 'Acompanhe nosso Instagram para não perder o lançamento.';

      const link = document.createElement('a');
      link.href = 'https://www.instagram.com/crisoverde';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'cvd-modal-ig';
      link.textContent = '@crisoverde no Instagram';

      placeholder.append(icon, comingSoon, sub, link);
      modalPlayer.appendChild(placeholder);
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    modalClose.focus();
  }

  function closeModal() {
    if (!modal.classList.contains('open')) return;
    const v = modalPlayer.querySelector('video'); if (v) v.pause();
    modal.classList.remove('open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    document.body.style.overflow = '';
    setTimeout(clearModalPlayer, 300);
  }

  modalBackdrop.addEventListener('click', closeModal);
  modalClose.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key === 'Tab') {   // mantém o foco dentro do modal
      const f = [...modal.querySelectorAll('button, a[href], video[controls]')].filter(el => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* Main video click */
  document.querySelector('.cvd-main-thumb').addEventListener('click', function () {
    openModal(this.dataset.videoid, this.dataset.title, this.dataset.desc);
  });
  document.querySelector('.cvd-play-btn').addEventListener('click', function (e) {
    e.stopPropagation();
    const t = this.closest('.cvd-main-thumb');
    openModal(t.dataset.videoid, t.dataset.title, t.dataset.desc);
  });

  /* Thumbnail clicks */
  document.querySelectorAll('.cvd-thumb').forEach(thumb => {
    thumb.setAttribute('role', 'button'); thumb.tabIndex = 0;
    thumb.setAttribute('aria-label', 'Reproduzir: ' + (thumb.dataset.title || 'vídeo'));
    thumb.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); thumb.click(); } });
    thumb.addEventListener('click', function () {
      openModal(this.dataset.videoid, this.dataset.title, this.dataset.desc);
    });
  });

  /* ── Botão flutuante: agora é um link direto para a CRISO.IA (ver href no HTML) ── */

  /* ── Navbar scroll ── */
  const navbar = document.getElementById('navbar');
  let navTick = false;
  const navUpdate = () => { navTick = false; navbar.classList.toggle('scrolled', window.scrollY > 60); };
  window.addEventListener('scroll', () => { if (!navTick) { navTick = true; requestAnimationFrame(navUpdate); } }, { passive: true });
  navUpdate();

  /* ── Mobile menu ── */
  const menuBtn = document.getElementById('menuBtn');
  const navMobile = document.getElementById('navMobile');
  menuBtn.setAttribute('aria-expanded', 'false');
  menuBtn.setAttribute('aria-controls', 'navMobile');
  menuBtn.addEventListener('click', () => {
    menuBtn.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(navMobile.classList.toggle('open')));
  });
  document.querySelectorAll('.mob-link').forEach(l => {
    l.addEventListener('click', () => {
      menuBtn.classList.remove('open');
      navMobile.classList.remove('open');
    });
  });

  /* ── Reveal on scroll ── */
  const reveals = document.querySelectorAll('.reveal, .reveal-hero');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, { threshold: 0.1 });
  reveals.forEach(r => observer.observe(r));

  /* Hero anima assim que a vinheta de abertura começa a sair (ou de imediato se ela não vai rodar) */
  let heroShown = false;
  const showHero = () => {
    if (heroShown) return;
    heroShown = true;
    document.querySelectorAll('.reveal-hero').forEach(el => {
      setTimeout(() => el.classList.add('visible'), 100);
    });
  };
  const introEl = document.getElementById('cv-intro');
  if (introEl && !document.documentElement.classList.contains('cv-intro-skip')) {
    document.addEventListener('intro:leave', showHero, { once: true });
    setTimeout(showHero, 9000);   // garantia caso a vinheta não rode
  } else {
    showHero();
  }
})();

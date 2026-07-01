(function () {
  /* ── Particles canvas ── */
  const canvas = document.getElementById('cvdCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let pts = [];
    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    function init() {
      resize();
      pts = Array.from({ length: 55 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + .3,
        vx: (Math.random() - .5) * .3,
        vy: (Math.random() - .5) * .25,
        a: Math.random(),
        va: (Math.random() - .5) * .008
      }));
    }
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.a += p.va;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        p.a = Math.max(0.05, Math.min(1, p.a));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(62,207,142,${p.a * 0.5})`;
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    init();
    draw();
    window.addEventListener('resize', init);
  }

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

  function openModal(videoId, title, desc) {
    modalTitle.textContent = title || 'Vídeo';
    modalDesc.textContent = desc || '';
    clearModalPlayer();

    if (videoId && isSafeLocalVideoPath(videoId)) {
      const video = document.createElement('video');
      video.controls = true;
      video.autoplay = true;
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
      icon.textContent = '🎬';

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
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(clearModalPlayer, 300);
  }

  modalBackdrop.addEventListener('click', closeModal);
  modalClose.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

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
    thumb.addEventListener('click', function () {
      openModal(this.dataset.videoid, this.dataset.title, this.dataset.desc);
    });
  });

  /* ── Floating chat widget ── */
  const cvBtn = document.getElementById('cvWidgetBtn');
  const cvPanel = document.getElementById('cvWidgetPanel');
  if (cvBtn && cvPanel) {
    cvBtn.addEventListener('click', () => cvPanel.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (!cvPanel.contains(e.target) && !cvBtn.contains(e.target)) {
        cvPanel.classList.remove('open');
      }
    });
  }

  /* ── Loader ── */
  window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    setTimeout(() => loader.classList.add('hidden'), 900);
  });

  /* ── Navbar scroll ── */
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  });

  /* ── Mobile menu ── */
  const menuBtn = document.getElementById('menuBtn');
  const navMobile = document.getElementById('navMobile');
  menuBtn.addEventListener('click', () => {
    menuBtn.classList.toggle('open');
    navMobile.classList.toggle('open');
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

  /* Hero reveals immediately */
  document.querySelectorAll('.reveal-hero').forEach(el => {
    setTimeout(() => el.classList.add('visible'), 100);
  });
})();

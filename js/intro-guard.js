/* Roda no <head>, antes da primeira pintura: se a vinheta já foi vista nesta
   sessão, esconde-a imediatamente (evita "piscar" a tela escura). ?intro=1 força. */
(function () {
  try {
    if (sessionStorage.getItem('crisoverde:intro-seen') && !/[?&]intro=1(&|$)/.test(location.search)) {
      document.documentElement.classList.add('cv-intro-skip');
    } else {
      // Segura a entrada do hero até a vinheta sair (ver style/intro.css)
      document.documentElement.classList.add('cv-intro-active');
      setTimeout(function () { document.documentElement.classList.remove('cv-intro-active'); }, 4000); // garantia (alinhada à rede de segurança do CSS)
    }
  } catch (e) {}
})();

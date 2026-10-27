
## Vinheta de abertura

Animação de ~3,9 s exibida **uma vez por sessão** (sessionStorage). Respeita `prefers-reduced-motion`
(composição estática por ~1,4 s, sem partículas) e pode ser pulada com o botão "Pular" ou a tecla Esc.

Composição: fundo preto esverdeado com luz verde sutil, logo original centralizada (revelada em três
camadas da mesma imagem, sem distorção), uma linha verde orgânica que atravessa a tela com um ponto de luz,
poucas partículas/folhas, a frase "Tecnologia que transforma. Natureza que permanece." e textos de canto discretos.

- `style/intro.css` — estilos e animações (prefixo `cv-`; linha do tempo comentada no topo)
- `js/intro.js` — sessão, traçado da linha (calculado para cada tamanho de tela), partículas, saída (dispara `intro:leave` para o hero)
- `js/intro-guard.js` — roda no `<head>`; esconde a vinheta se já foi vista e segura a entrada do hero
- `img/intro-logo.png` — logo usada na revelação (PNG transparente, proporção ~2,2:1)
- `index.html` — bloco `#cv-intro` no início do `<body>`

Ajustes rápidos em `js/intro.js` (objeto `CONFIG`): `holdMs` (quando a saída começa), `exitMs`, `once` (`false` = toda visita mostra a vinheta).

Segurança contra falhas: se `intro.js` não carregar, a vinheta se dissolve sozinha em ~4 s (regra
`:not([data-cv-ready])` no CSS); qualquer erro no script remove a vinheta e libera o site.

Para rever durante o desenvolvimento: acrescente `?intro=1` à URL.

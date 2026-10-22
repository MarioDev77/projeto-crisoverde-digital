
## Vinheta de abertura

Animação de ~4,6 s exibida **uma vez por sessão** (sessionStorage). Respeita `prefers-reduced-motion`
(composição estática por ~1,4 s) e pode ser pulada com o botão "Pular" ou a tecla Esc.

- `style/intro.css` — estilos e animações (prefixo `cv-`)
- `js/intro.js` — linha do tempo, partículas, sessão e saída (dispara `intro:leave` para o hero)
- `js/intro-guard.js` — roda no `<head>`; esconde a vinheta se já foi vista e segura a entrada do hero
- `img/intro-logo.png` — logo usada na revelação (troque pelo PNG transparente oficial, proporção ~2,2:1)
- `index.html` — bloco `#cv-intro` no início do `<body>`

Para rever durante o desenvolvimento: acrescente `?intro=1` à URL.

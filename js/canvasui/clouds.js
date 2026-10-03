var Te=new WeakMap;function pe(m,s){let t=window.visualViewport?.scale||1,i=Math.min(window.devicePixelRatio||1,2)*t,r=Math.max(m.clientWidth,1),n=Math.max(m.clientHeight,1),e=8192;if(s){let d=Te.get(s);d===void 0&&(d=Math.min(e,s.getParameter(s.MAX_TEXTURE_SIZE),s.getParameter(s.MAX_RENDERBUFFER_SIZE)),Te.set(s,d)),e=d}return Math.min(i,e/Math.max(r,n),Math.sqrt(16777216/(r*n)))}function Re(m){let s=window.visualViewport,t=0,i=!1,r=()=>{t||i||(t=requestAnimationFrame(()=>{t=0,m()}))},n=new ResizeObserver(r);return window.addEventListener("resize",r,{passive:!0}),s?.addEventListener("resize",r,{passive:!0}),{observe(e,d){n.observe(e,d)},unobserve(e){n.unobserve(e)},disconnect(){i=!0,n.disconnect(),cancelAnimationFrame(t),window.removeEventListener("resize",r),s?.removeEventListener("resize",r)}}}function ge(m,s){"content"in m?(m.setAttribute("content","drawable"),s.setAttribute("drawable","")):m.setAttribute("layoutsubtree","")}function xe(m,s,t){let i=s.drawElementImage(t,0,0),r=m;i&&typeof r.updateElementGeometry=="function"&&r.updateElementGeometry(t,{canvasTransform:i})}function be(m){let s=m.getBoundingClientRect(),t=()=>{s=m.getBoundingClientRect()},i=new ResizeObserver(t);return i.observe(m),window.addEventListener("resize",t,{passive:!0}),window.addEventListener("scroll",t,{capture:!0,passive:!0}),{get current(){return s},destroy(){i.disconnect(),window.removeEventListener("resize",t),window.removeEventListener("scroll",t,!0)}}}var Ce={scale:1,speed:.6,cover:.1,density:2.5,shading:.1,color:"auto",opacity:.64,shadow:.06,shadowOffsetX:200,shadowOffsetY:-10,shadowSoftness:1,wind:.6,windRadius:350,refraction:0,fogBlur:0,quality:1},_e=`#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
void main () {
  gl_Position = vec4(aPos, 0.0, 1.0);
}`,Ae=`#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uResolution;
uniform vec2 uOffset;
uniform float uTime;
uniform float uScale;
uniform float uCover;
uniform float uDensity;

const mat2 m = mat2(1.6, 1.2, -1.2, 1.6);

vec2 hash (vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise (vec2 p) {
  const float K1 = 0.366025404;
  const float K2 = 0.211324865;
  vec2 i = floor(p + (p.x + p.y) * K1);
  vec2 a = p - i + (i.x + i.y) * K2;
  vec2 o = (a.x > a.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec2 b = a - o + K2;
  vec2 c = a - 1.0 + 2.0 * K2;
  vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
  vec3 n = h * h * h * h
    * vec3(dot(a, hash(i)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));
  return dot(n, vec3(70.0));
}

float fbm (vec2 n) {
  float total = 0.0;
  float amplitude = 0.1;
  for (int i = 0; i < 7; i++) {
    total += noise(n) * amplitude;
    n = m * n;
    amplitude *= 0.4;
  }
  return total;
}

void main () {
  vec2 p = gl_FragCoord.xy / uResolution + uOffset;
  vec2 asp = vec2(uResolution.x / uResolution.y, 1.0);
  float q = fbm(p * asp * uScale * 0.5);

  float r = 0.0;
  vec2 uv = p * asp * uScale;
  uv -= q - uTime;
  float weight = 0.8;
  for (int i = 0; i < 8; i++) {
    r += abs(weight * noise(uv));
    uv = m * uv + uTime;
    weight *= 0.7;
  }

  float f = 0.0;
  uv = p * asp * uScale;
  uv -= q - uTime;
  weight = 0.7;
  for (int i = 0; i < 8; i++) {
    f += weight * noise(uv);
    uv = m * uv + uTime;
    weight *= 0.6;
  }
  f *= r + f;

  float c = 0.0;
  float t2 = uTime * 2.0;
  uv = p * asp * uScale * 2.0;
  uv -= q - t2;
  weight = 0.4;
  for (int i = 0; i < 7; i++) {
    c += weight * noise(uv);
    uv = m * uv + t2;
    weight *= 0.6;
  }

  float c1 = 0.0;
  float t3 = uTime * 3.0;
  uv = p * asp * uScale * 3.0;
  uv -= q - t3;
  weight = 0.4;
  for (int i = 0; i < 7; i++) {
    c1 += abs(weight * noise(uv));
    uv = m * uv + t3;
    weight *= 0.6;
  }
  c += c1;

  float coverage = clamp(uCover + uDensity * f * r + c, 0.0, 1.0);
  outColor = vec4(coverage, clamp(c, 0.0, 1.0), 0.0, 1.0);
}`,ye=`#version 300 es
precision highp float;
out vec4 outColor;
uniform sampler2D uPrev;
uniform vec2 uResolution;
uniform float uDecay;
uniform vec2 uA;
uniform vec2 uB;
uniform float uRadius;
uniform float uStrength;

void main () {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float prev = texture(uPrev, uv).r * uDecay;
  vec2 asp = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 p = uv * asp;
  vec2 a = uA * asp;
  vec2 b = uB * asp;
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  float d = length(pa - ba * h) / max(uRadius, 1e-4);
  float stamp = exp(-d * d * 3.0) * uStrength;
  outColor = vec4(clamp(prev + stamp, 0.0, 1.0), 0.0, 0.0, 1.0);
}`,De=`#version 300 es
precision highp float;
out vec4 outColor;
uniform sampler2D uField;
uniform sampler2D uContent;
uniform sampler2D uWind;
uniform vec2 uResolution;
uniform vec2 uContentScale;
uniform vec3 uBase;
uniform float uShading;
uniform float uOpacity;
uniform float uShadow;
uniform vec2 uShadowShift;
uniform float uShadowLod;
uniform float uWindAmt;
uniform float uRefraction;
uniform float uFogBlur;
uniform float uHasContent;

void main () {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 field = texture(uField, uv).rg;
  float wind = texture(uWind, uv).r * uWindAmt;
  float cov = field.r - wind;
  float mist = smoothstep(0.04, 0.9, cov);
  float cloudA = mist * uOpacity;

  float lum = dot(uBase, vec3(0.299, 0.587, 0.114));
  float sh = clamp(field.g, 0.0, 1.0);
  float k = uShading * 0.35;
  vec3 cloudRGB = lum > 0.5
    ? uBase - vec3((1.0 - sh) * k)
    : uBase + vec3(sh * k);
  cloudRGB = clamp(cloudRGB, 0.0, 1.0);

  vec2 sUv = uv + uShadowShift;
  float s = textureLod(uField, sUv, uShadowLod).r
    - texture(uWind, sUv).r * uWindAmt;
  float shadowA = smoothstep(0.35, 1.0, s) * uShadow * (1.0 - mist);

  float a;
  vec3 rgb;
  if (uHasContent > 0.5) {
    vec2 e = vec2(8.0) / uResolution;
    float gx = texture(uField, uv + vec2(e.x, 0.0)).r
      - texture(uField, uv - vec2(e.x, 0.0)).r;
    float gy = texture(uField, uv + vec2(0.0, e.y)).r
      - texture(uField, uv - vec2(0.0, e.y)).r;
    vec2 rUv = uv + vec2(gx, gy) * uRefraction * mist;
    vec3 fogged = textureLod(
      uContent, vec2(rUv.x, 1.0 - rUv.y) * uContentScale, mist * uFogBlur * 5.0
    ).rgb;
    vec3 layer = mix(fogged, cloudRGB, cloudA) * (1.0 - shadowA);
    float aF = smoothstep(0.02, 0.2, mist);
    a = aF + shadowA * (1.0 - aF);
    rgb = layer * aF;
  } else {
    a = cloudA + shadowA * (1.0 - cloudA);
    rgb = cloudRGB * cloudA;
  }
  outColor = vec4(rgb, a);
}`;function Xe(){if(typeof document>"u")return!1;let m=document.createElement("canvas"),s=m.getContext("2d");return!!(s&&typeof s.drawElementImage=="function"&&typeof m.requestPaint=="function")}function Oe(m,s={}){let t={...Ce,...s},{source:i,content:r,output:n}=m,e=n.getContext("webgl2",{alpha:!0,depth:!1,stencil:!1,antialias:!1,premultipliedAlpha:!0});if(!e||e.isContextLost())return null;let d=i.getContext("2d"),D=i,T=!!(d&&typeof d.drawElementImage=="function"&&typeof D.requestPaint=="function");T&&ge(i,r);let L=!1,$=()=>{};T&&(D.onpaint=()=>{try{d.reset(),xe(i,d,r),L=!0,$()}catch{}});function J(o,u){let a=e.createShader(o);return e.shaderSource(a,u),e.compileShader(a),e.getShaderParameter(a,e.COMPILE_STATUS)||console.error("Clouds shader error:",e.getShaderInfoLog(a)),a}function q(o){let u=J(e.VERTEX_SHADER,_e),a=J(e.FRAGMENT_SHADER,o),l=e.createProgram();e.attachShader(l,u),e.attachShader(l,a),e.linkProgram(l);let E={},C=e.getProgramParameter(l,e.ACTIVE_UNIFORMS);for(let _=0;_<C;_++){let A=e.getActiveUniform(l,_);E[A.name]=e.getUniformLocation(l,A.name)}return{program:l,vs:u,fs:a,uniforms:E}}let h=q(Ae),v=q(ye),c=q(De),ee=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,ee),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0);let x=e.createTexture();e.bindTexture(e.TEXTURE_2D,x),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR_MIPMAP_LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE);let U=e.createTexture();e.bindTexture(e.TEXTURE_2D,U),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR_MIPMAP_LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,new Uint8Array([0,0,0,255])),e.generateMipmap(e.TEXTURE_2D);function te(){let o=e.createTexture();return e.bindTexture(e.TEXTURE_2D,o),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),o}let w=[te(),te()],P=0,ne=e.createFramebuffer(),p=0,R=0,oe=1,re=1,b=[1,1,1],z=document.createElement("canvas");z.width=z.height=1;let M=z.getContext("2d",{willReadFrequently:!0});function S(){if(t.color!=="auto"){b=t.color;return}if(!M)return;let o=r;for(;o;){let u=getComputedStyle(o).backgroundColor;if(u&&u!=="transparent"){M.clearRect(0,0,1,1),M.fillStyle=u,M.fillRect(0,0,1,1);let[a,l,E,C]=M.getImageData(0,0,1,1).data;if(C>0){b=[a/255,l/255,E/255];return}}o=o.parentElement}b=[1,1,1]}function I(){let o=r.clientWidth,u=r.clientHeight;if(o>0&&u>0){let g=`${o}px`,y=`${u}px`;n.style.width!==g&&(n.style.width=g),n.style.height!==y&&(n.style.height=y)}let a=pe(n,e),l=Math.max(1,Math.round(n.clientWidth*a)),E=Math.max(1,Math.round(n.clientHeight*a));(n.width!==l||n.height!==E)&&(n.width=l,n.height=E),oe=T?Math.min(1,o/Math.max(i.clientWidth,1)):1,re=T?Math.min(1,u/Math.max(i.clientHeight,1)):1;let C=Math.min(Math.max(t.quality,.2),1),_=1440/Math.max(n.clientWidth,1),A=Math.min(C,_),he=Math.max(16,Math.round(n.clientWidth*A)),Ee=Math.max(16,Math.round(n.clientHeight*A));if(he!==p||Ee!==R){p=he,R=Ee,e.bindTexture(e.TEXTURE_2D,x),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,p,R,0,e.RGBA,e.UNSIGNED_BYTE,null),e.generateMipmap(e.TEXTURE_2D);for(let g of w)e.bindTexture(e.TEXTURE_2D,g),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,p,R,0,e.RGBA,e.UNSIGNED_BYTE,null)}if(T){let g=Math.max(1,Math.round(i.clientWidth*a)),y=Math.max(1,Math.round(i.clientHeight*a));(i.width!==g||i.height!==y)&&(i.width=g,i.height=y),D.requestPaint()}}I(),S();function we(){!T||!L||(L=!1,e.bindTexture(e.TEXTURE_2D,U),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,i),e.generateMipmap(e.TEXTURE_2D))}let F=.5,X=.5,O=.5,B=.5,G=!1,ae=0,ie=Math.random()*64;function Me(o){we(),e.bindFramebuffer(e.FRAMEBUFFER,ne),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,x,0),e.viewport(0,0,p,R),e.useProgram(h.program),e.uniform2f(h.uniforms.uResolution,p,R),e.uniform2f(h.uniforms.uOffset,r.scrollLeft/Math.max(r.clientWidth,1),-r.scrollTop/Math.max(r.clientHeight,1)),e.uniform1f(h.uniforms.uTime,ie),e.uniform1f(h.uniforms.uScale,Math.max(t.scale,.05)),e.uniform1f(h.uniforms.uCover,Math.max(t.cover,0)),e.uniform1f(h.uniforms.uDensity,Math.max(t.density,0)),e.drawArrays(e.TRIANGLE_STRIP,0,4);let u=w[P],a=w[1-P];P=1-P,e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,a,0),e.useProgram(v.program),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,u),e.uniform1i(v.uniforms.uPrev,0),e.uniform2f(v.uniforms.uResolution,p,R),e.uniform1f(v.uniforms.uDecay,Math.pow(.5,o/.7));let l=Math.hypot(F-O,X-B),E=G&&l>0;e.uniform2f(v.uniforms.uA,O,B),e.uniform2f(v.uniforms.uB,F,X),e.uniform1f(v.uniforms.uRadius,Math.max(t.windRadius,1)/Math.max(n.clientHeight,1)),e.uniform1f(v.uniforms.uStrength,E?Math.min(.2+l*12,1)*.5:0),e.drawArrays(e.TRIANGLE_STRIP,0,4),O=F,B=X,e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindTexture(e.TEXTURE_2D,x),e.generateMipmap(e.TEXTURE_2D),e.viewport(0,0,n.width,n.height),e.useProgram(c.program),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,x),e.uniform1i(c.uniforms.uField,0),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,U),e.uniform1i(c.uniforms.uContent,1),e.activeTexture(e.TEXTURE2),e.bindTexture(e.TEXTURE_2D,a),e.uniform1i(c.uniforms.uWind,2),e.uniform2f(c.uniforms.uResolution,n.width,n.height),e.uniform2f(c.uniforms.uContentScale,oe,re),e.uniform3f(c.uniforms.uBase,b[0],b[1],b[2]),e.uniform1f(c.uniforms.uOpacity,Math.min(Math.max(t.opacity,0),1)),e.uniform1f(c.uniforms.uShading,Math.max(t.shading,0)),e.uniform1f(c.uniforms.uShadow,Math.min(Math.max(t.shadow,0),1)),e.uniform2f(c.uniforms.uShadowShift,-t.shadowOffsetX/Math.max(n.clientWidth,1),t.shadowOffsetY/Math.max(n.clientHeight,1)),e.uniform1f(c.uniforms.uShadowLod,Math.min(Math.max(t.shadowSoftness,0),1)*4),e.uniform1f(c.uniforms.uWindAmt,Math.min(Math.max(t.wind,0),1)),e.uniform1f(c.uniforms.uRefraction,Math.max(t.refraction,0)/Math.max(n.clientWidth,1)),e.uniform1f(c.uniforms.uFogBlur,Math.min(Math.max(t.fogBlur,0),1)),e.uniform1f(c.uniforms.uHasContent,T?1:0),e.drawArrays(e.TRIANGLE_STRIP,0,4)}let Y=0,k=performance.now(),K=!1,W=!1,H=!0,N=window.matchMedia("(prefers-reduced-motion: reduce)"),V=N.matches;function ue(o){if(K)return;if(!H){W=!1;return}let u=Math.min((o-k)/1e3,1/30);k=o,V||(ie+=u*t.speed*.03),Me(u);let a=o-ae<3e3;if(V&&!a&&!L){W=!1;return}Y=requestAnimationFrame(ue)}function f(){K||W||!H||(W=!0,k=performance.now(),Y=requestAnimationFrame(ue))}$=f,f();function se(){V=N.matches,f()}N.addEventListener("change",se);let j=Re(()=>{I(),f()});j.observe(n),j.observe(r);let me=new IntersectionObserver(o=>{H=o[o.length-1]?.isIntersecting??!0,H&&f()});me.observe(n);let ce=be(n);function le(o){let u=ce.current,a=(o.clientX-u.left)/Math.max(u.width,1),l=1-(o.clientY-u.top)/Math.max(u.height,1);G||(O=a,B=l,G=!0),F=a,X=l,ae=performance.now(),f()}function fe(){G=!1}r.addEventListener("pointermove",le,{passive:!0}),r.addEventListener("pointerleave",fe,{passive:!0}),r.addEventListener("scroll",f,{passive:!0});let Q=0;function Z(){S(),f(),window.clearTimeout(Q),Q=window.setTimeout(()=>{S(),f()},300)}let de=new MutationObserver(Z);de.observe(document.documentElement,{attributes:!0,attributeFilter:["class","style","data-theme"]});let ve=window.matchMedia("(prefers-color-scheme: dark)");return ve.addEventListener("change",Z),{setOptions(o){Object.entries(o).some(([u,a])=>t[u]!==a)&&(Object.assign(t,o),I(),S(),f())},resize(){I(),f()},destroy(){K=!0,ce.destroy(),cancelAnimationFrame(Y),j.disconnect(),me.disconnect(),de.disconnect(),ve.removeEventListener("change",Z),window.clearTimeout(Q),N.removeEventListener("change",se),r.removeEventListener("pointermove",le),r.removeEventListener("pointerleave",fe),r.removeEventListener("scroll",f),T&&(D.onpaint=null),e.deleteTexture(x),e.deleteTexture(U),e.deleteTexture(w[0]),e.deleteTexture(w[1]),e.deleteFramebuffer(ne),e.deleteProgram(h.program),e.deleteProgram(v.program),e.deleteProgram(c.program),e.deleteShader(h.vs),e.deleteShader(h.fs),e.deleteShader(v.vs),e.deleteShader(v.fs),e.deleteShader(c.vs),e.deleteShader(c.fs),e.deleteBuffer(ee)}}}export{Oe as createClouds,Xe as supportsHtmlInCanvas};

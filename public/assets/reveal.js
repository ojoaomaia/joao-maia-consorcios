(function(){
'use strict';
var bar = document.createElement('div'); bar.className = 'prog'; bar.setAttribute('aria-hidden','true'); document.body.appendChild(bar);
function onScroll(){
  var d = document.documentElement, max = (d.scrollHeight - d.clientHeight) || 1;
  bar.style.transform = 'scaleX(' + Math.min(1, (window.scrollY || 0) / max) + ')';
}
window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

if (!('IntersectionObserver' in window)) return;

var SEL = '.head,.pain,.obj,.step,.stat,.carta,.stamp,.check,.warn,details,.card,.about .ph,.tl,.final .wrap>*,.tbl,.inline-cta,.author,.side,.guia,.canal,.tq-card,.tq-intro,.jstep';
function countUp(el){
  var b = el.querySelector('b'); if (!b || b.dataset.done) return;
  var txt = b.textContent, m = txt.match(/([\d.,]+)/); if (!m) return;
  b.dataset.done = '1';
  var raw = m[1], dec = raw.indexOf(',') > -1 ? raw.split(',')[1].length : 0;
  var target = parseFloat(raw.replace(/\./g,'').replace(',','.')), t0 = null, dur = 1300;
  function step(now){
    if (!t0) t0 = now; var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    var v = (target * e).toFixed(dec).replace('.', ',');
    b.textContent = txt.replace(raw, v);
    if (p < 1) requestAnimationFrame(step); else b.textContent = txt;
  }
  requestAnimationFrame(step);
}
var io = new IntersectionObserver(function(entries){
  entries.forEach(function(en){
    if (!en.isIntersecting) return;
    var el = en.target; el.classList.add('in'); io.unobserve(el);
    if (el.classList.contains('stat')) countUp(el);
  });
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

function prep(scope){
  var groups = {};
  scope.querySelectorAll(SEL).forEach(function(el){
    if (el.dataset.rv || el.closest('.hero')) return;
    el.dataset.rv = '1'; el.classList.add('rv');
    var p = el.parentElement, k = p ? (p.dataset.rvg || (p.dataset.rvg = Math.random().toString(36).slice(2))) : 'x';
    groups[k] = (groups[k] || 0) + 1;
    el.style.transitionDelay = Math.min(0.45, (groups[k] - 1) * 0.08) + 's';
    io.observe(el);
  });
  scope.querySelectorAll('.kicker').forEach(function(k){ if (!k.dataset.rv && !k.closest('.hero')) { k.dataset.rv = '1'; k.classList.add('rvk'); io.observe(k); } });
}
prep(document);
/* blog, artigos e painel são montados depois: prepara o que entrar na página */
new MutationObserver(function(ms){ ms.forEach(function(m){ m.addedNodes.forEach(function(n){ if (n.nodeType === 1) prep(n.parentElement || n); }); }); })
  .observe(document.body, { childList: true, subtree: true });

/* a carta do simulador brilha a cada mudança */
var o = document.getElementById('o-val');
if (o && 'MutationObserver' in window) {
  var carta = o.closest('.carta'), tm;
  new MutationObserver(function(){
    carta.classList.remove('flash'); void carta.offsetWidth; carta.classList.add('flash');
    clearTimeout(tm); tm = setTimeout(function(){ carta.classList.remove('flash'); }, 750);
  }).observe(o, { childList: true, characterData: true, subtree: true });
}
})();

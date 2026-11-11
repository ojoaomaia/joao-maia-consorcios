(function(){
'use strict';
var jr = document.getElementById('jr'); if (!jr) return;
var coin = document.getElementById('jr-coin'), fill = document.getElementById('jr-fill'), steps = jr.querySelectorAll('.jstep'), ticking = false;
function upd(){
  ticking = false;
  var r = jr.getBoundingClientRect(), vh = window.innerHeight || 800;
  if (r.bottom < -200 || r.top > vh + 200) return;
  var first = steps[0], last = steps[steps.length - 1];
  var y0 = first.offsetTop + 22, y1 = last.offsetTop + 22;
  /* o "ponto de leitura" fica a 55% da altura da tela */
  var p = (vh * 0.55 - r.top - y0) / Math.max(1, y1 - y0); p = Math.max(0, Math.min(1, p));
  var y = y0 - 28 + p * (y1 - y0);
  coin.style.transform = 'translateY(' + y.toFixed(1) + 'px) rotate(' + (p * 720).toFixed(0) + 'deg)';
  fill.style.height = Math.max(0, y - 28 + 28).toFixed(1) + 'px';
  steps.forEach(function(s){
    var c = s.offsetTop + 22;
    s.classList.toggle('done', c < y + 6);
    s.classList.toggle('at', Math.abs(c - (y + 28)) < 40 || (p >= 1 && s === last));
  });
}
function onS(){ if (!ticking) { ticking = true; requestAnimationFrame(upd); } }
window.addEventListener('scroll', onS, { passive: true });
window.addEventListener('resize', onS);
window.addEventListener('hashchange', function(){ setTimeout(upd, 80); });
upd();
})();

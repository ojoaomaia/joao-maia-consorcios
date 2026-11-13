/* João Maia Consórcios: script principal (todas as páginas) */
(function(){
'use strict';

/* ===================== CONFIGURAÇÃO ===================== */
var WA_NUMBER = '5516981100028';   /* WhatsApp do João: 55 + DDD + número, só dígitos */
var GA_ID = 'GTM-PMTLQ6TH';         /* tag do Google (GA4). Aceita GTM-XXXX (tag nova) ou G-XXXX. Vazio = desligado */
var IG_URL = '';                    /* link do seu Instagram, ex.: https://instagram.com/seuperfil */
/* ======================================================== */

var $ = function(s, r){ return (r || document).querySelector(s); };
var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }

/* ORIGEM DO CONTATO: links como seusite.com.br/?origem=bio. Também lê utm_source e utm_campaign. */
var ORIGEM = (function(){
  var o = '';
  try {
    var q = new URLSearchParams(location.search);
    o = q.get('origem') || [q.get('utm_source'), q.get('utm_campaign')].filter(Boolean).join(' / ');
    if (o) sessionStorage.setItem('jm_origem', o); else o = sessionStorage.getItem('jm_origem') || '';
  } catch (e) {}
  return o.replace(/[^\wÀ-ú .\/-]/g, '').slice(0, 40);
})();
var CTX = (document.body.getAttribute('data-ctx') || '').replace(/[^\wÀ-ú :.\/-]/g, '').slice(0, 60);
function wa(msg){
  var tag = [ORIGEM || 'site', CTX].filter(Boolean).join(' · ');
  return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg + '\n\n(origem: ' + tag + ')');
}
window.__wa = wa;

/* todos os botões de WhatsApp: a mensagem fica no atributo data-wa */
$$('[data-wa]').forEach(function(a){ a.href = wa(a.getAttribute('data-wa')); a.target = '_blank'; a.rel = 'noopener'; });
var ig = $('#ig-link'); if (ig) { if (IG_URL) ig.href = IG_URL; else ig.removeAttribute('target'); }
var num = $('#wa-num'); if (num) num.textContent = '+' + WA_NUMBER.replace(/^(\d{2})(\d{2})(\d{4,5})(\d{4})$/, '$1 ($2) $3-$4');

/* símbolo do WhatsApp */
var WA_SVG = '<svg class="wa-ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5 5.2-1.36A9.9 9.9 0 1 0 12.04 2zm0 18.1a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.08.8.82-3-.2-.31A8.2 8.2 0 1 1 12.04 20.1zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.55.12-.17.25-.64.8-.78.97-.14.16-.29.18-.53.06a6.7 6.7 0 0 1-3.34-2.92c-.25-.43.25-.4.72-1.34.08-.16.04-.3-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.47a.9.9 0 0 0-.65.3 2.73 2.73 0 0 0-.86 2.04 4.75 4.75 0 0 0 1 2.52 10.86 10.86 0 0 0 4.15 3.67c1.55.67 2.15.73 2.93.61.47-.07 1.46-.6 1.66-1.17.2-.58.2-1.07.15-1.17-.07-.11-.23-.17-.47-.29z"/></svg>';
function waIcons(scope){
  $$('a[href^="https://wa.me/"]', scope).forEach(function(a){
    if (a.querySelector('.wa-ico')) return;
    var old = a.querySelector('svg'); if (old) old.remove();
    a.insertAdjacentHTML('afterbegin', WA_SVG);
  });
}
waIcons();

/* medição: Google Analytics só depois do consentimento (LGPD) */
window.dataLayer = window.dataLayer || [];
function gtag(){ window.dataLayer.push(arguments); }
function loadGA(){
  var tagNova = GA_ID.indexOf('GTM-') === 0;
  var s = document.createElement('script'); s.async = true;
  s.src = 'https://www.googletagmanager.com/' + (tagNova ? 'gtm.js' : 'gtag/js') + '?id=' + encodeURIComponent(GA_ID);
  document.head.appendChild(s); gtag('js', new Date());
  if (!tagNova) gtag('config', GA_ID, { anonymize_ip: true });
}
if (GA_ID) {
  var c = null; try { c = localStorage.getItem('jm_cookies'); } catch (e) {}
  if (c === 'sim') loadGA();
  else if (c !== 'nao') {
    var bn = document.createElement('div'); bn.className = 'cookie'; bn.setAttribute('role', 'dialog'); bn.setAttribute('aria-label', 'Aviso de cookies');
    bn.innerHTML = '<p>Uso cookies de medição para entender como o site é usado. Você escolhe. <a href="/privacidade/">Saiba mais</a></p><div class="row"><button type="button" class="btn btn-orange sm" data-c="sim">Aceitar</button><button type="button" class="btn btn-line sm" data-c="nao">Recusar</button></div>';
    document.body.appendChild(bn);
    bn.addEventListener('click', function(e){
      var k = e.target.closest('[data-c]'); if (!k) return;
      try { localStorage.setItem('jm_cookies', k.getAttribute('data-c')); } catch (x) {}
      if (k.getAttribute('data-c') === 'sim') loadGA(); bn.remove();
    });
  }
}
document.addEventListener('click', function(e){
  var a = e.target.closest('a[href^="https://wa.me/"]'); if (!a) return;
  var sec = a.closest('section,main,.mbar,header');
  gtag('event', 'whatsapp_click', { botao: a.id || a.getAttribute('data-cta') || 'link', secao: (sec && (sec.id || sec.className.split(' ')[0])) || '', pagina: location.pathname, origem: ORIGEM || 'site' });
});

/* menu do celular */
var nav = $('#nav'), mb = $('#menu-btn');
if (nav && mb) {
  mb.addEventListener('click', function(){
    var o = !nav.classList.contains('open'); nav.classList.toggle('open', o);
    mb.setAttribute('aria-expanded', String(o)); mb.setAttribute('aria-label', o ? 'Fechar menu' : 'Abrir menu');
  });
  nav.addEventListener('click', function(e){ if (e.target.closest('a')) { nav.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); mb.setAttribute('aria-label', 'Abrir menu'); } });
}

/* barra fixa do WhatsApp (celular) */
(function(){
  var bar = $('#mbar'); if (!bar || !('IntersectionObserver' in window)) return;
  var hb = $('#wa-hero'), fb = $('#wa-final'), heroVis = !!hb, finalVis = false, scrolled = false;
  function up(){ bar.classList.toggle('show', (hb ? !heroVis : scrolled) && !finalVis); }
  if (hb) new IntersectionObserver(function(e){ heroVis = e[0].isIntersecting; up(); }).observe(hb);
  else window.addEventListener('scroll', function(){ var s = window.scrollY > 320; if (s !== scrolled) { scrolled = s; up(); } }, { passive: true });
  if (fb) new IntersectionObserver(function(e){ finalVis = e[0].isIntersecting; up(); }).observe(fb);
})();

/* blog: filtro por categoria (os cartões já vêm prontos do servidor) */
(function(){
  var f = $('#filters'); if (!f) return;
  function apply(cat){
    $$('[data-f]', f).forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-f') === cat)); });
    var n = 0; $$('#blog-cards .card').forEach(function(c){ var ok = cat === 'todos' || c.getAttribute('data-cat') === cat; c.hidden = !ok; c.classList.toggle('destaque', ok && n === 0); if (ok) n++; });
    var vazio = $('#blog-vazio'); if (vazio) vazio.hidden = n > 0;
  }
  f.addEventListener('click', function(e){ var b = e.target.closest('[data-f]'); if (!b) return; apply(b.getAttribute('data-f')); try { history.replaceState(null, '', b.getAttribute('data-f') === 'todos' ? location.pathname : '?categoria=' + b.getAttribute('data-f')); } catch (x) {} });
  var q = ''; try { q = new URLSearchParams(location.search).get('categoria') || ''; } catch (e) {}
  if (q && $('[data-f="' + q.replace(/[^\w-]/g, '') + '"]', f)) apply(q.replace(/[^\w-]/g, ''));
})();

/* artigos: no celular cada linha da tabela vira um cartão (o nome da coluna vai junto de cada valor) */
(function(){
  $$('.post-body table').forEach(function(t){
    var heads = $$('thead th', t).map(function(th){ return th.textContent.trim(); });
    if (!heads.length) { var first = t.querySelector('tr'); if (first) heads = $$('th,td', first).map(function(c){ return c.textContent.trim(); }); }
    $$('tbody tr', t).forEach(function(tr){ $$('td', tr).forEach(function(td, i){ if (heads[i]) td.setAttribute('data-label', heads[i]); }); });
    t.classList.add('tb-cards');
    var w = document.createElement('div'); w.className = 'tb-wrap'; t.parentNode.insertBefore(w, t); w.appendChild(t);
  });
})();

/* artigos: anúncio depois do 2º parágrafo e chamada no meio do texto */
(function(){
  var body = $('.post-body'); if (!body) return;
  var ps = $$(':scope > p', body), ad = $('#ad-meio'), cta = $('#cta-meio');
  if (ad && ps[1]) ps[1].after(ad);
  var hs = $$(':scope > h2', body);
  if (cta && hs.length >= 2) hs[Math.floor(hs.length / 2)].before(cta); else if (cta && ps.length > 3) ps[ps.length - 2].after(cta);
  if (ad) ad.hidden = false; if (cta) cta.hidden = false;

  /* blocos "Leia também": em subtítulos diferentes da chamada do WhatsApp, um no começo e outro perto do fim */
  var l1 = $('#leia-1'), l2 = $('#leia-2'), n = hs.length, c = Math.floor(n / 2), i1 = -1, i2 = -1, k;
  for (k = 1; k < n; k++) if (k !== c && k !== c + 1) { i1 = k; break; }
  for (k = n - 1; k > i1 + 1; k--) if (k !== c && k !== c + 1) { i2 = k; break; }
  if (l1) { if (i1 > 0) hs[i1].before(l1); else if (ps.length > 4) ps[3].after(l1); l1.hidden = !l1.parentNode || l1.parentNode !== body; }
  if (l2) { if (i2 > 0) hs[i2].before(l2); else if (ps.length > 8) ps[ps.length - 3].after(l2); l2.hidden = !l2.parentNode || l2.parentNode !== body; }

  /* link para outra matéria sozinho num parágrafo vira um botão de destaque */
  $$(':scope > p', body).forEach(function(p){
    var a = p.querySelector('a[href^="/blog/"]');
    if (a && p.children.length === 1 && p.textContent.trim() === a.textContent.trim()) { p.classList.add('leia-link'); a.setAttribute('data-link-interno', 'no-texto'); }
  });
})();

/* medição dos cliques entre matérias (só se o visitante aceitou os cookies) */
document.addEventListener('click', function(e){
  var a = e.target.closest('[data-link-interno]'); if (!a || typeof gtag !== 'function') return;
  gtag('event', 'link_interno', { posicao: a.getAttribute('data-link-interno'), destino: a.getAttribute('href'), pagina: location.pathname });
});

/* teste "O consórcio é para você?" (só na página inicial) */
(function(){
  var tqBody = $('#tq-body'); if (!tqBody) return;
  var TQ = [
    { k: 'obj', q: 'O que você quer conquistar?', o: [['imovel', 'Imóvel'], ['veiculo', 'Veículo'], ['pesados', 'Pesados e agro'], ['servicos', 'Serviços']] },
    { k: 'valor', q: 'Qual o valor aproximado do bem?', h: 'As cartas começam em R$ 100 mil.', o: [['100a300', 'R$ 100 mil a R$ 300 mil'], ['300a600', 'R$ 300 mil a R$ 600 mil'], ['600a1m', 'R$ 600 mil a R$ 1 milhão'], ['1m', 'Acima de R$ 1 milhão'], ['nsei', 'Ainda não sei']] },
    { k: 'prazo', q: 'Quando você precisa dele?', o: [['agora', 'Agora, o quanto antes'], ['1ano', 'Em até 1 ano'], ['1a3', 'De 1 a 3 anos'], ['sem', 'Sem pressa, quero planejar']] },
    { k: 'reserva', q: 'Você tem algum valor guardado?', h: 'Ele pode virar lance para antecipar a contemplação.', o: [['nao', 'Ainda não'], ['pouco', 'Tenho um pouco'], ['boa', 'Tenho uma boa reserva'], ['fgts', 'Tenho FGTS (para imóvel)']] }
  ];
  var RES = {
    fin: ['Hoje, o financiamento pode resolver mais rápido.', 'O consórcio não tem data garantida de contemplação. Se você precisa do bem agora e ainda não tem valor para lance, vou ser sincero: o financiamento entrega antes, mesmo com juros. Posso comparar os dois com números reais e planejar a sua próxima conquista sem juros.', 'Talvez financiamento'],
    lance: ['Consórcio com estratégia de lance.', 'Com um valor para ofertar, dá para buscar a contemplação mais cedo. Eu olho o histórico do grupo e te mostro quanto faz sentido ofertar, sem comprometer a sua reserva.', 'Consórcio com lance'],
    embutido: ['Consórcio, com atenção ao prazo.', 'Dá para entrar e combinar o sorteio com o lance embutido, que usa parte da própria carta. Como não existe data garantida, vale ter um plano para o caso de a contemplação demorar.', 'Consórcio com lance embutido'],
    combina: ['O consórcio combina com você.', 'Com esse prazo, você compra sem juros e ainda pode montar uma estratégia de lance para tentar antecipar. É o cenário em que o consórcio mais compensa.', 'Consórcio combina'],
    ideal: ['Você tem o perfil ideal para consórcio.', 'Sem pressa, você aproveita o maior benefício do consórcio: chegar ao bem pagando bem menos que no financiamento e comprar como quem paga à vista.', 'Perfil ideal']
  };
  var S = { step: 0, a: {} };
  function label(k){ var q = TQ.filter(function(x){ return x.k === k; })[0], o = q && q.o.filter(function(x){ return x[0] === S.a[k]; })[0]; return o ? o[1] : ''; }
  function result(){
    var p = S.a.prazo, r = S.a.reserva, tem = (r === 'boa' || (r === 'fgts' && S.a.obj === 'imovel'));
    if (p === 'agora' && !tem) return 'fin'; if ((p === 'agora' || p === '1ano') && tem) return 'lance';
    if (p === '1ano') return 'embutido'; if (p === '1a3') return 'combina'; return 'ideal';
  }
  function msg(nome, cid){
    return 'Olá João! ' + (nome ? 'Aqui é ' + nome + (cid ? ', de ' + cid : '') + '. ' : '') + 'Fiz o teste no site:\n\nObjetivo: ' + label('obj') + '\nValor do bem: ' + label('valor') + '\nPrazo: ' + label('prazo') + '\nReserva: ' + label('reserva') + '\nResultado: ' + RES[result()][2] + '\n\nPode me explicar o melhor caminho para o meu caso?';
  }
  function render(){
    var s = S.step; $('#tq-prog').style.width = (Math.min(s, 4) / 4 * 100) + '%';
    $$('.tq-steps li').forEach(function(li, i){ li.classList.toggle('on', i === s); li.classList.toggle('ok', i < s); });
    if (s < 4) {
      var q = TQ[s];
      tqBody.innerHTML = '<div class="tq-anim"><span class="mono tq-n">Pergunta ' + (s + 1) + ' de 4</span><h3 class="tq-q">' + esc(q.q) + '</h3>' + (q.h ? '<p class="micro">' + esc(q.h) + '</p>' : '') +
        '<div class="tq-opts" role="group" aria-label="' + esc(q.q) + '">' + q.o.map(function(o){ return '<button type="button" class="tq-opt" data-v="' + o[0] + '" aria-pressed="' + (S.a[q.k] === o[0]) + '">' + esc(o[1]) + '<span aria-hidden="true">→</span></button>'; }).join('') + '</div>' +
        (s > 0 ? '<button type="button" class="tq-back" data-back>← Voltar</button>' : '') + '</div>';
    } else {
      var id = result(), r = RES[id];
      tqBody.innerHTML = '<div class="tq-anim"><span class="mono tq-n">Seu resultado</span><h3 class="tq-q tq-r' + (id === 'fin' ? ' tq-alt' : '') + '">' + esc(r[0]) + '</h3><p class="tq-txt">' + esc(r[1]) + '</p>' +
        '<ul class="tq-sum"><li><span>Objetivo</span>' + esc(label('obj')) + '</li><li><span>Valor</span>' + esc(label('valor')) + '</li><li><span>Prazo</span>' + esc(label('prazo')) + '</li><li><span>Reserva</span>' + esc(label('reserva')) + '</li></ul>' +
        '<div class="two"><div class="field"><label for="tq-nome">Seu nome</label><input id="tq-nome" autocomplete="given-name" maxlength="60" placeholder="Como posso te chamar?"></div><div class="field"><label for="tq-cid">Cidade</label><input id="tq-cid" autocomplete="address-level2" maxlength="60" value="Ribeirão Preto"></div></div>' +
        '<label class="tq-ok"><input type="checkbox" id="tq-ok"> <span>Concordo em enviar estas respostas pelo WhatsApp, conforme a <a href="/privacidade/">política de privacidade</a>.</span></label><p class="tq-ok-err" id="tq-ok-err" hidden>Marque a caixa acima para continuar.</p>' +
        '<a class="btn btn-orange" id="wa-teste" data-cta="teste-' + id + '" href="#" target="_blank" rel="noopener">Receber minha análise no WhatsApp</a>' +
        '<button type="button" class="tq-back" data-reset>Refazer o teste</button></div>';
      var up = function(){ $('#wa-teste').href = wa(msg($('#tq-nome').value.trim(), $('#tq-cid').value.trim())); waIcons($('#tq')); };
      $('#tq-nome').addEventListener('input', up); $('#tq-cid').addEventListener('input', up); up();
      var ok = $('#tq-ok'), wb = $('#wa-teste');
      var sync = function(){ wb.classList.toggle('off', !ok.checked); wb.setAttribute('aria-disabled', String(!ok.checked)); if (ok.checked) $('#tq-ok-err').hidden = true; };
      ok.addEventListener('change', sync); sync();
      wb.addEventListener('click', function(e){ if (!ok.checked) { e.preventDefault(); e.stopImmediatePropagation(); $('#tq-ok-err').hidden = false; ok.focus(); } }, true);
    }
  }
  tqBody.addEventListener('click', function(e){
    var o = e.target.closest('.tq-opt');
    if (o) { S.a[TQ[S.step].k] = o.getAttribute('data-v'); o.setAttribute('aria-pressed', 'true'); setTimeout(function(){ S.step++; render(); }, 180); return; }
    if (e.target.closest('[data-back]')) { S.step = Math.max(0, S.step - 1); render(); return; }
    if (e.target.closest('[data-reset]')) { S.step = 0; S.a = {}; render(); }
  });
  function goTest(){ var t = window.innerWidth <= 760 ? $('#tq') : $('#simulador'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  $$('[data-pick]').forEach(function(b){ b.addEventListener('click', function(){ S.a = { obj: b.getAttribute('data-pick') }; S.step = 1; render(); goTest(); }); });
  render();
})();
})();

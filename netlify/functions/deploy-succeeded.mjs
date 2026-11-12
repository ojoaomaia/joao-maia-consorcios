/* Roda sozinho na Netlify sempre que uma publicação termina com sucesso (evento "deploy-succeeded").
   Lê o sitemap e avisa o IndexNow (Bing, Yandex, Seznam e outros) sobre as páginas do site. */
export const handler = async (event) => {
  try {
    const { payload = {} } = JSON.parse(event.body || '{}');
    if (payload.context && payload.context !== 'production') return { statusCode: 200, body: 'ignorado: não é produção' };
    const site = payload.ssl_url || payload.url || process.env.URL;
    const host = new URL(site).host;
    const key = (await (await fetch(new URL('/indexnow-key.txt', site))).text()).trim();
    const sm = await (await fetch(new URL('/sitemap-0.xml', site))).text();
    const urlList = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((x) => new URL(x).host === host).slice(0, 10000);
    const r = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key, keyLocation: new URL(`/${key}.txt`, site).href, urlList })
    });
    console.log('IndexNow:', r.status, urlList.length, 'páginas');
    return { statusCode: 200, body: 'ok ' + r.status };
  } catch (e) {
    console.log('IndexNow falhou:', e.message);
    return { statusCode: 200, body: 'erro' };
  }
};

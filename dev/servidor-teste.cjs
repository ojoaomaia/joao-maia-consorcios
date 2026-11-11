// Servidor local que imita a Netlify: serve dist/ e aplica o arquivo _headers.
const http=require('http'),fs=require('fs'),path=require('path');
const DIST=path.resolve(process.argv[2]||path.join(__dirname,'..','dist'));const PORT=+process.argv[3]||4400;
const rules=[];let cur=null;
for(const l of fs.readFileSync(path.join(DIST,'_headers'),'utf8').split('\n')){if(!l.trim()||l.trim().startsWith('#'))continue;
 if(!/^\s/.test(l)){cur={pat:l.trim(),h:[]};rules.push(cur)}else{const i=l.indexOf(':');cur.h.push([l.slice(0,i).trim(),l.slice(i+1).trim()])}}
const T={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.xml':'application/xml','.txt':'text/plain','.yml':'text/yaml','.wasm':'application/wasm','.woff':'font/woff','.woff2':'font/woff2','.pdf':'application/pdf'};
http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);let f=path.join(DIST,u);
 if(!f.startsWith(DIST)){r.writeHead(400);return r.end()}
 if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
 let st=200;if(!fs.existsSync(f)){f=path.join(DIST,'404.html');st=404}
 const h={'Content-Type':T[path.extname(f)]||'application/octet-stream'};
 for(const ru of rules){const re=new RegExp('^'+ru.pat.replace(/[.+?^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*')+'$');if(re.test(u))for(const[k,v]of ru.h)h[k]=v}
 r.writeHead(st,h);fs.createReadStream(f).pipe(r)}).listen(PORT,()=>console.log('ok '+PORT));

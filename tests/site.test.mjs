import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { createServer } from '../server.mjs';
import { communities } from '../communities.mjs';

const inquiry={name:'Test Buyer',email:'buyer@example.com',goal:'Buying a home',phone:'',message:'Interested in Colorado Springs.',website:''};
async function serving(t,options={}){const server=createServer(options);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));return `http://127.0.0.1:${server.address().port}`;}
const post=(url,data=inquiry,headers={})=>fetch(url+'/api/contact',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(data)});

test('all pages have unique SEO metadata, valid structured data, and working local links/assets',async()=>{
 const pages=['/',...communities.map(c=>`/communities/${c.slug}/`),'/privacy/'];const titles=new Set();const descriptions=new Set();
 for(const page of pages){const html=await readFile(resolve('dist','.'+page,'index.html'),'utf8');
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1,`${page}: one h1`);
  const title=html.match(/<title>(.*?)<\/title>/)[1];assert(!titles.has(title));titles.add(title);
  const description=html.match(/<meta name="description" content="([^"]+)"/)[1];assert(!descriptions.has(description));descriptions.add(description);
  assert(html.includes(`rel="canonical" href="https://champrealestate.org${page}"`));
  for(const name of ['styles.css','app.js']){
   const asset=await readFile(resolve('dist',name));
   const version=createHash('sha256').update(asset).digest('hex').slice(0,12);
   assert(html.includes(`/${name}?v=${version}`),`${page}: ${name} must use the current content version`);
  }
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);assert.equal(schema['@type'],'RealEstateAgent');
  for(const match of html.matchAll(/(?:href|src)="(\/[^"?]*)"/g)){const [path,anchor]=match[1].split('#');const target=resolve('dist','.'+path,(path.endsWith('/')?'index.html':''));await access(target);if(anchor){const targetHtml=await readFile(target,'utf8');assert(targetHtml.includes(`id="${anchor}"`),`missing anchor ${match[1]}`);}}
  for(const image of html.matchAll(/<img\b[^>]*>/g))assert(/alt="[^"]+"/.test(image[0]));
 }
 const fonts=await readFile('dist/assets/fonts.css','utf8');for(const match of fonts.matchAll(/url\(([^)]+)\)/g)){assert(match[1].startsWith('/assets/'));await access(resolve('dist','.'+match[1]));}
 const sitemap=await readFile('dist/sitemap.xml','utf8');assert.equal((sitemap.match(/<loc>/g)||[]).length,pages.length);
});
test('server serves every community, assets, redirects, and a real 404',async t=>{
 const url=await serving(t);
 for(const path of ['/',...communities.map(c=>`/communities/${c.slug}/`),'/styles.css','/app.js','/assets/fonts.css','/sitemap.xml','/robots.txt']){const response=await fetch(url+path);assert.equal(response.status,200,path);assert.equal(response.headers.get('x-content-type-options'),'nosniff');}
 const redirect=await fetch(url+'/communities/fountain',{redirect:'manual'});assert.equal(redirect.status,301);assert.equal(redirect.headers.get('location'),'/communities/fountain/');
 assert.equal((await fetch(url+'/missing-page')).status,404);
 assert.equal((await fetch(url+'/assets/colorado-springs.jpg',{method:'HEAD'})).headers.get('content-type'),'image/jpeg');
 const home=await(await fetch(url)).text();
 const stylesheet=home.match(/href="(\/styles\.css\?v=[a-f0-9]+)"/)[1];
 const response=await fetch(url+stylesheet);assert.equal(response.status,200);
 assert.equal(await response.text(),await readFile('dist/styles.css','utf8'));
});
test('unconfigured contact delivery never reports a sent inquiry',async t=>{
 const url=await serving(t);assert.deepEqual(await(await fetch(url+'/api/contact-status')).json(),{ready:false});
 const result=await post(url);assert.equal(result.status,503);assert.match((await result.json()).error,/not been sent/);
});
test('contact validates input and rejects cross-origin requests before forwarding',async t=>{
 let called=false;const url=await serving(t,{webhook:'https://example.com/lead',fetcher:async()=>{called=true;return {ok:true};}});
 assert.equal((await post(url,{...inquiry,email:'invalid'})).status,400);
 assert.equal((await post(url,{...inquiry,name:'   '})).status,400);
 assert.equal((await post(url,{...inquiry,message:'x'.repeat(3001)})).status,400);
 assert.equal((await post(url,{...inquiry,website:'bot'})).status,400);
 assert.equal((await post(url,inquiry,{Origin:'https://unrelated.example'})).status,403);
 assert.equal((await fetch(url+'/api/contact')).status,405);
 assert.equal((await fetch(url+'/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:'broken'})).status,400);
 assert.equal((await post(url,{...inquiry,message:'x'.repeat(17000)})).status,413);
 assert.equal(called,false);
});
test('contact confirms successful upstream delivery and rate limits repeat submissions',async t=>{
 const delivered=[];const url=await serving(t,{webhook:'https://example.com/lead',webhookToken:'test-secret',fetcher:async(endpoint,options)=>{delivered.push({endpoint,options});return {ok:true};}});
 assert.deepEqual(await(await fetch(url+'/api/contact-status')).json(),{ready:true});
 for(let i=0;i<5;i++){const result=await post(url);assert.equal(result.status,200);assert.deepEqual(await result.json(),{ok:true});}
 assert.equal((await post(url)).status,429);assert.equal(delivered.length,5);
 const payload=JSON.parse(delivered[0].options.body);assert.equal(payload.name,inquiry.name);assert.equal(payload.source,'champrealestate.org');assert(!('website' in payload));assert.equal(delivered[0].options.headers.Authorization,'Bearer test-secret');
});
test('upstream failure is visible and is never reported as success',async t=>{
 const url=await serving(t,{webhook:'https://example.com/lead',fetcher:async()=>({ok:false})});const result=await post(url);assert.equal(result.status,502);assert.match((await result.json()).error,/could not be confirmed/);
});

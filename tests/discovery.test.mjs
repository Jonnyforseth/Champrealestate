import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { updateContentState, sitemapXml, llmsText, pageMarkdown } from '../discovery.mjs';
import { shouldRebuild } from '../watch.mjs';
import { createServer } from '../server.mjs';
import config from '../site.config.mjs';

const page={url:'https://champrealestate.org/',path:'/',title:'Home',description:'Local real estate guidance',body:'<h1>Welcome home</h1><p>Serving Colorado Springs.</p>',business:config};

test('lastmod is stable across rebuilds, changes selectively, and drops deleted pages',()=>{
 const other={...page,url:config.domain+'/communities/fountain/',path:'/communities/fountain/'};
 const first=updateContentState([page,other],{},'2026-09-12T10:00:00.000Z');
 const repeated=updateContentState([page,other],first,'2026-09-13T10:00:00.000Z');assert.deepEqual(repeated,first);
 const edited=updateContentState([{...page,body:'<p>Updated buyer guidance.</p>'},other],first,'2026-09-14T10:00:00.000Z');
 assert.equal(edited[page.url].lastmod,'2026-09-14T10:00:00.000Z');assert.deepEqual(edited[other.url],first[other.url]);
 assert.deepEqual(Object.keys(updateContentState([other],edited)),[other.url]);
 const configChange=updateContentState([{...other,business:{...config,phone:'Test public number'}}],edited,'2026-09-15T10:00:00.000Z');assert.equal(configChange[other.url].lastmod,'2026-09-15T10:00:00.000Z');
});

test('new page entries flow into both discovery files without a second URL list',()=>{
 const added={...page,url:config.domain+'/communities/new-area/',path:'/communities/new-area/',title:'New community',description:'A newly published community guide.'};
 const pages=[page,added];const sitemap=sitemapXml(pages,updateContentState(pages));const llms=llmsText(pages,config);
 assert(sitemap.includes(`<loc>${added.url}</loc>`));assert(llms.includes(`${added.url}index.md`));assert(llms.includes(added.description));
 const special={...page,url:config.domain+'/a?one=1&two=2'};assert(sitemapXml([special],updateContentState([special])).includes('one=1&amp;two=2'));
});

test('Markdown keeps substantive content, readable headings, and absolute source links',()=>{
 const markdown=pageMarkdown({...page,body:'<h1>Home <em>in Colorado</em></h1><svg><path d="x"/></svg><p>A &amp; B</p><a href="/#military">VA guidance</a><button>Open dialog</button><details><summary>A question?<span>+</span></summary><p>An answer.</p></details>'},config.domain);
 assert(markdown.includes('Home in Colorado'));assert(markdown.includes('A & B'));assert(markdown.includes('[VA guidance](https://champrealestate.org/#military)'));assert(markdown.includes('### A question?'));assert(markdown.includes('An answer.'));assert(!markdown.includes('<svg'));assert(!markdown.includes('Open dialog'));
});

test('generated guide covers every canonical page and all local references resolve',async()=>{
 const llms=await readFile('dist/llms.txt','utf8');const sitemap=await readFile('dist/sitemap.xml','utf8');const robots=await readFile('dist/robots.txt','utf8');
 assert(llms.startsWith('# Champ Real Estate\n\n> '));for(const fact of ['Darryl Champion','Desert Storm','El Paso County','Fort Carson','Fountain','Monument','Falcon','Peyton','Security-Widefield','Manitou Springs'])assert(llms.includes(fact),fact);
 const urls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match=>match[1]);assert.equal(new Set(urls).size,urls.length);assert.equal(urls.length,8);
 for(const url of urls){const path=new URL(url).pathname;assert(!/[?#]/.test(url));assert(!url.includes('404'));assert(llms.includes(url+'index.md'));const html=await readFile(resolve('dist','.'+path,'index.html'),'utf8');assert(html.includes('rel="describedby" href="/llms.txt"'));assert(html.includes(`href="${path}index.md"`));}
 for(const match of llms.matchAll(/\]\((https:\/\/champrealestate\.org[^)]+)\)/g)){const path=new URL(match[1]).pathname;const text=await readFile(resolve('dist','.'+path),'utf8');assert(text.length>0,match[1]);}
 for(const match of sitemap.matchAll(/<lastmod>(.*?)<\/lastmod>/g))assert(Number.isFinite(Date.parse(match[1])));
 assert.equal((sitemap.match(/<lastmod>/g)||[]).length,urls.length);assert(robots.includes(`Sitemap: ${config.domain}/sitemap.xml`));
 assert(llms.includes('also owns Summit Peak Property Management'));
 assert(llms.includes(`](${config.propertyManagement.ownerUrl})`));
 assert(llms.includes(`](${config.propertyManagement.renterUrl})`));
 assert(!sitemap.includes(config.propertyManagement.domain),'External partner pages must stay out of the Champ sitemap');
 const home=await readFile('dist/index.html','utf8');
 assert(home.includes('id="rent-or-manage"'));
 assert(home.includes('href="/#rent-or-manage"'));
 const publicConfig=JSON.parse(home.match(/<script id="public-config" type="application\/json">(.*?)<\/script>/s)[1]);
 assert.deepEqual(publicConfig.propertyManagement,config.propertyManagement);
 const community=await readFile('dist/communities/fountain/index.html','utf8');
 assert(community.includes('class="partner-footer"'));
 assert(community.includes(`href="${config.propertyManagement.ownerUrl}"`));
});

test('watcher catches source edits without triggering on its own generated output or secrets',()=>{
 for(const filename of ['build.mjs','discovery.mjs','communities.mjs','site.config.mjs','public/styles.css','public\\app.js','README.md','AGENTS.md'])assert(shouldRebuild(filename),filename);
 for(const filename of ['dist/llms.txt','dist\\sitemap.xml','.site-content-state.json','.env','.git/index','node_modules/library.js','server.log'])assert(!shouldRebuild(filename),filename);
});

test('discovery endpoints are publicly served with correct content types',async t=>{
 const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
 const root=`http://127.0.0.1:${server.address().port}`;
 for(const [path,type] of [['/llms.txt','text/plain'],['/sitemap.xml','application/xml'],['/index.md','text/markdown'],['/communities/fountain/index.md','text/markdown']]){const response=await fetch(root+path);assert.equal(response.status,200);assert(response.headers.get('content-type').startsWith(type));}
});

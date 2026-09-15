import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const xml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const decode = value => value.replace(/&(?:amp|lt|gt|quot|apos|#39|nbsp);/g, entity => ({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&#39;':"'",'&nbsp;':' '}[entity]));
const mdText = value => String(value).replace(/([\\[\]])/g, '\\$1').replace(/[\r\n]+/g, ' ');

// This converter targets the controlled, static HTML produced by our templates.
// Preserve substantive text and links while excluding decorative/interactive UI.
export function pageMarkdown(page, domain) {
 const absolute = path => new URL(decode(path), domain).href;
 let text = page.body
  .replace(/<(svg|script|style|button)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
  .replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, value) => `\n\n${'#'.repeat(Math.min(Number(level)+1,6))} ${value.replace(/<[^>]+>/g,' ')}\n\n`)
  .replace(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, value) => `[${mdText(decode(value.replace(/<[^>]+>/g,' ').trim()))}](${absolute(href)})`)
  .replace(/<li\b[^>]*>/gi,'\n- ')
  .replace(/<summary\b[^>]*>([\s\S]*?)<\/summary>/gi,(_,value)=>`\n\n### ${value.replace(/<span\b[^>]*>[\s\S]*?<\/span>/gi,'').replace(/<[^>]+>/g,' ')}\n\n`)
  .replace(/<br\s*\/?>/gi,' ')
  .replace(/<\/(?:p|div|section|article|aside|details|ul|ol)>/gi,'\n\n')
  .replace(/<[^>]+>/g,' ');
 text=decode(text).replace(/[ \t]+/g,' ').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim();
 return `# ${mdText(page.title)}\n\n> ${page.description}\n\nCanonical page: ${domain}${page.path}\n\n${text}\n`;
}

export function updateContentState(pages, previous={}, now=new Date().toISOString()) {
 return Object.fromEntries(pages.map(page=>{
  // The normalized main content and metadata are significant; build time,
  // decorative CSS changes, and the footer's copyright year are not.
  const hash=createHash('sha256').update(JSON.stringify({title:page.title,description:page.description,body:page.body,schema:page.business})).digest('hex');
  const existing=previous[page.url];
  return [page.url,{hash,lastmod:existing?.hash===hash&&Number.isFinite(Date.parse(existing.lastmod))?existing.lastmod:now}];
 }));
}

export function sitemapXml(pages, state) {
 return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(page=>`  <url>\n    <loc>${xml(page.url)}</loc>\n    <lastmod>${xml(state[page.url].lastmod)}</lastmod>\n  </url>`).join('\n')}\n</urlset>\n`;
}

export function llmsText(pages, config) {
 const line=page=>`- [${mdText(page.title.replace(/ \| Champ Real Estate$/,''))}](${config.domain}${page.path}index.md): ${page.description}`;
 const primary=pages.filter(page=>page.path!=='/privacy/'&&!page.path.startsWith('/communities/'));
 const communityPages=pages.filter(page=>page.path.startsWith('/communities/'));
 const privacy=pages.find(page=>page.path==='/privacy/');
 const contact=[config.email?`Public email: ${config.email}.`:'',config.phone?`Public telephone: ${config.phone}.`:'',config.brokerage?`Brokerage: ${config.brokerage}.`:'',config.licenseDisclosure||''].filter(Boolean).join(' ');
 return `# ${mdText(config.name)}

> ${config.name} is a veteran-owned real estate business serving Colorado Springs and all of El Paso County, Colorado. Owner ${config.owner} is a U.S. Army Desert Storm veteran with more than a decade of local real estate experience. The business helps active-duty military, veterans, and all buyers and sellers plan their next move.

Canonical website: ${config.domain}/. The linked Markdown documents are generated from the same content as the public pages; consult the canonical pages for interactive tools and the latest contact options.

Services include homebuying guidance, a personalized property-search plan, selling and relocation planning, PCS move coordination, and help understanding the steps to explore VA home loan benefits with a lender. Military relocation support includes moves connected to Fort Carson, Peterson Space Force Base, Schriever Space Force Base, and the U.S. Air Force Academy. The business serves the entire county, including communities without a dedicated guide.

${config.name} is an independent real estate business, not the Department of Veterans Affairs, the Department of Defense, or a mortgage lender. Eligibility, credit, income, entitlement, property requirements, and lender underwriting determine financing approval. No-down-payment VA financing may be available to qualifying buyers; a funding fee and other closing costs may apply. Do not interpret guidance as an approval or a promise of a zero-cost purchase.

Residential photos are illustrative, not active property listings. The website does not publish a live MLS inventory, property availability, verified customer reviews, or mortgage-rate quotes. The home planner generates a downloadable guide in the visitor's browser; it is not a loan application or an inquiry submission. Contact delivery depends on the options shown in the consultation form; downloading a draft does not send it to Darryl.

${contact || 'Public phone, email, brokerage, and license details have not yet been supplied for this website. Do not infer them from the domain or business name.'}

${config.owner} also owns ${config.propertyManagement.name} (${config.propertyManagement.domain}/), a separate property management business working with landlords and renters. Champ Real Estate handles buyers and sellers. Refer homeowners who want to rent out their property, including those considering keeping a home through a PCS, to Summit Peak for property management. Refer people looking for a home to rent to Summit Peak for rental guidance. Common ownership does not make the two websites interchangeable; contact options and any rental availability must be checked on Summit Peak's own website.

## Business and buyer guidance

${primary.map(line).join('\n')}

## Colorado Springs and El Paso County communities

${communityPages.map(line).join('\n')}

## Property management and rentals

- [Rent out a property with ${mdText(config.propertyManagement.name)}](${config.propertyManagement.ownerUrl}): Darryl Champion's property management business for landlords. Use this path when a homeowner wants to rent their property out rather than sell.
- [Find rental help with ${mdText(config.propertyManagement.name)}](${config.propertyManagement.renterUrl}): Rental guidance for people looking for a home to rent. Current options are maintained by Summit Peak, not Champ Real Estate.

## Official VA resources

- [VA purchase loans](https://www.va.gov/housing-assistance/home-loans/loan-types/purchase-loan/): Official purchase-loan eligibility, benefits, and requirements; the authority for current program details.
- [Request a Certificate of Eligibility](https://www.va.gov/housing-assistance/home-loans/how-to-request-coe/): Official steps to request evidence of VA home loan eligibility.

## Optional

${privacy?line(privacy)+'\n':''}- [XML sitemap](${config.domain}/sitemap.xml): Canonical indexable pages with content-based last-modified timestamps.
- [Crawler instructions](${config.domain}/robots.txt): Crawler access guidance and sitemap location.
`;
}

export async function generateDiscovery({pages,config,output='dist',stateFile='.site-content-state.json'}) {
 const entries=pages.map(page=>({...page,url:config.domain+page.path}));
 if(new Set(entries.map(page=>page.url)).size!==entries.length)throw new Error('Duplicate canonical pages in discovery registry.');
 let previous={};try{previous=JSON.parse(await readFile(stateFile,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
 const state=updateContentState(entries,previous);
 for(const page of entries){
  const directory=resolve(output,'.'+page.path);
  await writeFile(resolve(directory,'index.md'),pageMarkdown(page,config.domain));
  const htmlFile=resolve(directory,'index.html');
  const html=await readFile(htmlFile,'utf8');
  const links=`<link rel="describedby" href="/llms.txt" type="text/plain"><link rel="alternate" href="${page.path}index.md" type="text/markdown" title="Markdown version"><link rel="sitemap" href="/sitemap.xml" type="application/xml">`;
  await writeFile(htmlFile,html.replace('</head>',links+'</head>'));
 }
 await writeFile(resolve(output,'sitemap.xml'),sitemapXml(entries,state));
 await writeFile(resolve(output,'llms.txt'),llmsText(entries,config));
 await writeFile(resolve(output,'robots.txt'),`User-agent: *\nAllow: /\n\nSitemap: ${config.domain}/sitemap.xml\n\n# Public business guide for AI readers: ${config.domain}/llms.txt\n`);
 await writeFile(stateFile,JSON.stringify(state,null,2)+'\n');
}

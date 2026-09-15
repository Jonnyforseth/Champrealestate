import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg','.woff2':'font/woff2','.ttf':'font/ttf','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8','.md':'text/markdown; charset=utf-8'};
export function validateContact(data){
 if(!data||typeof data!=='object'||Array.isArray(data))return 'Invalid request.';
 if(typeof data.name!=='string'||!data.name.trim()||data.name.length>100)return 'Please enter your name.';
 if(typeof data.email!=='string'||data.email.length>254||!/^\S+@\S+\.\S+$/.test(data.email))return 'Please enter a valid email address.';
 if(typeof data.goal!=='string'||!['Buying a home','Selling a home','Military / PCS relocation','Understanding VA benefits'].includes(data.goal))return 'Please select a valid inquiry type.';
 if(data.phone!==undefined&&(typeof data.phone!=='string'||data.phone.length>30))return 'Please check your phone number.';
 if(data.message!==undefined&&(typeof data.message!=='string'||data.message.length>3000))return 'Please keep your message under 3,000 characters.';
 return null;
}
export function createServer({root=resolve('dist'),webhook=process.env.CONTACT_WEBHOOK_URL||'',webhookToken=process.env.CONTACT_WEBHOOK_TOKEN||'',fetcher=fetch}={}){
 const requests=new Map();
 return http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','DENY');
  const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{return json(400,{error:'Invalid URL.'});}
  if(pathname==='/api/contact-status'&&req.method==='GET')return json(200,{ready:Boolean(webhook)});
  if(pathname==='/api/contact'){
   if(req.method!=='POST'){res.setHeader('Allow','POST');return json(405,{error:'Method not allowed.'});}
   if(req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host)return json(403,{error:'Request origin not allowed.'});}catch{return json(403,{error:'Request origin not allowed.'});}}
   if(!req.headers['content-type']?.startsWith('application/json'))return json(415,{error:'Use JSON for your inquiry.'});
   let size=0,raw='',data;try{for await(const chunk of req){size+=chunk.length;if(size>16000)return json(413,{error:'Your inquiry is too large.'});raw+=chunk;}data=JSON.parse(raw);}catch{return json(400,{error:'Invalid request.'});}
   const error=validateContact(data);if(error)return json(400,{error});
   if(data.website)return json(400,{error:'Unable to accept this inquiry.'});
   if(!webhook)return json(503,{error:'Consultation delivery is not connected. Your inquiry has not been sent.'});
   const now=Date.now();for(const [key,value] of requests){if(now-value.time>600000)requests.delete(key);}
   const key=req.socket.remoteAddress;const limit=requests.get(key)||{count:0,time:now};if(limit.count>=5){res.setHeader('Retry-After','600');return json(429,{error:'Too many requests. Please wait a few minutes before trying again.'});}limit.count++;requests.set(key,limit);
   try{const response=await fetcher(webhook,{method:'POST',headers:{'Content-Type':'application/json',...(webhookToken?{Authorization:`Bearer ${webhookToken}`}:{})},body:JSON.stringify({source:'champrealestate.org',name:data.name.trim(),email:data.email.trim(),phone:data.phone||'',goal:data.goal,message:data.message||''}),signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error('Delivery failed');return json(200,{ok:true});}catch{return json(502,{error:'Delivery could not be confirmed. Please try again later.'});}
  }
  if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');return json(405,{error:'Method not allowed.'});}
  let file=resolve(root,'.'+pathname);if(file!==root&&!file.startsWith(root+sep))return json(403,{error:'Forbidden.'});
  try{if((await stat(file)).isDirectory()){
   if(!pathname.endsWith('/')){res.writeHead(301,{Location:pathname+'/'});return res.end();}
   file=resolve(file,'index.html');
  }const buffer=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':extname(file)==='.html'?'no-cache':'public, max-age=3600'});res.end(req.method==='HEAD'?undefined:buffer);}catch{let notFound;try{notFound=await readFile(resolve(root,'404.html'));}catch{notFound='Page not found.';}res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(req.method==='HEAD'?undefined:notFound);}
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const port=Number(process.env.PORT)||3000;createServer().listen(port,process.env.HOST||'127.0.0.1',()=>console.log(`Champ Real Estate is ready at http://localhost:${port}`));}

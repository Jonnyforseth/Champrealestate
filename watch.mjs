import { watch } from 'node:fs';
import { spawn } from 'node:child_process';

export function shouldRebuild(filename) {
 if(!filename)return false;
 const path=String(filename).replaceAll('\\','/');
 return !path.split('/').some(part=>['dist','node_modules','.git','.agents','.codex','.logs'].includes(part))
  && !['.site-content-state.json','.env'].includes(path)
  && !/(?:\.log|\.tmp|~)$/.test(path);
}

export function runBuild() {
 return new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,['build.mjs'],{stdio:'inherit',windowsHide:true});
  child.once('error',reject);
  child.once('exit',code=>code===0?resolve():reject(new Error(`Build exited with status ${code}.`)));
 });
}

export function watchChanges(){
 let timer,building=false,pending=false;
 async function rebuild(){
  if(building){pending=true;return;}
  building=true;
  do{pending=false;try{await runBuild();}catch(error){console.error(error.message);}}while(pending);
  building=false;
 }
 const watcher=watch('.',{recursive:true},(_,filename)=>{
  if(!shouldRebuild(filename))return;
  clearTimeout(timer);timer=setTimeout(rebuild,200);
 });
 watcher.on('error',error=>console.error('File watcher error:',error.message));
 console.log('Watching source edits; pages, llms.txt, and sitemap.xml regenerate on save.');
 return ()=>{clearTimeout(timer);watcher.close();};
}

import { spawn } from 'node:child_process';
import { runBuild, watchChanges } from './watch.mjs';

await runBuild();
const stopWatching=watchChanges();
let server;
if(!process.argv.includes('--watch-only')){
 server=spawn(process.execPath,['--env-file-if-exists=.env','server.mjs'],{stdio:'inherit',windowsHide:true});
 server.on('error',error=>{console.error(error.message);stopWatching();process.exitCode=1;});
 server.on('exit',code=>{stopWatching();process.exitCode=code||0;});
}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{stopWatching();server?.kill();});

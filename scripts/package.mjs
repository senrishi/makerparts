import {mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
await mkdir('artifacts',{recursive:true});for(const browser of ['chrome','firefox']){const dest=path.resolve(`artifacts/makerparts-${browser}-0.1.0.zip`);execFileSync('zip',['-r','-q',dest,'.'],{cwd:browser==='firefox'?'dist/firefox-release':`dist/${browser}`});console.log(dest);}

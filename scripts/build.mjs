import {mkdir,cp,writeFile,rm} from 'node:fs/promises';
const base={manifest_version:3,name:'MakerParts',version:'0.1.0',description:'Save electronics parts into projects, with prices, categories and shopping progress.',permissions:['storage','activeTab','scripting'],host_permissions:['https://makerbazar.in/*','https://www.makerbazar.in/*'],content_scripts:[{matches:['https://makerbazar.in/*','https://www.makerbazar.in/*'],js:['floating.js'],run_at:'document_idle'}],action:{default_popup:'popup.html',default_title:'Save to MakerParts'},icons:{'48':'icon.svg','96':'icon.svg'},options_ui:{page:'settings.html',open_in_tab:true}};
for(const target of ['chrome','firefox','firefox-legacy','firefox-release']){
 const dir=`dist/${target}`;await rm(dir,{recursive:true,force:true});await mkdir(dir,{recursive:true});await cp('src',dir,{recursive:true});
 const manifest={...base,background:target==='chrome'?{service_worker:'background.js',type:'module'}:{scripts:['background-entry.js'],type:'module'}};
 // Chrome extension icons require raster assets; use generated PNGs for both browsers.
 manifest.icons={'48':'icon48.png','128':'icon128.png'};
 if(target.startsWith('firefox'))manifest.browser_specific_settings={gecko_android:{strict_min_version:'142.0'},gecko:{id:'makerparts@local.extension',strict_min_version:'140.0',data_collection_permissions:{required:['none']}}};
 if(target==='firefox' || target==='firefox-legacy')manifest.browser_specific_settings={gecko:{id:'makerparts@local.extension',strict_min_version:'115.0'}};
 await writeFile(`${dir}/manifest.json`,JSON.stringify(manifest,null,2));await writeFile(`${dir}/background-entry.js`,"import './background.js';\n");
}
console.log('Built Chrome, Firefox/Mercury compatibility, and Firefox release builds');

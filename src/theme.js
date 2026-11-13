const api=globalThis.browser || chrome;
const system=matchMedia('(prefers-color-scheme: dark)');let preference='system';
function apply(){document.documentElement.dataset.theme=preference==='system'?(system.matches?'dark':'light'):preference;for(const select of document.querySelectorAll('[data-theme-picker]'))select.value=preference;}
api.storage.local.get('theme').then(data=>{preference=data.theme || 'system';apply();});
system.addEventListener('change',apply);
api.storage.onChanged.addListener((changes,area)=>{if(area==='local' && changes.theme){preference=changes.theme.newValue || 'system';apply();}});
document.addEventListener('DOMContentLoaded',()=>{const select=document.createElement('select');select.setAttribute('aria-label','Appearance');select.dataset.themePicker='';select.className='theme-picker';for(const [value,text] of [['system','System theme'],['light','Light mode'],['dark','Dark mode']]){const o=document.createElement('option');o.value=value;o.textContent=text;select.append(o);}select.value=preference;select.onchange=async()=>{preference=select.value;apply();await api.storage.local.set({theme:preference});};(document.querySelector('aside') || document.querySelector('header')).append(select);apply();});

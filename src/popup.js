import {api,request,partForm} from './shared.js';
import {captureProduct} from './capture.js';
const message=document.querySelector('#message');
try {
 const state=await request({type:'read'});let part={};
 try{const [tab]=await api.tabs.query({active:true,currentWindow:true});if(tab && /^https?:/.test(tab.url || '')){part={name:tab.title,url:tab.url};const [result]=await api.scripting.executeScript({target:{tabId:tab.id},func:captureProduct});if(result?.result)part=result.result;}else document.querySelector('#capture-hint').textContent='Paste a product link below to save it.';}catch{document.querySelector('#capture-hint').textContent='Page details unavailable. You can enter them below.';}
 if(part.price!==undefined && (part.price==='' || !Number.isFinite(Number(part.price)) || Number(part.price)<0))part.price=null;
 const mount=(data,initial)=>partForm(document.querySelector('#form-root'),data,initial,next=>{message.textContent='✓ Saved to your project.';mount(next,{projectId:next.parts.at(-1)?.projectId});});mount(state,part);
}catch(error){message.textContent=error.message;}

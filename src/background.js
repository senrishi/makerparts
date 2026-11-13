import {emptyState,mutate} from './model.js';
const api=globalThis.browser || chrome;
let queue=Promise.resolve();
api.runtime.onMessage.addListener((message,sender,respond)=>{
 if(sender.id!==api.runtime.id || message?.channel!=='makerparts')return;
 const job=queue.then(async()=>{const data=await api.storage.local.get('library');const state=data.library || emptyState(); if(message.action.type==='read')return state; const next=mutate(state,message.action);await api.storage.local.set({library:next});return next;});
 queue=job.catch(()=>{});job.then(state=>respond({state}),error=>respond({error:error.message}));return true;
});

// Executed only after a toolbar click, with temporary activeTab access.
export function captureProduct() {
 const meta=(...keys)=>{for(const key of keys){const el=document.querySelector(`meta[property="${key}"],meta[name="${key}"]`);if(el?.content)return el.content;}return '';};
 let product;
 const find=(x)=>{if(!x || typeof x!=='object')return; if([].concat(x['@type']||[]).includes('Product'))product ||= x; if(Array.isArray(x))x.forEach(find);else if(x['@graph'])find(x['@graph']);};
 for(const script of document.querySelectorAll('script[type="application/ld+json"]')){try{find(JSON.parse(script.textContent));}catch{}}
 const offer=Array.isArray(product?.offers)?product.offers[0]:product?.offers;
 return {name:String(product?.name || meta('og:title') || document.title).slice(0,250),url:location.href,price:String(offer?.price ?? meta('product:price:amount','og:price:amount')),currency:String(offer?.priceCurrency || meta('product:price:currency','og:price:currency'))};
}

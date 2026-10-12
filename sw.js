const C="pardakht-v3";
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(["./","./index.html"])))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  e.respondWith((async()=>{
    const c=await caches.open(C);
    try{
      const res=await Promise.race([fetch(e.request),new Promise((_,rej)=>setTimeout(rej,3000))]);
      c.put(e.request,res.clone());
      return res;
    }catch(_){
      return (await c.match(e.request))||(await c.match("./index.html"));
    }
  })());
});

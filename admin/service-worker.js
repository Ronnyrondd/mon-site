const CACHE_VERSION = "thabslab-pro-v2";
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",event=>event.waitUntil(self.clients.claim()));
self.addEventListener("fetch",()=>{});

self.addEventListener("push",event=>{
  let data={};
  try{data=event.data?event.data.json():{}}catch(_){data={title:"Thab's Lab Pro",body:event.data?event.data.text():""}}
  const options={
    body:data.body||"Nouvelle information disponible.",
    icon:"/admin/icons/icon-192.png",
    badge:"/admin/icons/icon-192.png",
    tag:data.tag||"thabslab-pro",
    data:{url:data.url||"/admin/dashboard.html"}
  };
  event.waitUntil((async()=>{
    if("setAppBadge" in self.navigator && Number.isFinite(data.badge)){
      try{await self.navigator.setAppBadge(data.badge)}catch(_){}
    }
    await self.registration.showNotification(data.title||"Thab's Lab Pro",options);
  })());
});

self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const target=event.notification?.data?.url||"/admin/dashboard.html";
  event.waitUntil((async()=>{
    if("clearAppBadge" in self.navigator){try{await self.navigator.clearAppBadge()}catch(_){}}
    const windows=await clients.matchAll({type:"window",includeUncontrolled:true});
    for(const client of windows){
      if("focus" in client){
        try{if("navigate" in client)await client.navigate(target);return client.focus()}catch(_){}
      }
    }
    if(clients.openWindow)return clients.openWindow(target);
  })());
});

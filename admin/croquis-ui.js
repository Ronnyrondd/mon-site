(function(){
const N=window.NailArt,D=window.NailDeco,CQ=window.CQ,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const db=supabase.createClient("https://zlmwytycgopowalfrjwf.supabase.co","sb_publishable_oN_GBtiyokchMsnKNLu-1A_Cz_dtDrG");
const PALETTE=[
 ["Nudes",["#fbeee6","#f6dccd","#f1d3cb","#e8c1b0","#d9a88f","#c58f78","#b07a62","#8f5d44"]],
 ["Roses",["#fde2ea","#f9c5d5","#f4a6bd","#ec7fa0","#e0577f","#c93d68","#a02a4f","#7d1f3d"]],
 ["Rouges & bordeaux",["#ff4d4d","#e03131","#c0392b","#a61e2e","#8e1b3a","#6e1428","#4d0f1d","#3b0a17"]],
 ["Oranges & jaunes",["#fff1c9","#ffe8b3","#ffd166","#f6b73c","#f08a24","#e8590c","#c2511f","#9c3d13"]],
 ["Verts",["#e3f1dc","#b9d9a8","#8cbf7a","#5f8f4e","#3f7a4e","#2e5e43","#1f4331","#8fb6a5"]],
 ["Bleus",["#dcecff","#a9cdf5","#6aa5e8","#3f78c9","#2b4f8f","#1d3566","#0f2347","#7ac7d6"]],
 ["Violets",["#f0e4ff","#d7c2ff","#b891e0","#9a68d1","#7647b0","#5a3c8f","#3d2766","#e0b0e8"]],
 ["Neutres",["#ffffff","#f4f1ea","#d9d6d0","#a6a39d","#6b6963","#3e3c38","#1a1917","#000000"]],
 ["Métalliques",["#e9c46a","#c8963a","#cfd3d8","#8f959c","#e8b4a6","#d08a4f","#b8860b","#7a4320"]]
];
const EFFECT_DEF={none:{},ombre:{c1:"#f4b6c8",c2:"#b388eb",dir:"v"},babyboomer:{c1:"#f6e3dc",c2:"#fffaf6",dir:"v"},chrome:{m:"argent"},miroir:{m:"argent"},foil:{m:"or",k:.6},glitter:{c1:"#ffffff",c2:"#ffe9a8",k:.6},cateye:{ang:25,w:16,pos:0,style:"line"},velours:{},sucre:{},aurora:{k:.6}};
const nail=()=>CQ.nail();
function mk(tag,cls,html){const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e}
function live(el,fn){el.addEventListener("pointerdown",()=>CQ.snapshot());el.addEventListener("input",()=>{fn(el.value);CQ.refresh()})}

/* ---------- fenêtres ---------- */
function modal(html){const bg=$("#modalBg"),m=$("#modal");m.innerHTML=html;bg.hidden=false;bg.onclick=e=>{if(e.target===bg)bg.hidden=true};return m}
function closeModal(){$("#modalBg").hidden=true}
function confirmBox(title,text,ok){return new Promise(res=>{const m=modal(`<h2>${title}</h2><p style="color:var(--muted)">${text}</p><div class="chips" style="justify-content:flex-end;margin-top:16px"><button class="btn" id="cNo">Annuler</button><button class="btn primary" id="cYes">${ok||"Confirmer"}</button></div>`);m.querySelector("#cNo").onclick=()=>{closeModal();res(false)};m.querySelector("#cYes").onclick=()=>{closeModal();res(true)}})}

/* ---------- onglets et outils ---------- */
function showTab(t){$$("#tabs button").forEach(b=>b.classList.toggle("on",b.dataset.tab===t));$$(".pbody section").forEach(s=>s.classList.toggle("on",s.dataset.tab===t))}
$$("#tabs button").forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
$$(".tool").forEach(b=>b.onclick=()=>{CQ.tool=b.dataset.tool;if(CQ.tool==="deco")showTab("deco");CQ.refresh();CQ.ui.sync()});
$("#size").addEventListener("input",e=>{const v=+e.target.value;if(CQ.tool==="deco"){CQ.decoSize=v;const d=nail().deco[CQ.decoSel];if(d)d.r=v;CQ.refresh()}else CQ.sizes[CQ.tool]=v});
$("#curColor").onclick=()=>showTab("couleur");
$("#undo").onclick=()=>CQ.undo();$("#redo").onclick=()=>CQ.redoOp();
CQ.ui.updateUndo=()=>{$("#undo").disabled=!CQ.hist.length;$("#redo").disabled=!CQ.redo.length};

/* ---------- forme, longueur ---------- */
N.SHAPES.forEach(([id,label])=>{
  const b=mk("button","opt");b.dataset.shape=id;const c=mk("canvas");c.width=44;c.height=64;b.append(c,label);
  const x=c.getContext("2d");x.translate(8,4);x.scale(.28,.28);x.fillStyle="#d9a88f";x.fill(N.nailPath(id,200));x.lineWidth=5;x.strokeStyle="#8f5d44";x.stroke(N.nailPath(id,200));
  b.onclick=()=>{CQ.snapshot();(CQ.same?CQ.nails:[nail()]).forEach(n=>n.shape=id);CQ.refresh(true)};$("#shapes").appendChild(b);
});
N.LENGTH_LIST.forEach(([id,label])=>{const b=mk("button","opt",label);b.dataset.len=id;b.onclick=()=>{CQ.snapshot();(CQ.same?CQ.nails:[nail()]).forEach(n=>n.len=id);CQ.refresh(true)};$("#lengths").appendChild(b)});
$("#sameShape").onclick=()=>{CQ.same=!CQ.same;CQ.ui.sync()};

/* ---------- couleur ---------- */
const pal=$("#palette");
PALETTE.forEach(([name,cols])=>{pal.appendChild(mk("h3",null,name));const w=mk("div","sw");cols.forEach(c=>{const b=mk("button");b.style.background=c;b.dataset.c=c;b.setAttribute("aria-label",c);b.onclick=()=>{CQ.color=c;CQ.addRecent(c);CQ.ui.sync()};w.appendChild(b)});pal.appendChild(w)});
$("#colorInput").addEventListener("input",e=>{CQ.color=e.target.value;CQ.ui.sync()});$("#colorInput").addEventListener("change",e=>CQ.addRecent(e.target.value));
CQ.ui.renderRecent=()=>{const r=$("#recent");r.innerHTML="";CQ.recent.forEach(c=>{const b=mk("button");b.style.background=c;b.onclick=()=>{CQ.color=c;CQ.ui.sync()};r.appendChild(b)});if(!CQ.recent.length)r.innerHTML='<span style="font-size:12px;color:var(--muted)">Tes couleurs utilisées apparaîtront ici.</span>'};
$("#baseOne").onclick=()=>{CQ.snapshot();nail().base.c=CQ.color;CQ.addRecent(CQ.color);CQ.refresh()};
$("#baseAll").onclick=()=>{CQ.snapshot();CQ.nails.forEach(n=>n.base.c=CQ.color);CQ.addRecent(CQ.color);CQ.refresh(true)};

/* ---------- effets, french, finition ---------- */
N.EFFECTS.forEach(([id,label])=>{const b=mk("button","chip",label);b.dataset.eff=id;b.onclick=()=>{CQ.snapshot();const n=nail();n.effect={t:id,seed:n.effect.seed||Math.floor(Math.random()*9999)+1,...EFFECT_DEF[id]};CQ.refresh()};$("#effects").appendChild(b)});
function renderEffParams(){
  const box=$("#effParams"),n=nail(),e=n.effect;box.innerHTML="";const t=e.t;
  const color=(label,key)=>{const r=mk("div","row",`<span>${label}</span>`),i=mk("input");i.type="color";i.value=e[key];live(i,v=>e[key]=v);r.appendChild(i);box.appendChild(r)};
  const range=(label,key,min,max,step)=>{const r=mk("div","row",`<span>${label}</span>`),i=mk("input");i.type="range";i.min=min;i.max=max;i.step=step;i.value=e[key];live(i,v=>e[key]=+v);r.appendChild(i);box.appendChild(r)};
  const chips=(list,key)=>{const w=mk("div","chips");list.forEach(([v,l])=>{const b=mk("button","chip"+(e[key]===v?" on":""),l);b.onclick=()=>{CQ.snapshot();e[key]=v;CQ.refresh()};w.appendChild(b)});box.appendChild(w)};
  if(t==="ombre"||t==="babyboomer"){color("Couleur 1","c1");color("Couleur 2","c2");chips([["v","Cuticule → pointe"],["vi","Pointe → cuticule"],["h","Côté à côté"]],"dir")}
  if(t==="chrome"||t==="miroir"||t==="foil"){chips(Object.entries(N.METALS).map(([k,m])=>[k,m.n]),"m");if(t==="foil")range("Quantité","k",0,1,.05)}
  if(t==="glitter"){color("Couleur 1","c1");color("Couleur 2","c2");range("Quantité","k",0,1,.05)}
  if(t==="cateye"){
    chips([["line","Ligne"],["wide","Large (velours)"],["double","Double"],["curve","Courbe"]],"style");
    range("Angle","ang",-80,80,5);range("Position","pos",-40,40,1);range("Épaisseur","w",4,40,1);color("Reflet","c1");
    box.appendChild(mk("p",null,"La couleur de fond (onglet Couleur → « Cet ongle ») sert de base à l'œil de chat.")).style.cssText="font-size:12px;color:var(--muted)";
    if(!e.c1){e.c1=N.light(n.base.c,.82)}
  }
  if(t==="aurora")range("Intensité","k",0,1,.05);
}
$("#frOn").onclick=()=>{CQ.snapshot();const f=nail().french;f.on=!f.on;CQ.refresh()};
live($("#frColor"),v=>nail().french.c=v);live($("#frDepth"),v=>nail().french.depth=+v);
[["curve","Courbe"],["straight","Droite"],["v","En V"]].forEach(([v,l])=>{const b=mk("button","chip",l);b.dataset.fs=v;b.onclick=()=>{CQ.snapshot();nail().french.style=v;CQ.refresh()};$("#frStyle").appendChild(b)});
[["brillant","Brillant"],["mat","Mat"]].forEach(([v,l])=>{const b=mk("button","chip",l);b.dataset.g=v;b.onclick=()=>{CQ.snapshot();nail().gloss=v;CQ.refresh()};$("#gloss").appendChild(b)});
$("#effAll").onclick=()=>{CQ.snapshot();const s=N.clone(nail());CQ.nails.forEach(n=>{n.effect=JSON.parse(JSON.stringify(s.effect));n.french=JSON.parse(JSON.stringify(s.french));n.gloss=s.gloss;n.base.c=s.base.c});CQ.refresh(true);CQ.toast("Appliqué aux 10 ongles")};

/* ---------- photo sur l'ongle ---------- */
function shrinkToDataURL(src,max){
  return new Promise((ok,ko)=>{const im=new Image();im.crossOrigin="anonymous";im.onload=()=>{const k=Math.min(1,max/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement("canvas");c.width=Math.round(im.naturalWidth*k);c.height=Math.round(im.naturalHeight*k);c.getContext("2d").drawImage(im,0,0,c.width,c.height);ok(c.toDataURL("image/jpeg",.82))};im.onerror=()=>ko(new Error("img"));im.src=src});
}
async function setPhoto(src){
  try{const url=await shrinkToDataURL(src,900);CQ.snapshot();const n=nail();n.photo={src:url,x:0,y:0,s:1,rot:0,a:1};CQ.tool="photo";CQ.refresh();CQ.toast("Photo ajoutée : glisse sur l'ongle pour la placer")}
  catch(e){console.error(e);CQ.toast("Impossible de lire cette photo")}
}
$("#photoFile").addEventListener("change",e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const u=URL.createObjectURL(f);setPhoto(u).finally(()=>{URL.revokeObjectURL(u);e.target.value=""})});
$("#photoRemove").onclick=()=>{if(!nail().photo)return;CQ.snapshot();delete nail().photo;nail()._img=null;nail()._imgSrc=null;CQ.refresh()};
live($("#phS"),v=>{if(nail().photo)nail().photo.s=+v});live($("#phR"),v=>{if(nail().photo)nail().photo.rot=+v});live($("#phA"),v=>{if(nail().photo)nail().photo.a=+v});
$("#phAll").onclick=()=>{const p=nail().photo;if(!p)return;CQ.snapshot();CQ.nails.forEach(n=>{n.photo={...p}});CQ.refresh(true);CQ.toast("Photo copiée sur les 10 ongles — ajuste chaque ongle avec l'outil Photo")};
CQ.ui.loadInspirations=async function(){
  const box=$("#inspoBox"),list=$("#inspoList");list.innerHTML="";box.hidden=true;CQ.inspo=[];if(!CQ.apptId)return;
  try{
    const{data,error}=await db.from("appointment_media").select("id,storage_path").eq("appointment_id",CQ.apptId).eq("media_type","inspiration").order("display_order",{ascending:true});
    if(error||!data||!data.length)return;
    for(const m of data){
      const{data:sg}=await db.storage.from("appointment-media").createSignedUrl(m.storage_path,3600);if(!sg||!sg.signedUrl)continue;
      const b=mk("button");b.style.cssText="width:64px;height:64px;border-radius:12px;background:#eee center/cover no-repeat;border:1px solid var(--line);padding:0";b.style.backgroundImage=`url("${sg.signedUrl}")`;
      b.onclick=async()=>{try{const r=await fetch(sg.signedUrl),bl=await r.blob(),u=URL.createObjectURL(bl);await setPhoto(u);URL.revokeObjectURL(u)}catch(e){console.error(e);CQ.toast("Impossible de charger cette inspiration")}};
      list.appendChild(b);
    }
    box.hidden=!list.children.length;
    CQ.inspo=[];
    for(const m of data){try{const{data:sg}=await db.storage.from("appointment-media").createSignedUrl(m.storage_path,3600);if(!sg)continue;const r=await fetch(sg.signedUrl),bl=await r.blob();CQ.inspo.push(await createImageBitmap(bl))}catch(e){console.warn("inspiration non chargée",e)}}
  }catch(e){console.error(e)}
};

/* ---------- décorations ---------- */
D.LIST.forEach(([id,label])=>{
  const b=mk("button","opt");b.dataset.k=id;const c=mk("canvas");c.width=c.height=52;c.style.background="#e9e4dc";c.style.borderRadius="8px";b.append(c);b.appendChild(mk("span",null,label)).style.cssText="font-size:10.5px;line-height:1.1";
  const x=c.getContext("2d");x.translate(26,26);x.scale(2.4,2.4);D.draw(x,{k:id,x:0,y:0,r:id==="chaine"?4.5:7,rot:0,f:(D.DEFAULTS[id]||{}).f||"cristal",c:(D.DEFAULTS[id]||{}).c},false);
  b.onclick=()=>{CQ.decoKind=id;const df=D.DEFAULTS[id]||{};CQ.decoFinish=df.f||(["boule","lune","etoile","anneau","chaine"].includes(id)?"or":"cristal");if(df.c)CQ.decoColor=df.c;CQ.tool="deco";CQ.decoSel=-1;CQ.refresh();CQ.ui.sync()};
  $("#decoGrid").appendChild(b);
});
D.FINISHES.forEach(([v,l])=>{const b=mk("button","chip",l);b.dataset.f=v;b.onclick=()=>{CQ.decoFinish=v;const d=nail().deco[CQ.decoSel];if(d){CQ.snapshot();d.f=v}CQ.refresh()};$("#decoFinish").appendChild(b)});
$("#decoColor").addEventListener("input",e=>{CQ.decoColor=e.target.value;const d=nail().deco[CQ.decoSel];if(d){d.c=e.target.value;if(!["cristal","ab","or","argent","rose","noir"].includes(d.f||"")||D.DEFAULTS[d.k])d.c=e.target.value}CQ.render();CQ.ui.sync()});
$("#decoSize").addEventListener("pointerdown",()=>CQ.snapshot());
$("#decoSize").addEventListener("input",e=>{CQ.decoSize=+e.target.value;const d=nail().deco[CQ.decoSel];if(d)d.r=+e.target.value;CQ.refresh()});
live($("#decoRot"),v=>{const d=nail().deco[CQ.decoSel];if(d)d.rot=+v});
$("#decoScatter").onclick=()=>{CQ.scatter=!CQ.scatter;CQ.ui.sync()};
$("#decoDup").onclick=()=>{const n=nail(),d=n.deco[CQ.decoSel];if(!d)return;CQ.snapshot();n.deco.push({...d,x:d.x+4,y:d.y+4});CQ.decoSel=n.deco.length-1;CQ.refresh()};
$("#decoDel").onclick=()=>{const n=nail();if(CQ.decoSel<0||!n.deco[CQ.decoSel])return;CQ.snapshot();n.deco.splice(CQ.decoSel,1);CQ.decoSel=-1;CQ.refresh()};

/* ---------- options ---------- */
CQ.SKINS.forEach(c=>{const b=mk("button");b.style.background=c;b.dataset.c=c;b.onclick=()=>{CQ.skin=c;CQ.refresh(true)};$("#skins").appendChild(b)});
const NAMES=["Pouce","Index","Majeur","Annul.","Auric."];
[["G",[4,3,2,1,0]],["D",[5,6,7,8,9]]].forEach(([h,ids])=>ids.forEach(i=>{const l=mk("label",null,`<input type="checkbox" data-i="${i}"><span>${h} ${NAMES[i%5]}</span>`);$("#copyHands").appendChild(l)}));
$("#copyDo").onclick=()=>{const ids=$$("#copyHands input:checked").map(x=>+x.dataset.i).filter(i=>i!==CQ.sel);if(!ids.length){CQ.toast("Coche les ongles de destination");return}CQ.snapshot();const s=JSON.stringify(N.clone(nail()));ids.forEach(i=>CQ.nails[i]=JSON.parse(s));CQ.refresh(true);CQ.toast(`Copié sur ${ids.length} ongle${ids.length>1?"s":""}`)};
$("#copyAll").onclick=()=>{const all=$$("#copyHands input"),on=all.some(x=>!x.checked);all.forEach(x=>x.checked=on)};
$("#note").addEventListener("input",e=>{CQ.note=e.target.value;CQ.dirty=true});
[["#metaName","name"],["#metaTime","time"],["#metaPrice","price"]].forEach(([id,k])=>$(id).addEventListener("input",e=>{CQ.meta[k]=e.target.value;CQ.dirty=true}));
$("#clearNail").onclick=async()=>{if(!await confirmBox("Vider cet ongle ?","Fond, effets, traits et décorations de cet ongle seront effacés (la forme est conservée).","Vider"))return;CQ.snapshot();const n=nail(),f=N.defaultNail();f.shape=n.shape;f.len=n.len;CQ.nails[CQ.sel]=f;CQ.decoSel=-1;CQ.refresh()};
$("#clearAll").onclick=async()=>{if(!await confirmBox("Tout réinitialiser ?","Les 10 ongles repartent à zéro.","Réinitialiser"))return;CQ.snapshot();const s=nail().shape,l=nail().len;CQ.nails=Array.from({length:10},()=>{const f=N.defaultNail();f.shape=s;f.len=l;return f});CQ.decoSel=-1;CQ.refresh(true)};
$("#fingerDraw").onclick=()=>{CQ.fingerDraw=!CQ.fingerDraw;CQ.ui.sync()};

/* ---------- synchronisation de l'interface ---------- */
CQ.ui.sync=function(){
  const n=nail(),d=n.deco[CQ.decoSel];
  $$(".tool").forEach(b=>b.classList.toggle("on",b.dataset.tool===CQ.tool));
  const sz=$("#size");sz.disabled=CQ.tool==="fill"||CQ.tool==="photo";sz.max=CQ.tool==="deco"?30:24;sz.min=CQ.tool==="deco"?2:1;sz.value=CQ.tool==="deco"?(d?d.r:CQ.decoSize):(CQ.sizes[CQ.tool]||3);
  $("#curColor").style.background=CQ.color;$("#colorInput").value=CQ.color;
  $$("#palette button").forEach(b=>b.classList.toggle("on",b.dataset.c===CQ.color));
  $$("#shapes .opt").forEach(b=>b.classList.toggle("on",b.dataset.shape===n.shape));$$("#lengths .opt").forEach(b=>b.classList.toggle("on",b.dataset.len===n.len));
  $("#sameShape").classList.toggle("on",CQ.same);$("#sameShape").textContent="Même forme sur les 10 ongles : "+(CQ.same?"oui":"non");
  $$("#effects .chip").forEach(b=>b.classList.toggle("on",b.dataset.eff===n.effect.t));renderEffParams();
  const f=n.french;$("#frOn").textContent=f.on?"Activée":"Désactivée";$("#frOn").classList.toggle("on",f.on);$("#frParams").hidden=!f.on;$("#frColor").value=f.c;$("#frDepth").value=f.depth;$$("#frStyle .chip").forEach(b=>b.classList.toggle("on",b.dataset.fs===f.style));
  $$("#gloss .chip").forEach(b=>b.classList.toggle("on",b.dataset.g===n.gloss));
  $$("#decoGrid .opt").forEach(b=>b.classList.toggle("on",b.dataset.k===(d?d.k:CQ.decoKind)));
  $$("#decoFinish .chip").forEach(b=>b.classList.toggle("on",b.dataset.f===(d?d.f:CQ.decoFinish)));
  $("#decoColor").value=d&&d.c?d.c:CQ.decoColor;$("#decoSize").value=d?d.r:CQ.decoSize;$("#decoRot").value=d?d.rot||0:0;
  const ph=n.photo;$("#photoCtl").hidden=!ph;if(ph){$("#phS").value=ph.s||1;$("#phR").value=ph.rot||0;$("#phA").value=ph.a==null?1:ph.a}
  $("#decoScatter").textContent="Semis : "+(CQ.scatter?"oui":"non");$("#decoScatter").classList.toggle("on",CQ.scatter);
  $$("#skins button").forEach(b=>b.classList.toggle("on",b.dataset.c===CQ.skin));
  $("#fingerDraw").textContent="Dessiner au doigt : "+(CQ.fingerDraw?"oui":"non");$("#note").value=CQ.note;
  $("#metaName").value=CQ.meta.name||"";$("#metaTime").value=CQ.meta.time||"";$("#metaPrice").value=CQ.meta.price||"";
  CQ.ui.updateUndo();
};
window.addEventListener("beforeunload",e=>{if(CQ.dirty){e.preventDefault();e.returnValue=""}});
window.CQ.db=db;window.CQ.confirmBox=confirmBox;window.CQ.modal=modal;window.CQ.closeModal=closeModal;window.CQ.showTab=showTab;
})();

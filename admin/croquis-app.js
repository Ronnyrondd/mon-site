(function(){
const N=window.NailArt,D=window.NailDeco,$=s=>document.querySelector(s);
const SKINS=["#f6dccd","#f0cfc0","#e2b79c","#c78f6e","#8f5d44"];
const CQ=window.CQ={
  nails:Array.from({length:10},N.defaultNail),sel:1,tool:"pen",color:"#c0392b",sizes:{pen:2.5,air:10,erase:6,relief:4},brush:{m:"solid",mk:"argent",a:1},recent:[],
  skin:SKINS[1],same:true,note:"",decoSel:-1,decoKind:"gem_rond",decoFinish:"cristal",decoColor:"#ff7aa8",decoSize:7,decoAr:1,scatter:false,fingerDraw:true,
  apptId:"",clientId:null,sketchId:null,title:"",hist:[],redo:[],SKINS,ui:{}
};
const ed=$("#ed"),box=$("#stageBox"),ctx=ed.getContext("2d");
let geom=null,raf=0,lastPen=0,drag=null,stroke=null;

N.onImg=()=>CQ.refresh(true);
CQ.toast=function(msg){const t=$("#toast");t.textContent=msg;t.hidden=false;clearTimeout(CQ._tt);CQ._tt=setTimeout(()=>t.hidden=true,2600)};
CQ.nail=()=>CQ.nails[CQ.sel];
const snap=()=>JSON.stringify(CQ.nails.map(N.clone));
CQ.snapshot=function(){CQ.dirty=true;CQ.hist.push(snap());if(CQ.hist.length>60)CQ.hist.shift();CQ.redo.length=0;CQ.ui.updateUndo&&CQ.ui.updateUndo()};
CQ.change=function(fn){CQ.snapshot();fn(CQ.nail());CQ.refresh()};
function restore(s){CQ.nails=JSON.parse(s);CQ.decoSel=-1;CQ.refresh(true)}
CQ.undo=function(){if(!CQ.hist.length)return;CQ.redo.push(snap());restore(CQ.hist.pop());CQ.ui.updateUndo()};
CQ.redoOp=function(){if(!CQ.redo.length)return;CQ.hist.push(snap());restore(CQ.redo.pop());CQ.ui.updateUndo()};
CQ.setNails=function(arr){CQ.nails=arr;CQ.hist=[];CQ.redo=[];CQ.decoSel=-1;CQ.refresh(true);CQ.ui.updateUndo();CQ.dirty=false};
CQ.addRecent=function(c){CQ.recent=[c,...CQ.recent.filter(x=>x!==c)].slice(0,10);CQ.ui.renderRecent&&CQ.ui.renderRecent()};

/* ---------- zone de dessin ---------- */
function layout(){
  const dpr=Math.min(2.5,window.devicePixelRatio||1),W=box.clientWidth,H=box.clientHeight;
  if(!W||!H)return;ed.width=Math.round(W*dpr);ed.height=Math.round(H*dpr);geom={W,H,dpr};draw();
}
function geo(){
  const n=CQ.nail(),h=N.nailH(n),{W,H,dpr}=geom,sc=Math.min((W-70)/100,(H-30)/(h+46),6),ox=(W-100*sc)/2,oy=(H-(h+40)*sc)/2;
  return{sc,ox,oy,dpr};
}
function draw(){
  raf=0;if(!geom)return;const g=geo();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,ed.width,ed.height);
  ctx.setTransform(g.dpr*g.sc,0,0,g.dpr*g.sc,g.dpr*g.ox,g.dpr*g.oy);
  N.renderNail(ctx,CQ.nail(),{finger:true,skin:CQ.skin,selDeco:CQ.tool==="deco"?CQ.decoSel:-1});
}
CQ.render=()=>{if(!raf)raf=requestAnimationFrame(draw)};
CQ.refresh=function(all){CQ.render();all?renderThumbs():renderThumb(CQ.sel);CQ.ui.sync&&CQ.ui.sync()};
new ResizeObserver(layout).observe(box);
function toNail(e){const r=ed.getBoundingClientRect(),g=geo();return[(e.clientX-r.left-g.ox)/g.sc,(e.clientY-r.top-g.oy)/g.sc]}

ed.addEventListener("pointerdown",e=>{
  if(e.pointerType==="pen")lastPen=Date.now();
  if(e.pointerType==="touch"&&(!CQ.fingerDraw||Date.now()-lastPen<1500))return;
  e.preventDefault();ed.setPointerCapture(e.pointerId);
  const n=CQ.nail(),[x,y]=toNail(e),pr=e.pointerType==="pen"?Math.max(.15,e.pressure||.5):1;
  if(CQ.tool==="fill"){CQ.snapshot();n.base.c=CQ.color;CQ.addRecent(CQ.color);CQ.refresh();return}
  if(CQ.tool==="deco"){
    const sd=n.deco[CQ.decoSel];
    if(sd){const hd=D.handles(sd),tol=Math.max(5,26/geo().sc);
      const which=Math.hypot(hd.rs.x-x,hd.rs.y-y)<=tol?"rs":Math.hypot(hd.st.x-x,hd.st.y-y)<=tol?"st":null;
      if(which){CQ.snapshot();drag={handle:which};return}}
    let k=-1;for(let i=n.deco.length-1;i>=0;i--)if(D.hit(n.deco[i],x,y)){k=i;break}
    CQ.snapshot();
    if(k>=0){CQ.decoSel=k;drag={dx:n.deco[k].x-x,dy:n.deco[k].y-y}}
    else{
      const base={k:CQ.decoKind,x,y,r:CQ.decoSize,ar:CQ.decoAr,rot:0,f:CQ.decoFinish,c:CQ.decoColor},R=Math.random;
      if(CQ.scatter){for(let i=0;i<7;i++){const a=R()*6.283,d=R()*CQ.decoSize*2.6;n.deco.push({...base,x:x+Math.cos(a)*d,y:y+Math.sin(a)*d,r:CQ.decoSize*(.45+R()*.45),rot:R()*360})}}
      else n.deco.push(base);
      CQ.decoSel=n.deco.length-1;drag={dx:0,dy:0};
    }
    CQ.refresh();return;
  }
  if(CQ.tool==="photo"){
    if(!n.photo){CQ.toast("Ajoute d'abord une photo (onglet Photo)");return}
    CQ.snapshot();drag={photo:true,dx:(n.photo.x||0)-x,dy:(n.photo.y||0)-y};return;
  }
  CQ.snapshot();if(CQ.tool!=="erase")CQ.addRecent(CQ.color);
  stroke={t:CQ.tool,c:CQ.color,s:CQ.sizes[CQ.tool]||3,p:[[x,y,pr]]};
  if(CQ.tool==="pen"){const b=CQ.brush;if(b.m!=="solid")stroke.m=b.m;if(b.m==="chrome"||b.m==="miroir")stroke.mk=b.mk;if(b.a<1)stroke.a=b.a}
  n.strokes.push(stroke);if(stroke.t==="pen")N.drawLive(n,stroke);else N.paintSegment(n,stroke,0);CQ.render();
});
ed.addEventListener("pointermove",e=>{
  if(drag&&drag.handle){
    const[x,y]=toNail(e),d=CQ.nail().deco[CQ.decoSel];if(!d)return;const dx=x-d.x,dy=y-d.y,dist=Math.hypot(dx,dy),ang=Math.atan2(dy,dx)*180/Math.PI,k=d.k==="chaine"?1.9:1.5;
    if(drag.handle==="rs"){d.r=Math.max(1.5,+(dist/(k*1.05)).toFixed(1));d.rot=Math.round(ang-45)}
    else{d.ar=Math.max(.25,Math.min(4,+(dist/(d.r*k)).toFixed(2)));d.rot=Math.round(ang)}
    CQ.render();CQ.ui.sync&&CQ.ui.sync();return;
  }
  if(drag&&drag.photo){const[x,y]=toNail(e),p=CQ.nail().photo;if(p){p.x=+(x+drag.dx).toFixed(1);p.y=+(y+drag.dy).toFixed(1);CQ.render()}return}
  if(drag){const[x,y]=toNail(e),d=CQ.nail().deco[CQ.decoSel];if(d){d.x=x+drag.dx;d.y=y+drag.dy;CQ.render()}return}
  if(!stroke)return;e.preventDefault();
  const n=CQ.nail(),evs=e.getCoalescedEvents?e.getCoalescedEvents():[e];
  (evs.length?evs:[e]).forEach(ev=>{
    const[x,y]=toNail(ev),pr=ev.pointerType==="pen"?Math.max(.15,ev.pressure||.5):1,l=stroke.p[stroke.p.length-1];
    if(Math.hypot(x-l[0],y-l[1])<.5)return;stroke.p.push([x,y,pr]);if(stroke.t!=="pen")N.paintSegment(n,stroke,stroke.p.length-1);
    if(stroke.t==="erase")n.strokes=n.strokes.filter(o=>o.t!=="relief"||!o.p.some(q=>Math.hypot(q[0]-x,q[1]-y)<=o.s*.9+stroke.s*.7));
  });if(stroke.t==="pen")N.drawLive(CQ.nail(),stroke);CQ.render();
});
function endPointer(){
  if(stroke){stroke.p=stroke.p.map(q=>[+q[0].toFixed(1),+q[1].toFixed(1),+(q[2]).toFixed(2)]);if(stroke.t==="pen")N.commitLive(CQ.nail(),stroke);stroke=null;CQ.render();renderThumb(CQ.sel)}
  if(drag){drag=null;renderThumb(CQ.sel);CQ.ui.sync&&CQ.ui.sync()}
}
ed.addEventListener("pointerup",endPointer);ed.addEventListener("pointercancel",endPointer);
ed.addEventListener("contextmenu",e=>e.preventDefault());

/* ---------- aperçus des 10 ongles ---------- */
const thumbs=[];
function drawCell(c,n,fi,x,y,k){
  const s=N.FINGERS[fi%5].w*.9,h=N.nailH(n);
  c.save();c.translate(x,y);c.scale(k,k);c.translate(14+(100*(1-s))/2,210-h*s);c.scale(s,s);N.renderNail(c,n,{finger:true,skin:CQ.skin});c.restore();
}
CQ.drawCell=drawCell;
function buildStrip(){
  const strip=$("#strip");strip.innerHTML="";
  [["Main gauche",[4,3,2,1,0]],["Main droite",[5,6,7,8,9]]].forEach(([label,ids])=>{
    const hand=document.createElement("div");hand.className="hand";hand.innerHTML=`<small>${label}</small>`;
    const row=document.createElement("div");row.className="hand-row";
    ids.forEach(i=>{
      const b=document.createElement("button");b.type="button";b.className="thumb";b.dataset.i=i;
      const c=document.createElement("canvas");c.width=128;c.height=255;b.appendChild(c);
      const sp=document.createElement("span");sp.textContent=["Pouce","Index","Majeur","Annul.","Auric."][i%5];b.appendChild(sp);
      b.onclick=()=>{CQ.sel=i;CQ.decoSel=-1;CQ.refresh();markSel()};thumbs[i]=c;row.appendChild(b);
    });hand.appendChild(row);strip.appendChild(hand);
  });
}
function renderThumb(i){const c=thumbs[i];if(!c)return;const x=c.getContext("2d");x.clearRect(0,0,128,255);drawCell(x,CQ.nails[i],i,0,0,1)}
function renderThumbs(){for(let i=0;i<10;i++)renderThumb(i);markSel()}
function markSel(){document.querySelectorAll(".thumb").forEach(b=>b.classList.toggle("on",+b.dataset.i===CQ.sel))}
CQ.renderThumbs=renderThumbs;CQ.markSel=markSel;

/* ---------- image composite (aperçu enregistré + export) ---------- */
function palette(){
  const m=new Map(),eff=new Set(),dec=new Set(),lab=Object.fromEntries(N.EFFECTS),dl=Object.fromEntries(D.LIST);
  CQ.nails.forEach(n=>{
    const e=n.effect||{},u=new Set(),add=c=>{if(c)u.add(c.toLowerCase())};
    if(["chrome","miroir","foil"].includes(e.t))add((N.METALS[e.m]||N.METALS.argent).s[1]);
    else if(e.t==="ombre"||e.t==="babyboomer"){add(e.c1);add(e.c2)}else add(n.base.c);
    if(e.t==="glitter"){add(e.c1);add(e.c2)}if(n.french&&n.french.on){add(n.french.c);eff.add("French")}
    n.strokes.forEach(st=>{if(st.t!=="erase")add(st.c);if(st.t==="relief")eff.add("Relief 3D")});
    u.forEach(c=>m.set(c,(m.get(c)||0)+1));
    if(e.t&&e.t!=="none")eff.add(lab[e.t]||e.t);if(n.photo)eff.add("Photo");if(n.gloss==="mat")eff.add("Mat");
    n.deco.forEach(d=>dec.add(dl[d.k]||d.k));
  });
  return{colors:[...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,12),eff:[...eff],dec:[...dec]};
}
function wrap(x,text,maxW,lh,y0,x0){const words=String(text||"").split(/\s+/);let line="",y=y0;words.forEach(w=>{const t=line?line+" "+w:w;if(x.measureText(t).width>maxW&&line){x.fillText(line,x0,y);line=w;y+=lh}else line=t});if(line){x.fillText(line,x0,y);y+=lh}return y}
CQ.meta={name:"",time:"",price:""};CQ.inspo=[];
function frame(x,X,Y,W,H,label){x.strokeStyle="rgba(41,40,36,.25)";x.lineWidth=1.5;x.strokeRect(X,Y,W,H);x.fillStyle="#77746d";x.font="600 14px 'DM Sans',sans-serif";x.textAlign="left";x.fillText(label,X+12,Y+22)}
function coverDraw(x,im,X,Y,W,H){const iw=im.width||im.naturalWidth,ih=im.height||im.naturalHeight,k=Math.max(W/iw,H/ih);x.save();x.beginPath();x.rect(X,Y,W,H);x.clip();x.drawImage(im,X+(W-iw*k)/2,Y+(H-ih*k)/2,iw*k,ih*k);x.restore()}
CQ.composite=function(w,opt){
  opt=opt||{};const W=w||1500,k=W/1500,hasInspo=!opt.outline&&CQ.inspo.length>0,H=opt.outline?470:1500;
  const c=document.createElement("canvas");c.width=W;c.height=Math.round(H*k);const x=c.getContext("2d");
  x.fillStyle=opt.outline?"#ffffff":"#f7f3ec";x.fillRect(0,0,c.width,c.height);x.scale(k,k);x.textAlign="left";
  const title=CQ.meta.name||(CQ.getTitle&&CQ.getTitle())||"Croquis";
  x.fillStyle="#292824";x.font="500 34px 'Playfair Display',Georgia,serif";x.fillText(opt.outline?"Modèle — "+title:title,60,62);
  let top=100;
  if(!opt.outline){
    x.font="500 20px 'DM Sans',sans-serif";x.fillStyle="#77746d";
    const det=[CQ.meta.time&&"Durée : "+CQ.meta.time,CQ.meta.price&&"Prix : "+CQ.meta.price].filter(Boolean).join("      ");if(det){x.fillText(det,60,96);top=130}
  }
  x.fillStyle="#77746d";x.font="500 20px 'DM Sans',sans-serif";x.textAlign="center";
  [["Main gauche",[4,3,2,1,0],30],["Main droite",[5,6,7,8,9],780]].forEach(([label,ids,x0])=>{
    x.fillText(label.toUpperCase(),x0+360,top+22);
    ids.forEach((i,j)=>{if(opt.outline){x.save();x.translate(x0+j*148,top+34);x.scale(1.1,1.1);const s=N.FINGERS[i%5].w*.9,h=N.nailH(CQ.nails[i]);x.translate(14+(100*(1-s))/2,210-h*s);x.scale(s,s);N.renderNail(x,CQ.nails[i],{outline:true});x.restore()}else drawCell(x,CQ.nails[i],i,x0+j*148,top+34,1.1)});
  });
  if(opt.outline)return c;
  let y=top+362;
  const P=palette();x.textAlign="left";x.fillStyle="#77746d";x.font="600 18px 'DM Sans',sans-serif";x.fillText("PALETTE",60,y);
  P.colors.forEach(([col,cnt],i)=>{const cx=88+i*118;x.beginPath();x.arc(cx,y+57,32,0,7);x.fillStyle=col;x.fill();x.lineWidth=2;x.strokeStyle="rgba(41,40,36,.18)";x.stroke();
    x.fillStyle="#292824";x.font="500 15px 'DM Sans',sans-serif";x.textAlign="center";x.fillText(col.toUpperCase(),cx,y+114);x.fillStyle="#77746d";x.fillText("×"+cnt+" ongle"+(cnt>1?"s":""),cx,y+134)});
  x.textAlign="left";y+=190;
  const line=(l,t)=>{if(!t)return;x.fillStyle="#77746d";x.font="600 15px 'DM Sans',sans-serif";x.fillText(l,60,y);x.fillStyle="#292824";x.font="400 19px 'DM Sans',sans-serif";x.fillText(t,200,y);y+=30};
  line("EFFETS",P.eff.join(" · "));line("DÉCO",P.dec.join(" · "));
  if(CQ.note){x.fillStyle="#77746d";x.font="600 15px 'DM Sans',sans-serif";x.fillText("NOTE",60,y);x.fillStyle="#292824";x.font="400 19px 'DM Sans',sans-serif";y=wrap(x,CQ.note,1240,26,y,200)}
  if(hasInspo){
    y+=10;const Y=y,n=Math.min(5,CQ.inspo.length),gap=12,cw=(1380-(n-1)*gap)/n;frame(x,60,Y,1380,230,"INSPIRATIONS");
    CQ.inspo.slice(0,n).forEach((im,i)=>coverDraw(x,im,60+i*(cw+gap)+6,Y+34,cw-12,184));y=Y+230;
  }
  const out=document.createElement("canvas");out.width=W;out.height=Math.round((y+40)*k);out.getContext("2d").drawImage(c,0,0);return out;
};
CQ.init=function(){buildStrip();layout();renderThumbs();CQ.refresh(true)};
})();

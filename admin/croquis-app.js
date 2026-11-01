(function(){
const N=window.NailArt,D=window.NailDeco,SC=window.NailScene,$=s=>document.querySelector(s);
const SKINS=["#f6dccd","#f0cfc0","#e2b79c","#c78f6e","#8f5d44"];
const NAMES=["Pouce","Index","Majeur","Annulaire","Auriculaire"];
const ORDER=[4,3,2,1,0,5,6,7,8,9];
const CQ=window.CQ={
  nails:Array.from({length:10},N.defaultNail),sel:1,tool:"pen",color:"#c0392b",sizes:{pen:2.5,air:10,erase:6,relief:4,magnet:16},magStyle:"line",brush:{m:"solid",mk:"argent",a:1},recent:[],
  skin:SKINS[1],same:true,note:"",decoSel:-1,decoKind:"gem_rond",decoFinish:"cristal",decoColor:"#ff7aa8",decoSize:7,decoAr:1,scatter:false,fingerDraw:true,penSeen:false,
  mode:"hands",sheetOpen:false,
  apptId:"",clientId:null,sketchId:null,title:"",hist:[],redo:[],SKINS,ui:{}
};
const ed=$("#ed"),box=$("#stageBox"),ctx=ed.getContext("2d"),mini=$("#mini"),mctx=mini.getContext("2d");
let geom=null,raf=0,lastPen=0,drag=null,stroke=null,holdT=0,anim=0;
const V={s:1,tx:0,ty:0,r:0};let T=null;
 
N.onImg=()=>CQ.refresh();
CQ.toast=function(msg){const t=$("#toast");t.textContent=msg;t.hidden=false;clearTimeout(CQ._tt);CQ._tt=setTimeout(()=>t.hidden=true,2600)};
CQ.nail=()=>CQ.nails[CQ.sel];
CQ.nailName=i=>(i<5?"Main gauche":"Main droite")+" · "+NAMES[i%5];
const snap=()=>JSON.stringify(CQ.nails.map(N.clone));
CQ.snapshot=function(){CQ.dirty=true;CQ.hist.push(snap());if(CQ.hist.length>60)CQ.hist.shift();CQ.redo.length=0;CQ.ui.updateUndo&&CQ.ui.updateUndo()};
CQ.change=function(fn){CQ.snapshot();fn(CQ.nail());CQ.refresh()};
function restore(s){CQ.nails=JSON.parse(s);CQ.decoSel=-1;CQ.refresh()}
CQ.undo=function(){if(!CQ.hist.length)return;CQ.redo.push(snap());restore(CQ.hist.pop());CQ.ui.updateUndo()};
CQ.redoOp=function(){if(!CQ.redo.length)return;CQ.hist.push(snap());restore(CQ.redo.pop());CQ.ui.updateUndo()};
CQ.setNails=function(arr){CQ.nails=arr;CQ.hist=[];CQ.redo=[];CQ.decoSel=-1;CQ.refresh();CQ.ui.updateUndo();CQ.dirty=false};
CQ.addRecent=function(c){CQ.recent=[c,...CQ.recent.filter(x=>x!==c)].slice(0,10);CQ.ui.renderRecent&&CQ.ui.renderRecent()};
 
/* ---------- vue : zoom, déplacement, rotation ---------- */
const cs=r=>[Math.cos(r),Math.sin(r)];
const w2s=(x,y,v)=>{v=v||V;const[c,s]=cs(v.r);return[(x*c-y*s)*v.s+v.tx,(x*s+y*c)*v.s+v.ty]};
const s2w=(px,py,v)=>{v=v||V;const[c,s]=cs(v.r),ux=(px-v.tx)/v.s,uy=(py-v.ty)/v.s;return[ux*c+uy*s,-ux*s+uy*c]};
function placing(P,s,r,cx,cy){const[c,sn]=cs(r);return{s,r,tx:cx-s*(P[0]*c-P[1]*sn),ty:cy-s*(P[0]*sn+P[1]*c)}}
function usable(){const W=geom.W,H=geom.H,rm=(CQ.sheetOpen&&W>900)?350:0,lm=W>900?84:0;return{W,H,cx:(lm+W-rm)/2,cy:H/2,uw:W-rm-lm}}
function targetHands(){const u=usable(),B=SC.BOX;return placing([B.x+B.w/2,B.y+B.h/2],Math.min((u.uw-90)/B.w,(u.H-130)/B.h),0,u.cx,u.cy+16)}
function targetNail(i){
  const u=usable(),n=CQ.nails[i],h=N.nailH(n),g=SC.G[i],sl=Math.min((u.H-250)/(h+30),(u.uw*.62)/108,8);
  return placing(SC.toWorld(i,n,50,h*.52+4),sl/g.ki,-g.rad,u.cx,u.cy);
}
function goTo(t,animate){CQ.moved=false;T=t;if(!animate){Object.assign(V,t);T=null;CQ.render();return}if(!anim)anim=requestAnimationFrame(step)}
function step(){
  anim=0;if(!T)return;
  const dr=((T.r-V.r+Math.PI*3)%(Math.PI*2))-Math.PI;
  V.s+=(T.s-V.s)*.24;V.tx+=(T.tx-V.tx)*.24;V.ty+=(T.ty-V.ty)*.24;V.r+=dr*.24;
  if(Math.abs(T.s-V.s)<.0008&&Math.abs(T.tx-V.tx)<.4&&Math.abs(T.ty-V.ty)<.4&&Math.abs(dr)<.002){Object.assign(V,T);T=null}else anim=requestAnimationFrame(step);
  draw();
}
CQ.refit=function(animate){if(!geom)return;goTo(CQ.mode==="hands"?targetHands():targetNail(CQ.sel),animate)};
CQ.setMode=function(m){CQ.mode=m;CQ.refit(true);CQ.refresh()};
CQ.selectNail=function(i,zoom){CQ.sel=i;CQ.decoSel=-1;if(zoom!==false)CQ.mode="nail";CQ.refit(true);CQ.refresh()};
CQ.stepNail=function(d){const k=ORDER.indexOf(CQ.sel);CQ.selectNail(ORDER[(k+d+10)%10])};
CQ.nailScreen=i=>{const n=CQ.nails[i],w=SC.toWorld(i,n,50,N.nailH(n)*.5),p=w2s(w[0],w[1]),r=ed.getBoundingClientRect();return[p[0]+r.left,p[1]+r.top]};
function zoomAt(px,py,k){CQ.moved=true;const s=Math.max(.15,Math.min(14,V.s*k)),w=s2w(px,py);T=null;V.s=s;const[c,sn]=cs(V.r);V.tx=px-s*(w[0]*c-w[1]*sn);V.ty=py-s*(w[0]*sn+w[1]*c);CQ.render()}
 
/* ---------- affichage ---------- */
function layout(){
  const dpr=Math.min(2.5,window.devicePixelRatio||1),W=box.clientWidth,H=box.clientHeight;
  if(!W||!H)return;ed.width=Math.round(W*dpr);ed.height=Math.round(H*dpr);const first=!geom;geom={W,H,dpr};
  const mw=Math.min(300,Math.max(190,W*.26));mini.style.width=mw+"px";mini.style.height=mw*SC.BOX.h/SC.BOX.w+"px";mini.width=Math.round(mw*dpr);mini.height=Math.round(mw*SC.BOX.h/SC.BOX.w*dpr);
  CQ.refit(false);draw();if(first)CQ.refresh();
}
function draw(){
  raf=0;if(!geom)return;const d=geom.dpr,[c,s]=cs(V.r);
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,ed.width,ed.height);
  ctx.setTransform(d*V.s*c,d*V.s*s,-d*V.s*s,d*V.s*c,d*V.tx,d*V.ty);
  SC.render(ctx,CQ.nails,{skin:CQ.skin,sel:CQ.sel,ring:CQ.mode==="hands",px:1/V.s,selDecoIdx:CQ.tool==="deco"?CQ.decoSel:-1});
  drawMini();
}
function drawMini(){
  if(CQ.mode!=="nail"||!mini.width)return;const B=SC.BOX,k=mini.width/B.w;
  mctx.setTransform(1,0,0,1,0,0);mctx.clearRect(0,0,mini.width,mini.height);mctx.setTransform(k,0,0,k,-B.x*k,-B.y*k);
  SC.render(mctx,CQ.nails,{skin:CQ.skin,sel:CQ.sel,ring:false});
  const n=CQ.nail(),f=SC.frame(CQ.sel,n);mctx.save();mctx.translate(f.ox,f.oy);mctx.rotate(f.rad);mctx.scale(f.ki,f.ki);mctx.translate(-50,0);
  mctx.lineWidth=7/(k*f.ki);mctx.strokeStyle="#4f5a47";mctx.stroke(N.nailPath(n.shape,f.h));mctx.restore();
}
CQ.render=()=>{if(!raf)raf=requestAnimationFrame(draw)};
CQ.refresh=function(){
  CQ.render();const m=CQ.mode==="nail";mini.parentElement.hidden=!m;if(m)drawMini();
  $("#nailLabel").textContent=CQ.nailName(CQ.sel);$("#vMode").textContent=m?"Voir les deux mains":"Zoomer sur l'ongle";
  $("#vFit").hidden=!m;CQ.ui.sync&&CQ.ui.sync();
};
new ResizeObserver(layout).observe(box);
const rel=e=>{const r=ed.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
function toNail(e){const[px,py]=rel(e),[wx,wy]=s2w(px,py);return SC.toLocal(CQ.sel,CQ.nail(),wx,wy)}
const nailScale=()=>V.s*SC.G[CQ.sel].ki;
 
/* ---------- entrées : Pencil, doigts, souris ---------- */
const touches=new Map();let gest=null,tinfo=null;
function startGesture(){
  const a=[...touches.values()].slice(0,2),mx=(a[0].x+a[1].x)/2,my=(a[0].y+a[1].y)/2,r=ed.getBoundingClientRect();
  gest={d0:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)||1,a0:Math.atan2(a[1].y-a[0].y,a[1].x-a[0].x),v0:{...V},w0:s2w(mx-r.left,my-r.top,V)};T=null;
}
function cancelStroke(){
  if(!stroke)return;clearTimeout(holdT);const n=CQ.nail();n.strokes.pop();if(stroke.t==="pen")n._liveOn=false;else N.replayLayer(n);CQ.hist.pop();stroke=null;CQ.render();CQ.ui.updateUndo()
}
function magnetSet(n,x0,y0,x,y){
  const e=n.effect,h=N.nailH(n),cx=50,cy=h/2;
  if(e.style==="spot"){e.posx=Math.round(Math.max(-45,Math.min(45,x-cx)));e.pos=Math.round(Math.max(-h*.6,Math.min(h*.6,y-cy)));return}
  const dx=x-x0,dy=y-y0,len=Math.hypot(dx,dy);
  if(len>5){let r=Math.atan2(dx,-dy)*180/Math.PI;if(r>90)r-=180;if(r<-90)r+=180;e.ang=Math.round(r)}
  const rr=(e.ang||0)*Math.PI/180,nx=Math.cos(rr),ny=Math.sin(rr),mx=(x0+x)/2,my=(y0+y)/2;
  e.pos=Math.round(Math.max(-h*.7,Math.min(h*.7,(mx-cx)*nx+(my-cy)*ny)));
}
function drawStart(e,pt){
  const[x,y]=toNail(e),n=CQ.nail(),pr=pt==="pen"?Math.max(.15,e.pressure||.5):1;
  if(CQ.tool==="fill"){CQ.snapshot();n.base.c=CQ.color;CQ.addRecent(CQ.color);CQ.refresh();return}
  if(CQ.tool==="deco"){
    const sd=n.deco[CQ.decoSel],sc=nailScale();
    if(sd){const hd=D.handles(sd),tol=Math.max(5,26/sc);
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
  if(CQ.tool==="magnet"){
    CQ.snapshot();
    if(n.effect.t!=="cateye"){n.base.c=CQ.color;n.effect={t:"cateye",ang:25,w:CQ.sizes.magnet||16,pos:0,style:CQ.magStyle||"line",seed:n.effect.seed||7}}
    else if(CQ.magStyle&&!n._magKeep)n.effect.style=n.effect.style||CQ.magStyle;
    drag={magnet:true,x0:x,y0:y};magnetSet(n,x,y,x,y);CQ.refresh();return;
  }
  if(CQ.tool==="photo"){
    if(!n.photo){CQ.toast("Ajoute d'abord une photo");CQ.ui.openFor&&CQ.ui.openFor("photo");return}
    CQ.snapshot();drag={photo:true,dx:(n.photo.x||0)-x,dy:(n.photo.y||0)-y};return;
  }
  CQ.snapshot();if(CQ.tool!=="erase")CQ.addRecent(CQ.color);
  stroke={t:CQ.tool,c:CQ.color,s:CQ.sizes[CQ.tool]||3,p:[[x,y,pr]]};
  if(CQ.tool==="pen"){const b=CQ.brush;if(b.m!=="solid")stroke.m=b.m;if(b.m==="chrome"||b.m==="miroir")stroke.mk=b.mk;if(b.a<1)stroke.a=b.a}
  n.strokes.push(stroke);if(stroke.t==="pen")N.drawLive(n,stroke);else N.paintSegment(n,stroke,0);CQ.render();
}
ed.addEventListener("pointerdown",e=>{
  e.preventDefault();const pt=e.pointerType,[px,py]=rel(e);
  if(pt==="pen"){lastPen=Date.now();if(!CQ.penSeen){CQ.penSeen=true;CQ.fingerDraw=false;CQ.ui.sync()}}
  try{ed.setPointerCapture(e.pointerId)}catch(_){}
  if(pt==="touch"){
    touches.set(e.pointerId,{x:px,y:py,x0:px,y0:py});
    if(!tinfo)tinfo={t0:Date.now(),max:0,moved:0};tinfo.max=Math.max(tinfo.max,touches.size);
    if(touches.size>=2){cancelStroke();drag=null;startGesture();return}
    if(Date.now()-lastPen<900){touches.delete(e.pointerId);return}
    if(!(CQ.fingerDraw&&CQ.mode==="nail"))return; // doigt = naviguer
  }
  if(CQ.mode==="hands"){
    const[wx,wy]=s2w(px,py),i=SC.hitNail(CQ.nails,wx,wy,16/V.s);
    if(i>=0)CQ.selectNail(i);return;
  }
  if(CQ.sheetOpen&&CQ.closeSheet)CQ.closeSheet(false);
  drawStart(e,pt);
});
ed.addEventListener("pointermove",e=>{
  const pt=e.pointerType,[px,py]=rel(e);
  if(pt==="touch"&&touches.has(e.pointerId)){
    const t=touches.get(e.pointerId);const dx=px-t.x,dy=py-t.y;t.x=px;t.y=py;if(tinfo)tinfo.moved=Math.max(tinfo.moved,Math.hypot(px-t.x0,py-t.y0));
    if(touches.size>=2&&gest){
      const a=[...touches.values()].slice(0,2),mx=(a[0].x+a[1].x)/2,my=(a[0].y+a[1].y)/2;
      const s=Math.max(.15,Math.min(14,gest.v0.s*Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)/gest.d0)),r=gest.v0.r+(Math.atan2(a[1].y-a[0].y,a[1].x-a[0].x)-gest.a0),[c,sn]=cs(r),w=gest.w0;
      CQ.moved=true;V.s=s;V.r=r;V.tx=mx-s*(w[0]*c-w[1]*sn);V.ty=my-s*(w[0]*sn+w[1]*c);CQ.render();return;
    }
    if(touches.size===1&&!stroke&&!drag){if(tinfo&&tinfo.moved>6){CQ.moved=true;T=null;V.tx+=dx;V.ty+=dy;CQ.render()}return}
  }
  if(drag&&drag.magnet){const[x,y]=toNail(e);magnetSet(CQ.nail(),drag.x0,drag.y0,x,y);CQ.render();return}
  if(drag&&drag.handle){
    const[x,y]=toNail(e),d=CQ.nail().deco[CQ.decoSel];if(!d)return;const ddx=x-d.x,ddy=y-d.y,dist=Math.hypot(ddx,ddy),ang=Math.atan2(ddy,ddx)*180/Math.PI,k=d.k==="chaine"?1.9:1.5;
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
    if(stroke.snap){stroke.p[1]=[x,y,pr];return}
    if(Math.hypot(x-l[0],y-l[1])<.5/Math.max(.3,nailScale()/3))return;stroke.p.push([x,y,pr]);if(stroke.t!=="pen")N.paintSegment(n,stroke,stroke.p.length-1);
    if(stroke.t==="erase")n.strokes=n.strokes.filter(o=>o.t!=="relief"||!o.p.some(q=>Math.hypot(q[0]-x,q[1]-y)<=o.s*.9+stroke.s*.7));
  });
  if(stroke.t==="pen"){
    N.drawLive(n,stroke);
    clearTimeout(holdT);if(!stroke.snap)holdT=setTimeout(()=>{if(stroke&&stroke.t==="pen"&&stroke.p.length>4){stroke.p=[stroke.p[0],stroke.p[stroke.p.length-1]];stroke.snap=true;N.drawLive(CQ.nail(),stroke);CQ.render()}},520);
  }
  CQ.render();
});
function endPointer(e){
  const pt=e.pointerType;
  if(pt==="touch"&&touches.has(e.pointerId)){
    touches.delete(e.pointerId);
    if(touches.size<2)gest=null;
    if(touches.size===0&&tinfo){
      const q=tinfo;tinfo=null;
      if(Date.now()-q.t0<300&&q.moved<12){
        if(q.max===2){CQ.undo();CQ.toast("Annulé")}
        else if(q.max===3){CQ.redoOp();CQ.toast("Rétabli")}
        else if(q.max===1&&CQ.mode==="hands"){const[px,py]=rel(e),[wx,wy]=s2w(px,py),i=SC.hitNail(CQ.nails,wx,wy,22/V.s);if(i>=0)CQ.selectNail(i)}
      }
    }
  }
  clearTimeout(holdT);
  if(stroke){stroke.p=stroke.p.map(q=>[+q[0].toFixed(1),+q[1].toFixed(1),+(q[2]).toFixed(2)]);if(stroke.t==="pen")N.commitLive(CQ.nail(),stroke);stroke=null;CQ.render();CQ.refresh()}
  if(drag){drag=null;CQ.refresh()}
}
ed.addEventListener("pointerup",endPointer);ed.addEventListener("pointercancel",endPointer);
ed.addEventListener("contextmenu",e=>e.preventDefault());
ed.addEventListener("wheel",e=>{e.preventDefault();const[px,py]=rel(e);zoomAt(px,py,Math.exp(-e.deltaY*(e.ctrlKey?.01:.0016)))},{passive:false});
 
/* boutons de vue + mini-mains */
$("#vMode").onclick=()=>CQ.setMode(CQ.mode==="hands"?"nail":"hands");
$("#vFit").onclick=()=>CQ.refit(true);
$("#vPrev").onclick=()=>CQ.stepNail(-1);$("#vNext").onclick=()=>CQ.stepNail(1);
mini.addEventListener("pointerdown",e=>{
  e.preventDefault();const r=mini.getBoundingClientRect(),x=SC.BOX.x+(e.clientX-r.left)/r.width*SC.BOX.w,y=SC.BOX.y+(e.clientY-r.top)/r.height*SC.BOX.h;
  let best=-1,bd=1e9;for(let i=0;i<10;i++){const n=CQ.nails[i],c=SC.toWorld(i,n,50,N.nailH(n)*.5),d=Math.hypot(c[0]-x,c[1]-y);if(d<bd){bd=d;best=i}}
  if(best>=0&&bd<110)CQ.selectNail(best);
});
 
/* ---------- compat. : vignettes pour la fiche ---------- */
function drawCell(c,n,fi,x,y,k){
  const s=N.FINGERS[fi%5].w*.9,h=N.nailH(n);
  c.save();c.translate(x,y);c.scale(k,k);c.translate(14+(100*(1-s))/2,210-h*s);c.scale(s,s);N.renderNail(c,n,{finger:true,skin:CQ.skin});c.restore();
}
CQ.drawCell=drawCell;CQ.renderThumbs=()=>CQ.refresh();CQ.markSel=()=>{};
 
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
  opt=opt||{};const W=w||1500,k=W/1500,hasInspo=!opt.outline&&CQ.inspo.length>0,SK=1440/SC.BOX.w,sceneH=SC.BOX.h*SK,H=opt.outline?160+sceneH:2600;
  const c=document.createElement("canvas");c.width=W;c.height=Math.round(H*k);const x=c.getContext("2d");
  x.fillStyle=opt.outline?"#ffffff":"#f7f3ec";x.fillRect(0,0,c.width,c.height);x.scale(k,k);x.textAlign="left";
  const title=CQ.meta.name||(CQ.getTitle&&CQ.getTitle())||"Croquis";
  x.fillStyle="#292824";x.font="500 34px 'Playfair Display',Georgia,serif";x.fillText(opt.outline?"Modèle — "+title:title,60,62);
  let top=100;
  if(!opt.outline){
    x.font="500 20px 'DM Sans',sans-serif";x.fillStyle="#77746d";
    const det=[CQ.meta.time&&"Durée : "+CQ.meta.time,CQ.meta.price&&"Prix : "+CQ.meta.price].filter(Boolean).join("      ");if(det){x.fillText(det,60,96);top=130}
  }
  x.save();x.translate(30,top);x.scale(SK,SK);x.translate(-SC.BOX.x,-SC.BOX.y);SC.render(x,CQ.nails,{skin:CQ.skin,outline:!!opt.outline,sel:-1});x.restore();
  if(opt.outline){const o=document.createElement("canvas");o.width=W;o.height=Math.round((top+sceneH+30)*k);o.getContext("2d").drawImage(c,0,0);return o}
  let y=top+sceneH+20;
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
CQ.init=function(){layout();CQ.mode="hands";CQ.refit(false);CQ.refresh()};
})();
 

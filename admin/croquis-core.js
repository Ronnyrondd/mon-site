(function(){
const S=4; // résolution du calque de traits (pixels par unité)
const LENGTHS={court:100,moyen:135,long:175,xl:215};
const SHAPES=[["carre","Carré"],["squoval","Carré arrondi"],["rond","Rond"],["ovale","Ovale"],["amande","Amande"],["ballerine","Ballerine"],["stiletto","Stiletto"]];
const LENGTH_LIST=[["court","Court"],["moyen","Moyen"],["long","Long"],["xl","Extra long"]];
const FINGERS=[
  {id:"thumb",name:"Pouce",w:1.12,h:.92},{id:"index",name:"Index",w:1,h:1},{id:"middle",name:"Majeur",w:1.04,h:1.04},
  {id:"ring",name:"Annulaire",w:.98,h:1},{id:"pinky",name:"Auriculaire",w:.84,h:.86}
];
const METALS={
  argent:{n:"Argent",s:["#fdfdfd","#cfd3d8","#8f959c","#e9ecef","#b9bec4"]},
  or:{n:"Or",s:["#fff3c4","#e9c46a","#a8791f","#f6df9a","#c8963a"]},
  rose:{n:"Rose gold",s:["#ffe3dd","#e8b4a6","#a4655a","#f6cfc4","#c88b7e"]},
  cuivre:{n:"Cuivre",s:["#ffd9b0","#d08a4f","#7a4320","#e8b784","#a8622f"]},
  bleu:{n:"Chrome bleu",s:["#e8f4ff","#7fb2e8","#2b4f8f","#b3d4f5","#4a76b8"]},
  violet:{n:"Chrome violet",s:["#f5e8ff","#b891e0","#5a3c8f","#d9c3f2","#8a62b8"]},
  holo:{n:"Holographique",s:["#ffd6f2","#b8f0ff","#d7c2ff","#fff3b8","#c2ffd9"]},
  noir:{n:"Noir",s:["#6b6b6b","#2b2b2b","#0b0b0b","#454545","#1b1b1b"]}
};
const EFFECTS=[["none","Aucun"],["ombre","Ombré"],["babyboomer","Baby boomer"],["chrome","Chrome"],["miroir","Miroir"],["foil","Feuille métal"],["glitter","Paillettes"],["cateye","Œil de chat"],["velours","Velours"],["sucre","Effet sucre"],["aurora","Aurore"]];

function rng(seed){let a=seed>>>0||1;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hex2rgb(h){h=h.replace("#","");if(h.length===3)h=h.split("").map(x=>x+x).join("");const n=parseInt(h,16);return[n>>16&255,n>>8&255,n&255]}
function rgba(h,a){const[r,g,b]=hex2rgb(h);return`rgba(${r},${g},${b},${a})`}
function mix(h1,h2,t){const a=hex2rgb(h1),b=hex2rgb(h2);return"#"+a.map((v,i)=>Math.round(v+(b[i]-v)*t).toString(16).padStart(2,"0")).join("")}
const light=(h,t)=>mix(h,"#ffffff",t),dark=(h,t)=>mix(h,"#000000",t);

function defaultNail(){return{shape:"amande",len:"moyen",base:{c:"#f1d3cb"},effect:{t:"none",c1:"#f6e3dc",c2:"#fffaf6",dir:"v",m:"argent",k:.6,ang:25,seed:7},french:{on:false,c:"#ffffff",depth:.45,style:"curve"},gloss:"brillant",strokes:[],deco:[]}}
function nailH(n){return LENGTHS[n.len]||150}

function nailPath(shape,h){
  const b=h-28,bot=`M0 ${b} C0 ${h-8} 22 ${h} 50 ${h} C78 ${h} 100 ${h-8} 100 ${b}`,f=x=>(h*x).toFixed(2);
  const top={
    carre:"L100 5 Q100 0 95 0 L5 0 Q0 0 0 5 Z",
    squoval:"L100 24 Q100 0 76 0 L24 0 Q0 0 0 24 Z",
    rond:`L100 ${f(.3)} C100 ${f(.08)} 76 0 50 0 C24 0 0 ${f(.08)} 0 ${f(.3)} Z`,
    ovale:`L100 ${f(.45)} C100 ${f(.12)} 78 0 50 0 C22 0 0 ${f(.12)} 0 ${f(.45)} Z`,
    amande:(()=>{const t=Math.max(0,Math.min(1,(h-100)/70)),L=(u,v)=>u+(v-u)*t,
      yS=L(.45,.5),y1=L(.2,.3),x2=L(88,83),y2=L(.03,.12),x3=L(72,63),y3=L(.004,.035),x4=L(63,57),y4=L(0,.012),x5=L(56,54),F=v=>(h*v).toFixed(2);
      return `L100 ${F(yS)} C100 ${F(y1)} ${x2} ${F(y2)} ${x3} ${F(y3)} C${x4} ${F(y4)} ${x5} 0 50 0 C${100-x5} 0 ${100-x4} ${F(y4)} ${100-x3} ${F(y3)} C${100-x2} ${F(y2)} 0 ${F(y1)} 0 ${F(yS)} Z`})(),
    ballerine:`L100 ${f(.55)} L80 6 Q78 0 72 0 L28 0 Q22 0 20 6 L0 ${f(.55)} Z`,
    stiletto:`L100 ${f(.4)} C95 ${f(.25)} 67 ${f(.1)} 50.7 0 L49.3 0 C33 ${f(.1)} 5 ${f(.25)} 0 ${f(.4)} Z`
  }[shape]||"Z";
  return new Path2D(bot+" "+top);
}

/* ---------- calque de traits (mémorisé, rejoué si besoin) ---------- */
function ensureLayer(n){
  const h=nailH(n);
  if(!n._layer||n._lh!==h){
    const c=document.createElement("canvas");c.width=100*S;c.height=Math.round(h*S);n._layer=c;n._lh=h;
    n._painted=0;replayLayer(n);
  }
  return n._layer;
}
function strokePath(ctx,p){ctx.beginPath();ctx.moveTo(p[0][0],p[0][1]);for(let i=1;i<p.length-1;i++){const mx=(p[i][0]+p[i+1][0])/2,my=(p[i][1]+p[i+1][1])/2;ctx.quadraticCurveTo(p[i][0],p[i][1],mx,my)}const l=p[p.length-1];ctx.lineTo(l[0],l[1])}
let _tile=null;
function glitterPattern(ctx,c){
  if(!_tile){_tile=document.createElement("canvas");_tile.width=_tile.height=48;const x=_tile.getContext("2d"),R=rng(77);for(let i=0;i<120;i++){x.fillStyle=`rgba(255,255,255,${.5+R()*.5})`;x.fillRect(R()*48,R()*48,1+R()*2,1+R()*2)}}
  const pt=ctx.createPattern(_tile,"repeat");if(pt.setTransform)pt.setTransform(new DOMMatrix().scale(.22));return pt;
}
function drawStroke(ctx,st,h){
  const p=st.p;if(!p||!p.length)return;const a=st.a==null?1:st.a,m=st.m||"solid",c=st.c;
  const avg=p.reduce((t,q)=>t+(q[2]==null?1:q[2]),0)/p.length,w=st.s*(.35+.65*avg);
  ctx.save();ctx.lineCap=ctx.lineJoin="round";ctx.globalAlpha=a;
  const one=(width,style)=>{ctx.lineWidth=width;ctx.strokeStyle=ctx.fillStyle=style;
    if(p.length===1){ctx.beginPath();ctx.arc(p[0][0],p[0][1],width/2,0,7);ctx.fill()}else{strokePath(ctx,p);ctx.stroke()}};
  if(m==="cateye"){one(w,dark(c,.4));one(w*.62,c);one(w*.2,light(c,.88))}
  else if(m==="chrome"||m==="miroir"){one(w,metalGrad(ctx,h,st.mk,m==="miroir"?20:35));ctx.globalAlpha=a*(m==="miroir"?.5:.3);one(w*.35,"#ffffff")}
  else if(m==="holo"){const g=ctx.createLinearGradient(0,0,100,h);["#ff9ad5","#9be7ff","#c3a6ff","#fff1a6","#a6ffd0"].forEach((s0,i)=>g.addColorStop(i/4,s0));one(w,g)}
  else if(m==="glitter"){one(w,rgba(c,.85));one(w,glitterPattern(ctx,c))}
  else if(a>=1&&p.length>1){ // trait uni avec pression
    ctx.strokeStyle=ctx.fillStyle=c;for(let i=0;i<p.length;i++){const q=p[i],b=p[i-1]||q,ww=st.s*(.35+.65*(q[2]==null?1:q[2]));ctx.lineWidth=ww;if(i===0){ctx.beginPath();ctx.arc(q[0],q[1],ww/2,0,7);ctx.fill()}else{ctx.beginPath();ctx.moveTo(b[0],b[1]);ctx.lineTo(q[0],q[1]);ctx.stroke()}}
  }else one(w,c);
  ctx.restore();
}
function drawLive(n,st){
  const h=nailH(n);if(!n._live||n._live.height!==Math.round(h*S)){n._live=document.createElement("canvas");n._live.width=100*S;n._live.height=Math.round(h*S)}
  const c=n._live.getContext("2d");c.clearRect(0,0,n._live.width,n._live.height);c.save();c.scale(S,S);drawStroke(c,st,h);c.restore();n._liveOn=true;
}
function commitLive(n,st){
  const L=ensureLayer(n),c=L.getContext("2d");c.save();c.scale(S,S);drawStroke(c,st,nailH(n));c.restore();n._liveOn=false;
}
function replayLayer(n){
  const L=n._layer;if(!L)return;L.getContext("2d").clearRect(0,0,L.width,L.height);
  const L2=L.getContext("2d");n.strokes.forEach(st=>{if(st.t==="pen"){L2.save();L2.scale(S,S);drawStroke(L2,st,nailH(n));L2.restore()}else for(let i=0;i<st.p.length;i++)paintSegment(n,st,i)});
}
function paintSegment(n,st,i){
  if(st.t==="relief"||st.t==="pen")return;
  const L=ensureLayer(n),c=L.getContext("2d"),p=st.p,a=p[i],b=p[i-1]||a,pr=a[2]==null?1:a[2];
  c.save();c.scale(S,S);
  if(st.t==="air"){
    const d=Math.hypot(a[0]-b[0],a[1]-b[1]),step=Math.max(.6,st.s*.25),k=Math.max(1,Math.ceil(d/step)),r=st.s*1.8;
    for(let j=1;j<=k;j++){
      const x=b[0]+(a[0]-b[0])*j/k,y=b[1]+(a[1]-b[1])*j/k,g=c.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,rgba(st.c,.16*(.5+pr/2)));g.addColorStop(1,rgba(st.c,0));c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
    }
  }else{
    const er=st.t==="erase";c.globalCompositeOperation=er?"destination-out":"source-over";
    c.lineCap=c.lineJoin="round";c.strokeStyle=c.fillStyle=st.c;
    const w=er?st.s*1.5:st.s*(.35+.65*pr);c.lineWidth=w;
    if(i===0){c.beginPath();c.arc(a[0],a[1],w/2,0,7);c.fill()}
    else{c.beginPath();c.moveTo(b[0],b[1]);c.lineTo(a[0],a[1]);c.stroke()}
  }
  c.restore();
}

/* ---------- fonds et effets ---------- */
function metalGrad(ctx,h,key,ang){
  const m=(METALS[key]||METALS.argent).s,r=(ang||35)*Math.PI/180,dx=Math.cos(r)*70,dy=Math.sin(r)*h*.45+h*.2;
  const g=ctx.createLinearGradient(50-dx,h/2-dy,50+dx,h/2+dy);
  [0,.22,.42,.58,.8,1].forEach((o,i)=>g.addColorStop(o,m[[0,1,2,3,4,1][i]]));return g;
}
function drawBase(ctx,n,h){
  const e=n.effect||{t:"none"},c=n.base.c;
  ctx.fillStyle=c;ctx.fillRect(-10,-10,120,h+20);
  if(e.t==="ombre"||e.t==="babyboomer"){
    const v=e.dir||"v",g=v==="h"?ctx.createLinearGradient(0,0,100,0):v==="vi"?ctx.createLinearGradient(0,0,0,h):ctx.createLinearGradient(0,h,0,0);
    g.addColorStop(0,e.c1);g.addColorStop(.5,mix(e.c1,e.c2,.5));g.addColorStop(1,e.c2);ctx.fillStyle=g;ctx.fillRect(-10,-10,120,h+20);
  }else if(e.t==="chrome"||e.t==="miroir"){
    ctx.fillStyle=metalGrad(ctx,h,e.m,e.t==="miroir"?20:35);ctx.fillRect(-10,-10,120,h+20);
    const hl=ctx.createRadialGradient(32,h*.32,0,32,h*.32,h*.5);hl.addColorStop(0,`rgba(255,255,255,${e.t==="miroir"?.85:.55})`);hl.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=hl;ctx.fillRect(-10,-10,120,h+20);
    if(e.m==="holo"){const g=ctx.createLinearGradient(0,0,100,h);["#ff9ad5","#9be7ff","#c3a6ff","#fff1a6","#a6ffd0"].forEach((s,i)=>g.addColorStop(i/4,rgba(s,.55)));ctx.fillStyle=g;ctx.fillRect(-10,-10,120,h+20)}
    if(e.c1&&e.k>0){ctx.globalAlpha=e.k*.25;ctx.fillStyle=e.c1;ctx.fillRect(-10,-10,120,h+20);ctx.globalAlpha=1}
  }else if(e.t==="cateye"){
    const bandC=e.c1||light(c,.82),w=Math.max(3,e.w??16),pos=e.pos||0,st=e.style||"line";
    ctx.fillStyle=dark(c,.32);ctx.fillRect(-10,-10,120,h+20);
    const stops=(g,t,half,col)=>{const a=Math.max(0,t-half*1.9),m0=Math.max(0,t-half*.5),m1=Math.min(1,t+half*.5),b2=Math.min(1,t+half*1.9);g.addColorStop(a,rgba(col,0));g.addColorStop(m0,rgba(col,.35));g.addColorStop((t),rgba(col,.97));g.addColorStop(m1,rgba(col,.35));g.addColorStop(b2,rgba(col,0))};
    if(st==="curve"){
      const r=(e.ang||25)*Math.PI/180,cx=50-Math.sin(r)*h*.9,cy=h*1.25+Math.cos(r)*h*.15+pos,R0=h*.62;
      const g=ctx.createRadialGradient(cx,cy,0,cx,cy,R0+w*2.4),t=R0/(R0+w*2.4),half=w/(R0+w*2.4);
      g.addColorStop(0,rgba(dark(c,.1),.0));g.addColorStop(Math.max(0,t-half*3),rgba(c,.5));stops(g,t,half,bandC);g.addColorStop(1,rgba(dark(c,.5),.55));
      ctx.fillStyle=g;ctx.fillRect(-10,-10,120,h+20);
    }else{
      const r=(e.ang||25)*Math.PI/180,nx=Math.cos(r),ny=Math.sin(r),L=70;
      const mkb=(off,col,hw)=>{const g=ctx.createLinearGradient(50+nx*(off-L),h*.5+ny*(off-L),50+nx*(off+L),h*.5+ny*(off+L));const half=hw/(2*L);stops(g,.5,half,col);ctx.fillStyle=g;ctx.fillRect(-10,-10,120,h+20)};
      const sh=ctx.createLinearGradient(50-nx*L,h*.5-ny*L,50+nx*L,h*.5+ny*L);sh.addColorStop(0,rgba(c,.0));sh.addColorStop(1,rgba("#000000",.28));ctx.fillStyle=sh;ctx.fillRect(-10,-10,120,h+20);
      if(st==="spot"){const px=50+(e.posx||0),py=h*.5+pos,R=Math.max(10,w*2.6),g=ctx.createRadialGradient(px,py,0,px,py,R);g.addColorStop(0,rgba(bandC,.98));g.addColorStop(.3,rgba(bandC,.6));g.addColorStop(1,rgba(bandC,0));ctx.fillStyle=g;ctx.fillRect(-10,-10,120,h+20)}
      else if(st==="wide"){mkb(pos,bandC,w*2.2)}
      else if(st==="double"){mkb(pos-w*1.1,bandC,w*.9);mkb(pos+w*1.1,bandC,w*.9)}
      else mkb(pos,bandC,w);
    }
  }else if(e.t==="velours"||e.t==="sucre"){
    const R=rng(e.seed||11),sug=e.t==="sucre",N0=sug?1500:1100;
    for(let i=0;i<N0;i++){const x=R()*100,y=R()*h,s0=sug?.5+R()*.7:.5+R()*.5;ctx.fillStyle=R()>.5?rgba("#ffffff",sug?.55:.16):rgba("#000000",sug?.22:.1);ctx.beginPath();ctx.arc(x,y,s0,0,7);ctx.fill()}
  }else if(e.t==="aurora"){
    const R=rng(e.seed||3);[["#ff9ad5",.5],["#9be7ff",.5],["#c3a6ff",.5],["#fff1a6",.3]].forEach(([col,al])=>{
      const x=R()*100,y=R()*h,r=45+R()*40,g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(col,al*(e.k??.6)));g.addColorStop(1,rgba(col,0));ctx.fillStyle=g;ctx.fillRect(-10,-10,120,h+20)});
  }else if(e.t==="foil"){
    const R=rng(e.seed||5),m=(METALS[e.m]||METALS.or).s,N=Math.round(6+(e.k??.6)*18);
    for(let i=0;i<N;i++){
      const cx=R()*100,cy=R()*h,r=8+R()*18,pts=7+Math.floor(R()*3);ctx.beginPath();
      for(let j=0;j<pts;j++){const t=j/pts*6.283,rr=r*(.55+R()*.6);ctx[j?"lineTo":"moveTo"](cx+Math.cos(t)*rr,cy+Math.sin(t)*rr*.8)}
      ctx.closePath();const g=ctx.createLinearGradient(cx-r,cy-r,cx+r,cy+r);m.forEach((s,k)=>g.addColorStop(k/(m.length-1),s));ctx.fillStyle=g;ctx.fill();
    }
  }else if(e.t==="glitter"){
    const R=rng(e.seed||9),N=Math.round(120+(e.k??.6)*520),cols=[e.c1||"#ffffff",e.c2||"#ffe9a8","#ffffff"];
    for(let i=0;i<N;i++){const x=R()*100,y=R()*h,s=.5+R()*1.4;ctx.fillStyle=rgba(cols[i%3],.5+R()*.5);ctx.save();ctx.translate(x,y);ctx.rotate(R()*3);ctx.fillRect(-s/2,-s/2,s,s);ctx.restore()}
  }
}
function ensureImg(n){
  if(!n.photo)return null;
  if(n._imgSrc!==n.photo.src){n._imgSrc=n.photo.src;const im=new Image();im.onload=()=>{n._img=im;if(window.NailArt&&NailArt.onImg)NailArt.onImg()};im.src=n.photo.src;n._img=null}
  return n._img&&n._img.complete&&n._img.naturalWidth?n._img:null;
}
function drawPhoto(ctx,n,h){
  const im=ensureImg(n);if(!im)return;const p=n.photo,cover=Math.max(100/im.naturalWidth,h/im.naturalHeight)*(p.s||1);
  ctx.save();ctx.globalAlpha=p.a==null?1:p.a;ctx.translate(50+(p.x||0),h/2+(p.y||0));ctx.rotate((p.rot||0)*Math.PI/180);
  ctx.drawImage(im,-im.naturalWidth*cover/2,-im.naturalHeight*cover/2,im.naturalWidth*cover,im.naturalHeight*cover);ctx.restore();
}
function drawRelief(ctx,n){
  (n.strokes||[]).forEach(st=>{
    if(st.t!=="relief"||!st.p.length)return;
    const pass=(dx,dy,w,col)=>{ctx.save();ctx.translate(dx,dy);ctx.lineCap=ctx.lineJoin="round";ctx.strokeStyle=ctx.fillStyle=col;ctx.lineWidth=w;
      if(st.p.length===1){ctx.beginPath();ctx.arc(st.p[0][0],st.p[0][1],w/2,0,7);ctx.fill()}
      else{ctx.beginPath();st.p.forEach((q,i)=>ctx[i?"lineTo":"moveTo"](q[0],q[1]));ctx.stroke()}ctx.restore()};
    pass(.9,1.4,st.s*1.05,"rgba(0,0,0,.30)");pass(0,0,st.s,st.c);pass(-.5,-.7,st.s*.55,rgba(light(st.c,.6),.85));pass(-.9,-1.1,st.s*.18,"rgba(255,255,255,.9)");
  });
}
function drawFrench(ctx,n,h){
  const f=n.french;if(!f||!f.on)return;const d=Math.max(6,h*.35*f.depth*1.4);
  ctx.beginPath();ctx.moveTo(-10,-10);ctx.lineTo(110,-10);
  if(f.style==="straight"){ctx.lineTo(110,d);ctx.lineTo(-10,d)}
  else if(f.style==="v"){ctx.lineTo(110,d*.45);ctx.lineTo(50,d*1.4);ctx.lineTo(-10,d*.45)}
  else{ctx.lineTo(110,d*.5);ctx.quadraticCurveTo(50,d*1.5,-10,d*.5)}
  ctx.closePath();ctx.fillStyle=f.c;ctx.fill();
}
function drawGloss(ctx,n,h,path){
  if(n.gloss==="mat"||(n.effect&&n.effect.t==="velours")){ctx.fillStyle="rgba(238,232,226,.13)";ctx.fillRect(-10,-10,120,h+20);const sg=ctx.createRadialGradient(40,h*.3,0,40,h*.3,h*.7);sg.addColorStop(0,"rgba(255,255,255,.07)");sg.addColorStop(1,"rgba(255,255,255,0)");ctx.fillStyle=sg;ctx.fillRect(-10,-10,120,h+20)}
  else{
    const g=ctx.createLinearGradient(0,0,100,h*.7);g.addColorStop(0,"rgba(255,255,255,.34)");g.addColorStop(.45,"rgba(255,255,255,.06)");g.addColorStop(1,"rgba(255,255,255,0)");ctx.fillStyle=g;ctx.fillRect(-10,-10,120,h+20);
    ctx.save();ctx.translate(30,h*.38);ctx.rotate(.14);ctx.beginPath();ctx.ellipse(0,0,7,h*.2,0,0,7);ctx.fillStyle="rgba(255,255,255,.26)";ctx.fill();ctx.restore();
  }
  ctx.lineWidth=3;ctx.strokeStyle="rgba(60,30,20,.16)";ctx.stroke(path);
}

/* ---------- rendu complet d'un ongle ---------- */
function renderNail(ctx,n,o){
  o=o||{};const h=nailH(n),path=nailPath(n.shape,h);
  if(o.outline){
    const tipY=h-118;ctx.save();ctx.lineJoin="round";ctx.lineWidth=1.3;ctx.strokeStyle="#292824";
    ctx.beginPath();ctx.moveTo(-14,h+40);ctx.lineTo(-14,tipY+62);ctx.arc(50,tipY+62,64,Math.PI,0);ctx.lineTo(114,h+40);ctx.stroke();
    ctx.fillStyle="#ffffff";ctx.fill(path);ctx.lineWidth=1.8;ctx.stroke(path);ctx.restore();return;
  }
  if(o.finger){
    const tipY=h-118,sk=o.skin||"#f0cfc0",g=ctx.createLinearGradient(0,tipY,0,h+40);g.addColorStop(0,light(sk,.12));g.addColorStop(1,dark(sk,.06));
    ctx.save();ctx.beginPath();ctx.moveTo(-14,h+40);ctx.lineTo(-14,tipY+62);ctx.arc(50,tipY+62,64,Math.PI,0);ctx.lineTo(114,h+40);ctx.closePath();ctx.fillStyle=g;ctx.fill();ctx.restore();
  }
  ctx.save();ctx.clip(path);
  drawBase(ctx,n,h);drawPhoto(ctx,n,h);drawFrench(ctx,n,h);
  const L=ensureLayer(n);ctx.drawImage(L,0,0,100,h);if(n._liveOn&&n._live)ctx.drawImage(n._live,0,0,100,h);
  drawGloss(ctx,n,h,path);drawRelief(ctx,n);
  ctx.restore();
  if(window.NailDeco)(n.deco||[]).forEach((d,i)=>window.NailDeco.draw(ctx,d,o.selDeco===i));
}
function clone(n){const c=JSON.parse(JSON.stringify(n,(k,v)=>k[0]==="_"?undefined:v));return c}
window.NailArt={S,LENGTHS,SHAPES,LENGTH_LIST,FINGERS,METALS,EFFECTS,defaultNail,nailH,nailPath,ensureLayer,replayLayer,paintSegment,drawStroke,drawLive,commitLive,renderNail,clone,rgba,mix,light,dark,rng};
})();

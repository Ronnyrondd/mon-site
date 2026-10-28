(function(){
const A=()=>window.NailArt;
const LIST=[
  ["gem_rond","Strass rond"],["gem_goutte","Goutte"],["gem_navette","Navette"],["gem_carre","Carré"],["gem_coeur","Cœur"],["gem_etoile","Étoile strass"],["gem_croix","Croix strass"],["croix","Croix métal"],["etoile4","Étincelle"],["coeur","Cœur métal"],
  ["perle","Perle"],["boule","Boule métal"],["marguerite","Marguerite"],["sakura","Fleur sakura"],["feuille","Feuille"],["branche","Branche"],
  ["papillon","Papillon"],["lune","Lune"],["etoile","Étoile métal"],["noeud","Nœud"],["flocon","Flocon"],["anneau","Anneau"],["chaine","Chaîne"]
];
const FINISHES=[["cristal","Cristal"],["ab","Aurore boréale"],["or","Or"],["argent","Argent"],["rose","Rose gold"],["noir","Noir"],["couleur","Couleur choisie"]];
const DEFAULTS={croix:{f:"or"},etoile4:{f:"or"},coeur:{f:"or"},feuille:{f:"couleur",c:"#5f8f4e"},branche:{f:"couleur",c:"#5f8f4e"},marguerite:{f:"couleur",c:"#ffffff"},sakura:{f:"couleur",c:"#f6b8cb"},papillon:{f:"couleur",c:"#9ec8ff"},noeud:{f:"couleur",c:"#f6b8cb"},flocon:{f:"couleur",c:"#ffffff"},
  boule:{f:"or"},lune:{f:"or"},etoile:{f:"or"},anneau:{f:"or"},chaine:{f:"or"}};
function pal(f,c){
  const N=A();
  switch(f){
    case"cristal":return{l:"#ffffff",m:"#dfeaff",d:"#8fa8d0"};
    case"ab":return{l:"#fff0fb",m:"#bfe3ff",d:"#9a7fd0"};
    case"or":return{l:"#fff3c4",m:"#e9c46a",d:"#a8791f"};
    case"argent":return{l:"#fdfdfd",m:"#cfd3d8",d:"#8f959c"};
    case"rose":return{l:"#ffe3dd",m:"#e8b4a6",d:"#a4655a"};
    case"noir":return{l:"#8a8a8a",m:"#2b2b2b",d:"#0b0b0b"};
    default:return{l:N.light(c||"#ff7aa8",.6),m:c||"#ff7aa8",d:N.dark(c||"#ff7aa8",.4)};
  }
}
function star(n,ro,ri){let s="";for(let i=0;i<n*2;i++){const a=-Math.PI/2+i*Math.PI/n,r=i%2?ri:ro;s+=(i?"L":"M")+(Math.cos(a)*r).toFixed(3)+" "+(Math.sin(a)*r).toFixed(3)}return new Path2D(s+"Z")}
const GEMS={
  gem_rond:()=>{const p=new Path2D();p.arc(0,0,1,0,7);return p},
  gem_goutte:()=>new Path2D("M0 -1.35 C.95 -.2 .95 .95 0 1 C-.95 .95 -.95 -.2 0 -1.35Z"),
  gem_navette:()=>new Path2D("M0 -1.5 C1.05 -.6 1.05 .6 0 1.5 C-1.05 .6 -1.05 -.6 0 -1.5Z"),
  gem_carre:()=>new Path2D("M-.8 -.95 Q-.95 -.95 -.95 -.8 L-.95 .8 Q-.95 .95 -.8 .95 L.8 .95 Q.95 .95 .95 .8 L.95 -.8 Q.95 -.95 .8 -.95Z"),
  gem_coeur:()=>new Path2D("M0 .95 C-1.3 -.1 -.95 -1 -.4 -.95 C-.1 -.92 0 -.6 0 -.5 C0 -.6 .1 -.92 .4 -.95 C.95 -1 1.3 -.1 0 .95Z"),
  gem_etoile:()=>star(5,1.15,.5),
  gem_croix:()=>new Path2D("M-.3 -1.25 L.3 -1.25 L.3 -.4 L1 -.4 L1 .2 L.3 .2 L.3 1.2 L-.3 1.2 L-.3 .2 L-1 .2 L-1 -.4 L-.3 -.4Z")
};
const FLAT={
  croix:()=>new Path2D("M-.28 -1.25 L.28 -1.25 L.28 -.45 L1 -.45 L1 .12 L.28 .12 L.28 1.2 L-.28 1.2 L-.28 .12 L-1 .12 L-1 -.45 L-.28 -.45Z"),
  etoile4:()=>new Path2D("M0 -1.35 Q.14 -.14 1.35 0 Q.14 .14 0 1.35 Q-.14 .14 -1.35 0 Q-.14 -.14 0 -1.35Z"),
  coeur:()=>new Path2D("M0 .95 C-1.3 -.1 -.95 -1 -.4 -.95 C-.1 -.92 0 -.6 0 -.5 C0 -.6 .1 -.92 .4 -.95 C.95 -1 1.3 -.1 0 .95Z")
};
function glint(ctx,x,y,s){ctx.fillStyle="rgba(255,255,255,.95)";ctx.beginPath();ctx.moveTo(x,y-s);ctx.quadraticCurveTo(x,y,x+s,y);ctx.quadraticCurveTo(x,y,x,y+s);ctx.quadraticCurveTo(x,y,x-s,y);ctx.quadraticCurveTo(x,y,x,y-s);ctx.fill()}
function lin(ctx,P,x0,y0,x1,y1){const g=ctx.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,P.l);g.addColorStop(.5,P.m);g.addColorStop(1,P.d);return g}
function drawGem(ctx,id,P,f){
  const p=GEMS[id]();ctx.save();ctx.translate(.06,.12);ctx.fillStyle="rgba(0,0,0,.2)";ctx.fill(p);ctx.restore();
  ctx.fillStyle=lin(ctx,P,-1,-1,1,1);ctx.fill(p);
  if(f==="ab"){const g=ctx.createLinearGradient(-1,1,1,-1);g.addColorStop(0,"rgba(255,140,210,.55)");g.addColorStop(.5,"rgba(120,220,255,.45)");g.addColorStop(1,"rgba(200,170,255,.55)");ctx.fillStyle=g;ctx.fill(p)}
  ctx.lineWidth=.07;ctx.strokeStyle=P.d;ctx.stroke(p);
  ctx.save();ctx.scale(.55,.55);ctx.fillStyle="rgba(255,255,255,.38)";ctx.fill(p);ctx.restore();
  ctx.strokeStyle="rgba(255,255,255,.55)";ctx.lineWidth=.05;
  if(id==="gem_rond"||id==="gem_carre"||id==="gem_navette"||id==="gem_goutte"){ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*.95,Math.sin(a)*.95)}ctx.stroke()}
  glint(ctx,-.38,-.38,.32);
}
function leaf(ctx,P,x,y,rot,s){
  ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(s,s);const p=new Path2D("M0 -1.2 C.65 -.6 .65 .6 0 1.2 C-.65 .6 -.65 -.6 0 -1.2Z");
  ctx.fillStyle=lin(ctx,P,-.6,0,.6,0);ctx.fill(p);ctx.lineWidth=.06;ctx.strokeStyle=P.d;ctx.stroke(p);
  ctx.beginPath();ctx.moveTo(0,-1.1);ctx.lineTo(0,1.1);ctx.strokeStyle="rgba(255,255,255,.4)";ctx.stroke();ctx.restore();
}
function drawItem(ctx,d){
  const id=d.k,def=DEFAULTS[id]||{},f=d.f||def.f||"cristal",c=d.c||def.c,P=pal(f,c);
  if(GEMS[id]){drawGem(ctx,id,P,f);return}
  if(FLAT[id]){const p=FLAT[id]();ctx.save();ctx.translate(.06,.1);ctx.fillStyle="rgba(0,0,0,.2)";ctx.fill(p);ctx.restore();ctx.fillStyle=lin(ctx,P,-1,-1,1,1);ctx.fill(p);ctx.lineWidth=.06;ctx.lineJoin="round";ctx.strokeStyle=P.d;ctx.stroke(p);glint(ctx,-.35,-.4,.22);return}
  switch(id){
    case"perle":{const g=ctx.createRadialGradient(-.3,-.35,.05,0,0,1.05);g.addColorStop(0,"#ffffff");g.addColorStop(.55,"#f4ece4");g.addColorStop(1,"#c9bcb0");
      ctx.beginPath();ctx.arc(.06,.1,1,0,7);ctx.fillStyle="rgba(0,0,0,.18)";ctx.fill();ctx.beginPath();ctx.arc(0,0,1,0,7);ctx.fillStyle=g;ctx.fill();ctx.beginPath();ctx.arc(-.35,-.38,.22,0,7);ctx.fillStyle="rgba(255,255,255,.9)";ctx.fill();break}
    case"boule":{const g=ctx.createRadialGradient(-.35,-.4,.05,0,0,1.05);g.addColorStop(0,P.l);g.addColorStop(.5,P.m);g.addColorStop(1,P.d);
      ctx.beginPath();ctx.arc(.06,.1,1,0,7);ctx.fillStyle="rgba(0,0,0,.2)";ctx.fill();ctx.beginPath();ctx.arc(0,0,1,0,7);ctx.fillStyle=g;ctx.fill();ctx.beginPath();ctx.arc(-.38,-.4,.2,0,7);ctx.fillStyle="rgba(255,255,255,.85)";ctx.fill();break}
    case"marguerite":{for(let i=0;i<8;i++){ctx.save();ctx.rotate(i*Math.PI/4);ctx.beginPath();ctx.ellipse(0,-.68,.3,.58,0,0,7);ctx.fillStyle=c||"#fff";ctx.fill();ctx.lineWidth=.05;ctx.strokeStyle="rgba(0,0,0,.18)";ctx.stroke();ctx.restore()}
      const g=ctx.createRadialGradient(-.1,-.1,0,0,0,.35);g.addColorStop(0,"#ffe08a");g.addColorStop(1,"#e0a526");ctx.beginPath();ctx.arc(0,0,.33,0,7);ctx.fillStyle=g;ctx.fill();break}
    case"sakura":{for(let i=0;i<5;i++){ctx.save();ctx.rotate(i*Math.PI*2/5);const p=new Path2D("M0 0 C-.55 -.4 -.5 -1.05 -.12 -1.1 L0 -.95 L.12 -1.1 C.5 -1.05 .55 -.4 0 0Z");ctx.fillStyle=c;ctx.fill(p);ctx.lineWidth=.05;ctx.strokeStyle="rgba(0,0,0,.15)";ctx.stroke(p);ctx.restore()}
      ctx.beginPath();ctx.arc(0,0,.18,0,7);ctx.fillStyle="#f2c14e";ctx.fill();break}
    case"feuille":leaf(ctx,P,0,0,0,1);break;
    case"branche":{ctx.beginPath();ctx.moveTo(.1,1.3);ctx.quadraticCurveTo(-.35,0,.1,-1.3);ctx.lineWidth=.1;ctx.strokeStyle=P.d;ctx.stroke();
      [[-.12,.7,-.9,.5],[.1,.7,.9,.5],[-.2,.1,-.9,.5],[.05,.05,.9,.5],[-.05,-.55,-.9,.45],[.1,-.55,.9,.45]].forEach(([x,y,r,s])=>leaf(ctx,P,x+(r<0?-.4:.4),y,r,s));leaf(ctx,P,.1,-1.25,0,.5);break}
    case"papillon":{[1,-1].forEach(s=>{ctx.save();ctx.scale(s,1);const u=new Path2D("M.08 -.1 C.3 -1.1 1.3 -1.2 1.2 -.4 C1.15 .1 .5 .1 .08 -.1Z"),l=new Path2D("M.08 .05 C.6 .1 1.0 .5 .75 1 C.5 1.3 .15 .8 .08 .05Z");
      ctx.fillStyle=lin(ctx,P,0,-1,1.2,.5);ctx.fill(u);ctx.fill(l);ctx.lineWidth=.06;ctx.strokeStyle=P.d;ctx.stroke(u);ctx.stroke(l);ctx.restore()});
      ctx.beginPath();ctx.ellipse(0,.1,.07,.55,0,0,7);ctx.fillStyle=P.d;ctx.fill();break}
    case"lune":{const p=new Path2D("M.15 -1 A1 1 0 1 0 .15 1 A.72 .72 0 1 1 .15 -1Z");ctx.fillStyle=lin(ctx,P,-1,-1,1,1);ctx.fill(p);ctx.lineWidth=.05;ctx.strokeStyle=P.d;ctx.stroke(p);break}
    case"etoile":{const p=star(5,1.15,.5);ctx.fillStyle=lin(ctx,P,-1,-1,1,1);ctx.fill(p);ctx.lineWidth=.05;ctx.strokeStyle=P.d;ctx.lineJoin="round";ctx.stroke(p);break}
    case"noeud":{[1,-1].forEach(s=>{ctx.save();ctx.scale(s,1);const p=new Path2D("M.1 0 C.3 -.95 1.4 -.95 1.3 0 C1.4 .95 .3 .95 .1 0Z");ctx.fillStyle=lin(ctx,P,0,-1,1.4,1);ctx.fill(p);ctx.lineWidth=.06;ctx.strokeStyle=P.d;ctx.stroke(p);ctx.restore()});
      ctx.beginPath();ctx.arc(0,0,.28,0,7);ctx.fillStyle=lin(ctx,P,-.3,-.3,.3,.3);ctx.fill();ctx.lineWidth=.06;ctx.strokeStyle=P.d;ctx.stroke();break}
    case"flocon":{ctx.strokeStyle=c||"#fff";ctx.lineWidth=.13;ctx.lineCap="round";for(let i=0;i<6;i++){ctx.save();ctx.rotate(i*Math.PI/3);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-1.1);ctx.moveTo(0,-.6);ctx.lineTo(-.32,-.92);ctx.moveTo(0,-.6);ctx.lineTo(.32,-.92);ctx.stroke();ctx.restore()}break}
    case"anneau":{ctx.beginPath();ctx.arc(0,0,.78,0,7);ctx.lineWidth=.3;ctx.strokeStyle=lin(ctx,P,-1,-1,1,1);ctx.stroke();ctx.lineWidth=.04;ctx.strokeStyle=P.d;ctx.beginPath();ctx.arc(0,0,.93,0,7);ctx.stroke();glint(ctx,-.5,-.55,.22);break}
    case"chaine":{const N=8;for(let i=0;i<N;i++){const t=(i+.5)/N,x=-1.7+3.4*t,y=-.5+.95*Math.sin(Math.PI*t),dx=3.4/N,dy=.95*Math.PI/N*Math.cos(Math.PI*t);
      ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(dy,dx));ctx.beginPath();ctx.ellipse(0,0,.3,.17,0,0,7);ctx.lineWidth=.1;ctx.strokeStyle=lin(ctx,P,-.3,-.2,.3,.2);ctx.stroke();ctx.restore()}break}
  }
}
function handles(d){
  const rad=x=>x*Math.PI/180,r=d.r,ar=d.ar||1,rot=d.rot||0,k=d.k==="chaine"?1.9:1.5;
  return{rs:{x:d.x+Math.cos(rad(rot+45))*r*k*1.05,y:d.y+Math.sin(rad(rot+45))*r*k*1.05},st:{x:d.x+Math.cos(rad(rot))*r*ar*k,y:d.y+Math.sin(rad(rot))*r*ar*k}};
}
function draw(ctx,d,sel){
  ctx.save();ctx.translate(d.x,d.y);ctx.rotate((d.rot||0)*Math.PI/180);ctx.scale(d.r*(d.ar||1),d.r);drawItem(ctx,d);ctx.restore();
  if(sel){
    const hd=handles(d),k=d.k==="chaine"?1.9:1.5;ctx.save();ctx.setLineDash([2,2]);ctx.lineWidth=.7;ctx.strokeStyle="#76806d";
    ctx.translate(d.x,d.y);ctx.rotate((d.rot||0)*Math.PI/180);ctx.beginPath();ctx.ellipse(0,0,d.r*(d.ar||1)*k,d.r*k,0,0,7);ctx.stroke();ctx.restore();
    ctx.save();ctx.lineWidth=.9;[hd.rs,hd.st].forEach((q,i)=>{ctx.beginPath();ctx.arc(q.x,q.y,i?3:3.4,0,7);ctx.fillStyle=i?"#ffffff":"#76806d";ctx.fill();ctx.strokeStyle="#76806d";ctx.stroke()});ctx.restore();
  }
}
function hit(d,x,y){return Math.hypot(d.x-x,d.y-y)<=Math.max(d.r*(d.ar||1),d.r)*(d.k==="chaine"?1.8:1.3)}
window.NailDeco={LIST,FINISHES,DEFAULTS,draw,hit,pal,handles};
})();
 

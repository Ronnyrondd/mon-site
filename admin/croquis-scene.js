/* Croquis d'ongles — scène : deux mains en pose, ongles placés au bout des doigts.
   Repère de la scène : 1800 × 880. Chaque ongle garde son repère propre (largeur 100, pointe en y=0). */
(function(){
const N=window.NailArt,W=1800,H=880,DY=-130,K=.62;
// Main droite (à droite de l'écran, dos de la main) ; la gauche en est le miroir.
const RIGHT=[
  {B:[1112,610],phi:-50,L:135},{B:[1172,480],phi:-8,L:215},{B:[1259,458],phi:-2,L:240},{B:[1346,466],phi:5,L:218},{B:[1426,500],phi:13,L:165}
];
const PALM=[[1124,530],[1215,490],[1342,500],[1444,530],[1456,650],[1428,775],[1388,880],[1176,880],[1130,775],[1090,660]];
const FLAT=true; // true : 10 doigts droits en deux rangées (sans paume) ; false : mains en pose
const BOX=FLAT?{x:170,y:230,w:1460,h:360}:{x:300,y:20,w:1200,h:760};
const hit=document.createElement("canvas").getContext("2d");

function build(){
  const out=[];
  for(let hand=0;hand<2;hand++){
    const mir=hand===0;
    RIGHT.forEach((f0,j)=>{let f=f0;
      const fw=N.FINGERS[j].w,ki=K*fw,r=64*ki;let bx=f.B[0],by=f.B[1]+DY,phi=f.phi;if(mir){bx=W-bx;phi=-phi}
      if(FLAT){const slot=mir?4-j:j;bx=(mir?240:1000)+slot*130;by=520;phi=0;f={L:150}}
      const rad=phi*Math.PI/180,ux=Math.sin(rad),uy=-Math.cos(rad);
      out[hand*5+j]={bx,by,rad,ux,uy,r,ki,L:f.L,ex:bx+ux*(f.L+r),ey:by+uy*(f.L+r)};
    });
  }
  return out;
}
const G=build();
function frame(i,n){const g=G[i],h=N.nailH(n),d=(h-118)*g.ki;return{ox:g.ex+g.ux*d,oy:g.ey+g.uy*d,rad:g.rad,ki:g.ki,h}}
function toLocal(i,n,x,y){const f=frame(i,n),dx=x-f.ox,dy=y-f.oy,c=Math.cos(f.rad),s=Math.sin(f.rad);return[(dx*c+dy*s)/f.ki+50,(-dx*s+dy*c)/f.ki]}
function toWorld(i,n,x,y){const f=frame(i,n),c=Math.cos(f.rad),s=Math.sin(f.rad),a=(x-50)*f.ki,b=y*f.ki;return[f.ox+a*c-b*s,f.oy+a*s+b*c]}
function hitNail(nails,x,y,tol){
  for(let i=0;i<10;i++){
    const n=nails[i],[lx,ly]=toLocal(i,n,x,y),p=N.nailPath(n.shape,N.nailH(n));
    if(hit.isPointInPath(p,lx,ly))return i;
    hit.lineWidth=(tol||10)*2;if(hit.isPointInStroke(p,lx,ly))return i;
  }
  return -1;
}
function smooth(ctx,pts){
  const m=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2],n=pts.length;ctx.beginPath();const s=m(pts[n-1],pts[0]);ctx.moveTo(s[0],s[1]);
  for(let i=0;i<n;i++){const c=pts[i],e=m(pts[i],pts[(i+1)%n]);ctx.quadraticCurveTo(c[0],c[1],e[0],e[1])}ctx.closePath();
}
function body(ctx,skin,outline){
  const line=outline?"#292824":N.dark(skin,.16),fill=outline?"#ffffff":skin;
  for(let hand=0;hand<2;hand++){
    const mir=hand===0,pts=PALM.map(([x,y])=>[mir?W-x:x,y+DY]);
    ctx.save();ctx.lineJoin="round";ctx.lineCap="round";
    if(!FLAT){smooth(ctx,pts);ctx.lineWidth=outline?2:3;ctx.strokeStyle=line;ctx.stroke()}
    for(let j=0;j<5;j++){const g=G[hand*5+j];ctx.beginPath();ctx.moveTo(g.bx,g.by);ctx.lineTo(g.bx+g.ux*g.L,g.by+g.uy*g.L);ctx.lineWidth=g.r*2+(outline?2:3);ctx.strokeStyle=line;ctx.stroke()}
    if(!FLAT){smooth(ctx,pts);ctx.fillStyle=fill;ctx.fill()}
    for(let j=0;j<5;j++){const g=G[hand*5+j];ctx.beginPath();ctx.moveTo(g.bx,g.by);ctx.lineTo(g.bx+g.ux*g.L,g.by+g.uy*g.L);ctx.lineWidth=g.r*2;ctx.strokeStyle=fill;ctx.stroke()}
    if(!outline&&!FLAT){ // légère ombre douce sur la paume
      const g2=ctx.createLinearGradient(0,pts[0][1],0,H+140);g2.addColorStop(0,"rgba(255,255,255,.10)");g2.addColorStop(1,"rgba(0,0,0,.07)");smooth(ctx,pts);ctx.fillStyle=g2;ctx.fill();
    }
    ctx.restore();
  }
}
function render(ctx,nails,o){
  o=o||{};body(ctx,o.skin||"#f0cfc0",!!o.outline);
  nails.forEach((n,i)=>{
    const f=frame(i,n);ctx.save();ctx.translate(f.ox,f.oy);ctx.rotate(f.rad);ctx.scale(f.ki,f.ki);ctx.translate(-50,0);
    N.renderNail(ctx,n,{outline:!!o.outline,nailOnly:true,selDeco:(o.sel===i&&o.selDecoIdx>=0)?o.selDecoIdx:-1});
    if(o.sel===i&&o.ring&&!o.outline){ctx.setLineDash([6,5]);ctx.lineWidth=(o.px||1)*(o.ringW||2.4)/f.ki;ctx.strokeStyle="#5f6b57";ctx.stroke(N.nailPath(n.shape,f.h))}
    ctx.restore();
  });
}
window.NailScene={W,H,BOX,G,frame,toLocal,toWorld,hitNail,render};
})();

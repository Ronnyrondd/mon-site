/* Croquis d'ongles — scène : deux mains en pose, ongles placés au bout des doigts.
   Repère de la scène : 1800 × 880. Chaque ongle garde son repère propre (largeur 100, pointe en y=0). */
(function(){
const N=window.NailArt,W=1800,H=880,DY=-130,K=.62;
// Main droite (à droite de l'écran, dos de la main) ; la gauche en est le miroir.
const RIGHT=[
  {B:[1112,610],phi:-50,L:135},{B:[1172,480],phi:-8,L:215},{B:[1259,458],phi:-2,L:240},{B:[1346,466],phi:5,L:218},{B:[1426,500],phi:13,L:165}
];
const PALM=[[1124,530],[1215,490],[1342,500],[1444,530],[1456,650],[1428,775],[1388,880],[1176,880],[1130,775],[1090,660]];
const FAN=[-16,-6,-1,4,9],LEN=[118,150,172,156,122],DYB=[50,0,-10,0,18];
const FLAT=true; // true : 10 doigts droits en deux rangées (sans paume) ; false : mains en pose
const BOX=FLAT?{x:170,y:230,w:1460,h:360}:{x:300,y:20,w:1200,h:760};
const hit=document.createElement("canvas").getContext("2d");

function build(){
  const out=[];
  for(let hand=0;hand<2;hand++){
    const mir=hand===0;
    RIGHT.forEach((f0,j)=>{let f=f0;
      const fw=N.FINGERS[j].w,ki=K*fw,r=64*ki;let bx=f.B[0],by=f.B[1]+DY,phi=f.phi;if(mir){bx=W-bx;phi=-phi}
      if(FLAT){const slot=mir?4-j:j;bx=(mir?240:1000)+slot*130;by=520;phi=mir?-FAN[j]:FAN[j];f={L:LEN[j]};by+=DYB[j]}
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
const hexA=(h,a)=>{const v=parseInt(h.slice(1),16);return"rgba("+(v>>16)+","+((v>>8)&255)+","+(v&255)+","+a+")"};
function finger(ctx,g,col,grow){ // doigt effilé, arrondi au bout, qui s'estompe vers la base
  const nx=-g.uy,ny=g.ux,rb=g.r*1.06+grow,rt=g.r*.9+grow,x0=g.bx-g.ux*70,y0=g.by-g.uy*70,x1=g.bx+g.ux*g.L,y1=g.by+g.uy*g.L,a=Math.atan2(ny,nx);
  ctx.beginPath();ctx.moveTo(x0+nx*rb,y0+ny*rb);ctx.lineTo(x1+nx*rt,y1+ny*rt);ctx.arc(x1,y1,rt,a,a+Math.PI,true);ctx.lineTo(x0-nx*rb,y0-ny*rb);ctx.closePath();
  const gr=ctx.createLinearGradient(x0,y0,x1,y1);gr.addColorStop(0,hexA(col,0));gr.addColorStop(.42,hexA(col,1));gr.addColorStop(1,hexA(col,1));ctx.fillStyle=gr;ctx.fill();
}
function body(ctx,skin,outline){
  const line=outline?"#292824":N.dark(skin,.16),fill=outline?"#ffffff":skin;
  ctx.save();ctx.lineJoin="round";
  for(let i=0;i<10;i++)finger(ctx,G[i],line,outline?1.5:2.5);
  for(let i=0;i<10;i++)finger(ctx,G[i],fill,0);
  if(!outline){ // petits plis des articulations
    ctx.strokeStyle=hexA(N.dark(skin,.22),.5);ctx.lineWidth=2;ctx.lineCap="round";
    for(let i=0;i<10;i++){const g=G[i],j=i%5,nx=-g.uy,ny=g.ux;
      [[3.0,.55],[5.4,.45]].forEach(([d,w],k)=>{if(j===0&&k===1)return;const t=g.L-g.r*d,cx=g.bx+g.ux*t,cy=g.by+g.uy*t,hw=g.r*w;
        ctx.beginPath();ctx.moveTo(cx-nx*hw,cy-ny*hw);ctx.quadraticCurveTo(cx+g.ux*3,cy+g.uy*3,cx+nx*hw,cy+ny*hw);ctx.stroke()})}
  }
  ctx.restore();
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

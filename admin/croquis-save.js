(function(){
const N=window.NailArt,CQ=window.CQ,db=CQ.db,$=s=>document.querySelector(s);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmtD=new Intl.DateTimeFormat("fr-BE",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",timeZone:"Europe/Brussels"});
const fmtS=new Intl.DateTimeFormat("fr-BE",{day:"numeric",month:"short",year:"numeric",timeZone:"Europe/Brussels"});
let appts=[];
const cname=c=>c?`${c.first_name||""} ${(c.last_name||"").slice(0,1)}${c.last_name?".":""}`.trim():"";

async function guard(){
  const{data:{session}}=await db.auth.getSession();if(!session){location.replace("./");return false}
  const{data:ok,error}=await db.rpc("is_admin");if(error||ok!==true){await db.auth.signOut();location.replace("./");return false}return true;
}
async function loadAppts(){
  const since=new Date(Date.now()-5*864e5).toISOString();
  const{data,error}=await db.from("appointments").select("id,starts_at,service_name_snapshot,client_id,clients(id,first_name,last_name)").gte("starts_at",since).in("status",["pending","confirmed","completed"]).order("starts_at",{ascending:true}).limit(80);
  if(error){console.error(error);return}
  appts=data||[];const sel=$("#apptSel");
  appts.forEach(a=>{const o=document.createElement("option");o.value=a.id;o.textContent=`${fmtD.format(new Date(a.starts_at))} · ${cname(a.clients)} · ${a.service_name_snapshot||""}`;sel.appendChild(o)});
}
function setAppt(id){
  CQ.apptId=id||"";if(CQ.ui.loadInspirations)CQ.ui.loadInspirations();const a=appts.find(x=>x.id===id);CQ.clientId=a?a.client_id||null:null;$("#apptSel").value=CQ.apptId;
}
function title(){
  if(CQ.title)return CQ.title;const a=appts.find(x=>x.id===CQ.apptId);
  return a?`Pose · ${cname(a.clients)} · ${fmtS.format(new Date(a.starts_at))}`:`Croquis libre · ${fmtS.format(new Date())}`;
}
function loadRow(r){
  const d=r.data||{};CQ.setNails((d.nails||[]).map(n=>Object.assign(N.defaultNail(),n)).concat(Array.from({length:10},N.defaultNail)).slice(0,10));
  if(d.skin)CQ.skin=d.skin;CQ.same=d.same!==false;CQ.note=r.note||"";CQ.meta=Object.assign({name:"",time:"",price:""},d.meta||{});CQ.sketchId=r.id;CQ.title=r.title||"";
  setAppt(r.appointment_id||"");CQ.sel=1;CQ.refresh(true);CQ.dirty=false;CQ.toast("Croquis ouvert");
}
async function latestFor(apptId){
  const{data}=await db.from("appointment_sketches").select("*").eq("appointment_id",apptId).order("updated_at",{ascending:false}).limit(1);return data&&data[0];
}
$("#apptSel").addEventListener("change",async e=>{
  const id=e.target.value;CQ.sketchId=null;CQ.title="";setAppt(id);CQ.dirty=true;
  if(!id)return;const ex=await latestFor(id);
  if(ex&&await CQ.confirmBox("Un croquis existe déjà","Ce rendez-vous a déjà un croquis enregistré. Veux-tu l'ouvrir ? (Sinon tu en crées un nouveau.)","Ouvrir"))loadRow(ex);
});

async function save(){
  const btn=$("#saveBtn");btn.disabled=true;btn.textContent="Enregistrement…";
  try{
    const preview=CQ.composite(760).toDataURL("image/jpeg",.82);
    const row={appointment_id:CQ.apptId||null,client_id:CQ.clientId||null,title:title(),note:CQ.note||null,preview,updated_at:new Date().toISOString(),data:{v:1,nails:CQ.nails.map(N.clone),skin:CQ.skin,same:CQ.same,meta:CQ.meta}};
    let res;
    if(CQ.sketchId)res=await db.from("appointment_sketches").update(row).eq("id",CQ.sketchId).select("id").single();
    else res=await db.from("appointment_sketches").insert(row).select("id").single();
    if(res.error)throw res.error;
    CQ.sketchId=res.data.id;CQ.title=row.title;CQ.dirty=false;CQ.toast("Croquis enregistré ✓");
  }catch(err){console.error(err);CQ.toast("Impossible d'enregistrer (la table existe-t-elle ?)")}
  btn.disabled=false;btn.textContent="Enregistrer";
}
$("#saveBtn").onclick=save;

$("#openBtn").onclick=async()=>{
  const{data,error}=await db.from("appointment_sketches").select("id,title,updated_at,preview,appointment_id,client_id,note,data").order("updated_at",{ascending:false}).limit(40);
  if(error){console.error(error);CQ.toast("Impossible de charger les croquis");return}
  const m=CQ.modal(`<h2>Mes croquis</h2>${data.length?`<div class="skl">${data.map(r=>`<button class="skc" data-id="${r.id}"><img src="${esc(r.preview||"")}" alt=""><div><b>${esc(r.title||"Sans titre")}</b>${fmtS.format(new Date(r.updated_at))}</div></button>`).join("")}</div>`:'<p style="color:var(--muted)">Aucun croquis enregistré pour le moment.</p>'}<div class="chips" style="margin-top:14px;justify-content:space-between"><button class="btn small" id="mDel" ${data.length?"":"hidden"}>Mode suppression : non</button><button class="btn small" id="mClose">Fermer</button></div>`);
  let del=false;m.querySelector("#mClose").onclick=CQ.closeModal;
  const dbtn=m.querySelector("#mDel");if(dbtn)dbtn.onclick=()=>{del=!del;dbtn.textContent="Mode suppression : "+(del?"oui (touche un croquis)":"non")};
  m.querySelectorAll(".skc").forEach(b=>b.onclick=async()=>{
    const r=data.find(x=>x.id===b.dataset.id);
    if(del){if(!await CQ.confirmBox("Supprimer ce croquis ?","Cette action est définitive.","Supprimer"))return;const{error:e2}=await db.from("appointment_sketches").delete().eq("id",r.id);if(e2){CQ.toast("Suppression impossible");return}if(CQ.sketchId===r.id)CQ.sketchId=null;CQ.toast("Croquis supprimé");$("#openBtn").click();return}
    CQ.closeModal();loadRow(r);
  });
};

function exportCanvas(c,name){
  c.toBlob(async blob=>{
    const file=new File([blob],name,{type:"image/png"});
    try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:"Croquis"});return}}catch(e){if(e&&e.name==="AbortError")return}
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500);
  },"image/png");
}
$("#exportBtn").onclick=()=>exportCanvas(CQ.composite(1500),"croquis-ongles.png");
$("#exportOutline").onclick=()=>exportCanvas(CQ.composite(1500,{outline:true}),"modele-ongles-trait.png");

CQ.getTitle=()=>title();
if(new URLSearchParams(location.search).get("embed")==="1")document.body.classList.add("embed");
(async function start(){
  if(!await guard())return;
  CQ.ui.renderRecent();CQ.showTab("forme");
  $("#loading").hidden=true;$("#app").hidden=false;CQ.init();CQ.ui.sync();
  await loadAppts();
  const q=new URLSearchParams(location.search);
  if(q.get("sketch")){const{data}=await db.from("appointment_sketches").select("*").eq("id",q.get("sketch")).maybeSingle();if(data)loadRow(data)}
  else if(q.get("appointment")){setAppt(q.get("appointment"));const ex=await latestFor(q.get("appointment"));if(ex)loadRow(ex)}
})();
})();

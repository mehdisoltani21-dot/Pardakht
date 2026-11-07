/* CACHEBUST 2026-11-07-esc-ok */
const KEY="pardakht-v1",ROLE_KEY="pardakht-role",PASS_GUEST="M1406",PASS_ADMIN="M136810";
const SB_URL="https://cgsqkezksxjtzncrgizt.supabase.co";
const SB_KEY="sb_publishable_E1xEZ0dtOiZnnDO_zxRbsw_jxin_In-";
const GS_KEY="pardakht-gs-url";
function getGsUrl(){try{return localStorage.getItem(GS_KEY)||""}catch(e){return""}}
function setGsUrl(u){try{localStorage.setItem(GS_KEY,(u||"").trim())}catch(e){}}
async function pushToSheet(type,row){const url=getGsUrl();if(!url)return;try{await fetch(url,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({type,row,token:"pardakht"})})}catch(e){console.warn("sheet",e)}}
async function pushAllToSheet(){const url=getGsUrl();if(!url){alert("ابتدا لینک گوگل شیت را تنظیم کنید");return}try{await fetch(url,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({type:"full",entries:S.entries||[],cheques:S.cheques||[],token:"pardakht"})});alert("ارسال کامل به گوگل شیت انجام شد")}catch(e){alert("خطا در ارسال به شیت")}}
let S={entries:[],cheques:[]},role=null,editPay=null,editCk=null,sb=null;
try{sb=supabase.createClient(SB_URL,SB_KEY)}catch(e){}
const $=id=>document.getElementById(id);
const fa=n=>Number(n||0).toLocaleString("fa-IR");
const today=()=>new Date().toISOString().slice(0,10);
const pdate=d=>{if(!d)return"";try{return new Date(d+"T12:00:00").toLocaleDateString("fa-IR")}catch(e){return d}};
const isPast=d=>d&&d<today();
const ckDate=c=>c.due||c.date||"";
const isAdmin=()=>role==="admin";
const JM=["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
function toJalaali(gy,gm,gd){
  if(window.jalaali&&jalaali.toJalaali){const r=jalaali.toJalaali(gy,gm,gd);return{jy:r.jy,jm:r.jm,jd:r.jd}}
  return{jy:1403,jm:1,jd:1};
}
function toGregorian(jy,jm,jd){
  if(window.jalaali&&jalaali.toGregorian){const r=jalaali.toGregorian(jy,jm,jd);return{gy:r.gy,gm:r.gm,gd:r.gd}}
  return{gy:2024,gm:3,gd:21};
}
function isLeapJalaali(jy){
  if(window.jalaali&&jalaali.isLeapJalaaliYear)return jalaali.isLeapJalaaliYear(jy);
  return false;
}
function jMonthDays(jy,jm){
  if(window.jalaali&&jalaali.jalaaliMonthLength)return jalaali.jalaaliMonthLength(jy,jm);
  if(jm<=6)return 31;if(jm<=11)return 30;return 29;
}
function isoToJ(iso){
  if(!iso||iso.length<8)return null;
  const p=iso.split("-").map(Number);if(!p[0])return null;
  return toJalaali(p[0],p[1],p[2]);
}
function jToIso(jy,jm,jd){
  const g=toGregorian(+jy,+jm,+jd);
  const p=n=>String(n).padStart(2,"0");
  return g.gy+"-"+p(g.gm)+"-"+p(g.gd);
}
function fillShamsiSelects(yId,mId,dId,iso){
  const yEl=$(yId),mEl=$(mId),dEl=$(dId);if(!yEl)return;
  const now=new Date();
  let j=toJalaali(now.getFullYear(),now.getMonth()+1,now.getDate());
  if(!j||j.jy<1300||j.jy>1500)j={jy:1403,jm:8,jd:16};
  const jSel=isoToJ(iso)||j;
  if(!jSel||jSel.jy<1300||jSel.jy>1500){jSel.jy=j.jy;jSel.jm=j.jm;jSel.jd=j.jd}
  if(!yEl.options.length){
    for(let y=j.jy-6;y<=j.jy+6;y++){
      const o=document.createElement("option");o.value=y;o.textContent=String(y);yEl.appendChild(o);
    }
    JM.forEach((name,i)=>{const o=document.createElement("option");o.value=i+1;o.textContent=name;mEl.appendChild(o)});
  }
  yEl.value=String(jSel.jy);mEl.value=String(jSel.jm);
  const refillD=()=>{
    const days=jMonthDays(+yEl.value,+mEl.value)||30;
    const cur=+(dEl.value||jSel.jd||1);
    dEl.innerHTML="";
    for(let d=1;d<=days;d++){const o=document.createElement("option");o.value=d;o.textContent=String(d);dEl.appendChild(o)}
    dEl.value=String(Math.min(cur,days));
  };
  refillD();yEl.onchange=mEl.onchange=refillD;
}
function getShamsiIso(yId,mId,dId){
  try{return jToIso($(yId).value,$(mId).value,$(dId).value)}catch(e){return today()}
}
function setShamsiIso(yId,mId,dId,iso){fillShamsiSelects(yId,mId,dId,iso||today())}
const ACK_KEY="pardakht-ack";
function loadAck(){try{return JSON.parse(localStorage.getItem(ACK_KEY)||"{}")}catch(e){return{}}}
function saveAck(a){try{localStorage.setItem(ACK_KEY,JSON.stringify(a))}catch(e){}}
function daysToDue(d){if(!d)return 999;const t=new Date(today()+"T12:00:00"),x=new Date(d+"T12:00:00");return Math.round((x-t)/86400000)}
function needsAlarm(c){if(c.done)return false;const d=ckDate(c);if(!d)return false;if(daysToDue(d)>2)return false;const ack=loadAck();return ack[c.id]!==d}
function ackCheque(id,due){const a=loadAck();a[id]=due;saveAck(a);runAlarms()}
let payPhotos=[],ckPhotos=[];
const MAX_PH=2,PH_W=800,PH_Q=0.6;
function compressImage(file){return new Promise((resolve,reject)=>{const rd=new FileReader();rd.onload=()=>{const img=new Image();img.onload=()=>{let w=img.width,h=img.height;if(w>PH_W){h=Math.round(h*PH_W/w);w=PH_W}const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(img,0,0,w,h);resolve(c.toDataURL("image/jpeg",PH_Q))};img.onerror=reject;img.src=rd.result};rd.onerror=reject;rd.readAsDataURL(file)})}
function renderPhSlots(containerId,arr,fileId){const el=$(containerId);if(!el)return;el.innerHTML="";arr.forEach((src,i)=>{const s=document.createElement("div");s.className="ph-slot";s.innerHTML=`<img src="${src}" alt=""><button type="button" class="rm" title="حذف">×</button>`;s.querySelector(".rm").onclick=ev=>{ev.stopPropagation();arr.splice(i,1);renderPhSlots(containerId,arr,fileId)};s.querySelector("img").onclick=()=>showImg(src);el.appendChild(s)});if(arr.length<MAX_PH){const add=document.createElement("div");add.className="ph-slot";add.innerHTML=`<div class="ph-add">＋<br>عکس</div>`;add.onclick=()=>$(fileId).click();el.appendChild(add)}}
async function onPhFiles(files,arr,containerId,fileId){const list=[...files].slice(0,MAX_PH-arr.length);for(const f of list){if(!f.type.startsWith("image/"))continue;try{arr.push(await compressImage(f))}catch(e){console.warn(e)}}$(fileId).value="";renderPhSlots(containerId,arr,fileId)}
function showImg(src){$("imgPrevImg").src=src;$("imgPrev").style.display="flex"}
function phThumbs(photos){if(!photos||!photos.length)return"";return `<div class="ph-view">${photos.map(p=>`<img src="${p}">`).join("")}</div>`}
async function ensureNotif(){if(!("Notification" in window))return false;if(Notification.permission==="granted")return true;if(Notification.permission!=="denied"){const p=await Notification.requestPermission();return p==="granted"}return false}
function fireNotif(title,body){try{if(Notification.permission==="granted")new Notification(title,{body,tag:"pardakht-ck",dir:"rtl",lang:"fa",requireInteraction:true})}catch(e){}try{if(navigator.vibrate)navigator.vibrate([200,100,200,100,200])}catch(e){}}
function runAlarms(){const list=(S.cheques||[]).filter(needsAlarm);const box=$("alarmBox"),al=$("alarmList");if(!box)return;if(!list.length){box.style.display="none";al.innerHTML="";return}box.style.display="block";al.innerHTML="";list.forEach(c=>{const days=daysToDue(ckDate(c));const label=days<0?("سررسید گذشته ("+Math.abs(days)+" روز)"):(days===0?"سررسید امروز":days+" روز تا سررسید");const row=document.createElement("div");row.className="ar";row.innerHTML=`<div><b>${esc(c.to||"")}</b><div style="font-size:12px;opacity:.9">${fa(c.amt)} · ${pdate(ckDate(c))} · ${label}</div></div>`;const btn=document.createElement("button");btn.textContent="تأیید";btn.onclick=ev=>{ev.stopPropagation();ackCheque(c.id,ckDate(c))};row.appendChild(btn);al.appendChild(row)});const first=list[0];fireNotif("یادآوری چک",`${list.length} چک نیاز به توجه دارد — ${first.to||""} ${fa(first.amt)}`)}
function load(){try{const r=localStorage.getItem(KEY);if(r)S=JSON.parse(r)}catch(e){}if(!S.entries)S.entries=[];if(!S.cheques)S.cheques=[]}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}syncUp()}
function touchLocal(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
async function syncUp(){if(!sb)return;try{const payload={id:"main",data:S,updated_at:new Date().toISOString()};await sb.from("pardakht").upsert(payload,{onConflict:"id"});$("syncBadge").textContent="● آنلاین";$("syncBadge").style.color="#4ade80"}catch(e){$("syncBadge").textContent="● آفلاین";$("syncBadge").style.color="#f87171"}}
async function syncDown(){if(!sb)return;try{const {data,error}=await sb.from("pardakht").select("data").eq("id","main").maybeSingle();if(error)throw error;if(data&&data.data){const remote=data.data;const merge=(a,b)=>{const m=new Map((a||[]).map(x=>[x.id,x]));(b||[]).forEach(x=>m.set(x.id,x));return[...m.values()]};S.entries=merge(S.entries,remote.entries);S.cheques=merge(S.cheques,remote.cheques);touchLocal();$("syncBadge").textContent="● آنلاین";$("syncBadge").style.color="#4ade80"}else $("syncBadge").textContent="● خالی"}catch(e){$("syncBadge").textContent="● آفلاین";$("syncBadge").style.color="#f87171"}}
function showPage(id){document.querySelectorAll("[id^=pg]").forEach(p=>p.style.display="none");$(id).style.display="block";$("hdrSub").textContent={pgHome:"منوی اصلی",pgPay:"ثبت پرداخت",pgCk:"ثبت چک",pgPayList:"لیست پرداخت‌ها",pgCkList:"لیست چک‌ها"}[id]||"";if(id==="pgPayList")renderPay();if(id==="pgCkList")renderCk();if(id==="pgHome")renderWarn()}
document.querySelectorAll("[data-back]").forEach(b=>b.onclick=()=>showPage("pgHome"));
$("goPayList").onclick=()=>showPage("pgPayList");$("goCkList").onclick=()=>showPage("pgCkList");
$("goPay").onclick=()=>{editPay=null;payPhotos=[];renderPhSlots("payPh",payPhotos,"payFile");$("formTitle").textContent="ثبت پرداخت جدید";$("fc").value="";$("fs").value="";$("fa").value="";$("fp").value="سلطانی";setShamsiIso("fdY","fdM","fdD",today());$("fn").value="";$("fadd").textContent="ثبت پرداخت";$("fcancel").style.display="none";showPage("pgPay")};
$("goCk").onclick=()=>{editCk=null;ckPhotos=[];renderPhSlots("ckPh",ckPhotos,"ckFile");$("cformTitle").textContent="ثبت چک جدید";$("ct").value="";$("ca").value="";setShamsiIso("cdY","cdM","cdD",today());$("cb").value="سلطانی";$("cn").value="";$("cadd").textContent="ثبت چک";$("ccancel").style.display="none";showPage("pgCk")};
$("emptyPay").onclick=()=>$("goPay").click();$("emptyCk").onclick=()=>$("goCk").click();
$("fadd").onclick=()=>{const cat=$("fc").value.trim(),sub=$("fs").value.trim(),amt=Number(($("fa").value||"").replace(/,/g,"")),payer=$("fp").value,date=getShamsiIso("fdY","fdM","fdD")||today(),note=$("fn").value.trim();if(!cat||!amt){alert("شاخه و مبلغ لازم است");return}if(editPay){Object.assign(editPay,{cat,sub,amt,payer,date,note,photos:[...payPhotos]});pushToSheet("pay",editPay);editPay=null}else{const _ne={id:Date.now()+"-"+Math.random().toString(36).slice(2,7),cat,sub,amt,payer,date,note,photos:[...payPhotos]};S.entries.push(_ne);pushToSheet("pay",_ne)}save();showPage("pgPayList")};
$("fcancel").onclick=()=>{editPay=null;showPage("pgHome")};
$("cadd").onclick=()=>{const to=$("ct").value.trim(),amt=Number(($("ca").value||"").replace(/,/g,"")),date=getShamsiIso("cdY","cdM","cdD")||today(),by=$("cb").value,note=$("cn").value.trim();if(!to||!amt){alert("گیرنده و مبلغ لازم است");return}if(editCk){Object.assign(editCk,{to,amt,due:date,date,by,note,photos:[...ckPhotos]});pushToSheet("cheque",editCk);editCk=null}else{const _nc={id:Date.now()+"-"+Math.random().toString(36).slice(2,7),to,amt,due:date,date,by,note,done:false,photos:[...ckPhotos]};S.cheques.push(_nc);pushToSheet("cheque",_nc)}save();showPage("pgCkList")};
$("ccancel").onclick=()=>{editCk=null;showPage("pgHome")};
$("fr").onchange=$("fpay").onchange=$("fq").oninput=()=>renderPay();
$("cflt").onchange=$("cq").oninput=()=>renderCk();
function renderAll(){renderPay();renderCk();renderWarn()}
function renderWarn(){const pending=(S.cheques||[]).filter(c=>!c.done);const overdue=pending.filter(c=>isPast(ckDate(c)));const el=$("ckWarn");if(overdue.length){el.style.display="block";el.innerHTML=`⚠ <b>${overdue.length}</b> چک سررسید گذشته`;el.onclick=()=>showPage("pgCkList")}else el.style.display="none";runAlarms()}
function renderPay(){const list=$("list"),empty=$("empty");list.innerHTML="";let ents=[...(S.entries||[])].sort((a,b)=>(b.date||"").localeCompare(a.date||""));const fr=$("fr").value,fq=($("fq").value||"").trim().toLowerCase(),fpay=$("fpay").value;if(fr==="today")ents=ents.filter(e=>e.date===today());else if(fr==="month"){const m=today().slice(0,7);ents=ents.filter(e=>(e.date||"").startsWith(m))}if(fpay)ents=ents.filter(e=>e.payer===fpay);if(fq)ents=ents.filter(e=>JSON.stringify(e).toLowerCase().includes(fq));let sSol=0,sAkb=0;ents.forEach(e=>{const a=Number(e.amt)||0;if(e.payer==="سلطانی")sSol+=a;else if(e.payer==="اکبری")sAkb+=a});$("sSol").textContent=fa(sSol);$("sAkb").textContent=fa(sAkb);$("sAll").textContent=fa(sSol+sAkb);if(!ents.length){empty.style.display="block";return}empty.style.display="none";let last="";ents.forEach(e=>{if(e.date!==last){const sep=document.createElement("div");sep.className="date-sep";sep.textContent=pdate(e.date);list.appendChild(sep);last=e.date}const d=document.createElement("div");d.className="item";d.innerHTML=`<div style="display:flex;justify-content:space-between;gap:8px"><div><div class="title">${esc(e.cat||"")} ${e.sub?"· "+esc(e.sub):""}</div><div class="meta">${esc(e.payer||"")} · ${pdate(e.date)}${e.note?" · "+esc(e.note):""}</div></div><div class="amt">${fa(e.amt)}</div></div>${phThumbs(e.photos)}`;d.querySelectorAll(".ph-view img").forEach(im=>{im.onclick=ev=>{ev.stopPropagation();showImg(im.src)}});if(isAdmin()){const acts=document.createElement("div");acts.className="acts";acts.innerHTML=`<button class="g sm" data-edit>ویرایش</button><button class="g sm del" data-del>حذف</button>`;acts.querySelector("[data-edit]").onclick=ev=>{ev.stopPropagation();editPayEntry(e)};acts.querySelector("[data-del]").onclick=ev=>{ev.stopPropagation();if(confirm("آیا این مورد حذف شود؟")){S.entries=S.entries.filter(x=>x.id!==e.id);save();renderPay()}};d.appendChild(acts);d.onclick=()=>{const was=d.classList.contains("open");list.querySelectorAll(".item.open").forEach(x=>x.classList.remove("open"));if(!was)d.classList.add("open")}}list.appendChild(d)})}
function editPayEntry(e){editPay=e;payPhotos=[...(e.photos||[])];renderPhSlots("payPh",payPhotos,"payFile");$("formTitle").textContent="ویرایش پرداخت";$("fc").value=e.cat||"";$("fs").value=e.sub||"";$("fa").value=e.amt||"";$("fp").value=e.payer||"سلطانی";setShamsiIso("fdY","fdM","fdD",e.date||today());$("fn").value=e.note||"";$("fadd").textContent="ذخیره تغییرات";$("fcancel").style.display="block";showPage("pgPay")}
function renderCk(){const list=$("clist"),empty=$("cempty");list.innerHTML="";let chs=[...(S.cheques||[])].sort((a,b)=>(ckDate(a)||"").localeCompare(ckDate(b)||""));const flt=$("cflt").value,cq=($("cq").value||"").trim().toLowerCase();if(flt==="pending")chs=chs.filter(c=>!c.done);else if(flt==="done")chs=chs.filter(c=>c.done);if(cq)chs=chs.filter(c=>JSON.stringify(c).toLowerCase().includes(cq));let cSol=0,cAkb=0;chs.filter(c=>!c.done).forEach(c=>{const a=Number(c.amt)||0;if(c.by==="سلطانی")cSol+=a;else if(c.by==="اکبری")cAkb+=a});$("cSol").textContent=fa(cSol);$("cAkb").textContent=fa(cAkb);$("cAll").textContent=fa(cSol+cAkb);if(!chs.length){empty.style.display="block";return}empty.style.display="none";chs.forEach(c=>{const d=document.createElement("div");d.className="ck"+((!c.done&&isPast(ckDate(c)))?" od":"");d.innerHTML=`<div style="display:flex;justify-content:space-between"><div><div class="title">${esc(c.to||"")}</div><div class="cks">${esc(c.by||"")}${ckDate(c)?" · "+pdate(ckDate(c)):""}${c.note?" · "+esc(c.note):""}${c.done?" · ✅ وصول":""}</div></div><div class="amt">${fa(c.amt)}</div></div>${phThumbs(c.photos)}`;d.querySelectorAll(".ph-view img").forEach(im=>{im.onclick=ev=>{ev.stopPropagation();showImg(im.src)}});if(isAdmin()){const acts=document.createElement("div");acts.className="acts";acts.innerHTML=`<button class="g sm" data-edit>ویرایش</button><button class="g sm" data-done>${c.done?"لغو وصول":"وصول"}</button><button class="g sm del" data-del>حذف</button>`;acts.querySelector("[data-edit]").onclick=ev=>{ev.stopPropagation();editCkEntry(c)};acts.querySelector("[data-done]").onclick=ev=>{ev.stopPropagation();c.done=!c.done;save();renderCk();runAlarms()};acts.querySelector("[data-del]").onclick=ev=>{ev.stopPropagation();if(confirm("آیا این مورد حذف شود؟")){S.cheques=S.cheques.filter(x=>x.id!==c.id);save();renderCk()}};d.appendChild(acts);d.onclick=()=>{const was=d.classList.contains("open");list.querySelectorAll(".ck.open").forEach(x=>x.classList.remove("open"));if(!was)d.classList.add("open")}}list.appendChild(d)})}
function editCkEntry(c){editCk=c;ckPhotos=[...(c.photos||[])];renderPhSlots("ckPh",ckPhotos,"ckFile");$("cformTitle").textContent="ویرایش چک";$("ct").value=c.to||"";$("ca").value=c.amt||"";setShamsiIso("cdY","cdM","cdD",ckDate(c)||today());$("cb").value=c.by||"سلطانی";$("cn").value=c.note||"";$("cadd").textContent="ذخیره تغییرات";$("ccancel").style.display="block";showPage("pgCk")}
function esc(s){s=String(s||"");var o="";for(var i=0;i<s.length;i++){var c=s.charAt(i);if(c==="&")o+="&#38;";else if(c==="<")o+="&#60;";else if(c==="\"")o+="&#34;";else o+=c}return o}
$("lgo").onclick=()=>{const p=$("lpw").value;if(p===PASS_ADMIN)enterApp("admin");else if(p===PASS_GUEST)enterApp("guest");else{$("lerr").textContent="رمز اشتباه"}};
$("lpw").onkeydown=e=>{if(e.key==="Enter")$("lgo").click()};
try{const r=localStorage.getItem(ROLE_KEY);if(r==="admin"||r==="guest")enterApp(r,false)}catch(e){}
if(!$("app").style.display||$("app").style.display==="none")$("login").style.display="flex";
function enterApp(r,persist){role=r;if(persist!==false)try{localStorage.setItem(ROLE_KEY,r)}catch(e){}$("login").style.display="none";$("app").style.display="block";$("roleBadge").textContent=r==="admin"?"مدیر":"میهمان";document.body.classList.toggle("hide-guest",r!=="admin");showPage("pgHome");syncDown().then(()=>renderAll());ensureNotif().then(()=>runAlarms());if(!window._alarmTimer)window._alarmTimer=setInterval(()=>{if(document.visibilityState==="visible")runAlarms()},120000)}
function logout(){role=null;try{localStorage.removeItem(ROLE_KEY)}catch(e){}$("app").style.display="none";$("login").style.display="flex";$("lpw").value="";$("lerr").textContent=""}
$("logout").onclick=logout;
$("gm").onclick=e=>{e.stopPropagation();$("gmenu").classList.toggle("open")};
document.addEventListener("click",()=>$("gmenu").classList.remove("open"));
$("syncNow").onclick=()=>{syncUp().then(()=>syncDown().then(renderAll))};
$("notifBtn").onclick=async()=>{const ok=await ensureNotif();alert(ok?"اعلان فعال شد. از ۲ روز قبل سررسید تا تأیید شما یادآوری می‌شود.":"اجازه اعلان داده نشد. از تنظیمات مرورگر فعال کنید.");runAlarms()};
$("payFile").onchange=e=>onPhFiles(e.target.files,payPhotos,"payPh","payFile");
$("ckFile").onchange=e=>onPhFiles(e.target.files,ckPhotos,"ckPh","ckFile");
$("imgPrevClose").onclick=()=>{$("imgPrev").style.display="none";$("imgPrevImg").src=""};
$("imgPrev").onclick=e=>{if(e.target.id==="imgPrev")$("imgPrevClose").click()};
$("gsSet").onclick=()=>{const cur=getGsUrl();const u=prompt("لینک Web App گوگل شیت را وارد کنید:",cur||"");if(u!==null){setGsUrl(u);alert(u.trim()?"ذخیره شد":"پاک شد")}};
$("gsPush").onclick=()=>pushAllToSheet();
$("bk").onclick=()=>{const t=JSON.stringify(S,null,2);navigator.clipboard.writeText(t).then(()=>alert("کپی شد")).catch(()=>{prompt("کپی کنید:",t)})};
$("rs").onclick=()=>{$("dlg").style.display="flex";$("dtx").value=""};
$("dno").onclick=()=>$("dlg").style.display="none";
$("dok").onclick=()=>{try{const d=JSON.parse($("dtx").value);if(d.entries||d.cheques){S=d;save();renderAll();$("dlg").style.display="none";alert("بازیابی شد")}else alert("فرمت نادرست")}catch(e){alert("JSON نامعتبر")}};
let headerTaps=0,headerTimer=null;
$("hdrSub").parentElement.onclick=()=>{if(!isAdmin())return;headerTaps++;clearTimeout(headerTimer);headerTimer=setTimeout(()=>headerTaps=0,800);if(headerTaps>=7){headerTaps=0;$("secretClear").style.display="flex";$("clrConfirm").value=""}};
$("clrNo").onclick=()=>$("secretClear").style.display="none";
$("clrOk").onclick=()=>{if($("clrConfirm").value.trim()==="پاک شود"){S={entries:[],cheques:[]};save();renderAll();$("secretClear").style.display="none";alert("همه داده‌ها پاک شد")}else alert("عبارت تأیید اشتباه است")};
$("csv").onclick=()=>{const rows=[["نوع","شاخه/گیرنده","زیرشاخه","مبلغ","پرداخت‌کننده/صادرکننده","تاریخ","توضیحات","وضعیت"]];(S.entries||[]).forEach(e=>rows.push(["پرداخت",e.cat||"",e.sub||"",e.amt||"",e.payer||"",e.date||"",e.note||"",""]));(S.cheques||[]).forEach(c=>rows.push(["چک",c.to||"","",c.amt||"",c.by||"",ckDate(c)||"",c.note||"",c.done?"وصول":"در انتظار"]));const csv=rows.map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(",")).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}));a.download="pardakht.csv";a.click()};
function bindAmtInput(el){if(!el)return;el.addEventListener("input",()=>{const pos=el.selectionStart;const raw=el.value.replace(/[^0-9]/g,"");const left=el.value.slice(0,pos).replace(/[^0-9]/g,"").length;const fmt=raw?Number(raw).toLocaleString("en-US"):"";el.value=fmt;let i=0,newPos=0;for(const ch of fmt){if(/[0-9]/.test(ch))i++;newPos++;if(i>=left)break}el.setSelectionRange(newPos,newPos)})}
bindAmtInput($("fa"));bindAmtInput($("ca"));
load();
let deferredPrompt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("installBanner").style.display="flex"});
$("installBtn").onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("installBanner").style.display="none"}};
if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});

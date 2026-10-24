
const KEY="pardakht-v1";
let S={entries:[],map:{}};
try{const r=localStorage.getItem(KEY);if(r)S=JSON.parse(r)}catch(e){}
S.entries=S.entries||[];S.map=S.map||{};S.payer=S.payer||"";S.cheques=S.cheques||[];
S.entries.forEach(e=>{if(!e.sub)e.sub="عمومی"});
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const $=id=>document.getElementById(id);
const fa=n=>Number(n).toLocaleString("fa-IR");
const iso=d=>new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const today=()=>iso(new Date());
const shift=n=>{const d=new Date();d.setDate(d.getDate()+n);return iso(d)};
const dd=d=>new Date(d+"T12:00:00");
const pdate=d=>dd(d).toLocaleDateString("fa-IR-u-ca-persian");
const mk=d=>new Intl.DateTimeFormat("en-u-ca-persian",{year:"numeric",month:"numeric"}).formatToParts(dd(d)).filter(p=>p.type!=="literal").map(p=>p.value).join("-");
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");
let editId=null,menuId=null,collapsed={},view=S.view||"table";

const W={صفر:0,یک:1,دو:2,سه:3,چهار:4,پنج:5,شش:6,شیش:6,هفت:7,هشت:8,نه:9,ده:10,یازده:11,دوازده:12,سیزده:13,چهارده:14,پانزده:15,شانزده:16,هفده:17,هجده:18,نوزده:19,بیست:20,سی:30,چهل:40,پنجاه:50,شصت:60,هفتاد:70,هشتاد:80,نود:90,صد:100,یکصد:100,دویست:200,سیصد:300,چهارصد:400,پانصد:500,ششصد:600,هفتصد:700,هشتصد:800,نهصد:900};
const M={هزار:1e3,میلیون:1e6,ملیون:1e6,میلیارد:1e9};
function norm(s){
  return s.replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/ي/g,"ی").replace(/ك/g,"ک").replace(/(\d)[,،٬](?=\d)/g,"$1").replace(/\u200c/g," ");
}
const isNum=t=>/^\d+(\.\d+)?$/.test(t)||t in W||t in M;
function parse(raw){
  let t=norm(raw).trim().split(/\s+/),best=null;
  for(let i=0;i<t.length;i++){
    if(!isNum(t[i]))continue;
    let j=i;
    while(j+1<t.length&&(isNum(t[j+1])||(t[j+1]==="و"&&j+2<t.length&&isNum(t[j+2]))))j++;
    if(!best||j-i>best[1]-best[0])best=[i,j];
    i=j;
  }
  if(!best)return null;
  let total=0,cur=0;
  for(let k=best[0];k<=best[1];k++){
    const w=t[k];
    if(w==="و")continue;
    if(/^\d/.test(w))cur+=parseFloat(w);
    else if(w in W)cur+=W[w];
    else if(w in M){total+=(cur||1)*M[w];cur=0}
  }
  total+=cur;
  if(!total)return null;
  const before=t.slice(0,best[0]).join(" "),after=t.slice(best[1]+1).join(" ");
  return {amt:total,desc:(before+" "+after).trim()||"پرداخت"};
}
function words(n){
  if(n<0)return "منفی "+words(-n);
  if(n<20)return Object.keys(W).find(k=>W[k]===n)||String(n);
  if(n<100){const t=Math.floor(n/10)*10,o=n%10;return (Object.keys(W).find(k=>W[k]===t)||t)+(o?" و "+words(o):"")}
  if(n<1000){const h=Math.floor(n/100)*100,r=n%100;return (Object.keys(W).find(k=>W[k]===h)||h)+(r?" و "+words(r):"")}
  if(n<1e6){const th=Math.floor(n/1000),r=n%1000;return words(th)+" هزار"+(r?" و "+words(r):"")}
  if(n<1e9){const m=Math.floor(n/1e6),r=n%1e6;return words(m)+" میلیون"+(r?" و "+words(r):"")}
  const b=Math.floor(n/1e9),r=n%1e9;return words(b)+" میلیارد"+(r?" و "+words(r):"");
}
function handle(raw){
  const p=parse(raw);if(!p){$("hint").textContent="مبلغ پیدا نشد.";return}
  const e={id:Date.now()+"-"+Math.random().toString(36).slice(2,7),date:today(),cat:"عمومی",sub:"عمومی",desc:p.desc,amt:p.amt,payer:S.fp||S.payer||"سلطانی",note:""};
  const m=raw.match(/(?:شاخه|دسته)\s*[:：]?\s*([^،,]+)/i);if(m)e.cat=m[1].trim();
  const s=raw.match(/(?:زیرشاخه|زیردسته)\s*[:：]?\s*([^،,]+)/i);if(s)e.sub=s[1].trim();
  S.entries.unshift(e);save();render();$("hint").textContent="ثبت شد: "+fa(p.amt)+" تومان";$("txt").value="";
}
function fillDL(){
  const cats=new Set(),subs=new Set();
  S.entries.forEach(e=>{if(e.cat)cats.add(e.cat);if(e.sub)subs.add(e.sub)});
  $("dlc").innerHTML=[...cats].map(c=>`<option value="${esc(c)}">`).join("");
  $("dls").innerHTML=[...subs].map(s=>`<option value="${esc(s)}">`).join("");
}
function render(){
  fillDL();
  const t=today(),m=mk(t);
  let sT=0,sM=0,sA=0;
  S.entries.forEach(e=>{sA+=e.amt;if(e.date===t)sT+=e.amt;if(mk(e.date)===m)sM+=e.amt});
  $("sT").textContent=fa(sT);$("sM").textContent=fa(sM);$("sA").textContent=fa(sA);
  const FL={r:$("fr").value,c:$("fcat").value,s:$("fsub").value,p:$("fpay").value,q:$("fq").value,a:$("f1")?.value,b:$("f2")?.value};
  let list=S.entries.slice();
  if(FL.r==="today")list=list.filter(e=>e.date===t);
  else if(FL.r==="week"){const w=shift(-6);list=list.filter(e=>e.date>=w)}
  else if(FL.r==="month")list=list.filter(e=>mk(e.date)===m);
  else if(FL.r==="custom"&&FL.a&&FL.b)list=list.filter(e=>e.date>=FL.a&&e.date<=FL.b);
  if(FL.c)list=list.filter(e=>e.cat===FL.c);
  if(FL.s)list=list.filter(e=>e.sub===FL.s);
  if(FL.p)list=list.filter(e=>e.payer===FL.p);
  if(FL.q){const q=norm(FL.q).toLowerCase();list=list.filter(e=>norm(e.desc+" "+(e.note||"")).toLowerCase().includes(q))}
  $("fsum").textContent=list.length?fa(list.length)+" پرداخت · جمع: "+fa(list.reduce((a,e)=>a+e.amt,0))+" تومان":"";
  const pays=new Set(S.entries.map(e=>e.payer).filter(Boolean));
  $("fpay").innerHTML=`<option value="">همه پرداخت‌کننده‌ها</option>`+[...pays].map(p=>`<option value="${esc(p)}" ${FL.p===p?"selected":""}>${esc(p)}</option>`).join("");
  const cats=new Set(S.entries.map(e=>e.cat).filter(Boolean));
  $("fcat").innerHTML=`<option value="">همه شاخه‌ها</option>`+[...cats].map(c=>`<option value="${esc(c)}" ${FL.c===c?"selected":""}>${esc(c)}</option>`).join("");
  const subs=new Set(S.entries.filter(e=>!FL.c||e.cat===FL.c).map(e=>e.sub).filter(Boolean));
  $("fsub").innerHTML=`<option value="">همه زیرشاخه‌ها</option>`+[...subs].map(s=>`<option value="${esc(s)}" ${FL.s===s?"selected":""}>${esc(s)}</option>`).join("");
  $("fdr").style.display=FL.r==="custom"?"flex":"none";
  const tb=$("rows");tb.innerHTML="";
  if(!list.length){$("empty").style.display="block";$("th").innerHTML="";}
  else{
    $("empty").style.display="none";
    $("th").innerHTML="<tr><th>تاریخ</th><th>شاخه</th><th>زیرشاخه</th><th>مبلغ (تومان)</th><th>پرداخت‌کننده</th><th></th></tr>";
    if(view==="tree"){
      const g={};
      list.forEach(e=>{const k=e.cat||"عمومی";(g[k]=g[k]||[]).push(e)});
      Object.keys(g).sort().forEach(cat=>{
        const items=g[cat],tot=items.reduce((a,e)=>a+e.amt,0);
        const h=document.createElement("tr");h.className="g1";
        h.innerHTML=`<td colspan="6"><span class="chev">${collapsed[cat]?"▸":"▾"}</span> ${esc(cat)} <span class="cnt">${items.length}</span><span class="tt">${fa(tot)}</span></td>`;
        h.onclick=()=>{collapsed[cat]=!collapsed[cat];render()};
        tb.appendChild(h);
        if(!collapsed[cat]){
          const sg={};
          items.forEach(e=>{const k=e.sub||"عمومی";(sg[k]=sg[k]||[]).push(e)});
          Object.keys(sg).sort().forEach(sub=>{
            const its=sg[sub],st=its.reduce((a,e)=>a+e.amt,0);
            const h2=document.createElement("tr");h2.className="g2";
            const ck=cat+"|"+sub;
            h2.innerHTML=`<td colspan="6"><span class="chev">${collapsed[ck]?"▸":"▾"}</span> <b>${esc(sub)}</b> <span class="cnt">${its.length}</span><span class="tt">${fa(st)}</span></td>`;
            h2.onclick=()=>{collapsed[ck]=!collapsed[ck];render()};
            tb.appendChild(h2);
            if(!collapsed[ck])its.forEach(e=>addRow(e,tb));
          });
        }
      });
    } else list.forEach(e=>addRow(e,tb));
  }
  const byP={};
  list.forEach(e=>{byP[e.payer||"?"]=(byP[e.payer||"?"]||0)+e.amt});
  $("pay").innerHTML=Object.keys(byP).length?Object.entries(byP).sort((a,b)=>b[1]-a[1]).map(([p,a])=>`<div class="pr"><span>${esc(p)}</span><b>${fa(a)}</b></div>`).join(""):"—";
  renderCheques();
  if(editId){
    const e=S.entries.find(x=>x.id===editId);
    if(e){
      $("fc").value=e.cat;$("fs").value=e.sub;$("fa").value=e.amt?Number(e.amt).toLocaleString("en-US"):"";$("fp").value=e.payer||"سلطانی";$("fn").value=e.note||"";$("fw").textContent=e.amt?words(e.amt)+" تومان":"";
      $("fadd").textContent="ذخیره تغییرات";
    }
  } else {
    $("fadd").textContent="ثبت";
  }
}
function addRow(e,tb){
  const tr=document.createElement("tr");
  tr.innerHTML=`<td class="d">${pdate(e.date)}</td><td>${esc(e.cat)}</td><td>${esc(e.sub)}</td><td class="n">${fa(e.amt)}${e.note?`<br><small>${esc(e.note)}</small>`:""}</td><td>${esc(e.payer||"")}</td><td class="a"><button class="ic" data-id="${e.id}">⋮</button></td>`;
  tr.querySelector(".ic").onclick=ev=>{ev.stopPropagation();menuId=e.id;const m=$("menu");m.style.display="block";m.style.top=(ev.clientY+4)+"px";m.style.left=(ev.clientX-120)+"px"};
  if(editId===e.id)tr.style.outline="2px solid var(--ac)";
  tb.appendChild(tr);
}
function ask(msg,txt){
  return new Promise(res=>{
    const d=$("dlg");$("dm").textContent=msg;$("dtx").style.display=txt?"block":"none";if(txt)$("dtx").value="";d.style.display="flex";
    const done=v=>{d.style.display="none";$("dok").onclick=$("dno").onclick=null;res(v)};
    $("dok").onclick=()=>done(txt?$("dtx").value:true);
    $("dno").onclick=()=>done(txt?"":false);
  });
}
$("gm").onclick=ev=>{ev.stopPropagation();$("menu").style.display="none";const m=$("gmenu");m.style.display=m.style.display==="block"?"none":"block"};
$("mEdit").onclick=()=>{editId=menuId;render()};
$("mDel").onclick=async()=>{if(await ask("این پرداخت حذف شود؟")){S.entries=S.entries.filter(x=>x.id!==menuId);save();render()}};
$("add").onclick=()=>{const v=$("txt").value.trim();if(v){handle(v);$("txt").value=""}};
$("txt").onkeydown=e=>{if(e.key==="Enter")$("add").click()};
$("clr").onclick=async()=>{if(await ask("همه پرداخت‌ها پاک شود؟ این کار برگشت‌پذیر نیست.")){S={entries:[],map:{},payer:S.payer||"",view:S.view,cheques:S.cheques||[],cd:S.cd,fp:S.fp,compact:S.compact};save();render();$("hint").textContent="همه پاک شد."}};
const cp=async(t,ok)=>{
  try{await navigator.clipboard.writeText(t);$("hint").textContent=ok;return}catch(e){}
  const ta=document.createElement("textarea");ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand("copy");document.body.removeChild(ta);$("hint").textContent=ok;
};
$("shb").onclick=async()=>{const t=JSON.stringify(S);try{if(navigator.share){await navigator.share({title:"پشتیبان دفتر پرداخت‌ها",text:t});return}}catch(e){if(e&&e.name==="AbortError")return}cp(t,"پشتیبان کپی شد.")};
$("copy").onclick=()=>cp(S.entries.map(e=>[pdate(e.date),e.cat,e.sub,e.desc,e.payer||"",e.amt,(e.note||"").replace(/\s+/g," ")].join("\t")).join("\n"),"کپی شد؛ در اکسل Paste کن.");
$("bk").onclick=()=>cp(JSON.stringify(S),"پشتیبان کپی شد؛ جایی (مثلاً Notes) ذخیره کن.");
function tryP(s){try{const o=JSON.parse(s);if(o&&Array.isArray(o.entries))return o}catch(e){}return null}
$("rs").onclick=async()=>{

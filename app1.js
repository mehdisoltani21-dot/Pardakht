const SB_URL = "https://cgsqkezksxjtzcrgizt.supabase.co";
const SB_KEY = "sb_publishable_E1xEZ0dtOiZnnDO_zxRbsw_jxin_In-";
const sb = window.supabase.createClient(SB_URL, SB_KEY);

const KEY="pardakht-v1";
let S={entries:[],map:{}};
try{const r=localStorage.getItem(KEY);if(r)S=JSON.parse(r)}catch(e){}
S.entries=S.entries||[];S.map=S.map||{};S.payer=S.payer||"";S.cheques=S.cheques||[];
S.entries.forEach(e=>{if(!e.sub)e.sub="عمومی"});
const save=()=>{
  try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}
  syncUp();
};
let syncing=false,lastSyncOk=null;
function countData(obj){
  if(!obj||typeof obj!=="object")return 0;
  return (obj.entries||[]).length + (obj.cheques||[]).length;
}
async function syncUp(){
  if(syncing)return;
  if(countData(S)===0){setSyncUI(lastSyncOk?"ok":"err");return}
  syncing=true;
  setSyncUI("syncing");
  try{
    const {error}=await sb.from("ledger").upsert({
      id:"main",
      data:S,
      updated_at:new Date().toISOString()
    });
    if(error)throw error;
    lastSyncOk=true;
    setSyncUI("ok");
  }catch(e){
    console.warn("sync up failed",e);
    lastSyncOk=false;
    setSyncUI("err");
  }
  syncing=false;
}
async function syncDown(){
  setSyncUI("syncing");
  try{
    const {data,error}=await sb.from("ledger").select("data,updated_at").eq("id","main").maybeSingle();
    if(error)throw error;
    const localCount=countData(S);
    if(data&&data.data&&typeof data.data==="object"){
      const remote=data.data;
      const remoteCount=countData(remote);
      if(remoteCount===0){
        if(localCount>0) await syncUp();
        else setSyncUI("ok");
        return;
      }
      if(localCount===0 && remoteCount>0){
        S=remote;
        S.entries=S.entries||[];S.map=S.map||{};S.cheques=S.cheques||[];
        try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}
        setSyncUI("ok");
        return;
      }
      if(remoteCount>localCount){
        S=remote;
        S.entries=S.entries||[];S.map=S.map||{};S.cheques=S.cheques||[];
        try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}
      }else{
        await syncUp();
        return;
      }
    }else{
      if(localCount>0) await syncUp();
    }
    setSyncUI("ok");
  }catch(e){
    console.warn("sync down failed",e);
    setSyncUI("err");
  }
}
function setSyncUI(st){
  const el=document.getElementById("syncBadge");
  if(!el)return;
  if(st==="syncing"){el.textContent="در حال همگام‌سازی…";el.style.color="var(--mut)";}
  else if(st==="ok"){el.textContent="● آنلاین";el.style.color="var(--ac)";}
  else if(st==="err"){el.textContent="● آفلاین (ذخیره محلی)";el.style.color="var(--red)";}
}
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

// PLACEHOLDER_REST_OF_APP1 - will be fixed
alert("در حال بارگذاری کامل...");

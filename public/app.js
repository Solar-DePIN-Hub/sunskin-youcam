const $=s=>document.querySelector(s);let img=null,uv=null;
const SAMPLE={wrinkle:72,pore:58,texture:64,acne:81,redness:55,oiliness:47,moisture:42,radiance:61,age_spot:69,dark_circle_v2:50};
const NAMES={wrinkle:"Wrinkles",pore:"Pores",texture:"Texture",acne:"Acne",redness:"Redness",oiliness:"Oil balance",moisture:"Moisture",radiance:"Radiance",age_spot:"Age spots",dark_circle_v2:"Dark circles"};
function ready(){$("#go").disabled=!img}
$("#file").onchange=e=>{const f=e.target.files[0];if(!f)return;shrink(URL.createObjectURL(f))};
$("#cam").onclick=async()=>{try{const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"}});$("#v").srcObject=s;$("#v").hidden=false;$("#snap").hidden=false}catch(e){alert("Camera blocked — upload a photo instead.")}};
$("#snap").onclick=()=>{const v=$("#v"),c=document.createElement("canvas");c.width=v.videoWidth;c.height=v.videoHeight;c.getContext("2d").drawImage(v,0,0);v.srcObject.getTracks().forEach(t=>t.stop());v.hidden=true;$("#snap").hidden=true;shrink(c.toDataURL("image/jpeg",.92))};
function shrink(src){const i=new Image();i.onload=()=>{const k=Math.min(1,1600/Math.max(i.width,i.height)),c=document.createElement("canvas");c.width=i.width*k;c.height=i.height*k;c.getContext("2d").drawImage(i,0,0,c.width,c.height);img=c.toDataURL("image/jpeg",.9);$("#shot").src=img;$("#shot").hidden=false;ready()};i.src=src}
$("#loc").onclick=()=>navigator.geolocation.getCurrentPosition(async p=>{const{latitude:a,longitude:o}=p.coords;const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${a}&longitude=${o}&daily=uv_index_max&timezone=auto&forecast_days=1`).then(r=>r.json());uv=r.daily.uv_index_max[0];$("#uvout").innerHTML=`<span class="uv">UV ${uv.toFixed(1)}</span> ${uvLabel(uv)}`},()=>{uv=5;$("#uvout").textContent="Location blocked — using UV 5 (moderate)."});
const uvLabel=u=>u<3?"low":u<6?"moderate":u<8?"high":u<11?"very high":"extreme";
// YouCam scores: higher = healthier. "Concern" = 100 - score.
function plan(s,u){const c=k=>100-(s[k]??70),spf=u>=8?"SPF 50+ PA++++":u>=3?"SPF 50":"SPF 30";const am=[],pm=[],buy=[];
am.push("Gentle cleanser");if(c("moisture")>40){am.push("Hyaluronic serum");buy.push(["Hyaluronic acid serum","low moisture score"])}
if(c("age_spot")>25||c("radiance")>35){am.push("Vitamin C serum");buy.push(["Vitamin C 10–15% serum","age spots / dullness + UV "+u.toFixed(0)])}
am.push(c("oiliness")>45?"Light gel moisturizer":"Cream moisturizer");buy.push([`Broad-spectrum sunscreen ${spf}`,"today's UV is "+uvLabel(u)]);am.push(`Sunscreen ${spf}`+(u>=6?" — reapply every 2 h outdoors":""));
pm.push("Double cleanse (remove sunscreen)");if(c("acne")>25){pm.push("Salicylic acid (BHA) 2–3×/week");buy.push(["BHA 2% exfoliant","acne / pores"])}
if(c("wrinkle")>30||c("texture")>35)pm.push(u>=6?"Retinoid — skip tonight, high UV week":"Retinoid 2–3×/week");if(c("redness")>40){pm.push("Niacinamide / centella");buy.push(["Niacinamide 5% serum","redness"])}
pm.push("Barrier moisturizer");return{am,pm,buy,spf}}
$("#go").onclick=async()=>{$("#out").innerHTML="Analyzing with YouCam AI…";let s,demo=false;
try{const r=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({image:img})}).then(r=>r.json());
if(r.demo){demo=true;s=SAMPLE}else if(r.error)throw new Error(r.error);else s=norm(r.result)}catch(e){$("#out").textContent="Error: "+e.message;return}
const u=uv??5,p=plan(s,u);
$("#out").innerHTML=(demo?`<p class="demo">Demo mode: no YouCam key configured, showing SAMPLE scores (not your skin).</p>`:"")+
`<h3>Your skin scores <small>(YouCam, 100 = best)</small></h3><div class="bars">${Object.keys(NAMES).filter(k=>s[k]!=null).map(k=>`<div>${NAMES[k]} — ${Math.round(s[k])}<div class="bar"><i style="width:${100-s[k]}%"></i></div></div>`).join("")}</div>
<h3>Today's plan · UV ${u.toFixed(1)} <span class="tag">${uvLabel(u)}</span></h3><div class="row" style="align-items:flex-start"><div><b>☀️ Morning</b><ol>${p.am.map(x=>`<li>${x}</li>`).join("")}</ol></div><div><b>🌙 Night</b><ol>${p.pm.map(x=>`<li>${x}</li>`).join("")}</ol></div></div>
<h3>🛒 Shopping list</h3><div class="prod">${p.buy.map(([n,w])=>`<div><b>${n}</b><br><small>why: ${w}</small></div>`).join("")}</div>`};
function norm(r){const o={};const out=r.output||r;(Array.isArray(out)?out:[]).forEach(x=>{const k=(x.type||"").replace(/^hd_/,"");const v=x.ui_score??x.score??x.raw_score;if(k&&v!=null)o[k]=+v});if(!Object.keys(o).length){for(const[k,v]of Object.entries(out||{}))if(v&&typeof v==="object"&&(v.ui_score!=null))o[k.replace(/^hd_/,"")]=+v.ui_score}return o}

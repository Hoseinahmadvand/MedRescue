import {MiniEcg} from '../cardiac/mini-ecg.js';
import {evaluate,cprMetrics} from './evaluation-engine.js';
import {MonitorAudio} from '../cardiac/audio.js';
const END={good:['پایان مطلوب','g'],mid:['پایان نسبی','a'],bad:['پایان نامطلوب','r']};
const fmt=s=>{s=Math.max(0,Math.floor(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
const $=(r,s)=>r.querySelector(s);
export class ScenarioEngine{
 constructor(ctrl,store){this.ctrl=ctrl;this.store=store}
 async mount(root){this.root=root;this.d=await (await fetch('data/scenarios.json')).json();this.menu()}
 _clean(){clearInterval(this.tick);clearInterval(this.metro);this.ac?.abort();this.ac=null;this.audio?.dispose();this.audio=null;this.mini?.dispose();this.mini=null}
 now(){return this.endT??(performance.now()-this.t0)/1000}
 menu(){this._clean();const h=this.store.get('emsDone',{});
  this.root.innerHTML=`<div class="wrap"><h2>شبیه‌ساز مأموریت اورژانس</h2><p class="note warn">${this.d.disclaimer}</p><div class="cards">${this.d.scenarios.map(s=>`<button class="card" data-id="${s.id}"><b>${s.title}</b><span>${s.pt}</span><small>${s.cc}</small>${h[s.id]!=null?`<em>بهترین امتیاز: ${h[s.id]}٪</em>`:''}</button>`).join('')}</div></div>`;
  this.root.onclick=e=>{const b=e.target.closest('.card');if(b)this.start(b.dataset.id)}}
 start(id){this._clean();this.sc=this.d.scenarios.find(s=>s.id===id);this.log=[];this.ev=[];this.node='n1';this.endT=null;this.t0=performance.now();
  this.cpr={on:false,cyc:0,alerted:false};this.arrestAt=null;this.taps=[];this.audio=new MonitorAudio();this.ac=new AbortController();
  this.root.innerHTML=`<div class="wrap"><button id="back">بازگشت به فهرست</button><h2>${this.sc.title}</h2><p>${this.sc.pt} — ${this.sc.cc}</p>
  <div class="panel cprp"><div class="cp"><small>زمان مأموریت</small><b id="clk">00:00</b></div>
   <div class="cp"><small>چرخهٔ ۲ دقیقه‌ای CPR</small><b id="cyc">—</b><button id="chk" hidden>بررسی ریتم انجام شد</button></div>
   <div class="cp"><small>فشردن قفسه سینه</small><button id="cprbtn" class="primary">شروع CPR</button></div>
   <div class="cp"><small>ریتم فشردن شما (هدف ۱۰۰–۱۲۰ در دقیقه)</small><div class="tapw"><i id="dot"></i><b id="rate">—</b></div><button id="tap">ثبت فشردن (Space)</button></div></div>
  <div class="panel"><div class="cw" dir="ltr"><canvas></canvas></div><div id="vit" class="note"></div></div><div class="panel" id="step"></div></div>`;
  const R=this.root;this.mini=new MiniEcg($(R,'canvas'),this.ctrl);R.onclick=null;
  $(R,'#back').onclick=()=>this.menu();$(R,'#cprbtn').onclick=()=>this.toggleCpr();$(R,'#tap').onclick=()=>this.tap();
  $(R,'#chk').onclick=()=>{const n=this.now();this.ev.push({t:n,k:'chk'});this.cpr.cyc=n;this.cpr.alerted=false;$(R,'#chk').hidden=true;$(R,'#cyc').classList.remove('r')};
  document.addEventListener('keydown',e=>{if(e.code==='Space'&&!['BUTTON','SELECT','INPUT','TEXTAREA'].includes(e.target.tagName)&&this.endT==null){e.preventDefault();this.tap()}},{signal:this.ac.signal});
  this.tick=setInterval(()=>this.update(),200);this.show()}
 update(){const R=this.root,n=this.now();$(R,'#clk').textContent=fmt(n);const cyc=$(R,'#cyc');
  if(this.cpr.on){const rem=120-(n-this.cpr.cyc);if(rem>0)cyc.textContent=fmt(rem);else{cyc.textContent='زمان بررسی ریتم!';cyc.classList.add('r');$(R,'#chk').hidden=false;
    if(!this.cpr.alerted){this.cpr.alerted=true;this.audio?.tone(1200,.3,.12)}}}else cyc.textContent='—';
  const now=performance.now();this.taps=this.taps.filter(t=>now-t<5000);if(this.taps.length<3||now-this.taps.at(-1)>3000){$(R,'#rate').textContent='—';$(R,'#rate').className=''}}
 tap(){const now=performance.now();this.taps.push(now);this.taps=this.taps.slice(-8);const dot=$(this.root,'#dot');dot.classList.add('f');setTimeout(()=>dot.classList.remove('f'),90);
  if(this.taps.length>=3){const d=[];for(let i=1;i<this.taps.length;i++)d.push(this.taps[i]-this.taps[i-1]);const r=Math.round(60000/(d.reduce((a,b)=>a+b,0)/d.length)),el=$(this.root,'#rate');
   el.textContent=r+(r<100?' (آهسته)':r>120?' (سریع)':' ✓');el.className=r>=100&&r<=120?'g':'a'}}
 toggleCpr(){const n=this.now(),b=$(this.root,'#cprbtn');
  if(!this.cpr.on){this.cpr.on=true;this.cpr.cyc=n;this.cpr.alerted=false;this.ev.push({t:n,k:'cpr',on:true});this.audio.enable();this.startMetro();b.textContent='توقف CPR';b.classList.remove('primary');b.classList.add('danger')}
  else{this.cpr.on=false;this.ev.push({t:n,k:'cpr',on:false});clearInterval(this.metro);b.textContent='شروع CPR';b.classList.add('primary');b.classList.remove('danger')}}
 startMetro(){clearInterval(this.metro);const dot=$(this.root,'#dot');
  this.metro=setInterval(()=>{this.audio?.tone(880,.05,.08);dot.classList.add('f');setTimeout(()=>dot.classList.remove('f'),90)},60000/110)}
 show(){const n=this.sc.nodes[this.node],st=$(this.root,'#step');
  if(n.end)return this.finish(n,st);
  if(n.p==='absent'&&this.arrestAt==null)this.arrestAt=this.now();
  this.mini.setRhythm(n.r);
  $(this.root,'#vit').innerHTML=`${n.v} · <b class="${n.p==='present'?'g':'r'}">${n.p==='present'?'نبض دارد':'بدون نبض'}</b> (علائم و ECG فرضی/مصنوعی)`;
  st.innerHTML=`<p>${n.x}</p>${n.o.map((o,i)=>`<button class="opt" data-i="${i}">${o[0]}</button>`).join('')}`;
  st.onclick=e=>{const b=e.target.closest('.opt');if(!b)return;const o=n.o[+b.dataset.i],t=this.now();this.log.push({t:o[0],score:o[2],fb:o[3],at:t});this.ev.push({t,k:'dec',txt:o[0],score:o[2]});
   st.innerHTML=`<p><b>${o[0]}</b></p><p class="${o[2]===2?'g':o[2]?'a':'r'}">${o[3]}</p><button id="next" class="primary">ادامه</button>`;
   st.querySelector('#next').onclick=()=>{this.node=o[1];this.show()}}}
 finish(n,st){this.endT=this.now();if(this.cpr.on){this.ev.push({t:this.endT,k:'cpr',on:false});this.cpr.on=false;clearInterval(this.metro)}clearInterval(this.tick);
  const ev=evaluate(this.log,n.end),m=cprMetrics(this.ev,this.endT,this.arrestAt),[lab,c]=END[n.end];this.save(ev,m);
  const row=e=>`<li><span class="en">${fmt(e.t)}</span> — ${e.k==='dec'?`<span class="${e.score===2?'g':e.score?'a':'r'}">${e.txt}</span>`:e.k==='chk'?'<span class="cyan">بررسی ریتم / تعویض فشاردهنده</span>':e.on?'<span class="cyan">شروع CPR</span>':'<span class="cyan">توقف CPR</span>'}</li>`;
  const fr=m.arrest?Math.round(m.fraction*100):null;
  const cards=`<div class="stats"><div class="panel stat"><small>زمان کل</small><div class="num">${fmt(this.endT)}</div></div><div class="panel stat"><small>مدت CPR</small><div class="num cyan">${fmt(m.total)}</div></div>
   ${m.arrest?`<div class="panel stat"><small>کسر CPR (از شروع ایست)</small><div class="num ${fr>=80?'g':fr>=60?'a':'r'}">${fr.toLocaleString('fa-IR')}٪</div><span>هدف آموزشی: بالا (معمولاً ≥۶۰٪ و ترجیحاً ≥۸۰٪)</span></div>
   <div class="panel stat"><small>تأخیر تا شروع CPR</small><div class="num ${m.delay==null?'r':m.delay<=10?'g':'a'}">${m.delay==null?'انجام نشد':fmt(m.delay)}</div><span>${m.pauses} بار قطع و شروع مجدد</span></div>`:`<div class="panel stat"><small>ایست قلبی</small><div class="num" style="font-size:1.1rem">در این مسیر رخ نداد</div></div>`}</div>`;
  st.innerHTML=`<h3 class="${c}" style="font-size:1.2rem;margin-top:0">${lab}</h3><p>${n.x}</p><p><b>امتیاز تصمیم‌ها: ${ev.pct}٪</b> (${ev.grade})</p>${cards}
   <h3>خط زمانی اقدامات</h3><ol>${[...this.ev].sort((a,b)=>a.t-b.t).map(row).join('')}</ol><h3>بازخورد تصمیم‌ها</h3><ol>${this.log.map(l=>`<li><b>${l.t}</b><br><span class="${l.score===2?'g':l.score?'a':'r'}">${l.fb}</span></li>`).join('')}</ol>
   ${ev.weak.length?`<p class="note">برای مرور: ${ev.weak.length} تصمیم بهینه نبود.</p>`:''}<div class="row"><button id="again" class="primary">اجرای مجدد</button><button id="menu">فهرست سناریوها</button><button id="print">چاپ / ذخیرهٔ PDF</button></div>`;
  st.querySelector('#again').onclick=()=>this.start(this.sc.id);st.querySelector('#menu').onclick=()=>this.menu();st.querySelector('#print').onclick=()=>window.print()}
 save(ev,m){const h=this.store.get('emsDone',{});h[this.sc.id]=Math.max(h[this.sc.id]||0,ev.pct);this.store.set('emsDone',h);
  const runs=this.store.get('emsRuns',[]);runs.push({id:this.sc.id,pct:ev.pct,time:Math.round(this.endT),cpr:m.arrest?Math.round(m.fraction*100):null,at:Date.now()});this.store.set('emsRuns',runs.slice(-30));
  this.store.set('lastActivity',{type:'ems',scenario:this.sc.id,at:Date.now()})}
 unmount(){this._clean();this.root.onclick=null;this.root.innerHTML=''}
}

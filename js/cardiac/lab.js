import {EcgEngine,LEADS} from './ecg-engine.js';
import {mechanics} from './cardiac-engine.js';
import {Heart3D,MODEL_PATH} from './heart-3d.js';
import {summary,lockedPulseless} from './hemodynamics.js';
import {MonitorAudio} from './audio.js';
import {shockOutcome,JOULES,CAPTURE_MA} from './defib.js';
import {ISCH_INFO} from './ecg-engine.js';
const $=(r,s)=>r.querySelector(s);
const SHOCK={shockable:['قابل شوک','red'],none:['غیرقابل شوک','amber'],depends:['بسته به نبض/پایداری','cyan']};
export class CardiacLab{
 constructor(ctrl,store){this.ctrl=ctrl;this.store=store}
 async mount(root){
  this.root=root;this.ac=new AbortController();const sig={signal:this.ac.signal};
  this.data=await (await fetch('data/rhythms.json')).json();this.cfg=await (await fetch('data/config.json')).json().catch(()=>({}));
  this.ecg=new EcgEngine();this.audio=new MonitorAudio();this.lastBeep=0;this.lastAlarm=0;this.o={speed:25,gain:10,amp:1,lead:'II',artifact:false,sim:1,paused:false,back:0};
  this.vit={pulse:'present',sys:'',dia:'',spo2:'',rr:'',stab:'stable',cons:'alert',perf:'adequate'};
  root.innerHTML=`<div class="lab">
  <aside class="panel" id="picker"><h2>کتابخانهٔ ریتم</h2></aside>
  <section class="panel heart"><div class="ph"><h2>قلب سه‌بعدی</h2><div class="row">
   <button data-v="front">قدامی</button><button data-v="back">خلفی</button><button data-v="top">فوقانی</button><button id="flow" aria-pressed="false">جریان خون</button></div></div>
   <div id="h3d"></div><p class="note" id="modelnote">مدل آناتومیک واقعی هنوز تهیه نشده است. شکل نمایش‌داده‌شده یک مدل شبیه‌سازی‌شدهٔ موقت است (طبیعی‌تر از قبل ولی هنوز آناتومیک واقعی نیست). فایل مدل را در <code dir="ltr">${MODEL_PATH}</code> قرار دهید.</p>
   <div id="partinfo" class="note">برای دیدن اطلاعات، روی یک بخش از قلب کلیک کنید.</div></section>
  <section class="panel ecgp"><div class="ph"><h2>مانیتور ECG <span class="hr" id="hr">HR —</span></h2>
   <div class="row"><button id="pause">توقف</button><button id="reset">بازنشانی</button><button id="sound" aria-pressed="false">صدای مانیتور</button><button id="twelve" aria-pressed="false">نمای ۱۲ لید</button><button id="save">ذخیرهٔ نوار ۱۰ ثانیه‌ای</button></div></div>
   <div class="cw" dir="ltr"><canvas id="ecg"></canvas></div>
   <div class="ctl">
    <label>سرعت<select id="speed"><option>12.5</option><option selected>25</option><option>50</option></select>mm/s</label>
    <label>Gain<select id="gain"><option>5</option><option selected>10</option><option>20</option></select>mm/mV</label>
    <label>لید<select id="lead">${Object.keys(LEADS).map(l=>`<option ${l==='II'?'selected':''}>${l}</option>`).join('')}</select></label>
    <label>دامنه<input type="range" id="amp" min=".5" max="2" step=".1" value="1"></label>
    <label>سرعت شبیه‌سازی<input type="range" id="sim" min=".25" max="2" step=".25" value="1"></label>
    <label><input type="checkbox" id="art"> آرتیفکت/نویز</label>
    <label id="scrubw" hidden>مرور نوار قبلی<input type="range" id="scrub" min="0" max="30" step=".5" value="0"></label></div>
   <p class="note">ECG مصنوعی و آموزشی است، نه نوار واقعی بیمار. هر ۱۲ لید با مورفولوژی تقریبی و آموزشی ساخته می‌شوند؛ الگوهای ST فقط به‌صورت آموزشی و انتخابی نمایش داده می‌شوند و محور واقعی بیمار شبیه‌سازی نمی‌شود. صدای مانیتور (بیپ QRS و آلارم ایست) پس از فعال‌کردن دکمهٔ «صدای مانیتور» پخش می‌شود.</p></section>
  <section class="panel vit"><h2>علائم حیاتی</h2><div class="tiles" id="tiles"></div>
   <div class="form"><label>وضعیت نبض<select id="pulse"><option value="present">نبض‌دار</option><option value="absent">بدون نبض</option></select></label>
    <label>پایداری<select id="stab"><option value="stable">پایدار</option><option value="unstable">ناپایدار</option></select></label>
    <label>فشار سیستولیک<input type="number" id="sys" min="0" max="300"></label><label>فشار دیاستولیک<input type="number" id="dia" min="0" max="200"></label>
    <label>SpO₂ %<input type="number" id="spo2" min="0" max="100"></label><label>تعداد تنفس<input type="number" id="rr" min="0" max="80"></label>
    <label>هوشیاری<select id="cons"><option value="alert">هوشیار</option><option value="verbal">پاسخ به صدا</option><option value="pain">پاسخ به درد</option><option value="unresp">بدون پاسخ</option></select></label>
    <label>پرفیوژن<select id="perf"><option value="adequate">مناسب</option><option value="poor">ضعیف</option><option value="none">ناکافی/صفر</option></select></label></div>
   <p class="note">مقادیر فشار، SpO₂ و تنفس را شما وارد می‌کنید؛ برنامه برای ریتم‌ها عدد قطعی نمی‌سازد. برون‌ده قلبی: مدل آموزشی معتبر پیاده‌سازی نشده است.</p></section>
  <section class="panel dev"><div class="ph"><h2>دفیبریلاتور، پیس و ایسکمی</h2><span class="badge cyan" id="devstate">آماده</span></div>
   <div class="devgrid">
    <div class="devcol"><h3>شوک</h3>
     <label>حالت<select id="dmode"><option value="defib">دفیبریلاسیون (غیرهمزمان)</option><option value="sync">کاردیوورژن همزمان (SYNC)</option></select></label>
     <label>انرژی (ژول)<select id="djoule">${JOULES.map(j=>`<option ${j===150?'selected':''}>${j}</option>`).join('')}</select></label>
     <label class="chk"><input type="checkbox" id="dclear"> «همه کنار» اعلام شد</label>
     <div class="row"><button id="dcharge">شارژ</button><button id="dshock" class="danger" disabled>شوک</button><button id="ddis">تخلیهٔ داخلی</button></div>
     <div class="bar"><i id="dbar" style="width:0"></i></div>
     <p class="note">انرژی را طبق دستگاه و پروتکل انتخاب کنید. برای شوک باید ابتدا شارژ و سپس «همه کنار» را تأیید کنید.</p></div>
    <div class="devcol"><h3>پیس ترانس‌کوتانئوس</h3>
     <label>ضربان پیس: <b id="prv">70</b> ppm<input type="range" id="prate" min="40" max="120" step="5" value="70"></label>
     <label>جریان خروجی: <b id="pov">0</b> mA<input type="range" id="pout" min="0" max="140" step="5" value="0"></label>
     <div class="row"><button id="ppace" aria-pressed="false">شروع پیس</button></div>
     <p class="note" id="pnote">با جریان صفر پیس اسپایک ندارد. جریان را بالا ببرید و دنبال اسپایک همراه QRS پهن (capture) بگیرید؛ بعد نبض را کنترل کنید.</p></div>
    <div class="devcol"><h3>الگوی ایسکمی (۱۲ لید)</h3>
     <select id="isch"><option value="">بدون تغییر ST</option><option value="inf">صعود ST — تحتانی</option><option value="ant">صعود ST — قدامی</option><option value="lat">صعود ST — جانبی</option><option value="dep">افسردگی ST — ایسکمی</option></select>
     <p class="note" id="ischn">یک الگو را انتخاب کنید؛ نمای ۱۲ لید خودکار فعال می‌شود. لیدهای دارای صعود قرمز و دارای افسردگی آبی علامت می‌خورند.</p></div>
   </div><div class="devlog" id="dlog"><small>گزارش اقدامات دستگاه اینجا ثبت می‌شود.</small></div></section>
   <section class="panel info" id="info"></section></div>`;
  this._picker();this._bind(sig);this._ecgCanvas(sig);
  this.heart=new Heart3D($(root,'#h3d'),i=>{if(i?.glb)$(root,'#modelnote').textContent='مدل آناتومیک واقعی بارگذاری شد: BodyParts3D، © ۲۰۰۸ Life Science Integrated Database Center، مجوز CC BY-SA 2.1 Japan (پردازش‌شده). انیمیشن به‌صورت تغییر شکل (انقباض بطن‌ها با چرخش ظریف و انقباض دهلیزها) روی همان مش یکپارچه اجرا می‌شود؛ مرز دهلیز/بطن تقریبی است و حفره‌ها مش جدا ندارند.';else if(i!==undefined)$(root,'#partinfo').innerHTML=i?`<b>${i.fa}</b> <span dir="ltr">${i.en}</span><br>${i.desc}`:'برای دیدن اطلاعات، روی یک بخش از قلب کلیک کنید.'},!!this.cfg.heartModel);
  this.stop=this.ctrl.add(dt=>this._tick(dt));
  this.select(this.store.get('lastRhythm','nsr'));}
 _picker(){const el=$(this.root,'#picker');for(const [c,name] of Object.entries(this.data.categories)){
   el.insertAdjacentHTML('beforeend',`<h3>${name}</h3>`+this.data.rhythms.filter(r=>r.cat===c).map(r=>`<button class="rb s-${r.shock}" data-id="${r.id}"><b>${r.fa}</b><span dir="ltr">${r.en}</span></button>`).join(''))}}
 _bind(sig){const R=this.root,o=this.o,v=this.vit;
  R.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
   if(b.dataset.id)this.select(b.dataset.id);else if(b.dataset.v)this.heart.view(b.dataset.v);
   else if(b.id==='pause'){o.paused=!o.paused;b.textContent=o.paused?'ادامه':'توقف';$(R,'#scrubw').hidden=!o.paused;if(!o.paused){o.back=0;$(R,'#scrub').value=0}}
   else if(b.id==='flow'){this.flowOn=!this.flowOn;this.heart.setFlow(this.flowOn);b.setAttribute('aria-pressed',this.flowOn);b.classList.toggle('on',this.flowOn)}else if(b.id==='sound'){const on=b.getAttribute('aria-pressed')!=='true';on?this.audio.enable():this.audio.disable();b.setAttribute('aria-pressed',on);b.classList.toggle('on',on);this.lastBeep=this.ecg.t}else if(b.id==='twelve'){o.twelve=!o.twelve;b.classList.toggle('on',o.twelve);b.setAttribute('aria-pressed',o.twelve);this.fit()}else if(b.id==='reset'){this.ecg.reset();o.back=0}else if(b.id==='save')this._save()},sig);
  const on=(id,fn,ev='input')=>$(R,'#'+id).addEventListener(ev,e=>fn(e.target),sig);
  on('speed',t=>o.speed=+t.value,'change');on('gain',t=>o.gain=+t.value,'change');on('lead',t=>o.lead=t.value,'change');
  on('amp',t=>o.amp=+t.value);on('sim',t=>o.sim=+t.value);on('art',t=>o.artifact=t.checked,'change');on('scrub',t=>o.back=+t.value);this._devBind(R,sig);
  for(const k of ['pulse','stab','sys','dia','spo2','rr','cons','perf'])on(k,t=>{v[k]=t.value;this._vitals()});}
 select(id){const r=this.data.rhythms.find(x=>x.id===id)||this.data.rhythms[0];this.cur=r;this.store.set('lastRhythm',r.id);
  this.store.set('lastActivity',{type:'cardiac-lab',rhythm:r.id,at:Date.now()});
  this.ecg.setRhythm(r.id);this.lastBeep=this.ecg.t;const lock=lockedPulseless(r.id),ps=$(this.root,'#pulse');
  if(lock)this.vit.pulse='absent';else if(this._wasLock)this.vit.pulse='present';this._wasLock=lock;ps.value=this.vit.pulse;ps.disabled=lock;
  this.root.querySelectorAll('.rb').forEach(b=>b.classList.toggle('on',b.dataset.id===r.id));
  const [sl,sc]=SHOCK[r.shock];
  $(this.root,'#info').innerHTML=`<h2>${r.fa} <span dir="ltr" class="en">${r.en}</span></h2><span class="badge ${sc}">${sl}</span>
   <dl>${[['ضربان',r.rate],['نظم',r.reg],['موج P',r.p],['فاصلهٔ PR',r.pr],['عرض QRS',r.qrs],['موج T',r.t],['توضیح',r.desc],['نکتهٔ تشخیصی',r.tip],['اهمیت بالینی',r.clinical],['نکات فوریت',r.ems],['وضعیت مکانیکی',r.mech],['نبض',r.pulse]].map(([a,b])=>`<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>
   <p class="note">اقدامات درمانی را طبق پروتکل مصوب سازمان خود و آخرین ویرایش AHA/ERC تطبیق دهید. دوز دارویی در این نسخه درج نشده است. ابزار آموزشی است و جایگزین آموزش عملی یا دستور پزشک نیست.</p>`;
  this._vitals();}
 _vitals(){const s=summary(this.vit),hr=this._hr,T=[['HR (از ECG)',hr==null?'—':hr,''],['BP',s.bp,''],['MAP',s.map,''],['SpO₂',s.spo2,''],['RR',s.rr,''],
   ['نبض',s.pulse?'دارد':'ندارد',s.pulse?'g':'r'],['پرفیوژن',{adequate:'مناسب',poor:'ضعیف',none:'ناکافی'}[this.vit.perf],this.vit.perf==='adequate'?'g':'r'],
   ['هوشیاری',{alert:'هوشیار',verbal:'پاسخ به صدا',pain:'پاسخ به درد',unresp:'بدون پاسخ'}[this.vit.cons],this.vit.cons==='alert'?'g':'a'],
   ['پایداری',this.vit.stab==='stable'?'پایدار':'ناپایدار',this.vit.stab==='stable'?'g':'r']];
  $(this.root,'#tiles').innerHTML=T.map(([a,b,c])=>`<div class="tile ${c}"><small>${a}</small><b>${b}</b></div>`).join('')}
 _ecgCanvas(sig){const cv=$(this.root,'#ecg'),wrap=cv.parentElement;this.cv=cv;this.ctx=cv.getContext('2d');
  const fit=()=>{const d=Math.min(devicePixelRatio,2),w=wrap.clientWidth,h=this.o.twelve?Math.max(360,Math.round(w*.55)):Math.max(180,Math.round(w*.32));cv.width=w*d;cv.height=h*d;cv.style.height=h+'px';this.ctx.setTransform(d,0,0,d,0,0);this.W=w;this.H=h};
  this.fit=fit;fit();this.ro=new ResizeObserver(fit);this.ro.observe(wrap);}
 _tick(dt){const o=this.o;if(!o.paused)this.ecg.advance(dt*o.sim);
  if(!o.paused&&this.audio.on)this._sound();const now=this.ecg.t-o.back;this.ecg[o.twelve?'render12':'render'](this.ctx,this.W,this.H,{pxmm:4,speed:o.speed,gain:o.gain,amp:o.amp,lead:o.lead,artifact:o.artifact,sync:this.sync,now});
  this._flash();this.heart.update(mechanics(this.ecg,this.vit.pulse==='present'),dt);
  this._acc=(this._acc||0)+dt;if(this._acc>.4){this._acc=0;const hr=this.ecg.rate(),r=this.cur.id;this._hr=r==='vf'?'—':r==='asystole'?0:hr;
   $(this.root,'#hr').textContent='HR '+(this._hr??'—');this._vitals()}}
 _sound(){const t=this.ecg.t;for(const e of this.ecg.events)if((e.k==='N'||e.k==='W'||e.k==='V')&&e.t>this.lastBeep&&e.t<=t){if(this.vit.pulse==='present'||this.cur.id==='pea')this.audio.beep();else this.audio.beep()}
  this.lastBeep=t;const id=this.cur.id,al=id==='vf'||id==='asystole'||id==='pea'||(id==='vt'&&this.vit.pulse==='absent');
  if(al&&t-this.lastAlarm>2){this.lastAlarm=t;this.audio.alarm()}}
 
 _devBind(R,sig){const q=s=>R.querySelector(s);this.dev={state:'idle',mode:'defib'};this.dlog=[];this.sync=false;this.paceOn=false;this.flashUntil=0;
  q('#dmode').addEventListener('change',e=>{this.dev.mode=e.target.value;this.sync=e.target.value==='sync'},sig);
  q('#dclear').addEventListener('change',()=>this._devUI(),sig);
  q('#dcharge').addEventListener('click',()=>this._charge(),sig);
  q('#ddis').addEventListener('click',()=>this._disarm('تخلیهٔ داخلی انجام شد'),sig);
  q('#dshock').addEventListener('click',()=>this._shock(),sig);
  q('#prate').addEventListener('input',()=>this._pace(),sig);q('#pout').addEventListener('input',()=>this._pace(),sig);
  q('#ppace').addEventListener('click',e=>{this.paceOn=!this.paceOn;e.currentTarget.setAttribute('aria-pressed',this.paceOn);e.currentTarget.textContent=this.paceOn?'توقف پیس':'شروع پیس';this._pace(true)},sig);
  q('#isch').addEventListener('change',e=>this._isch(e.target.value),sig);this._devUI()}
 _devUI(){const q=s=>this.root.querySelector(s),st=this.dev.state;
  q('#dcharge').disabled=st!=='idle';q('#dshock').disabled=!(st==='ready'&&q('#dclear').checked);
  q('#devstate').textContent={idle:'آماده',charging:'در حال شارژ…',ready:'شارژ شد'}[st];q('#devstate').className='badge '+(st==='ready'?'red':'cyan')}
 _log(t){const m=Math.floor(this.ecg.t/60),s=Math.floor(this.ecg.t%60),ts=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  this.dlog.unshift(`<div><span class="en">${ts}</span> — ${t}</div>`);this.dlog=this.dlog.slice(0,6);this.root.querySelector('#dlog').innerHTML=this.dlog.join('')}
 _charge(){if(this.dev.state!=='idle')return;this.dev.state='charging';this._devUI();const t0=performance.now(),bar=this.root.querySelector('#dbar');
  if(this.audio.on)this.audio.tone(500,.4,.08);
  this.chTimer=setInterval(()=>{const p=Math.min(1,(performance.now()-t0)/2000);bar.style.width=p*100+'%';
   if(p>=1){clearInterval(this.chTimer);this.dev.state='ready';if(this.audio.on)this.audio.tone(900,.15,.1);
    this._log(`شارژ کامل شد (${this.root.querySelector('#djoule').value} ژول)`);this._devUI()}},60)}
 _disarm(msg){clearInterval(this.chTimer);if(this.dev.state!=='idle')this._log(msg);this.dev.state='idle';this.root.querySelector('#dbar').style.width='0';this.root.querySelector('#dclear').checked=false;this._devUI()}
 _shock(){const q=s=>this.root.querySelector(s);if(this.dev.state!=='ready'||!q('#dclear').checked)return;
  const mode=this.dev.mode,J=q('#djoule').value,res=shockOutcome(mode,this.cur.id,this.vit.pulse==='present');
  if(!res.fires){this._log(res.text);return}
  this.flashUntil=performance.now()+250;if(this.audio.on)this.audio.tone(140,.3,.2);
  this._log(`${res.warn?'⚠ ':''}شوک ${J} ژول (${mode==='sync'?'SYNC':'غیرهمزمان'}): ${res.text}`);
  this._disarm('');this.dlog.shift();q('#dlog').innerHTML=this.dlog.join('');
  this.store.set('lastActivity',{type:'cardiac-lab',rhythm:this.cur.id,at:Date.now()});
  if(res.to)this._applyShock(res)}
 _applyShock(res){clearTimeout(this.shockTimer);const go=()=>{this.select(res.to);if(res.pulse){this.vit.pulse=res.pulse;this.root.querySelector('#pulse').value=res.pulse}this._vitals()};
  if(res.viaAsystole){this.select('asystole');this.shockTimer=setTimeout(go,1600)}else go()}
 _pace(toggled){const q=s=>this.root.querySelector(s),rate=+q('#prate').value,out=+q('#pout').value;q('#prv').textContent=rate;q('#pov').textContent=out;
  if(this.paceOn&&out>0){this.ecg.setPace({rate,capture:out>=CAPTURE_MA});if(toggled)this._log(`پیس شروع شد: ${rate} ppm، ${out} mA`)}
  else{if(this.ecg.pace)this.ecg.setPace(null);if(toggled)this._log(this.paceOn?'پیس فعال است اما جریان صفر است (اسپایک ندارد)':'پیس متوقف شد')}}
 _isch(v){this.ecg.isch=v||null;this.root.querySelector('#ischn').textContent=v?ISCH_INFO[v]+' (الگوی آموزشی؛ معیار تشخیصی دقیق را از مرجع بگیرید.)':'یک الگو را انتخاب کنید؛ نمای ۱۲ لید خودکار فعال می‌شود.';
  if(v&&!this.o.twelve)this.root.querySelector('#twelve').click()}
 _flash(){const n=performance.now();if(n<this.flashUntil){this.ctx.fillStyle=`rgba(255,255,255,${.75*(this.flashUntil-n)/250})`;this.ctx.fillRect(0,0,this.W,this.H)}}
 _save(){const w=10*this.o.speed*4,h=Math.round(w*.35),c=document.createElement('canvas'),d=2;c.width=w*d;c.height=h*d;const x=c.getContext('2d');x.scale(d,d);
  this.ecg.render(x,w,h,{pxmm:4,speed:this.o.speed,gain:this.o.gain,amp:this.o.amp,lead:this.o.lead,artifact:this.o.artifact,now:this.ecg.t-this.o.back});
  const a=document.createElement('a');a.download=`ecg-${this.cur.id}-10s.png`;a.href=c.toDataURL('image/png');a.click()}
 unmount(){clearTimeout(this.shockTimer);clearInterval(this.chTimer);this.audio?.dispose();this.stop?.();this.ac?.abort();this.ro?.disconnect();this.heart?.dispose();this.root.innerHTML=''}
}

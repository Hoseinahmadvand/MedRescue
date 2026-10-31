import {EcgEngine} from './cardiac/ecg-engine.js';
const TASKS={
 pr:{rh:['nsr','brady','av1','tachy'],q:'فاصلهٔ PR را اندازه بگیرید: از ابتدای موج P تا ابتدای QRS (ضربان علامت‌گذاری‌شده).',tol:.04,speed:50,info:'محدودهٔ آموزشی PR: ۰٫۱۲ تا ۰٫۲۰ ثانیه. بیشتر از ۰٫۲۰ و ثابت یعنی بلوک درجه یک.'},
 qrs:{rh:['nsr','brady','pvc'],q:'عرض QRS ضربان علامت‌گذاری‌شده را اندازه بگیرید (از ابتدای Q/R تا انتهای S).',tol:.03,speed:50,info:'QRS باریک: کمتر از حدود ۰٫۱۲ ثانیه. ضربان زودرس بطنی (PVC) پهن‌تر است.'},
 hr:{rh:['nsr','brady','tachy','svt'],q:'فاصلهٔ دو R متوالی (علامت‌گذاری‌شده) را اندازه بگیرید؛ ضربان از روی آن حساب می‌شود.',tol:.04,speed:25,info:'ضربان = ۶۰ تقسیم بر فاصلهٔ R-R (ثانیه)؛ یا ۳۰۰ تقسیم بر تعداد خانه‌های بزرگ بین دو R.'}};
const isQ=e=>e.k==='N'||e.k==='W';
// هدف اندازه‌گیری و مقدار مرجع (بر پایهٔ تعریف موج مصنوعی) را از رویدادهای نوار انتخاب می‌کند
export function pickTarget(task,events,lo,hi,rnd=Math.random){
 const Q=events.filter(e=>isQ(e)&&e.t>lo+.25&&e.t<hi-.25),pick=a=>a[Math.floor(rnd()*a.length)];
 if(task==='pr'){const c=Q.filter(e=>e.k==='N').map(q=>({q,p:events.find(p=>p.k==='P'&&p.t<q.t-.05&&p.t>q.t-.6)})).filter(x=>x.p&&x.p.t-.07>lo+.05);
  if(!c.length)return null;const x=pick(c);return{from:x.p.t-.07,to:x.q.t-.045,marks:[x.q.t]}}
 if(task==='qrs'){const w=Q.filter(e=>e.k==='W'&&!e.paced),pool=w.length?w:Q.filter(e=>e.k==='N');if(!pool.length)return null;const e=pick(pool);
  return e.k==='W'?{from:e.t-.07,to:e.t+.13,marks:[e.t]}:{from:e.t-.045,to:e.t+.05,marks:[e.t]}}
 if(task==='hr'){const R=events.filter(e=>isQ(e)&&e.t>lo+.1&&e.t<hi-.1);if(R.length<2)return null;const i=Math.floor(rnd()*(R.length-1));return{from:R[i].t,to:R[i+1].t,marks:[R[i].t,R[i+1].t]}}
 return null}
const $=(r,s)=>r.querySelector(s),fa=n=>n.toLocaleString('fa-IR');
export class Calipers{
 constructor(ctrl,store){this.store=store}
 async mount(root){this.root=root;this.ac=new AbortController();const g={signal:this.ac.signal};
  root.innerHTML=`<div class="wrap" style="max-width:1100px"><h2>تمرین فاصله‌سنجی (Calipers)</h2>
  <div class="panel form1"><label>تمرین<select id="ctask"><option value="pr">فاصلهٔ PR</option><option value="qrs">عرض QRS</option><option value="hr">ضربان از R-R</option></select></label><button id="cnew" class="primary">نمونهٔ جدید</button><span class="note" id="cst"></span></div>
  <div class="panel"><p id="cq"></p><div class="cwrap" dir="ltr" id="cwrap"><canvas id="cc"></canvas><div class="band" id="cband" hidden></div><div id="cmarks"></div>
   <div class="cal" id="c1"><i></i></div><div class="cal" id="c2"><i></i></div></div>
   <div class="row" style="margin-top:12px;align-items:center"><b id="cdt">—</b><button id="cchk" class="primary">بررسی اندازه‌گیری</button></div><div id="cres"></div></div>
  <p class="note">دو خط را بکشید. هر خانهٔ کوچک ۰٫۰۴ ثانیه و هر خانهٔ بزرگ ۰٫۲ ثانیه است. ECG مصنوعی است و مقدار مرجع بر پایهٔ تعریف همین موج‌ها محاسبه می‌شود؛ با تلورانس یک خانهٔ کوچک ارزیابی می‌کنیم.</p></div>`;
  $(root,'#ctask').addEventListener('change',()=>this.sample(),g);$(root,'#cnew').addEventListener('click',()=>this.sample(),g);$(root,'#cchk').addEventListener('click',()=>this.check(),g);
  for(const id of ['c1','c2'])this.drag($(root,'#'+id),g);
  this.W=0;this.ro=new ResizeObserver(()=>{const w=$(root,'#cwrap').clientWidth;if(Math.abs(w-this.W)>30)this.sample()});this.ro.observe($(root,'#cwrap'));this.stats();this.sample()}
 drag(el,g){el.style.touchAction='none';el.addEventListener('pointerdown',e=>{el.setPointerCapture(e.pointerId);el._d=true},g);
  el.addEventListener('pointermove',e=>{if(!el._d)return;const r=$(this.root,'#cwrap').getBoundingClientRect();el.style.left=Math.max(0,Math.min(this.W,e.clientX-r.left))+'px';this.readout()},g);
  el.addEventListener('pointerup',()=>el._d=false,g)}
 xs(){return[parseFloat($(this.root,'#c1').style.left)||0,parseFloat($(this.root,'#c2').style.left)||0]}
 dt(){const [a,b]=this.xs();return Math.abs(b-a)/this.pps}
 readout(){const d=this.dt(),t=this.task;$(this.root,'#cdt').textContent=`${fa(Math.round(d*1000))} میلی‌ثانیه (${fa(+(d/.04).toFixed(1))} خانهٔ کوچک)`+(t==='hr'&&d>0?` ← ضربان ≈ ${fa(Math.round(60/d))}`:'')}
 sample(){const R=this.root,t=$(R,'#ctask').value,T=TASKS[t],wrap=$(R,'#cwrap'),cv=$(R,'#cc');this.task=t;this.W=wrap.clientWidth||600;
  const H=190,pxmm=4,pps=pxmm*T.speed;let e,tg=null,now,lo;
  for(let k=0;k<14&&!tg;k++){const id=T.rh[Math.floor(Math.random()*T.rh.length)];e=new EcgEngine();e.setRhythm(id);for(let i=0;i<700;i++)e.advance(.02);now=e.t-.3;lo=now-this.W/pps;tg=pickTarget(t,e.events,lo,now)}
  const d=Math.min(devicePixelRatio,2);cv.width=this.W*d;cv.height=H*d;cv.style.width=this.W+'px';cv.style.height=H+'px';const ctx=cv.getContext('2d');ctx.setTransform(d,0,0,d,0,0);
  e.render(ctx,this.W,H,{pxmm,speed:T.speed,gain:10,amp:1,lead:'II',artifact:false,now});
  this.pps=pps;this.t0=lo;this.tg=tg;this.rid=e.rhythmId;
  $(R,'#cq').textContent=T.q;$(R,'#cres').innerHTML='';$(R,'#cband').hidden=true;
  $(R,'#cmarks').innerHTML=(tg?.marks||[]).map(m=>`<div class="mk" style="left:${(m-lo)*pps}px">▼</div>`).join('');
  $(R,'#c1').style.left=this.W*.3+'px';$(R,'#c2').style.left=this.W*.5+'px';this.readout()}
 check(){const R=this.root,T=TASKS[this.task],tg=this.tg;if(!tg)return;const truth=tg.to-tg.from,u=this.dt(),diff=u-truth,ok=Math.abs(diff)<=T.tol;
  const b=$(R,'#cband');b.hidden=false;b.style.left=(tg.from-this.t0)*this.pps+'px';b.style.width=truth*this.pps+'px';
  const hr=this.task==='hr'?`<br>ضربان مرجع ≈ ${fa(Math.round(60/truth))} در دقیقه؛ ضربان شما ≈ ${u>0?fa(Math.round(60/u)):'—'}.`:'';
  $(R,'#cres').innerHTML=`<p class="${ok?'g':'a'}"><b>${ok?'درست اندازه گرفتید ✓':'کمی فاصله دارد'}</b> — مقدار مرجع ${fa(Math.round(truth*1000))} ms، اندازه‌گیری شما ${fa(Math.round(u*1000))} ms (${diff>=0?'+':''}${fa(Math.round(diff*1000))} ms).${hr}</p><p class="note">${T.info} ناحیهٔ سبز محدودهٔ مرجع را نشان می‌دهد.</p>`;
  const s=this.store.get('caliperStats',{n:0,ok:0});s.n++;if(ok)s.ok++;this.store.set('caliperStats',s);this.store.set('lastActivity',{type:'calipers',at:Date.now()});this.stats()}
 stats(){const s=this.store.get('caliperStats',{n:0,ok:0});$(this.root,'#cst').textContent=s.n?`دقت شما: ${fa(s.ok)} از ${fa(s.n)} اندازه‌گیری درست`:''}
 unmount(){this.ac?.abort();this.ro?.disconnect();this.root.innerHTML=''}
}

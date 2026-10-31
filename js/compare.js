import {MiniEcg} from './cardiac/mini-ecg.js';
import {LEADS} from './cardiac/ecg-engine.js';
const ROWS=[['rate','ضربان'],['reg','نظم'],['p','موج P'],['pr','فاصلهٔ PR'],['qrs','عرض QRS'],['t','موج T'],['shock','قابل شوک؟'],['mech','وضعیت مکانیکی'],['pulse','نبض'],['tip','نکتهٔ تشخیصی']];
const SH={shockable:'قابل شوک',none:'غیرقابل شوک',depends:'بسته به نبض/پایداری'};
function stats(e){const t=e.t,q=e.events.filter(x=>(x.k==='N'||x.k==='W'||x.k==='V')&&x.t<=t&&x.t>t-10).map(x=>x.t),p=e.events.filter(x=>x.k==='P'&&x.t<=t&&x.t>t-10).length;
 if(q.length<3)return{hr:e.rhythmId==='asystole'?'۰':'—',cv:null,ratio:p&&q.length?`${p}:${q.length}`:p?`P بدون QRS`:'—'};
 const rr=q.slice(1).map((v,i)=>v-q[i]),m=rr.reduce((a,b)=>a+b,0)/rr.length,sd=Math.sqrt(rr.reduce((a,b)=>a+(b-m)**2,0)/rr.length);
 return{hr:Math.round(60/m),cv:sd/m,ratio:p?`${p}:${q.length}`:'بدون P مشخص'}}
export class Compare{
 constructor(ctrl){this.ctrl=ctrl}
 async mount(root){this.root=root;this.R=(await (await fetch('data/rhythms.json')).json()).rhythms;this.o={speed:25,gain:10,lead:'II',paused:false};
  const opt=id=>this.R.map(r=>`<option value="${r.id}" ${r.id===id?'selected':''}>${r.fa} — ${r.en}</option>`).join('');
  root.innerHTML=`<div class="wrap" style="max-width:1100px"><h2>مقایسهٔ دو ریتم</h2>
  <div class="panel form1"><label>ریتم A<select id="a">${opt('nsr')}</select></label><label>ریتم B<select id="b">${opt('af')}</select></label>
  <label>سرعت (mm/s)<select id="sp"><option>12.5</option><option selected>25</option><option>50</option></select></label>
  <label>Gain<select id="gn"><option>5</option><option selected>10</option><option>20</option></select></label>
  <label>لید<select id="ld">${Object.keys(LEADS).map(l=>`<option ${l==='II'?'selected':''}>${l}</option>`).join('')}</select></label><button id="ps">توقف</button></div>
  <div class="panel"><b id="la"></b><div class="cw" dir="ltr"><canvas id="ca"></canvas></div><b id="lb"></b><div class="cw" dir="ltr"><canvas id="cb"></canvas></div>
  <p class="note">هر دو نوار با یک سرعت، گین و لید و همزمان رسم می‌شوند. ECGها مصنوعی و آموزشی‌اند.</p></div>
  <h3>تفاوت‌ها</h3><div id="diff"></div></div>`;
  const q=s=>root.querySelector(s);this.A=new MiniEcg(q('#ca'),this.ctrl,this.o);this.B=new MiniEcg(q('#cb'),this.ctrl,this.o);
  this.ac=new AbortController();const g={signal:this.ac.signal};
  q('#a').addEventListener('change',()=>this.upd(),g);q('#b').addEventListener('change',()=>this.upd(),g);
  q('#sp').addEventListener('change',e=>this.o.speed=+e.target.value,g);q('#gn').addEventListener('change',e=>this.o.gain=+e.target.value,g);q('#ld').addEventListener('change',e=>this.o.lead=e.target.value,g);
  q('#ps').addEventListener('click',e=>{this.o.paused=!this.o.paused;e.target.textContent=this.o.paused?'ادامه':'توقف'},g);
  this.upd();this.timer=setInterval(()=>this.measured(),1000)}
 upd(){const q=s=>this.root.querySelector(s),a=this.R.find(r=>r.id===q('#a').value),b=this.R.find(r=>r.id===q('#b').value);this.ra=a;this.rb=b;
  this.A.setRhythm(a.id);this.B.setRhythm(b.id);q('#la').textContent=`A: ${a.fa} (${a.en})`;q('#lb').textContent=`B: ${b.fa} (${b.en})`;
  const val=(r,k)=>k==='shock'?SH[r.shock]:r[k];
  q('#diff').innerHTML=`<table class="cmp"><thead><tr><th></th><th>A</th><th>B</th></tr></thead><tbody>`+ROWS.map(([k,l])=>{const x=val(a,k),y=val(b,k);return`<tr class="${x!==y?'d':''}"><th>${l}</th><td>${x}</td><td>${y}</td></tr>`}).join('')+`<tr id="mrow"></tr></tbody></table><p class="note">ردیف‌های رنگی یعنی دو ریتم در آن ویژگی تفاوت دارند. بخش «اندازه‌گیری زنده» از همان ECG در حال نمایش محاسبه می‌شود.</p><div id="live" class="panel"></div>`;
  this.measured()}
 measured(){const el=this.root?.querySelector('#live');if(!el)return;const x=stats(this.A.e),y=stats(this.B.e);
  const reg=s=>s.cv==null?'—':s.cv<.06?'منظم':s.cv<.15?'کمی نامنظم':'نامنظم';
  const pc=s=>s.cv==null?'—':(s.cv*100).toFixed(0)+'٪';
  const notes=[];
  if(x.cv!=null&&y.cv!=null&&(x.cv<.06)!==(y.cv<.06))notes.push(`نظم R-R: A ${reg(x)}، B ${reg(y)}.`);
  if(x.ratio!==y.ratio)notes.push(`نسبت P:QRS در ۱۰ ثانیهٔ اخیر: A ${x.ratio}، B ${y.ratio}.`);
  if(x.hr!==y.hr)notes.push(`ضربان اندازه‌گیری‌شده: A ${x.hr}، B ${y.hr}.`);
  el.innerHTML=`<b>اندازه‌گیری زنده (۱۰ ثانیهٔ اخیر)</b><table class="cmp"><tbody><tr><th></th><th>A</th><th>B</th></tr><tr><th>ضربان</th><td>${x.hr}</td><td>${y.hr}</td></tr><tr><th>نظم R-R (ضریب تغییرات)</th><td>${reg(x)} (${pc(x)})</td><td>${reg(y)} (${pc(y)})</td></tr><tr><th>نسبت P:QRS</th><td>${x.ratio}</td><td>${y.ratio}</td></tr></tbody></table>${notes.length?`<ul>${notes.map(n=>`<li>${n}</li>`).join('')}</ul>`:''}`}
 unmount(){clearInterval(this.timer);this.ac?.abort();this.A?.dispose();this.B?.dispose();this.root.innerHTML=''}
}

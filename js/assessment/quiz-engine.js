import {MiniEcg} from '../cardiac/mini-ecg.js';
const POOL={1:['nsr','brady','tachy','af','vf','asystole'],2:['nsr','brady','tachy','af','flutter','svt','pvc','vt','vf','asystole','av1','av3'],3:null};
const sh=a=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(x=>x[1]);
export class QuizEngine{
 constructor(ctrl,store){this.ctrl=ctrl;this.store=store}
 async mount(root){this.root=root;this.R=(await (await fetch('data/rhythms.json')).json()).rhythms;this.Q=(await (await fetch('data/questions.json')).json()).questions;this.menu()}
 menu(){this.mini?.dispose();this.mini=null;clearInterval(this.tm);const H=this.store.get('quizHistory',[]);
  this.root.innerHTML=`<div class="wrap"><h2>مرکز ارزیابی</h2><div class="panel form1"><label>نوع آزمون<select id="type"><option value="rhythm">تشخیص ریتم (ECG)</option><option value="arrest">ایست قلبی و احیا</option><option value="ecg">تفسیر ECG (متنی)</option><option value="clin">تصمیم بالینی</option><option value="mixed">ترکیبی</option></select></label>
  <label>سطح<select id="lvl"><option value="1">مبتدی</option><option value="2">متوسط</option><option value="3">پیشرفته</option></select></label>
  <label>تعداد سؤال<select id="cnt"><option>5</option><option selected>10</option></select></label>
  <label><input type="checkbox" id="timed"> زمان‌دار (۳۰ ثانیه برای هر سؤال)</label><button id="go">شروع آزمون</button></div>
  <h3>تاریخچه</h3>${H.length?`<ul>${H.slice(-8).reverse().map(h=>`<li>${new Date(h.at).toLocaleString('fa-IR')} — ${h.type}، سطح ${h.lvl}: ${h.pct}٪</li>`).join('')}</ul>`:'<p class="note">هنوز آزمونی ثبت نشده است.</p>'}</div>`;
  this.root.querySelector('#go').onclick=()=>this.begin({type:this.root.querySelector('#type').value,lvl:+this.root.querySelector('#lvl').value,n:+this.root.querySelector('#cnt').value,timed:this.root.querySelector('#timed').checked})}
 build(c){const items=[];const pool=POOL[c.lvl]||this.R.map(r=>r.id);
  const mkR=()=>{const id=sh(pool)[0],r=this.R.find(x=>x.id===id);const same=sh(this.R.filter(x=>x.id!==id&&x.cat===r.cat&&pool.includes(x.id)));
   const rest=sh(this.R.filter(x=>x.id!==id&&!same.includes(x)&&pool.includes(x)));const opts=sh([r,...[...same,...rest].slice(0,3)]);
   return{kind:'r',id,r,opts,a:opts.indexOf(r),e:`${r.fa}: ${r.tip} ${r.desc}`}};
  const mkQ=()=>{const cat=['ecg','clin'].includes(c.type)?c.type:'arrest';let qs=this.Q.filter(q=>q.lvl<=c.lvl&&(q.cat||'arrest')===cat);if(!qs.length)qs=this.Q;return{kind:'q',...sh(qs)[0]}};
  for(let i=0;i<c.n;i++)items.push(c.type==='rhythm'?mkR():c.type==='mixed'?(i%2?mkQ():mkR()):mkQ());return items}
 begin(c){this.c=c;this.items=this.build(c);this.i=0;this.ans=[];this.ask()}
 ask(){clearInterval(this.tm);this.mini?.dispose();this.mini=null;if(this.i>=this.items.length)return this.finish();
  const q=this.items[this.i];this.root.innerHTML=`<div class="wrap"><div class="note">سؤال ${this.i+1} از ${this.items.length} <b id="tm"></b></div>
  ${q.kind==='r'?`<h3>این ریتم کدام است؟ (نام ریتم عمداً پنهان است)</h3><div class="panel"><div class="cw" dir="ltr"><canvas></canvas></div></div>`:`<h3>${q.q}</h3>`}
  <div id="opts">${(q.kind==='r'?q.opts.map(o=>`${o.fa} (${o.en})`):q.o).map((o,i)=>`<button class="opt" data-i="${i}">${o}</button>`).join('')}</div><div id="fb"></div></div>`;
  if(q.kind==='r'){this.mini=new MiniEcg(this.root.querySelector('canvas'),this.ctrl);this.mini.setRhythm(q.id)}
  this.root.querySelector('#opts').onclick=e=>{const b=e.target.closest('.opt');if(b)this.pick(+b.dataset.i)};
  if(this.c.timed){let s=30;const el=this.root.querySelector('#tm');el.textContent=`— ${s}s`;this.tm=setInterval(()=>{s--;el.textContent=`— ${s}s`;if(s<=0)this.pick(-1)},1000)}}
 pick(i){clearInterval(this.tm);const q=this.items[this.i],ok=i===q.a;this.ans.push({q,i,ok});
  this.root.querySelectorAll('.opt').forEach((b,k)=>{b.disabled=true;if(k===q.a)b.classList.add('right');else if(k===i)b.classList.add('wrong')});
  this.root.querySelector('#fb').innerHTML=`<p class="${ok?'g':'r'}">${i<0?'زمان تمام شد.':ok?'درست.':'نادرست.'}</p><p>${q.e}</p><button id="nx">${this.i+1<this.items.length?'سؤال بعدی':'نتیجه'}</button>`;
  this.root.querySelector('#nx').onclick=()=>{this.i++;this.ask()}}
 finish(){const ok=this.ans.filter(a=>a.ok).length,pct=Math.round(ok/this.ans.length*100),H=this.store.get('quizHistory',[]);
  H.push({at:Date.now(),type:this.c.type,lvl:this.c.lvl,pct});this.store.set('quizHistory',H.slice(-50));this.store.set('lastActivity',{type:'quiz',at:Date.now()});
  const wrong=this.ans.filter(a=>!a.ok),conf={};const W=this.store.get('weakRhythms',{});wrong.forEach(a=>{if(a.q.kind==='r'){const k=a.q.r.fa;conf[k]=(conf[k]||0)+1;W[k]=(W[k]||0)+1}});this.ans.filter(a=>a.ok&&a.q.kind==='r').forEach(a=>{const k=a.q.r.fa;if(W[k]>0&&--W[k]<=0)delete W[k]});this.store.set('weakRhythms',W);
  this.root.innerHTML=`<div class="wrap"><h2>نتیجه: ${pct}٪ (${ok} از ${this.ans.length})</h2>
  ${wrong.length?`<h3>تحلیل اشتباهات</h3>${Object.keys(conf).length?`<p>ریتم‌هایی که باید مرور کنید: <b>${Object.keys(conf).join('، ')}</b></p>`:''}<ul>${wrong.map(a=>`<li><b>${a.q.kind==='r'?a.q.r.fa:a.q.q}</b><br>${a.q.e}</li>`).join('')}</ul>`:'<p class="g">بدون اشتباه!</p>'}
  <button id="re">آزمون جدید</button></div>`;this.root.querySelector('#re').onclick=()=>this.menu()}
 unmount(){clearInterval(this.tm);this.mini?.dispose();this.root.innerHTML=''}
}

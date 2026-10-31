import {RHYTHM_GEN} from './rhythm-library.js';
const g=(t,m,s,a)=>{const x=(t-m)/s;return Math.abs(x)>5?0:a*Math.exp(-.5*x*x)};
const TAU=Math.PI*2,sig=x=>1/(1+Math.exp(-x));
const F={I:.5,II:1,III:.5,aVR:-.87,aVL:.1,aVF:.87};
const fl=k=>({p:k,q:k,r:k,s:k,t:k,w:k,b:k});
// ضریب تصویر محور ۶۰° روی لیدهای فرونتال و مورفولوژی تقریبی لیدهای V (آموزشی)
export const LEADS={...Object.fromEntries(Object.entries(F).map(([n,k])=>[n,fl(k)])),
 V1:{p:.5,q:0,r:.25,s:2.5,t:.3,w:-.8,b:1.2},V2:{p:.5,q:0,r:.5,s:2,t:.6,w:-.7,b:1},V3:{p:.5,q:0,r:.8,s:1.2,t:.8,w:-.3,b:1},
 V4:{p:.6,q:.3,r:1.2,s:.6,t:.9,w:.3,b:1},V5:{p:.7,q:.5,r:1.3,s:.2,t:.8,w:.7,b:1},V6:{p:.7,q:.6,r:1.1,s:.1,t:.7,w:.8,b:1}};
export const LEAD_ORDER=[['I','aVR','V1','V4'],['II','aVL','V2','V5'],['III','aVF','V3','V6']];
// الگوهای آموزشی ST (mV، فقط نمایشی؛ اعداد معیار تشخیصی نیستند)
export const ISCH={
 inf:{II:.25,III:.35,aVF:.3,I:-.1,aVL:-.2},
 ant:{V1:.12,V2:.3,V3:.32,V4:.25,aVL:.08,I:.05,III:-.08,aVF:-.06},
 lat:{I:.2,aVL:.25,V5:.2,V6:.22,III:-.15,aVF:-.1,V1:-.06,V2:-.06},
 dep:{V3:-.12,V4:-.18,V5:-.2,V6:-.16,II:-.1,aVF:-.08}};
export const ISCH_INFO={
 inf:'صعود ST در II، III و aVF با تغییر متقابل (افسردگی ST) در I و aVL؛ الگوی انفارکتوس تحتانی.',
 ant:'صعود ST در V1 تا V4 (و کمی I/aVL) با تغییر متقابل خفیف در لیدهای تحتانی؛ الگوی انفارکتوس قدامی.',
 lat:'صعود ST در I، aVL، V5 و V6 با تغییر متقابل در III و aVF؛ الگوی انفارکتوس جانبی.',
 dep:'افسردگی ST در لیدهای V3 تا V6 و تحتانی؛ الگوی ایسکمی بدون صعود ST (مثلاً مشکوک به NSTE-ACS).'};
const BASE={
 none:()=>0, flat:t=>.004*Math.sin(TAU*.3*t),
 af:t=>.035*(Math.sin(TAU*6.1*t)+.8*Math.sin(TAU*9.7*t+1.3)+.6*Math.sin(TAU*13.9*t+.4))*(1+.5*Math.sin(TAU*.7*t)),
 flutter:t=>.17*(.5-((t%.2)/.2)),
 vf:t=>.8*(.7*Math.sin(TAU*4.3*t+.5*Math.sin(TAU*.4*t))+.6*Math.sin(TAU*6.1*t+1)+.5*Math.sin(TAU*3.1*t+2))*(.6+.4*Math.sin(TAU*.23*t+1))
};
const isQrs=e=>e.k==='N'||e.k==='W'||e.k==='V';
function shape(e,t,L,st){
 const d=t-e.t;if(d<-.4||d>.7)return 0;
 if(e.k==='P')return L.p*g(t,e.t,.04,.13);
 if(e.k==='N'){const a=e.a||1,tt=e.tt||.22;
  const stw=st?st*(sig((t-e.t-.035)/.012)-sig((t-e.t-tt-.03)/.03)):0;
  return a*(L.q*g(t,e.t-.025,.009,-.12)+L.r*g(t,e.t,.011,1)+L.s*g(t,e.t+.025,.011,-.22))+L.t*g(t,e.t+tt,.055,.3)*(1+Math.max(st||0,0)*2)+stw}
 if(e.k==='W')return L.w*(g(t,e.t,.035,.9)+g(t,e.t+.08,.04,-.35)+g(t,e.t+.3,.08,-.35));
 if(e.k==='V')return L.w*(g(t,e.t,.055,1)+g(t,e.t+.13,.06,-.45));
 return 0}
export class EcgEngine{
 constructor(){this.t=0;this.events=[];this.segs=[];this.pace=null;this.isch=null;this.setRhythm('nsr')}
 setRhythm(id){this.rhythmId=id;this.gen=RHYTHM_GEN[id];this.state={t:this.t,n:0};
  this.events=this.events.filter(e=>e.t<this.t);this.segs.push({from:this.t,base:this.gen.base})}
 reset(){this.t=0;this.events=[];this.segs=[];this.setRhythm(this.rhythmId)}
 // پیس: {rate:ppm, capture:bool} یا null. بدون capture فقط اسپایک دیده می‌شود.
 setPace(c){this.events=this.events.filter(e=>e.t<=this.t);this.state={t:this.t+.05,n:0};
  this.pace=c?{rate:c.rate,capture:!!c.capture,next:this.t+.3}:null}
 advance(dt){this.t+=dt;this._fill(this.t+.8);this.events=this.events.filter(e=>e.t>this.t-45);
  this.segs=this.segs.filter((s,i,a)=>!a[i+1]||a[i+1].from>this.t-45)}
 _fill(upTo){const P=this.pace,push=e=>{if(P?.capture&&isQrs(e)&&!e.paced)return;this.events.push(e)};
  while(this.state.t<upTo)this.gen.step(this.state,push);
  if(P)while(P.next<upTo){this.events.push({k:'S',t:P.next});if(P.capture)this.events.push({k:'W',t:P.next+.025,paced:true});P.next+=60/P.rate}
  this.events.sort((a,b)=>a.t-b.t)}
 baseAt(t){let b='none';for(const s of this.segs){if(s.from<=t)b=s.base;else break}return BASE[b](t)}
 rate(){const n=Math.min(6,this.t);if(n<1.5)return null;const c=this.events.filter(e=>isQrs(e)&&e.t<=this.t&&e.t>this.t-n).length;
  if(this.gen.base==='vf')return null;return Math.round(c*60/n)}
 stFor(lead){return this.isch?(ISCH[this.isch][lead]||0):0}
 render(ctx,w,h,o){const {pxmm,speed,gain,amp,lead,artifact,now}=o;
  ctx.fillStyle='#051410';ctx.fillRect(0,0,w,h);
  ctx.lineWidth=1;ctx.strokeStyle='rgba(53,214,176,.075)';ctx.beginPath();
  for(let x=0;x<=w;x+=pxmm){ctx.moveTo(x+.5,0);ctx.lineTo(x+.5,h)}for(let y=0;y<=h;y+=pxmm){ctx.moveTo(0,y+.5);ctx.lineTo(w,y+.5)}ctx.stroke();
  ctx.strokeStyle='rgba(53,214,176,.19)';ctx.beginPath();
  for(let x=0;x<=w;x+=pxmm*5){ctx.moveTo(x+.5,0);ctx.lineTo(x+.5,h)}for(let y=0;y<=h;y+=pxmm*5){ctx.moveTo(0,y+.5);ctx.lineTo(w,y+.5)}ctx.stroke();
  const pps=pxmm*speed,t0=now-w/pps,ev=this.events.filter(e=>e.t>t0-.8&&e.t<now+.8);
  const L=LEADS[lead]||LEADS.II,st=this.stFor(lead),sc=gain*pxmm*amp,mid=h/2;
  ctx.strokeStyle='#35D6B0';ctx.lineWidth=1.6;ctx.lineJoin='round';ctx.beginPath();
  for(let x=0;x<=w;x++){const t=t0+x/pps;let v=this.baseAt(t)*L.b;for(const e of ev)v+=shape(e,t,L,st);
   if(artifact)v+=.08*Math.sin(TAU*.25*t)+(((Math.sin(t*437.1)*43758.5453)%1)-.5)*.06;
   const y=mid-v*sc;x?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();
  for(const e of ev){const x=(e.t-t0)*pps;if(x<-5||x>w+5)continue;
   if(e.k==='S'){ctx.strokeStyle='#EAF2F8';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x,mid-24);ctx.lineTo(x,mid+24);ctx.stroke()}
   else if(o.sync&&isQrs(e)){ctx.fillStyle='#F5BD70';ctx.beginPath();ctx.moveTo(x,9);ctx.lineTo(x-4.5,0);ctx.lineTo(x+4.5,0);ctx.closePath();ctx.fill()}}}
 render12(ctx,W,H,o){const cols=LEAD_ORDER[0].length,rows=LEAD_ORDER.length,cw=W/cols,ch=H/rows;
  LEAD_ORDER.forEach((row,r)=>row.forEach((ld,c)=>{ctx.save();ctx.translate(c*cw,r*ch);ctx.beginPath();ctx.rect(0,0,cw,ch);ctx.clip();
   this.render(ctx,cw,ch,{...o,lead:ld});const s=this.stFor(ld);ctx.fillStyle=s>.08?'#FF6474':s<-.08?'#78B7FF':'#EAF2F8';ctx.font='bold 12px sans-serif';ctx.fillText(ld,6,14);ctx.restore()}))}
}

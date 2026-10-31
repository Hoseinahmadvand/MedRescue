// موتور مکانیکی: از رویدادهای ECG با تأخیر فیزیولوژیک، دامنهٔ انقباض دهلیز/بطن را می‌سازد.
const ATRIAL_MODE={af:'quiver',flutter:'flutter',svt:'weak',vt:'none',vf:'none',asystole:'none',pea:'none'};
const env=(tau,dur)=>{if(tau<=0||tau>=dur)return 0;const x=tau/dur;return x<.35?Math.sin(Math.PI/2*x/.35):Math.pow(Math.cos(Math.PI/2*(x-.35)/.65),2)};
export function mechanics(ecg,pulse){
 const t=ecg.t,id=ecg.rhythmId,mode=ATRIAL_MODE[id]||'normal';let a=0,v=0;
 for(const e of ecg.events){
  if(e.t>t||e.t<t-.6)continue;
  if(e.k==='P'&&mode==='normal')a=Math.max(a,env(t-e.t-.05,.12));
  else if(e.k==='N'||e.k==='W'||e.k==='V'){
   let amp=e.k==='N'?1:e.k==='W'?.7:.6;                 // N طبیعی، W پهن/PVC، V = VT
   if(!pulse)amp=id==='pea'?.08:.12;                    // بدون نبض: انقباض الکتریکی ≠ پمپاژ مؤثر
   v=Math.max(v,amp*env(t-e.t-.05,.3));}                // تأخیر الکترومکانیکی ≈ ۵۰ms
 }
 if(mode==='quiver')a=.05*Math.abs(Math.sin(t*38)+Math.sin(t*53));
 if(mode==='flutter')a=.07*Math.abs(Math.sin(t*Math.PI*5));
 if(mode==='weak'&&v>0)a=.3*v;
 return{atrial:a,vent:v,chaos:id==='vf'?1:0,asys:id==='asystole'};
}

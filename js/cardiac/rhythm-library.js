// مولدهای رویداد برای هر ریتم. انواع رویداد: P (دهلیزی)، N (QRS باریک)، W (QRS پهن بطنی)، V (کمپلکس VT)
// base: نوع خط پایه (none|af|flutter|vf|flat). تمام شکل‌ها مصنوعی و آموزشی‌اند.
const r=Math.random;
const tt=rr=>.24*Math.sqrt(rr);
function sinus(hr,pr){return{base:'none',step(s,push){const rr=60/hr*(1+(r()-.5)*.03);push({k:'P',t:s.t});push({k:'N',t:s.t+pr,tt:tt(rr)});s.t+=rr}}}
export const RHYTHM_GEN={
 nsr:sinus(75,.16), brady:sinus(46,.17), tachy:sinus(125,.13), av1:sinus(70,.33),
 af:{base:'af',step(s,push){const rr=.35+r()*.55;push({k:'N',t:s.t,tt:tt(rr),a:.8+r()*.35});s.t+=rr}},
 flutter:{base:'flutter',step(s,push){push({k:'N',t:s.t,tt:.12});s.t+=.4}},
 svt:{base:'none',step(s,push){push({k:'N',t:s.t,tt:.1});s.t+=60/180}},
 pvc:{base:'none',step(s,push){const rr=.8;
   if(s.n%4===3){push({k:'W',t:s.t-.35*rr});push({k:'P',t:s.t});s.t+=rr}
   else{push({k:'P',t:s.t});push({k:'N',t:s.t+.16,tt:tt(rr)});s.t+=rr}s.n++}},
 vt:{base:'none',step(s,push){push({k:'V',t:s.t});s.t+=60/170}},
 vf:{base:'vf',step(s){s.t+=.5}},
 asystole:{base:'flat',step(s){s.t+=.5}},
 pea:{base:'none',step(s,push){const rr=1.3+r()*.1;push({k:'W',t:s.t});s.t+=rr}},
 mob1:{base:'none',step(s,push){const rr=.75,pr=[.16,.25,.34][s.n%4];push({k:'P',t:s.t});if(s.n%4<3)push({k:'N',t:s.t+pr,tt:tt(rr)});s.t+=rr;s.n++}},
 mob2:{base:'none',step(s,push){const rr=.8;push({k:'P',t:s.t});if(s.n%3!==2)push({k:'N',t:s.t+.18,tt:tt(rr)});s.t+=rr;s.n++}},
 av3:{base:'none',step(s,push){if(s.ta===undefined){s.ta=s.t;s.tv=s.t+.35}
   if(s.ta<=s.tv){push({k:'P',t:s.ta});s.ta+=.75}else{push({k:'W',t:s.tv});s.tv+=1.6}s.t=Math.min(s.ta,s.tv)}}
};

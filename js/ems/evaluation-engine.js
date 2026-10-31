export function evaluate(log,endKind){
 const max=log.length*2,got=log.reduce((a,l)=>a+l.score,0),pct=max?Math.round(got/max*100):0;
 const weak=log.filter(l=>l.score<2);
 return{pct,got,max,endKind,weak,grade:pct>=85?'عالی':pct>=60?'قابل‌قبول':'نیازمند مرور'};
}

// معیارهای CPR از رویدادهای ثبت‌شده: ev=[{t,k:'cpr',on}] (ثانیه)
export function cprMetrics(ev,endT,arrestAt){
 const iv=[];let s=null;
 for(const e of ev){if(e.k!=='cpr')continue;if(e.on&&s===null)s=e.t;else if(!e.on&&s!==null){iv.push([s,e.t]);s=null}}
 if(s!==null)iv.push([s,endT]);
 const total=iv.reduce((a,[x,y])=>a+(y-x),0);
 if(arrestAt==null)return{total,iv,arrest:false};
 const dur=Math.max(.001,endT-arrestAt),inArr=iv.filter(([x,y])=>y>arrestAt);
 const time=inArr.reduce((a,[x,y])=>a+(y-Math.max(x,arrestAt)),0);
 return{total,iv,arrest:true,arrestDur:dur,fraction:Math.min(1,time/dur),delay:inArr.length?Math.max(0,inArr[0][0]-arrestAt):null,pauses:Math.max(0,inArr.length-1)};
}

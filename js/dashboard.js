const NAMES={calipers:'فاصله‌سنجی','cardiac-lab':'آزمایشگاه قلب',ems:'شبیه‌ساز اورژانس',quiz:'آزمون'};
const I=p=>`<svg viewBox="0 0 24 24">${p}</svg>`;
const BEAT='h40 q6-10 12 0 h14 l5 6 6-44 6 52 5-14 h28 q10-16 20 0 h30';
export class Dashboard{
 constructor(ctrl,store){this.s=store}
 async mount(root){this.root=root;const s=this.s,ems=s.get('emsDone',{}),H=s.get('quizHistory',[]),la=s.get('lastActivity'),weak=s.get('weakRhythms',{});
  let total=7;try{total=(await (await fetch('data/scenarios.json')).json()).scenarios.length}catch{}
  const done=Object.keys(ems).length,avg=H.length?Math.round(H.reduce((a,h)=>a+h.pct,0)/H.length):null,pct=Math.round(done/total*100);
  const wk=Object.entries(weak).sort((a,b)=>b[1]-a[1])[0];
  let sug=['با آزمایشگاه قلب شروع کنید و ریتم‌های پایه را روی ECG ببینید.','lab','ورود به آزمایشگاه'];
  if(done<total)sug=[`${total-done} سناریوی اورژانس باقی مانده است؛ تصمیم‌گیری شاخه‌ای را تمرین کنید.`,'ems','شروع سناریو'];
  if(wk)sug=[`ریتم «${wk[0]}» بیشتر از بقیه اشتباه شده؛ در آزمایشگاه مرورش کنید.`,'lab','مرور در آزمایشگاه'];
  else if(avg!==null&&avg<70)sug=['میانگین آزمون‌ها زیر ۷۰٪ است؛ آزمون تشخیص ریتم را تکرار کنید.','quiz','شروع آزمون'];
  else if(done>=total&&avg===null)sug=['سناریوها کامل شد؛ حالا آزمون تشخیص ریتم را امتحان کنید.','quiz','شروع آزمون'];
  const nf=n=>n.toLocaleString('fa-IR'),go=(h,t,d,ic)=>`<a class="card go" href="#${h}">${I(ic)}<b>${t}</b><span>${d}</span></a>`;
  root.innerHTML=`<div class="wrap" style="max-width:1280px">
  <section class="hero"><div class="hero-in"><span class="chip chip-blue">آموزش فوریت‌های پزشکی</span>
   <h2>MedRescue <em>3D</em></h2><p>ECG زنده، قلب سه‌بعدی، سناریوهای تصمیم‌گیری و آزمون؛ یک آزمایشگاه تعاملی برای دانشجویان و تکنسین‌های اورژانس.</p>
   <div class="hero-cta"><a class="btn primary" href="#lab">ورود به آزمایشگاه قلب</a><a class="btn" href="#ems">شروع سناریو</a></div></div>
   <svg class="ecgline" viewBox="0 0 664 120" preserveAspectRatio="none"><path d="M0 70 ${BEAT.repeat(4)}"/></svg></section>
  <div class="stats">
   <div class="panel stat"><small>سناریوهای انجام‌شده</small><div class="num cyan">${nf(done)}<span style="display:inline;font-size:1rem;color:var(--mu)"> / ${nf(total)}</span></div><div class="bar"><i style="width:${pct}%"></i></div></div>
   <div class="panel stat"><small>میانگین آزمون‌ها</small><div class="num ${avg===null?'':avg>=70?'g':'a'}">${avg===null?'—':nf(avg)+'٪'}</div><span>${nf(H.length)} آزمون ثبت‌شده</span></div>
   <div class="panel stat"><small>آخرین فعالیت</small><div class="num" style="font-size:1.25rem;padding:.55rem 0">${la?(NAMES[la.type]||la.type):'—'}</div><span>${la?new Date(la.at).toLocaleString('fa-IR'):'هنوز فعالیتی نیست'}</span></div></div>
  <div class="split"><div class="panel suggest"><h3 style="margin-top:0">تمرین پیشنهادی</h3><p>${sug[0]}</p><a class="btn primary" href="#${sug[1]}">${sug[2]}</a></div>
   <div class="panel"><h3 style="margin-top:0">یادآوری ایمنی</h3><p class="note" style="margin:0">این برنامه آموزشی است. دوز دارو و اقدامات را طبق پروتکل مصوب سازمان و آخرین ویرایش AHA/ERC تطبیق دهید.</p></div></div>
  <h3>دسترسی سریع</h3><div class="cards">
   ${go('lab','آزمایشگاه قلب','قلب ۳D، ECG و ۱۵ ریتم','<path d="M3 12h4l2-6 4 12 2-6h6"/>')}${go('ems','شبیه‌ساز اورژانس','سناریوهای شاخه‌ای','<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>')}
   ${go('compare','مقایسهٔ ریتم','دو نوار کنار هم','<rect x="3" y="4" width="8" height="16" rx="2"/><rect x="13" y="4" width="8" height="16" rx="2"/>')}${go('calipers','فاصله‌سنجی','تمرین Calipers روی ECG','<path d="M3 17 17 3l4 4L7 21z"/><path d="m8 12 2 2M11 9l2 2M14 6l2 2"/>')}${go('quiz','مرکز ارزیابی','آزمون و تحلیل خطا','<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>')}
   ${go('guide','راهنمای بالینی','۱۱ مبحث با منبع','<path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M8 7h6"/>')}</div>
  <p class="note">پیشرفت فقط روی همین مرورگر ذخیره می‌شود.</p></div>`}
 unmount(){this.root.innerHTML=''}
}

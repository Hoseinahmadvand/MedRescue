// منطق آموزشی شوک. نتایج برای آموزش ساده‌شده‌اند و تضمین بالینی نیستند.
export const JOULES=[50,70,100,120,150,200,300,360];
export const CAPTURE_MA=70; // آستانهٔ آموزشی capture در پیس
const CONVERT=['vt','svt','af','flutter'];
export function shockOutcome(mode,id,pulse){
 if(mode==='sync'){
  if(id==='vf'||id==='asystole')return{fires:false,text:'همزمان‌سازی ممکن نیست: QRS قابل تشخیصی برای SYNC وجود ندارد؛ شوک تخلیه نشد. در VF از دفیبریلاسیون غیرهمزمان استفاده کنید.'};
  if(id==='pea')return{fires:true,text:'بی‌اثر: PEA با شوک درمان نمی‌شود؛ CPR و علل برگشت‌پذیر را دنبال کنید.',to:null};
  if(CONVERT.includes(id)){
   if(id==='vt'&&!pulse)return{fires:true,text:'VT بدون نبض است؛ استفاده از SYNC مناسب نیست و تأخیر ایجاد می‌کند. غیرهمزمان (دفیبریلاسیون) را در نظر بگیرید.',to:'nsr',pulse:'present',warn:true,partial:true};
   return{fires:true,text:'کاردیوورژن همزمان موفق: تبدیل به ریتم سینوسی.',to:'nsr',pulse:'present'}}
  return{fires:true,text:'ریتم تاکی‌آریتمی نیست؛ کاردیوورژن لازم نبود و تغییری ایجاد نشد.',to:null}}
 if(id==='vf')return{fires:true,text:'دفیبریلاسیون موفق (آموزشی): ابتدا مکث کوتاه، سپس ریتم سینوسی. در واقعیت موفقیت قطعی نیست و CPR بلافاصله ادامه می‌یابد.',to:'nsr',viaAsystole:true,pulse:'present'};
 if(id==='vt'&&!pulse)return{fires:true,text:'شوک غیرهمزمان برای VT بدون نبض موفق بود (آموزشی).',to:'nsr',viaAsystole:true,pulse:'present'};
 if(id==='asystole'||id==='pea')return{fires:true,text:'ریتم غیرقابل شوک است؛ شوک بی‌اثر بود. CPR و درمان علل را ادامه دهید.',to:null};
 return{fires:true,text:'خطرناک: شوک غیرهمزمان روی ریتم دارای نبض ممکن است VF القا کند.',to:'vf',pulse:'absent',warn:true}}

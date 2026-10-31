// پایش علائم حیاتی: نبض و وضعیت ورودی مستقل از ECG هستند. هیچ عدد قطعی برای ریتم‌ها ساخته نمی‌شود؛
// اعداد فشار/SpO2/RR را کاربر (مربی) وارد می‌کند.
const LOCK_PULSELESS=['vf','asystole','pea'];
export const lockedPulseless=id=>LOCK_PULSELESS.includes(id);
export function summary(s){
 const pulse=s.pulse==='present',has=s.sys>0&&s.dia>0;
 return{pulse,bp:pulse&&has?`${s.sys}/${s.dia}`:'—',map:pulse&&has?Math.round((+s.sys+2*s.dia)/3):'—',
  spo2:pulse&&s.spo2?`${s.spo2}%`:'—',rr:s.rr?`${s.rr}`:'—'};
}

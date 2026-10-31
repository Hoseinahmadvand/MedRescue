// بیپ QRS و آلارم با WebAudio؛ فقط پس از کلیک کاربر فعال می‌شود.
export class MonitorAudio{
 constructor(){this.ctx=null;this.on=false}
 enable(){this.ctx??=new (window.AudioContext||window.webkitAudioContext)();this.ctx.resume?.();this.on=true}
 disable(){this.on=false}
 tone(f,d,g=.08,t0=0){if(!this.on||!this.ctx)return;const c=this.ctx,o=c.createOscillator(),v=c.createGain(),t=c.currentTime+t0;
  o.frequency.value=f;o.type='sine';v.gain.setValueAtTime(g,t);v.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(v).connect(c.destination);o.start(t);o.stop(t+d+.02)}
 beep(){this.tone(880,.07)}
 alarm(){this.tone(660,.12,.1);this.tone(660,.12,.1,.18);this.tone(660,.12,.1,.36)}
 dispose(){this.on=false;this.ctx?.close?.();this.ctx=null}
}

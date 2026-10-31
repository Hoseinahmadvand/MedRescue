import {EcgEngine} from './ecg-engine.js';
// ECG ساده برای شبیه‌ساز و آزمون (لید II، 25mm/s، 10mm/mV)
export class MiniEcg{
 constructor(canvas,ctrl,shared){this.o=shared||{speed:25,gain:10,lead:'II',paused:false};this.cv=canvas;this.ctx=canvas.getContext('2d');this.e=new EcgEngine();this.fit();
  this.ro=new ResizeObserver(()=>this.fit());this.ro.observe(canvas.parentElement);this.off=ctrl.add(dt=>this.tick(dt))}
 fit(){const d=Math.min(devicePixelRatio,2),w=this.cv.parentElement.clientWidth||600,h=Math.max(150,Math.round(w*.26));
  this.cv.width=w*d;this.cv.height=h*d;this.cv.style.height=h+'px';this.ctx.setTransform(d,0,0,d,0,0);this.W=w;this.H=h}
 setRhythm(id){this.e.setRhythm(id);for(let i=0;i<600;i++)this.e.advance(.02)}
 tick(dt){const o=this.o;if(!o.paused)this.e.advance(dt);this.e.render(this.ctx,this.W,this.H,{pxmm:4,speed:o.speed,gain:o.gain,amp:1,lead:o.lead,artifact:false,now:this.e.t})}
 dispose(){this.off();this.ro.disconnect()}
}

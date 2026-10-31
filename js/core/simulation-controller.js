// یک حلقهٔ rAF مشترک؛ بدون حلقهٔ تکراری. هنگام مخفی‌بودن تب مرورگر متوقف می‌شود.
export class SimulationController{
  constructor(){this.tasks=new Set();this.raf=0;this.last=0;this.running=false;
    this._vis=()=>document.hidden?this.stop():this.start();
    document.addEventListener('visibilitychange',this._vis);}
  add(fn){this.tasks.add(fn);this.start();return()=>this.tasks.delete(fn)}
  start(){if(this.running||document.hidden||!this.tasks.size)return;this.running=true;this.last=performance.now();
    const loop=n=>{if(!this.running)return;const dt=Math.min(.1,(n-this.last)/1000);this.last=n;this.tasks.forEach(f=>f(dt));this.raf=requestAnimationFrame(loop)};
    this.raf=requestAnimationFrame(loop)}
  stop(){this.running=false;cancelAnimationFrame(this.raf)}
  dispose(){this.stop();this.tasks.clear();document.removeEventListener('visibilitychange',this._vis)}
}

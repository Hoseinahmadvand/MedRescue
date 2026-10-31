import {SimulationController} from './core/simulation-controller.js';
import {StateManager} from './core/state-manager.js';
import {CardiacLab} from './cardiac/lab.js';
import {ScenarioEngine} from './ems/scenario-engine.js';
import {QuizEngine} from './assessment/quiz-engine.js';
import {Compare} from './compare.js';
import {Calipers} from './calipers.js';
import {Guide} from './guide.js';
import {Dashboard} from './dashboard.js';
const ctrl=new SimulationController(),store=new StateManager(),view=document.getElementById('view');
const MODS={calipers:()=>new Calipers(ctrl,store),compare:()=>new Compare(ctrl),dash:()=>new Dashboard(ctrl,store),guide:()=>new Guide(),lab:()=>new CardiacLab(ctrl,store),ems:()=>new ScenarioEngine(ctrl,store),quiz:()=>new QuizEngine(ctrl,store)};
let cur=null,token=0;
async function go(name){if(!MODS[name])name='dash';const t=++token;cur?.unmount();cur=null;
 document.querySelectorAll('nav [data-m]').forEach(b=>{const on=b.dataset.m===name;b.classList.toggle('on',on);if(on){document.getElementById('pagetitle').textContent=b.textContent.trim();document.getElementById('pagesub').textContent=b.dataset.sub||''}});
 const m=MODS[name]();try{await m.mount(view);if(t!==token){m.unmount();return}cur=m}
 catch(e){console.error(e);view.innerHTML=`<p class="note warn">خطا: ${e.message}. پروژه را با سرور محلی اجرا کنید (README).</p>`}}
document.querySelector('nav').addEventListener('click',e=>{const b=e.target.closest('[data-m]');if(b)location.hash=b.dataset.m});
addEventListener('hashchange',()=>go(location.hash.slice(1)));
addEventListener('pagehide',()=>{cur?.unmount();ctrl.dispose()});
go(location.hash.slice(1));

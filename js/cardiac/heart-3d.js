import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
export const MODEL_PATH='assets/models/heart.glb';
const INFO={RV:['بطن راست','Right Ventricle','خون کم‌اکسیژن را از دریچهٔ تریکوسپید گرفته و به شریان ریوی می‌فرستد.'],
 LV:['بطن چپ','Left Ventricle','ضخیم‌ترین حفره؛ خون اکسیژن‌دار را از دریچهٔ آئورت به گردش سیستمیک می‌فرستد.'],
 RA:['دهلیز راست','Right Atrium','خون وریدی را از SVC و IVC دریافت می‌کند؛ گره سینوسی-دهلیزی در آن قرار دارد.'],
 LA:['دهلیز چپ','Left Atrium','خون اکسیژن‌دار را از وریدهای ریوی دریافت می‌کند.'],
 RAA:['گوشک دهلیز راست','Right Atrial Appendage','زائدهٔ گوش‌مانند دهلیز راست.'],
 LAA:['گوشک دهلیز چپ','Left Atrial Appendage','زائدهٔ دهلیز چپ؛ در AF محل شایع تشکیل لخته است.'],
 AO:['آئورت','Aorta','شریان اصلی گردش سیستمیک.'],
 PA:['تنهٔ شریان ریوی','Pulmonary Trunk','خون بطن راست را به ریه‌ها می‌برد.'],
 SVC:['ورید اجوف فوقانی','Superior Vena Cava','خون نیمهٔ بالایی بدن را به دهلیز راست می‌آورد.'],
 IVC:['ورید اجوف تحتانی','Inferior Vena Cava','خون نیمهٔ پایینی بدن را به دهلیز راست می‌آورد.'],
 PV:['وریدهای ریوی','Pulmonary Veins','خون اکسیژن‌دار ریه را به دهلیز چپ می‌آورند.'],
 LAD:['شریان نزولی قدامی چپ','LAD','شاخهٔ اصلی کرونر چپ؛ دیوارهٔ قدامی و سپتوم را خون‌رسانی می‌کند.'],
 RCA:['شریان کرونر راست','RCA','بخش مهمی از دیوارهٔ تحتانی و راست قلب را خون‌رسانی می‌کند.'],
 FAT:['چربی اپی‌کاردی','Epicardial fat','چربی پیرامون شیار دهلیزی‌بطنی و مسیر عروق کرونر.']};
const GLB_NAMES={wall:['قلب (دیوارهٔ کامل)','Wall of heart','دیوارهٔ میوکارد و حفره‌های قلب؛ در این مدل بطن‌ها و دهلیزها یک پوستهٔ یکپارچه‌اند.'],
 aorta_ascending:INFO.AO,aorta_arch:INFO.AO,pulmonary_artery:INFO.PA,svc:INFO.SVC,ivc:INFO.IVC,pulmonary_veins:INFO.PV,
 rca:INFO.RCA,rca_marginal:INFO.RCA,rca_pib:INFO.RCA,rpl:INFO.RCA,septal_rca:INFO.RCA,lad:INFO.LAD,lcx:['شاخهٔ سیرکومفلکس چپ','Circumflex (LCx)','شاخهٔ کرونر چپ؛ دیوارهٔ جانبی/خلفی چپ را خون‌رسانی می‌کند.'],lca_stem:['ساقهٔ کرونر چپ','Left main','منشأ مشترک LAD و LCx.'],septal_lca:INFO.LAD,
 coronary_sinus:['سینوس کرونر','Coronary sinus','خون وریدی قلب را به دهلیز راست می‌ریزد.'],great_cardiac_vein:['ورید بزرگ قلبی','Great cardiac vein','ورید همراه LAD.'],middle_cardiac_vein:['ورید میانی قلبی','Middle cardiac vein','ورید همراه شاخهٔ بین‌بطنی خلفی.'],anterior_cardiac_veins:['وریدهای قدامی قلب','Anterior cardiac veins','به دهلیز راست می‌ریزند.'],
 tricuspid_valve:['دریچهٔ تریکوسپید','Tricuspid valve','بین دهلیز و بطن راست.'],mitral_valve:['دریچهٔ میترال','Mitral valve','بین دهلیز و بطن چپ.'],pulmonary_valve:['دریچهٔ ریوی','Pulmonary valve','بین بطن راست و تنهٔ ریوی.']};
const noise=(v,a)=>a*(Math.sin(v.x*3.1+1.3)*Math.sin(v.y*2.7+.4)*Math.sin(v.z*3.3+2.1))+.012*Math.sin(v.x*8+v.y*6+v.z*5);
const shapeGeo=(geo,fn)=>{const p=geo.attributes.position,v=new THREE.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const n=v.clone().normalize();fn(v);v.addScaledVector(n,noise(v,.05));p.setXYZ(i,v.x,v.y,v.z)}geo.computeVertexNormals();return geo};
export class Heart3D{
 constructor(el,onSelect,useModel=false){this.el=el;this.onSelect=onSelect;this.dead=false;this.usingGLB=false;this.U={uV:{value:0},uA:{value:0},uT:{value:.16},uJ:{value:new THREE.Vector3()}};this.sm={v:0,a:0};
  const w=el.clientWidth||400,h=el.clientHeight||300;
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setSize(w,h);
  this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;el.appendChild(this.renderer.domElement);
  this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(40,w/h,.1,100);this.camera.position.set(0,.5,6.2);
  const pm=new THREE.PMREMGenerator(this.renderer);this.envRT=pm.fromScene(new RoomEnvironment(),.04);this.scene.environment=this.envRT.texture;pm.dispose();
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);Object.assign(this.controls,{enableDamping:true,minDistance:3,maxDistance:12});this.controls.target.set(0,.4,0);
  const d=new THREE.DirectionalLight(0xfff0e6,1.6);d.position.set(3,5,6);this.scene.add(d);const rim=new THREE.DirectionalLight(0x6fb8ff,.7);rim.position.set(-4,2,-5);this.scene.add(rim);
  this.group=new THREE.Group();this.group.rotation.y=0;this.scene.add(this.group);this.meshes=[];this.vent=new THREE.Group();this.atria=new THREE.Group();this._build();
  this.ray=new THREE.Raycaster();this._ac=new AbortController();const s={signal:this._ac.signal};let dn=null;
  const c=this.renderer.domElement;c.addEventListener('pointerdown',e=>dn=[e.clientX,e.clientY],s);
  c.addEventListener('pointerup',e=>{if(dn&&Math.hypot(e.clientX-dn[0],e.clientY-dn[1])<5)this._pick(e)},s);
  this.ro=new ResizeObserver(()=>this.resize());this.ro.observe(el);if(useModel)this._tryGLB();}
 _mat(c,o={}){return new THREE.MeshPhysicalMaterial({color:c,roughness:.4,metalness:0,clearcoat:.45,clearcoatRoughness:.35,sheen:.5,sheenRoughness:.6,sheenColor:new THREE.Color(0xffb0a8),emissive:0x000000,...o})}
 _part(geo,col,key,parent,o){const m=new THREE.Mesh(geo,this._mat(col,o));m.userData.key=key;parent.add(m);this.meshes.push(m);return m}
 _build(){const LVC=0xa83a40,RVC=0x8f4a6e,ARTC=0xb8323a,VENC=0x4c63a8;
  const vg=(seg=64)=>shapeGeo(new THREE.SphereGeometry(1,seg,seg*.75),v=>{const t=(v.y+1)/2,k=Math.pow(t,.6)*.75+.25;v.x*=k;v.z*=k});
  const lv=this._part(vg(),LVC,'LV',this.vent);lv.scale.set(.66,1.2,.62);lv.position.set(.3,0,-.05);
  const rv=this._part(vg(),RVC,'RV',this.vent);rv.scale.set(.6,1.05,.46);rv.position.set(-.3,.05,.3);
  this.vent.rotation.z=.35;this.vent.position.y=-.2;this.group.add(this.vent);
  const at=(r,col,key,pos,sc)=>{const m=this._part(shapeGeo(new THREE.SphereGeometry(r,40,30),()=>{}),col,key,this.atria);m.position.set(...pos);m.scale.set(...sc);return m};
  at(.42,VENC,'RA',[-.6,.95,-.05],[1,1.1,.9]);at(.4,LVC,'LA',[.35,1.02,-.4],[1.05,.85,.9]);
  at(.2,VENC,'RAA',[-.28,1.2,.3],[1.2,.8,.7]).rotation.z=.6;at(.18,LVC,'LAA',[.62,1.12,.08],[1.3,.8,.7]).rotation.z=-.7;
  this.group.add(this.atria);this.curves=[];
  const tube=(pts,r,col,key,rev,par=this.group)=>{const c=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));if(rev!==undefined)this.curves.push({c,col,rev});return this._part(new THREE.TubeGeometry(c,40,r,16),col,key,par)};
  tube([[.1,.9,0],[.05,1.45,0],[.3,1.9,0],[.75,1.7,-.1],[.85,1.2,-.25],[.8,.5,-.3]],.19,ARTC,'AO',false);
  tube([[.55,1.82,-.05],[.7,2.25,-.05]],.07,ARTC,'AO');tube([[.35,1.93,-.02],[.3,2.3,-.02]],.06,ARTC,'AO');
  tube([[-.05,.95,.3],[0,1.35,.25],[.35,1.62,.2],[.7,1.5,.05]],.16,VENC,'PA',false);
  tube([[-.62,1.15,-.1],[-.62,2.1,-.1]],.14,VENC,'SVC',true);
  tube([[-.62,-.7,-.12],[-.62,.65,-.12]],.14,VENC,'IVC',false);
  for(const [a,b] of [[[.8,.9,-.7],[.55,.95,-.55]],[[.15,1.3,-.8],[.25,1.1,-.6]],[[-.3,1.1,-.8],[.0,1.05,-.55]],[[1.0,.55,-.4],[.7,.7,-.45]]])tube([a,b],.07,0xd05a60,'PV');
  // چربی و عروق کرونر روی سطح بطن‌ها
  this.group.updateMatrixWorld(true);const rc=new THREE.Raycaster(),tg=[this.meshes.find(m=>m.userData.key==='LV'),this.meshes.find(m=>m.userData.key==='RV')];
  const surf=(x,y)=>{rc.set(new THREE.Vector3(x,y,6),new THREE.Vector3(0,0,-1));const h=rc.intersectObjects(tg,false)[0];if(!h)return null;
   const n=h.face.normal.clone().transformDirection(h.object.matrixWorld);return this.vent.worldToLocal(h.point.clone().addScaledVector(n,.03))};
  const onS=(xy,r,col,key,par)=>{const P=xy.map(([x,y])=>surf(x,y)).filter(Boolean);if(P.length<3)return;const c=new THREE.CatmullRomCurve3(P);
   const m=new THREE.Mesh(new THREE.TubeGeometry(c,40,r,8),this._mat(col,{clearcoat:.2}));m.userData.key=key;this.vent.add(m);this.meshes.push(m)};
  const toW=(x,y)=>[x,y];onS([[-.05,.55],[.1,.3],[.25,-.1],[.4,-.5],[.5,-.85]].map(p=>toW(...p)),.04,0x8a1820,'LAD');
  onS([[-.35,.75],[-.6,.55],[-.78,.25],[-.82,-.1],[-.75,-.45]].map(p=>toW(...p)),.04,0x8a1820,'RCA');
  const fat=new THREE.Mesh(new THREE.TorusGeometry(.78,.07,10,48),this._mat(0xd9b56d,{roughness:.6,clearcoat:0,sheen:0}));fat.userData.key='FAT';fat.rotation.x=Math.PI/2-.35;fat.position.set(-.05,.6,.0);fat.scale.set(1.15,1,1);this.group.add(fat);this.meshes.push(fat);
  this._initFlow();}
 _initFlow(){this.fl=[];this.flowOn=false;this.ve=0;this.ph=0;for(const k of this.curves){const n=16,g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));
  const pt=new THREE.Points(g,new THREE.PointsMaterial({color:k.col===0xb8323a?0xffb0a8:0xa8c8ff,size:.09,depthTest:false}));pt.visible=false;pt.renderOrder=5;this.group.add(pt);this.fl.push({k,pt,n})}}
 setFlow(on){this.flowOn=on}
 _flow(m,dt){const show=this.flowOn&&!this.usingGLB;this.ve+=(m.vent-this.ve)*Math.min(1,dt*6);this.ph=(this.ph+dt*this.ve*1.4)%1;
  for(const f of this.fl){f.pt.visible=show;if(!show)continue;const a=f.pt.geometry.attributes.position;for(let i=0;i<f.n;i++){let u=(i/f.n+this.ph)%1;if(f.k.rev)u=1-u;const p=f.k.c.getPoint(u);a.setXYZ(i,p.x,p.y,p.z)}a.needsUpdate=true}}

 _patch(mat){const U=this.U;mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
  sh.vertexShader='uniform float uV;uniform float uA;uniform float uT;uniform vec3 uJ;\n'+sh.vertexShader.replace('#include <begin_vertex>',`
   vec3 transformed=vec3(position);
   {vec3 ax=normalize(vec3(0.42,-0.86,0.28));
    float wv=1.0-smoothstep(0.15,0.75,position.y);
    float wa=smoothstep(0.15,0.75,position.y)*(1.0-smoothstep(1.1,1.7,position.y));
    float h=dot(position,ax);vec3 q=position-ax*h;
    float ang=uT*uV*wv*clamp(h/1.5,-1.0,1.0);float c=cos(ang),s=sin(ang);
    vec3 qr=q*c+cross(ax,q)*s;qr*=1.0-0.11*uV*wv;h*=1.0-0.05*uV*wv;
    vec3 pv=ax*h+qr+uJ*wv;vec3 ca=vec3(0.1,1.0,-0.6);
    transformed=ca+(pv-ca)*(1.0-0.1*uA*wa);}`)};
  mat.customProgramCacheKey=()=>'heartdeform'}
 _tryGLB(){fetch(MODEL_PATH,{method:'HEAD'}).then(r=>{if(!r.ok||this.dead)return;
  new GLTFLoader().load(MODEL_PATH,gl=>{if(this.dead)return;this.group.clear();this.meshes=[];
   gl.scene.traverse(o=>{if(o.isMesh){o.material=o.material.clone();this._patch(o.material);this.meshes.push(o)}});this.group.add(gl.scene);this.usingGLB=true;this._fit(gl.scene);this.view('front');this.onSelect?.({glb:true})},undefined,()=>{})}).catch(()=>{})}
 _pick(e){const r=this.renderer.domElement.getBoundingClientRect();
  this.ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),this.camera);
  const h=this.ray.intersectObjects(this.meshes,false)[0];this.meshes.forEach(m=>m.material.emissive?.setHex(0));
  if(!h){this.onSelect?.(null);return}h.object.material.emissive?.setHex(0x1a4a66);
  const k=h.object.userData.key,i=INFO[k]||GLB_NAMES[h.object.name]||GLB_NAMES[h.object.parent?.name];this.onSelect?.(i?{fa:i[0],en:i[1],desc:i[2]}:{fa:h.object.name||'ساختار انتخاب‌شده',en:'',desc:'توضیح این ساختار در مدل ثبت نشده است.'})}
 _fit(obj){const b=new THREE.Box3().setFromObject(obj),sz=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3());
  const t=Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2));this.fit={c,d:Math.max(sz.y/(2*t),sz.x/(2*t*this.camera.aspect))*1.2+sz.z/2}}
 view(n){const f=this.fit||{c:new THREE.Vector3(0,.4,0),d:6.2},c=f.c,d=f.d;
  const P={front:[c.x,c.y,c.z+d],back:[c.x,c.y,c.z-d],top:[c.x,c.y+d,c.z+.01]}[n];this.camera.position.set(...P);this.controls.target.copy(c);this.controls.minDistance=d*.35;this.controls.maxDistance=d*2.5;this.controls.update()}
 resize(){const w=this.el.clientWidth,h=this.el.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix()}
 update(m,dt=.016){this._flow(m,dt);const j=m.chaos?(Math.random()-.5)*.06:0;
  if(this.usingGLB){const k=Math.min(1,dt*28),S=this.sm;S.v+=(m.vent-S.v)*k;S.a+=(m.atrial-S.a)*k;
   const t=performance.now()/1000;let v=S.v;
   if(m.chaos){v=.18+.14*Math.abs(Math.sin(t*17)+Math.sin(t*23+1))*.5;this.U.uJ.value.set((Math.random()-.5)*.05,(Math.random()-.5)*.05,(Math.random()-.5)*.05)}else this.U.uJ.value.set(0,0,0);
   this.U.uV.value=v;this.U.uA.value=S.a}
  else{this.vent.scale.set(1-.1*m.vent+j,1-.07*m.vent+j,1-.1*m.vent+j);this.atria.scale.setScalar(1-.14*m.atrial);}
  this.controls.update();this.renderer.render(this.scene,this.camera)}
 dispose(){this.dead=true;this._ac.abort();this.ro.disconnect();this.controls.dispose();
  this.scene.traverse(o=>{o.geometry?.dispose();const m=o.material;if(m)(Array.isArray(m)?m:[m]).forEach(x=>x.dispose())});
  this.envRT?.dispose();this.renderer.dispose();this.renderer.forceContextLoss();this.renderer.domElement.remove()}
}

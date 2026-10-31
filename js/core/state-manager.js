const KEY='medrescue3d:v1';
export class StateManager{
  constructor(){this.d={};try{this.d=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{}}
  get(k,def){return k in this.d?this.d[k]:def}
  set(k,v){this.d[k]=v;try{localStorage.setItem(KEY,JSON.stringify(this.d))}catch{}}
}

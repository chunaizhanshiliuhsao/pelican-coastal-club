// Exercise the real scene and animation with a deterministic clock; GPU rendering
// is covered separately by browser QA. Run: node tests/motion.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const THREE = require('../dist/vendor/three.min.js');
const elements = new Map();
function element(id) {
  if (!elements.has(id)) elements.set(id, {
    style:{}, dataset:{}, clientHeight:720, open:false,
    classList:{add(){},remove(){},toggle(){}},
    addEventListener(){}, setAttribute(){}, appendChild(){},
    getContext(){return {createRadialGradient(){return {addColorStop(){}}},fillRect(){}}}
  });
  return elements.get(id);
}
const cameraButtons = ['coast','follow','detail'].map(name => {const b=element(name);b.dataset.camera=name;return b;});
let nextFrame,scene;
class Renderer {
  constructor(){this.domElement=element('canvas');this.shadowMap={};this.info={render:{calls:0,triangles:0}};}
  setPixelRatio(){} setSize(){} render(s){scene=s;}
}
const sandbox={
  THREE:{...THREE,WebGLRenderer:Renderer,Clock:class {getDelta(){return .05;}}},
  document:{getElementById:element,querySelectorAll(){return cameraButtons;},createElement:element,addEventListener(){},hidden:false},
  devicePixelRatio:1,innerWidth:1280,innerHeight:720,matchMedia:()=>({matches:false}),
  requestAnimationFrame:cb=>{nextFrame=cb;},setTimeout(){},clearTimeout(){},addEventListener(){},console,Math,Date
};
sandbox.window=sandbox;
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist/app.js'),'utf8'),sandbox,{timeout:20000});
const find=name=>scene.getObjectByName(name);
const stone=find('road-pebbles-0'),hill=find('mountain-layer-2-tile-0');
assert(stone && hill,'Pebbles and mountain tiles must be present in the live scene.');
let sx=stone.position.x,hx=hill.position.x;
nextFrame();
assert(Math.abs(stone.position.x-sx+.25)<1e-8,'At 18 km/h, pebbles must retreat 0.25 m in 50 ms.');
assert(Math.abs(hill.position.x-hx+.25)<1e-8,'The distant scenery must move with the world.');
element('playButton').onclick();sx=stone.position.x;hx=hill.position.x;
for(let i=0;i<6;i++)nextFrame();
assert.equal(stone.position.x,sx,'Pause must stop the pebbles.');assert.equal(hill.position.x,hx,'Pause must stop the mountains.');
element('speed').oninput({target:{value:'36',style:{}}});element('playButton').onclick();sx=stone.position.x;
nextFrame();assert(Math.abs(stone.position.x-sx+.5)<1e-8,'Doubling the speed must double ground travel.');
function assertCoverage(prefix,spacing,count){
  const xs=[];scene.traverse(o=>{if(o.name.startsWith(prefix))xs.push(o.position.x);});
  assert.equal(xs.length,count);xs.sort((a,b)=>a-b);
  for(let i=1;i<xs.length;i++)assert(Math.abs(xs[i]-xs[i-1]-spacing)<1e-6,'Looped tiles must remain contiguous.');
  assert(xs[0]-spacing/2 < -100 && xs.at(-1)+spacing/2 > 100,'Looping must preserve scenery on both sides of the rider.');
}
for(let frame=0;frame<1900;frame++){
  nextFrame();
  if(frame%20===0){
    assertCoverage('road-pebbles-',32,9);
    [160,144,128].forEach((length,i)=>assertCoverage('mountain-layer-'+i+'-tile-',length,5));
  }
}
// Adjacent mountain tiles share the same boundary, including lighting and color.
for(let layer=0;layer<3;layer++){
  const tile=find('mountain-layer-'+layer+'-tile-0');
  const terrain=tile.children.find(o=>o.isMesh && !o.isInstancedMesh && o.geometry.attributes.color);
  assert(terrain,'Each mountain layer must have a terrain mesh.');
  for(let row=0;row<=22;row++){
    const left=row*129,right=left+128;
    for(const attribute of ['position','normal','color']){
      const a=terrain.geometry.attributes[attribute];
      for(let channel=attribute==='position'?1:0;channel<3;channel++)assert(Math.abs(a.array[left*3+channel]-a.array[right*3+channel])<1e-5,'Mountain tile edges must match.');
    }
  }
}
console.log('PASS: travel direction, speed, pause, 950 m of gap-free looping, terrain height/normal/color seams.');

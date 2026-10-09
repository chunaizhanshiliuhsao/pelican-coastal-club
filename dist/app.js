/* Pelican Coastal Club — original procedural scene. No remote assets or services. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  if (!window.THREE) { $('error').hidden = false; return; }
  const T = THREE, reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = { running: !reducedMotion, speed: 18, sunset: false, sound: false, camera: 'coast', distance: 0, time: 0, phase: 0, cinematic: false };
  const scene = new T.Scene();
  scene.background = new T.Color('#e9ebd8');
  scene.fog = new T.FogExp2('#e9ebd8', .012);
  let renderer;
  try { renderer = new T.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' }); }
  catch (_) { $('error').hidden = false; return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  $('scene').appendChild(renderer.domElement);
  renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); $('error').hidden = false; });
  const camera = new T.PerspectiveCamera(38, 1, .1, 240);
  const hemi = new T.HemisphereLight('#fff6df', '#6f9c8a', 2.8); scene.add(hemi);
  const sun = new T.DirectionalLight('#fff4d9', 3.3); sun.position.set(-5, 10, 7); sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -17, right: 17, top: 14, bottom: -12, near: .5, far: 45 });
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.normalBias = .035; sun.shadow.bias = -.00015; sun.shadow.radius = 4; scene.add(sun);
  const fill = new T.DirectionalLight('#d4e9e4', 1); fill.position.set(5, 5, -5); scene.add(fill);
  const mat = (color, opts = {}) => new T.MeshStandardMaterial({ color, roughness: .72, ...opts });
  const M = { ivory: mat('#fff6df'), white: mat('#fffaf0'), feather: mat('#e6dfc8'), featherDark: mat('#cecbb4'), beak: mat('#eda14f'), pouch: mat('#f2b871'), billTop: mat('#f4b54e'), ink: mat('#213e39'), black: mat('#172e2c'), rubber: mat('#36524c'), rim: mat('#e5d9b7', { metalness: .16, roughness: .48 }), metal: mat('#bdc8b8',{metalness:.65,roughness:.3}), teal: mat('#398d7d',{metalness:.22,roughness:.43}), darkTeal: mat('#286457'), leather: mat('#965b3e'), scarf: mat('#d96845'), sand: mat('#e5dab6'), road: mat('#cec8ac'), curb: mat('#ece7cf'), green: mat('#728e65'), leaf: mat('#84a276'), deepGreen: mat('#517b68'), wood: mat('#af8051'), terracotta: mat('#c57654'), foam: mat('#e7f1d7') };
  const sphereGeo = new T.SphereGeometry(1, 24, 16), cylinderGeo = new T.CylinderGeometry(1,1,1,12), boxGeo = new T.BoxGeometry(1,1,1);
  function mesh(geo, material, parent = scene) { const m = new T.Mesh(geo, material); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; }
  function ell(parent, material, p, s, rot = 0) { const m = mesh(sphereGeo,material,parent); m.position.set(...p); m.scale.set(...s); m.rotation.z=rot; return m; }
  function box(parent, material, p, s) { const m = mesh(boxGeo,material,parent);m.position.set(...p);m.scale.set(...s);return m; }
  const up = new T.Vector3(0,1,0);
  function rod(parent, material, a, b, r = .04) { const m = mesh(cylinderGeo,material,parent); setRod(m,a,b,r);return m; }
  function setRod(m,a,b,r) { const av=new T.Vector3(...a), bv=new T.Vector3(...b), d=bv.sub(av);m.position.copy(av).addScaledVector(d,.5);m.quaternion.setFromUnitVectors(up,d.clone().normalize());m.scale.set(r,d.length(),r); }
  function tube(parent, material, points, r, tubular=40) { return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),tubular,r,10,false),material,parent); }
  function torus(parent, material, p, r, thickness, segments=56) { const m=mesh(new T.TorusGeometry(r,thickness,10,segments),material,parent);m.position.set(...p);return m; }
  function group(parent=scene,p=[0,0,0]){const g=new T.Group();g.position.set(...p);parent.add(g);return g;}
  let seed = 42;
  function rand(a=0,b=1){seed=(seed*1664525+1013904223)>>>0;return a+(seed/4294967296)*(b-a);}

  // A continuous coastal road, with warm aggregate and individually marked kerbs.
  box(scene,M.sand,[0,-.3,3],[360,.5,16]);
  box(scene,M.road,[0,-.022,0],[360,.08,5.2]);
  box(scene,M.curb,[0,.018,-3.25],[360,.1,1.3]);
  box(scene,M.curb,[0,.018,3.25],[360,.1,1.3]);
  const markings=group(), moving=[];
  for(let i=-15;i<=15;i++) { const g=group(markings,[i*4,0,0]);box(g,M.ivory,[0,.027,0],[1.8,.008,.07]);moving.push({g,span:124}); }
  const curbMats=[mat('#c6c3a6'),mat('#ddd8bc')];
  for(let i=-40;i<40;i++)for(const z of [-2.7,2.7])box(scene,curbMats[(i+40)%2],[i*2,.05,z],[1.97,.16,.2]);
  const grainsGeo=new T.IcosahedronGeometry(.014,0), grains=new T.InstancedMesh(grainsGeo,mat('#a7aa90'),1300),dummy=new T.Object3D();
  for(let i=0;i<1300;i++){dummy.position.set(rand(-55,55),.035,rand(-2.5,2.5));dummy.scale.setScalar(rand(.5,2));dummy.updateMatrix();grains.setMatrixAt(i,dummy.matrix);}scene.add(grains);

  // Animated sea: low-amplitude geometry waves with sunlight on the crests.
  const seaUniforms={time:{value:0},colorA:{value:new T.Color('#5daaa0')},colorB:{value:new T.Color('#c4dfbd')}};
  const seaMaterial=new T.ShaderMaterial({uniforms:seaUniforms,vertexShader:`varying vec3 vWorld; uniform float time; void main(){vec3 p=position; p.z+=sin(p.x*.22+time*.6)*.06+sin(p.y*.35+p.x*.13+time*.85)*.07;vec4 w=modelMatrix*vec4(p,1.);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,fragmentShader:`varying vec3 vWorld; uniform float time; uniform vec3 colorA; uniform vec3 colorB; void main(){float w=sin(vWorld.x*.47+vWorld.z*2.8+sin(vWorld.x*.09+time*.3)*2.+time*.55);float w2=sin(vWorld.x*.18-vWorld.z*4.2+time*.7);float glint=pow(max(0.,w*w2),16.)*.35;float depth=smoothstep(-90.,-4.,vWorld.z);vec3 c=mix(colorB,colorA,depth*.6+.25)+glint;float haze=smoothstep(20.,135.,length(vWorld.xz));c=mix(c,vec3(.81,.86,.75),haze*.7);gl_FragColor=vec4(c,1.); #include <tonemapping_fragment> #include <colorspace_fragment> }`.replaceAll(' #include','\n#include')});
  const ocean=mesh(new T.PlaneGeometry(400,210,90,70),seaMaterial);ocean.rotation.x=-Math.PI/2;ocean.position.set(0,-.14,-109);ocean.castShadow=false;ocean.receiveShadow=false;
  for(let i=0;i<9;i++){const foam=box(scene,M.foam,[0,-.08+i*.003,-5.3-i*.3],[340,.018,.035]);foam.material=M.foam;}
  const distant=group();
  const hillMat=mat('#98b4a0');
  for(let i=0;i<10;i++){const m=ell(distant,hillMat,[rand(-130,130),rand(-2,-.2),rand(-110,-65)],[rand(12,28),rand(2,6),rand(6,13)]);m.castShadow=false;}

  // Lighthouse and tiny settlement across the bay.
  const island=group(scene,[-4,0,-42]);
  ell(island,mat('#aeb69a'),[0,-.5,0],[8,1.7,5]);
  ell(island,M.green,[0,.05,0],[6,1.25,3.6]);
  const tower=mesh(new T.CylinderGeometry(.55,.85,5.3,20),M.ivory,island);tower.position.set(0,3.1,0);
  for(let h of [1.4,3.2,5.1]){const stripe=mesh(new T.CylinderGeometry(.61+(5.3-h)*.05,.62+(5.3-h)*.05,.42,20),M.terracotta,island);stripe.position.y=h;}
  const deck=mesh(new T.CylinderGeometry(.94,.94,.16,20),M.ivory,island);deck.position.y=5.85;
  const lamp=mesh(new T.CylinderGeometry(.5,.5,.8,12),mat('#eac684',{emissive:'#edbe65',emissiveIntensity:.25}),island);lamp.position.y=6.25;
  for(let i=0;i<8;i++){const a=i*Math.PI/4;rod(island,M.ink,[Math.cos(a)*.58,5.9,Math.sin(a)*.58],[Math.cos(a)*.58,6.7,Math.sin(a)*.58],.035);}
  const roof=mesh(new T.ConeGeometry(.85,.6,16),M.terracotta,island);roof.position.y=6.95;
  rod(island,M.ink,[0,7.15,0],[0,7.6,0],.028);ell(island,M.ink,[0,7.65,0],[.08,.08,.08]);
  function house(parent,x,z,c){const h=group(parent,[x,.7,z]);box(h,mat(c),[0,.55,0],[1.9,1.2,1.4]);const r=mesh(new T.ConeGeometry(1.65,.8,4),M.terracotta,h);r.position.y=1.55;r.rotation.y=Math.PI/4;r.scale.z=.8;box(h,M.deepGreen,[0,.45,.711],[.34,.7,.025]);for(let a of [-.6,.6])box(h,M.ivory,[a,.7,.714],[.28,.33,.025]);}
  house(island,2.8,1,'#e4c28e');house(island,4.8,0,'#e3a58b');house(island,-3,1,'#e8ddba');
  function sailboat(x,z,scale){const g=group(scene,[x,.05,z]);g.scale.setScalar(scale);ell(g,M.ivory,[0,0,0],[1.35,.24,.37]);rod(g,M.wood,[0,0,0],[0,3.5,0],.035);const s=new T.Shape();s.moveTo(.08,.6);s.lineTo(.08,3.4);s.lineTo(1.5,.6);s.closePath();const m=mesh(new T.ShapeGeometry(s),mat('#fff0c9',{side:T.DoubleSide}),g);m.position.z=.02;const s2=new T.Shape();s2.moveTo(-.08,.65);s2.lineTo(-.08,2.8);s2.lineTo(-.95,.65);s2.closePath();mesh(new T.ShapeGeometry(s2),M.scarf,g);return g;}
  const boats=[sailboat(-12,-30,.8),sailboat(34,-55,.7)];
  const clouds=[];
  for(let i=0;i<8;i++){const g=group(scene,[rand(-100,100),rand(14,23),rand(-100,-65)]);for(let j=0;j<5;j++)ell(g,mat('#f4f1de'),[j*1.7,Math.sin(j)*.5,0],[rand(1.5,3),rand(.5,1),1.1]).castShadow=false;clouds.push(g);}

  // Roadside objects loop independently of the rider.
  function grass(parent,x,z){const g=group(parent,[x,.08,z]);for(let j=0;j<6;j++){const a=rand(-.4,.4),b=rand(-.3,.3);const blade=ell(g,j%2?M.leaf:M.green,[a,.22,b],[.035,rand(.2,.45),.025],rand(-.6,.6));blade.rotation.x=rand(-.6,.6);}return g;}
  function tree(parent,x,z){const g=group(parent,[x,0,z]);rod(g,M.wood,[0,0,0],[.15,2.2,0],.095);for(let i=0;i<6;i++)ell(g,i%2?M.leaf:M.deepGreen,[rand(-.6,.7),rand(1.8,2.8),rand(-.5,.5)],[rand(.5,.8),rand(.5,.9),.55]);}
  function bench(parent,x,z){const b=group(parent,[x,0,z]);for(let i=0;i<3;i++)box(b,M.wood,[0,.5,i*.16],[1.8,.075,.125]);for(let i=0;i<3;i++)box(b,M.wood,[0,.83+i*.14,-.15],[1.8,.09,.08]);for(let a of [-.65,.65]){rod(b,M.ink,[a,.05,.32],[a,.55,.32],.045);rod(b,M.ink,[a,.05,-.12],[a,1.15,-.19],.045);} }
  function streetLamp(parent,x,z){const g=group(parent,[x,0,z]);rod(g,M.deepGreen,[0,0,0],[0,3.5,0],.048);tube(g,M.deepGreen,[[0,3.4,0],[0,3.8,0],[.4,3.9,0],[.65,3.6,0]],.045);const cap=mesh(new T.ConeGeometry(.22,.16,16),M.deepGreen,g);cap.position.set(.65,3.57,0);ell(g,mat('#fff0bf',{emissive:'#ffdc83',emissiveIntensity:.4}),[.65,3.48,0],[.13,.09,.13]);}
  for(let i=-3;i<=3;i++){const g=group(scene,[i*22,0,0]);moving.push({g,span:154});bench(g,-5,-3.6);streetLamp(g,5,-3.9);tree(g,9,-4.2);for(let j=0;j<8;j++){grass(g,rand(-11,11),rand(3.5,5.3));grass(g,rand(-11,11),rand(-4.8,-4));}for(let j=0;j<4;j++)ell(g,M.sand,[rand(-10,10),.1,rand(4,6)],[rand(.1,.3),rand(.1,.2),.2]);}
  // Delicate wooden safety posts along the ocean edge.
  for(let i=-5;i<=5;i++){const g=group(scene,[i*9,0,-4.7]);moving.push({g,span:99});rod(g,M.curb,[0,0,0],[0,.73,0],.1);ell(g,M.ivory,[0,.76,0],[.12,.06,.12]);tube(g,M.wood,[[0,.56,0],[4.5,.4,0],[9,.56,0]],.024);}

  // Bicycle: diamond frame, spokes, visible drive train, mudguards and rear rack.
  const rider=group();
  const bike=group(rider), wheels=[];
  for(const x of [-1.25,1.25]){
    const w=group(bike,[x,.77,0]);wheels.push(w);
    torus(w,M.rubber,[0,0,0],.685,.069);
    torus(w,M.rim,[0,0,.036],.649,.035);torus(w,M.rim,[0,0,-.036],.649,.035);
    torus(w,M.metal,[0,0,0],.604,.016);
    for(let i=0;i<24;i++){const a=i*Math.PI/12;rod(w,M.metal,[0,0,i%2?.08:-.08],[Math.cos(a)*.602,Math.sin(a)*.602,0],.007);}
    rod(w,M.metal,[0,0,-.13],[0,0,.13],.068);
    box(w,M.ivory,[.37,.2,.045],[.15,.036,.04]);
    const guard=mesh(new T.TorusGeometry(.776,.035,8,45,Math.PI*.9),M.teal,bike);guard.position.set(x,.77,0);guard.rotation.z=.05*Math.PI;
  }
  const rear=[-1.25,.77,0],bb=[-.25,.82,0],seat=[-.58,1.85,0],head=[.78,1.87,0],lowHead=[.95,1.47,0];
  for(const [a,b] of [[rear,bb],[bb,seat],[seat,rear],[seat,head],[head,lowHead],[lowHead,bb]])rod(bike,M.teal,a,b,.052);
  for(const z of [-.12,.12]){rod(bike,M.teal,[-1.25,.77,z],[-.58,1.85,z*.2],.027);rod(bike,M.teal,[-1.25,.77,z],[-.25,.82,z],.03);rod(bike,M.teal,[.95,1.5,z],[1.25,.77,z],.039);}
  rod(bike,M.metal,[-.58,1.7,0],[-.65,2.05,0],.032);
  ell(bike,M.leather,[-.71,2.03,0],[.3,.09,.18]);
  rod(bike,M.metal,[.78,1.86,0],[.67,2.18,0],.035);
  tube(bike,M.metal,[[.67,2.17,-.38],[.83,2.17,-.28],[.83,2.17,.28],[.67,2.17,.38]],.034);
  for(const z of [-.37,.37])rod(bike,M.leather,[.68,2.17,z],[.47,2.17,z],.052);
  const bell=ell(bike,M.metal,[.8,2.24,.21],[.08,.055,.08]);
  ell(bike,mat('#fff4c2',{emissive:'#ffe2a0',emissiveIntensity:.3}),[1.02,1.75,0],[.09,.1,.1]);
  for(const z of [-.2,.2]){rod(bike,M.metal,[-1.26,.8,z],[-1.55,1.62,z],.018);rod(bike,M.metal,[-.73,1.64,z],[-1.65,1.64,z],.024);}for(let i=0;i<5;i++)rod(bike,M.metal,[-.8-i*.2,1.64,-.2],[-.8-i*.2,1.64,.2],.013);
  // Rolled picnic blanket on the back carrier.
  const blanket=mesh(new T.CylinderGeometry(.145,.145,.5,24),mat('#c18b65'),bike);blanket.rotation.x=Math.PI/2;blanket.position.set(-1.4,1.82,0);
  for(const z of [-.16,.16]){const strap=torus(bike,M.leather,[-1.4,1.82,z],.15,.012);}
  const crank=group(bike,bb);const chainring=torus(crank,M.metal,[0,0,.175],.21,.021);torus(bike,M.metal,[-1.25,.77,.17],.1,.016);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;rod(crank,M.metal,[0,0,.175],[Math.cos(a)*.19,Math.sin(a)*.19,.175],.015);}
  const chainPath=new T.CatmullRomCurve3([new T.Vector3(-.25,1.035,.185),new T.Vector3(-1.25,.88,.185),new T.Vector3(-1.35,.77,.185),new T.Vector3(-1.25,.66,.185),new T.Vector3(-.25,.605,.185),new T.Vector3(-.04,.82,.185)],true,'centripetal');
  mesh(new T.TubeGeometry(chainPath,72,.012,6,true),M.ink,bike);
  const chainLinks=[];for(let i=0;i<38;i++){const l=ell(bike,M.metal,[0,0,0],[.018,.011,.015]);chainLinks.push(l);}
  const pedals=[];
  for(const side of [-1,1]){const arm=rod(bike,M.metal,[0,0,0],[0,1,0],.026),ped=box(bike,M.ink,[0,0,0],[.23,.065,.2]);pedals.push({side,arm,ped});}

  // A white pelican with a curved neck, long bill and generous throat pouch.
  const bird=group(rider);
  ell(bird,M.ivory,[-.59,2.58,0],[.59,.7,.47],-.2);
  ell(bird,M.white,[-.34,2.6,.04],[.44,.58,.44],-.25);
  // Tail fans point backwards, with individual feather tips.
  for(let i=0;i<5;i++)ell(bird,i%2?M.feather:M.ivory,[-1.03-i*.03,2.29,-.24+i*.12],[.36,.13,.10],.43+i*.04);
  const neckCurve=[[-.37,2.78,0],[-.27,3.07,0],[-.36,3.38,0],[-.16,3.66,0],[.11,3.71,0]];
  tube(bird,M.ivory,neckCurve,.225,40);
  ell(bird,M.white,[-.1,3.52,0],[.30,.42,.27],-.4);
  const headGroup=group(bird,[.03,3.64,0]);
  ell(headGroup,M.white,[0,0,0],[.39,.36,.32]);
  ell(headGroup,M.ivory,[-.2,.22,0],[.18,.18,.2]);
  for(let i=0;i<3;i++)ell(headGroup,M.ivory,[-.28-i*.06,.27+i*.025,0],[.18,.045,.11],-.4);
  // The pouch is an asymmetrical rounded teardrop under a narrow tapered upper bill.
  function billGeometry(){const vertices=[],indices=[];const rings=[[.16,.005,.19,.10],[.39,-.005,.20,.09],[.75,-.014,.15,.07],[1.15,-.028,.08,.04],[1.47,-.08,.008,.014]];for(const [x,y,w,h] of rings){for(let i=0;i<16;i++){const a=i/16*Math.PI*2;vertices.push(x,y+Math.cos(a)*h,Math.sin(a)*w);}}for(let j=0;j<rings.length-1;j++)for(let i=0;i<16;i++){let a=j*16+i,b=j*16+(i+1)%16;indices.push(a,b,a+16,b,b+16,a+16);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;}
  const pouch=ell(headGroup,M.pouch,[.65,-.19,0],[.63,.235,.177],.13);
  mesh(billGeometry(),M.billTop,headGroup);
  tube(headGroup,M.beak,[[.21,-.085,.19],[.69,-.095,.15],[1.12,-.094,.08],[1.46,-.08,0]],.012);
  for(const side of [-1,1]){
    ell(headGroup,M.pouch,[.105,.07,side*.291],[.14,.14,.031]);
    ell(headGroup,M.black,[.125,.088,side*.317],[.065,.069,.022]);
    ell(headGroup,M.white,[.142,.11,side*.337],[.018,.02,.009]);
    const brow=ell(headGroup,M.ivory,[.099,.187,side*.284],[.11,.025,.04],.13);
  }
  // A little sage cycling cap, offset brim and stitched seam.
  ell(headGroup,M.darkTeal,[-.08,.305,0],[.32,.12,.29]);ell(headGroup,M.teal,[.17,.31,0],[.25,.032,.24],-.04);
  tube(headGroup,M.ivory,[[-.32,.32,0],[-.13,.425,0],[.08,.39,0]],.012,16);
  // Wing shoulders and overlapping feathers; their tips rest on the handlebars.
  for(const side of [-1,1]){
    ell(bird,M.feather,[-.67,2.66,side*.405],[.36,.50,.14],-.5);
    for(let i=0;i<6;i++)ell(bird,i%2?M.ivory:M.feather,[-.8+i*.06,2.47-i*.035,side*(.48+i*.003)],[.145,.29,.045],-.57-i*.08);
    tube(bird,M.ivory,[[-.43,2.82,side*.39],[-.03,2.61,side*.44],[.25,2.3,side*.4],[.56,2.19,side*.36]],.1);
    ell(bird,M.white,[.53,2.21,side*.36],[.18,.075,.09],-.1);
  }
  const scarfRing=torus(bird,M.scarf,[-.27,3.14,0],.241,.07);scarfRing.rotation.x=Math.PI/2;
  const scarfTail=group(bird,[-.43,3.16,-.02]);
  const scarfShape=new T.Shape();scarfShape.moveTo(0,0);scarfShape.bezierCurveTo(-.3,.12,-.7,.12,-1.05,.01);scarfShape.lineTo(-.84,-.11);scarfShape.lineTo(-.95,-.24);scarfShape.bezierCurveTo(-.55,-.12,-.28,-.18,0,-.14);scarfShape.closePath();
  const scarfMesh=mesh(new T.ExtrudeGeometry(scarfShape,{depth:.045,bevelEnabled:true,bevelSize:.014,bevelThickness:.014,bevelSegments:2,steps:1}),M.scarf,scarfTail);
  // Analytic two-bone IK keeps both feet planted on their respective pedals.
  const legs=[];
  for(const side of [-1,1]){
    const thigh=rod(rider,M.pouch,[0,0,0],[0,1,0],.075),shin=rod(rider,M.beak,[0,0,0],[0,1,0],.045);
    const knee=ell(rider,M.pouch,[0,0,0],[.081,.078,.068]);
    const foot=group(rider);ell(foot,M.beak,[.055,0,0],[.17,.055,.14]);
    for(let i=0;i<3;i++)ell(foot,M.beak,[.15,.006,-.1+i*.1],[.10,.031,.032]);
    legs.push({side,thigh,shin,knee,foot});
  }
  // Subtle ambient occlusion beneath the wheels grounds the entire model.
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;const sc=shadowCanvas.getContext('2d'),grad=sc.createRadialGradient(64,64,2,64,64,63);grad.addColorStop(0,'rgba(32,55,40,0.26)');grad.addColorStop(1,'rgba(32,55,40,0)');sc.fillStyle=grad;sc.fillRect(0,0,128,128);
  const contact=mesh(new T.PlaneGeometry(4.3,2.2),new T.MeshBasicMaterial({map:new T.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));contact.rotation.x=-Math.PI/2;contact.position.y=.035;contact.castShadow=false;

  // Small seabirds circle over the bay.
  const gulls=[];for(let i=0;i<7;i++){const g=group(scene,[rand(-20,20),rand(6,12),rand(-28,-12)]);const left=ell(g,M.ivory,[-.3,0,0],[.4,.04,.13]),right=ell(g,M.ivory,[.3,0,0],[.4,.04,.13]);ell(g,M.ivory,[0,0,0],[.12,.08,.24]);gulls.push({g,left,right,offset:rand(0,6),x:g.position.x});}

  // Batch repeated foliage, kerbs and railings so the small world stays light.
  function batchStatic(parent) {
    parent.updateWorldMatrix(true,true);
    const inverse=parent.matrixWorld.clone().invert(),batches=new Map();
    parent.traverse(m=>{if(m.isMesh&&!m.isInstancedMesh){const key=m.geometry.uuid+':'+m.material.uuid;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(m);}});
    batches.forEach(items=>{if(items.length<3)return;const inst=new T.InstancedMesh(items[0].geometry,items[0].material,items.length);inst.castShadow=true;inst.receiveShadow=true;items.forEach((m,i)=>{inst.setMatrixAt(i,new T.Matrix4().multiplyMatrices(inverse,m.matrixWorld));m.parent.remove(m);});parent.add(inst);});
  }
  moving.forEach(({g})=>batchStatic(g));batchStatic(island);batchStatic(distant);

  // Camera presets ease into place; dragging gives the user full orbit control.
  const view={theta:.32,phi:1.3,radius:13.7,target:new T.Vector3(-1.75,1.68,0)};
  let cameraGoal={theta:view.theta,phi:view.phi,radius:view.radius,target:view.target.clone()},drag=null,manual=false;
  function preset(name,instant=false){
    state.camera=name;manual=false;const mobile=innerWidth<761;
    const presets=mobile?{coast:{theta:.3,phi:1.3,radius:17.3,target:[0,2.95,0]},follow:{theta:-.98,phi:1.22,radius:10.8,target:[0,2.1,0]},detail:{theta:.44,phi:1.4,radius:8.7,target:[.2,2.72,0]}}:{coast:{theta:.32,phi:1.3,radius:13.7,target:[-1.75,1.68,0]},follow:{theta:-.98,phi:1.2,radius:9.7,target:[0,1.8,0]},detail:{theta:.55,phi:1.39,radius:8,target:[.1,2.35,0]}};
    const p=presets[name];cameraGoal={...p,target:new T.Vector3(...p.target)};
    if(instant){Object.assign(view,{theta:p.theta,phi:p.phi,radius:p.radius});view.target.copy(cameraGoal.target);}
    document.querySelectorAll('[data-camera]').forEach(b=>{const sel=b.dataset.camera===name;b.classList.toggle('selected',sel);b.setAttribute('aria-pressed',sel);});
    $('experience').classList.toggle('cinema',name!=='coast'||state.cinematic);
  }
  const canvas=renderer.domElement;
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);manual=true;$('dragHint').style.opacity='0';});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;cameraGoal.theta-=(e.clientX-drag.x)*.006;cameraGoal.phi=T.MathUtils.clamp(cameraGoal.phi+(e.clientY-drag.y)*.004,.45,1.52);drag={x:e.clientX,y:e.clientY};});
  const endDrag=()=>drag=null;canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);canvas.addEventListener('lostpointercapture',endDrag);
  canvas.addEventListener('wheel',e=>{e.preventDefault();cameraGoal.radius=T.MathUtils.clamp(cameraGoal.radius+e.deltaY*.009,6,24);manual=true;},{passive:false});
  function resize(){const w=innerWidth,h=$('experience').clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();preset(state.camera,true);}
  window.addEventListener('resize',resize);resize();
  let toastTimer;function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2700);}
  function updatePlay(){ $('playIcon').innerHTML=state.running?'<path d="M8 5v14M16 5v14"/>':'<path d="M8 5l11 7-11 7z" fill="currentColor" stroke="none"/>'; $('playButton').setAttribute('aria-label',state.running?'暂停骑行':'继续骑行');$('rideState').textContent=state.running?'正在兜风':'歇一会儿'; }
  $('playButton').onclick=()=>{state.running=!state.running;updatePlay();};updatePlay();
  $('rideButton').onclick=()=>{state.running=true;state.cinematic=!state.cinematic;preset(state.cinematic?'follow':'coast');updatePlay();toast(state.cinematic?'出发！今天没有必须到达的地方。':'回到海岸，继续慢慢兜风。');};
  $('speed').oninput=e=>{state.speed=Number(e.target.value);$('speedValue').textContent=state.speed;e.target.style.background=`linear-gradient(to right,#47675a ${(state.speed-4)/32*100}%,#dde0d5 0%)`;};
  document.querySelectorAll('[data-camera]').forEach(b=>b.onclick=()=>{state.cinematic=false;preset(b.dataset.camera);});
  $('themeButton').onclick=()=>{state.sunset=!state.sunset;$('themeLabel').textContent=state.sunset?'晴日':'日落';$('themeButton').setAttribute('aria-label',state.sunset?'切换到晴日':'切换到日落');$('weatherTitle').textContent=state.sunset?'落日巡游':'海岸晴日';$('weatherSymbol').textContent=state.sunset?'◒':'☀';$('weatherSub').textContent=state.sunset?'晚霞 · 再骑五分钟':'微风 · 好心情不限量';toast(state.sunset?'把最后一缕阳光，装进口袋。':'晴天回来了，海风也是。');};
  $('aboutButton').onclick=()=>$('aboutDialog').showModal();$('closeDialog').onclick=()=>$('aboutDialog').close();$('aboutDialog').addEventListener('click',e=>{if(e.target===$('aboutDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});

  // Audio is synthesized locally and only starts after explicit interaction.
  let audioContext,windGain,master,windSource;
  function audio(){if(!audioContext){audioContext=new (window.AudioContext||window.webkitAudioContext)();master=audioContext.createGain();master.gain.value=.6;master.connect(audioContext.destination);}if(audioContext.state==='suspended')audioContext.resume();return audioContext;}
  function ring(){try{const ac=audio();for(let j=0;j<2;j++)for(const f of [1260,2540,3810]){const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime+j*.15;o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(f===1260?.19:.045,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+1.3);o.connect(g);g.connect(master);o.start(t);o.stop(t+1.4);}bell.scale.set(.092,.063,.092);setTimeout(()=>bell.scale.set(.08,.055,.08),200);toast('叮叮！借过一下，好心情要来了。');}catch(_){toast('叮叮！好心情要来了。');}}
  $('bellButton').onclick=ring;
  $('soundButton').onclick=()=>{try{const ac=audio();if(!windSource){const buffer=ac.createBuffer(1,ac.sampleRate*4,ac.sampleRate),data=buffer.getChannelData(0);let last=0;for(let i=0;i<data.length;i++){last=(last+(Math.random()*2-1)*.03)/1.025;data[i]=last*3;}windSource=ac.createBufferSource();windSource.buffer=buffer;windSource.loop=true;const filter=ac.createBiquadFilter();filter.type='lowpass';filter.frequency.value=700;windGain=ac.createGain();windGain.gain.value=0;windSource.connect(filter);filter.connect(windGain);windGain.connect(master);windSource.start();}state.sound=!state.sound;windGain.gain.setTargetAtTime(state.sound?.24:0,ac.currentTime,.5);$('soundButton').setAttribute('aria-pressed',state.sound);$('soundButton').setAttribute('aria-label',state.sound?'关闭环境音':'开启环境音');$('soundLabel').textContent=state.sound?'静音':'海风';toast(state.sound?'听，海风在给今天配乐。':'让世界安静一会儿。');}catch(_){toast('当前浏览器暂时无法播放声音。');}};
  $('photoButton').onclick=()=>{try{renderer.render(scene,camera);const out=document.createElement('canvas');out.width=1600;out.height=1100;const ctx=out.getContext('2d');ctx.fillStyle=state.sunset?'#f6e5d1':'#f7f3e6';ctx.fillRect(0,0,1600,1100);const sw=canvas.width,sh=canvas.height,aspect=1512/890;let sx=0,sy=0,cw=sw,ch=sh;if(sw/sh>aspect){cw=sh*aspect;sx=(sw-cw)/2;}else{ch=sw/aspect;sy=(sh-ch)/2;}ctx.drawImage(canvas,sx,sy,cw,ch,44,44,1512,890);ctx.fillStyle='#2c5147';ctx.font='30px Segoe UI, Microsoft YaHei';ctx.fillText('PELICAN COASTAL CLUB',55,994);ctx.font='20px Microsoft YaHei';ctx.fillText('不赶路，只赶海风。',55,1041);ctx.textAlign='right';ctx.font='15px Segoe UI';ctx.fillText('A LITTLE RIDE. A LITTLE JOY.',1545,994);ctx.fillText(new Date().toLocaleDateString('zh-CN'),1545,1041);out.toBlob(blob=>{if(!blob){toast('留影未完成，请再试一次。');return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='鹈鹕海岸明信片.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);toast('已生成明信片，愿海风也吹到你身边。');},'image/png');}catch(_){toast('留影未完成，请再试一次。');}};
  window.addEventListener('keydown',e=>{if($('aboutDialog').open||['INPUT','BUTTON','TEXTAREA'].includes(document.activeElement.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;if(e.code==='Space'){e.preventDefault();$('playButton').click();}if(e.key.toLowerCase()==='b')ring();if(e.key.toLowerCase()==='c'){state.cinematic=false;const keys=['coast','follow','detail'];preset(keys[(keys.indexOf(state.camera)+1)%3]);}});
  document.addEventListener('visibilitychange',()=>{if(audioContext){if(document.hidden)audioContext.suspend();else if(state.sound)audioContext.resume();}});

  const clock=new T.Clock();let themeMix=0,frames=0;
  const colorDay=new T.Color('#e9ebd8'),colorEvening=new T.Color('#e6b894'),sunDay=new T.Color('#fff4d9'),sunEvening=new T.Color('#ffb46e'),seaDay=new T.Color('#5daaa0'),seaEvening=new T.Color('#779d8c'),seaLightDay=new T.Color('#c4dfbd'),seaLightEvening=new T.Color('#edd0a0');
  function animate(){
    requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);if(document.hidden)return;
    const run=state.running?dt:0;state.time+=run;const velocity=state.speed/3.6;
    state.distance+=velocity*run/1000;state.phase+=run*velocity/.685/2.55;
    const p=state.phase,t=state.time,bob=Math.sin(p*2)*.016;
    wheels.forEach(w=>w.rotation.z-=run*velocity/.685);crank.rotation.z=-p;
    bird.position.y=bob;headGroup.rotation.z=Math.sin(p)*.018;scarfTail.rotation.x=Math.sin(t*6)*.15;scarfTail.rotation.y=Math.sin(t*5)*.1;scarfMesh.rotation.z=Math.sin(t*4)*.05;
    pouch.scale.y=.235+Math.sin(p+.6)*.009;
    legs.forEach((l,i)=>{
      const a=-p+(l.side===1?0:Math.PI),px=-.25+Math.cos(a)*.28,py=.82+Math.sin(a)*.28,z=l.side*.265;
      const hip=[-.59,2.11+bob,z],ankle=[px,py+.07,z],dx=ankle[0]-hip[0],dy=ankle[1]-hip[1],d=Math.hypot(dx,dy),L1=.79,L2=.83;
      const along=(L1*L1-L2*L2+d*d)/(2*d),h=Math.sqrt(Math.max(0,L1*L1-along*along)),kx=hip[0]+dx/d*along-dy/d*h,ky=hip[1]+dy/d*along+dx/d*h;
      const knee=[kx,ky,z];setRod(l.thigh,hip,knee,.069);setRod(l.shin,knee,ankle,.043);l.knee.position.set(...knee);l.foot.position.set(px,py+.08,z);
      const pedal=pedals[i];pedal.ped.position.set(px,py,z);setRod(pedal.arm,[-.25,.82,l.side*.16],[px,py,l.side*.16],.025);
    });
    chainLinks.forEach((l,i)=>l.position.copy(chainPath.getPointAt((i/chainLinks.length+p*.055)%1)));
    moving.forEach(({g,span})=>{g.position.x-=velocity*run;if(g.position.x < -span/2)g.position.x+=span;});
    gulls.forEach((g,i)=>{g.g.position.x=g.x+Math.sin(t*.07+i)*6;g.g.position.y+=Math.sin(t+i)*.0006;g.left.rotation.z=Math.sin(t*3+g.offset)*.35;g.right.rotation.z=-Math.sin(t*3+g.offset)*.35;});
    boats.forEach((b,i)=>{b.rotation.z=Math.sin(t*.8+i)*.035;b.position.y=.07+Math.sin(t+i)*.05;});seaUniforms.time.value=t;
    const blend=1-Math.exp(-dt*3.8);view.theta=T.MathUtils.lerp(view.theta,cameraGoal.theta,blend);view.phi=T.MathUtils.lerp(view.phi,cameraGoal.phi,blend);view.radius=T.MathUtils.lerp(view.radius,cameraGoal.radius,blend);view.target.lerp(cameraGoal.target,blend);
    camera.position.set(view.target.x+view.radius*Math.sin(view.phi)*Math.sin(view.theta),view.target.y+view.radius*Math.cos(view.phi),view.target.z+view.radius*Math.sin(view.phi)*Math.cos(view.theta));camera.lookAt(view.target);
    themeMix=T.MathUtils.lerp(themeMix,state.sunset?1:0,1-Math.exp(-dt*2));scene.background.copy(colorDay).lerp(colorEvening,themeMix);scene.fog.color.copy(scene.background);sun.color.copy(sunDay).lerp(sunEvening,themeMix);sun.intensity=3.3-themeMix*.6;hemi.intensity=2.8-themeMix*.9;sun.position.y=10-themeMix*6;seaUniforms.colorA.value.copy(seaDay).lerp(seaEvening,themeMix);seaUniforms.colorB.value.copy(seaLightDay).lerp(seaLightEvening,themeMix);
    if(windGain&&state.sound)windGain.gain.setTargetAtTime(.20+Math.sin(t*.6)*.04,audioContext.currentTime,.3);
    if(frames++%20===0)$('distance').textContent=state.distance.toFixed(2);
    renderer.render(scene,camera);
    if(frames===3){$('loading').classList.add('done');setTimeout(()=>$('loading').hidden=true,900);}
  }
  // Expose a read-only snapshot for basic diagnostics without external dependencies.
  window.pelicanDiagnostics=()=>({renderer:'Three.js '+T.REVISION,objects:scene.children.length,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,running:state.running,speed:state.speed,camera:state.camera,sunset:state.sunset,distance:state.distance,canvas:[canvas.width,canvas.height]});
  animate();
})();

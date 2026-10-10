import * as THREE from 'three';
import { GLTFLoader } from './GLTFLoader.js';
import { OrbitControls } from './OrbitControls.js';
import { RoomEnvironment } from './RoomEnvironment.js';

const $ = id => document.getElementById(id);
let renderer;
function fail(error) {
  console.error(error);
  $('status').hidden = true;
  $('error').hidden = false;
}
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  $('viewport').appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'Robot and rope in an interactive 3D scene');
  renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); fail(new Error('Graphics context lost. Reload the viewer.')); });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#b7c9d9');
  scene.fog = new THREE.Fog('#b7c9d9', 8, 28);
  const camera = new THREE.PerspectiveCamera(26, 1, 0.01, 250);
  // Blender Z-up becomes glTF Y-up: (x, y, z) -> (x, z, -y).
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 1.2;
  controls.maxDistance = 12;
  controls.maxPolarAngle = Math.PI * .49;
  controls.target.set(.6, .02, 0);
  camera.position.set(3.5, .92, 2.0);
  controls.update();
  controls.saveState();
  $('reset').onclick = () => controls.reset();
  if (!document.fullscreenEnabled) $('fullscreen').hidden = true;
  $('fullscreen').onclick = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await $('viewer').requestFullscreen(); }
    catch (error) { console.warn('Fullscreen unavailable', error); }
  };
  document.addEventListener('fullscreenchange', () => $('fullscreen').setAttribute('aria-label', document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen'));

  const environment = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(environment, .04);
  scene.environment = env.texture;
  scene.environmentIntensity = .7;
  environment.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xe7f2ff, 0x677381, 1.6));
  const key = new THREE.DirectionalLight(0xfff1df, 3.2);
  key.position.set(-2, 5, 3);key.target.position.set(.6, 0, 0);
  key.castShadow = true;key.shadow.mapSize.set(2048,2048);
  Object.assign(key.shadow.camera, { left:-2.5,right:2.5,top:2.5,bottom:-2.5,near:.1,far:12 });
  key.shadow.normalBias=.012;key.shadow.bias=-.00015;
  scene.add(key,key.target);
  const rim = new THREE.DirectionalLight(0xe2eeff, 2.0);rim.position.set(1,3,-3);scene.add(rim);

  let mixer, action, duration=0, time=0, playing=false, speed=1;
  function syncUI() {
    $('timeline').value = time;
    $('time').textContent = `${time.toFixed(2)} / ${duration.toFixed(2)} s`;
    $('play').textContent = playing ? 'Pause' : time >= duration ? 'Replay' : 'Play';
    $('play').setAttribute('aria-label', playing ? 'Pause animation' : 'Play animation');
  }
  function seek(value) { time=THREE.MathUtils.clamp(value,0,duration);action.paused=false;action.enabled=true;mixer.setTime(time);syncUI(); requestRender(); }
  $('play').onclick = () => { if(time>=duration) seek(0);playing=!playing;syncUI();requestRender(); requestRender(); };
  $('restart').onclick = () => { seek(0);playing=true;syncUI();requestRender(); requestRender(); };
  $('timeline').oninput = e => { playing=false;seek(Number(e.target.value)); };
  $('speed').onchange = e => speed=Number(e.target.value);
  new GLTFLoader().load('./scene.glb', gltf => {
    gltf.scene.traverse(o => {
      if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}
    });
    scene.add(gltf.scene);
    if(gltf.animations.length!==1) throw new Error('Expected one synchronized Drake recording');
    mixer=new THREE.AnimationMixer(gltf.scene);
    const clip=gltf.animations[0];duration=clip.duration;
    action=mixer.clipAction(clip);
    // Time is advanced explicitly for precise scrubbing and a single playback per click.
    action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();
    $('timeline').max=duration;
    for(const id of ['play','restart','timeline']) $(id).disabled=false;
    $('status').hidden=true;
    // Start at the recorded contact pose; Play replays the complete motion.
    seek(duration);
    // Read-only diagnostics for checking the browser animation against the source.
    window.wagViewer={scene,camera,controls,mixer,clip,get time(){return time;},get playing(){return playing;},seek};
  }, undefined, fail);
  new ResizeObserver(() => {
    const {width,height}=$('viewport').getBoundingClientRect();
    renderer.setSize(width,height,false);camera.aspect=width/height;
    camera.fov=width<520?46:26;camera.updateProjectionMatrix();requestRender();
  }).observe($('viewport'));
  let visible=true, pending=null, last=0;
  function requestRender() {
    if (pending===null && visible && !document.hidden) pending=requestAnimationFrame(render);
  }
  function render(now) {
    pending=null;
    if (!visible || document.hidden) { last=0;return; }
    const dt=last ? Math.min((now-last)/1000,.1) : 0;
    last=now;
    if(mixer && playing){seek(time+dt*speed);if(time>=duration){playing=false;syncUI();}}
    controls.update();
    renderer.render(scene,camera);
    // OrbitControls emits change events while damping settles, scheduling only needed frames.
    if(playing) requestRender();else last=0;
  }
  controls.addEventListener('change',requestRender);
  new IntersectionObserver(entries => {
    visible=entries[0].isIntersecting;last=0;
    if(visible) requestRender();
  }).observe($('viewer'));
  document.addEventListener('visibilitychange',()=>{last=0;requestRender();});
  requestRender();

} catch(error) { fail(error); }

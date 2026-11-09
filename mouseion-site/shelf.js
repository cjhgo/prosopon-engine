// MOUSEION 3D room engine — one geometry, three mediums.
// Reads <div id="app" data-medium="book|film|music" data-src="../data/<medium>.json">.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const ROOMS = {
  book: {
    aspect: 2 / 3, cols: 5, gap: 0.06, rowH: 0.80, coverW: 0.48, board: 0.045, depth: 0.36,
    theme: {
      bg: 0xe9e2d3, fog: [18, 46], back: 0xd8cfbd, floor: 0xcfc4ae,
      wood: 0x8a6547, woodDark: 0x5a3e2b, paper: 0xf7f1e4,
      hemi: [0xfffaf0, 0x8a7a60, 0.85], dir: 0xfff4e0, dirI: 2.2,
      spot: 0xfff0d6, spotI: 14, exposure: 1.0, env: 0.4, metal: false,
    },
  },
  film: {
    aspect: 2 / 3, cols: 7, gap: 0.05, rowH: 0.64, coverW: 0.38, board: 0.04, depth: 0.30,
    theme: {
      bg: 0x0b0c0d, fog: [16, 42], back: 0x111315, floor: 0x08090a,
      wood: 0x2b2e31, woodDark: 0x17191b, paper: 0x17191b,
      hemi: [0xdfe6ee, 0x0b0c0d, 0.55], dir: 0xfff4e2, dirI: 2.0,
      spot: 0xffe6c2, spotI: 16, exposure: 1.05, env: 0.55, metal: true,
    },
  },
  music: {
    aspect: 1, cols: 12, gap: 0.055, rowH: 0.58, coverW: 0.40, board: 0.045, depth: 0.34,
    theme: {
      bg: 0x0a0b0c, fog: [14, 32], back: 0x17110d, floor: 0x0c0b0a,
      wood: 0x5b3f2d, woodDark: 0x3f2b1e, paper: 0xece4d3,
      hemi: [0xfff3df, 0x241a12, 0.55], dir: 0xfff0d2, dirI: 2.4,
      spot: 0xffe2b8, spotI: 20, exposure: 1.05, env: 0.45, metal: false,
    },
  },
};

const app = document.getElementById('app');
const medium = app?.dataset.medium || 'music';
const src = app?.dataset.src || `../data/${medium}.json`;
const cfg = ROOMS[medium] || ROOMS.music;
const theme = cfg.theme;

function fail(err) {
  console.error('[mouseion]', err);
  const f = document.getElementById('fallback');
  if (f) f.hidden = false;
  const l = document.getElementById('loading');
  if (l) l.textContent = '3D unavailable';
}

function woodTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#5b3f2d'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 180; i++) {
    const y = Math.random() * 512;
    g.strokeStyle = `rgba(${20 + Math.random() * 30},${12 + Math.random() * 18},${6 + Math.random() * 12},${.05 + Math.random() * .12})`;
    g.lineWidth = .6 + Math.random() * 2;
    g.beginPath();
    for (let x = 0; x <= 512; x += 16) g.lineTo(x, y + Math.sin(x * .02 + i) * 2 + Math.random() * 2);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  t.anisotropy = 8;
  return t;
}

function coverMaterial(tex) {
  return new THREE.MeshStandardMaterial({
    map: tex || null, color: tex ? 0xffffff : 0x2a2622,
    roughness: .55, metalness: .02,
  });
}

function loadTexture(loader, url) {
  return new Promise((resolve) => {
    loader.load(url, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      resolve(t);
    }, undefined, () => resolve(null));
  });
}

async function main() {
  let data;
  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`feed ${res.status}`);
    data = await res.json();
  } catch (e) { fail(e); return; }
  const items = (data.items || []).filter((x) => x.cover);
  if (!items.length) { fail(new Error('empty feed')); return; }

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = theme.exposure;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  app.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(theme.bg);
  scene.fog = new THREE.Fog(theme.bg, theme.fog[0], theme.fog[1]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = theme.env;

  const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, .1, 80);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = .06;
  controls.maxPolarAngle = 1.62;

  scene.add(new THREE.HemisphereLight(theme.hemi[0], theme.hemi[1], theme.hemi[2]));
  const key = new THREE.DirectionalLight(theme.dir, theme.dirI);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -.0004;
  key.shadow.normalBias = .02;
  scene.add(key);
  const warm = new THREE.SpotLight(theme.spot, theme.spotI, 22, .72, .85, 1.2);
  warm.castShadow = true;
  warm.shadow.mapSize.set(1024, 1024);
  scene.add(warm, warm.target);
  scene.add(new THREE.AmbientLight(theme.paper, theme.metal ? .08 : .12));

  // ---------- geometry ----------
  const coverH = cfg.coverW / cfg.aspect;
  const rows = Math.ceil(items.length / cfg.cols);
  const W = cfg.cols * cfg.coverW + (cfg.cols - 1) * cfg.gap + .18;
  const H = rows * cfg.rowH + cfg.board;

  const wood = woodTexture();
  const woodMat = new THREE.MeshStandardMaterial({ map: wood, bumpMap: wood, bumpScale: .02, roughness: .6, metalness: .02 });
  const darkMat = new THREE.MeshStandardMaterial({ map: wood, color: theme.woodDark, roughness: .65, metalness: .02 });
  const metalMat = new THREE.MeshStandardMaterial({ color: theme.wood, roughness: .42, metalness: .65 });
  const metalDark = new THREE.MeshStandardMaterial({ color: theme.woodDark, roughness: .5, metalness: .55 });
  const backMat = new THREE.MeshStandardMaterial({ color: theme.back, roughness: .92 });
  const shelfMat = theme.metal ? metalMat : woodMat;
  const trimMat = theme.metal ? metalDark : darkMat;
  const rimMat = new THREE.MeshStandardMaterial({ color: theme.paper, roughness: .7, metalness: .02 });

  const wall = new THREE.Group();
  scene.add(wall);
  function box(w, h, d, mat, x, y, z, shadow = true) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = shadow; m.receiveShadow = true;
    wall.add(m);
    return m;
  }

  box(W + .1, H + .06, .03, backMat, 0, H / 2, -cfg.depth / 2 - .02, false);
  for (let r = 0; r <= rows; r++) box(W, cfg.board, cfg.depth, shelfMat, 0, r * cfg.rowH + cfg.board / 2, 0);
  box(.055, H, cfg.depth, trimMat, -W / 2 - .028, H / 2, 0);
  box(.055, H, cfg.depth, trimMat, W / 2 + .028, H / 2, 0);
  box(W + .16, .06, cfg.depth + .02, trimMat, 0, H + .01, 0);
  box(W + .16, .07, cfg.depth + .02, trimMat, 0, -.01, 0);

  if (medium === 'film') {
    const holeMat = new THREE.MeshStandardMaterial({ color: 0xcfc6b4, roughness: .8, metalness: 0 });
    for (let x = -W / 2 + .06; x <= W / 2 - .06; x += .13) {
      box(.07, .026, .012, holeMat, x, H + .01, cfg.depth / 2 + .012, false);
      box(.07, .026, .012, holeMat, x, 0, cfg.depth / 2 + .012, false);
    }
  }

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: theme.floor, roughness: 1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -.03;
  floor.receiveShadow = true;
  scene.add(floor);

  // ---------- textures + covers ----------
  const loader = new THREE.TextureLoader();
  const textures = await Promise.all(items.map((it) => loadTexture(loader, it.cover)));

  const pickables = [];
  const geo = new RoundedBoxGeometry(cfg.coverW, coverH, cfg.depth, 3, .004);
  const rimGeo = new THREE.PlaneGeometry(cfg.coverW + .012, coverH + .012);
  const faceGeo = new THREE.PlaneGeometry(cfg.coverW - .006, coverH - .006);

  items.forEach((it, i) => {
    const row = Math.floor(i / cfg.cols), col = i % cfg.cols;
    const x = -W / 2 + .09 + col * (cfg.coverW + cfg.gap) + cfg.coverW / 2;
    const y = row * cfg.rowH + cfg.board + (cfg.rowH - cfg.board - coverH) / 2 + coverH / 2;

    const caseMat = theme.metal ? metalDark : darkMat;
    const caseMesh = new THREE.Mesh(geo, caseMat);
    caseMesh.position.set(x, y, 0);
    caseMesh.castShadow = true; caseMesh.receiveShadow = true;
    caseMesh.userData.href = it.href;
    wall.add(caseMesh);
    pickables.push(caseMesh);

    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.set(x, y, cfg.depth / 2 + .001);
    wall.add(rim);

    const face = new THREE.Mesh(faceGeo, coverMaterial(textures[i]));
    face.position.set(x, y, cfg.depth / 2 + .003);
    face.userData.href = it.href;
    wall.add(face);
    pickables.push(face);
  });

  // ---------- lights follow wall size ----------
  key.position.set(W * .35, H * .9, 4.8);
  key.target.position.set(0, H * .45, 0);
  scene.add(key.target);
  key.shadow.camera.left = -(W / 2 + 1);
  key.shadow.camera.right = W / 2 + 1;
  key.shadow.camera.top = H + 1;
  key.shadow.camera.bottom = -1;
  key.shadow.camera.near = .5;
  key.shadow.camera.far = Math.max(24, H * 3);
  key.shadow.camera.updateProjectionMatrix();
  warm.position.set(0, H + 1.2, 4.2);
  warm.target.position.set(0, H * .5, 0);
  warm.distance = Math.max(22, H * 3);

  // ---------- camera framing ----------
  function fit() {
    const vFov = 30 * Math.PI / 180;
    const dV = (H / 2 + .2) / Math.tan(vFov / 2);
    const dH = (W / 2 + .3) / (Math.tan(vFov / 2) * camera.aspect);
    const d = Math.max(dV, dH) * 1.04;
    camera.position.set(0, H / 2 + .08, d + 1.0);
    controls.target.set(0, H / 2, 0);
    controls.minDistance = d * .5;
    controls.maxDistance = d * 1.9;
    controls.update();
  }
  fit();

  // ---------- interaction ----------
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  let down = null;

  function pick(e) {
    ptr.x = (e.clientX / innerWidth) * 2 - 1;
    ptr.y = -(e.clientY / innerHeight) * 2 + 1;
    ray.setFromCamera(ptr, camera);
    return ray.intersectObjects(pickables, false)[0] || null;
  }

  renderer.domElement.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    down = null;
    if (moved > 10) return;
    const hit = pick(e);
    if (hit?.object.userData.href) window.open(hit.object.userData.href, '_blank', 'noopener');
  });
  renderer.domElement.addEventListener('pointermove', (e) => {
    renderer.domElement.style.cursor = pick(e) ? 'pointer' : 'grab';
  });

  let framedAspect = camera.aspect;
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    if (Math.abs(camera.aspect - framedAspect) > .05) {
      framedAspect = camera.aspect;
      fit();
    }
  });

  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
  });

  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.opacity = 0;
    setTimeout(() => loading.remove(), 650);
  }
}

main().catch(fail);

// MOUSEION 3D room engine — one geometry, three mediums.
// Reads <div id="app" data-medium="book|film|music" data-src="../data/<medium>.json">.
//
// book / film: one fixed shelf, all covers.
// music: fixed frame, N fixed shelf rows; each row slides sideways independently.
//        Only the visible slots (+2 buffer) exist/load textures, so the cost is
//        constant as the collection grows.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const ROOMS = {
  book: {
    aspect: 2 / 3, maxRows: 2, colsWide: 5, colsMid: 4, colsNarrow: 3,
    gap: 0.06, rowH: 0.80, coverW: 0.48, board: 0.045, depth: 0.36,
    theme: {
      bg: 0xe9e2d3, fog: [18, 46], back: 0xd8cfbd, floor: 0xcfc4ae,
      wood: 0x8a6547, woodDark: 0x5a3e2b, paper: 0xf7f1e4,
      hemi: [0xfffaf0, 0x8a7a60, 0.85], dir: 0xfff4e0, dirI: 2.2,
      spot: 0xfff0d6, spotI: 14, exposure: 1.0, env: 0.4, metal: false,
    },
  },
  film: {
    aspect: 2 / 3, maxRows: 2, colsWide: 7, colsMid: 5, colsNarrow: 4,
    gap: 0.05, rowH: 0.64, coverW: 0.38, board: 0.04, depth: 0.30,
    theme: {
      bg: 0x0b0c0d, fog: [16, 42], back: 0x111315, floor: 0x08090a,
      wood: 0x2b2e31, woodDark: 0x17191b, paper: 0x17191b,
      hemi: [0xdfe6ee, 0x0b0c0d, 0.55], dir: 0xfff4e2, dirI: 2.0,
      spot: 0xffe6c2, spotI: 16, exposure: 1.05, env: 0.55, metal: true,
    },
  },
  music: {
    aspect: 1, maxRows: 8, colsWide: 20, colsMid: 14, colsNarrow: 8,
    gap: 0.055, rowH: 0.58, coverW: 0.40, board: 0.045, depth: 0.34,
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

function coverMaterial(map) {
  return new THREE.MeshStandardMaterial({
    map: map || null, color: map ? 0xffffff : 0x2a2622,
    roughness: .55, metalness: .02,
  });
}

function hideLoading() {
  const loading = document.getElementById('loading');
  if (!loading) return;
  loading.style.opacity = 0;
  setTimeout(() => loading.remove(), 650);
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
  // left-drag on an overflowing shelf row slides it; right-drag always orbits.
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.ROTATE,
  };

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

  // ---------- frame geometry ----------
  const coverH = cfg.coverW / cfg.aspect;
  const aspect = innerWidth / innerHeight;
  const visibleCols = aspect < .7 ? cfg.colsNarrow : aspect < 1.2 ? cfg.colsMid : cfg.colsWide;
  const rows = Math.min(cfg.maxRows, Math.max(1, Math.ceil(items.length / visibleCols)));
  const W = visibleCols * cfg.coverW + (visibleCols - 1) * cfg.gap + .18;
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

  // ---------- cover meshes ----------
  const loader = new THREE.TextureLoader();
  const texCache = new Map(); // url -> Promise<Texture|null>
  function textureFor(url) {
    if (!texCache.has(url)) {
      texCache.set(url, new Promise((resolve) => {
        loader.load(url, (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = 8;
          resolve(t);
        }, undefined, () => resolve(null));
      }));
    }
    return texCache.get(url);
  }

  const pickables = [];
  const geo = new RoundedBoxGeometry(cfg.coverW, coverH, cfg.depth, 3, .004);
  const rimGeo = new THREE.PlaneGeometry(cfg.coverW + .012, coverH + .012);
  const faceGeo = new THREE.PlaneGeometry(cfg.coverW - .006, coverH - .006);
  const baseCaseMat = theme.metal ? metalDark : darkMat;

  const rowY = (r) => r * cfg.rowH + cfg.board + (cfg.rowH - cfg.board - coverH) / 2 + coverH / 2;

  // Fixed frame + per-row sliding strips. Only visible slots exist.
    renderer.localClippingEnabled = true;
    const clipL = new THREE.Plane(new THREE.Vector3(1, 0, 0), -(-W / 2 + .02));
    const clipR = new THREE.Plane(new THREE.Vector3(-1, 0, 0), W / 2 - .02);
    const clip = [clipL, clipR];
    const caseMat = baseCaseMat.clone(); caseMat.clippingPlanes = clip;
    const rimClip = rimMat.clone(); rimClip.clippingPlanes = clip;

    const slots = visibleCols + 2;
    const perRow = Math.ceil(items.length / rows);
    const rowItems = Array.from({ length: rows }, (_, r) =>
      items.slice(r * perRow, Math.min(items.length, (r + 1) * perRow)));
    const offsets = new Array(rows).fill(0);
    const pools = [];

    for (let r = 0; r < rows; r++) {
      const y = rowY(r);
      const pool = [];
      for (let s = 0; s < slots; s++) {
        const c = new THREE.Mesh(geo, caseMat);
        c.position.set(0, y, 0);
        c.castShadow = true; c.receiveShadow = true;
        wall.add(c); pickables.push(c);

        const rim = new THREE.Mesh(rimGeo, rimClip);
        rim.position.set(0, y, cfg.depth / 2 + .001);
        wall.add(rim);

        const fm = coverMaterial(null); fm.clippingPlanes = clip;
        const face = new THREE.Mesh(faceGeo, fm);
        face.position.set(0, y, cfg.depth / 2 + .003);
        wall.add(face); pickables.push(face);

        pool.push({ case: c, rim, face, url: null });
      }
      pools.push(pool);
    }

    const maxOff = rowItems.map((list) => Math.max(0, list.length - visibleCols));
    const hintEl = document.querySelector('.hint');
    if (hintEl && maxOff.some((x) => x > 0)) {
      hintEl.textContent = 'drag a shelf sideways · right-drag / background to orbit · scroll to zoom';
    }

    function placeRow(r) {
      const list = rowItems[r], off = offsets[r];
      const start = Math.floor(off) - 1;
      for (let s = 0; s < slots; s++) {
        const c2 = start + s;
        const slot = pools[r][s];
        if (c2 < 0 || c2 >= list.length) {
          slot.case.visible = slot.rim.visible = slot.face.visible = false;
          slot.url = null;
          continue;
        }
        const x = -W / 2 + .09 + (c2 - off) * (cfg.coverW + cfg.gap) + cfg.coverW / 2;
        slot.case.visible = slot.rim.visible = slot.face.visible = true;
        slot.case.position.x = x;
        slot.rim.position.x = x;
        slot.face.position.x = x;
        const it = list[c2];
        slot.case.userData.href = it.href;
        slot.face.userData.href = it.href;
        if (slot.url !== it.cover) {
          slot.url = it.cover;
          const m = slot.face.material;
          m.map = null; m.color.setHex(0x2a2622); m.needsUpdate = true;
          textureFor(it.cover).then((t) => {
            if (slot.url === it.cover && t) {
              m.map = t; m.color.setHex(0xffffff); m.needsUpdate = true;
            }
          });
        }
      }
    }

    rowItems.forEach((_, r) => placeRow(r));
    // Wait only for the first screenful, not the whole collection.
    Promise.all(pools.flat().filter((s) => s.url).map((s) => textureFor(s.url)))
      .then(hideLoading);

    // ---------- per-row drag ----------
    const rowRay = new THREE.Raycaster();
    const rowPtr = new THREE.Vector2();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const hit = new THREE.Vector3();
    function rowAt(e) {
      rowPtr.x = (e.clientX / innerWidth) * 2 - 1;
      rowPtr.y = -(e.clientY / innerHeight) * 2 + 1;
      rowRay.setFromCamera(rowPtr, camera);
      if (!rowRay.ray.intersectPlane(plane, hit)) return -1;
      const r = Math.floor((hit.y - cfg.board) / cfg.rowH);
      return r >= 0 && r < rows ? r : -1;
    }

    let drag = null;
    // Capture phase: if the press starts on a shelf row, reserve the gesture for
    // row-sliding and keep OrbitControls from rotating. Press outside the rows
    // falls through to OrbitControls, so the shelf still orbits in 3D.
    renderer.domElement.addEventListener('pointerdown', (e) => {
      window.__mouseionRowDragged = false;
      if (e.button !== 0) return;
      const r = rowAt(e);
      if (r < 0 || maxOff[r] <= 0) return;
      controls.enableRotate = false;
      drag = { row: r, x: e.clientX, off: offsets[r], moved: 0 };
    }, true);
    renderer.domElement.addEventListener('pointermove', (e) => {
      if (!drag) { renderer.domElement.style.cursor = pick(e) ? 'pointer' : 'grab'; return; }
      const dx = e.clientX - drag.x;
      drag.moved = Math.max(drag.moved, Math.abs(dx));
      if (Math.abs(dx) > 2) {
        const dist = camera.position.distanceTo(controls.target);
        const perPx = 2 * dist * Math.tan(15 * Math.PI / 180) * camera.aspect / innerWidth;
        const off = drag.off - dx * perPx / (cfg.coverW + cfg.gap);
        offsets[drag.row] = Math.max(0, Math.min(maxOff[drag.row], off));
        placeRow(drag.row);
        renderer.domElement.style.cursor = 'grabbing';
      }
    });
    function endRowDrag() {
      controls.enableRotate = true;
      if (!drag) return;
      window.__mouseionRowDragged = drag.moved > 4;
      offsets[drag.row] = Math.round(offsets[drag.row]);
      placeRow(drag.row);
      drag = null;
      renderer.domElement.style.cursor = 'grab';
    }
    renderer.domElement.addEventListener('pointerup', endRowDrag);
    renderer.domElement.addEventListener('pointercancel', endRowDrag);
    addEventListener('pointerup', endRowDrag);
    addEventListener('pointercancel', endRowDrag);

  // ---------- lights follow frame ----------
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

  // ---------- camera ----------
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

  // ---------- click ----------
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
    if (e.button !== 0) return;
    const wasRowDrag = window.__mouseionRowDragged;
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    down = null;
    if (wasRowDrag || moved > 10) return;
    const hitObj = pick(e);
    if (hitObj?.object.userData.href) window.open(hitObj.object.userData.href, '_blank', 'noopener');
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
}

main().catch(fail);

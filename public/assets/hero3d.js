window.__startAnim = function(){
'use strict';

/* =====================================================================
   COR DAS CENAS 3D: troque aqui se mudar o vermelho do site.
   ===================================================================== */
var CONTAINER_ID = 'animacao-3d';   /* id da div onde a animação aparece */
var RED_HEX = 0xff1e1e;      /* vermelho do neon */
var HOT_HEX = 0xffb8ae;      /* núcleo claro do neon */

var root = document.getElementById(CONTAINER_ID);
if (!root) return;
/* =====================================================================
   MOVIMENTO REDUZIDO: muitos computadores com Windows estão com os
   "Efeitos de animação" desligados, e nesse caso o navegador pede menos
   movimento. Com false (padrão), a animação roda para todo mundo.
   Com true, esses visitantes veem as cenas paradas.
   ===================================================================== */
var RESPEITAR_MOVIMENTO_REDUZIDO = false;
var reduced = RESPEITAR_MOVIMENTO_REDUZIDO && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced) root.classList.add('cx-reduced');
var isMobile = window.matchMedia('(max-width: 860px)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
var DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);

/* ---------- checagem de WebGL ---------- */
function webglOK(){
  try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); }
  catch (e) { return false; }
}
if (!window.THREE || !webglOK()) { root.classList.add('cx-no-webgl'); return; }

var UP = new THREE.Vector3(0, 1, 0);

/* ---------- utilitários ---------- */
function glowTexture(){
  var s = 128, c = document.createElement('canvas'); c.width = c.height = s;
  var g = c.getContext('2d'), r = g.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(0.18, 'rgba(255,200,190,.75)');
  r.addColorStop(0.42, 'rgba(255,255,255,.22)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, s, s);
  return new THREE.CanvasTexture(c);
}
var GLOW = glowTexture();

function glowSprite(scale, opacity){
  var m = new THREE.SpriteMaterial({ map: GLOW, color: RED_HEX, transparent: true, opacity: opacity, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false });
  var s = new THREE.Sprite(m); s.scale.set(scale, scale, 1); return s;
}
function tube(a, b, r, mat){
  var dir = new THREE.Vector3().subVectors(b, a), len = dir.length();
  var m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6, 1), mat);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(UP, dir.normalize());
  return m;
}
function v3(x, y, z){ return new THREE.Vector3(x, y, z || 0); }
function lerp(a, b, t){ return a + (b - a) * t; }
function clamp01(x){ return x < 0 ? 0 : x > 1 ? 1 : x; }

/* =====================================================================
   BENS REALISTAS: carro, prédio, colheitadeira e casa.
   Tudo é construído em código (sem arquivos de modelo), com materiais
   físicos (pintura, vidro, metal, madeira, concreto) e um ambiente de
   estúdio para os reflexos.
   ===================================================================== */
function makeRealAssets(THREE, renderer, isMobile){
  var V3 = THREE.Vector3, PI = Math.PI;

  /* ---------- ambiente de estúdio (só para reflexos) ---------- */
  function makeEnv(){
    var es = new THREE.Scene();
    var room = new THREE.Mesh(new THREE.BoxGeometry(20, 12, 20), new THREE.MeshStandardMaterial({ color: 0x3c3c44, roughness: 1, metalness: 0, side: THREE.BackSide }));
    room.position.y = 3; es.add(room);
    var pl = new THREE.PointLight(0xffffff, 1.2, 30, 2); pl.position.set(0, 6, 0); es.add(pl);
    function panel(w, h, x, y, z, rx, ry, r, g, b){
      var m = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }); m.color.setRGB(r, g, b);
      var p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.set(rx, ry, 0); es.add(p);
    }
    panel(9, 5, 0, 8.7, 0, PI / 2, 0, 5.5, 5.5, 6);         /* softbox no teto */
    panel(5, 6, -9.5, 3, 3, 0, PI / 2, 3.6, 3.5, 3.4);      /* lateral esquerda */
    panel(3, 7, 9.5, 3, -2, 0, -PI / 2, 2.2, 2.3, 2.7);       /* lateral direita, mais fria */
    panel(9, 1.1, 0, 0.1, -9.6, 0, 0, 5, 0.5, 0.4);          /* faixa vermelha ao fundo, ecoa o neon */
    panel(6, 2.5, 2, 2.5, 9.6, 0, PI, 1.8, 1.8, 1.9);          /* frente */
    var pm = new THREE.PMREMGenerator(renderer), tex = pm.fromScene(es, 0.03).texture; pm.dispose();
    return tex;
  }
  var ENV = makeEnv();

  /* ---------- materiais ---------- */
  function std(o){ var m = new THREE.MeshStandardMaterial(o); m.color.convertSRGBToLinear(); m.envMap = ENV; return m; }
  function phys(o){ var m = new THREE.MeshPhysicalMaterial(o); m.color.convertSRGBToLinear(); m.envMap = ENV; return m; }
  function basic(hex){ var m = new THREE.MeshBasicMaterial({ color: hex }); m.color.convertSRGBToLinear(); m.toneMapped = false; return m; }
  var MAT = {
    paintSilver: phys({ color: 0x3a3e45, metalness: 0.85, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.9 }),
    paintRed: phys({ color: 0xc4151c, metalness: 0.3, roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.14, envMapIntensity: 1 }),
    glassDark: std({ color: 0x0a1015, metalness: 0.95, roughness: 0.05, envMapIntensity: 1.6 }),
    glassCab: std({ color: 0x14242c, metalness: 0.9, roughness: 0.05, envMapIntensity: 2.2 }),
    glassClear: phys({ color: 0xc4dbe4, metalness: 0.25, roughness: 0.03, transparent: true, opacity: 0.26, envMapIntensity: 1.7, depthWrite: false }),
    chrome: std({ color: 0xf4f4f4, metalness: 1, roughness: 0.1, envMapIntensity: 1.3 }),
    alloy: std({ color: 0xc9ccd2, metalness: 1, roughness: 0.24, envMapIntensity: 1.2 }),
    steel: std({ color: 0x9da0a6, metalness: 0.9, roughness: 0.4 }),
    darkMetal: std({ color: 0x25272c, metalness: 0.7, roughness: 0.45 }),
    darkMetalDS: std({ color: 0x1b1c20, metalness: 0.6, roughness: 0.55, side: THREE.DoubleSide }),
    blackGloss: std({ color: 0x08080a, metalness: 0.4, roughness: 0.16, envMapIntensity: 1.2 }),
    blackMatte: std({ color: 0x131315, metalness: 0.1, roughness: 0.85, envMapIntensity: 0.5 }),
    rubber: std({ color: 0x0d0d0f, metalness: 0, roughness: 0.9, envMapIntensity: 0.45 }),
    white: std({ color: 0xd9d6cf, metalness: 0, roughness: 0.8, envMapIntensity: 0.7 }),
    cream: std({ color: 0xe6e1d3, metalness: 0.25, roughness: 0.5 }),
    concrete: std({ color: 0x9c9b96, metalness: 0, roughness: 0.92, envMapIntensity: 0.5 }),
    stone: std({ color: 0x6c6b67, metalness: 0, roughness: 0.88, envMapIntensity: 0.5 }),
    graphite: std({ color: 0x2b2c30, metalness: 0.3, roughness: 0.6 }),
    wood: std({ color: 0xa06f3e, metalness: 0, roughness: 0.6, envMapIntensity: 0.7 }),
    woodDeck: std({ color: 0xb08556, metalness: 0, roughness: 0.7, envMapIntensity: 0.6 }),
    woodDark: std({ color: 0x4a2f1a, metalness: 0, roughness: 0.7, envMapIntensity: 0.5 }),
    grass: std({ color: 0x3c5f30, metalness: 0, roughness: 1, envMapIntensity: 0.25 }),
    leaf: std({ color: 0x2f5529, metalness: 0, roughness: 0.95, envMapIntensity: 0.3 }),
    water: std({ color: 0x1ea3c2, metalness: 0.35, roughness: 0.03, envMapIntensity: 1.8 }),
    grain: std({ color: 0xc08a2a, metalness: 0, roughness: 0.95, envMapIntensity: 0.3 }),
    warm: basic(0xffd9a3), warmDim: basic(0xc98f52), warmDark: basic(0x6e4526),
    ledWhite: basic(0xffffff), ledRed: basic(0xff2a1e), ledAmber: basic(0xffa21e)
  };

  /* ---------- utilitários de geometria ---------- */
  function mesh(geo, mat, x, y, z, parent){
    var m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true; m.receiveShadow = true; if (parent) parent.add(m); return m;
  }
  function box(w, h, d){ return new THREE.BoxGeometry(w, h, d); }
  function cyl(r, len, seg){ return new THREE.CylinderGeometry(r, r, len, seg || 20); }
  function prism(pts, depth, bv){   /* perfil lateral (x,y) extrudado em z e centrado */
    var s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    s.closePath(); bv = bv || 0;
    var g = new THREE.ExtrudeGeometry(s, { depth: depth - 2 * bv, bevelEnabled: bv > 0, bevelThickness: bv, bevelSize: bv, bevelSegments: 2 });
    g.translate(0, 0, -(depth - 2 * bv) / 2); return g;
  }
  function rod(a, b, r, mat, parent, seg){
    var d = new V3().subVectors(b, a), len = d.length(), m = mesh(cyl(r, len, seg || 10), mat, 0, 0, 0, parent);
    m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new V3(0, 1, 0), d.normalize()); return m;
  }
  function v(x, y, z){ return new V3(x, y, z); }
  function spline(P){
    var n = P.length, m = [];
    for (var i = 0; i < n; i++) { var a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)]; m.push((b[1] - a[1]) / (b[0] - a[0])); }
    return function(x){
      if (x <= P[0][0]) return P[0][1]; if (x >= P[n - 1][0]) return P[n - 1][1];
      var k = 0; while (x > P[k + 1][0]) k++;
      var x0 = P[k][0], h = P[k + 1][0] - x0, t = (x - x0) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * P[k][1] + (t3 - 2 * t2 + t) * h * m[k] + (-2 * t3 + 3 * t2) * P[k + 1][1] + (t3 - t2) * h * m[k + 1];
    };
  }
  function rng(seed){ return function(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---------- roda (eixo em z, face externa em +z) ---------- */
  var QZ = new THREE.Quaternion(), QX = new THREE.Quaternion(), AXZ = v(0, 0, 1), AXX = v(1, 0, 0);
  function makeWheel(R, W, rimMat, o){
    o = o || {}; var g = new THREE.Group(), rr = R * (o.rimRatio || 0.66), b = Math.min(W * 0.24, R * 0.13), i, a;
    var prof = [[rr, -W / 2], [R - b, -W / 2], [R - b * 0.3, -W / 2 + b * 0.3], [R, -W / 2 + b], [R, W / 2 - b], [R - b * 0.3, W / 2 - b * 0.3], [R - b, W / 2], [rr, W / 2]]
      .map(function(p){ return new THREE.Vector2(p[0], p[1]); });
    var tire = mesh(new THREE.LatheGeometry(prof, 44), MAT.rubber, 0, 0, 0, g); tire.rotation.x = PI / 2;
    var barrel = mesh(new THREE.CylinderGeometry(rr, rr, W * 0.96, 36, 1, true), MAT.darkMetalDS, 0, 0, 0, g); barrel.rotation.x = PI / 2;
    var zf = W / 2 - R * 0.07;
    mesh(new THREE.TorusGeometry(rr - R * 0.03, R * 0.045, 8, 44), rimMat, 0, 0, zf, g);
    if (o.solid) {
      var dish = [[0, 0], [rr * 0.3, 0], [rr * 0.5, -R * 0.14], [rr * 0.9, -R * 0.14], [rr * 0.97, 0]].map(function(p){ return new THREE.Vector2(p[0], p[1]); });
      var dm = mesh(new THREE.LatheGeometry(dish, 36), rimMat, 0, 0, zf, g); dm.rotation.x = PI / 2; dm.material = rimMat;
      var hub = mesh(cyl(rr * 0.22, R * 0.12, 18), MAT.darkMetal, 0, 0, zf + R * 0.03, g); hub.rotation.x = PI / 2;
      for (i = 0; i < 8; i++) { a = i / 8 * PI * 2; var bolt = mesh(cyl(rr * 0.035, R * 0.05, 6), MAT.steel, Math.cos(a) * rr * 0.36, Math.sin(a) * rr * 0.36, zf + R * 0.01, g); bolt.rotation.x = PI / 2; }
    } else {
      var disc = mesh(cyl(rr * 0.74, 0.006, 30), MAT.steel, 0, 0, zf - R * 0.28, g); disc.rotation.x = PI / 2;
      var cal = mesh(box(rr * 0.34, rr * 0.5, R * 0.16), MAT.ledRed, rr * 0.56, 0, zf - R * 0.24, g); cal.material = MAT.paintRed;
      var hb = mesh(cyl(rr * 0.24, R * 0.2, 20), rimMat, 0, 0, zf - R * 0.06, g); hb.rotation.x = PI / 2;
      var ns = o.spokes || 5;
      for (i = 0; i < ns; i++) for (var s = -1; s <= 1; s += 2) {
        a = i / ns * PI * 2 + s * 0.17;
        var sp = mesh(box(rr * 0.86, rr * 0.105, R * 0.09), rimMat, Math.cos(a) * rr * 0.54, Math.sin(a) * rr * 0.54, zf - R * 0.07, g); sp.rotation.z = a;
      }
    }
    if (o.lugs) {
      var n = o.lugs, im = new THREE.InstancedMesh(box(R * 0.1, R * 0.12, W * 0.54), MAT.rubber, n * 2), d = new THREE.Object3D(), k = 0;
      for (i = 0; i < n; i++) for (var s2 = -1; s2 <= 1; s2 += 2) {
        a = (i + (s2 > 0 ? 0.5 : 0)) / n * PI * 2;
        d.position.set(Math.cos(a) * R * 1.02, Math.sin(a) * R * 1.02, s2 * W * 0.235);
        QZ.setFromAxisAngle(AXZ, a); QX.setFromAxisAngle(AXX, s2 * 0.5); d.quaternion.copy(QZ).multiply(QX);
        d.updateMatrix(); im.setMatrixAt(k++, d.matrix);
      }
      im.instanceMatrix.needsUpdate = true; im.castShadow = true; g.add(im);
    }
    return g;
  }

  var LEAF_TONES = [0x2c5127, 0x3a6731, 0x24452a, 0x466f35].map(function(h){ return new THREE.Color(h).convertSRGBToLinear(); });
  var LEAF_MAT = std({ color: 0xffffff, metalness: 0, roughness: 0.95, envMapIntensity: 0.3 });
  function tree(parent, x, y, z, s, seed){
    s = s || 1; var rnd = rng(Math.round((x * 977 + z * 131 + (seed || 0)) * 100) + 7), list = parent.userData.blobs || (parent.userData.blobs = []);
    var trunk = mesh(new THREE.CylinderGeometry(0.006 * s, 0.011 * s, 0.15 * s, 6), MAT.woodDark, x, y + 0.075 * s, z, parent);
    trunk.rotation.z = (rnd() - 0.5) * 0.12;
    for (var i = 0; i < 20; i++) {
      var h = 0.11 + rnd() * 0.17, k = (h - 0.195) / 0.095, rad = 0.082 * Math.sqrt(Math.max(0.05, 1 - k * k)) * Math.sqrt(rnd()), a = rnd() * PI * 2;
      list.push([x + Math.cos(a) * rad * s, y + h * s, z + Math.sin(a) * rad * s, (0.024 + rnd() * 0.022) * s, Math.floor(rnd() * 4)]);
    }
  }
  function bush(parent, x, y, z, r){ var list = parent.userData.blobs || (parent.userData.blobs = []); list.push([x, y, z, r, 1], [x + r * 0.9, y - r * 0.15, z + r * 0.3, r * 0.75, 3], [x - r * 0.6, y - r * 0.1, z - r * 0.5, r * 0.7, 0]); }
  function flushFoliage(parent){
    var list = parent.userData.blobs; if (!list || !list.length) return;
    var im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), LEAF_MAT, list.length), d = new THREE.Object3D();
    list.forEach(function(b, k){ d.position.set(b[0], b[1], b[2]); d.scale.setScalar(b[3]); d.rotation.set(k * 1.3, k * 2.1, k * 0.7); d.updateMatrix(); im.setMatrixAt(k, d.matrix); im.setColorAt(k, LEAF_TONES[b[4]]); });
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.castShadow = true; im.receiveShadow = true; parent.add(im);
  }
  function warmBoxMat(){   /* interior iluminado: degradê quente */
    var c = document.createElement('canvas'); c.width = 8; c.height = 64; var g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 64);
    gr.addColorStop(0, '#fff0cf'); gr.addColorStop(0.45, '#ffd193'); gr.addColorStop(1, '#b9783c'); g.fillStyle = gr; g.fillRect(0, 0, 8, 64);
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
    var wm = new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide }); wm.toneMapped = false; return wm;
  }
  var WARM_IN = warmBoxMat();

  /* =================================================================
     CARRO: sedã fastback, pintura prata metálica
     ================================================================= */
  function makeCar(){
    var g = new THREE.Group(), m = new THREE.Group(); g.add(m);
    var yBot = spline([[-0.96, 0.165], [-0.88, 0.105], [-0.74, 0.08], [0.74, 0.078], [0.88, 0.095], [0.96, 0.135]]);
    var yBelt = spline([[-0.96, 0.335], [-0.90, 0.368], [-0.70, 0.39], [-0.30, 0.39], [0.25, 0.378], [0.55, 0.356], [0.80, 0.322], [0.92, 0.282], [0.96, 0.25]]);
    var ghS = spline([[-0.80, 0], [-0.72, 0.014], [-0.52, 0.092], [-0.32, 0.15], [-0.12, 0.172], [0.02, 0.166], [0.13, 0.135], [0.24, 0.075], [0.33, 0.016], [0.40, 0]]);
    function gh(x){ return (x < -0.80 || x > 0.40) ? 0 : Math.max(0, ghS(x)); }
    var wS = spline([[-0.96, 0.275], [-0.93, 0.335], [-0.85, 0.374], [-0.60, 0.386], [0.50, 0.386], [0.80, 0.372], [0.90, 0.338], [0.94, 0.3], [0.96, 0.262]]);
    var AR = 0.158, AY = 0.136, AX = [0.585, -0.585];
    function yLow(x){ var y = yBot(x); for (var i = 0; i < 2; i++) { var d = x - AX[i]; if (Math.abs(d) < AR) y = Math.max(y, AY + Math.sqrt(AR * AR - d * d)); } return y; }
    var XR0 = 0.918, XR1 = 0.972, J = 17, T = [0.12, 0.35, 0.6, 0.82, 1], S = [0.06, 0.36, 0.68, 0.94], U = [0.75, 0.5, 0.25, 0];
    function ring(x){   /* meia seção transversal: [z, y] */
      var w = wS(x), yl = yLow(x), yb = yBelt(x), h = gh(x), p = [], i;
      p.push([0, yl]); p.push([w - 0.05, yl]); p.push([w - 0.012, yl + 0.02]);
      for (i = 0; i < 5; i++) p.push([w - 0.022 * (2 * T[i] - 1) * (2 * T[i] - 1), yl + 0.02 + (yb - yl - 0.02) * T[i]]);
      for (i = 0; i < 4; i++) p.push([w - 0.047 - 0.085 * S[i], yb + h * S[i]]);
      p.push([w - 0.155, yb + h * 0.995]);
      var zc = w - 0.155, cr = 0.014 + 0.05 * h;
      for (i = 0; i < 4; i++) p.push([zc * U[i], yb + h + cr * (1 - U[i] * U[i])]);
      var ax = Math.abs(x);
      if (ax > XR0) {   /* frente e traseira arredondadas */
        var u = Math.min(1, (ax - XR0) / (XR1 - XR0)), kz = Math.sqrt(1 - 0.72 * u * u), ky = 1 - 0.5 * u * u, yc = yl + (yb - yl) * 0.55;
        for (i = 0; i < p.length; i++) { p[i][0] *= kz; p[i][1] = yc + (p[i][1] - yc) * ky; }
      }
      return p;
    }
    var xs = [], i, j;
    for (i = 0; i <= 96; i++) xs.push(-0.96 + i * 0.02);
    [0.925, 0.935, 0.944, 0.952, 0.958, 0.963, 0.967, 0.970, 0.972].forEach(function(q){ xs.push(q, -q); });
    AX.forEach(function(c){ [1, 0.985, 0.94, 0.86, 0.72].forEach(function(f){ xs.push(c + AR * f, c - AR * f); }); });
    [0.085, 0.325, -0.70, -0.33, 0.2, -0.56, -0.165, -0.115, 0.79, 0.945, -0.95, -0.83, 0.87, -0.875].forEach(function(q){ xs.push(q); });
    xs.sort(function(a, b){ return a - b; });
    var xu = []; xs.forEach(function(q){ if (!xu.length || q - xu[xu.length - 1] > 1e-4) xu.push(q); }); xs = xu;

    var RN = 2 * J - 2, pos = [], rings = [];
    xs.forEach(function(x){
      var r = ring(x); rings.push(r);
      for (j = 0; j < J; j++) pos.push(x, r[j][1], r[j][0]);
      for (j = J - 2; j >= 1; j--) pos.push(x, r[j][1], -r[j][0]);
    });
    var idx = { paint: [], glass: [], dark: [], pillar: [], head: [], tail: [] };
    function matOf(xm, seg){
      if (seg <= 1) return 'dark';
      if (xm > 0.79 && xm < 0.957 && (seg === 7 || (seg === 6 && xm > 0.9))) return 'head';
      if (xm < -0.83 && xm > -0.96 && (seg === 7 || (seg === 6 && xm < -0.905))) return 'tail';
      if (xm < -0.935 && xm > -0.952 && seg >= 8) return 'tail';
      if ((xm > 0.87 || xm < -0.875) && (seg === 2 || seg === 3)) return 'dark';
      if (xm > 0.945 && seg >= 4 && seg <= 5) return 'dark';
      if (seg >= 8 && seg <= 10 && gh(xm) > 0.05) { if (xm > -0.165 && xm < -0.115) return 'pillar'; if (xm > -0.56 && xm < 0.2) return 'glass'; }
      if (seg >= 12) { if (xm > 0.085 && xm < 0.325) return 'glass'; if (xm > -0.70 && xm < -0.33) return 'glass'; }
      return 'paint';
    }
    for (i = 0; i < xs.length - 1; i++) {
      var xm = (xs[i] + xs[i + 1]) / 2;
      for (var r = 0; r < RN; r++) {
        var r2 = (r + 1) % RN, seg = r < J - 1 ? r : RN - 1 - r, a = i * RN + r, b = i * RN + r2, c = (i + 1) * RN + r, d = (i + 1) * RN + r2;
        idx[matOf(xm, seg)].push(a, c, b, b, c, d);
      }
    }
    var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    var all = [], off = 0;
    ['paint', 'glass', 'dark', 'pillar', 'head', 'tail'].forEach(function(k, mi){ geo.addGroup(off, idx[k].length, mi); all = all.concat(idx[k]); off += idx[k].length; });
    geo.setIndex(all); geo.computeVertexNormals();
    if (geo.attributes.normal.getZ(Math.floor(xs.length / 2) * RN + 5) < 0) {
      for (i = 0; i < all.length; i += 3) { var tmp = all[i + 1]; all[i + 1] = all[i + 2]; all[i + 2] = tmp; }
      geo.setIndex(all); geo.computeVertexNormals();
    }
    mesh(geo, [MAT.paintSilver, MAT.glassDark, MAT.blackMatte, MAT.blackGloss, MAT.ledWhite, MAT.ledRed], 0, 0, 0, m);

    var capMat = MAT.paintSilver.clone(); capMat.side = THREE.DoubleSide;
    function cap(si){
      var r = rings[si], x = xs[si], p = [x, (r[0][1] + r[7][1]) / 2, 0], ind = [];
      for (j = 0; j < J; j++) p.push(x, r[j][1], r[j][0]);
      for (j = J - 2; j >= 1; j--) p.push(x, r[j][1], -r[j][0]);
      for (j = 0; j < RN; j++) ind.push(0, 1 + j, 1 + (j + 1) % RN);
      var gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); gg.setIndex(ind); gg.computeVertexNormals();
      mesh(gg, capMat, 0, 0, 0, m);
    }
    cap(0); cap(xs.length - 1);

    /* rodas */
    [[AX[0], 1], [AX[0], -1], [AX[1], 1], [AX[1], -1]].forEach(function(p){
      var w = makeWheel(0.136, 0.1, MAT.alloy); w.position.set(p[0], 0.136, p[1] * 0.337); if (p[1] < 0) w.rotation.y = PI; m.add(w);
    });
    /* friso cromado na base dos vidros, maçanetas, retrovisores, vincos das portas */
    var seamMat = new THREE.LineBasicMaterial({ color: 0x15171a });
    [1, -1].forEach(function(s){
      var pts = []; for (var x = -0.58; x <= 0.215; x += 0.035) { var rg = ring(x); pts.push(v(x, rg[8][1] + 0.002, s * (rg[8][0] + 0.004))); }
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.0045, 5), MAT.chrome, 0, 0, 0, m);
      [0.305, -0.14, -0.50].forEach(function(x){
        var rg = ring(x), lp = []; for (j = 2; j <= 7; j++) lp.push(v(x, rg[j][1], s * (rg[j][0] + 0.0015)));
        m.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(lp), seamMat));
      });
      [0.04, -0.38].forEach(function(x){ mesh(box(0.058, 0.011, 0.008), MAT.chrome, x, yBelt(x) - 0.052, s * (wS(x) - 0.003), m); });
      var mb = mesh(new THREE.SphereGeometry(1, 14, 10), MAT.paintSilver, 0.262, yBelt(0.262) + 0.03, s * (wS(0.262) - 0.012), m); mb.scale.set(0.034, 0.019, 0.026);
      rod(v(0.27, yBelt(0.27) + 0.016, s * (wS(0.27) - 0.05)), v(0.264, yBelt(0.264) + 0.026, s * (wS(0.264) - 0.02)), 0.007, MAT.blackGloss, m);
    });
    /* frente: grade e placa; traseira: barra de luz, placa e escapamentos */
    mesh(box(0.006, 0.026, 0.1), MAT.white, 0.972, 0.2, 0, m);
    mesh(box(0.006, 0.026, 0.1), MAT.white, -0.972, 0.262, 0, m);
    [0.2, -0.2].forEach(function(z){ var e = mesh(cyl(0.017, 0.04, 14), MAT.chrome, -0.93, 0.168, z, m); e.rotation.z = PI / 2; });
    m.position.y = -0.27; m.scale.setScalar(0.98);
    return g;
  }

  /* =================================================================
     PRÉDIO: torre residencial com varandas de vidro
     ================================================================= */
  function facadeMats(cols, rows, seed){
    var W = 512, H = 1024, mk = function(){ var c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
    var c = mk(), e = mk(), q = mk(), g = c.getContext('2d'), h = e.getContext('2d'), p = q.getContext('2d'), rnd = rng(seed);
    g.fillStyle = '#eceae5'; g.fillRect(0, 0, W, H); h.fillStyle = '#000'; h.fillRect(0, 0, W, H); p.fillStyle = 'rgb(0,210,0)'; p.fillRect(0, 0, W, H);
    var cw = W / cols, rh = H / rows;
    for (var r = 0; r < rows; r++) for (var k = 0; k < cols; k++) {
      var x = k * cw + cw * 0.09, y = r * rh + rh * 0.14, w = cw * 0.82, hh = rh * 0.7;
      g.fillStyle = '#131b23'; g.fillRect(x, y, w, hh);
      p.fillStyle = 'rgb(0,14,240)'; p.fillRect(x, y, w, hh);
      g.fillStyle = '#30343b'; g.fillRect(x + w / 2 - 2, y, 4, hh); g.fillRect(x, y, w, 3); g.fillRect(x, y + hh - 3, w, 3);
      if (rnd() < 0.36) {
        var gr = h.createLinearGradient(0, y, 0, y + hh); gr.addColorStop(0, '#ffe2b0'); gr.addColorStop(1, '#e79c50');
        h.globalAlpha = 0.5 + rnd() * 0.5; h.fillStyle = gr; h.fillRect(x + 3, y + 4, w - 6, hh - 8); h.globalAlpha = 1;
        if (rnd() < 0.55) { h.fillStyle = 'rgba(0,0,0,.4)'; var cwid = (w - 6) * (0.2 + rnd() * 0.3); h.fillRect(rnd() < 0.5 ? x + 3 : x + w - 3 - cwid, y + 4, cwid, hh - 8); }
      }
    }
    var map = new THREE.CanvasTexture(c), em = new THREE.CanvasTexture(e), rm = new THREE.CanvasTexture(q);
    map.encoding = THREE.sRGBEncoding; em.encoding = THREE.sRGBEncoding;
    map.anisotropy = em.anisotropy = rm.anisotropy = 4;
    var mt = new THREE.MeshStandardMaterial({ map: map, emissive: 0xffffff, emissiveMap: em, emissiveIntensity: 1, roughnessMap: rm, metalnessMap: rm, roughness: 1, metalness: 1, envMapIntensity: 1.5 });
    mt.envMap = ENV; return mt;
  }
  function makeBuilding(){
    var g = new THREE.Group(), m = new THREE.Group(); g.add(m);
    var FW = 0.64, FD = 0.46, NF = 11, FH = 0.1, Y0 = 0.19, H = NF * FH, G = 0.046, f, i;
    mesh(box(1.22, 0.034, 1.02), MAT.stone, 0, 0.017, 0, m);
    mesh(box(1.17, 0.012, 0.97), MAT.concrete, 0, 0.04, 0, m);
    mesh(box(0.34, 0.012, 0.2), MAT.grass, -0.4, 0.042, 0.37, m); mesh(box(0.3, 0.012, 0.2), MAT.grass, 0.42, 0.042, 0.37, m);
    mesh(box(1.1, 0.012, 0.16), MAT.grass, 0, 0.042, -0.4, m);
    /* térreo: lobby envidraçado e iluminado, pilotis, marquise */
    var LH = Y0 - G - 0.008;
    mesh(box(FW - 0.16, LH, FD - 0.14), WARM_IN, 0, G + LH / 2, -0.01, m);
    mesh(box(0.1, LH * 0.5, 0.06), MAT.warmDark, -0.12, G + LH * 0.25, -0.08, m); mesh(box(0.05, LH * 0.8, 0.05), MAT.warmDim, 0.16, G + LH * 0.4, -0.12, m);
    mesh(box(FW - 0.15, LH, FD - 0.13), MAT.glassClear, 0, G + LH / 2, -0.01, m);
    for (i = 0; i <= 6; i++) { var mx = -(FW - 0.15) / 2 + i * (FW - 0.15) / 6; mesh(box(0.006, LH, 0.006), MAT.darkMetal, mx, G + LH / 2, (FD - 0.13) / 2 - 0.01, m); }
    [[-1, -1], [-1, 1], [1, -1], [1, 1], [0, 1], [0, -1]].forEach(function(p){ mesh(box(0.034, LH, 0.034), MAT.white, p[0] * (FW / 2 - 0.02), G + LH / 2, p[1] * (FD / 2 - 0.02), m); });
    mesh(box(0.26, 0.012, 0.13), MAT.graphite, 0, G + LH * 0.74, FD / 2 + 0.03, m);
    mesh(box(0.16, 0.006, 0.14), MAT.stone, 0, G + 0.003, FD / 2 + 0.08, m);
    /* torre */
    var fac = facadeMats(6, NF, 7), fac2 = facadeMats(4, NF, 19), roofM = MAT.concrete;
    mesh(box(FW, H, FD), [fac2, fac2, roofM, roofM, fac, fac], 0, Y0 + H / 2, 0, m);
    for (f = 0; f <= NF; f++) mesh(box(FW + 0.03, 0.016, FD + 0.03), MAT.white, 0, Y0 + f * FH, 0, m);
    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(function(p){ mesh(box(0.036, H + 0.01, 0.036), MAT.graphite, p[0] * (FW / 2 + 0.004), Y0 + H / 2, p[1] * (FD / 2 + 0.004), m); });
    [1, -1].forEach(function(sx){ mesh(box(0.012, H, 0.07), MAT.graphite, sx * (FW / 2 + 0.008), Y0 + H / 2, 0, m); });
    /* varandas na fachada da frente */
    var zf = FD / 2;
    for (f = 0; f < NF; f++) {
      var y = Y0 + f * FH;
      mesh(box(FW - 0.02, 0.014, 0.09), MAT.white, 0, y, zf + 0.045, m);
      mesh(box(FW - 0.035, 0.042, 0.004), MAT.glassClear, 0, y + 0.028, zf + 0.086, m);
      mesh(box(FW - 0.03, 0.004, 0.007), MAT.chrome, 0, y + 0.05, zf + 0.086, m);
      [-(FW / 2 - 0.012), -0.107, 0.107, FW / 2 - 0.012].forEach(function(x){ mesh(box(0.012, FH - 0.016, 0.088), MAT.white, x, y + FH / 2, zf + 0.045, m); });
    }
    /* coroamento e casa de máquinas */
    mesh(box(FW + 0.06, 0.035, FD + 0.06), MAT.graphite, 0, Y0 + H + 0.0175, 0, m);
    mesh(box(FW + 0.02, 0.006, FD + 0.02), MAT.concrete, 0, Y0 + H + 0.036, 0, m);
    mesh(box(0.26, 0.075, 0.2), MAT.graphite, -0.08, Y0 + H + 0.075, -0.04, m);
    mesh(box(0.1, 0.04, 0.1), MAT.steel, 0.17, Y0 + H + 0.058, 0.06, m);
    rod(v(-0.16, Y0 + H + 0.11, -0.1), v(-0.16, Y0 + H + 0.24, -0.1), 0.004, MAT.steel, m);
    mesh(new THREE.SphereGeometry(0.008, 8, 6), MAT.ledRed, -0.16, Y0 + H + 0.245, -0.1, m);
    /* paisagismo */
    tree(m, -0.47, G, 0.36, 0.95); tree(m, 0.49, G, 0.38, 0.8); tree(m, -0.5, G, -0.38, 0.85); tree(m, 0.48, G, -0.4, 1.0); tree(m, 0, G, -0.42, 0.7);
    bush(m, -0.3, G + 0.02, 0.4, 0.022); bush(m, 0.33, G + 0.02, 0.42, 0.02); flushFoliage(m);
    m.scale.setScalar(0.94); m.position.y = -0.7;
    return g;
  }

  /* =================================================================
     CASA: sobrado moderno com madeira, vidro, deck e piscina
     ================================================================= */
  function slats(parent, mat, a0, a1, y0, y1, fixed, alongX, skip){
    var pitch = 0.026, n = Math.floor((a1 - a0) / pitch), list = [], i;
    for (i = 0; i <= n; i++) { var a = a0 + (a1 - a0 - n * pitch) / 2 + i * pitch; if (!skip || !skip(a)) list.push(a); }
    var geo = alongX ? box(0.015, y1 - y0, 0.012) : box(0.012, y1 - y0, 0.015), im = new THREE.InstancedMesh(geo, mat, list.length), d = new THREE.Object3D();
    list.forEach(function(a, k){ d.position.set(alongX ? a : fixed, (y0 + y1) / 2, alongX ? fixed : a); d.updateMatrix(); im.setMatrixAt(k, d.matrix); });
    im.instanceMatrix.needsUpdate = true; im.castShadow = true; im.receiveShadow = true; parent.add(im);
  }
  function makeHouse(){
    var g = new THREE.Group(), m = new THREE.Group(); g.add(m);
    var G = 0.054, t = 0.03, i, s;
    /* terreno, deck, piscina, garagem coberta e caminho */
    mesh(box(1.74, 0.04, 1.36), MAT.stone, 0, 0.02, 0, m);
    mesh(box(1.70, 0.014, 1.32), MAT.grass, 0, 0.047, 0, m);
    for (i = 0; i < 13; i++) mesh(box(0.8, 0.012, 0.0325), MAT.woodDeck, -0.34, G + 0.006, 0.146 + i * 0.0355, m);
    mesh(box(0.47, 0.018, 0.28), MAT.white, -0.47, G + 0.015, 0.405, m);
    mesh(box(0.42, 0.004, 0.23), MAT.water, -0.47, G + 0.0245, 0.405, m);
    mesh(box(0.44, 0.01, 0.5), MAT.concrete, 0.44, G + 0.005, 0.41, m);
    mesh(box(0.4, 0.01, 0.62), MAT.concrete, 0.48, G + 0.005, -0.09, m);
    [0.2, 0.3, 0.4].forEach(function(z){ mesh(box(0.12, 0.008, 0.07), MAT.concrete, 0.115, G + 0.004, z, m); });
    /* volume térreo (branco), com abertura real de vidro na frente */
    var AX0 = -0.56, AX1 = 0.30, AZ0 = -0.45, AZ1 = 0.12, AH = 0.34, cx = (AX0 + AX1) / 2, cz = (AZ0 + AZ1) / 2, AW = AX1 - AX0, AD = AZ1 - AZ0;
    mesh(box(AW, AH, t), MAT.white, cx, G + AH / 2, AZ0 + t / 2, m);
    mesh(box(t, AH, AD), MAT.white, AX0 + t / 2, G + AH / 2, cz, m);
    mesh(box(t, AH, AD), MAT.white, AX1 - t / 2, G + AH / 2, cz, m);
    mesh(box(AW, 0.03, AD), MAT.white, cx, G + AH - 0.015, cz, m);
    mesh(box(AW, 0.012, AD), MAT.stone, cx, G + 0.006, cz, m);
    mesh(box(0.06, AH, t), MAT.white, AX0 + 0.03, G + AH / 2, AZ1 - t / 2, m);
    mesh(box(0.34, AH, t), MAT.white, -0.04 + 0.17, G + AH / 2, AZ1 - t / 2, m);
    mesh(box(0.46, 0.045, t), MAT.white, -0.27, G + AH - 0.0225, AZ1 - t / 2, m);
    var inner = mesh(box(AW - 2 * t, AH - 0.045, AD - 2 * t), WARM_IN, cx, G + 0.012 + (AH - 0.045) / 2, cz, m); inner.castShadow = false; inner.receiveShadow = false;
    mesh(box(0.2, 0.045, 0.075), MAT.warmDark, -0.33, G + 0.036, -0.12, m);          /* sofá */
    mesh(box(0.2, 0.05, 0.02), MAT.warmDark, -0.33, G + 0.07, -0.158, m);
    mesh(box(0.1, 0.02, 0.06), MAT.warmDim, -0.33, G + 0.024, -0.02, m);              /* mesa de centro */
    mesh(box(0.16, 0.07, 0.05), MAT.warmDim, -0.12, G + 0.047, -0.3, m);              /* ilha da cozinha */
    rod(v(-0.47, G + 0.012, -0.2), v(-0.47, G + 0.15, -0.2), 0.003, MAT.warmDark, m);
    mesh(new THREE.SphereGeometry(0.016, 10, 8), MAT.ledWhite, -0.47, G + 0.16, -0.2, m);
    /* esquadria e vidro da sala */
    var gy = G + 0.012, ghh = AH - 0.045 - 0.012, gz = AZ1 - 0.012;
    mesh(box(0.46, ghh, 0.004), MAT.glassClear, -0.27, gy + ghh / 2, gz, m);
    [-0.5, -0.347, -0.193, -0.04].forEach(function(x){ mesh(box(0.008, ghh, 0.012), MAT.darkMetal, x, gy + ghh / 2, gz, m); });
    mesh(box(0.46, 0.008, 0.012), MAT.darkMetal, -0.27, gy + ghh, gz, m); mesh(box(0.46, 0.006, 0.014), MAT.darkMetal, -0.27, gy, gz, m);
    /* porta de entrada em madeira, com vidro lateral e arandelas */
    mesh(box(0.105, 0.265, 0.012), MAT.wood, 0.07, G + 0.1325, AZ1 + 0.004, m);
    mesh(box(0.004, 0.11, 0.006), MAT.chrome, 0.035, G + 0.14, AZ1 + 0.014, m);
    mesh(box(0.028, 0.265, 0.006), MAT.warm, 0.146, G + 0.1325, AZ1 + 0.002, m);
    mesh(box(0.032, 0.268, 0.004), MAT.glassClear, 0.146, G + 0.134, AZ1 + 0.007, m);
    mesh(box(0.16, 0.006, 0.02), MAT.darkMetal, 0.09, G + 0.272, AZ1 + 0.006, m);
    [-0.012, 0.205].forEach(function(x){ mesh(box(0.012, 0.03, 0.01), MAT.ledWhite, x, G + 0.2, AZ1 + 0.006, m).material = MAT.warm; });
    /* volume superior em balanço, revestido de ripas de madeira */
    var BX0 = -0.18, BX1 = 0.66, BZ0 = -0.40, BZ1 = 0.24, BY0 = G + AH, BH = 0.32, bcx = (BX0 + BX1) / 2, bcz = (BZ0 + BZ1) / 2;
    mesh(box(BX1 - BX0, BH, BZ1 - BZ0), MAT.woodDark, bcx, BY0 + BH / 2, bcz, m);
    var WX0 = -0.08, WX1 = 0.44, WY0 = BY0 + 0.075, WY1 = BY0 + 0.265;
    slats(m, MAT.wood, BX0 + 0.004, BX1 - 0.004, BY0 + 0.006, BY0 + BH - 0.006, BZ1 + 0.006, true, function(a){ return a > WX0 - 0.012 && a < WX1 + 0.012; });
    slats(m, MAT.wood, BX0 + 0.004, BX1 - 0.004, BY0 + 0.006, BY0 + BH - 0.006, BZ0 - 0.006, true);
    slats(m, MAT.wood, BZ0 + 0.004, BZ1 - 0.004, BY0 + 0.006, BY0 + BH - 0.006, BX1 + 0.006, false);
    slats(m, MAT.wood, BZ0 + 0.004, BZ1 - 0.004, BY0 + 0.006, BY0 + BH - 0.006, BX0 - 0.006, false, function(a){ return a > -0.2 && a < 0.1; });
    /* faixas de madeira acima e abaixo da janela (onde as ripas param) */
    mesh(box(WX1 - WX0 + 0.03, WY0 - BY0 - 0.006, 0.012), MAT.wood, (WX0 + WX1) / 2, (BY0 + 0.006 + WY0) / 2, BZ1 + 0.006, m);
    mesh(box(WX1 - WX0 + 0.03, BY0 + BH - 0.006 - WY1, 0.012), MAT.wood, (WX0 + WX1) / 2, (WY1 + BY0 + BH - 0.006) / 2, BZ1 + 0.006, m);
    /* janelão do quarto, iluminado */
    var wy = (WY0 + WY1) / 2, wh = WY1 - WY0, ww = WX1 - WX0, wxc = (WX0 + WX1) / 2;
    var wg = mesh(new THREE.PlaneGeometry(ww, wh), WARM_IN, wxc, wy, BZ1 + 0.0015, m); wg.material = WARM_IN.clone(); wg.material.side = THREE.FrontSide; wg.castShadow = false;
    mesh(box(0.1, wh * 0.5, 0.002), MAT.warmDark, wxc + 0.1, WY0 + wh * 0.25, BZ1 + 0.003, m);     /* cabeceira */
    mesh(box(0.03, wh, 0.002), MAT.warmDim, WX0 + 0.03, wy, BZ1 + 0.003, m);                      /* cortina */
    mesh(box(ww, wh, 0.004), MAT.glassClear, wxc, wy, BZ1 + 0.008, m);
    [WX0, WX0 + ww / 3, WX0 + 2 * ww / 3, WX1].forEach(function(x){ mesh(box(0.008, wh, 0.012), MAT.darkMetal, x, wy, BZ1 + 0.008, m); });
    mesh(box(ww + 0.008, 0.008, 0.012), MAT.darkMetal, wxc, WY1, BZ1 + 0.008, m); mesh(box(ww + 0.008, 0.008, 0.012), MAT.darkMetal, wxc, WY0, BZ1 + 0.008, m);
    /* porta de vidro para o terraço (face esquerda) */
    var tdz = -0.05, tdh = 0.24;
    var tg = mesh(new THREE.PlaneGeometry(0.28, tdh), wg.material, BX0 - 0.0015, BY0 + 0.012 + tdh / 2, tdz, m); tg.rotation.y = -PI / 2; tg.castShadow = false;
    mesh(box(0.004, tdh, 0.28), MAT.glassClear, BX0 - 0.008, BY0 + 0.012 + tdh / 2, tdz, m);
    [-0.19, -0.05, 0.09].forEach(function(z){ mesh(box(0.012, tdh, 0.008), MAT.darkMetal, BX0 - 0.008, BY0 + 0.012 + tdh / 2, z, m); });
    mesh(box(0.012, 0.008, 0.288), MAT.darkMetal, BX0 - 0.008, BY0 + 0.012 + tdh, tdz, m);
    /* lajes de cobertura e terraço com guarda-corpo de vidro */
    mesh(box(BX1 - BX0 + 0.07, 0.026, BZ1 - BZ0 + 0.07), MAT.graphite, bcx, BY0 + BH + 0.013, bcz, m);
    mesh(box(AW + 0.05, 0.016, AD + 0.05), MAT.graphite, cx, BY0 + 0.008, cz, m);
    for (i = 0; i < 9; i++) mesh(box(0.0385, 0.008, AD - 0.06), MAT.woodDeck, AX0 + 0.04 + i * 0.041, BY0 + 0.02, cz, m);
    mesh(box(0.004, 0.055, AD - 0.02), MAT.glassClear, AX0 + 0.012, BY0 + 0.046, cz, m);
    mesh(box(BX0 - AX0 - 0.012, 0.055, 0.004), MAT.glassClear, (AX0 + BX0) / 2, BY0 + 0.046, AZ1 - 0.012, m);
    mesh(box(BX0 - AX0 - 0.012, 0.055, 0.004), MAT.glassClear, (AX0 + BX0) / 2, BY0 + 0.046, AZ0 + 0.012, m);
    mesh(box(0.006, 0.004, AD - 0.02), MAT.chrome, AX0 + 0.012, BY0 + 0.075, cz, m);
    mesh(box(BX0 - AX0 - 0.012, 0.004, 0.006), MAT.chrome, (AX0 + BX0) / 2, BY0 + 0.075, AZ1 - 0.012, m);
    /* pilares do balanço */
    rod(v(0.63, G, 0.2), v(0.63, BY0, 0.2), 0.009, MAT.darkMetal, m); rod(v(0.63, G, -0.36), v(0.63, BY0, -0.36), 0.009, MAT.darkMetal, m);
    /* cerca viva e árvores */
    mesh(box(1.62, 0.07, 0.05), MAT.leaf, 0, G + 0.035, -0.62, m);
    mesh(box(0.05, 0.07, 0.9), MAT.leaf, 0.82, G + 0.035, -0.15, m);
    tree(m, -0.72, G, -0.46, 1.25); tree(m, 0.75, G, 0.5, 0.9); tree(m, -0.76, G, 0.14, 0.7);
    bush(m, -0.2, G + 0.026, 0.6, 0.03); bush(m, 0.7, G + 0.022, -0.5, 0.026); flushFoliage(m);
    m.scale.setScalar(0.9); m.position.set(0, -0.36, 0);
    return g;
  }

  /* =================================================================
     COLHEITADEIRA: corpo vermelho, cabine de vidro, plataforma com
     molinete giratório, caracol, tanque graneleiro e tubo de descarga
     ================================================================= */
  function makeHarvester(){
    var g = new THREE.Group(), m = new THREE.Group(); g.add(m);
    var red = MAT.paintRed, i, s, a;
    mesh(prism([[-0.74, 0.31], [-0.70, 0.23], [0.30, 0.23], [0.34, 0.31], [0.34, 0.47], [0.16, 0.47], [0.16, 0.75], [-0.50, 0.75], [-0.66, 0.67], [-0.76, 0.51]], 0.60, 0.014), red, 0, 0, 0, m);
    [1, -1].forEach(function(s){
      var z = s * 0.3015;
      mesh(box(0.66, 0.026, 0.005), MAT.white, -0.2, 0.615, z, m);
      mesh(box(0.96, 0.05, 0.006), MAT.graphite, -0.2, 0.258, z, m);
      mesh(box(0.2, 0.11, 0.006), MAT.blackMatte, -0.56, 0.45, z, m);
      for (var k = 0; k < 6; k++) mesh(box(0.19, 0.004, 0.008), MAT.graphite, -0.56, 0.405 + k * 0.018, z, m);
      [-0.1, -0.4].forEach(function(x){ mesh(box(0.004, 0.26, 0.004), MAT.blackMatte, x, 0.44, z, m); });
      mesh(box(0.22, 0.14, 0.005), MAT.graphite, 0.0, 0.42, z, m).material = MAT.paintRed;
      mesh(box(0.03, 0.008, 0.008), MAT.chrome, -0.02, 0.5, z + s * 0.002, m);
      mesh(box(0.006, 0.03, 0.04), MAT.ledRed, -0.752, 0.56, s * 0.24, m);
    });
    /* tanque graneleiro aberto, com grãos */
    var tank = mesh(prism([[-0.25, 0.75], [0.25, 0.75], [0.315, 0.845], [-0.315, 0.845]], 0.54), MAT.graphite, -0.17, 0, 0, m); tank.rotation.y = PI / 2;
    var gr = mesh(new THREE.SphereGeometry(1, 28, 14), MAT.grain, -0.17, 0.842, 0, m); gr.scale.set(0.245, 0.07, 0.285);
    mesh(box(0.12, 0.012, 0.42), MAT.blackMatte, -0.55, 0.722, 0, m).rotation.z = 0.46;
    /* tubo de descarga recolhido ao lado */
    rod(v(0.07, 0.80, 0.335), v(-0.86, 0.725, 0.335), 0.034, red, m, 16);
    rod(v(0.07, 0.80, 0.335), v(0.0, 0.80, 0.2), 0.034, red, m, 16);
    mesh(new THREE.SphereGeometry(0.036, 14, 10), red, 0.07, 0.80, 0.335, m);
    rod(v(-0.86, 0.725, 0.335), v(-0.935, 0.665, 0.335), 0.031, MAT.graphite, m, 16);
    mesh(box(0.03, 0.05, 0.03), MAT.graphite, -0.6, 0.71, 0.318, m);
    /* cabine */
    mesh(box(0.37, 0.03, 0.45), MAT.graphite, 0.335, 0.458, 0, m);
    mesh(prism([[0.18, 0.475], [0.18, 0.80], [0.43, 0.80], [0.515, 0.60], [0.50, 0.475]], 0.40, 0.008), MAT.glassCab, 0, 0, 0, m);
    [1, -1].forEach(function(s){
      var z = s * 0.2;
      rod(v(0.18, 0.47, z), v(0.18, 0.80, z), 0.011, MAT.darkMetal, m);
      rod(v(0.50, 0.47, z), v(0.517, 0.60, z), 0.011, MAT.darkMetal, m); rod(v(0.517, 0.60, z), v(0.432, 0.80, z), 0.011, MAT.darkMetal, m);
      rod(v(0.31, 0.47, z), v(0.31, 0.80, z), 0.007, MAT.darkMetal, m);
      rod(v(0.46, 0.80, s * 0.21), v(0.57, 0.735, s * 0.3), 0.005, MAT.darkMetal, m);
      mesh(box(0.012, 0.065, 0.036), MAT.blackGloss, 0.572, 0.715, s * 0.3, m);
    });
    mesh(prism([[0.13, 0.805], [0.47, 0.805], [0.495, 0.822], [0.47, 0.852], [0.13, 0.852]], 0.46, 0.008), MAT.white, 0, 0, 0, m);
    [-0.17, -0.06, 0.06, 0.17].forEach(function(z){ mesh(box(0.012, 0.016, 0.045), MAT.ledWhite, 0.492, 0.826, z, m); });
    mesh(cyl(0.013, 0.022, 10), MAT.ledAmber, 0.2, 0.866, 0.15, m);
    /* escada da cabine */
    rod(v(0.41, 0.45, 0.245), v(0.45, 0.2, 0.335), 0.006, MAT.graphite, m); rod(v(0.50, 0.45, 0.245), v(0.54, 0.2, 0.335), 0.006, MAT.graphite, m);
    for (i = 0; i < 4; i++) { var ft = 0.14 + i * 0.24; rod(v(0.41 + 0.04 * ft, 0.45 - 0.25 * ft, 0.245 + 0.09 * ft), v(0.50 + 0.04 * ft, 0.45 - 0.25 * ft, 0.245 + 0.09 * ft), 0.005, MAT.steel, m); }
    /* alimentador e plataforma */
    mesh(prism([[0.30, 0.26], [0.34, 0.43], [0.68, 0.28], [0.66, 0.12]], 0.27, 0.008), MAT.graphite, 0, 0, 0, m);
    var ZH = 0.70;
    mesh(prism([[0.64, 0.05], [0.955, 0.034], [0.955, 0.05], [0.71, 0.076], [0.68, 0.31], [0.64, 0.31]], 2 * ZH), MAT.graphite, 0, 0, 0, m);
    mesh(box(0.055, 0.032, 2 * ZH), red, 0.66, 0.315, 0, m);
    [1, -1].forEach(function(s){
      mesh(prism([[0.62, 0.33], [0.62, 0.04], [1.0, 0.02], [1.005, 0.06], [0.80, 0.31]], 0.024, 0.004), red, 0, 0, s * (ZH + 0.012), m);
      rod(v(0.665, 0.335, s * (ZH - 0.03)), v(0.88, 0.25, s * (ZH - 0.03)), 0.012, red, m);
      /* caracol: hélice em cada metade, com passo invertido */
      var pts = []; for (var k = 0; k <= 120; k++) { var u = k / 120, an = u * PI * 2 * 6 * s; pts.push(v(0.745 + Math.cos(an) * 0.062, 0.125 + Math.sin(an) * 0.062, s * (0.05 + u * (ZH - 0.09)))); }
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, 0.006, 5), MAT.steel, 0, 0, 0, m);
    });
    var aug = mesh(cyl(0.044, 2 * ZH - 0.04, 18), MAT.steel, 0.745, 0.125, 0, m); aug.rotation.x = PI / 2;
    mesh(box(0.012, 0.008, 2 * ZH), MAT.steel, 0.957, 0.04, 0, m);
    var teeth = new THREE.InstancedMesh(new THREE.ConeGeometry(0.008, 0.032, 4), MAT.steel, 46), d = new THREE.Object3D();
    for (i = 0; i < 46; i++) { d.position.set(0.976, 0.04, -ZH + 0.02 + i * (2 * ZH - 0.04) / 45); d.rotation.set(0, 0, -PI / 2); d.updateMatrix(); teeth.setMatrixAt(i, d.matrix); }
    teeth.instanceMatrix.needsUpdate = true; m.add(teeth);
    /* molinete (gira) */
    var reel = new THREE.Group(); reel.position.set(0.88, 0.25, 0); m.add(reel);
    var RR = 0.115, LZ = 2 * ZH - 0.07, cb = mesh(cyl(0.014, LZ, 10), MAT.steel, 0, 0, 0, reel); cb.rotation.x = PI / 2;
    var tl = [];
    for (i = 0; i < 6; i++) {
      a = i / 6 * PI * 2; var bx = Math.cos(a) * RR, by = Math.sin(a) * RR;
      var bar = mesh(cyl(0.007, LZ, 8), MAT.cream, bx, by, 0, reel); bar.rotation.x = PI / 2;
      [-LZ / 2 + 0.005, 0, LZ / 2 - 0.005].forEach(function(z){ rod(v(0, 0, z), v(bx, by, z), 0.005, MAT.cream, reel, 6); });
      var ox = Math.cos(a + 0.9) * 0.05, oy = Math.sin(a + 0.9) * 0.05;
      for (var k = 0; k < 44; k++) { var z = -LZ / 2 + 0.02 + k * (LZ - 0.04) / 43; tl.push(v(bx, by, z), v(bx + ox, by + oy, z)); }
    }
    [-LZ / 2 + 0.005, 0, LZ / 2 - 0.005].forEach(function(z){ mesh(new THREE.TorusGeometry(RR, 0.005, 6, 36), MAT.cream, 0, 0, z, reel); });
    reel.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(tl), new THREE.LineBasicMaterial({ color: 0x1c1c1f })));
    /* rodas e eixos */
    [1, -1].forEach(function(s){
      var wf = makeWheel(0.215, 0.17, MAT.cream, { solid: true, lugs: 18, rimRatio: 0.56 }); wf.position.set(0.16, 0.215, s * 0.405); if (s < 0) wf.rotation.y = PI; m.add(wf);
      var wr = makeWheel(0.13, 0.1, MAT.cream, { solid: true, lugs: 14, rimRatio: 0.56 }); wr.position.set(-0.56, 0.13, s * 0.345); if (s < 0) wr.rotation.y = PI; m.add(wr);
    });
    mesh(box(0.13, 0.12, 0.66), MAT.graphite, 0.16, 0.215, 0, m);
    mesh(box(0.06, 0.05, 0.62), MAT.graphite, -0.56, 0.14, 0, m);
    /* traseira: picador de palha e escapamento */
    mesh(prism([[-0.75, 0.45], [-0.9, 0.31], [-0.86, 0.22], [-0.72, 0.24]], 0.5, 0.006), MAT.graphite, 0, 0, 0, m);
    rod(v(-0.36, 0.75, -0.2), v(-0.36, 0.89, -0.2), 0.016, MAT.darkMetal, m, 12);
    rod(v(-0.36, 0.89, -0.2), v(-0.375, 0.915, -0.2), 0.017, MAT.chrome, m, 12);
    m.scale.setScalar(0.9); m.position.set(-0.03, -0.42, 0);
    g.userData.spin = function(t){ reel.rotation.z = -t * 2.4; };
    return g;
  }

  return { env: ENV, mat: MAT, items: [makeCar(), makeBuilding(), makeHarvester(), makeHouse()] };
}

/* =====================================================================
   HERO: pista, moedas, portal e ícones
   ===================================================================== */
function initHero(){
  var wrap = root;
  var canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%';
  canvas.setAttribute('aria-hidden', 'true');
  wrap.appendChild(canvas);
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(DPR);
  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding = THREE.sRGBEncoding;
  /* os bens realistas usam exposição de filme; portal, moedas e pista ficam exatamente como eram (toneMapped = false, mais abaixo) */
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
  var LOOK = v3(0.35, -0.2, 0);
  var CAMDIR = v3(-1.6, 3.3, 9.4).sub(LOOK);
  var BASE = CAMDIR.length(); CAMDIR.normalize();
  var fit = 1;

  var world = new THREE.Group(); scene.add(world);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  var key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(-4, 7, 5); scene.add(key);
  var rim = new THREE.DirectionalLight(0xc8ccd8, 0.55); rim.position.set(6, 2, -3); scene.add(rim);

  var PORTAL = v3(0.1, 0.45, 0);
  var portalLight = new THREE.PointLight(RED_HEX, 3, 7.5, 1.6); portalLight.position.copy(PORTAL).y += 0.25; world.add(portalLight);
  var underLight = new THREE.PointLight(RED_HEX, 1.6, 6, 1.6); underLight.position.set(0.1, -1.0, 0.8); world.add(underLight);

  /* ---- pistas de malha trançada ---- */
  var COIN_R = 0.42;
  var curve1 = new THREE.CatmullRomCurve3([ v3(4.9, 4.5, -2.8), v3(3.5, 3.25, -1.75), v3(2.35, 2.2, -0.9), v3(1.5, 1.5, -0.35), v3(1.02, 1.17, -0.1) ]);
  var curve2 = new THREE.CatmullRomCurve3([ v3(-0.2, -1.85, 0.25), v3(-0.95, -2.25, 0.6), v3(-2.05, -3.0, 1.1), v3(-3.4, -4.1, 1.7), v3(-4.9, -5.5, 2.3) ]);

  function frameAt(curve, u){
    var p = curve.getPointAt(u), T = curve.getTangentAt(u).normalize();
    var S = new THREE.Vector3().crossVectors(T, UP).normalize();
    var N = new THREE.Vector3().crossVectors(S, T).normalize();
    return { p: p, T: T, S: S, N: N };
  }
  var trackMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5, roughness: 0.38 });
  function buildTrack(curve, width, cols){
    var len = curve.getLength(), rows = Math.floor(len / 0.15);
    var mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.175, 0.055, 0.115), trackMat, rows * cols);
    var d = new THREE.Object3D(), m = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color(), k = 0;
    for (var i = 0; i < rows; i++) {
      var f = frameAt(curve, (i + 0.5) / rows);
      m.makeBasis(f.T, f.N, f.S);
      for (var j = 0; j < cols; j++) {
        var odd = (i + j) % 2, off = ((j + 0.5) / cols - 0.5) * width;
        d.position.copy(f.p).addScaledVector(f.S, off).addScaledVector(f.N, odd ? 0.012 : -0.012);
        d.quaternion.setFromRotationMatrix(m);
        q.setFromAxisAngle(UP, odd ? 0.62 : -0.62); d.quaternion.multiply(q);
        d.updateMatrix(); mesh.setMatrixAt(k, d.matrix);
        var v = 0.7 + Math.random() * 0.6; col.setRGB(0.03 * v, 0.03 * v, 0.036 * v); mesh.setColorAt(k, col);
        k++;
      }
    }
    mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return mesh;
  }
  world.add(buildTrack(curve1, 1.25, 8));
  world.add(buildTrack(curve2, 1.25, 8));
  var LEN1 = curve1.getLength();

  /* ---- moedas R$ ---- */
  function coinTextures(){
    var s = 256, c = document.createElement('canvas'); c.width = c.height = s; var g = c.getContext('2d');
    var grd = g.createRadialGradient(s * 0.36, s * 0.32, s * 0.04, s / 2, s / 2, s * 0.56);
    grd.addColorStop(0, '#6a6a73'); grd.addColorStop(0.5, '#2c2c31'); grd.addColorStop(1, '#101013');
    g.fillStyle = grd; g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 3; g.beginPath(); g.arc(s / 2, s / 2, s * 0.39, 0, Math.PI * 2); g.stroke();
    g.font = '700 ' + Math.round(s * 0.36) + 'px Sora, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(0,0,0,.7)'; g.fillText('R$', s / 2 + 3, s / 2 + 9);
    g.fillStyle = 'rgba(255,255,255,.4)'; g.fillText('R$', s / 2 - 2, s / 2 + 3);
    g.fillStyle = '#c4c4cc'; g.fillText('R$', s / 2, s / 2 + 5);
    var e = document.createElement('canvas'); e.width = e.height = s; var h = e.getContext('2d');
    h.fillStyle = '#000'; h.fillRect(0, 0, s, s);
    h.strokeStyle = '#ff1e1e'; h.lineWidth = 7; h.beginPath(); h.arc(s / 2, s / 2, s * 0.455, 0, Math.PI * 2); h.stroke();
    h.font = g.font; h.textAlign = 'center'; h.textBaseline = 'middle';
    h.fillStyle = 'rgba(255,40,30,.4)'; h.fillText('R$', s / 2, s / 2 + 5);
    var map = new THREE.CanvasTexture(c), em = new THREE.CanvasTexture(e);
    map.encoding = THREE.sRGBEncoding; em.encoding = THREE.sRGBEncoding;
    [map, em].forEach(function(t){ t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1; });
    return { map: map, em: em };
  }
  var ct = coinTextures();
  var coinSide = new THREE.MeshStandardMaterial({ color: 0x2b2b30, metalness: 0.55, roughness: 0.3 });
  var coinFace = new THREE.MeshStandardMaterial({ map: ct.map, metalness: 0.45, roughness: 0.35, emissive: 0xffffff, emissiveMap: ct.em, emissiveIntensity: 1.1 });
  var rimMat = new THREE.MeshBasicMaterial({ color: 0xff3a2e });
  var coinGeo = new THREE.CylinderGeometry(COIN_R, COIN_R, 0.09, 48);
  var rimGeo = new THREE.TorusGeometry(COIN_R, 0.02, 8, 56);
  var coins = [];
  for (var c = 0; c < 3; c++) {
    var cg = new THREE.Group();
    cg.add(new THREE.Mesh(coinGeo, [coinSide, coinFace, coinFace]));
    var rm = new THREE.Mesh(rimGeo, rimMat); rm.rotation.x = Math.PI / 2; cg.add(rm);
    cg.add(glowSprite(1.7, 0.22));
    cg.visible = false; world.add(cg); coins.push(cg);
  }

  /* ---- portal ---- */
  var portal = new THREE.Group(); portal.position.copy(PORTAL); world.add(portal);
  var ringOuter = new THREE.Mesh(new THREE.TorusGeometry(1.06, 0.07, 14, 90), new THREE.MeshStandardMaterial({ color: 0x1d1d21, metalness: 0.6, roughness: 0.28 }));
  ringOuter.rotation.x = Math.PI / 2; portal.add(ringOuter);
  var ringNeon = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.018, 8, 90), new THREE.MeshBasicMaterial({ color: 0xff5a4c }));
  ringNeon.rotation.x = Math.PI / 2; portal.add(ringNeon);
  var liquidMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uFlash: { value: 0 }, uRed: { value: new THREE.Color(RED_HEX) } },
    vertexShader: [
      'uniform float uTime; varying vec2 vUv;',
      'void main(){ vUv = uv; vec3 p = position; float r = length(p.xy);',
      '  p.z += sin(r * 9.0 - uTime * 2.4) * 0.04 * (1.0 - r);',
      '  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }'
    ].join('\n'),
    fragmentShader: [
      'uniform float uTime; uniform float uFlash; uniform vec3 uRed; varying vec2 vUv;',
      'void main(){ vec2 p = (vUv - 0.5) * 2.0; float a = atan(p.y, p.x); float r = length(p);',
      '  float blob = 0.66 + 0.07 * sin(a * 3.0 + uTime * 0.9) + 0.045 * sin(a * 5.0 - uTime * 1.4) + 0.03 * sin(a * 2.0 + uTime * 0.5);',
      '  float core = smoothstep(blob, blob - 0.36, r);',
      '  float edge = smoothstep(0.13, 0.0, abs(r - blob));',
      '  float haze = smoothstep(1.0, 0.25, r) * 0.28;',
      '  vec3 col = mix(uRed, vec3(1.0, 0.88, 0.85), core * 0.92) * (core * 0.95 + edge * 1.2) + uRed * haze;',
      '  col *= 1.0 + uFlash * 0.9;',
      '  float alpha = clamp(core + edge + haze, 0.0, 1.0) * smoothstep(1.0, 0.9, r);',
      '  gl_FragColor = vec4(col, alpha); }'
    ].join('\n')
  });
  var liquid = new THREE.Mesh(new THREE.CircleGeometry(0.94, 72), liquidMat); liquid.rotation.x = -Math.PI / 2; portal.add(liquid);
  var portalGlow = glowSprite(4.4, 0.5); portalGlow.position.y = -0.15; portal.add(portalGlow);
  var underArc = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.03, 8, 40, Math.PI), new THREE.MeshBasicMaterial({ color: 0xff4a3c, transparent: true, opacity: 0.85 }));
  underArc.rotation.z = Math.PI; underArc.position.y = -0.2; portal.add(underArc);

  /* ---- bens realistas: carro, prédio, colheitadeira e casa (aparecem nesta ordem) ---- */
  var ICON_SCALE = isMobile ? 1.5 : 1.48;   /* tamanho dos bens ao sair do portal */
  var REAL = makeRealAssets(THREE, renderer, isMobile);
  var icons = REAL.items.map(function(model){
    var g = new THREE.Group(); g.add(model);
    var gm = new THREE.SpriteMaterial({ map: GLOW, color: RED_HEX, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true });
    var glow = new THREE.Sprite(gm); glow.scale.set(3.6, 3.6, 1); g.add(glow);   /* halo vermelho atrás do bem, como contraluz do portal */
    g.userData.glow = gm; g.userData.spin = model.userData.spin || null;
    g.visible = false; world.add(g); return g;
  });
  function setIconOpacity(ic, o){ ic.userData.glow.opacity = 0.3 * o; }

  /* ---- partículas da dissolução ---- */
  var PN = isMobile ? 70 : 170;
  function makeParticles(){
    var pos = new Float32Array(PN * 3), off = new Float32Array(PN * 3), dir = new Float32Array(PN * 3);
    for (var i = 0; i < PN; i++) {
      var x = Math.random() * 2 - 1, y = Math.random() * 2 - 1, z = Math.random() * 2 - 1, l = Math.sqrt(x * x + y * y + z * z) || 1;
      var r = 0.15 + Math.random() * 0.45, sp = 0.4 + Math.random() * 0.9;
      off[i*3] = x / l * r; off[i*3+1] = y / l * r * 0.8; off[i*3+2] = z / l * r;
      dir[i*3] = x / l * sp; dir[i*3+1] = y / l * sp; dir[i*3+2] = z / l * sp;
    }
    var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var mat = new THREE.PointsMaterial({ map: GLOW, color: 0xff4a3c, size: isMobile ? 0.2 : 0.16, sizeAttenuation: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    var pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.visible = false; world.add(pts);
    return { pts: pts, pos: pos, off: off, dir: dir, mat: mat, geo: geo };
  }
  var parts = [makeParticles(), makeParticles()];

  /* ---- linha do tempo (sem estado, cada moeda é função do tempo) ---- */
  var SPACING = 3.3;   /* intervalo entre moedas, em segundos */
  var ROLL = 2.9;      /* tempo rolando pela pista */
  var FALL = 0.42;     /* queda até o portal */
  var EMERGE = 0.7, FLOAT = 2.05, FADE = 0.45, PLIFE = 1.3;   /* FLOAT = tempo que cada objeto fica em destaque */
  var FLOAT_POS = v3(0.1, isMobile ? -1.0 : -1.08, 0.75);   /* onde o bem fica em destaque: abaixo do portal e mais perto da câmera */
  key.castShadow = true; key.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
  key.shadow.camera.left = -2.1; key.shadow.camera.right = 2.1; key.shadow.camera.top = 2.1; key.shadow.camera.bottom = -2.1; key.shadow.camera.near = 2; key.shadow.camera.far = 22;
  key.shadow.bias = -0.0006; key.shadow.normalBias = 0.014;
  key.target.position.copy(FLOAT_POS); scene.add(key.target); key.position.copy(FLOAT_POS).add(v3(-4, 7.6, 5.2));
  world.children.forEach(function(ch){
    if (icons.indexOf(ch) >= 0) return;
    ch.traverse(function(o){ var mt = o.material; if (!mt) return; (Array.isArray(mt) ? mt : [mt]).forEach(function(x){ x.toneMapped = false; }); });
  });
  var endF = frameAt(curve1, 1);
  var fallFrom = endF.p.clone().addScaledVector(endF.N, COIN_R + 0.03);
  var fallTo = v3(PORTAL.x, PORTAL.y - 0.3, PORTAL.z);
  var mB = new THREE.Matrix4(), qR = new THREE.Quaternion();

  function placeCoin(coin, f, roll){
    mB.makeBasis(f.N, f.S, f.T);
    coin.quaternion.setFromRotationMatrix(mB);
    qR.setFromAxisAngle(UP, roll); coin.quaternion.multiply(qR);
  }

  var time = 1.9, intro = reduced ? 1 : 0, mx = 0, my = 0;

  function draw(t){
    var i, k, kNow = Math.floor(t / SPACING), flash = 0;
    for (i = 0; i < coins.length; i++) coins[i].visible = false;
    for (i = 0; i < icons.length; i++) icons[i].visible = false;
    parts[0].pts.visible = false; parts[1].pts.visible = false;

    for (k = Math.max(0, kNow - 2); k <= kNow; k++) {
      var tau = t - k * SPACING, coin = coins[k % 3];
      if (tau < ROLL) {
        var p = tau / ROLL, u = p * (0.55 + 0.45 * p), f = frameAt(curve1, u);
        coin.visible = true; coin.scale.setScalar(1);
        coin.position.copy(f.p).addScaledVector(f.N, COIN_R + 0.03);
        placeCoin(coin, f, -u * LEN1 / COIN_R);
      } else if (tau < ROLL + FALL) {
        var qf = (tau - ROLL) / FALL;
        coin.visible = true;
        coin.position.set(lerp(fallFrom.x, fallTo.x, qf), lerp(fallFrom.y, fallTo.y, qf * qf), lerp(fallFrom.z, fallTo.z, qf));
        placeCoin(coin, endF, -LEN1 / COIN_R - qf * 2.2);
        coin.scale.setScalar(1 - 0.75 * clamp01((qf - 0.55) / 0.45));
      }
      var dtf = tau - (ROLL + FALL); flash = Math.max(flash, Math.exp(-dtf * dtf / 0.06));

      var ti = dtf + 0.05, ic = icons[k % icons.length];
      if (ti > 0 && ti < EMERGE + FLOAT + FADE) {
        ic.visible = true;
        var y, s, o;
        if (ti < EMERGE) { var e = ti / EMERGE, ee = 1 - Math.pow(1 - e, 3); y = lerp(PORTAL.y - 0.3, FLOAT_POS.y, ee); s = lerp(0.15, 1, ee); o = clamp01(e * 2); }
        else if (ti < EMERGE + FLOAT) { y = FLOAT_POS.y + Math.sin((ti - EMERGE) * 2.4) * 0.05; s = 1; o = 1; }
        else { var d = (ti - EMERGE - FLOAT) / FADE; y = FLOAT_POS.y; s = Math.max(0.001, 1 - d * d * (3 - 2 * d)); o = 1 - d; }
        ic.position.set(FLOAT_POS.x, y, FLOAT_POS.z); ic.scale.setScalar(s * ICON_SCALE); if (ic.userData.spin) ic.userData.spin(t);
        ic.rotation.set(-0.12, -0.75 + ti * 0.62, 0); setIconOpacity(ic, o);
      }
      var tp = ti - (EMERGE + FLOAT);
      if (tp > 0 && tp < PLIFE) {
        var ps = parts[k % 2], pos = ps.pos, off = ps.off, dir = ps.dir, g2 = tp * tp;
        for (i = 0; i < PN; i++) {
          var a = i * 3;
          pos[a]   = FLOAT_POS.x + off[a]   * (1 + tp * 0.5) + dir[a]   * tp * 0.8 - 0.55 * g2;
          pos[a+1] = FLOAT_POS.y + off[a+1] * (1 + tp * 0.5) + dir[a+1] * tp * 0.8 - 0.80 * g2;
          pos[a+2] = FLOAT_POS.z + off[a+2] * (1 + tp * 0.5) + dir[a+2] * tp * 0.8 + 0.25 * g2;
        }
        ps.geo.attributes.position.needsUpdate = true;
        ps.mat.opacity = Math.pow(1 - tp / PLIFE, 1.4); ps.pts.visible = true;
      }
    }

    liquidMat.uniforms.uTime.value = t; liquidMat.uniforms.uFlash.value = flash;
    var pulse = Math.sin(t * 1.6) * 0.5 + 0.5;
    portalLight.intensity = 2.6 + pulse * 0.6 + flash * 3;
    portalGlow.material.opacity = 0.42 + pulse * 0.1 + flash * 0.3;
    portalGlow.scale.setScalar(4.2 + pulse * 0.3 + flash * 0.8);
    underArc.material.opacity = 0.55 + flash * 0.45;

    /* câmera: aproximação na entrada + parallax */
    var e2 = 1 - Math.pow(1 - intro, 3);
    camera.position.copy(LOOK).addScaledVector(CAMDIR, BASE * fit * (1.34 - 0.34 * e2));
    camera.lookAt(LOOK);
    var tx = canHover ? mx * 0.16 : Math.sin(t * 0.45) * 0.1;
    var ty = canHover ? my * 0.07 : Math.sin(t * 0.3) * 0.03;
    if (reduced) { tx = 0; ty = 0; }
    world.rotation.y += (tx - world.rotation.y) * 0.06;
    world.rotation.x += (ty - world.rotation.x) * 0.06;
    /* ao rolar, a cena sobe e gira um pouco junto com a página */
    var sp = clamp01((window.scrollY || 0) / (wrap.clientHeight || 1));
    world.position.y += (sp * 1.4 - world.position.y) * 0.12;
    world.rotation.z = -sp * 0.12;

    renderer.render(scene, camera);
  }

  function resize(){
    var w = wrap.clientWidth, h = wrap.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    if (w > 860) {
      /* computador: a cena ocupa o fundo inteiro do topo e fica deslocada para a direita, atrás e ao lado do texto */
      camera.setViewOffset(w, h, -w * 0.24, h * 0.02, w, h);
      fit = Math.min(1.3, Math.max(0.95, 760 / h));
    } else {
      /* celular: câmera um pouco mais perto e cena deslocada para cima, para o bem aparecer maior */
      camera.setViewOffset(w, h, 0, h * 0.13, w, h);
      fit = Math.min(1.3, Math.max(0.76, 0.8 / camera.aspect));
    }
    camera.updateProjectionMatrix();
    if (reduced) draw(3 * SPACING + 4.3);
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(wrap); else window.addEventListener('resize', resize);
  resize();

  if (canHover) window.addEventListener('pointermove', function(e){ mx = e.clientX / window.innerWidth * 2 - 1; my = e.clientY / window.innerHeight * 2 - 1; }, { passive: true });

  var api = { visible: true, el: wrap, tick: function(dt){ time += dt; intro = Math.min(1, intro + dt / 1.8); draw(time); } };
  if (reduced) draw(3 * SPACING + 4.3);
  return api;
}

/* =====================================================================
   LAÇO DE ANIMAÇÃO: pausa fora da tela e com a aba inativa
   ===================================================================== */
var hero;
try { hero = initHero(); }
catch (err) { root.classList.add('cx-no-webgl'); if (window.console) console.warn('Animação 3D indisponível:', err); return; }
if (reduced) return;

var running = false, last = 0;
function frame(now){
  running = false;
  var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
  if (!document.hidden && hero.visible) { hero.tick(dt); kick(); }
}
function kick(){ if (!running) { running = true; requestAnimationFrame(frame); } }
if ('IntersectionObserver' in window) {
  new IntersectionObserver(function(entries){ hero.visible = entries[0].isIntersecting; kick(); }, { rootMargin: '80px' }).observe(root);
}
document.addEventListener('visibilitychange', kick);
kick();
};
(function(){
  var URL3D = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  function go(){
    var s = document.createElement('script'); s.src = URL3D; s.async = true;
    /* integridade: o navegador só executa o arquivo se ele for exatamente este (protege contra adulteração na CDN) */
    s.integrity = 'sha512-dLxUelApnYxpLt6K2iomGngnHO83iUvZytA3YjDUCjT0HDOHKXnVYdf3hU4JjM8uEhxf9nD1/ey98U3t2vZ0qQ=='; s.crossOrigin = 'anonymous'; s.referrerPolicy = 'no-referrer';
    s.onload = function(){ try { window.__startAnim(); } catch (e) {} };
    s.onerror = function(){ var r = document.getElementById('animacao-3d'); if (r) r.classList.add('cx-no-webgl'); };
    document.head.appendChild(s);
  }
  function later(){ if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 1200 }); else setTimeout(go, 250); }
  if (document.readyState === 'complete') later(); else window.addEventListener('load', later);
})();

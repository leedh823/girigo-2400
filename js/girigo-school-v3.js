/**
 * 기리고 학교 3D 모델 (설계도 v3.5) — Three.js 씬 빌더
 * @param {THREE.Scene} scene
 * @param {{ hideRoof?: boolean, skipMarkers?: boolean, gameMode?: boolean }} options
 * @returns {{ M: object, lights: object, H: number, DW: number, hideRoof: () => void }}
 */
function buildGirigoSchoolV3(scene, options) {
  'use strict';
  options = options || {};
  const gameMode = options.gameMode === true;
  const hideRoofOnBuild = gameMode ? false : options.hideRoof !== false;
  const skipMarkers = options.skipMarkers !== false;

  const LYR = { roof: [], furn: [], marker: [] };
  const doors = [];
  const colliders = [];
  const H = 4.0;
  const DW = 1.7;
  const DOOR_W = 1.7;

  function pushCol(x, z, hw, hd) {
    colliders.push({
      minX: x - hw,
      maxX: x + hw,
      minZ: z - hd,
      maxZ: z + hd,
    });
  }

  function ms(c, rough, metal, ei, ec) {
    const m = new THREE.MeshStandardMaterial({
      color: c,
      roughness: rough || 0.88,
      metalness: metal || 0.06,
    });
    if (ei) {
      m.emissive = new THREE.Color(ec || c);
      m.emissiveIntensity = ei;
    }
    return m;
  }

  function texFromCanvas(drawFn, repX, repY) {
    const s = 256;
    const cv = document.createElement('canvas');
    cv.width = s;
    cv.height = s;
    drawFn(cv.getContext('2d'), s);
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repX || 3, repY || 3);
    return t;
  }

  function makeTerrazzoTex(base, specks) {
    return texFromCanvas((ctx, s) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 3200; i++) {
        const x = Math.random() * s;
        const y = Math.random() * s;
        ctx.fillStyle = specks[(Math.random() * specks.length) | 0];
        const sz = 1 + Math.random() * 2.5;
        ctx.fillRect(x, y, sz, sz);
      }
    }, 5, 5);
  }

  function makeCeilTex() {
    return texFromCanvas((ctx, s) => {
      ctx.fillStyle = '#ebe9e4';
      ctx.fillRect(0, 0, s, s);
      const g = 52;
      ctx.strokeStyle = 'rgba(165,160,152,0.42)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= s; x += g) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, s);
        ctx.stroke();
      }
      for (let y = 0; y <= s; y += g) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(s, y);
        ctx.stroke();
      }
    }, 2, 2);
  }

  function matTex(tex, rough, metal) {
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: rough || 0.72,
      metalness: metal || 0.04,
    });
  }

  const T = {
    cor: makeTerrazzoTex('#6b6762', ['#555350', '#7a7670', '#8e8a84', '#4e4c48', '#9a9690']),
    cls: makeTerrazzoTex('#8a9098', ['#6e747c', '#9aa0a8', '#787e86', '#a8aeb6']),
    clr: makeTerrazzoTex('#7e8e84', ['#66766c', '#96a690', '#5a6a60', '#aebeb4']),
    srv: makeTerrazzoTex('#4a4a52', ['#3a3a42', '#5a5a62', '#2e2e36']),
    ceil: makeCeilTex(),
  };

  const M = {
    fCor: matTex(T.cor, 0.32, 0.06),
    fCls: matTex(T.cls, 0.38, 0.05),
    fClR: matTex(T.clr, 0.38, 0.05),
    fSrv: matTex(T.srv, 0.42, 0.06),
    fEx: matTex(T.cor, 0.4, 0.05),
    wLo: ms(0x5c7a60, 0.9, 0.02),
    wHi: ms(0xe8e4da, 0.93, 0.02),
    wSrv: ms(0x6a6e78, 0.9, 0.03),
    wEx: ms(0x5a7268, 0.9, 0.03),
    ceil: matTex(T.ceil, 0.94, 0.02),
    skirt: ms(0x3a4540, 0.88, 0.04),
    mold: ms(0xc8c2b6, 0.82, 0.04),
    glPt: new THREE.MeshStandardMaterial({
      color: 0xa8c4d4,
      transparent: true,
      opacity: 0.22,
      roughness: 0.06,
      metalness: 0.1,
      side: THREE.DoubleSide,
    }),
    glWin: new THREE.MeshStandardMaterial({
      color: 0xc8dce8,
      transparent: true,
      opacity: 0.48,
      roughness: 0.04,
      metalness: 0.12,
      emissive: new THREE.Color(0x8ab0d0),
      emissiveIntensity: gameMode ? 0.42 : 0.58,
      side: THREE.DoubleSide,
    }),
    winFr: ms(0xe8ecef, 0.35, 0.45),
    sky: new THREE.MeshStandardMaterial({
      color: 0x88b0d0,
      emissive: new THREE.Color(0x6090b8),
      emissiveIntensity: 0.35,
      side: THREE.DoubleSide,
    }),
    frm: ms(0xd0d4d8, 0.32, 0.5),
    doorWood: ms(0xc4a882, 0.68, 0.04),
    deskTop: ms(0xd4c4a8, 0.55, 0.04),
    metalLeg: ms(0x8a9098, 0.38, 0.55),
    chrSeat: ms(0x2a4a9a, 0.75, 0.06),
    chrBack: ms(0x243f88, 0.78, 0.06),
    wood: ms(0xc4a882, 0.68, 0.04),
    dkLg: ms(0x8a9098, 0.4, 0.5),
    chr: ms(0x2a4a9a, 0.75, 0.06),
    chBk: ms(0x243f88, 0.78, 0.06),
    bkR: ms(0x7a1818, 0.82, 0.04),
    bkB: ms(0x183878, 0.82, 0.04),
    bkG: ms(0x185028, 0.82, 0.04),
    board: ms(0x1a4a32, 0.88, 0.02),
    bFrm: ms(0xb8b2a8, 0.45, 0.35),
    chalk: ms(0xe8e4dc, 0.9, 0.02),
    lkBdy: ms(0x6a7a88, 0.55, 0.28),
    lkHd: ms(0x9aa8b4, 0.35, 0.5),
    notBd: ms(0x6b5040, 0.82, 0.04),
    notPp: ms(0xf0ead8, 0.9, 0.02),
    signPl: ms(0x4a6a7a, 0.5, 0.2),
    ext: ms(0xd03028, 0.75, 0.12),
    extH: ms(0xe0e0e0, 0.35, 0.55),
    srv: ms(0x2a2a32, 0.65, 0.22),
    srvR: ms(0, 1.6, 0, 1.6, 0xc8382a),
    srvG: ms(0, 1.0, 0, 1.0, 0x44ff44),
    srvB: ms(0, 0.8, 0, 0.8, 0x2266ff),
    mon: ms(0x141414, 0.6, 0.3),
    monS: ms(0x001828, 0.2, 0.1, 0.35, 0x003366),
    dFrm: ms(0xb8b0a4, 0.5, 0.2),
    dGls: new THREE.MeshStandardMaterial({
      color: 0x9ab8c8,
      transparent: true,
      opacity: 0.35,
      roughness: 0.05,
      metalness: 0.15,
    }),
    hdl: ms(0xc0c4c8, 0.25, 0.7),
    step: ms(0x6a6e68, 0.82, 0.06),
    rail: ms(0x9aa0a8, 0.35, 0.45),
    fluor: ms(0, 2.4, 0, 2.4, 0xfff8ee),
    flHs: ms(0xe8e8e8, 0.45, 0.15),
    emer: ms(0, 2.8, 0, 2.8, 0xff2200),
    mPl: ms(0, 0.1, 0, 0.95, 0xffffff),
    mCl: ms(0, 0.1, 0, 0.85, 0xf0c040),
    mGh: new THREE.MeshStandardMaterial({
      color: 0xc8382a,
      transparent: true,
      opacity: 0.7,
      emissive: new THREE.Color(0xc8382a),
      emissiveIntensity: 0.6,
    }),
    mEx: new THREE.MeshStandardMaterial({
      color: 0x4a9eff,
      transparent: true,
      opacity: 0.8,
      emissive: new THREE.Color(0x4a9eff),
      emissiveIntensity: 0.8,
    }),
  };

  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const Cy = (r, h, s) => new THREE.CylinderGeometry(r, r, h, s || 10);
  const Sp = (r, s) => new THREE.SphereGeometry(r, s || 12, s || 8);

  function add(geo, mat, x, y, z, ry, grp) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (ry) m.rotation.y = ry;
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
    if (grp) LYR[grp].push(m);
    return m;
  }

  function pl(x, y, z, c, i, d) {
    const l = new THREE.PointLight(c, i, d || 22);
    l.position.set(x, y, z);
    scene.add(l);
    return l;
  }

  scene.add(new THREE.HemisphereLight(0xe8ecf4, 0x3a3834, gameMode ? 0.52 : 0.45));
  scene.add(new THREE.AmbientLight(0x98a0b0, gameMode ? 0.32 : 0.38));
  const lights = {
    svL: pl(0, 3, -4, 0xff8866, gameMode ? 0.55 : 1.2, 14),
    flkL: pl(0, H - 0.22, 16, 0xfff4e8, gameMode ? 0.65 : 0.85, 26),
    exL: pl(0, 3, 48, 0xa8d8c0, gameMode ? 0.5 : 1.2, 18),
  };

  function addFluorescent(x, y, z, len, ry) {
    add(B(len, 0.14, 0.42), M.flHs, x, y + 0.02, z, ry);
    add(B(len - 0.12, 0.05, 0.32), M.fluor, x, y - 0.02, z, ry);
    add(B(0.04, 0.04, len), M.frm, x, y - 0.06, z, ry);
  }

  [3, 9, 16, 23, 30, 37, 43].forEach((z) => {
    pl(0, H - 0.22, z, 0xfff0e0, gameMode ? 0.58 : 0.78, 22);
    addFluorescent(0, H - 0.12, z, 1.35, 0);
  });
  [
    [-11, 8],
    [-11, 14],
    [-11, 26],
    [-11, 32],
    [11, 8],
    [11, 14],
    [11, 26],
    [11, 32],
  ].forEach(([x, z]) => {
    pl(x, H - 0.22, z, 0xfff0e8, gameMode ? 0.48 : 0.65, 20);
    addFluorescent(x, H - 0.12, z, 1.05, 0);
  });
  [
    [-14, 8],
    [-14, 14],
    [-14, 26],
    [-14, 32],
    [14, 8],
    [14, 14],
    [14, 26],
    [14, 32],
  ].forEach(([x, z]) => {
    pl(x, 2.4, z, 0xb8d4ec, gameMode ? 0.38 : 0.5, 14);
  });

  add(B(10, 0.12, 8), M.fSrv, 0, 0, -4);
  add(B(10, 0.12, 44), M.fCor, 0, 0, 22);
  add(B(12, 0.12, 16), M.fCls, -11, 0, 10);
  add(B(12, 0.12, 16), M.fCls, -11, 0, 30);
  add(B(12, 0.12, 16), M.fClR, 11, 0, 10);
  add(B(12, 0.12, 16), M.fClR, 11, 0, 30);
  add(B(10, 0.12, 8), M.fEx, 0, 0, 48);

  function ceil(w, d, x, z) {
    add(B(w, 0.12, d), M.ceil, x, H - 0.06, z, 0, 'roof');
    add(B(w, 0.02, d), M.mold, x, H - 0.01, z, 0, 'roof');
  }
  ceil(10, 8, 0, -4);
  ceil(10, 44, 0, 22);
  ceil(12, 16, -11, 10);
  ceil(12, 16, -11, 30);
  ceil(12, 16, 11, 10);
  ceil(12, 16, 11, 30);
  ceil(10, 8, 0, 48);

  function w2(W, D, mLo, mHi, x, z, ry) {
    const lo = H * 0.44;
    const hi = H - lo;
    add(B(W, lo, D), mLo, x, lo / 2, z, ry || 0);
    add(B(W, hi, D), mHi, x, lo + hi / 2, z, ry || 0);
    const ml = new THREE.Mesh(B(W, 0.05, 0.09), M.mold);
    ml.position.set(x, lo + 0.025, z);
    if (ry) ml.rotation.y = ry;
    scene.add(ml);
    const sk = new THREE.Mesh(B(W, 0.1, 0.06), M.skirt);
    sk.position.set(x, 0.06, z);
    if (ry) sk.rotation.y = ry;
    scene.add(sk);
  }

  function bigWindow(x, z, ry) {
    const wx = 2.8;
    const wy = 2.6;
    const wz = 0.06;
    const skyOffset = ry ? 0 : x > 0 ? 0.35 : -0.35;
    const skyPlane = new THREE.Mesh(B(wx + 0.2, wy + 0.2, 0.02), M.sky);
    skyPlane.position.set(x + skyOffset, 1.5 + wy / 2, z);
    if (ry) skyPlane.rotation.y = ry;
    scene.add(skyPlane);
    add(B(wx + 0.16, wy + 0.16, 0.1), M.winFr, x, 1.5 + wy / 2, z, ry);
    add(B(wx, wy, wz), M.glWin, x, 1.5 + wy / 2, z, ry);
    add(B(wx, 0.05, 0.1), M.winFr, x, 1.5 + wy * 0.5, z, ry);
    add(B(wx, 0.05, 0.1), M.winFr, x, 1.5 + wy * 0.25, z, ry);
    add(B(0.05, wy, 0.1), M.winFr, x - (ry ? 0 : wx * 0.28), 1.5 + wy / 2, z + (ry ? wx * 0.28 : 0), ry);
    add(B(0.05, wy, 0.1), M.winFr, x + (ry ? 0 : wx * 0.28), 1.5 + wy / 2, z - (ry ? wx * 0.28 : 0), ry);
    add(B(wx + 0.2, 0.12, 0.32), M.winFr, x, 1.46, z, ry);
  }

  function glassPartition(segLen, cx, xSide) {
    if (segLen < 0.1) return;
    const loH = H * 0.44;
    const glH = H - loH - 0.05;
    add(B(0.1, loH, segLen), M.wLo, xSide, loH / 2, cx);
    const sk2 = new THREE.Mesh(B(0.1, 0.1, segLen), M.skirt);
    sk2.position.set(xSide, 0.06, cx);
    scene.add(sk2);
    const ml2 = new THREE.Mesh(B(0.1, 0.05, segLen), M.mold);
    ml2.position.set(xSide, loH + 0.025, cx);
    scene.add(ml2);
    const cnt = Math.max(1, Math.round(segLen / 1.4));
    const sw = segLen / cnt;
    for (let i = 0; i < cnt; i++) {
      const gz = cx - segLen / 2 + (i + 0.5) * sw;
      add(B(0.05, glH - 0.06, sw - 0.07), M.glPt, xSide, loH + glH / 2, gz);
      add(B(0.07, glH, 0.06), M.frm, xSide, loH + glH / 2, gz - sw / 2);
    }
    add(B(0.07, glH, 0.06), M.frm, xSide, loH + glH / 2, cx + segLen / 2);
    add(B(0.07, 0.055, segLen), M.frm, xSide, loH, cx);
    add(B(0.07, 0.055, segLen), M.frm, xSide, loH + glH, cx);
  }

  function doorHeaderX(xSide, z) {
    const loH = H * 0.44;
    const doorTop = 2.5;
    const transH = H - doorTop - 0.06;
    const w = DW;
    add(B(0.07, 0.055, w + 0.08), M.frm, xSide, loH + (H - loH - 0.05), z);
    if (transH < 0.1) return;
    add(B(0.05, transH - 0.1, w - 0.1), M.glPt, xSide, doorTop + transH / 2 + 0.02, z);
    add(B(0.08, 0.06, w + 0.1), M.frm, xSide, doorTop + 0.03, z);
    add(B(0.07, transH, 0.06), M.frm, xSide, doorTop + transH / 2, z - w / 2 - 0.04);
    add(B(0.07, transH, 0.06), M.frm, xSide, doorTop + transH / 2, z + w / 2 + 0.04);
  }

  function doorHeaderZ(x, z) {
    const loH = H * 0.44;
    const doorTop = 2.5;
    const transH = H - doorTop - 0.06;
    const w = DW;
    add(B(w + 0.08, 0.055, 0.07), M.frm, x, loH + (H - loH - 0.05), z);
    if (transH < 0.1) return;
    add(B(w - 0.1, transH - 0.1, 0.05), M.glPt, x, doorTop + transH / 2 + 0.02, z);
    add(B(w + 0.1, 0.06, 0.08), M.frm, x, doorTop + 0.03, z);
    add(B(transH, 0.07, 0.06), M.frm, x - w / 2 - 0.04, doorTop + transH / 2, z);
    add(B(transH, 0.07, 0.06), M.frm, x + w / 2 + 0.04, doorTop + transH / 2, z);
  }

  const sw = (10 - DW) / 2;
  w2(10, 0.12, M.wSrv, M.wSrv, 0, -8);
  w2(0.12, 8, M.wSrv, M.wSrv, -5, -4);
  w2(0.12, 8, M.wSrv, M.wSrv, 5, -4);
  w2(sw, 0.12, M.wSrv, M.wSrv, -(DW / 2 + sw / 2), 0);
  w2(sw, 0.12, M.wSrv, M.wSrv, DW / 2 + sw / 2, 0);
  doorHeaderZ(0, 0);

  function buildCorrWall(xSide) {
    const dz = [5, 15, 25, 35];
    const dh = DW / 2;
    let p = 0;
    dz.forEach((dz2) => {
      glassPartition(dz2 - dh - p, p + (dz2 - dh - p) / 2, xSide);
      doorHeaderX(xSide, dz2);
      p = dz2 + dh;
    });
    glassPartition(44 - p, p + (44 - p) / 2, xSide);
  }
  buildCorrWall(-5);
  buildCorrWall(5);

  w2(sw, 0.12, M.wLo, M.wHi, -(DW / 2 + sw / 2), 44);
  w2(sw, 0.12, M.wLo, M.wHi, DW / 2 + sw / 2, 44);
  doorHeaderZ(0, 44);

  [2, 18, 22, 38].forEach((z) => {
    w2(12, 0.12, M.wLo, M.wHi, -11, z);
    w2(12, 0.12, M.wLo, M.wHi, 11, z);
  });

  function classroomOuterWall(xOut, zFrom, zTo) {
    const winZ = [zFrom + 4, zFrom + 8, zFrom + 12];
    const ry = xOut > 0 ? Math.PI / 2 : -Math.PI / 2;
    let prev = zFrom;
    winZ.forEach((wz) => {
      const gapStart = wz - 1.55;
      const gapEnd = wz + 1.55;
      const seg1 = gapStart - prev;
      if (seg1 > 0.05) w2(0.12, seg1, M.wLo, M.wHi, xOut, prev + seg1 / 2, ry);
      bigWindow(xOut, wz, ry);
      prev = gapEnd;
    });
    const segLast = zTo - prev;
    if (segLast > 0.05) w2(0.12, segLast, M.wLo, M.wHi, xOut, prev + segLast / 2, ry);
  }
  classroomOuterWall(-17, 2, 18);
  classroomOuterWall(-17, 22, 38);
  classroomOuterWall(17, 2, 18);
  classroomOuterWall(17, 22, 38);

  w2(10, 0.12, M.wEx, M.wEx, 0, 52);
  w2(0.12, 8, M.wEx, M.wEx, -5, 48);
  w2(0.12, 8, M.wEx, M.wEx, 5, 48);
  w2(sw, 0.12, M.wEx, M.wEx, -(DW / 2 + sw / 2), 44);
  w2(sw, 0.12, M.wEx, M.wEx, DW / 2 + sw / 2, 44);

  function door(wx, wz, ry, hingeSign) {
    const Hgt = 2.5;
    const root = new THREE.Group();
    root.position.set(wx, 0, wz);
    if (ry) root.rotation.y = ry;

    const panel = new THREE.Group();
    panel.position.set(0, 0, -hingeSign * (DOOR_W / 2));

    const offZ = hingeSign * (DOOR_W / 2);
    const wood = new THREE.Mesh(B(DOOR_W, Hgt, 0.07), M.doorWood);
    wood.position.set(0, Hgt / 2, offZ);
    panel.add(wood);
    const frame = new THREE.Mesh(B(DOOR_W + 0.2, Hgt + 0.2, 0.05), M.dFrm);
    frame.position.set(0, Hgt / 2 + 0.1, offZ);
    panel.add(frame);
    const glass = new THREE.Mesh(B(DOOR_W, 0.58, 0.04), M.dGls);
    glass.position.set(0, 2.28, offZ);
    panel.add(glass);
    const hdl = new THREE.Mesh(B(0.07, 0.07, 0.16), M.hdl);
    hdl.position.set(0.78, 1.25, offZ - hingeSign * 0.12);
    panel.add(hdl);

    root.add(panel);
    scene.add(root);

    const doorCol = ry
      ? { minX: wx - 0.14, maxX: wx + 0.14, minZ: wz - DOOR_W / 2, maxZ: wz + DOOR_W / 2 }
      : { minX: wx - DOOR_W / 2, maxX: wx + DOOR_W / 2, minZ: wz - 0.14, maxZ: wz + 0.14 };

    doors.push({
      root,
      panel,
      x: wx,
      z: wz,
      open: 0,
      maxOpen: Math.PI / 2.15,
      hingeSign,
      collider: doorCol,
    });
  }
  function roomPlate(xSide, z) {
    const xo = xSide < 0 ? -0.045 : 0.045;
    add(B(0.018, 0.075, 0.34), M.signPl, xSide + xo, 2.68, z, Math.PI / 2);
  }
  door(0, -0.06, 0, 1);
  [5, 15, 25, 35].forEach((z) => {
    door(-5, z, Math.PI / 2, 1);
    door(5, z, Math.PI / 2, -1);
  });
  door(0, 43.96, 0, -1);

  function board(cx, z, ry) {
    const bz = z + (ry ? 0 : 0.15);
    pushCol(cx, bz, 3.05, 0.14);
    add(B(6.2, 2.05, 0.06), M.bFrm, cx, 2.68, z, ry);
    add(B(6.0, 1.85, 0.05), M.board, cx, 2.65, z, ry);
    add(B(6.0, 0.1, 0.16), M.bFrm, cx, 1.66, z + (ry ? 0 : 0.08), ry);
    add(B(5.8, 0.06, 0.1), M.chalk, cx, 1.7, z + (ry ? 0 : 0.1), ry);
    add(B(0.5, 0.04, 0.06), M.chalk, cx - 2.2, 1.72, z + (ry ? 0 : 0.1), ry);
    add(B(0.5, 0.04, 0.06), M.chalk, cx + 2.2, 1.72, z + (ry ? 0 : 0.1), ry);
  }
  board(-11, 2.08);
  board(-11, 22.08);
  board(11, 1.92, Math.PI);
  board(11, 21.92, Math.PI);

  function pod(cx, z) {
    pushCol(cx, z, 1.05, 0.55);
    add(B(1.9, 0.08, 1.0), M.deskTop, cx, 0.82, z);
    [
      [-0.85, 0.45],
      [0.85, 0.45],
      [-0.85, -0.45],
      [0.85, -0.45],
    ].forEach(([dx, dz]) => add(B(0.07, 0.82, 0.07), M.metalLeg, cx + dx, 0.41, z + dz));
  }
  pod(-11, 3.8);
  pod(-11, 23.8);
  pod(11, 3.8);
  pod(11, 23.8);

  function desk(x, z) {
    pushCol(x, z, 0.36, 0.22);
    add(B(0.62, 0.04, 0.42), M.deskTop, x, 0.76, z, 0, 'furn');
    [
      [-0.24, 0.15],
      [-0.24, -0.15],
      [0.24, 0.15],
      [0.24, -0.15],
    ].forEach(([dx, dz]) => add(B(0.04, 0.74, 0.04), M.metalLeg, x + dx, 0.37, z + dz, 0, 'furn'));
    add(B(0.42, 0.04, 0.4), M.chrSeat, x, 0.46, z + 0.58, 0, 'furn');
    add(B(0.42, 0.36, 0.04), M.chrBack, x, 0.64, z + 0.78, 0, 'furn');
    [
      [-0.16, 0.14],
      [0.16, 0.14],
    ].forEach(([dx, dz]) => add(B(0.03, 0.46, 0.03), M.metalLeg, x + dx, 0.23, z + 0.58 + dz, 0, 'furn'));
    const r = Math.abs(Math.sin(x * z + 1));
    if (r > 0.72) {
      add(
        B(0.16, 0.2, 0.22),
        r < 0.85 ? M.bkR : M.bkB,
        x + (r - 0.5) * 0.25,
        0.8,
        z - 0.08,
        0,
        'furn'
      );
    }
  }
  const deskColsL = [-15, -11.5, -8];
  const deskColsR = [8, 11.5, 15];
  const deskRowsA = [7.5, 12.5, 16.5];
  const deskRowsB = [27.5, 32.5, 36.5];
  deskColsL.forEach((x) => {
    deskRowsA.forEach((z) => desk(x, z));
    deskRowsB.forEach((z) => desk(x, z));
  });
  deskColsR.forEach((x) => {
    deskRowsA.forEach((z) => desk(x, z));
    deskRowsB.forEach((z) => desk(x, z));
  });

  function lockers(cx, zB, ry) {
    pushCol(cx, zB, 3.65, 0.28);
    for (let i = 0; i < 7; i++) {
      const lx = cx + (-3.15 + i * 1.05);
      add(B(0.98, 1.88, 0.4), M.lkBdy, lx, 0.94, zB, ry, 'furn');
      add(B(0.08, 0.08, 0.12), M.lkHd, lx + (ry ? 0 : 0.42), 0.82, zB + (ry ? 0.42 : 0), ry, 'furn');
      add(B(0.08, 0.08, 0.12), M.lkHd, lx + (ry ? 0 : 0.42), 1.54, zB + (ry ? 0.42 : 0), ry, 'furn');
    }
  }
  lockers(-11, 17.75, 0);
  lockers(-11, 37.75, 0);
  lockers(11, 17.75, Math.PI);
  lockers(11, 37.75, Math.PI);

  [10, 20, 30].forEach((z) => {
    pushCol(-5.08, z, 1.35, 0.1);
    pushCol(5.08, z, 1.35, 0.1);
    add(B(2.6, 1.1, 0.07), M.notBd, -5.08, 2.55, z, Math.PI / 2);
    add(B(2.4, 0.92, 0.04), M.notPp, -5.08, 2.55, z, Math.PI / 2);
    add(B(2.6, 1.1, 0.07), M.notBd, 5.08, 2.55, z, Math.PI / 2);
    add(B(2.4, 0.92, 0.04), M.notPp, 5.08, 2.55, z, Math.PI / 2);
  });
  [5, 15, 25, 35].forEach((z) => {
    roomPlate(-5, z);
    roomPlate(5, z);
  });
  [1, 21].forEach((z) => {
    add(Cy(0.1, 0.66), M.ext, -4.85, 0.52, z);
    add(Cy(0.08, 0.14), M.extH, -4.85, 0.98, z);
    add(Cy(0.1, 0.66), M.ext, 4.85, 0.52, z);
    add(Cy(0.08, 0.14), M.extH, 4.85, 0.98, z);
  });

  function rack(x, z) {
    pushCol(x, z, 0.48, 0.38);
    add(B(0.84, 2.2, 0.62), M.srv, x, 1.1, z);
    for (let i = 0; i < 7; i++) {
      add(B(0.12, 0.04, 0.06), M.srvR, x + 0.3, 0.3 + i * 0.3, z - 0.33);
      add(B(0.12, 0.04, 0.06), M.srvG, x + 0.18, 0.3 + i * 0.3, z - 0.33);
      if (i % 2 === 0) add(B(0.1, 0.04, 0.06), M.srvB, x + 0.06, 0.3 + i * 0.3, z - 0.33);
    }
  }
  /* 서버룸: 중앙 통로(문 방향) 비움 — 랙은 벽쪽만 */
  rack(-3.6, -6.2);
  rack(3.6, -6.2);
  rack(-4.2, -4);
  rack(4.2, -4);
  add(B(0.38, 0.24, 0.04), M.mon, -3.4, 0.95, -2.4);
  add(B(0.34, 0.2, 0.03), M.monS, -3.4, 0.95, -2.38);

  for (let i = 0; i < 9; i++) {
    add(B(7, 0.18, 0.84), M.step, 0, 0.18 * (i + 1), 44.4 + i * 0.84);
    add(B(0.06, 1.2 + 0.18 * (i + 1), 0.06), M.rail, -3.5, (1.2 + 0.18 * (i + 1)) / 2, 44.4 + i * 0.84);
    add(B(0.06, 1.2 + 0.18 * (i + 1), 0.06), M.rail, 3.5, (1.2 + 0.18 * (i + 1)) / 2, 44.4 + i * 0.84);
  }
  add(B(0.05, 0.05, 8), M.rail, -3.5, 1.65, 48.5);
  add(B(0.05, 0.05, 8), M.rail, 3.5, 1.65, 48.5);
  add(B(7, 0.12, 2), M.fEx, 0, 0.12, 52.0);
  add(B(1.8, 2.8, 0.06), M.mEx, 0, 1.4, 51.97, 0, skipMarkers ? null : 'marker');
  add(B(0.32, 0.24, 0.1), M.emer, 0, H - 0.2, 51.9);
  add(B(0.32, 0.24, 0.1), M.emer, -4.95, H - 0.38, 44, Math.PI / 2);

  if (!skipMarkers) {
    add(Cy(0.28, 0.1, 16), M.mPl, 0, 0.06, -4.5, 0, 'marker');
    add(B(0.1, 0.1, 0.5), M.mPl, 0, 0.14, -4.9, 0, 'marker');
    function clue(x, z) {
      add(Sp(0.26, 14), M.mCl, x, 0.9, z, 0, 'marker');
      pl(x, 1.1, z, 0xf0c040, 0.7, 5);
    }
    clue(-11, 10);
    clue(11, 10);
    clue(-11, 28);
    function ghost(x, z) {
      add(Sp(0.32, 12), M.mGh, x, 0.82, z, 0, 'marker');
      pl(x, 0.9, z, 0xc82020, 0.5, 4);
    }
    ghost(0, 4);
    ghost(0, 13);
    add(
      B(0.04, 0.04, 9),
      new THREE.MeshBasicMaterial({ color: 0xc82020, transparent: true, opacity: 0.15 }),
      0,
      0.82,
      8.5,
      0,
      'marker'
    );
    ghost(-10.5, 9);
    ghost(-6.5, 12.5);
    ghost(0, 22.5);
    ghost(0, 33.5);
  }

  function setRoofVisible(v) {
    LYR.roof.forEach((m) => {
      m.visible = v;
    });
  }
  if (hideRoofOnBuild) setRoofVisible(false);

  return {
    M,
    lights,
    H,
    DW,
    doors,
    colliders,
    setRoofVisible,
    tick: function (t) {
      M.srvR.emissiveIntensity = 0.8 + Math.sin(t * 4.8) * 0.7;
      lights.svL.intensity = 1.8 + Math.sin(t * 1.4) * 0.55;
      lights.exL.intensity = 1.6 + Math.sin(t * 2.0) * 0.45;
      lights.flkL.intensity = 0.72 + Math.sin(t * 22 + Math.random() * 0.4) * 0.32;
      M.glWin.emissiveIntensity = (gameMode ? 0.38 : 0.52) + Math.sin(t * 0.4) * 0.1;
    },
  };
}

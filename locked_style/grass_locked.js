// grass: individual curved blades (root dark -> tip light), dense near the action, thinner far out
{
  const seg = 4, geo = new THREE.BufferGeometry(), pos = [], col = [], idx = [];
  for (let s = 0; s <= seg; s++) { const t = s / seg, w = 0.012 * (1 - t * 0.92), y = t * 0.32, bend = t * t * 0.09; pos.push(-w, y, bend, w, y, bend); const c = 0.42 + 0.58 * t; col.push(c * 0.78, c, c * 0.62, c * 0.78, c, c * 0.62); if (s < seg) { const k = s * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.8, envMapIntensity: 0.5 });
  const r2 = P.rng(5), pts = [];
  const zones = [[31, -1, 30, 22, 60000], [8, 15, 40, 10, 22000], [-8, 0, 50, 40, 30000], [30, 22, 50, 16, 18000]];
  for (const [zx, zz, zw, zd, n] of zones) for (let i = 0; i < n; i++) { const x = zx + (r2() - 0.5) * zw, z = zz + (r2() - 0.5) * zd; if (x > -11 && x < 11 && z > -5 && z < 13) continue; if (Math.abs(z - 13) < 2.6) continue; pts.push([x, z]); }
  const im = new THREE.InstancedMesh(geo, mat, pts.length), M4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion(), E4 = new THREE.Euler(), C4 = new THREE.Color();
  pts.forEach(([x, z], i) => { E4.set((r2() - 0.5) * 0.5, r2() * 6.28, (r2() - 0.5) * 0.5); Q4.setFromEuler(E4); const s = 0.6 + r2() * 0.9; M4.compose(new THREE.Vector3(x, hAt(x, z), z), Q4, new THREE.Vector3(1, s, 1)); im.setMatrixAt(i, M4); const h = r2();
    im.setColorAt(i, h < 0.08 ? C4.setRGB(0.95, 0.85, 0.5) : C4.setRGB(0.36 + r2() * 0.18, 0.55 + r2() * 0.22, 0.2 + r2() * 0.1)); });
  im.receiveShadow = true; im.frustumCulled = false; scene.add(im);
}

// Spaghetti opening camera keys (per-beat a/b poses), shared by the composition and the camera path checks.
import * as THREE from 'three';
import {RW} from '../design/room';
import type {BeatCam, Pose, V3} from '../engine/camera';
// TV placement in the room (as approved) and its screen in world space
export const TV_POS = new THREE.Vector3(-1.12, 0, -1.6), TV_ROT = Math.PI - 0.65;
export const SCREEN = new THREE.Vector3(-0.02, 0.74, -0.24).applyAxisAngle(new THREE.Vector3(0, 1, 0), TV_ROT).add(TV_POS);
export const NORMAL = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), TV_ROT);
const fromScreen = (d: number, side = 0, up = 0, fov = 40, lookUp = 0): Pose => {
  const right = new THREE.Vector3(0, 1, 0).cross(NORMAL).normalize();
  const p = SCREEN.clone().addScaledVector(NORMAL, d).addScaledVector(right, side).add(new THREE.Vector3(0, up, 0));
  return {pos: p.toArray() as V3, look: SCREEN.clone().add(new THREE.Vector3(0, lookUp, 0)).toArray() as V3, fov, focus: d};
};
export const SOFA = new THREE.Vector3(RW / 2 - 0.5, 0, 0.35);
export const CAMS: Record<number, BeatCam> = {
  0: {set: 'room', a: {pos: [0.7, 1.08, 1.75], look: [-1.1, 0.85, -1.35], fov: 58, focus: 3}, b: fromScreen(0.9, 0.25, 0.12, 46)},
  1: {set: 'city', a: {pos: [2, 7.5, 3], look: [-25, 8, -45], fov: 60, focus: 30}, b: {pos: [5, 34, 30], look: [25, 4, -650], fov: 56, focus: 80}},
  2: {set: 'room', a: fromScreen(0.75, -0.12, 0.05, 42), b: fromScreen(0.5, -0.05, 0.02, 40)},
  3: {set: 'room', a: fromScreen(0.46, 0.0, 0.0, 40), b: fromScreen(0.3, 0.03, 0.0, 38)},
  4: {set: 'roomB', a: {pos: [-1.25, 1.05, -1.05], look: [0.58, 0.8, 0.25], fov: 58, focus: 2.25}, b: {pos: [-1.0, 1.02, -0.75], look: [0.58, 0.78, 0.3], fov: 55, focus: 1.9}},
  5: {set: 'city', a: {pos: [4, 80, 150], look: [30, 0, -820], fov: 52, focus: 300}, b: {pos: [12, 64, 90], look: [40, 0, -820], fov: 50, focus: 300}},
  6: {set: 'room', a: fromScreen(0.95, 0.3, 0.1, 44), b: fromScreen(0.62, 0.12, 0.05, 42)},
  7: {set: 'room', a: fromScreen(0.55, 0.06, 0.03, 40, 0.02), b: fromScreen(0.36, 0.0, 0.03, 38, 0.03)},
  8: {set: 'room', a: fromScreen(0.34, 0, 0.03, 38), b: fromScreen(0.31, 0, 0.03, 37)},
};

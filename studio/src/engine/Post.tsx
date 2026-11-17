// Composer: render → depth of field (round bokeh) → bloom (HDR only) → whip motion blur → vignette + slight CA → ACES.
import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {useFrame, useThree} from '@react-three/fiber';
import {N8AOPostPass} from 'n8ao';
import {EffectAttribute, BloomEffect, ChromaticAberrationEffect, DepthOfFieldEffect, Effect, EffectComposer, EffectPass, RenderPass, ToneMappingEffect, ToneMappingMode, VignetteEffect, BlendFunction, SMAAEffect} from 'postprocessing';

class AcesFit extends Effect {
  constructor() {
    super('AcesFit', `uniform float exposure;
      void mainImage(const in vec4 c, const in vec2 uv, out vec4 o){ vec3 x = c.rgb * exposure;
        o = vec4(clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0), c.a); }`, {uniforms: new Map([['exposure', new THREE.Uniform(1)]])});
  }
}
/** Anime background look: Kuwahara painterly smoothing (flat painted areas, crisp edges), depth outlines in warm ink,
 *  and a bright saturated grade (cool lifted shadows, warm highlights). */
class AnimeLook extends Effect {
  constructor() {
    super('AnimeLook', `uniform float ink; uniform float sat; uniform vec2 texel;
      vec3 kuwa(vec2 uv){ const int R = 3; vec3 m[4]; vec3 s[4];
        for (int k = 0; k < 4; k++) { m[k] = vec3(0.0); s[k] = vec3(0.0); }
        for (int j = -R; j <= 0; j++) for (int i = -R; i <= 0; i++) {
          vec3 c0 = texture2D(inputBuffer, uv + vec2(i, j) * texel).rgb; m[0] += c0; s[0] += c0 * c0;
          vec3 c1 = texture2D(inputBuffer, uv + vec2(-i, j) * texel).rgb; m[1] += c1; s[1] += c1 * c1;
          vec3 c2 = texture2D(inputBuffer, uv + vec2(i, -j) * texel).rgb; m[2] += c2; s[2] += c2 * c2;
          vec3 c3 = texture2D(inputBuffer, uv + vec2(-i, -j) * texel).rgb; m[3] += c3; s[3] += c3 * c3; }
        float n = float((R + 1) * (R + 1)); float best = 1e9; vec3 outc = vec3(0.0);
        for (int k = 0; k < 4; k++) { vec3 mu = m[k] / n; vec3 v = abs(s[k] / n - mu * mu); float sig = v.r + v.g + v.b; if (sig < best) { best = sig; outc = mu; } }
        return outc; }
      float lin(float d){ return cameraNear * cameraFar / (cameraFar - d * (cameraFar - cameraNear)); }
      void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor){
        vec3 c = kuwa(uv);
        // outlines from depth discontinuities (relative), thin and warm-dark like painted cel backgrounds
        float d0 = lin(depth), e = 0.0;
        for (int k = 0; k < 4; k++) { vec2 o = (k == 0 ? vec2(1,0) : k == 1 ? vec2(-1,0) : k == 2 ? vec2(0,1) : vec2(0,-1)) * texel * 1.3;
          float dk = lin(readDepth(uv + o)); e = max(e, abs(dk - d0) / max(d0, 0.05)); }
        float line = smoothstep(0.02, 0.06, e) * ink;
        // grade: saturation, lifted cool shadows, warm highlights
        float L = dot(c, vec3(0.299, 0.587, 0.114));
        c = mix(vec3(L), c, sat);
        c = mix(c * vec3(0.92, 0.97, 1.12) + vec3(0.015, 0.02, 0.04), c * vec3(1.06, 1.02, 0.95), smoothstep(0.15, 0.7, L));
        c = mix(c, vec3(0.16, 0.10, 0.09) * (0.6 + 0.4 * L), line);
        outputColor = vec4(c, inputColor.a); }`,
      {attributes: EffectAttribute.DEPTH, uniforms: new Map<string, THREE.Uniform>([['ink', new THREE.Uniform(0.85)], ['sat', new THREE.Uniform(1.3)], ['texel', new THREE.Uniform(new THREE.Vector2(1 / 1080, 1 / 1920))]])});
  }
}
class WhipBlur extends Effect {
  constructor() {
    super('WhipBlur', `uniform float amount; uniform vec2 dir;
      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
        if (amount < 0.001) { outputColor = inputColor; return; }
        vec4 acc = vec4(0.0); float wsum = 0.0;
        for (int i = -12; i <= 12; i++) { float f = float(i) / 12.0; float w = 1.0 - abs(f) * 0.6;
          acc += texture2D(inputBuffer, uv + dir * f * amount) * w; wsum += w; }
        outputColor = acc / wsum; }`, {uniforms: new Map<string, THREE.Uniform>([['amount', new THREE.Uniform(0)], ['dir', new THREE.Uniform(new THREE.Vector2(1, 0))]])});
  }
}

export type PostProps = {focus: number; focusRange?: number; bokeh: number; whip: number; exposure?: number; bloom?: number; vignette?: number; sharpen?: boolean;
  /** screen-space ambient occlusion (N8AO): radius in metres, intensity */ ao?: {radius: number; intensity: number; falloff?: number};
  /** bright painted anime-background look (Kuwahara + ink outlines + saturated grade) */ anime?: {ink?: number; sat?: number}};
export const Post: React.FC<PostProps> = ({focus, focusRange, bokeh, whip, bloom = 0.5, vignette = 0.32, exposure = 1, ao, anime}) => {
  const {gl, scene, camera, size} = useThree();
  const fx = useMemo(() => {
    console.log('POST BUILD', Date.now());
    gl.toneMapping = THREE.NoToneMapping;
    const composer = new EffectComposer(gl, {frameBufferType: THREE.HalfFloatType, multisampling: 0});
    composer.addPass(new RenderPass(scene, camera));
    if (ao) {
      const n8 = new N8AOPostPass(scene, camera, size.width, size.height);
      n8.configuration.aoRadius = ao.radius; n8.configuration.intensity = ao.intensity; n8.configuration.distanceFalloff = ao.falloff ?? 0.4;
      n8.configuration.halfRes = false; n8.configuration.aoSamples = 16; n8.configuration.denoiseSamples = 8; n8.configuration.gammaCorrection = false;
      composer.addPass(n8);
    }
    const dof = new DepthOfFieldEffect(camera, {focusDistance: 0.02, focalLength: 0.03, bokehScale: 0, resolutionScale: 0.5});
    const bloomE = new BloomEffect({luminanceThreshold: 1.0, luminanceSmoothing: 0.2, intensity: bloom, mipmapBlur: true, radius: 0.6});
    const whipE = new WhipBlur();
    const vig = new VignetteEffect({offset: 0.3, darkness: vignette});
    const ca = new ChromaticAberrationEffect({offset: new THREE.Vector2(0.0006, 0.0004), radialModulation: true, modulationOffset: 0.35});
    const tone = new AcesFit();
    composer.addPass(new EffectPass(camera, dof));
    composer.addPass(new EffectPass(camera, bloomE));
    composer.addPass(new EffectPass(camera, whipE));
    composer.addPass(new EffectPass(camera, new SMAAEffect()));
    composer.addPass(new EffectPass(camera, ca));
    composer.addPass(new EffectPass(camera, tone, vig));
    let animeE: AnimeLook | null = null;
    if (anime) { animeE = new AnimeLook(); (animeE.uniforms.get('ink') as THREE.Uniform).value = anime.ink ?? 0.85; (animeE.uniforms.get('sat') as THREE.Uniform).value = anime.sat ?? 1.3;
      (animeE.uniforms.get('texel') as THREE.Uniform).value.set(1 / size.width, 1 / size.height); composer.addPass(new EffectPass(camera, animeE)); }
    return {composer, dof, whipE, tone, animeE};
  }, []);
  useEffect(() => { fx.composer.setSize(size.width, size.height); }, [size.width, size.height]);
  // DOF in world units: focus distance (m) and bokeh scale (px-ish at 1080)
  const c = camera as THREE.PerspectiveCamera;
  fx.dof.cocMaterial.worldFocusDistance = Math.max(0.2, focus);
  fx.dof.cocMaterial.worldFocusRange = focusRange ?? Math.max(0.3, focus * 0.35);
  if (fx.animeE && anime) (fx.animeE.uniforms.get('ink') as THREE.Uniform).value = anime.ink ?? 0.85;
  fx.dof.bokehScale = bokeh * (size.height / 1920);
  (fx.whipE.uniforms.get('amount') as THREE.Uniform).value = Math.pow(Math.abs(whip), 1.6) * 0.06;
  (fx.tone.uniforms.get('exposure') as THREE.Uniform).value = exposure;
  useFrame(() => { fx.composer.render(); }, 1);
  return null;
};

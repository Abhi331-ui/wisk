// Composer: render → depth of field (round bokeh) → bloom (HDR only) → whip motion blur → vignette + slight CA → ACES.
import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {useFrame, useThree} from '@react-three/fiber';
import {BloomEffect, ChromaticAberrationEffect, DepthOfFieldEffect, Effect, EffectComposer, EffectPass, RenderPass, ToneMappingEffect, ToneMappingMode, VignetteEffect, BlendFunction, SMAAEffect} from 'postprocessing';

class AcesFit extends Effect {
  constructor() {
    super('AcesFit', `uniform float exposure;
      void mainImage(const in vec4 c, const in vec2 uv, out vec4 o){ vec3 x = c.rgb * exposure;
        o = vec4(clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0), c.a); }`, {uniforms: new Map([['exposure', new THREE.Uniform(1)]])});
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

export type PostProps = {focus: number; bokeh: number; whip: number; exposure?: number; bloom?: number; vignette?: number; sharpen?: boolean};
export const Post: React.FC<PostProps> = ({focus, bokeh, whip, bloom = 0.5, vignette = 0.32, exposure = 1}) => {
  const {gl, scene, camera, size} = useThree();
  const fx = useMemo(() => {
    console.log('POST BUILD', Date.now());
    gl.toneMapping = THREE.NoToneMapping;
    const composer = new EffectComposer(gl, {frameBufferType: THREE.HalfFloatType, multisampling: 0});
    composer.addPass(new RenderPass(scene, camera));
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
    return {composer, dof, whipE, tone};
  }, []);
  useEffect(() => { fx.composer.setSize(size.width, size.height); }, [size.width, size.height]);
  // DOF in world units: focus distance (m) and bokeh scale (px-ish at 1080)
  const c = camera as THREE.PerspectiveCamera;
  fx.dof.cocMaterial.worldFocusDistance = Math.max(0.2, focus);
  fx.dof.cocMaterial.worldFocusRange = Math.max(0.3, focus * 0.35);
  fx.dof.bokehScale = bokeh * (size.height / 1920);
  (fx.whipE.uniforms.get('amount') as THREE.Uniform).value = Math.pow(Math.abs(whip), 1.6) * 0.06;
  (fx.tone.uniforms.get('exposure') as THREE.Uniform).value = exposure;
  useFrame(() => { fx.composer.render(); }, 1);
  return null;
};

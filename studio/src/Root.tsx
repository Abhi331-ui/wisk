import React from 'react';
import {Composition} from 'remotion';
import {PerfTest} from './PerfTest';
import {OrchardTest} from './tests/OrchardTest';
export const Root: React.FC = () => (
  <>
    <Composition id="PerfTest" component={PerfTest} durationInFrames={60} fps={30} width={1080} height={1920} />
    <Composition id="OrchardTest" component={OrchardTest} durationInFrames={90} fps={30} width={1080} height={1920} />
  </>
);

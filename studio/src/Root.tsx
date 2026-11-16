import React from 'react';
import {Composition} from 'remotion';
import {PerfTest} from './PerfTest';
import {OrchardTest} from './tests/OrchardTest';
import {ModelSheet} from './tests/ModelSheet';
import {StreetTest} from './tests/StreetTest';
import {TVFrame} from './tests/TVFrame';
import {TVDesign} from './design/TVDesign';
import {RoomDesign} from './design/RoomDesign';
export const Root: React.FC = () => (
  <>
    <Composition id="PerfTest" component={PerfTest} durationInFrames={60} fps={30} width={1080} height={1920} />
    <Composition id="OrchardTest" component={OrchardTest} durationInFrames={90} fps={30} width={1080} height={1920} />
    <Composition id="ModelSheet" component={ModelSheet as any} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{ids: []}} />
    <Composition id="StreetTest" component={StreetTest} durationInFrames={4} fps={30} width={1080} height={1920} />
    <Composition id="TVFrame" component={TVFrame} durationInFrames={1} fps={30} width={1200} height={900} />
    <Composition id="TVDesign" component={TVDesign} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="RoomDesign" component={RoomDesign} durationInFrames={2} fps={30} width={1080} height={1920} />
  </>
);

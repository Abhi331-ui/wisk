// Sandbox entry for the look pass: renders only src/videos/bridge_world (an isolated copy of the bridge short).
import React from "react";
import { Composition, registerRoot } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "../../videos/bridge_world/Bridge";

const Root: React.FC = () => <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(Root);

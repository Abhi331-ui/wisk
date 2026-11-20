---
name: cinematic-comic-storytelling
description: >
  Directs original story-driven videos using hand-drawn 2D comic characters inside
  cinematic 3D environments, with reference-informed camera choreography, comic-page
  transitions, precise shot planning, and AI production workflows. Use when developing
  stories, characters, visual bibles, comic pages, camera plans, animation prompts,
  reference-video analysis, or production pipelines for this format.
---

# Cinematic Comic Storytelling Skill

## Mission

Create original, highly cinematic story videos that combine:
- Hand-drawn, 2D comic characters.
- A dimensional, stylized-realistic 3D world.
- Comic-page and panel storytelling.
- Camera choreography that is planned together with the script.
- AI-generated animation and carefully controlled virtual-camera movement.
- Suspense, horror, action, comedy, emotion, and visual storytelling.

The visual target is a hybrid format inspired by the user's supplied reference video. Analyze the actual reference before making claims about exact camera behavior. Do not assume every movement, shot, or transition is present based on a few still frames.

The target is NOT a generic motion comic, slideshow, anime, photorealistic character animation, or random AI zoom video. It is a cinematic hybrid in which drawn characters occupy a 3D world and the camera behaves like a deliberate cinematographer.

## Core production format

The user's intended story structure:
- 5 parts per complete story.
- 30 comic pages per part.
- 6 comic artworks/panels per page.
- 180 artworks per part.
- 900 artworks per complete 5-part story.

The user has discussed a 90-second animated sequence and a 2-second visual beat/frame cadence. Confirm the intended timing unit before calculating total runtime. Do not silently assume whether 90 seconds applies to one panel, one page, or another unit.

## Visual identity

### Characters
Use original, story-specific characters with a hand-drawn comic appearance:
- Simple readable silhouettes.
- Strong, intentional black or dark outlines.
- Flat or lightly shaded 2D artwork.
- Minimal facial geometry, but highly expressive eyes, brows, mouth, and body pose.
- Stylized proportions selected for the story.
- Clothing, props, hair, accessories, and body shape must communicate character identity.
- Character designs must remain consistent across all pages and shots.
- Characters should not look like fully 3D animated models unless the user explicitly changes the style.
- Avoid accidental texture noise, warped anatomy, extra limbs, distorted linework, or inconsistent facial proportions.

The reference contains simple, round-headed, hand-drawn characters with dark outlines and simplified bodies. Treat this as a style reference, not a requirement to copy specific existing character designs. Design new characters according to the story while preserving the relevant visual grammar.

### 3D world
Build the world as a coherent 3D environment:
- Clear spatial layout and perspective.
- Stylized-realistic textures, materials, lighting, and shadows.
- Atmospheric depth, haze, clouds, fog, rain, dust, smoke, particles, or environmental motion when story-appropriate.
- Consistent geography between shots.
- Realistic camera parallax.
- Characters should feel composited into the environment through grounding shadows, contact points, scale, lighting direction, and perspective.
- Keep the world detailed enough to feel cinematic, but never let background detail compete with the narrative focal point.

### Hybrid compositing
For every shot, specify:
- Character layer or character asset.
- Environment.
- Character position and scale.
- Ground/contact shadow.
- Light direction and color.
- Camera perspective.
- Depth relationships.
- Foreground occlusion, if any.
- Character movement.
- Environment movement.
- Camera movement.

The 2D character must remain visibly illustrated while the 3D world provides depth. Do not unintentionally convert the character into a 3D model.

## Reference-video analysis protocol

When a reference video is supplied, analyze it before creating the visual bible.

### Do not merely summarize the video
Extract a technical visual grammar. If tools allow, inspect:
1. The complete video.
2. A contact sheet at regular intervals.
3. Individual frames around shot changes.
4. The motion between sampled frames.
5. Camera movement, not only composition.
6. Timing and rhythm.
7. Character movement.
8. Environmental motion.
9. Lighting and depth.
10. Transitions and continuity.

### Create a Reference Analysis Report
Use this structure:

1. **Reference identity and scope**
   - File name.
   - Duration.
   - Frame rate/resolution if available.
   - Analysis limitations.

2. **Style DNA**
   - Character construction.
   - Outline and line quality.
   - Facial design.
   - Body proportions.
   - Clothing/prop treatment.
   - Environment style.
   - Lighting.
   - Color palette.
   - Texture and rendering.
   - Compositing.

3. **Shot-by-shot timeline**
   For every shot or meaningful camera change:
   - Timestamp range.
   - Shot size.
   - Camera angle.
   - Camera position.
   - Camera movement.
   - Movement speed.
   - Subject movement.
   - Environment movement.
   - Composition.
   - Focal subject.
   - Emotional function.
   - Transition in/out.
   - Confidence level.

4. **Camera movement taxonomy**
   Identify observed examples of:
   - Locked shot.
   - Pan.
   - Tilt.
   - Dolly in/out.
   - Tracking.
   - Orbit.
   - Crane/vertical movement.
   - Zoom.
   - Reframing.
   - Handheld/shake.
   - Rack focus, if observable.
   - Digital push or crop.
   Do not label movement that cannot be verified.

5. **Rhythm**
   - Average shot duration.
   - Long holds.
   - Fast changes.
   - Dialogue timing.
   - Suspense pauses.
   - Action rhythm.
   - Visual beats.

6. **Reproducible style rules**
   Convert observations into rules that can be applied to a new story.

7. **What not to imitate**
   Identify elements that are likely accidental, low quality, or not relevant to the desired project.

8. **Confidence and evidence**
   Distinguish direct observation from inference. Cite timestamps and frame evidence when possible.

## Story-first camera direction

Camera movement must be written during story development, not appended after the script.

Every movement must serve at least one purpose:
- Reveal information.
- Guide attention.
- Establish geography.
- Follow action.
- Create suspense.
- Emphasize emotion.
- Create a visual joke.
- Connect panels/pages.
- Reveal scale.
- Hide or delay information.
- Transition into/out of an animated sequence.

If movement serves no purpose, remove it.

## Camera movement rules

### 1. Orientation first
Before moving into a panel, establish the page or scene sufficiently for the viewer to understand where they are.

### 2. One primary movement at a time
Avoid combining multiple unrelated movements. A shot may have one primary movement and, at most, one subtle secondary movement.

### 3. Movement must have endpoints
Specify:
- Start position.
- Target.
- Direction.
- Duration.
- Speed profile.
- Focus subject.
- End framing.
- Transition.

### 4. No arbitrary zooms
Zooms and pushes must be motivated by narrative focus, emotional emphasis, reveal, or spatial transition.

### 5. Respect reading direction
For left-to-right comics, normally move left-to-right and top-to-bottom. Break this pattern only for a deliberate dramatic reason, and make the deviation legible.

### 6. Preserve geography
Maintain character positions, eyelines, object placement, room layout, screen direction, light direction, and scale. Do not teleport the camera or subject without a motivated transition.

### 7. Use stillness
A locked camera is often more powerful than movement, especially for:
- Dialogue.
- Emotional reactions.
- Horror anticipation.
- A reveal.
- A joke's timing.
- A dramatic aftermath.

### 8. Suspense through delayed reveal
Do not reveal a threat earlier than the script intends. Use:
- Partial framing.
- Foreground obstruction.
- Shadows.
- Negative space.
- Slow approaches.
- Reaction shots.
- Sound before image.
- Controlled holds.

### 9. Avoid motion sickness
Avoid unnecessary:
- Rotation.
- Dutch angles.
- Whip pans.
- Rapid zooms.
- Shake.
- Repeated push-pull movement.
- Excessive parallax.
- Random camera repositioning.

### 10. Camera continuity
When creating the illusion of a continuous camera, use motivated hidden transitions:
- Passing behind a foreground object.
- Entering a doorway.
- Moving through shadow.
- Page-turn occlusion.
- Moving behind a comic panel.
- Zooming into a graphic detail.
- Smoke, dust, or a dark frame.
- A character/object crossing the lens.
- Entering a 3D scene from a panel.

Do not promise a technically unbroken shot if the production uses separate generated clips. Describe it as a seamless continuous-camera illusion.

## Camera vocabulary and usage

### Establishing shot
Purpose: spatial context and scale.
Movement: usually locked, slow dolly, or gentle crane.
Do not begin with aggressive motion unless story demands it.

### Wide shot
Purpose: character and environment relationship.
Movement: tracking, slow push, or stable composition.

### Medium shot
Purpose: dialogue, action, body language.
Movement: restrained pan or tracking.

### Close-up
Purpose: expression, clue, emotional beat.
Movement: slow push or locked frame.

### Extreme close-up
Purpose: crucial detail, foreshadowing, threat.
Movement: usually slow and precise.

### Low angle
Purpose: power, danger, scale.
Do not use automatically.

### High angle
Purpose: vulnerability, geography, isolation.

### Tracking shot
Follow the subject while maintaining screen direction and readable geography.

### Dolly-in
Use for emotional emphasis, suspense, or discovery. Define the acceleration and stopping point.

### Dolly-out
Use to reveal context, isolation, consequences, or a larger threat.

### Orbit
Use sparingly. The world and subject must remain spatially coherent. Specify orbit direction and approximate angle.

### Pan/tilt
Use to guide attention or follow movement. Avoid unexplained camera scanning.

### Rack focus
Only use when the medium supports it and when focus shift is meaningful. Specify foreground/background subjects.

## Shot choreography format

Every shot must use a camera directive block:

```yaml
shot_id: P01_PAGE01_PANEL01_SHOT03
time_start: 00:08.000
time_end: 00:10.000
duration: 2.0
story_beat: "The character notices a distant light."
emotion: "Curiosity turning into unease"
shot_size: "medium-wide"
camera_start:
  position: "slightly behind and left of character"
  framing: "character in left third, light in distant right background"
camera_move:
  primary: "slow dolly forward"
  direction: "forward"
  speed: "slow, constant"
  acceleration: "gentle ease-in"
  secondary: "subtle pan right"
  rotation: "none"
focus:
  subject: "distant light"
  focus_behavior: "hold character initially, then shift to light if supported"
camera_end:
  framing: "light occupies the upper-right focal area"
continuity:
  screen_direction: "character looks toward screen-right"
  preserve: ["character location", "light location", "horizon", "lighting direction"]
transition_out: "move behind a foreground wall to conceal transition"
why: "Guide attention and build curiosity"
negative_constraints:
  - "no random zoom"
  - "no camera shake"
  - "no rotation"
  - "do not reveal the source of the light"
```

## Two-second visual beat system

If the user requires a visual beat every two seconds, interpret it as a change in visual information, framing, motion phase, or narrative focus—not necessarily a hard cut.

Possible beat types:
- New panel.
- New focal detail.
- Camera reaches a new composition.
- Character movement.
- Environment movement.
- Focus change.
- Reveal.
- Reaction.
- Page transition.
- Animated action.
- Sound-led visual hold.

Do not make every beat a cut. A continuous camera can cross multiple two-second beats while maintaining one coherent movement.

For every 2-second beat, define:
- What changes.
- What stays stable.
- What the audience should notice.
- Why the beat exists.

## Comic-page design

Each page contains six comic artworks/panels, unless the user changes the specification.

Before creating camera paths:
1. Define the page layout.
2. Establish panel order.
3. Define panel aspect ratios.
4. Establish visual hierarchy.
5. Identify the main focal point.
6. Identify page-turn/cliffhanger opportunities.
7. Define panel-to-panel camera route.
8. Confirm that the route is physically and visually possible.

Avoid overly complicated panel layouts if the camera needs to travel through the page.

## Page-to-panel camera navigation

For each page:
- Begin with a page-level establishing view when appropriate.
- Move to the first panel in a legible route.
- Respect reading direction unless a deliberate deviation is motivated.
- Avoid crossing gutters in a confusing way.
- Use gutters as visual transition spaces.
- Do not zoom so far that the viewer loses page orientation.
- Exit the page with a planned transition.
- Page turns must be motivated by a narrative beat, not merely by page completion.

## 2D character animation

Character movement should be simple but expressive:
- Body lean.
- Head turn.
- Eye direction.
- Eyebrow changes.
- Mouth movement.
- Arm gestures.
- Hand movement.
- Walking/running poses.
- Small bounce or recoil.
- Character silhouette changes.

Do not animate every body part continuously. Preserve the hand-drawn look.

Use pose-based animation and limited animation where appropriate. The character should not look like a 3D rig unless explicitly desired.

## 3D world animation

Animate the environment selectively:
- Rain.
- Wind.
- Smoke.
- Fog.
- Dust.
- Falling debris.
- Moving lights.
- Flickering bulbs.
- Water.
- Cloth.
- Trees.
- Particles.
- Reflections.
- Background traffic.
- Clouds.

Environmental animation should reinforce the story and create depth, not become visual noise.

## Hybrid character/world integration checklist

Before approving a frame:
- Does the character have a believable contact shadow?
- Is the scale correct?
- Does the character match the perspective?
- Is the light direction consistent?
- Does the character feel grounded?
- Is the 2D style preserved?
- Are foreground and background depth relationships clear?
- Is the outline readable against the background?
- Is the character's silhouette clean?

## Story development workflow

### Phase 1: Concept
Create:
- Logline.
- Genre.
- Central mystery/conflict.
- Theme.
- Main emotional arc.
- Audience.
- Ending concept.

### Phase 2: Five-part structure
For each part:
- Opening hook.
- Main objective.
- Major obstacle.
- Escalation.
- Midpoint.
- Reversal.
- Climax.
- Cliffhanger or resolution.

Do not write all 150 pages before the user approves the premise and structure.

### Phase 3: Part outline
Create 30 page summaries per part. Each page:
- Narrative purpose.
- Six-panel outline.
- Dialogue/narration.
- Visual focal point.
- Emotional beat.
- Camera route.
- Animation opportunity.
- Page-turn hook.

### Phase 4: Script
For each panel/artwork:
- Panel number.
- Visual description.
- Character pose.
- Environment.
- Narration.
- Dialogue.
- Sound effect.
- Camera direction.
- Motion.
- Timing.
- Transition.

### Phase 5: Character bible
For every character:
- Name.
- Story role.
- Age range.
- Silhouette.
- Face.
- Hair.
- Clothing.
- Palette.
- Props.
- Expressions.
- Pose library.
- Character turnaround/reference views.
- Do-not-change traits.
- Prompt for consistent generation.

### Phase 6: Environment bible
For every recurring location:
- Layout.
- Dimensions/scale.
- Landmark objects.
- Lighting.
- Palette.
- Materials.
- Time of day.
- Weather.
- Camera-accessible paths.
- Continuity rules.

### Phase 7: Storyboard and camera map
Create a shot list with exact camera directions before animation generation.

### Phase 8: Asset production
Generate:
- Character references.
- Backgrounds.
- Comic panels.
- 3D environment references.
- Props.
- Animation source assets.
- Transition assets.

### Phase 9: Animation
Choose the correct method for each shot:
- Camera animation over still/2.5D artwork.
- Character pose animation.
- AI image-to-video.
- 3D camera animation.
- Full generated cinematic video.
- Hybrid compositing.

### Phase 10: Quality control
Review every shot against the camera plan.

## Quality-control scoring

Score each shot 1–5:

1. Camera accuracy.
2. Composition.
3. Spatial continuity.
4. Character consistency.
5. 2D/3D integration.
6. Motion quality.
7. Narrative clarity.
8. Emotional impact.
9. Reference-style consistency.
10. Transition quality.

Reject or revise shots scoring below 4 in critical categories:
- Camera accuracy.
- Spatial continuity.
- Character consistency.
- Narrative clarity.

## Production output requirements

When the user asks for a story, do not output only prose. Use the requested production format.

Preferred outputs:
1. Story premise.
2. Part structure.
3. Page outline.
4. Six-panel page script.
5. Camera choreography.
6. Character visual descriptions.
7. Environment descriptions.
8. AI generation prompts.
9. Animation prompts.
10. Sound design.
11. Continuity checklist.

For a single scene, output a complete production packet rather than a vague prompt.

## Prompt-writing principles

Every visual prompt should include:
- Subject.
- Character design.
- Environment.
- Composition.
- Lighting.
- Camera.
- Action.
- Motion.
- Style.
- Continuity.
- Duration.
- Negative constraints.

Use specific, measurable camera directions. Avoid phrases such as:
- "cinematic camera movement"
- "dramatic zoom"
- "beautiful shot"
- "dynamic camera"

unless they are followed by precise instructions describing what the camera does.

## Never do these

- Invent camera movements that are not supported by the reference analysis.
- Treat a contact sheet as proof of motion.
- Copy specific copyrighted character designs from a reference when creating original story characters.
- Change a character's appearance from shot to shot.
- Change environment geography without explanation.
- Use camera movement without narrative purpose.
- Add random zooms or rotations.
- Over-animate simple comic characters.
- Make the 3D environment so detailed that the character becomes unreadable.
- Generate the full story before confirming the visual bible.
- Claim a continuous shot when separate clips have been assembled.
- Ignore timing, reading direction, page layout, or continuity.
- Assume the reference video has been fully analyzed if only a few frames were inspected.

## First response behavior

When this skill is activated:
1. Confirm the project goal briefly.
2. Ask for or locate the reference video.
3. Analyze the video deeply if available.
4. Produce a Reference Analysis Report.
5. Produce the Cinematic Comic Visual Bible.
6. Produce a Camera Movement Bible.
7. Confirm story timing/structure ambiguities.
8. Create a small proof-of-concept scene before scaling production.

## Bundled prompts

Read these when the task calls for them:
- `prompts/CLAUDE_MASTER_PROMPT.md`: the full director brief (deliverables, camera directive format, page navigation, QC scoring).
- `prompts/REFERENCE_ANALYSIS_PROMPT.md`: the full reference-video analysis spec and final report format.
- `prompts/ANTIGRAVITY_MASTER_PROMPT.md`: the workspace/production-system brief for other agents.

To render a scene in code (three.js, frame-exact, with real camera rails), pair this skill with the `3d-animator` skill.

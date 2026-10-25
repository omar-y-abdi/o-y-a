# SKIFT — design contract

> Historical standalone record, retained for provenance. Its approvals, checkmarks and measurements describe the original standalone work, not acceptance of the current portfolio branch. Current source and CI artifacts are authoritative; the `skift-release` job checks the present ZIP.

## Approved intent
An original browser **action game**, not EKO's puzzle concept and not a Bruno Simon clone. The visual quality reference is a cohesive, tactile, carefully lit world. The deliverable is an independent ZIP and a local installation. That original no-portfolio-edit boundary was superseded by the later authorized source integration.

## Direction
A tiny maintenance robot is the only thing still on shift in a malfunctioning power works. Dash through mechanical sentries, discharge a radial pulse, recover three cells in each district, then restart the heart of the machine. Three handcrafted dioramas: the sunlit relay yard, the turquoise cooling works, and the golden core chamber. The final district includes a three-pattern boss with readable vulnerability windows. No weapons realism, gore, accounts or chat.

The action loop is move → read an attack tell → dash through danger or use a pulse → recover charge → choose a safe route. Dashing damages enemies and grants brief invulnerability; walking into enemies does not. Pulse reflects projectiles and damages nearby enemies. Cells unlock extraction. Optional scrap and clean, fast runs reward mastery. Upgrade selection between districts changes dash, pulse or survivability. An assist setting changes combat, not available content.

## Art
Reference inspected through the GitHub connector: `src/styles/base.css` blob `9a02b9b77640f8e80d21e18a188b58826d760204`. Paper #fffdf6, butter #fff0b3, cobalt #234ce7, yellow #ffda44, coral #ff815f, ink #20261e, Arial/Helvetica system fonts; heavy tightly tracked headings. Carry the same material vocabulary into bevelled painted machinery, labels, bolts, pipes and plants. No external font files. Original geometry and original composed/synthesized audio, with authored world layouts. No repackaged game or borrowed artwork.

## Library boundaries
Three.js owns rendering, transforms, cameras, materials, geometry, shadows and geometry merging. cannon-es owns collision detection, contact resolution and fixed-step world integration. Howler owns audio loading, playback, mute and unlock. esbuild owns bundling and serving. Python's standard HTTP server owns local static serving. Playwright owns real browser automation. Custom code is limited to gameplay rules, level content, input mapping, artwork assembly and UI integration. No custom physics, renderer, ECS, audio engine, bundler or backend.

## Budget and portability
Normal WebGL 2-capable devices, not a GPU-free specification. Default economical 30 rendered FPS, optional 60 FPS, pixel ratio bounded independently of Retina density. Fixed 60 Hz physics with at most three substeps per rendered update. Shadows of static scenery updated on district load only. Static geometry merged by material; particle and projectile pools bounded. Pause simulation/audio when focus is lost. Menu animation sleeps; paused screens do not keep rendering. No promise that all 8 GB machines remain cold: RAM is not a performance class and thermal outcomes depend on hardware.

## Complete flows
Title → how to play / settings / play → three districts with checkpoints and upgrades → boss → completion scorecard → replay. Death → retry current district or title. Pause → controls/settings/resume/title. Persistent, versioned and validated local records and checkpoint; blocked storage must not prevent play. Swedish and English copy. Keyboard, pointer and multi-touch controls. Clear no-WebGL message, loading failure message and recovery action. Responsive portrait/landscape interfaces, reduced motion, visible focus and labelled controls. Menus are keyboard accessible; 3D action gameplay is not represented as screen-reader-equivalent.

## Acceptance
Real input must move the robot, collide with walls, dash, pulse, collect cells, damage/destroy enemies, transition districts and defeat the boss. Automated tests must exercise rules, progression, storage corruption, collision, real-browser startup, inputs, pause, resize and replay. Render screenshots must be inspected, not merely generated. Measure actual browser timing, geometry/draw-call budgets and hidden-tab behaviour. Clearly distinguish physical-device results from CPU-throttled simulations. All shipped scripts and source must be complete, not TODOs.

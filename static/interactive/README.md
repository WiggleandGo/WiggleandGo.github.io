# Interactive Drake recording

This static Three.js viewer loads `scene.glb`, exported from Blender using the geometry and animation embedded in `../animations/rope_orange_65_5_nn_params_target_1.2_0.1_0.2.html`.

The source geometry, recorded positions, rotations, and 30 fps timing are preserved. Materials, lights, camera, and presentation floor are new. Playback is a recording; this viewer does not rerun Drake physics.

Run the website with any static HTTP server (ES modules require HTTP). From the repository root:

    python3 -m http.server 8765 --bind 127.0.0.1

Open http://127.0.0.1:8765/#drake-animation . No build step, CDN, or runtime server dependency is needed for the viewer itself. The original HTML remains available at its previous path.

Controls: drag to orbit, scroll/pinch to zoom, reset view, play/pause/replay, restart, scrub, speed, and fullscreen where supported. Playback starts paused at the contact pose. Keyboard users can focus the timeline and use arrow keys, Home, and End.

Three.js r170 and its GLTFLoader, OrbitControls, BufferGeometryUtils, and RoomEnvironment modules are vendored here under the MIT license in `THREE-LICENSE.txt`. GLTFLoader's relative utility import is adjusted for this folder layout.

`provenance.json` records the source filename and hash. `validation.json` checks all 3,010 original animation keys against the exported animation after coordinate conversion.

Performance: `viewer.min.js` bundles and minifies the local modules. `viewer.js` remains the editable source. Rebuild with esbuild 0.25.12: `esbuild viewer.js --bundle --format=esm --minify --alias:three=./three.module.js --outfile=viewer.min.js`. Rendering is requested only for scene changes, camera damping, or playback; hidden viewers stop.

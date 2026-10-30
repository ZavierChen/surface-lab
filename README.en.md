# Surface Lab — Calculus III Demo

An offline interactive explorer for quadric surfaces, implicit level sets and planar cross-sections. Change coefficients and exponents, vary the constant Q, and inspect how the geometry changes.

## Run the demo

[Open the online demo](https://zavierchen.github.io/surface-lab/) or [download the offline package](https://github.com/ZavierChen/surface-lab/releases/latest/download/Surface-Lab-English-Demo.zip). The hosted version runs in the visitor’s browser; the author’s computer does not need to stay on.

Auto quality adjusts detail using a 50 ms draw-time budget (a target of 20 updates/s, not guaranteed display FPS). Slider edits redraw after about 160 ms of stable input. Select a fixed quality level to override adaptation.

```text
node scripts/prepare.js
node build/build.js
```

Open `outputs/surface-lab-en.html` in a WebGL-enabled browser. The generated HTML contains the plotting library and works without a server or internet connection. Node.js is needed to build the file, not to view it.

For the optional Windows application, follow the WebView2 SDK setup in the main README, then run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File build/compile-desktop.ps1 -Language en
```

Open `outputs/surface-lab-en.exe`. The desktop application requires Windows x64 and an installed Microsoft Edge WebView2 Runtime. The browser demo is the easiest file to share across operating systems.

## A three-minute classroom demonstration

1. **Level sets and topology.** Select **Explore Q** for `x² + z² − y² = Q`. Move Q from positive to zero to negative. Observe a one-sheet hyperboloid, a cone and a two-sheet hyperboloid. Use the ±0.01 buttons to inspect the transition and enable **Reference cone** to compare their asymptotic shape. Select **Transparent** if the reference is hidden behind the solid surface.
2. **Same signs versus opposite signs.** Compare **Elliptic paraboloid**, `y = 2x² + z²`, with **Saddle surface**, `y = x² − z²`. The signs of the squared terms determine the different curvatures; simply changing an exponent does not guarantee a saddle.
3. **Cross-sections.** Return to the elliptic paraboloid and set the cutting plane to `y = 2`. The trace is `2x² + z² = 2`, an ellipse with semiaxes 1 and √2. Move k to zero to see the single vertex, then below zero to see an empty intersection.
4. **Orientation.** Left-drag to grab and rotate in 3D, right-drag around the origin to turn the picture like a steering wheel, hold both mouse buttons and drag to pan (no Shift needed), and scroll to zoom. **X view**, **Y view** and **Z view** look toward the origin from the corresponding positive axis using orthographic projection. **Reset view** returns to the first octant (`x, y, z > 0`), looking toward the origin, with +z upright. It does not change the equation.

## Edit the displayed equation

Type signed decimal values into the three coefficient boxes beside x, y and z, and the Q box on the right. Use the six arrow buttons above and below the variables to set exponents from 0 to 4. Zero-degree terms count as constants, including at coordinate zero. All changes stay synchronized with the sidebar and preserve your camera.

In explicit mode, the left-side variable initially has coefficient 1 and exponent 1. Editing either switches to an equivalent implicit form before applying the change. Incomplete or out-of-range number entries leave the last valid equation in place; press Enter or leave the field to finish.

## Mathematical model

- Implicit mode displays `A x^px + B y^py + C z^pz = Q` as the zero set of F.
- Explicit mode solves for x, y or z using two independent variables.
- Classification checks the complete nonzero coefficient and exponent structure, including Q and degenerate cases.
- Standard quadrics use analytic surface parametrizations. Higher-degree surfaces use sampled isosurfaces; finite resolution can miss small features.
- A trace substitutes one fixed coordinate into the equation. Standard traces use analytic curves where available; general polynomial traces use numerical sampling.

Geometry is clipped to the displayed cube. Increase quality or reduce the plot range to inspect small sampled features. Transparent surfaces may show WebGL depth-order artifacts.

## Validation

After building both languages, run `node build/test-core.js` and `node build/test-camera-demo.js` and `node build/test-mouse-camera.js`, then `node build/test-grab-roll.js` and `node build/test-equation-editor.js`, plus `node build/test-performance.js`. The browser test requires Playwright and Microsoft Edge (or an `EDGE_PATH` override); `PLAYWRIGHT_PATH` may point to an existing Playwright module.

The tests cover mathematical classifications, preset geometry, first-octant camera reset after orbit/pan/zoom, preservation of the current camera while editing parameters, Q transitions, cross-sections and offline operation.

Grab/roll regression uses actual render matrices to verify that the near side of a hyperboloid follows the pointer, screen rotation stays centered on the origin after panning, and small movements near the origin do not cause a spin.

Mouse regression tests read the actual WebGL camera, exercise free left-button rotation, X/Y/Z orthographic views, chorded free pan and wheel zoom, and verify that sliders and window resizing preserve the rendered view even while a redraw is pending. Camera state is maintained separately from Plotly, and scene writes are serialized.

Third-party notices are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). No project license has been assigned.

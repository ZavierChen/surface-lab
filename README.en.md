# Surface Lab — Calculus III Demo

An offline interactive explorer for quadric surfaces, implicit level sets and planar cross-sections. Change coefficients and exponents, vary the constant Q, and inspect how the geometry changes.

## Run the demo

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
4. **Orientation.** Left-drag to rotate freely, hold both mouse buttons and drag to pan (no Shift needed), and scroll to zoom. **X view**, **Y view** and **Z view** look toward the origin from the corresponding positive axis using orthographic projection. **Reset view** returns to the first octant (`x, y, z > 0`), looking toward the origin, with +z upright. It does not change the equation.

## Mathematical model

- Implicit mode displays `A x^px + B y^py + C z^pz = Q` as the zero set of F.
- Explicit mode solves for x, y or z using two independent variables.
- Classification checks the complete nonzero coefficient and exponent structure, including Q and degenerate cases.
- Standard quadrics use analytic surface parametrizations. Higher-degree surfaces use sampled isosurfaces; finite resolution can miss small features.
- A trace substitutes one fixed coordinate into the equation. Standard traces use analytic curves where available; general polynomial traces use numerical sampling.

Geometry is clipped to the displayed cube. Increase quality or reduce the plot range to inspect small sampled features. Transparent surfaces may show WebGL depth-order artifacts.

## Validation

After building both languages, run `node build/test-core.js` and `node build/test-camera-demo.js` and `node build/test-mouse-camera.js`. The browser test requires Playwright and Microsoft Edge (or an `EDGE_PATH` override); `PLAYWRIGHT_PATH` may point to an existing Playwright module.

The tests cover mathematical classifications, preset geometry, first-octant camera reset after orbit/pan/zoom, preservation of the current camera while editing parameters, Q transitions, cross-sections and offline operation.

Mouse regression tests read the actual WebGL camera, exercise free left-button rotation, X/Y/Z orthographic views, chorded free pan and wheel zoom, and verify that sliders and window resizing preserve the rendered view even while a redraw is pending. Camera state is maintained separately from Plotly, and scene writes are serialized.

Third-party notices are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). No project license has been assigned.

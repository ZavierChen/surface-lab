# Surface Lab

[![简体中文](docs/assets/zh.svg)](README.md) [![English (current)](docs/assets/en-active.svg)](README.en.md)

**Change the equation. Explore the surface. Understand the connections.** Observe how changing Q or the coefficients transforms surfaces, rather than memorizing equations and shapes in isolation. View cross-section equations and 2D curves alongside the 3D surface to connect two-dimensional and three-dimensional geometry.

[Open the English demo](https://zavierchen.github.io/surface-lab/) · [Open the Chinese demo](https://zavierchen.github.io/surface-lab/zh.html) · [Download the offline demo](https://github.com/ZavierChen/surface-lab/releases/latest/download/Surface-Lab-English-Demo.zip) · [Releases](https://github.com/ZavierChen/surface-lab/releases)

## Quick start

Open either online link above without downloading a file. GitHub Pages hosts the site independently of the author’s computer; calculations run in the visitor’s browser. The online version needs a connection to load.

Download and extract the English demo, then open **`surface-lab-en.html`** in a modern browser with WebGL support. No Node.js installation, server or internet connection is needed to use it.

Windows users can also run **`Surface Lab Demo.exe`**, which requires Windows x64 and Microsoft Edge WebView2 Runtime. The included `START-HERE.txt` provides controls and a short classroom walkthrough.

> The download is in English. The source supports both Chinese and English builds, sharing the same mathematical and mouse interaction logic.

## What you can explore

| Feature | Description |
| --- | --- |
| Presets | Sphere, ellipsoid, one-sheet and two-sheet hyperboloids, elliptic cone, elliptic paraboloid, saddle and elliptic cylinder |
| Equation controls | Type x/y/z coefficients and Q directly in the equation; use six arrows to set exponents from 0 to 4 and explore geometry and classification |
| Cross-sections | Choose x = k, y = k or z = k and compare the 3D cutting plane with its 2D trace |
| Viewing options | Solid, transparent and contour styles, grid and reference cone, plus X/Y/Z orthographic views |
| Camera persistence | Keep the current orientation, pan and zoom while changing parameters, quality or window size |

Equation inputs and sidebar controls stay in sync. Zero-degree terms use the constant 1. Editing the solved variable’s coefficient or exponent switches an explicit equation to implicit mode.

## Edit the displayed equation

Type signed decimal values into the three coefficient boxes beside x, y and z, and the Q box on the right. Use the six arrow buttons above and below the variables to set exponents from 0 to 4. Zero-degree terms count as constants, including at coordinate zero. All changes stay synchronized with the sidebar and preserve your camera.

In explicit mode, the left-side variable initially has coefficient 1 and exponent 1. Editing either switches to an equivalent implicit form before applying the change. Incomplete or out-of-range number entries leave the last valid equation in place; press Enter or leave the field to finish.

## Performance and quality

Sliders show continuous coarse previews of the latest parameters. After about 220 ms of stable input, detail increases in stages. Preview sampling adapts to draw time, targeting at most 20 updates/s; actual speed depends on the computer. Manual quality sets the final detail. Contour lines return after input settles.

Solid and transparent analytic surfaces use indexed triangle meshes with reusable connectivity. Q updates reuse the reference cone; higher-degree surfaces reuse scalar samples and change only the isovalue. Contour mode retains the original isoline renderer and may be slower.

Unchanged views skip redraws. Changing 3D appearance does not redraw the 2D trace, and editing a hidden cutting plane does not redraw the 3D surface.

## Mouse and camera controls

| Input | Description |
| --- | --- |
| Left drag | Grab and rotate in 3D; the near side follows the pointer |
| Right drag | Turn the picture around the coordinate origin like a steering wheel |
| Both buttons | Pan the figure without holding Shift |
| Mouse wheel | Zoom in or out |
| Axis views | Look toward the origin from the positive axis using orthographic projection |
| Reset view | Restore the first-octant perspective without changing the equation |

## A three-minute classroom demonstration

1. **Level sets and topology.** Select **Explore Q** for `x² + z² − y² = Q`. Move Q from positive to zero to negative. Observe a one-sheet hyperboloid, a cone and a two-sheet hyperboloid. Use the ±0.01 buttons to inspect the transition and enable **Reference cone** to compare their asymptotic shape. Select **Transparent** if the reference is hidden behind the solid surface.
2. **Same signs versus opposite signs.** Compare **Elliptic paraboloid**, `y = 2x² + z²`, with **Saddle surface**, `y = x² − z²`. The signs of the squared terms determine the different curvatures; simply changing an exponent does not guarantee a saddle.
3. **Cross-sections.** Return to the elliptic paraboloid and set the cutting plane to `y = 2`. The trace is `2x² + z² = 2`, an ellipse with semiaxes 1 and √2. Move k to zero to see the single vertex, then below zero to see an empty intersection.
4. **Orientation.** Left-drag to grab and rotate in 3D, right-drag around the origin to turn the picture like a steering wheel, hold both mouse buttons and drag to pan (no Shift needed), and scroll to zoom. **X view**, **Y view** and **Z view** look toward the origin from the corresponding positive axis using orthographic projection. **Reset view** returns to the first octant (`x, y, z > 0`), looking toward the origin, with +z upright. It does not change the equation.

## Mathematical model and limits

Implicit mode uses $A x^{p_x} + B y^{p_y} + C z^{p_z} = Q$; explicit mode solves for x, y or z. Classification considers nonzero coefficients, exponents, Q and degenerate cases. Standard quadrics use analytic parametrizations; higher-degree surfaces use numerical sampling. A trace fixes one coordinate at k.

Geometry is clipped to the selected range. Finite sampling can miss small features; reduce the range or increase quality for a closer inspection. Transparent surfaces may show WebGL depth-order artifacts.

## Development and validation

<details>
<summary><strong>Build from source</strong></summary>

### Browser builds

Building requires Node.js. Plotly gl3d is included in the repository; the generated single-file HTML works offline.

```powershell
node scripts/prepare.js
node build/build-zh.js
node build/build.js
```

| Output | Description |
| --- | --- |
| `outputs/surface-lab.html` | Chinese version |
| `outputs/三维曲面实验室.html` | Identical Chinese copy |
| `outputs/surface-lab-en.html` | English demo |

### Hosted build

Run `node scripts/build-site.js` after both HTML builds to create `outputs/site/` with language links. Updates to main trigger GitHub Actions to build and deploy to GitHub Pages. Offline HTML and EXE files remain available separately.

### Windows desktop builds

Requires Windows x64, the .NET Framework 4.x compiler and WebView2 Runtime. Extract the Microsoft.Web.WebView2 **1.0.3485.44** NuGet package into `build/webview2-sdk/`, including `lib/`, `runtimes/`, `LICENSE.txt` and `NOTICE.txt`. After building the HTML files above, run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File build/compile-desktop.ps1 -Language zh
powershell -NoProfile -ExecutionPolicy Bypass -File build/compile-desktop.ps1 -Language en
```

Produces `outputs/surface-lab.exe` and `outputs/surface-lab-en.exe`. HTML and SDK components are embedded in the EXE; the target computer still needs WebView2 Runtime. Each language uses a separate user data directory.

</details>

<details>
<summary><strong>Project structure and tests</strong></summary>

| Path | Contents |
| --- | --- |
| `src/math/` | Equation models, classification, traces and meshes |
| `src/ui/` | Controls, camera, rendering and events |
| `src/i18n/`, `src/templates/` | Chinese text mappings and interface templates |
| `src/desktop/` | Windows WebView2 shell |
| `scripts/` | Browser and desktop build scripts |
| `tests/`, `vendor/` | Regression tests and bundled plotting library |

Edit the source under `src/` and rebuild. Generated `build/` and `outputs/` directories are excluded from version control.

```powershell
node scripts/prepare.js
node build/test-core.js
node build/test-mesh.js
node build/build-zh.js
node build/build.js
node build/test-zh.js
node build/test-controls.js
node build/test-camera-demo.js
node build/test-mouse-camera.js
node build/test-grab-roll.js
node build/test-equation-editor.js
node build/test-performance.js
```

Browser tests require Playwright and Microsoft Edge. Set `PLAYWRIGHT_PATH` to use an existing Playwright module, or `EDGE_PATH` to override the browser executable. Screenshots are saved in `build/`.

Tests cover mathematical classifications, all eight presets, Q transitions, traces, offline operation and responsive layouts. Camera tests inspect the actual WebGL camera and render matrices to verify drag direction, origin-centered screen rotation, two-button panning, zoom and camera persistence through redraws and resizing.

</details>

Use `node tests/benchmark-interactions.js before.html after.html` to compare parameter updates in the same browser at the same quality.

## Licensing and third-party components

No license has been assigned to the project's own code. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for third-party components and their licenses.

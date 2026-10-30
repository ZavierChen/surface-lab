# 三维曲面实验室 · Surface Lab

**改方程，看曲面，理解截线。** 这是一个用于多元微积分学习与课堂演示的离线交互工具：把代数方程、三维曲面和平面截线放在同一界面中，观察参数变化如何影响几何形状。

**Change the equation. Explore the surface. Understand its cross-sections.** An offline tool for multivariable calculus and classroom demonstrations, connecting algebraic equations, 3D surfaces and planar traces in one interface.

[在线英文版 · Open English Demo](https://zavierchen.github.io/surface-lab/) · [在线中文版 · 中文](https://zavierchen.github.io/surface-lab/zh.html)

[下载英文演示包 · Download English Demo](https://github.com/ZavierChen/surface-lab/releases/latest/download/Surface-Lab-English-Demo.zip) · [版本与附件 · Releases](https://github.com/ZavierChen/surface-lab/releases) · [英文课堂演示指南 · Teaching Guide](README.en.md)

## 快速开始 · Quick start

直接打开上方在线链接即可使用，无需下载。网站由 GitHub Pages 托管，不依赖作者电脑开机，也无需自行租服务器；计算在访问者的浏览器中进行。首次打开在线版需要联网。

Open either online link above without downloading a file. GitHub Pages hosts the site independently of the author’s computer; calculations run in the visitor’s browser. The online version needs a connection to load.

下载英文演示包并解压，打开 **`surface-lab-en.html`** 即可使用。需要支持 WebGL 的现代浏览器；使用时无需安装 Node.js、启动服务器或联网。

Download and extract the English demo, then open **`surface-lab-en.html`** in a modern browser with WebGL support. No Node.js installation, server or internet connection is needed to use it.

Windows 用户也可以打开包内的 **`Surface Lab Demo.exe`**，需要 Windows x64 和 Microsoft Edge WebView2 Runtime。包内的 `START-HERE.txt` 提供快速操作说明和课堂演示步骤。

Windows users can also run **`Surface Lab Demo.exe`**, which requires Windows x64 and Microsoft Edge WebView2 Runtime. The included `START-HERE.txt` provides controls and a short classroom walkthrough.

> 当前下载包为英文版。源代码同时提供中文和英文构建，两者共用同一套数学与鼠标操作逻辑。
>
> The download is in English. The source supports both Chinese and English builds, sharing the same mathematical and mouse interaction logic.

## 可以探索什么 · What you can explore

| 功能 · Feature | 中文 | English |
| --- | --- | --- |
| 曲面预设 · Presets | 球面、椭球面、单叶与双叶双曲面、椭圆锥面、椭圆抛物面、马鞍面、椭圆柱面 | Sphere, ellipsoid, one-sheet and two-sheet hyperboloids, elliptic cone, elliptic paraboloid, saddle and elliptic cylinder |
| 调整方程 · Equation controls | 在顶部等式直接输入 x、y、z 的系数与 Q；用六个箭头调整 0～4 次，观察形状和分类变化 | Type x/y/z coefficients and Q directly in the equation; use six arrows to set exponents from 0 to 4 and explore geometry and classification |
| 平面截线 · Cross-sections | 选择 x = k、y = k 或 z = k，同时观察三维切平面和二维交线 | Choose x = k, y = k or z = k and compare the 3D cutting plane with its 2D trace |
| 观察方式 · Viewing options | 实体、半透明、轮廓、网格与参考锥面；支持 X、Y、Z 正视图 | Solid, transparent and contour styles, grid and reference cone, plus X/Y/Z orthographic views |
| 保持视角 · Camera persistence | 调整滑条、画质或窗口大小时，保留当前观察方向、平移和缩放 | Keep the current orientation, pan and zoom while changing parameters, quality or window size |

顶部输入与左侧控件双向同步。0 次项按常数 1 计算；修改显式方程左侧变量的系数或次数时，会切换为隐式方程。

Equation inputs and sidebar controls stay in sync. Zero-degree terms use the constant 1. Editing the solved variable’s coefficient or exponent switches an explicit equation to implicit mode.

## 性能与画质 · Performance and quality

拖动滑条时先更新数值，停止输入约 160 毫秒后再绘制最后的状态。自动画质默认开启，按绘制耗时在流畅、标准、精细之间调整：预算为每次 50 毫秒，约相当于每秒 20 次更新；这是调整目标，不是保证的实际显示帧率。一次过慢即降低一级，连续六次较快才恢复一级，避免频繁跳变。仍可手动固定画质。

Slider values update immediately; the plot redraws the latest state after about 160 ms without new input. Auto quality is enabled by default and adjusts detail using a 50 ms draw-time budget, equivalent to a target of 20 updates per second rather than a guaranteed display frame rate. A slow update lowers detail; six fast updates restore one level. Manual quality overrides remain available.

实体和半透明的解析曲面直接使用带索引的三角网格，复用连接关系；Q 变化时参考锥面保持缓存。高次曲面的 Q 作为等值面阈值，复用采样值。突出轮廓模式保留原等高线绘法，可能较慢。

Solid and transparent analytic surfaces use indexed triangle meshes with reusable connectivity. Q updates reuse the reference cone; higher-degree surfaces reuse scalar samples and change only the isovalue. Contour mode retains the original isoline renderer and may be slower.

无变化时不重绘；切换三维外观不会重画二维截线，隐藏切平面后调整截线也不会重画三维曲面。

Unchanged views skip redraws. Changing 3D appearance does not redraw the 2D trace, and editing a hidden cutting plane does not redraw the 3D surface.

## 鼠标与视角 · Mouse and camera controls

| 操作 · Input | 中文 | English |
| --- | --- | --- |
| 左键拖动 · Left drag | 抓取图形做三维旋转，靠近你的一面跟随鼠标移动 | Grab and rotate in 3D; the near side follows the pointer |
| 右键拖动 · Right drag | 像转方向盘一样，绕坐标原点顺时针或逆时针转动画面 | Turn the picture around the coordinate origin like a steering wheel |
| 左右键一起拖动 · Both buttons | 平移整个图形，无需 Shift | Pan the figure without holding Shift |
| 滚轮 · Mouse wheel | 放大或缩小 | Zoom in or out |
| X / Y / Z 正视 · Axis views | 从对应坐标轴正方向看向原点，采用正交投影 | Look toward the origin from the positive axis using orthographic projection |
| 恢复视角 · Reset view | 返回第一卦限透视图，不改变方程 | Restore the first-octant perspective without changing the equation |

## 一个课堂实验 · A classroom experiment

选择 **“重点实验：Q 变化与双曲面” / “Explore Q”**，观察方程：

Select **Explore Q** and investigate:

$$x^2 + z^2 - y^2 = Q$$

| Q | 曲面 · Surface |
| --- | --- |
| Q > 0 | 单叶双曲面 · Hyperboloid of one sheet |
| Q = 0 | 椭圆锥面 · Elliptic cone |
| Q < 0 | 双叶双曲面 · Hyperboloid of two sheets |

用 ±0.01 按钮观察接近零时的变化，再打开参考锥面、移动切平面，比较腰部、顶点间隙和截线。更完整的讲解步骤见[英文课堂演示指南](README.en.md)。

Use the ±0.01 buttons to inspect the transition near zero. Enable the reference cone and move the cutting plane to compare the waist, vertex gap and traces. See the [English teaching guide](README.en.md) for a longer walkthrough.

## 数学模型与边界 · Mathematical model and limits

隐式模式使用 $A x^{p_x} + B y^{p_y} + C z^{p_z} = Q$；显式模式将 x、y 或 z 单独放在左边。分类综合考虑非零系数、指数、Q 和退化情形。标准二次曲面使用解析参数化，更高次曲面使用数值采样；截线通过将一个坐标固定为 k 得到。

Implicit mode uses $A x^{p_x} + B y^{p_y} + C z^{p_z} = Q$; explicit mode solves for x, y or z. Classification considers nonzero coefficients, exponents, Q and degenerate cases. Standard quadrics use analytic parametrizations; higher-degree surfaces use numerical sampling. A trace fixes one coordinate at k.

图形仅显示指定范围内的部分。有限采样可能遗漏细小结构，可缩小显示范围或提高画质来检查。半透明曲面可能出现 WebGL 前后遮挡顺序误差。

Geometry is clipped to the selected range. Finite sampling can miss small features; reduce the range or increase quality for a closer inspection. Transparent surfaces may show WebGL depth-order artifacts.

## 开发与验证 · Development and validation

<details>
<summary><strong>从源码构建 · Build from source</strong></summary>

### 网页版本 · Browser builds

构建需要 Node.js；仓库已包含 Plotly gl3d。生成的单文件 HTML 可离线运行。

Building requires Node.js. Plotly gl3d is included in the repository; the generated single-file HTML works offline.

```powershell
node scripts/prepare.js
node build/build-zh.js
node build/build.js
```

| 输出 · Output | 说明 · Description |
| --- | --- |
| `outputs/surface-lab.html` | 中文版 · Chinese version |
| `outputs/三维曲面实验室.html` | 中文版的同内容副本 · Identical Chinese copy |
| `outputs/surface-lab-en.html` | 英文演示版 · English demo |

### 在线版 · Hosted build

运行 `node scripts/build-site.js` 将已构建的中英文 HTML 写入 `outputs/site/`，附带语言切换链接。主分支更新后，GitHub Actions 自动构建并发布到 GitHub Pages。离线 HTML 和 EXE 保持独立。

Run `node scripts/build-site.js` after both HTML builds to create `outputs/site/` with language links. Updates to main trigger GitHub Actions to build and deploy to GitHub Pages. Offline HTML and EXE files remain available separately.

### Windows 桌面版 · Windows desktop builds

需要 Windows x64、.NET Framework 4.x 编译器和 WebView2 Runtime。将 Microsoft.Web.WebView2 **1.0.3485.44** NuGet 包解压到 `build/webview2-sdk/`，确保包含 `lib/`、`runtimes/`、`LICENSE.txt` 和 `NOTICE.txt`。完成上述网页构建后运行：

Requires Windows x64, the .NET Framework 4.x compiler and WebView2 Runtime. Extract the Microsoft.Web.WebView2 **1.0.3485.44** NuGet package into `build/webview2-sdk/`, including `lib/`, `runtimes/`, `LICENSE.txt` and `NOTICE.txt`. After building the HTML files above, run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File build/compile-desktop.ps1 -Language zh
powershell -NoProfile -ExecutionPolicy Bypass -File build/compile-desktop.ps1 -Language en
```

分别生成 `outputs/surface-lab.exe` 和 `outputs/surface-lab-en.exe`。网页与 SDK 组件内嵌于 EXE；运行电脑仍需安装 WebView2 Runtime。两个语言版本使用独立的用户数据目录。

Produces `outputs/surface-lab.exe` and `outputs/surface-lab-en.exe`. HTML and SDK components are embedded in the EXE; the target computer still needs WebView2 Runtime. Each language uses a separate user data directory.

</details>

<details>
<summary><strong>项目结构与测试 · Project structure and tests</strong></summary>

| 路径 · Path | 内容 · Contents |
| --- | --- |
| `src/math/` | 方程模型、分类、截线与网格 · Equation models, classification, traces and meshes |
| `src/ui/` | 控件、相机、渲染与事件 · Controls, camera, rendering and events |
| `src/i18n/`, `src/templates/` | 中文映射与界面模板 · Chinese text mappings and interface templates |
| `src/desktop/` | Windows WebView2 外壳 · Windows WebView2 shell |
| `scripts/` | 网页与桌面版构建脚本 · Browser and desktop build scripts |
| `tests/`, `vendor/` | 回归测试与第三方绘图库 · Regression tests and bundled plotting library |

请修改 `src/` 下的源文件后重新构建。`build/` 和 `outputs/` 为生成目录，不纳入版本控制。

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

浏览器测试需要 Playwright 和 Microsoft Edge。可用 `PLAYWRIGHT_PATH` 指定 Playwright 模块路径，用 `EDGE_PATH` 指定浏览器路径。截图保存在 `build/`。

Browser tests require Playwright and Microsoft Edge. Set `PLAYWRIGHT_PATH` to use an existing Playwright module, or `EDGE_PATH` to override the browser executable. Screenshots are saved in `build/`.

测试覆盖数学分类、八个预设、Q 跨零变化、截线、离线运行及响应式布局。相机测试读取实际 WebGL 相机和渲染矩阵，检查抓取方向、绕原点的画面旋转、双键平移、缩放，以及重绘和窗口调整后的视角保持。

Tests cover mathematical classifications, all eight presets, Q transitions, traces, offline operation and responsive layouts. Camera tests inspect the actual WebGL camera and render matrices to verify drag direction, origin-centered screen rotation, two-button panning, zoom and camera persistence through redraws and resizing.

</details>

性能对比可运行 `node tests/benchmark-interactions.js before.html after.html`，在同一浏览器、相同画质下比较多个参数更新路径。

Use `node tests/benchmark-interactions.js before.html after.html` to compare parameter updates in the same browser at the same quality.

## 许可与第三方组件 · Licensing and third-party components

项目自身代码尚未指定许可证。第三方组件及其许可证见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

No license has been assigned to the project's own code. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for third-party components and their licenses.

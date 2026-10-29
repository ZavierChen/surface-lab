# 三维曲面实验室 / 3D Surface Lab

一个离线交互式工具，用来观察代数曲面的方程、形状与平面截线。可调整系数、指数、常数 Q 和显示范围，旋转三维图形，并选择 x、y 或 z 方向的截面。内置球面、椭球面、单叶和双叶双曲面、椭圆锥面、椭圆抛物面、马鞍面及椭圆柱面预设。界面会显示分类和解释；更高次的曲面采用数值采样，结果受显示范围和画质影响。

## 运行网页版本

需要 Node.js 和支持 WebGL 的现代浏览器。项目自带 Plotly 的 gl3d 构建，生成后的网页可以离线使用：

```powershell
node scripts/prepare.js
node build/build-zh.js
```

打开 `outputs/surface-lab.html`。中文版构建也会生成 `outputs/三维曲面实验室.html`。如果需要英文界面，运行 `node build/build.js`；它会覆盖 `outputs/surface-lab.html`。输出目录和临时构建目录不纳入版本控制。

## 构建 Windows 桌面版

需要 64 位 Windows、.NET Framework 4.x 编译器和 Microsoft WebView2 Runtime。先完成中文版网页构建，然后取得 Microsoft.Web.WebView2 **1.0.3485.44** NuGet 包，将其解压到 `build/webview2-sdk/`，使其中包含 `lib/`、`runtimes/`、`LICENSE.txt` 和 `NOTICE.txt`。接着运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File build/compile-desktop.ps1
```

生成 `outputs/surface-lab.exe`。程序将网页及所需 WebView2 SDK 组件嵌入 EXE；目标电脑仍需安装 WebView2 Runtime。

## 结构

- `src/math/`：方程模型、曲面分类、二维截线和三维网格。
- `src/ui/`：控件与状态、绘制、事件处理。
- `src/i18n/` 与 `src/templates/`：中文映射和页面模板。
- `src/desktop/`：Windows WebView2 外壳与资源。
- `scripts/`：组合模块、生成离线网页和编译桌面版。
- `tests/`：数学与浏览器回归；`vendor/`：第三方绘图库。

源模块按固定顺序组合为经典脚本，以保留无需服务器的单 HTML 文件运行方式。请修改 `src/` 下的源文件，再重新执行构建；不要直接修改 `build/` 或 `outputs/` 中的生成文件。

## 测试

```powershell
node scripts/prepare.js
node build/test-core.js
node build/build-zh.js
node build/test-zh.js
node build/build.js
node build/test-controls.js
node build/build-zh.js  # 恢复中文版网页
```

浏览器测试需要安装 Playwright 和 Microsoft Edge。测试默认从 Node 的模块搜索路径加载 `playwright`；也可以把 `PLAYWRIGHT_PATH` 设为已安装模块的绝对路径。默认使用 Windows 的 Edge 安装路径，可通过 `EDGE_PATH` 覆盖。浏览器测试会在 `build/` 写入截图。

## 许可

项目自身代码尚未指定许可证。第三方组件及许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

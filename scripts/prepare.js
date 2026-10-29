// Assemble ordered source modules in an isolated build directory. The generated
// scripts remain classic scripts so the offline, single-file build still works.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const build = path.join(root, 'build');
fs.mkdirSync(build, { recursive: true });
fs.mkdirSync(path.join(root, 'outputs'), { recursive: true });
function copy(from, to = path.basename(from)) {
  fs.copyFileSync(path.join(root, from), path.join(build, to));
}
function join(files, to) {
  fs.writeFileSync(path.join(build, to), files.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n'));
}
join(['src/math/model.js', 'src/math/classification.js', 'src/math/traces.js', 'src/math/surfaces.js'], 'math-core.js');
join(['src/ui/controls.js', 'src/ui/rendering.js', 'src/ui/events.js'], 'app.js');
for (const file of ['shell.html', 'shell-zh.html']) copy('src/templates/' + file);
copy('src/i18n/zh.js');
for (const file of ['desktop.cs', 'app.ico', 'app.manifest']) copy('src/desktop/' + file);
copy('vendor/plotly-gl3d.min.js');
copy('scripts/build-en.js', 'build.js');
copy('scripts/build-zh.js');
copy('scripts/compile-desktop.ps1');
for (const file of ['test-core.js', 'test-browser.js', 'test-controls.js', 'test-zh.js']) copy('tests/' + file);
console.log('Prepared build/ from source modules.');

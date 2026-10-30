const fs=require('fs');const path=require('path');
const dir=__dirname;let html=fs.readFileSync(path.join(dir,'shell.html'),'utf8');
let app=fs.readFileSync(path.join(dir,'app.js'),'utf8').replace("displayModeBar:'hover'",'displayModeBar:false');
const formulas=['x² + y² + z² = 1','x²/9 + y²/25 + z²/4 = 1','x² + z² − y² = 1','y² − x² − z² = 1','y² = x² + 2z²','y = 2x² + z²','y = x² − z²','x² + 2z² = 1'];
app=app.replace('b.textContent=p.name;',`b.innerHTML='<strong>'+p.name.replace('Hyperbolic paraboloid / saddle','Saddle surface')+'</strong><span>'+${JSON.stringify(formulas)}[i]+'</span>';`);
app+=`\nlet resizeTimer;new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if($('plot3d')._fullLayout)Plotly.Plots.resize('plot3d');if($('plot2d')._fullLayout)Plotly.Plots.resize('plot2d');},100);}).observe(document.querySelector('.plotwrap'));\n`;
for(let [tag,source] of [['PLOTLY_BUNDLE',fs.readFileSync(path.join(dir,'plotly-gl3d.min.js'),'utf8')],['MATH_CORE',fs.readFileSync(path.join(dir,'math-core.js'),'utf8')],['APP_CODE',app]])html=html.replace('<!-- '+tag+' -->',()=>'<script>\n'+source.replace(/<\/script/gi,'<\\/script')+'\n</script>');
// Keep language builds side by side: the English demo never overwrites the Chinese app.
const dest=path.join(dir,'../outputs/surface-lab-en.html');fs.writeFileSync(dest,html);console.log(dest,fs.statSync(dest).size+' bytes');

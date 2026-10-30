const fs=require('fs'),path=require('path');const dir=__dirname;
let app=fs.readFileSync(path.join(dir,'app.js'),'utf8');
const replacements=[
['displayModeBar:\'hover\'','displayModeBar:false'],
['Exact coefficient ${\'ABC\'[i]}','系数 ${\'ABC\'[i]} 的精确数值'],['Coefficient ${\'ABC\'[i]}','系数 ${\'ABC\'[i]}'],['Exponent of ${AX[i]}','${AX[i]} 的指数'],
['b.textContent=p.name;','b.innerHTML=\'<strong>\'+zh(p.name).replace(\'（马鞍面）\',\'\')+\'</strong><span>\'+PRESET_FORMULAS[i]+\'</span>\';'],
["'ABC'[i]+' · '+AX[explicit?axes[i]??i:i]","'ABC'[i]+' · '+AX[explicit?axes[i]??i:i]+' 项系数'"],
['; the solved exponent is unused.','；左侧变量的指数无需设置。'],
["$('typeBadge').textContent=cl.name;$('className').textContent=cl.name;$('reason').textContent=cl.why;$('axis').textContent=cl.axis;$('opening').textContent=cl.opening;","$('typeBadge').textContent=zh(cl.name);$('className').textContent=zh(cl.name);$('reason').textContent=zh(cl.why);$('axis').textContent=zh(cl.axis);$('opening').textContent=zh(cl.opening);"],
["classify({...c,q}).name.replace('Hyperboloid of ','')","zh(classify({...c,q}).name)"],['Q = 0 · cone','Q = 0 · 锥面'],
['At Q = 0 the two nappes meet at the origin.','Q = 0 时，两部分在原点相接，成为锥面。'],
['At ${cl.axis} = 0, the waist semiaxes are ${pair.map(i=>fmt(Math.sqrt(c.q/c.a[i]))).join(\' and \')}. They shrink to zero as Q approaches 0.','在 ${cl.axis} = 0 处，腰部的两个半轴为 ${pair.map(i=>fmt(Math.sqrt(c.q/c.a[i]))).join(\' 和 \')}。Q 趋近 0 时，腰部逐渐收细。'],
['The vertices are at ${cl.axis} = ±${fmt(Math.sqrt(c.q/c.a[axis]))}. The gap closes as Q approaches 0.','两个顶点位于 ${cl.axis} = ±${fmt(Math.sqrt(c.q/c.a[axis]))}。Q 趋近 0 时，两片之间的间隙逐渐缩小。'],
['<span>Negative shift</span><span>Q translates along the solved axis</span><span>Positive shift</span>','<span>向负方向平移</span><span>Q 控制平移</span><span>向正方向平移</span>'],
['<span>Negative Q</span><span>Q selects the level set F = 0</span><span>Positive Q</span>','<span>Q 为负</span><span>改变 Q，观察形状</span><span>Q 为正</span>'],
['Q moves the surface along ${AX[state.solved]}; it does not change its type.','Q 使曲面沿 ${AX[state.solved]} 轴平移，不改变曲面类型。'],
["'Updating…'","'正在更新…'"],["name:'Origin',hovertemplate:'Origin (0, 0, 0)","name:'原点',hovertemplate:'原点 (0, 0, 0)"],
["'No real solutions':'Every point satisfies this equation'","'没有实数解':'空间中每个点都满足方程'"],
["'Entire plane':'No trace in this window'","'整个切平面':'当前范围内没有截线'"],
["$('traceNote').textContent=t.note+(!state.trace?' (3D cutting plane hidden.)':'');","$('traceNote').textContent=zh(t.note)+(!state.trace?'（三维切平面已隐藏）':'');"],
["'Analytic geometry':'Sampled F = 0'","'解析曲面':'网格近似'"],
["'Unable to render: '+e.message+' Try a lower quality or a WebGL-enabled browser.'","'绘图失败：'+e.message+'。请尝试降低画质，或使用支持 WebGL 的浏览器。'"],
["'Rendering error'","'绘图出错'"],
['Choose and display a Surface Lab preset.','选择并显示预设曲面。'],["throw Error('Invalid preset')","throw Error('无效的预设编号')"]
];
for(let [a,b] of replacements){if(!app.includes(a))throw Error('Missing replacement: '+a);app=app.replaceAll(a,b);}
// Resize the plots with their panels, including a resized native desktop window.
app+=`\nlet resizeTimer;new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if($('plot3d')._fullLayout)cameraController.resize();if($('plot2d')._fullLayout)Plotly.Plots.resize('plot2d');},100);}).observe(document.querySelector('.plotwrap'));\n`;
fs.writeFileSync(path.join(dir,'app-zh.js'),app);
let html=fs.readFileSync(path.join(dir,'shell-zh.html'),'utf8');for(let [tag,file] of [['PLOTLY_BUNDLE','plotly-gl3d.min.js'],['MATH_CORE','math-core.js'],['ZH_CODE','zh.js'],['APP_CODE','app-zh.js']])html=html.replace('<!-- '+tag+' -->',()=>'<script>\n'+fs.readFileSync(path.join(dir,file),'utf8').replace(/<\/script/gi,'<\\/script')+'\n</script>');
for(let name of ['surface-lab.html','三维曲面实验室.html'])fs.writeFileSync(path.join(dir,'../outputs',name),html);
console.log('中文版已生成：'+Buffer.byteLength(html)+' bytes');

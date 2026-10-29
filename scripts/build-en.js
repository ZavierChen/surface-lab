const fs=require('fs');const path=require('path');
const dir=__dirname;let html=fs.readFileSync(path.join(dir,'shell.html'),'utf8');
for(let [tag,file] of [['PLOTLY_BUNDLE','plotly-gl3d.min.js'],['MATH_CORE','math-core.js'],['APP_CODE','app.js']])html=html.replace('<!-- '+tag+' -->',()=>'<script>\n'+fs.readFileSync(path.join(dir,file),'utf8').replace(/<\/script/gi,'<\\/script')+'\n</script>');
const dest=path.join(dir,'../outputs/surface-lab.html');fs.writeFileSync(dest,html);console.log(dest,fs.statSync(dest).size+' bytes');

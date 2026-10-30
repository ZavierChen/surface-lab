const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'outputs','site');
fs.mkdirSync(out,{recursive:true});
for(const [source,target,href,label] of [
 ['surface-lab-en.html','index.html','zh.html','中文'],
 ['surface-lab.html','zh.html','index.html','English']
]){
 let html=fs.readFileSync(path.join(root,'outputs',source),'utf8');
 if(!/<span class="offline">[^<]*<\/span>/.test(html))throw Error('Missing language badge');
 html=html.replace(/<span class="offline">[^<]*<\/span>/,`<a class="offline" href="${href}" style="text-decoration:none">${label}</a>`);
 fs.writeFileSync(path.join(out,target),html);
}
fs.writeFileSync(path.join(out,'.nojekyll'),'');
console.log('Static site ready: outputs/site/index.html (English), zh.html (Chinese).');

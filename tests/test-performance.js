const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const browser=await chromium.launch({executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--enable-unsafe-swiftshader']});
try{for(const lang of ['zh','en']){
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.resolve(__dirname,'../outputs',lang==='zh'?'surface-lab.html':'surface-lab-en.html')).href);await page.waitForFunction(()=>window.__lastResult);
 assert.equal(await page.locator('#quality').inputValue(),'auto');
 const levels=await page.evaluate(()=>{const a=createAdaptiveQuality();const out=[a.level,a.observe(100),a.observe(100)];for(let i=0;i<6;i++)a.observe(10);out.push(a.level);for(let i=0;i<6;i++)a.observe(10);out.push(a.level,a.observe(70));return out;});assert.deepEqual(levels,[1,0,0,1,2,1]);
 await page.locator('#quality').selectOption('1');await page.evaluate(()=>Lab.flush());await page.waitForTimeout(250);
 await page.evaluate(()=>{window.drawCounts={three:0,two:0};const react=Plotly.react;Plotly.react=function(g,...args){drawCounts[(typeof g==='string'?g:g.id)==='plot3d'?'three':'two']++;return react.call(this,g,...args);};});
 await page.evaluate(()=>Lab.flush());assert.deepEqual(await page.evaluate(()=>drawCounts),{three:0,two:0});
 // Live preview must paint repeatedly BEFORE the stream ends, for every slider.
 await page.evaluate(()=>{window.meshCalls=[];const generate=surfaceTraces;surfaceTraces=function(c,D,q,...args){meshCalls.push({q:c.q,quality:q,a:c.a.slice()});return generate(c,D,q,...args);};});
 for(const id of ['qslider','a0','a1','a2','kslider']){
  const during=await page.evaluate(async id=>{drawCounts.three=drawCounts.two=0;meshCalls.length=0;for(let i=0;i<24;i++){const el=document.getElementById(id);el.value=String(.5+i*.02);el.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,25));}return {...drawCounts,qualities:meshCalls.map(c=>c.quality)};},id);
  assert(during.three>=2,`${id}: no continuous preview`);assert(during.two>=2);assert(during.qualities.every(q=>q<0),`${id}: full mesh during input`);
  await page.waitForFunction(()=>!busy&&!pending&&timer===null);
  assert.equal(await page.evaluate(()=>__lastResult.quality),1);assert.equal(await page.evaluate(()=>__lastResult.preview),false);
 }
 // Fixed high detail is reached progressively after a coarse preview.
 await page.locator('#quality').selectOption('2');await page.evaluate(()=>Lab.flush());
 await page.evaluate(()=>{meshCalls.length=0;const el=$('qslider');el.value='1.23';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(()=>!busy&&!pending&&timer===null);
 const stages=await page.evaluate(()=>meshCalls.map(c=>c.quality));assert(stages[0]<0);assert.deepEqual(stages.filter(q=>q>=0),[0,1,2]);assert.equal(await page.locator('#eq-q').inputValue(),'1.23');
 // A deliberately blocked draw cannot build a backlog of old parameter values.
 await page.locator('#quality').selectOption('1');await page.evaluate(()=>Lab.flush());
 await page.evaluate(()=>{meshCalls.length=0;window.renderGate=new Promise(r=>window.releaseRender=r);window.gateEntered=false;const react=Plotly.react;window.restoreReact=()=>{Plotly.react=react;};Plotly.react=async function(g,...args){const result=await react.call(this,g,...args);if((typeof g==='string'?g:g.id)==='plot3d'&&!gateEntered){gateEntered=true;await renderGate;}return result;};const el=$('qslider');el.value='-1';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(()=>gateEntered);
 await page.evaluate(()=>{for(let i=0;i<100;i++){const el=$('qslider');el.value=String(2+i*.01);el.dispatchEvent(new Event('input',{bubbles:true}));}});
 assert.equal(await page.evaluate(()=>meshCalls.length),1,'In-flight draw overlapped');
 await page.evaluate(()=>releaseRender());await page.waitForFunction(()=>!busy&&!pending&&timer===null);
 const values=await page.evaluate(()=>meshCalls.map(c=>c.q));assert.equal(values[0],-1);assert(values.slice(1).every(q=>q===2.99),'Obsolete inputs were replayed');assert.equal(await page.evaluate(()=>__lastResult.equation.q),2.99);await page.evaluate(()=>restoreReact());
 // Coarse contour previews return to the requested isolines after refinement.
 await page.locator('#style').selectOption('contour');await page.evaluate(()=>Lab.flush());
 await page.evaluate(()=>{const el=$('qslider');el.value='1.5';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(()=>__lastResult.preview&&__lastResult.equation.q===1.5);
 assert.equal(await page.evaluate(()=>geometry[0].type),'mesh3d');
 await page.waitForFunction(()=>!busy&&!pending&&timer===null);assert.equal(await page.evaluate(()=>geometry[0].type),'surface');
 await page.evaluate(()=>{drawCounts.three=drawCounts.two=0;});await page.locator('#style').selectOption('transparent');await page.evaluate(()=>Lab.flush());assert.deepEqual(await page.evaluate(()=>drawCounts),{three:1,two:0});
 await page.locator('#showTrace').uncheck();await page.evaluate(()=>Lab.flush());await page.evaluate(()=>{drawCounts.three=drawCounts.two=0;Lab.set({k:1});});await page.evaluate(()=>Lab.flush());assert.deepEqual(await page.evaluate(()=>drawCounts),{three:0,two:1});
 // Fixed high quality is never reduced; auto updates use the bounded policy.
 await page.locator('#quality').selectOption('2');await page.evaluate(()=>Lab.flush());assert.equal(await page.evaluate(()=>__lastResult.quality),2);assert.equal(await page.evaluate(()=>Lab.state.autoQuality),false);
 await page.evaluate(()=>{adaptiveQuality.observe(100);});await page.locator('#quality').selectOption('auto');await page.evaluate(()=>Lab.flush());assert.equal(await page.evaluate(()=>__lastResult.quality),0);
 const previewLevels=await page.evaluate(()=>{previewQuality.observe(100);const slow=previewQuality.level;for(let i=0;i<6;i++)previewQuality.observe(10);return [slow,previewQuality.level];});assert.deepEqual(previewLevels,[-2,-1]);
 assert.equal(await page.locator('#error').innerText(),'');assert.deepEqual(errors,[]);await page.close();console.log(`${lang}: all five sliders paint during input, progressive refinement, blocked draw coalesces 100 inputs, skipped redundant redraws, independent 2D updates and quality controls passed.`);
}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});

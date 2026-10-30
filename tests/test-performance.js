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
 // Continuous input keeps controls live and starts no costly surface draw.
 const during=await page.evaluate(async()=>{for(let i=0;i<12;i++){const el=document.getElementById('qslider');el.value=String(.5+i*.05);el.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,25));}return {...drawCounts,q:Lab.state.q};});assert.equal(during.three,0);assert.equal(during.two,0);assert.equal(during.q,1.05);
 await page.waitForFunction(()=>!busy&&!pending&&timer===null);assert.deepEqual(await page.evaluate(()=>drawCounts),{three:1,two:1});assert.equal(await page.locator('#eq-q').inputValue(),'1.05');
 await page.evaluate(()=>{drawCounts.three=drawCounts.two=0;});await page.locator('#style').selectOption('transparent');await page.evaluate(()=>Lab.flush());assert.deepEqual(await page.evaluate(()=>drawCounts),{three:1,two:0});
 await page.locator('#showTrace').uncheck();await page.evaluate(()=>Lab.flush());await page.evaluate(()=>{drawCounts.three=drawCounts.two=0;Lab.set({k:1});});await page.evaluate(()=>Lab.flush());assert.deepEqual(await page.evaluate(()=>drawCounts),{three:0,two:1});
 // Fixed high quality is never reduced; auto updates use the bounded policy.
 await page.locator('#quality').selectOption('2');await page.evaluate(()=>Lab.flush());assert.equal(await page.evaluate(()=>__lastResult.quality),2);assert.equal(await page.evaluate(()=>Lab.state.autoQuality),false);
 await page.evaluate(()=>{adaptiveQuality.observe(100);});await page.locator('#quality').selectOption('auto');await page.evaluate(()=>Lab.flush());assert.equal(await page.evaluate(()=>__lastResult.quality),0);
 assert.equal(await page.locator('#error').innerText(),'');assert.deepEqual(errors,[]);await page.close();console.log(`${lang}: stable-input rendering, latest state, skipped redundant redraws, independent 2D updates, adaptive quality hysteresis and manual override passed.`);
}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});

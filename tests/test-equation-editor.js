const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
function sameCamera(a,b){for(const key of ['eye','center','up'])for(const axis of ['x','y','z'])assert(Math.abs(a[key][axis]-b[key][axis])<1e-6);assert.equal(a.projection.type,b.projection.type);}
(async()=>{const browser=await chromium.launch({executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--enable-unsafe-swiftshader']});
try{for(const lang of ['zh','en']){
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(__dirname,'../outputs',lang==='zh'?'surface-lab.html':'surface-lab-en.html')).href);await page.waitForFunction(()=>window.__lastResult);
 const flush=()=>page.evaluate(()=>Lab.flush()),state=()=>page.evaluate(()=>JSON.parse(JSON.stringify(Lab.state)));
 const camera=()=>page.evaluate(()=>document.getElementById('plot3d')._fullLayout.scene._scene.getCamera());
 assert.equal(await page.locator('#equation input').count(),4);assert.equal(await page.locator('#equation button').count(),6);
 for(let i=0;i<3;i++){const up=await page.locator('#eq-up'+i).boundingBox(),symbol=await page.locator('#eq-p'+i).boundingBox(),down=await page.locator('#eq-down'+i).boundingBox();assert(up.y<symbol.y&&down.y>symbol.y,'Arrows should sit above and below their variable');}
 // A continuous signed decimal can be typed without replacing or defocusing the input.
 const input=page.locator('#eq-a0');await input.fill('');await input.pressSequentially('-2.375',{delay:35});assert.equal(await input.inputValue(),'-2.375');assert.equal(await page.evaluate(()=>document.activeElement.id),'eq-a0');await flush();assert.equal((await state()).a[0],-2.375);assert.equal(await page.locator('#an0').inputValue(),'-2.375');
 await input.fill('');await flush();assert.equal((await state()).a[0],-2.375);await input.press('Tab');assert.equal(await input.inputValue(),'-2.375');
 await input.fill('10001');assert.equal((await state()).a[0],-2.375);await input.press('Enter');assert.equal(await input.inputValue(),'-2.375');
 await page.locator('#eq-q').fill('-0.125');await flush();assert.equal(await page.locator('#qnumber').inputValue(),'-0.125');assert.equal((await state()).q,-0.125);assert(Math.abs(Number(await page.locator('#qslider').inputValue())+.125)<.01);
 await page.locator('#an1').fill('3.5');await flush();assert.equal(await page.locator('#eq-a1').inputValue(),'3.5');
 await page.locator('#qnumber').fill('0.25');await flush();assert.equal(await page.locator('#eq-q').inputValue(),'0.25');
 await page.locator('#view-z').click();await page.evaluate(()=>cameraController.flush());const held=await camera();
 // 2*x^0 + y^2 + z^2 = 3 gives y^2 + z^2 = 1, including at x=0.
 await page.evaluate(()=>Lab.set({mode:'implicit',a:[2,1,1],p:[2,2,2],q:3}));await flush();
 await page.locator('#eq-down0').click();await page.locator('#eq-down0').click();await flush();assert.equal(await page.locator('#eq-p0').innerText(),'0');assert(await page.locator('#eq-down0').isDisabled());assert.equal(await page.locator('#p0').inputValue(),'0');assert.equal(await page.evaluate(()=>__lastResult.classification),'Elliptic cylinder');
 assert.deepEqual(await page.evaluate(()=>Lab.canonical(Lab.state)),{a:[0,1,1],p:[1,2,2],q:1});assert((await page.locator('#traceEq').innerText()).includes('1'));sameCamera(await camera(),held);
 for(let i=0;i<4;i++)await page.locator('#eq-up0').click();await flush();assert(await page.locator('#eq-up0').isDisabled());assert.equal((await state()).p[0],4);
 await page.locator('#p0').selectOption('0');await flush();assert.equal(await page.locator('#eq-p0').innerText(),'0');
 await page.evaluate(()=>Lab.set({a:[2,-1,3],p:[0,0,0],q:4}));await flush();assert.equal(await page.evaluate(()=>__lastResult.classification),'All of space');await page.locator('#eq-q').fill('5');await flush();assert.equal(await page.evaluate(()=>__lastResult.classification),'Empty set');
 // Explicit inputs map to their variable, not the sidebar coefficient slot.
 for(const solved of [0,1,2]){
  await page.locator('#preset5').click();await page.locator('#solved').selectOption(String(solved));await flush();const axes=[0,1,2].filter(i=>i!==solved);
  assert.equal(await page.locator('#eq-a'+solved).inputValue(),'1');assert.equal(await page.locator('#eq-p'+solved).innerText(),'1');
  await page.locator('#eq-a'+axes[0]).fill('2.5');await flush();assert.equal((await state()).a[0],2.5);assert.equal((await state()).mode,'explicit');
  await page.locator('#eq-down'+axes[0]).click();await page.locator('#eq-down'+axes[0]).click();await flush();assert.equal((await state()).p[axes[0]],0);
  await page.locator('#eq-q').fill('3');await flush();await page.locator('#eq-a'+solved).fill('2');await flush();const s=await state();assert.equal(s.mode,'implicit');assert.equal(s.a[solved],2);assert.equal(s.a[axes[0]],-2.5);assert.equal(s.q,3);assert.equal(s.p[axes[0]],0);
 }
 await page.locator('#preset5').click();await page.locator('#eq-up1').click();await flush();assert.equal((await state()).mode,'implicit');assert.deepEqual((await state()).a,[-2,1,-1]);assert.deepEqual((await state()).p,[2,2,2]);
 // Presets force-sync a focused field and restore all four controls.
 await page.locator('#eq-a0').focus();await page.evaluate(()=>Lab.applyPreset(0));await flush();assert.equal(await page.locator('#eq-a0').inputValue(),'1');
 for(const width of [1280,1100,390,320]){await page.setViewportSize({width,height:900});await page.waitForTimeout(250);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${lang} ${width}px overflow`);for(const id of ['eq-a0','eq-a1','eq-a2','eq-q'])assert(await page.locator('#'+id).isVisible());await page.screenshot({path:path.join(__dirname,`equation-${lang}-${width}.png`),fullPage:true});}
 assert.equal(await page.locator('#error').innerText(),'');if(lang==='en')assert(!/[\u3400-\u9fff]/.test(await page.locator('body').innerText()));assert.deepEqual(errors,[]);await page.close();console.log(`${lang}: equation typing, invalid drafts, two-way sync, exponents 0–4, constant surfaces/traces, explicit conversion, camera retention and responsive layout passed.`);
}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});

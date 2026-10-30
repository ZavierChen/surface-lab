const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const home={eye:{x:.95,y:2.05,z:.82},center:{x:0,y:0,z:0},up:{x:0,y:0,z:1},projection:{type:'perspective'}};
function sameCamera(a,b){for(const key of ['eye','center'])for(const axis of ['x','y','z'])assert(Math.abs(a[key][axis]-b[key][axis])<1e-6,`${key}.${axis}: ${a[key][axis]} != ${b[key][axis]}`);
 // WebGL orthogonalizes up against the viewing direction; compare orientation, not raw input up.
 const normalizeUp=c=>{const d=['x','y','z'].map(k=>c.eye[k]-c.center[k]),r=Math.hypot(...d),u=['x','y','z'].map(k=>c.up[k]),dot=u.reduce((s,v,i)=>s+v*d[i]/r,0),p=u.map((v,i)=>v-dot*d[i]/r),n=Math.hypot(...p);return p.map(v=>v/n);};
 const au=normalizeUp(a),bu=normalizeUp(b);au.forEach((v,i)=>assert(Math.abs(v-bu[i])<1e-6,'Camera roll changed'));assert.equal(a.projection.type,b.projection.type);}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--enable-unsafe-swiftshader']});
 try{for(const lang of ['zh','en']){
  const page=await browser.newPage({viewport:{width:1440,height:920}}),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../outputs',lang==='en'?'surface-lab-en.html':'surface-lab.html')).href);
  await page.waitForFunction(()=>window.__lastResult);const camera=()=>page.evaluate(()=>JSON.parse(JSON.stringify(document.getElementById('plot3d')._fullLayout.scene._scene.getCamera())));
  sameCamera(await camera(),home);
  // Exercise real orbit input before testing reset from an intentionally inverted, panned, zoomed camera.
  await page.waitForTimeout(300);
  const box=await page.locator('#plot3d').boundingBox();await page.mouse.move(box.x+box.width*.65,box.y+box.height*.45);await page.mouse.down({button:'right'});await page.mouse.move(box.x+box.width*.3,box.y+box.height*.65,{steps:12});await page.mouse.up({button:'right'});await page.waitForTimeout(300);
  const orbited=await camera();assert(Math.abs(orbited.eye.x-home.eye.x)+Math.abs(orbited.eye.y-home.eye.y)>.05,'Orbit did not change camera');
  await page.evaluate(()=>{Lab.set({q:.5});});await page.evaluate(()=>Lab.flush());sameCamera(await camera(),orbited);
  for(const other of [
   {eye:{x:-1.8,y:-1.2,z:-.6},center:{x:.4,y:-.3,z:.2},up:{x:0,y:0,z:-1},projection:{type:'perspective'}},
   {eye:{x:3,y:-2,z:1},center:{x:-.25,y:.1,z:0},up:{x:0,y:1,z:0},projection:{type:'perspective'}}
  ]){
   await page.evaluate(async c=>{cameraController.set(c);await cameraController.flush();},other);const changed=await camera();
   await page.evaluate(()=>{Lab.set({q:.25,D:4});});await page.evaluate(()=>Lab.flush());sameCamera(await camera(),changed);
   const equation=await page.locator('#equation').innerText();await page.locator('#reset').click();await page.evaluate(()=>cameraController.flush());sameCamera(await camera(),home);assert.equal(await page.locator('#equation').innerText(),equation);
   await page.evaluate(()=>Lab.flush());sameCamera(await camera(),home);
  }
  const expected=['Sphere','Ellipsoid','Hyperboloid of one sheet','Hyperboloid of two sheets','Elliptic cone','Elliptic paraboloid','Hyperbolic paraboloid / saddle','Elliptic cylinder'];
  for(let i=0;i<8;i++){await page.locator('#preset'+i).click();await page.evaluate(()=>Lab.flush());assert.equal(await page.evaluate(()=>window.__lastResult.classification),expected[i]);assert.equal(await page.locator('#error').innerText(),'');if(lang==='en')assert(!/[\u3400-\u9fff]/.test(await page.locator('body').innerText()),'Chinese text in English demo');}
  await page.locator('#qfamily').click();for(const [q,name]of [[-.01,expected[3]],[0,expected[4]],[.01,expected[2]]]){await page.locator('#qnumber').fill(String(q));await page.evaluate(()=>Lab.flush());assert.equal(await page.evaluate(()=>window.__lastResult.classification),name);}
  await page.locator('#preset5').click();await page.locator('#knumber').fill('2');await page.evaluate(()=>Lab.flush());assert((await page.locator('#traceNote').innerText()).includes('1.41421'));
  await page.locator('#preset0').click();await page.evaluate(()=>Lab.flush());await page.locator('#reset').click();await page.evaluate(()=>cameraController.flush());await page.waitForTimeout(200);await page.screenshot({path:path.join(__dirname,`demo-${lang}.png`),fullPage:true});
  for(const width of [1280,390]){await page.setViewportSize({width,height:850});await page.waitForTimeout(400);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${lang} ${width}px overflow`);}
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);await page.close();console.log(`${lang}: first-octant reset after orbit/pan/zoom, camera retention, all presets, Q transition, traces, responsive layout and offline checks passed.`);
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});

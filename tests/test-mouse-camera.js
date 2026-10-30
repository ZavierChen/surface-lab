const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict'),path=require('node:path');const {pathToFileURL}=require('node:url');
const keys=['x','y','z'],sub=(a,b)=>Object.fromEntries(keys.map(k=>[k,a[k]-b[k]])),len=a=>Math.hypot(a.x,a.y,a.z);
function sameVector(a,b,tol=1e-6){for(const k of keys)assert(Math.abs(a[k]-b[k])<tol,`${k}: ${a[k]} vs ${b[k]}`);}
function same(a,b){for(const k of ['eye','center','up'])sameVector(a[k],b[k]);assert.equal(a.projection.type,b.projection.type);}
(async()=>{const browser=await chromium.launch({executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--enable-unsafe-swiftshader']});
try{for(const lang of ['zh','en']){
 const page=await browser.newPage({viewport:{width:1440,height:920}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(__dirname,'../outputs',lang==='en'?'surface-lab-en.html':'surface-lab.html')).href);await page.waitForFunction(()=>window.__lastResult);await page.waitForTimeout(300);
 // Check the rendered WebGL camera, not just layout.scene.camera (which can be stale).
 const camera=()=>page.evaluate(()=>document.getElementById('plot3d')._fullLayout.scene._scene.getCamera());
 const settle=()=>page.evaluate(()=>cameraController.flush());
 const reset=async()=>{await page.locator('#reset').click();await settle();};
 const box=await page.locator('#plot3d').boundingBox(),cx=box.x+box.width*.52,cy=box.y+box.height*.48;
 async function drag(button,dx,dy){await page.mouse.move(cx,cy);await page.mouse.down({button});await page.mouse.move(cx+dx,cy+dy,{steps:12});await page.mouse.up({button});await settle();}
 const home=await camera();
 // Free orbit changes both directions; a diagonal drag must not lock to X or Y.
 await drag('left',-90,55);let c=await camera();sameVector(c.center,home.center);assert(len(sub(c.eye,home.eye))>.1);assert(Math.abs(c.eye.x-home.eye.x)>.01&&Math.abs(c.eye.y-home.eye.y)>.01&&Math.abs(c.eye.z-home.eye.z)>.01);assert(Math.abs(len(sub(c.eye,c.center))-len(sub(home.eye,home.center)))<1e-6,'Rotation changed zoom');
 const leftRotated=c;await page.locator('#qslider').focus();await page.keyboard.press('ArrowRight');await page.evaluate(()=>Lab.flush());same(await camera(),leftRotated);
 // The second direction remains usable throughout the same drag.
 await reset();await page.mouse.move(cx,cy);await page.mouse.down({button:'left'});await page.mouse.move(cx-45,cy,{steps:5});await settle();const horizontal=await camera();await page.mouse.move(cx-45,cy+90,{steps:8});await page.mouse.up({button:'left'});await settle();assert(len(sub((await camera()).eye,horizontal.eye))>.1,'Orbit locked its axis');
 await reset();await drag('left',120,40);const rotated=await camera();sameVector(rotated.center,home.center);assert(len(sub(rotated.eye,home.eye))>.2);
 // Actual two-button chord, including changing/releasing buttons without lifting both.
 await page.mouse.move(cx,cy);await page.mouse.down({button:'left'});await page.mouse.down({button:'right'});await page.mouse.move(cx+70,cy+45,{steps:10});await page.mouse.up({button:'right'});await page.mouse.up({button:'left'});await settle();const panned=await camera();sameVector(sub(panned.eye,panned.center),sub(rotated.eye,rotated.center));assert(len(sub(panned.center,rotated.center))>.01);assert(Math.abs(panned.center.z-rotated.center.z)>.001,'Free pan should allow screen-vertical movement');
 await page.mouse.move(cx,cy);await page.mouse.wheel(0,-180);await settle();const zoomed=await camera();sameVector(zoomed.center,panned.center);assert(len(sub(zoomed.eye,zoomed.center))<len(sub(panned.eye,panned.center)));
 const direction=sub(zoomed.eye,zoomed.center),r=len(direction),old=sub(panned.eye,panned.center);sameVector(Object.fromEntries(keys.map(k=>[k,direction[k]/r])),Object.fromEntries(keys.map(k=>[k,old[k]/len(old)])));
 // Exercise range inputs through real clicks/drags and keyboard, immediately after camera movement.
 await page.locator('#qslider').focus();await page.keyboard.press('ArrowRight');await page.evaluate(()=>Lab.flush());same(await camera(),zoomed);
 for(const id of ['a0','a1','a2','kslider']){await page.locator('#'+id).focus();await page.keyboard.press('ArrowRight');await page.evaluate(()=>Lab.flush());same(await camera(),zoomed);}
 const qbox=await page.locator('#qslider').boundingBox();await page.mouse.move(qbox.x+qbox.width*.2,qbox.y+qbox.height/2);await page.mouse.down();await page.mouse.move(qbox.x+qbox.width*.8,qbox.y+qbox.height/2,{steps:20});await page.mouse.up();await page.evaluate(()=>Lab.flush());same(await camera(),zoomed);
 await page.locator('#quality').selectOption('2');await page.locator('#style').selectOption('transparent');await page.locator('#traceAxis').selectOption('0');await page.evaluate(()=>Lab.flush());same(await camera(),zoomed);
 // Stress input while a new curve is queued, then wait for the draw pipeline to drain.
 await page.mouse.move(cx,cy);await page.mouse.down({button:'left'});await page.evaluate(()=>{for(let i=0;i<8;i++)setTimeout(()=>Lab.set({q:-.2+i*.1}),i*15);});await page.mouse.move(cx-75,cy-30,{steps:15});await page.mouse.up({button:'left'});await settle();const last=await camera();await page.waitForTimeout(200);await page.evaluate(()=>Lab.flush());same(await camera(),last);
 await page.setViewportSize({width:1280,height:850});await page.waitForTimeout(500);await settle();same(await camera(),last);
 // Exact positive-axis views use orthographic projection, retain their frame on
 // redraw, and can be rotated away from even at the Z pole.
 for(const axis of keys){
  const equation=await page.locator('#equation').innerText();
  await page.locator('#view-'+axis).click();await settle();const front=await camera();
  assert.equal(front.projection.type,'orthographic');sameVector(front.center,{x:0,y:0,z:0});
  for(const k of keys)assert(k===axis?front.eye[k]>0:Math.abs(front.eye[k])<1e-6,'Wrong positive-axis direction');
  sameVector(front.up,axis==='z'?{x:0,y:1,z:0}:{x:0,y:0,z:1});
  assert.equal(await page.locator('#equation').innerText(),equation);
  await page.locator('#qslider').focus();await page.keyboard.press('ArrowLeft');await page.evaluate(()=>Lab.flush());same(await camera(),front);
  await page.screenshot({path:path.join(__dirname,`view-${axis}-${lang}.png`),fullPage:true});
  const vb=await page.locator('#plot3d').boundingBox();await page.mouse.move(vb.x+vb.width/2,vb.y+vb.height/2);await page.mouse.wheel(0,-120);await page.waitForTimeout(100);await settle();const zoom=await camera();assert(len(zoom.eye)<len(front.eye));
  await page.mouse.down({button:'left'});await page.mouse.move(vb.x+vb.width/2+40,vb.y+vb.height/2+30,{steps:8});await page.mouse.up({button:'left'});await settle();const away=await camera();assert(len(sub(away.eye,zoom.eye))>.01);assert(Object.values(away.up).every(Number.isFinite));
  await page.evaluate(()=>Lab.flush());same(await camera(),away);
 }
 // Both chord orders, including release of one button before the other.
 for(const first of ['left','right']){
  await reset();const second=first==='left'?'right':'left',vb=await page.locator('#plot3d').boundingBox(),x=vb.x+vb.width/2,y=vb.y+vb.height/2;
  await page.mouse.move(x,y);await page.mouse.down({button:first});await page.mouse.down({button:second});await page.mouse.move(x+50,y+35,{steps:8});await settle();const pan=await camera();sameVector(sub(pan.eye,pan.center),sub(home.eye,home.center));assert(len(pan.center)>.01);
  await page.mouse.up({button:second});await settle();same(await camera(),pan);
  await page.mouse.move(x+80,y+60,{steps:6});await page.mouse.up({button:first});await settle();const orbit=await camera();sameVector(orbit.center,pan.center);assert(len(sub(orbit.eye,pan.eye))>.01);
 }
 await reset();same(await camera(),home);await page.screenshot({path:path.join(__dirname,`mouse-${lang}.png`),fullPage:true});assert.equal(await page.locator('#error').innerText(),'');assert.deepEqual(errors,[]);await page.close();console.log(`${lang}: free orbit; positive X/Y/Z orthographic views; both chord orders; wheel zoom; rendered-camera preservation during sliders, redraw and resize; reset passed.`);
}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});

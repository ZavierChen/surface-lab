const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z}),length=v=>Math.hypot(v.x,v.y,v.z);
function near(a,b,tol=1e-6){for(const k of ['x','y','z'])assert(Math.abs(a[k]-b[k])<tol,`${k}: ${a[k]} != ${b[k]}`);}
(async()=>{const browser=await chromium.launch({executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--enable-unsafe-swiftshader']});
try{for(const lang of ['zh','en']){
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(__dirname,'../outputs',lang==='zh'?'surface-lab.html':'surface-lab-en.html')).href);await page.waitForFunction(()=>window.__lastResult);
 const settle=async()=>{await page.evaluate(()=>cameraController.flush());await page.waitForTimeout(60);};
 const camera=()=>page.evaluate(()=>document.getElementById('plot3d')._fullLayout.scene._scene.getCamera());
 // Use the actual render matrices, not the rotation implementation, to check
 // that a point on the visible front of the hyperboloid follows the mouse.
 const project=point=>page.evaluate(point=>{const gd=document.getElementById('plot3d'),scene=gd._fullLayout.scene._scene,params=scene.glplot.cameraParams,rect=gd.getBoundingClientRect();let p=[...point.map((v,i)=>v*scene.dataScale[i]),1];for(const m of [params.model,params.view,params.projection])p=[0,1,2,3].map(r=>p.reduce((sum,v,c)=>sum+m[4*c+r]*v,0));return {x:rect.left+(1+p[0]/p[3])*rect.width/2,y:rect.top+(1-p[1]/p[3])*rect.height/2};},point);
 await page.locator('#preset2').click();await page.evaluate(()=>Lab.flush());
 for(const axis of ['x','z','home'])for(const [dx,dy] of [[0,-55],[0,55],[-55,0],[55,0]]){
  await page.locator(axis==='home'?'#reset':'#view-'+axis).click();await settle();const before=await camera(),point=axis==='z'?[0,0,1]:[1,0,0],start=await project(point);
  await page.mouse.move(start.x,start.y);await page.mouse.down({button:'left'});await page.mouse.move(start.x+dx,start.y+dy,{steps:10});await page.mouse.up({button:'left'});await settle();
  const end=await project(point),after=await camera();assert((end.x-start.x)*dx+(end.y-start.y)*dy>20,'Visible near side moved against the pointer');near(after.center,before.center);assert(Math.abs(length(sub(after.eye,after.center))-length(sub(before.eye,before.center)))<1e-6);
 }
 // Steering-wheel input: clockwise and counterclockwise, before and after pan.
 for(const panned of [false,true])for(const direction of [1,-1]){
  await page.locator('#view-x').click();await settle();
  if(panned){const r=await page.locator('#plot3d').boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2;await page.mouse.move(x,y);await page.mouse.down({button:'left'});await page.mouse.down({button:'right'});await page.mouse.move(x+65,y+40,{steps:10});await page.mouse.up({button:'right'});await page.mouse.up({button:'left'});await settle();}
  const before=await camera(),origin=await project([0,0,0]),point=await project([0,1,0]);
  await page.mouse.move(origin.x+100,origin.y);await page.mouse.down({button:'right'});
  for(let i=1;i<=16;i++){const a=direction*Math.PI/2*i/16;await page.mouse.move(origin.x+100*Math.cos(a),origin.y+100*Math.sin(a));}
  await page.mouse.up({button:'right'});await settle();const after=await camera(),endOrigin=await project([0,0,0]),end=await project([0,1,0]);
  near(sub(after.eye,after.center),sub(before.eye,before.center));assert(Math.hypot(endOrigin.x-origin.x,endOrigin.y-origin.y)<.1,'Roll shifted the coordinate origin');
  const a={x:point.x-origin.x,y:point.y-origin.y},b={x:end.x-endOrigin.x,y:end.y-endOrigin.y};assert((a.x*b.y-a.y*b.x)*direction>1,'Screen roll direction is reversed');assert(Math.abs(a.x*b.x+a.y*b.y)<.1,'Quarter turn was not 90 degrees');
  await page.locator('#qslider').focus();await page.keyboard.press('ArrowRight');await page.evaluate(()=>Lab.flush());const kept=await camera();for(const k of ['eye','center','up'])near(kept[k],after[k]);
 }
 // Near the origin the angle is undefined; small motions must not cause a spin.
 await page.locator('#view-x').click();await settle();const before=await camera(),o=await project([0,0,0]);await page.mouse.move(o.x,o.y);await page.mouse.down({button:'right'});await page.mouse.move(o.x+3,o.y-3);await page.mouse.up({button:'right'});await settle();near((await camera()).up,before.up);
 await page.mouse.move(o.x+80,o.y);await page.mouse.down({button:'right'});await page.mouse.move(o.x-80,o.y);await page.mouse.up({button:'right'});await settle();near((await camera()).up,before.up);
 await page.screenshot({path:path.join(__dirname,`grab-roll-${lang}.png`),fullPage:true});assert.deepEqual(errors,[]);await page.close();console.log(`${lang}: hyperboloid near-side follows all four drag directions; origin-centered clockwise/counterclockwise screen roll after pan; no pole snap or center spin; slider preservation passed.`);
}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});

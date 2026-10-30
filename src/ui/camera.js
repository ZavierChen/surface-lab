// Camera state belongs to the app, not to Plotly's layout or private scene cache.
// Serialize geometry, camera and resize writes so an older render cannot undo a drag.
const cameraController=(()=>{
 const clone=v=>JSON.parse(JSON.stringify(v));
 let camera=defaultCamera(),revision=0,queue=Promise.resolve(),writing=0,frame=0,flushing=false,connected=false,gesture=null;
 const gd=$('plot3d');
 const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z});
 const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
 const mul=(a,s)=>({x:a.x*s,y:a.y*s,z:a.z*s});
 const norm=a=>Math.hypot(a.x,a.y,a.z);
 const unit=a=>mul(a,1/(norm(a)||1));
 const cross=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
 function rotate(v,axis,angle){const c=Math.cos(angle),s=Math.sin(angle),dot=v.x*axis.x+v.y*axis.y+v.z*axis.z;return add(add(mul(v,c),mul(cross(axis,v),s)),mul(axis,dot*(1-c)));}
 function serialize(action){const task=queue.then(async()=>{writing++;try{return await action();}finally{writing--;}});queue=task.catch(e=>console.error('Camera update failed',e));return task;}
 function save(value){camera=clone(value);revision++;}
 function apply(){
  if(!gd._fullLayout)return Promise.resolve();
  // Projection needs its own relayout key to rebuild Plotly's WebGL viewport.
  // Updating the whole camera object alone can leave the rendered projection stale.
  const c=clone(camera),update={'scene.camera.eye':c.eye,'scene.camera.center':c.center,'scene.camera.up':c.up,'scene.uirevision':revision};
  const live=gd._fullLayout.scene?._scene?.getCamera?.();
  if(live?.projection?.type!==c.projection.type)update['scene.camera.projection.type']=c.projection.type;
  return Plotly.relayout(gd,update);
 }
 function schedule(){if(frame||flushing)return;frame=requestAnimationFrame(()=>{frame=0;flushing=true;const submitted=revision;serialize(apply).finally(()=>{flushing=false;if(submitted!==revision)schedule();});});}
 function set(value){save(value);schedule();}
 function connect(){if(connected)return;connected=true;
  // Retain native touch gestures too; writes from our own render pipeline are ignored.
  gd.on('plotly_relayout',event=>{if(!writing&&Object.keys(event).some(k=>k.startsWith('scene.camera'))){const live=gd._fullLayout?.scene?._scene?.getCamera?.()||gd.layout?.scene?.camera;if(live)save(live);}});
 }
 async function flush(){if(frame){cancelAnimationFrame(frame);frame=0;}await serialize(apply);}
 async function render(data,layout,config){return serialize(async()=>{
  layout.scene.camera=clone(camera);layout.scene.uirevision=revision;
  await Plotly.react(gd,data,layout,config);connect();
  // Read the latest app camera after react completes, including movement during rendering.
  await apply();
 });}
 function resize(){return serialize(async()=>{if(gd._fullLayout){await Plotly.Plots.resize(gd);await apply();}});}
 function basis(c){const forward=unit(sub(c.center,c.eye));let right=cross(forward,c.up);if(norm(right)<1e-8)right={x:1,y:0,z:0};right=unit(right);return {right,up:unit(cross(right,forward))};}
 function trackball(x,y,rect){
  const radius=Math.max(1,Math.min(rect.width,rect.height)*.45);
  const u=(x-rect.left-rect.width/2)/radius,v=(rect.top+rect.height/2-y)/radius,d=u*u+v*v;
  // A sphere near the center and a smooth hyperbolic sheet beyond its rim.
  // This keeps edge drags usable without a discontinuity at the boundary.
  return unit({x:u,y:v,z:d<=.5?Math.sqrt(1-d):.5/Math.sqrt(d)});
 }
 function originPixel(rect){
  const params=gd._fullLayout?.scene?._scene?.glplot?.cameraParams;
  if(params){
   let p=[0,0,0,1];for(const matrix of [params.model,params.view,params.projection])p=[0,1,2,3].map(row=>p.reduce((sum,v,col)=>sum+matrix[col*4+row]*v,0));
   if(p.every(Number.isFinite)&&Math.abs(p[3])>1e-8)return {x:rect.left+(1+p[0]/p[3])*rect.width/2,y:rect.top+(1-p[1]/p[3])*rect.height/2};
  }
  return {x:rect.left+rect.width/2,y:rect.top+rect.height/2};
 }
 function mode(buttons){return (buttons&3)===3||(buttons&4)?'pan':buttons&2?'roll':buttons&1?'rotate':null;}
 function begin(e,m){const rect=gd.getBoundingClientRect();gesture={id:e.pointerId,mode:m,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,camera:clone(camera),rect,pivot:originPixel(rect),rollAngle:0};gd.style.cursor=m==='pan'?'move':'grabbing';}
 function finish(){const id=gesture?.id;gesture=null;gd.style.cursor='grab';if(id!==undefined&&gd.hasPointerCapture(id))gd.releasePointerCapture(id);}
 function block(e){e.preventDefault();e.stopImmediatePropagation();}
 gd.style.touchAction='none';gd.style.cursor='grab';
 gd.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')return;const m=mode(e.buttons);if(!m)return;block(e);begin(e,m);gd.setPointerCapture(e.pointerId);},true);
 gd.addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse'||!gesture)return;block(e);const m=mode(e.buttons);
  if(!m){finish();return;}
  // Chorded buttons change through pointermove, not necessarily pointerdown/up.
  // Rebase whenever the button combination changes; never jump between operations.
  if(m!==gesture.mode){begin(e,m);return;}
  const g=gesture,dx=e.clientX-g.x,dy=e.clientY-g.y,c=clone(g.camera),offset=sub(c.eye,c.center),distance=norm(offset),lastX=g.lastX,lastY=g.lastY;g.lastX=e.clientX;g.lastY=e.clientY;
  if(m==='rotate'){
   // Drag the visible surface of a virtual ball; rotate the camera inversely.
   // Screen Y points down, whereas the camera's up vector points up.
   const b=basis(c),from=trackball(g.x,g.y,g.rect),to=trackball(e.clientX,e.clientY,g.rect);
   const turn=cross(to,from),sine=norm(turn),cosine=to.x*from.x+to.y*from.y+to.z*from.z;
   if(sine<1e-10){set(c);return;}
   const axis=unit(add(add(mul(b.right,turn.x),mul(b.up,turn.y)),mul(unit(offset),turn.z))),angle=Math.atan2(sine,cosine);
   c.eye=add(c.center,rotate(offset,axis,angle));c.up=rotate(b.up,axis,angle);
  }else if(m==='roll'){
   // Steering-wheel motion around the projected world origin, even after panning.
   const a={x:lastX-g.pivot.x,y:lastY-g.pivot.y},b={x:e.clientX-g.pivot.x,y:e.clientY-g.pivot.y};
   const delta={x:b.x-a.x,y:b.y-a.y},squared=delta.x*delta.x+delta.y*delta.y;
   const t=squared?Math.max(0,Math.min(1,-(a.x*delta.x+a.y*delta.y)/squared)):0;
   // Ignore strokes through the center, where a wheel angle is undefined.
   if(Math.hypot(a.x+t*delta.x,a.y+t*delta.y)<12)return;
   g.rollAngle+=Math.atan2(a.x*b.y-a.y*b.x,a.x*b.x+a.y*b.y);
   const axis=unit(offset);c.eye=rotate(c.eye,axis,g.rollAngle);c.center=rotate(c.center,axis,g.rollAngle);c.up=rotate(c.up,axis,g.rollAngle);
  }else{
   const b=basis(c),scale=2*distance*Math.tan(Math.PI/8)/Math.max(1,gd.clientHeight);
   const shift=mul(add(mul(b.right,dx),mul(b.up,-dy)),-scale);
   c.center=add(c.center,shift);c.eye=add(c.eye,shift);
  }
  set(c);
 },true);
 gd.addEventListener('pointerup',e=>{if(e.pointerType!=='mouse'||!gesture)return;block(e);if(mode(e.buttons))begin(e,mode(e.buttons));else finish();},true);
 gd.addEventListener('pointercancel',finish,true);
 gd.addEventListener('lostpointercapture',e=>{
  // Chromium can release capture when one button in a chord is released.
  // Keep the remaining button's gesture alive until all buttons are up.
  if(gesture&&mode(e.buttons)){gd.setPointerCapture(e.pointerId);return;}
  gesture=null;gd.style.cursor='grab';
 });
 window.addEventListener('blur',finish);
 // Prevent Plotly's mouse drag and context-menu handlers from competing with ours.
 for(const name of ['mousedown','mousemove','mouseup','contextmenu','dblclick'])gd.addEventListener(name,e=>{if(name==='mousemove'&&!gesture)return;block(e);},true);
 gd.addEventListener('wheel',e=>{block(e);const c=clone(camera),offset=sub(c.eye,c.center),r=norm(offset),pixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?gd.clientHeight:1),next=Math.max(.12,Math.min(30,r*Math.exp(Math.max(-1,Math.min(1,pixels*.001)))));c.eye=add(c.center,mul(offset,next/r));set(c);if(gesture)begin({pointerId:gesture.id,clientX:gesture.lastX,clientY:gesture.lastY},gesture.mode);},{capture:true,passive:false});
 function view(axis){finish();const c=defaultCamera();c.eye={x:0,y:0,z:0};c.eye[axis]=2.4;c.up=axis==='z'?{x:0,y:1,z:0}:{x:0,y:0,z:1};c.projection.type='orthographic';save(c);return flush();}
 return {snapshot:()=>clone(camera),set,flush,render,resize,view,reset:()=>{finish();save(defaultCamera());return flush();}};
})();

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
 function mode(buttons){return (buttons&3)===3||(buttons&4)?'pan':buttons&3?'rotate':null;}
 function begin(e,m){gesture={id:e.pointerId,mode:m,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,camera:clone(camera)};gd.style.cursor=m==='rotate'?'grabbing':'move';}
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
  const g=gesture,dx=e.clientX-g.x,dy=e.clientY-g.y,c=clone(g.camera),offset=sub(c.eye,c.center),distance=norm(offset);g.lastX=e.clientX;g.lastY=e.clientY;
  if(m==='rotate'){
   // Free orbit in the screen's frame, including from an exact axis view.
   // Rotate the entire frame so dragging across a pole never snaps upright.
   const b=basis(c),motion=Math.hypot(dx,dy);if(!motion)return;
   const axis=unit(add(mul(b.up,-dx),mul(b.right,dy))),angle=motion*.007;
   c.eye=add(c.center,rotate(offset,axis,angle));c.up=rotate(b.up,axis,angle);
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

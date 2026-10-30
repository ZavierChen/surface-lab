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
 function serialize(action){const task=queue.then(async()=>{writing++;try{return await action();}finally{writing--;}});queue=task.catch(e=>console.error('Camera update failed',e));return task;}
 function save(value){camera=clone(value);revision++;}
 function apply(){return gd._fullLayout?Plotly.relayout(gd,{'scene.camera':clone(camera),'scene.uirevision':revision}):Promise.resolve();}
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
 function mode(buttons){return (buttons&3)===3||(buttons&4)?'pan':buttons&2?'rotate':buttons&1?'axis':null;}
 function begin(e,m){gesture={id:e.pointerId,mode:m,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,camera:clone(camera),axis:null};gd.style.cursor=m==='rotate'?'grabbing':m==='axis'?'crosshair':'move';}
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
   const yaw=Math.atan2(offset.y,offset.x)-dx*.007;
   const pitch=Math.max(-Math.PI/2+.025,Math.min(Math.PI/2-.025,Math.asin(offset.z/distance)+dy*.007));
   c.eye=add(c.center,{x:distance*Math.cos(pitch)*Math.cos(yaw),y:distance*Math.cos(pitch)*Math.sin(yaw),z:distance*Math.sin(pitch)});c.up={x:0,y:0,z:1};
  }else{
   const b=basis(c),scale=2*distance*Math.tan(Math.PI/8)/Math.max(1,gd.clientHeight);
   let shift;
   if(m==='axis'){
    if(!g.axis){if(Math.hypot(dx,dy)<4)return;
     // Select the world X/Y axis closest to the initial on-screen drag, then lock it.
     const score=k=>{const len=Math.hypot(b.right[k],b.up[k]);return len<.08?-1:Math.abs(dx*b.right[k]-dy*b.up[k])/len;};
     g.axis=score('x')>=score('y')?'x':'y';
    }
    const k=g.axis,den=b.right[k]**2+b.up[k]**2;
    shift={x:0,y:0,z:0};shift[k]=-(dx*b.right[k]-dy*b.up[k])*scale/Math.max(.0064,den);
   }else shift=mul(add(mul(b.right,dx),mul(b.up,-dy)),-scale);
   c.center=add(c.center,shift);c.eye=add(c.eye,shift);
  }
  set(c);
 },true);
 gd.addEventListener('pointerup',e=>{if(e.pointerType!=='mouse'||!gesture)return;block(e);if(mode(e.buttons))begin(e,mode(e.buttons));else finish();},true);
 gd.addEventListener('pointercancel',finish,true);gd.addEventListener('lostpointercapture',()=>{gesture=null;gd.style.cursor='grab';});window.addEventListener('blur',finish);
 // Prevent Plotly's mouse drag and context-menu handlers from competing with ours.
 for(const name of ['mousedown','mousemove','mouseup','contextmenu','dblclick'])gd.addEventListener(name,e=>{if(name==='mousemove'&&!gesture)return;block(e);},true);
 gd.addEventListener('wheel',e=>{block(e);const c=clone(camera),offset=sub(c.eye,c.center),r=norm(offset),pixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?gd.clientHeight:1),next=Math.max(.12,Math.min(30,r*Math.exp(Math.max(-1,Math.min(1,pixels*.001)))));c.eye=add(c.center,mul(offset,next/r));set(c);if(gesture)begin({pointerId:gesture.id,clientX:gesture.lastX,clientY:gesture.lastY},gesture.mode);},{capture:true,passive:false});
 return {snapshot:()=>clone(camera),set,flush,render,resize,reset:()=>{finish();save(defaultCamera());return flush();}};
})();

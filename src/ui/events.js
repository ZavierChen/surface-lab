for(let mode of ['implicit','explicit'])$(mode).onclick=()=>{state.mode=mode;edited();};
$('solved').onchange=e=>{state.solved=+e.target.value;edited();};
for(let id of ['qslider','qnumber'])$(id).oninput=e=>{if(valid(e.target)){state.q=+e.target.value;edited();}};
document.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{state.q=+b.dataset.q;edited();});
$('qfamily').onclick=()=>{applyPreset(2);state.compare=true;sync();schedule();};
$('domain').onchange=e=>{if(valid(e.target)){state.D=+e.target.value;state.k=Math.max(-state.D,Math.min(state.D,state.k));sync();schedule();}};
for(let id of ['quality','traceAxis','style'])$(id).onchange=e=>{state[id]=id==='style'?e.target.value:+e.target.value;sync();schedule();};
for(let id of ['kslider','knumber'])$(id).oninput=e=>{if(valid(e.target)){state.k=+e.target.value;sync();schedule();}};
for(let [id,key] of [['showTrace','trace'],['grid','grid'],['compare','compare']])$(id).onchange=e=>{state[key]=e.target.checked;sync();schedule();};
$('reset').onclick=()=>Plotly.relayout('plot3d',{'scene.camera':CAMERA});
window.Lab={state,canonical,classify,PRESETS,applyPreset,async flush(){clearTimeout(timer);timer=null;while(busy)await new Promise(r=>setTimeout(r,20));clearTimeout(timer);timer=null;pending=false;await render();},set(values){Object.assign(state,values);lastPreset=-1;sync(true);schedule();}};
// Optional agent interface shares the same validated preset action as the visible buttons.
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'set_surface_preset',description:'Choose and display a Surface Lab preset.',inputSchema:{type:'object',properties:{preset:{type:'integer',minimum:0,maximum:7}},required:['preset'],additionalProperties:false},annotations:{readOnlyHint:false},async execute(input){if(!input||!Number.isInteger(input.preset)||input.preset<0||input.preset>=PRESETS.length)throw Error('Invalid preset');applyPreset(input.preset);await window.Lab.flush();return window.__lastResult;}})).catch(()=>{});}catch{}}
sync();lastRender=render();

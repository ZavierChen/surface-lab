'use strict';
const $=id=>document.getElementById(id);
const state={mode:'implicit',solved:1,a:[1,-1,1],p:[2,2,2],q:1,D:5,quality:1,style:'solid',traceAxis:1,k:0,trace:true,compare:false,grid:true};
// A fresh reset target is independent of Plotly's live orbit/pan state.
// First-octant view: +x left, +y right, +z up, looking at the origin.
function defaultCamera(){return {eye:{x:.95,y:2.05,z:.82},center:{x:0,y:0,z:0},up:{x:0,y:0,z:1},projection:{type:'perspective'}};}
function currentCamera(){return cameraController.snapshot();}
let timer,busy=false,pending=false,geometryKey='',geometry=[],lastRender=Promise.resolve(),lastPreset=2;
const plotConfig={responsive:true,displaylogo:false,scrollZoom:false,modeBarButtonsToRemove:['toImage','sendDataToCloud'],displayModeBar:'hover'};
for(let i=0;i<3;i++){
 let div=document.createElement('div');div.className='coefficient';div.id='coefficient'+i;
 div.innerHTML=`<div class="row"><label id="coefficientLabel${i}" for="a${i}">${'ABC'[i]} · ${AX[i]}</label><input id="an${i}" type="number" step="any" min="-10000" max="10000" aria-label="Exact coefficient ${'ABC'[i]}"></div><input id="a${i}" type="range" min="-5" max="5" step="0.01" aria-label="Coefficient ${'ABC'[i]}">`;$('coefficients').append(div);
 let field=document.createElement('div');field.innerHTML=`<label for="p${i}">p<sub>${AX[i]}</sub></label><select id="p${i}" aria-label="Exponent of ${AX[i]}">${[0,1,2,3,4].map(p=>`<option value="${p}">${p}</option>`).join('')}</select>`;$('exponents').append(field);
 $('a'+i).addEventListener('input',e=>{state.a[i]=+e.target.value;edited();});
 $('an'+i).addEventListener('input',e=>{if(valid(e.target)){state.a[i]=+e.target.value;edited();}});
 $('p'+i).addEventListener('change',e=>{state.p[i]=+e.target.value;edited();});
}
PRESETS.forEach((p,i)=>{let b=document.createElement('button');b.textContent=p.name;b.id='preset'+i;b.onclick=()=>applyPreset(i);$('presets').append(b);});
function valid(el){return el.value!==''&&Number.isFinite(+el.value)&&el.checkValidity();}
function applyPreset(i){let p=PRESETS[i];Object.assign(state,{mode:p.mode||'implicit',solved:p.solved??1,a:p.a.slice(),p:p.p.slice(),q:p.q,k:p.mode==='explicit'?1:0,traceAxis:1});lastPreset=i;sync(true);return schedule();}
function edited(){lastPreset=-1;sync();schedule();}
function syncRange(id,value,min=-5,max=5){let el=$(id);el.min=Math.min(min,value);el.max=Math.max(max,value);el.value=value;}
function sync(force=false){
 let explicit=state.mode==='explicit',axes=[0,1,2].filter(i=>i!==state.solved);
 for(let mode of ['implicit','explicit']){$(mode).classList.toggle('active',state.mode===mode);$(mode).setAttribute('aria-pressed',state.mode===mode);}
 $('solvedField').classList.toggle('hidden',!explicit);$('solved').value=state.solved;
 for(let i=0;i<3;i++){$('coefficient'+i).classList.toggle('hidden',explicit&&i===2);$('coefficientLabel'+i).textContent='ABC'[i]+' · '+AX[explicit?axes[i]??i:i];syncRange('a'+i,state.a[i]);if(force||document.activeElement!==$('an'+i))$('an'+i).value=state.a[i];$('p'+i).value=state.p[i];$('p'+i).disabled=explicit&&state.solved===i;}
 $('modeHint').textContent=explicit?`${AX[state.solved]} = A ${AX[axes[0]]}ᵖ + B ${AX[axes[1]]}ᵖ + Q; the solved exponent is unused.`:'A xᵖˣ + B yᵖʸ + C zᵖᶻ = Q';
 syncRange('qslider',state.q);if(force||document.activeElement!==$('qnumber'))$('qnumber').value=state.q;
 $('qValue').textContent='Q = '+fmt(state.q);
 $('domain').value=state.D;$('quality').value=state.quality;$('style').value=state.style;$('traceAxis').value=state.traceAxis;
 $('knumber').min=-state.D;$('knumber').max=state.D;if(force||document.activeElement!==$('knumber'))$('knumber').value=state.k;syncRange('kslider',state.k,-state.D,state.D);
 $('showTrace').checked=state.trace;$('grid').checked=state.grid;
 PRESETS.forEach((p,i)=>{$('preset'+i).classList.toggle('active',lastPreset===i);$('preset'+i).setAttribute('aria-pressed',lastPreset===i);});
 updateText(force);
}
function updateText(force=false){let c=canonical(state),cl=classify(c),hyper=cl.name.startsWith('Hyperboloid'),cone=cl.name==='Elliptic cone';
 syncEquationEditor(force);$('typeBadge').textContent=cl.name;$('className').textContent=cl.name;$('reason').textContent=cl.why;$('axis').textContent=cl.axis;$('opening').textContent=cl.opening;
 $('compare').disabled=!(hyper||cone);$('compare').checked=state.compare&&(hyper||cone);
 let mixed=c.a.every(a=>a!==0)&&c.p.every(p=>p===2)&&c.a.some(a=>a<0)&&c.a.some(a=>a>0)&&state.mode==='implicit';
 if(mixed){let at=q=>classify({...c,q}).name.replace('Hyperboloid of ','');$('qGuide').innerHTML=`<span>Q &lt; 0 · ${at(-1)}</span><span>Q = 0 · cone</span><span>Q &gt; 0 · ${at(1)}</span>`;let axis=AX.indexOf(cl.axis),pair=[0,1,2].filter(i=>i!==axis);$('qExplanation').textContent=cone?'At Q = 0 the two nappes meet at the origin.':hyper&&cl.name.includes('one sheet')?`At ${cl.axis} = 0, the waist semiaxes are ${pair.map(i=>fmt(Math.sqrt(c.q/c.a[i]))).join(' and ')}. They shrink to zero as Q approaches 0.`:hyper?`The vertices are at ${cl.axis} = ±${fmt(Math.sqrt(c.q/c.a[axis]))}. The gap closes as Q approaches 0.`:'';
 }else{$('qGuide').innerHTML=state.mode==='explicit'?'<span>Negative shift</span><span>Q translates along the solved axis</span><span>Positive shift</span>':'<span>Negative Q</span><span>Q selects the level set F = 0</span><span>Positive Q</span>';$('qExplanation').textContent=state.mode==='explicit'?`Q moves the surface along ${AX[state.solved]}; it does not change its type.`:'';}
}
// Throttle rather than trailing-edge debounce: long slider drags keep producing new frames.

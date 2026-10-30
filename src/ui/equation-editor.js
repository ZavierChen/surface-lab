// Persistent input nodes keep keyboard focus and incomplete numeric drafts intact.
const equationEditor=(()=>{
 const chinese=document.documentElement.lang.startsWith('zh'),say=(zh,en)=>chinese?zh:en;
 const root=$('equation'),terms=[],operators=[];let layoutKey='';
 const summary=document.createElement('span');summary.id='equationText';summary.className='sr-only';
 root.setAttribute('role','group');root.setAttribute('aria-label',say('编辑当前方程','Edit the current equation'));
 const hint=document.createElement('div');hint.className='hint equation-hint';root.after(hint);
 function field(id,label){const input=document.createElement('input');Object.assign(input,{id,type:'number',step:'any',min:'-10000',max:'10000'});input.setAttribute('aria-label',label);input.autocomplete='off';return input;}
 function valueFor(axis){if(state.mode!=='explicit')return state.a[axis];if(axis===state.solved)return 1;return state.a[[0,1,2].filter(i=>i!==state.solved).indexOf(axis)];}
 function degreeFor(axis){return state.mode==='explicit'&&axis===state.solved?1:state.p[axis];}
 function makeImplicit(){
  // Preserve the equation before changing the formerly solved term. Do not use
  // canonical(), which has already absorbed the editable zero-degree terms.
  const solved=state.solved,axes=[0,1,2].filter(i=>i!==solved),a=[0,0,0];
  a[solved]=1;axes.forEach((axis,i)=>a[axis]=-state.a[i]);state.a=a;state.p[solved]=1;state.mode='implicit';
 }
 function bind(input,read,write){
  input.addEventListener('input',()=>{if(valid(input)){input.removeAttribute('aria-invalid');write(+input.value);edited();}else input.setAttribute('aria-invalid','true');});
  input.addEventListener('blur',()=>{input.value=read();input.removeAttribute('aria-invalid');});
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();input.blur();}if(e.key==='Escape'){e.preventDefault();input.value=read();input.removeAttribute('aria-invalid');input.blur();}});
 }
 for(let i=0;i<3;i++){
  const term=document.createElement('span');term.className='equation-term';
  const input=field('eq-a'+i,say(`${AX[i]} 项系数`,`${AX[i]} coefficient`));
  bind(input,()=>valueFor(i),value=>{
   if(state.mode==='explicit'&&state.solved===i)makeImplicit();
   const index=state.mode==='explicit'?[0,1,2].filter(a=>a!==state.solved).indexOf(i):i;state.a[index]=value;
  });
  const variable=document.createElement('span');variable.className='equation-variable';
  const symbol=document.createElement('span');symbol.className='equation-symbol';symbol.innerHTML=AX[i]+`<sup id="eq-p${i}"></sup>`;
  const buttons=[1,-1].map(delta=>{const b=document.createElement('button');b.type='button';b.id='eq-'+(delta>0?'up':'down')+i;b.textContent=delta>0?'▴':'▾';
   b.title=say(`${AX[i]} ${delta>0?'升次':'降次'}（0～4）`,`${delta>0?'Increase':'Decrease'} ${AX[i]} exponent (0–4)`);b.setAttribute('aria-label',b.title);
   b.onclick=()=>{const next=degreeFor(i)+delta;if(next<0||next>4)return;if(state.mode==='explicit'&&state.solved===i)makeImplicit();state.p[i]=next;edited();};return b;
  });
  variable.append(buttons[0],symbol,buttons[1]);term.append(input,variable);terms.push(term);
 }
 for(let i=0;i<3;i++){const operator=document.createElement('span');operator.className='equation-operator';operators.push(operator);}
 const q=field('eq-q',say('常数 Q','Constant Q'));bind(q,()=>state.q,value=>{state.q=value;});
 function syncEditor(force=false){
  const explicit=state.mode==='explicit',axes=[0,1,2].filter(i=>i!==state.solved),key=explicit?'explicit'+state.solved:'implicit';
  const focused=document.activeElement;
  if(layoutKey!==key){
   const order=explicit?[state.solved,...axes]:[0,1,2];
   operators.forEach((op,i)=>op.textContent=i===(explicit?0:2)?'=':'+');
   root.replaceChildren(summary,terms[order[0]],operators[0],terms[order[1]],operators[1],terms[order[2]],operators[2],q);layoutKey=key;
   if(root.contains(focused))focused.focus({preventScroll:true});
  }
  summary.innerHTML=equation(state);
  for(let i=0;i<3;i++){
   const input=$('eq-a'+i);if(force||document.activeElement!==input){input.value=valueFor(i);input.removeAttribute('aria-invalid');}
   const degree=degreeFor(i);$('eq-p'+i).textContent=degree;$('eq-up'+i).disabled=degree===4;$('eq-down'+i).disabled=degree===0;
  }
  if(force||document.activeElement!==q){q.value=state.q;q.removeAttribute('aria-invalid');}
  hint.textContent=explicit?say('修改左侧变量的系数或次数，将转为隐式方程。','Editing the left-side coefficient or exponent switches to implicit mode.'):say('直接输入系数和 Q · 上下箭头调整次数 0～4','Type coefficients and Q · Arrows change exponents from 0 to 4');
 }
 return {sync:syncEditor};
})();
function syncEquationEditor(force){equationEditor.sync(force);}

const axisColors=['#ff927c','#ffd574','#80bcff'];
let axesCache,traceCache,referenceCache,drawn3d='',drawn2d='';
function axisDecoration(D){
 if(axesCache?.D===D)return axesCache;
 const traces=[];
  const axisLabels=[];
  // Thicker, distinct axes pass through the true origin; arrowheads mark positive directions.
  for(let i=0;i<3;i++){
   let coords=AX.map((_,j)=>i===j?[-D,D]:[0,0]);
   traces.push({type:'scatter3d',x:coords[0],y:coords[1],z:coords[2],mode:'lines',line:{color:axisColors[i],width:6},hoverinfo:'skip',showlegend:false});
   let wings=[];
   for(let j=0;j<3;j++)if(j!==i)for(let sign of [-1,1]){let tail=[0,0,0],tip=[0,0,0];tail[i]=.88*D;tail[j]=sign*.035*D;tip[i]=.99*D;wings.push(tail,tip,null);}
   traces.push({type:'scatter3d',x:wings.map(v=>v?.[0]??null),y:wings.map(v=>v?.[1]??null),z:wings.map(v=>v?.[2]??null),mode:'lines',line:{color:axisColors[i],width:5},hoverinfo:'skip',showlegend:false});
   let end=[0,0,0];end[i]=D;axisLabels.push({x:end[0],y:end[1],z:end[2],text:'<b>+'+AX[i]+'</b>',showarrow:false,font:{size:19,color:axisColors[i]},bgcolor:'rgba(11,19,33,0.82)',borderpad:3,yshift:14});
  }
  traces.push({type:'scatter3d',x:[0],y:[0],z:[0],mode:'markers',marker:{color:'#ffffff',size:5,line:{color:'#0b1321',width:2}},name:'Origin',hovertemplate:'Origin (0, 0, 0)<extra></extra>',showlegend:false});
  axisLabels.push({x:0,y:0,z:0,text:'O (0, 0, 0)',showarrow:true,arrowhead:0,arrowcolor:'#eef5ff',arrowwidth:1,ax:-42,ay:38,font:{size:12,color:'#ffffff'},bgcolor:'rgba(11,19,33,0.85)',borderpad:3});
 return axesCache={D,traces,axisLabels};
}
function schedule(){pending=true;clearTimeout(timer);timer=setTimeout(()=>{timer=null;lastRender=render();},160);return lastRender;}
function makeTrace(c,quality){let axis=state.traceAxis,uv=[0,1,2].filter(i=>i!==axis),q=c.q-c.a[axis]*state.k**c.p[axis];let t=trace2(uv.map(i=>c.a[i]),uv.map(i=>c.p[i]),q,state.D,[121,201,321][quality]);return {...t,axis,uv,q};}
function pathArrays(paths,points,mapper){let arr=[[],[],[]];for(let path of paths){for(let p of path){let v=mapper(p);v.forEach((x,i)=>arr[i].push(x));}arr.forEach(a=>a.push(null));}return arr;}
function traceLayers(t){let D=state.D,axis=t.axis,uv=t.uv,map=v=>{let pt=[];pt[axis]=state.k;pt[uv[0]]=v[0];pt[uv[1]]=v[1];return pt;};let coords=pathArrays(t.paths,t.points,map),corners=[[-D,-D],[D,-D],[D,D],[-D,D]].map(map),layers=[{type:'mesh3d',x:corners.map(v=>v[0]),y:corners.map(v=>v[1]),z:corners.map(v=>v[2]),i:[0,0],j:[1,2],k:[2,3],color:'#ce9ab9',opacity:.12,hoverinfo:'skip',showlegend:false},{type:'scatter3d',x:coords[0],y:coords[1],z:coords[2],mode:'lines',line:{color:'#ff88b0',width:6},showlegend:false,hoverinfo:'skip'}];
 if(t.points.length){let pts=t.points.map(map);layers.push({type:'scatter3d',x:pts.map(v=>v[0]),y:pts.map(v=>v[1]),z:pts.map(v=>v[2]),mode:'markers',marker:{color:'#ff88b0',size:6},showlegend:false});}return layers;}
async function render(){
 if(busy){pending=true;return;}busy=true;pending=false;const started=performance.now();$('error').textContent='';
 try{
  const quality=drawingQuality();
  let c=canonical(state),cl=classify(c),key=JSON.stringify([c,state.D,quality,state.style,state.compare]),D=state.D;
  const traceKey=JSON.stringify([c,D,quality,state.traceAxis,state.k]),key3d=JSON.stringify([key,state.grid,state.trace,state.trace?[state.traceAxis,state.k]:null]),key2d=traceKey;
  if(key3d===drawn3d&&key2d===drawn2d)return;
  $('status').textContent='Updating…';
  if(key!==geometryKey){
   geometry=surfaceTraces(c,D,quality,state.style);
   if(state.compare&&(cl.name.startsWith('Hyperboloid')||cl.name==='Elliptic cone')){
    const referenceKey=JSON.stringify([c.a,c.p,D,quality]);
    if(referenceCache?.key!==referenceKey)referenceCache={key:referenceKey,data:surfaceTraces({...c,q:0},D,quality,'transparent',true)};
    geometry.push(...referenceCache.data);
   }geometryKey=key;
  }
  if(traceCache?.key!==traceKey)traceCache={key:traceKey,value:makeTrace(c,quality)};
  let traces=geometry.slice(),t=traceCache.value;if(state.trace)traces.push(...traceLayers(t));
  const decoration=axisDecoration(D),axisLabels=decoration.axisLabels;traces.push(...decoration.traces);
  const axis=k=>({title:{text:k,font:{size:22,color:axisColors[AX.indexOf(k)]}},range:[-D,D],showgrid:state.grid,gridcolor:'#40566e',gridwidth:1,zeroline:false,showline:true,linecolor:'#7e95ad',linewidth:2,showbackground:true,backgroundcolor:'#111e2d',tickfont:{size:13,color:'#cfdeee'},ticks:'outside',tickcolor:'#a7bed6',ticklen:5,nticks:5,showspikes:false});
  let layout={paper_bgcolor:'#0e1726',font:{color:'#b4c3d5',family:'system-ui'},margin:{l:0,r:0,t:0,b:0},showlegend:false,uirevision:'surface-lab-camera',scene:{xaxis:axis('x'),yaxis:axis('y'),zaxis:axis('z'),annotations:axisLabels,aspectmode:'cube',camera:currentCamera(),dragmode:'orbit'},annotations:[]};
  if(['Empty set','All of space'].includes(cl.name))layout.annotations=[{text:cl.name==='Empty set'?'No real solutions':'Every point satisfies this equation',xref:'paper',yref:'paper',x:.5,y:.95,showarrow:false,font:{color:'#f8b85a',size:15}}];
  let xy=pathArrays(t.paths,t.points,v=>v),data2=[{type:'scatter',mode:'lines',x:xy[0],y:xy[1],line:{color:'#ff88b0',width:2.5},hovertemplate:`${AX[t.uv[0]]}: %{x:.4g}<br>${AX[t.uv[1]]}: %{y:.4g}<extra></extra>`}];
  if(t.points.length)data2.push({type:'scatter',mode:'markers',x:t.points.map(p=>p[0]),y:t.points.map(p=>p[1]),marker:{size:9,color:'#ff88b0'}});
  let two={paper_bgcolor:'#0b1220',plot_bgcolor:t.whole?'#282035':'#0b1220',margin:{l:47,r:16,t:15,b:38},showlegend:false,font:{color:'#cfdeee',size:12},xaxis:{title:{text:AX[t.uv[0]],standoff:5,font:{size:16,color:axisColors[t.uv[0]]}},range:[-D,D],gridcolor:'#31465d',zerolinecolor:axisColors[t.uv[1]],zerolinewidth:2,constrain:'domain',nticks:7},yaxis:{title:{text:AX[t.uv[1]],standoff:3,font:{size:16,color:axisColors[t.uv[1]]}},range:[-D,D],gridcolor:'#31465d',zerolinecolor:axisColors[t.uv[0]],zerolinewidth:2,scaleanchor:'x',scaleratio:1,constrain:'domain',nticks:7},annotations:[]};
  if(!t.paths.length&&!t.points.length)two.annotations=[{text:t.whole?'Entire plane':'No trace in this window',xref:'paper',yref:'paper',x:.5,y:.9,showarrow:false,font:{color:'#f8b85a',size:13}}];
  $('traceEq').innerHTML=`<span class="small">${AX[t.axis]} = ${fmt(state.k)} → </span>`+expr(t.uv.map(i=>c.a[i]),t.uv.map(i=>c.p[i]),t.uv.map(i=>AX[i]))+' = '+fmt(t.q);
  $('traceNote').textContent=t.note+(!state.trace?' (3D cutting plane hidden.)':'');
  const drew3d=key3d!==drawn3d;
  await Promise.all([drew3d?cameraController.render(traces,layout,plotConfig):Promise.resolve(),key2d!==drawn2d?Plotly.react('plot2d',data2,two,{...plotConfig,scrollZoom:false,displayModeBar:false}):Promise.resolve()]);
  drawn3d=key3d;drawn2d=key2d;
  let analytic=!geometry.some(t=>t.type==='isosurface');$('status').textContent=(analytic?'Analytic geometry':'Sampled F = 0')+' · '+Math.round(performance.now()-started)+' ms';
  window.__lastResult={classification:cl.name,trace:t.note,surfaceCount:geometry.length,elapsed:performance.now()-started,quality};
  $('status').textContent+=' · '+qualityLabel(quality);
  if(drew3d&&state.autoQuality)adaptiveQuality.observe(window.__lastResult.elapsed);
 }catch(e){$('error').textContent='Unable to render: '+e.message+' Try a lower quality or a WebGL-enabled browser.';$('status').textContent='Rendering error';console.error(e);}finally{busy=false;if(pending)schedule();}
}

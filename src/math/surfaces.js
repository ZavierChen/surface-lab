const gridCache=new Map();
let scalarCache;
let patchTopology;
function indexedPatch(rows,base,color){
 const height=rows.length,width=rows[0].length,x=[],y=[],z=[],lookup=new Int32Array(height*width);lookup.fill(-1);
 for(let row=0;row<height;row++)for(let col=0;col<width;col++){
  const p=rows[row][col];if(!p)continue;lookup[row*width+col]=x.length;x.push(p[0]);y.push(p[1]);z.push(p[2]);
 }
 // Explicit triangles bypass Plotly surface-grid reconstruction. Reuse topology
 // while Q moves; only vertex positions change. Missing vertices stay holes.
 if(!patchTopology||patchTopology.height!==height||patchTopology.width!==width){
  const i=[],j=[],k=[];
  for(let row=0;row<height-1;row++)for(let col=0;col<width-1;col++){
   const a=row*width+col;i.push(a,a+1);j.push(a+width,a+width);k.push(a+1,a+width+1);
  }
  patchTopology={height,width,i,j,k};
 }
 let {i,j,k}=patchTopology;
 if(x.length!==height*width){
  const ii=[],jj=[],kk=[];for(let f=0;f<i.length;f++){
   const a=lookup[i[f]],b=lookup[j[f]],c=lookup[k[f]];if(a<0||b<0||c<0)continue;ii.push(a);jj.push(b);kk.push(c);
  }i=ii;j=jj;k=kk;
 }
 return {type:'mesh3d',x,y,z,i,j,k,color,opacity:base.opacity,lighting:base.lighting,flatshading:false,hoverinfo:'skip',showscale:false,showlegend:false};
}
function grid(D,n){let key=D+':'+n;if(gridCache.has(key))return gridCache.get(key);let s=linspace(-D,D,n),x=[],y=[],z=[],powers=s.map(v=>[0,v,v*v,v*v*v,v**4]);for(let i=0;i<n;i++)for(let j=0;j<n;j++)for(let k=0;k<n;k++){x.push(s[i]);y.push(s[j]);z.push(s[k]);}let g={x,y,z,powers,n};gridCache.clear();gridCache.set(key,g);return g;}
function surfaceTraces(c,D,quality,style='solid',reference=false){
 const n=quality<0?(quality===-2?9:17):[33,49,73][quality],active=[0,1,2].filter(i=>c.a[i]!==0),cl=classify(c),color=reference?'#f8b85a':'#4accc5',opacity=reference?.14:style==='transparent'?.48:style==='contour'?.78:1;
 const base={showscale:false,showlegend:false,opacity,colorscale:[[0,color],[1,color]],hoverinfo:'skip',lighting:{ambient:.62,diffuse:.8,roughness:.7,specular:.18}};
 function patch(rows){if(style!=='contour')return indexedPatch(rows,base,color);let x=[],y=[],z=[];for(let row of rows){x.push(row.map(v=>v?.[0]??null));y.push(row.map(v=>v?.[1]??null));z.push(row.map(v=>v?.[2]??null));}return {...base,type:'surface',x,y,z,connectgaps:false,contours:Object.fromEntries(AX.map(k=>[k,{show:true,color:'#173c42',width:1,highlight:false}]))};}
 function clip(v){return v.every(x=>Math.abs(x)<=D+1e-8)?v:null;}
 if(cl.name==='Empty set'||cl.name==='All of space')return [];
 if(cl.name==='Point')return [{type:'scatter3d',x:[0],y:[0],z:[0],mode:'markers',marker:{size:5,color},showlegend:false}];
 // Exact quadric parametrization preserves the neck/two components for arbitrarily small nonzero Q.
 if(active.length===3&&c.p.every(p=>p===2)){
  let signs=c.a.map(Math.sign),same=signs.every(s=>s===signs[0]),theta=linspace(0,2*Math.PI,2*n+1);
  if(same){let r=c.a.map(a=>Math.sqrt(c.q/a));return [patch(linspace(0,Math.PI,n).map(t=>theta.map(u=>clip([r[0]*Math.sin(t)*Math.cos(u),r[1]*Math.sin(t)*Math.sin(u),r[2]*Math.cos(t)]))))];}
  let axis=signs.findIndex(s=>signs.filter(v=>v===s).length===1),uv=[0,1,2].filter(i=>i!==axis),s=signs[uv[0]],q=c.q/s,b=Math.abs(c.a[axis]),ends=[];
  // Q>0 opens a waist; Q=0 reaches the vertex; Q<0 removes |axis|<sqrt(-Q/b).
  if(q>=0)ends.push(linspace(-1,1,n).map(t=>Math.sign(t)*D*t*t));else{let start=Math.sqrt(-q/b);if(start>D)return [];for(let sign of [-1,1])ends.push(linspace(0,1,n).map(t=>sign*(start+(D-start)*t*t)));}
  // Angular terms and the clipping boundary are shared by all axial samples.
  const angular=theta.map(u=>{const cs=Math.cos(u)/Math.sqrt(Math.abs(c.a[uv[0]])),sn=Math.sin(u)/Math.sqrt(Math.abs(c.a[uv[1]])),rmax=Math.min(D/Math.abs(cs),D/Math.abs(sn));return {cs,sn,valid:rmax*rmax>=q,limit:Math.min(D,Math.sqrt(Math.max(0,(rmax*rmax-q)/b)))};});
  const start=q<0?Math.sqrt(-q/b):0;
  return ends.map(ts=>{
   const rows=ts.map(t=>{const f=q<0?(Math.abs(t)-start)/(D-start||1):Math.abs(t)/D;return angular.map(({cs,sn,valid,limit})=>{
    if(!valid)return null;const ax=Math.sign(t)*(start+f*(limit-start)),r=Math.sqrt(Math.max(0,q+b*ax*ax)),v=[];v[axis]=ax;v[uv[0]]=r*cs;v[uv[1]]=r*sn;return clip(v);
   });});
   // Plotly's surface trace retains its isoline rendering in contour mode.
   return style==='contour'?patch(rows):indexedPatch(rows,base,color);
  });
 }
 let linear=active.find(i=>c.p[i]===1);
 if(cl.name==='Elliptic paraboloid'){
  const uv=active.filter(i=>i!==linear),coeff=uv.map(i=>-c.a[i]/c.a[linear]),direction=Math.sign(coeff[0]),vertex=c.q/c.a[linear],low=Math.max(0,Math.min((-D-vertex)/direction,(D-vertex)/direction)),high=Math.max((-D-vertex)/direction,(D-vertex)/direction);
  if(high<0)return [];
  return [patch(linspace(0,1,n).map(t=>linspace(0,2*Math.PI,2*n+1).map(theta=>{let du=Math.cos(theta)/Math.sqrt(Math.abs(coeff[0])),dv=Math.sin(theta)/Math.sqrt(Math.abs(coeff[1])),max=Math.min(high,(D/Math.abs(du))**2,(D/Math.abs(dv))**2);if(max<low)return null;let r=Math.sqrt(low+t*t*(max-low)),v=[];v[linear]=vertex+direction*r*r;v[uv[0]]=r*du;v[uv[1]]=r*dv;return clip(v);})))];
 }
 if(linear!==undefined){let uv=[0,1,2].filter(i=>i!==linear),s=linspace(-D,D,2*n-1);return [patch(s.map(u=>s.map(v=>{let pt=[];pt[uv[0]]=u;pt[uv[1]]=v;pt[linear]=(c.q-c.a[uv[0]]*u**c.p[uv[0]]-c.a[uv[1]]*v**c.p[uv[1]])/c.a[linear];return clip(pt);})))];}
 if(active.length===1){let axis=active[0],uv=[0,1,2].filter(i=>i!==axis);return roots(c.q/c.a[axis],c.p[axis]).filter(r=>Math.abs(r)<=D).map(r=>patch([-D,D].map(u=>[-D,D].map(v=>{let pt=[];pt[axis]=r;pt[uv[0]]=u;pt[uv[1]]=v;return pt;}))));}
 if(active.length===2&&active.every(i=>c.p[i]===2)){
  let axis=[0,1,2].find(i=>!active.includes(i)),t=trace2(active.map(i=>c.a[i]),[2,2],c.q,D,n*4);
  if(t.points.length){let pt=[0,0,0],end=[0,0,0];pt[axis]=-D;end[axis]=D;return [{type:'scatter3d',x:[pt[0],end[0]],y:[pt[1],end[1]],z:[pt[2],end[2]],mode:'lines',line:{color,width:6},showlegend:false}];}
  return t.paths.map(path=>patch([-D,D].map(d=>path.map(v=>{let pt=[];pt[axis]=d;active.forEach((i,k)=>pt[i]=v[k]);return pt;}))));
 }
 // General F=0: cache coordinates and coordinate powers; only recompute scalar values on changes.
 const g=grid(D,quality<0?(quality===-2?13:19):[29,41,57][quality]),scalarKey=JSON.stringify([c.a,c.p,D,quality]);
 if(scalarCache?.key!==scalarKey){
  const weighted=c.a.map((a,axis)=>g.powers.map(p=>a*p[c.p[axis]])),value=new Array(g.n**3);let idx=0;
  for(let i=0;i<g.n;i++)for(let j=0;j<g.n;j++){const row=weighted[0][i]+weighted[1][j];for(let k=0;k<g.n;k++)value[idx++]=row+weighted[2][k];}
  scalarCache={key:scalarKey,value};
 }
 // Moving Q selects a different level of the same scalar field; the samples
 // themselves do not change. Style and trace controls also reuse this buffer.
 return [{...base,type:'isosurface',x:g.x,y:g.y,z:g.z,value:scalarCache.value,isomin:c.q,isomax:c.q,surface:{count:1},caps:{x:{show:false},y:{show:false},z:{show:false}},flatshading:false}];
}
if(typeof module!=='undefined')module.exports={PRESETS,canonical,evaluate,classify,equation,trace2,surfaceTraces,roots,grid};

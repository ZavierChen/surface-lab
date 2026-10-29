function roots(r,p){if(p%2===0)return r<0?[]:r===0?[0]:[-(r**(1/p)),r**(1/p)];return [Math.sign(r)*Math.abs(r)**(1/p)];}
function linspace(a,b,n){return Array.from({length:n},(_,i)=>a+(b-a)*i/(n-1));}
// A trace substitutes the fixed coordinate into F, leaving a*u^p+b*v^r = remaining Q.
function trace2(a,p,q,D,n=181){
 const paths=[],points=[],active=[0,1].filter(i=>a[i]!==0),S=linspace(-D,D,n);
 function add(path){let part=[];for(let v of path){if(v&&v.every(Number.isFinite)&&v.every(x=>Math.abs(x)<=D+1e-8)){part.push(v);}else{if(part.length>1)paths.push(part);part=[];}}if(part.length>1)paths.push(part);}
 if(!active.length)return {paths,points,whole:q===0,note:q===0?'The entire cutting plane lies on the surface.':'No intersection.'};
 if(active.length===1){let i=active[0];for(let r of roots(q/a[i],p[i]))if(Math.abs(r)<=D){add(i===0?[[r,-D],[r,D]]:[[-D,r],[D,r]]);}return {paths,points,note:paths.length?'Straight-line trace(s).':'No intersection in this window.'};}
 if(p.every(v=>v===2)){
  const same=a[0]*a[1]>0;
  if(same){if(q===0)points.push([0,0]);else if(q/a[0]>0){let r=[Math.sqrt(q/a[0]),Math.sqrt(q/a[1])];add(linspace(0,2*Math.PI,Math.max(n,241)).map(t=>[r[0]*Math.cos(t),r[1]*Math.sin(t)]));return {paths,points,note:`Ellipse · semiaxes √(${fmt(q)}/${fmt(a[0])}) = ${fmt(r[0])}, √(${fmt(q)}/${fmt(a[1])}) = ${fmt(r[1])}.`};}}
  else if(q===0){let m=Math.sqrt(-a[0]/a[1]);for(let sign of [-1,1]){let extent=Math.min(D,D/m);add([[-extent,-sign*m*extent],[extent,sign*m*extent]]);}}
  else {let i=q/a[0]>0?0:1,j=1-i,r=Math.sqrt(q/a[i]),b=Math.sqrt(-q/a[j]);let T=Math.asinh(D/b);for(let sign of [-1,1])add(linspace(-T,T,n).map(t=>{let v=[];v[i]=sign*r*Math.cosh(t);v[j]=b*Math.sinh(t);return v;}));}
  return {paths,points,note:points.length?'A single point at the origin.':paths.length?(q===0?'Two intersecting lines.':'Hyperbola.'):'No intersection in this window.'};
 }
 let linear=p.findIndex(v=>v===1);
 if(linear>=0){let j=1-linear;add(S.map(t=>{let v=[];v[j]=t;v[linear]=(q-a[j]*t**p[j])/a[linear];return v;}));return {paths,points,note:p[j]===2?'Parabolic trace.':p[j]===1?'Straight-line trace.':'Polynomial trace.'};}
 // Generic marching squares. Shared edges use linear interpolation; resolution controls approximation.
 let values=S.map(u=>S.map(v=>a[0]*u**p[0]+a[1]*v**p[1]-q));
 for(let i=0;i<n-1;i++)for(let j=0;j<n-1;j++){
  let xy=[[S[i],S[j]],[S[i+1],S[j]],[S[i+1],S[j+1]],[S[i],S[j+1]]],vs=[values[i][j],values[i+1][j],values[i+1][j+1],values[i][j+1]],hits=[];
  for(let e=0;e<4;e++){let f=(e+1)%4;if((vs[e]<=0)!==(vs[f]<=0)){let t=vs[e]/(vs[e]-vs[f]);hits.push(xy[e].map((x,k)=>x+t*(xy[f][k]-x)));}}
  if(hits.length===2)paths.push(hits);else if(hits.length===4){let center=a[0]*((S[i]+S[i+1])/2)**p[0]+a[1]*((S[j]+S[j+1])/2)**p[1]-q;let pairs=(center<=0)===(vs[0]<=0)?[[0,1],[2,3]]:[[0,3],[1,2]];for(let pair of pairs)paths.push(pair.map(k=>hits[k]));}
 }
 return {paths,points,note:paths.length?'Numerical polynomial trace; increase quality for finer detail.':'No resolved trace in this window; try a larger domain or higher quality.'};
}

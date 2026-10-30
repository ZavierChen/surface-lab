const assert=require('assert/strict');const m=require('./math-core');let count=0;
function check(c,name){assert.equal(m.classify(c).name,name);count++;}
for(const p of m.PRESETS){let s={mode:'implicit',...p},c=m.canonical(s);check(c,p.name==='One-sheet hyperboloid'?'Hyperboloid of one sheet':p.name==='Two-sheet hyperboloid'?'Hyperboloid of two sheets':p.name);let plots=m.surfaceTraces(c,5,0);assert(plots.length>0,p.name+' empty');let tested=0;for(let t of plots)if(t.type==='surface')for(let i=0;i<t.x.length;i++)for(let j=0;j<t.x[i].length;j++){let pt=[t.x[i][j],t.y[i][j],t.z[i][j]];if(pt.some(v=>v===null))continue;assert(Math.abs(m.evaluate(c,pt))<1e-8,p.name+' residual');tested++;}assert(tested>10,p.name+' insufficient vertices');}
for(let q of [-1,-.000001,0,.000001,1]){let c={a:[1,-1,1],p:[2,2,2],q};check(c,q<0?'Hyperboloid of two sheets':q===0?'Elliptic cone':'Hyperboloid of one sheet');let traces=m.surfaceTraces(c,5,1);assert.equal(traces.length,q<0?2:1);let minRad=Infinity,minY=Infinity;for(let t of traces)for(let i=0;i<t.x.length;i++)for(let j=0;j<t.x[i].length;j++){let pt=[t.x[i][j],t.y[i][j],t.z[i][j]];if(pt.includes(null))continue;assert(Math.abs(m.evaluate(c,pt))<1e-8);minRad=Math.min(minRad,Math.hypot(pt[0],pt[2]));minY=Math.min(minY,Math.abs(pt[1]));}if(q>=0)assert(Math.abs(minRad-Math.sqrt(q))<1e-8);else assert(Math.abs(minY-Math.sqrt(-q))<1e-8);}
const cases=[[[1,1,1],[2,2,2],-1,'Empty set'],[[1,1,1],[2,2,2],0,'Point'],[[-1,-1,-1],[2,2,2],-1,'Sphere'],[[1,-1,1],[2,1,2],0,'Elliptic paraboloid'],[[1,-1,-1],[2,1,2],0,'Hyperbolic paraboloid / saddle'],[[1,0,2],[2,4,2],1,'Elliptic cylinder'],[[1,0,-1],[2,2,2],0,'Intersecting planes'],[[1,0,1],[2,2,2],0,'Line'],[[0,1,0],[2,2,2],1,'Parallel planes'],[[0,1,0],[2,2,2],0,'Plane'],[[0,0,0],[4,4,4],0,'All of space'],[[0,0,0],[1,1,1],1,'Empty set'],[[1,1,1],[1,1,1],1,'Plane'],[[1,1,0],[2,1,1],0,'Parabolic cylinder'],[[1,1,1],[4,2,2],1,'Nonstandard algebraic surface']];
for(let [a,p,q,name] of cases)check({a,p,q},name);
for(let solved of [0,1,2])for(let B of [-1,1]){let c=m.canonical({mode:'explicit',solved,a:[2,B,99],p:[2,2,2],q:3});check(c,B>0?'Elliptic paraboloid':'Hyperbolic paraboloid / saddle');let pt=[1,1,1];pt[solved]=2+B+3;assert.equal(m.evaluate(c,pt),0);}
for(let q of [-1,0,1,2]){let t=m.trace2([2,1],[2,2],q,5);if(q<0)assert.equal(t.paths.length,0);else if(q===0)assert.equal(t.points.length,1);else{assert(t.paths.length);for(let path of t.paths)for(let [x,z]of path)assert(Math.abs(2*x*x+z*z-q)<1e-9);}}
for(let a of [[1,-1],[1,0],[0,0],[1,1]])for(let q of [-1,0,1]){let t=m.trace2(a,[2,2],q,5);for(let path of t.paths)for(let [u,v]of path)assert(Math.abs(a[0]*u*u+a[1]*v*v-q)<1e-8);}
assert(m.surfaceTraces({a:[1,1,1],p:[4,3,2],q:1},5,0).some(t=>t.type==='isosurface'));
// Zero-degree terms remain editable in state but become constants in geometry.
for(const [s,name] of [
 [{mode:'implicit',a:[2,1,1],p:[0,2,2],q:3},'Elliptic cylinder'],
 [{mode:'implicit',a:[2,-1,3],p:[0,0,0],q:4},'All of space'],
 [{mode:'implicit',a:[2,-1,3],p:[0,0,0],q:5},'Empty set'],
 [{mode:'explicit',solved:1,a:[2,3,0],p:[0,2,0],q:4},'Plane'],
 [{mode:'explicit',solved:2,a:[2,3,0],p:[0,2,2],q:4},'Parabolic cylinder']
]){
 const original=JSON.stringify(s),c=m.canonical(s);check(c,name);assert.equal(JSON.stringify(s),original,'Normalization mutated editor state');
 for(const v of [[0,0,0],[1,-2,3],[-.5,2,0]]){
  let expected;
  if(s.mode==='explicit'){const axes=[0,1,2].filter(i=>i!==s.solved);expected=s.a[0]*v[axes[0]]**s.p[axes[0]]+s.a[1]*v[axes[1]]**s.p[axes[1]]+s.q-v[s.solved];}
  else expected=s.a.reduce((sum,a,i)=>sum+a*v[i]**s.p[i],-s.q);
  assert(Math.abs(m.evaluate(c,v)-expected)<1e-9);
 }
 for(const trace of m.surfaceTraces(c,5,0))if(trace.type==='surface')for(let i=0;i<trace.x.length;i++)for(let j=0;j<trace.x[i].length;j++){
  const point=[trace.x[i][j],trace.y[i][j],trace.z[i][j]];if(!point.includes(null))assert(Math.abs(m.evaluate(c,point))<1e-8);
 }
}
console.log(`${count} classification assertions; all 8 preset meshes, Q neck/gap checks, explicit axes, and analytic trace residuals passed.`);

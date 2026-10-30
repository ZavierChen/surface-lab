const assert=require('node:assert/strict'),m=require('./math-core');
let vertices=0,faces=0;
function verify(c,D,quality){
 const meshes=m.surfaceTraces(c,D,quality,'solid'),grids=m.surfaceTraces(c,D,quality,'contour');
 assert.equal(meshes.length,grids.length);
 for(let part=0;part<meshes.length;part++){
  const mesh=meshes[part],grid=grids[part];if(grid.type!=='surface')continue;
  assert.equal(mesh.type,'mesh3d');const expected=[];
  for(let row=0;row<grid.x.length;row++)for(let col=0;col<grid.x[row].length;col++){
   const p=[grid.x[row][col],grid.y[row][col],grid.z[row][col]];if(!p.includes(null))expected.push(p);
  }
  assert.equal(mesh.x.length,expected.length,'Fast path changed vertex resolution');
  expected.forEach((p,v)=>{assert.deepEqual([mesh.x[v],mesh.y[v],mesh.z[v]],p);assert(p.every(x=>Number.isFinite(x)&&Math.abs(x)<=D+1e-7));assert(Math.abs(m.evaluate(c,p))<1e-7);vertices++;});
  assert.equal(mesh.i.length,mesh.j.length);assert.equal(mesh.i.length,mesh.k.length);
  for(let f=0;f<mesh.i.length;f++){for(const v of [mesh.i[f],mesh.j[f],mesh.k[f]])assert(Number.isInteger(v)&&v>=0&&v<mesh.x.length);faces++;}
 }
 return meshes;
}
for(const preset of m.PRESETS)for(const ql of [-2,-1,0,1,2])verify(m.canonical({mode:'implicit',...preset}),5,ql);
for(const axis of [0,1,2])for(const q of [-1,-1e-8,0,1e-8,1,100])for(const D of [.3,1,5])for(const ql of [-2,-1,0]){
 const a=[1,2,3];a[axis]=-2;const c={a,p:[2,2,2],q},meshes=verify(c,D,ql);
 if(q<0)for(const mesh of meshes)if(mesh.type==='mesh3d'){
  const coords=[mesh.x,mesh.y,mesh.z][axis],sign=Math.sign(coords[0]);
  assert(coords.every(v=>Math.sign(v)===sign&&Math.abs(v)>=Math.sqrt(-q/2)-1e-8),'Two sheets were bridged across their gap');
 }
}
// Q is the isovalue, not a value subtracted across every sampled voxel.
const c={a:[1,-2,3],p:[4,3,2],q:1};const first=m.surfaceTraces(c,3,0)[0],next=m.surfaceTraces({...c,q:-.5},3,0)[0];
assert.equal(first.type,'isosurface');assert.strictEqual(first.value,next.value);assert.strictEqual(first.x,next.x);assert.equal(next.isomin,-.5);assert.equal(next.isomax,-.5);
for(let n=0;n<next.value.length;n+=137)assert(Math.abs(next.value[n]-next.isomin-m.evaluate({...c,q:-.5},[next.x[n],next.y[n],next.z[n]]))<1e-8);
const changed=m.surfaceTraces({...c,a:[2,-2,3]},3,0)[0];assert.notStrictEqual(changed.value,next.value);
for(const [quality,size] of [[-2,13],[-1,19]]){
 const preview=m.surfaceTraces(c,3,quality)[0];assert.equal(preview.value.length,size**3);
 for(let n=0;n<preview.value.length;n+=37)assert(Math.abs(preview.value[n]-c.q-m.evaluate(c,[preview.x[n],preview.y[n],preview.z[n]]))<1e-8);
}
console.log(`Indexed meshes: ${vertices} unchanged analytic vertices, ${faces} valid faces, clipped domains, all hyperboloid axes, Q=0 transitions and scalar-field cache passed.`);

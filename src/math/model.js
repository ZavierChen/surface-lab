/* Surface Lab: axis-aligned separable polynomials, with exact quadric handling. */
const AX=['x','y','z'];
const PRESETS=[
 {name:'Sphere',a:[1,1,1],p:[2,2,2],q:1},
 {name:'Ellipsoid',a:[1/9,1/25,1/4],p:[2,2,2],q:1},
 {name:'One-sheet hyperboloid',a:[1,-1,1],p:[2,2,2],q:1},
 {name:'Two-sheet hyperboloid',a:[-1,1,-1],p:[2,2,2],q:1},
 {name:'Elliptic cone',a:[1,-1,2],p:[2,2,2],q:0},
 {name:'Elliptic paraboloid',mode:'explicit',solved:1,a:[2,1,0],p:[2,2,2],q:0},
 {name:'Hyperbolic paraboloid / saddle',mode:'explicit',solved:1,a:[1,-1,0],p:[2,2,2],q:0},
 {name:'Elliptic cylinder',a:[1,0,2],p:[2,2,2],q:1}
];
function canonical(s){
 if(s.mode!=='explicit')return {a:s.a.slice(),p:s.p.slice(),q:s.q};
 const axes=[0,1,2].filter(i=>i!==s.solved), a=[0,0,0],p=s.p.slice();
 a[s.solved]=-1;p[s.solved]=1;a[axes[0]]=s.a[0];a[axes[1]]=s.a[1];
 return {a,p,q:-s.q};
}
function evaluate(c,v){return c.a.reduce((t,a,i)=>t+a*v[i]**c.p[i],-c.q);}
function fmt(x){if(Object.is(x,-0)||x===0)return '0';return Math.abs(x)<.0001?x.toExponential(3):Number(x.toPrecision(6)).toString();}
function expr(a,p,axes=AX){let s='';a.forEach((v,i)=>{if(v===0)return;const mag=Math.abs(v),den=Math.round(1/mag),reciprocal=den>1&&den<=1000&&Math.abs(mag-1/den)<1e-14,variable=axes[i]+(p[i]===1?'':`<sup>${p[i]}</sup>`);s+=(s?(v<0?' − ':' + '):(v<0?'−':''))+(reciprocal?variable+'/'+den:(mag===1?'':fmt(mag)+' ')+variable);});return s||'0';}
function equation(s){if(s.mode==='explicit'){let axes=[0,1,2].filter(i=>i!==s.solved);let e=expr(s.a.slice(0,2),axes.map(i=>s.p[i]),axes.map(i=>AX[i]));return AX[s.solved]+' = '+e+(s.q===0?'':(s.q<0?' − ':' + ')+fmt(Math.abs(s.q)));}return expr(s.a,s.p)+' = '+fmt(s.q);}

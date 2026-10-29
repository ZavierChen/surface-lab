// Classify only active terms; normalize signs against Q, never infer a saddle from one exponent alone.
function classify(c){
 const active=[0,1,2].filter(i=>c.a[i]!==0), sq=active.filter(i=>c.p[i]===2), lin=active.filter(i=>c.p[i]===1);
 const out=(name,why,axis='—',opening='—')=>({name,why,axis,opening});
 if(active.some(i=>c.p[i]>2))return out('Nonstandard algebraic surface','No standard quadric classification. An active term has power 3 or 4.');
 if(!active.length)return out(c.q===0?'All of space':'Empty set',c.q===0?'The equation is 0 = 0; every point satisfies it.':'A nonzero constant cannot equal zero.');
 if(!sq.length)return out('Plane','All active terms are first degree; this is a linear equation.');
 if(lin.length){
  if(sq.length===2&&lin.length===1){let t=lin[0], same=Math.sign(c.a[sq[0]])===Math.sign(c.a[sq[1]]);return out(same?'Elliptic paraboloid':'Hyperbolic paraboloid / saddle',same?'Solving for the linear variable leaves two squared terms of the same sign.':'Solving for the linear variable leaves squared terms of opposite signs.',AX[t],same?( -c.a[sq[0]]/c.a[t]>0?'+':'−')+AX[t]:'Opposite curvatures');}
  if(sq.length===1){let absent=[0,1,2].filter(i=>!active.includes(i));return out('Parabolic cylinder','One squared term and nonzero linear terms form a parabola extended along a direction in the linear-variable plane.',absent.length?AX[absent[0]]:`direction perpendicular to (${lin.map(i=>fmt(c.a[i])).join(', ')}) in the ${lin.map(i=>AX[i]).join('–')} plane`);}
 }
 const signs=sq.map(i=>Math.sign(c.a[i])),same=signs.every(x=>x===signs[0]);
 if(sq.length===3){
  if(same){if(c.q===0)return out('Point','A sum of same-sign squares is zero only at the origin.');if(c.q*signs[0]<0)return out('Empty set','Same-sign squares cannot equal a constant of the opposite sign.');let sphere=c.a.every(v=>v===c.a[0]);return out(sphere?'Sphere':'Ellipsoid','After division by Q, all three squared coefficients are positive.');}
  let minority=sq.find(i=>signs.filter(v=>v===Math.sign(c.a[i])).length===1);
  if(c.q===0)return out('Elliptic cone','Mixed-sign squares equal zero; both nappes meet at the origin.',AX[minority],'Both ±'+AX[minority]);
  let positives=sq.filter(i=>c.a[i]/c.q>0);let one=positives.length===2, axis=one?sq.find(i=>c.a[i]/c.q<0):positives[0];return out(one?'Hyperboloid of one sheet':'Hyperboloid of two sheets',one?'After division by Q, two squares are positive and one is negative. The negative variable gives the axis.':'After division by Q, one square is positive and two are negative. The positive variable gives the axis.',AX[axis],one?'Connected around '+AX[axis]:'Two sheets along ±'+AX[axis]);
 }
 let absent=[0,1,2].filter(i=>!active.includes(i));
 if(sq.length===2){
  if(c.q===0)return out(same?'Line':'Intersecting planes',same?'Both squared variables must be zero; the absent variable is free.':'A difference of squares factors into two planes.',AX[absent[0]]);
  if(same)return out(c.q*signs[0]>0?'Elliptic cylinder':'Empty set',c.q*signs[0]>0?'An ellipse is extended along the absent variable.':'The squared terms have the wrong sign for this constant.',AX[absent[0]]);
  return out('Hyperbolic cylinder','A hyperbola is extended along the absent variable.',AX[absent[0]]);
 }
 const r=c.q/c.a[sq[0]];return out(r<0?'Empty set':r===0?'Plane':'Parallel planes',r<0?'A real square cannot be negative.':r===0?'The squared coordinate must be zero.':'The squared coordinate has two constant real values.');
}

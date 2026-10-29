const ZH={
'Sphere':'球面','Ellipsoid':'椭球面','One-sheet hyperboloid':'单叶双曲面','Two-sheet hyperboloid':'双叶双曲面','Hyperboloid of one sheet':'单叶双曲面','Hyperboloid of two sheets':'双叶双曲面','Elliptic cone':'椭圆锥面','Elliptic paraboloid':'椭圆抛物面','Hyperbolic paraboloid / saddle':'双曲抛物面（马鞍面）','Elliptic cylinder':'椭圆柱面','Hyperbolic cylinder':'双曲柱面','Parabolic cylinder':'抛物柱面','Nonstandard algebraic surface':'非标准代数曲面','All of space':'整个三维空间','Empty set':'空集（无实数解）','Plane':'平面','Point':'一个点','Line':'一条直线','Intersecting planes':'两个相交平面','Parallel planes':'两个平行平面',
'No standard quadric classification. An active term has power 3 or 4.':'含有非零的三次项或四次项，不属于标准二次曲面。',
'The equation is 0 = 0; every point satisfies it.':'方程为 0 = 0，空间中的每个点都满足。','A nonzero constant cannot equal zero.':'零不可能等于非零常数，因此没有实数解。',
'All active terms are first degree; this is a linear equation.':'所有非零项都是一次项，因此表示一个平面。',
'Solving for the linear variable leaves two squared terms of the same sign.':'把一次项变量单独放在一边后，两个平方项同号，所以是椭圆抛物面。',
'Solving for the linear variable leaves squared terms of opposite signs.':'把一次项变量单独放在一边后，两个平方项异号；两个方向弯曲相反，所以是马鞍面。',
'One squared term and nonzero linear terms form a parabola extended along a direction in the linear-variable plane.':'一个平方项与一次项构成抛物线，并沿自由方向延伸，形成抛物柱面。',
'A sum of same-sign squares is zero only at the origin.':'同号平方项之和等于零，只有原点满足。','Same-sign squares cannot equal a constant of the opposite sign.':'同号平方项之和不可能等于异号常数。',
'After division by Q, all three squared coefficients are positive.':'两边除以 Q 后，三个平方项系数都为正；系数相同是球面，不同则是椭球面。',
'Mixed-sign squares equal zero; both nappes meet at the origin.':'平方项有正有负，右侧等于零；上下两部分在原点相接，形成锥面。',
'After division by Q, two squares are positive and one is negative. The negative variable gives the axis.':'两边除以 Q 后，两个平方项为正、一个为负。负项对应的变量决定对称轴，曲面连成一片。',
'After division by Q, one square is positive and two are negative. The positive variable gives the axis.':'两边除以 Q 后，一个平方项为正、两个为负。正项对应的变量决定对称轴，曲面分成两片。',
'Both squared variables must be zero; the absent variable is free.':'两个平方项对应的变量必须为零，缺失的变量自由变化，因此是一条直线。','A difference of squares factors into two planes.':'平方差可以分解为两个一次因式，分别对应两个相交平面。',
'An ellipse is extended along the absent variable.':'椭圆沿方程中缺失的变量方向平移，形成椭圆柱面。','The squared terms have the wrong sign for this constant.':'平方项的符号与右侧常数不相容，因此没有实数解。','A hyperbola is extended along the absent variable.':'双曲线沿方程中缺失的变量方向平移，形成双曲柱面。',
'A real square cannot be negative.':'实数的平方不可能为负数。','The squared coordinate must be zero.':'平方项对应的坐标只能为零，另外两个坐标自由变化。','The squared coordinate has two constant real values.':'平方项对应的坐标有一正一负两个定值，分别形成平行平面。',
'Opposite curvatures':'两个方向弯曲相反','The entire cutting plane lies on the surface.':'整个切平面都在曲面上。','No intersection.':'没有交点。','Straight-line trace(s).':'截线为直线（可能有多条）。','No intersection in this window.':'当前范围内没有交点。','A single point at the origin.':'截面退化为原点这一个点。','Two intersecting lines.':'截线为两条相交直线。','Hyperbola.':'截线为双曲线。','Parabolic trace.':'截线为抛物线。','Straight-line trace.':'截线为直线。','Polynomial trace.':'截线为多项式曲线。','Numerical polynomial trace; increase quality for finer detail.':'数值近似的多项式截线；提高画质可显示更多细节。','No resolved trace in this window; try a larger domain or higher quality.':'当前范围内未解析出截线；可调整显示范围或提高画质。'
};
function zh(s){
 if(ZH[s])return ZH[s];
 if(s.startsWith('Both ±'))return '沿 ±'+s.slice(6)+' 双向张开';
 if(s.startsWith('Connected around '))return '环绕 '+s.slice(17)+' 轴连成一片';
 if(s.startsWith('Two sheets along ±'))return '沿 ±'+s.slice(18)+' 分成两片';
 if(s.startsWith('direction perpendicular to '))return s.replace('direction perpendicular to ','垂直于 ').replace(' in the ','，位于 ').replace(' plane',' 平面内的方向');
 if(s.startsWith('Ellipse · semiaxes '))return s.replace('Ellipse · semiaxes ','椭圆 · 两个半轴：').replaceAll(' = ',' ≈ ').replace(/\.$/,'');
 return s;
}
const PRESET_FORMULAS=['x² + y² + z² = 1','x²/9 + y²/25 + z²/4 = 1','x² + z² − y² = 1','y² − x² − z² = 1','y² = x² + 2z²','y = 2x² + z²','y = x² − z²','x² + 2z² = 1'];

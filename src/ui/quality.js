// Use a 20 updates/s draw-time budget, not a claim about monitor FPS.
// Hysteresis restores detail slowly; one slow update promptly reduces load.
function createAdaptiveQuality(targetFPS=20){
 let level=1,fast=0;
 return {get level(){return level;},targetFPS,observe(ms){
  if(!Number.isFinite(ms)||ms<0)return level;
  const budget=1000/targetFPS;
  if(ms>budget*1.15){level=Math.max(0,level-1);fast=0;}
  else if(ms<budget*.6){if(++fast>=6){level=Math.min(2,level+1);fast=0;}}
  else fast=0;
  return level;
 }};
}
const adaptiveQuality=createAdaptiveQuality();
function drawingQuality(){return state.autoQuality?adaptiveQuality.level:state.quality;}
function qualityLabel(level){const zh=document.documentElement.lang.startsWith('zh');return (state.autoQuality?(zh?'自动：':'Auto: '):'')+(zh?['流畅','标准','精细']:['Low','Medium','High'])[level];}
if(typeof module!=='undefined')module.exports={createAdaptiveQuality};

'use strict';
const fpsDefaults = require('./data/fps-defaults.json');
const clone = value => JSON.parse(JSON.stringify(value));
function object(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
function merge(base, input) {
  const result = clone(base);
  if (!object(input)) return result;
  for (const key of Object.keys(input)) {
    if (['__proto__','prototype','constructor'].includes(key)) continue;
    const value = input[key];
    if (object(result[key])) result[key] = merge(result[key], value);
    else if (Array.isArray(result[key])) { if (Array.isArray(value)) result[key] = clone(value); }
    else if (typeof result[key] === 'boolean') { if (typeof value === 'boolean') result[key] = value; }
    else if (value !== undefined) result[key] = clone(value);
  }
  return result;
}
const messageGroups=Object.fromEntries(['rewards','items','upgrade','party','events','fishing','guild','skills','buffs','glyphs'].map(key=>[key,true]));
const defaults = {
  cache:{enabled:true,measure:false,maxCacheBytes:8388608,maxListBytes:2097152,maxEntries:128,maxChunksPerList:128,partialTimeoutMs:5000},
  clientFixes:{chat:true,swim:true,privateChannel:true,gear:true},
  quickAccess:{enabled:true,commands:require('./quick-access-catalog').defaults},
  bodyBlock:{enabled:true},day:{enabled:false,selectedGroup:'night',selectedAero:require('./day-catalog').sets.night[0],delayAtSpawn:3000,transitionTime:5},
  fps:fpsDefaults, fpsEnabled:true, afk:true, hideMotes:true, skipCutscenes:true, quickDialog:true, unfilteredChat:true, exitInstantly:true,
  camera:{enabled:true,shakeEnabled:true,shakePower:1,shakeSpeed:1,fovEnabled:false,fovValue:71,distanceEnabled:false,distanceValue:170},
  instant:{enchant:true,upgrade:true,soulbind:true,merge:true,dismantle:true},
  messages:{enabled:true,includeSynthetic:true,groups:messageGroups,blockedMessages:[],allowedMessages:[]},
  box:{delayMs:0},party:{enabled:true,classBasedBeams:true,beamsStyle:{tank:46703,healer:89141,default:89604}}
};
function normalize(input) {
  const source = object(input) ? input : {};
  const value = merge(defaults, object(source.fps) ? source : Object.prototype.hasOwnProperty.call(source,'Mode') ? {fps:source} : source);
  value.fps.Mode = Number.isInteger(value.fps.Mode) ? Math.max(0,Math.min(3,value.fps.Mode)) : fpsDefaults.Mode;
  value.fps._version = 19;
  value.quickAccess.commands=require('./quick-access-catalog').normalize(value.quickAccess.commands);
  for(const [key,min,max]of [['maxCacheBytes',65536,67108864],['maxListBytes',65536,16777216],['maxEntries',1,1024],['maxChunksPerList',1,1024],['partialTimeoutMs',1000,30000]])
    if(!Number.isInteger(value.cache[key])||value.cache[key]<min||value.cache[key]>max)value.cache[key]=defaults.cache[key];
  value.cache.maxListBytes=Math.min(value.cache.maxListBytes,value.cache.maxCacheBytes);
  const day=require('./day-catalog');
  if(!day.valid(value.day.selectedGroup,value.day.selectedAero)){
    value.day.selectedGroup=Object.prototype.hasOwnProperty.call(day.sets,value.day.selectedGroup)?value.day.selectedGroup:'night';
    value.day.selectedAero=day.sets[value.day.selectedGroup][0];
  }
  for(const row of require('./catalog').numbers){const keys=row.key.split('.');let obj=value;for(const key of keys.slice(0,-1))obj=obj[key];const field=keys[keys.length-1];if(!Number.isFinite(obj[field])||obj[field]<row.min||obj[field]>row.max||row.integer&&!Number.isInteger(obj[field])){let base=defaults;for(const key of keys)base=base[key];obj[field]=base;}}
  for(const key of ['blockedMessages','allowedMessages'])value.messages[key]=[...new Set(value.messages[key].filter(id=>typeof id==='string'&&/^SMT_[A-Z0-9_]{1,100}$/.test(id)))].slice(0,256);
  return value;
}
function migrate(from, to, settings) { if(Number.isInteger(from)&&from>to)throw Error('Refusing to downgrade newer Game Utils settings');return normalize(from === null ? null : settings); }
module.exports = migrate;
module.exports.normalize = normalize;
module.exports.apply = (target, input) => {
  const next = normalize(input), fps = object(target.fps) ? target.fps : {};
  Object.assign(fps, next.fps); Object.assign(target, next, {fps}); return target;
};
module.exports.edit=(config,key,raw)=>{
  const catalog=require('./catalog'),row=catalog.controls.find(row=>row.key===key&&row.section)||catalog.numbers.find(row=>row.key===key);
  if(!row)return false;
  let value;
  if(row.section){if(!['on','off'].includes(raw))return false;value=raw==='on';}
  else{if(typeof raw!=='string'||!raw.trim())return false;value=Number(raw);if(!Number.isFinite(value)||value<row.min||value>row.max||row.integer&&!Number.isInteger(value))return false;}
  const keys=key.split('.');let obj=config;for(const field of keys.slice(0,-1))obj=obj[field];obj[keys[keys.length-1]]=value;return true;
};

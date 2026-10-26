'use strict';

module.exports = function createDrops(mod, config) {
  const version = mod.majorPatchVersion >= 99 ? 9 : 8, entries = new Map();
  let self = null;
  function isOwn(event) { return self !== null && event.source === self; }
  function hidden(event) {
    if (isOwn(event)) return false;
    return config.hideMotes && event.item >= 8008 && event.item <= 8023 || config.fpsEnabled && config.fps.HideBlacklistedDrop && config.fps.DropBlacklist.includes(event.item);
  }
  function prepare(event) { if (!isOwn(event) && config.fpsEnabled && config.fps.Mode >= 2 && event.explode) { event.explode = false; return true; } }
  function refresh() {
    for (const entry of entries.values()) {
      const hide = hidden(entry.event);
      if (hide && entry.visible) { mod.toClient('S_DESPAWN_DROPITEM',4,{gameId:entry.event.gameId}); entry.visible=false; }
      else if (!hide && !entry.visible && !entry.externalHidden) {
        const event = {...entry.event,explode:false}; prepare(event);
        mod.toClient('S_SPAWN_DROPITEM',version,event); entry.visible=true;
      }
    }
  }
  const options = {order:100010,filter:{fake:false,silenced:null}};
  mod.hook('S_LOGIN',mod.majorPatchVersion>=114?15:14,{order:-100},event=>{self=event.gameId;entries.clear();});
  mod.hook('S_SPAWN_DROPITEM',version,options,event=>{
    const key=event.gameId, externalHidden=event.$silenced === true;
    const stored={...event,loc:event.loc?{x:event.loc.x,y:event.loc.y,z:event.loc.z}:event.loc,owners:Array.isArray(event.owners)?event.owners.slice():[]};
    const hide=hidden(event);
    entries.set(key,{event:stored,visible:!externalHidden&&!hide,externalHidden});
    if(hide) return false;
    if(!externalHidden&&prepare(event)) return true;
  });
  mod.hook('S_DESPAWN_DROPITEM',4,options,event=>{
    const entry=entries.get(event.gameId); entries.delete(event.gameId);
    if(entry&&!entry.visible) return false;
  });
  return {refresh, reset(){entries.clear();}, close(){entries.clear();self=null;}, has:id=>entries.has(id), size:()=>entries.size};
};

'use strict';
// Based on SaltyMonkey's MIT-licensed Party Deaths Notifier.
module.exports=function partyMarkers(mod,config,notify){
  const markers=new Map(),realDrops=new Set();let serial=0n,party=null;
  try{mod.game.initialize('me');mod.game.initialize('party');party=mod.game.party;}catch(error){mod.warn('Party death markers unavailable: '+error.message);}
  const key=event=>String(event.serverId)+':'+String(event.playerId);
  const allocate=()=>{let id;do{id=0x7f00000000000000n+(++serial);}while(realDrops.has(id));return id;};
  function style(member){if(!config.party.classBasedBeams)return config.party.beamsStyle.default;return [1,10].includes(member.class)?config.party.beamsStyle.tank:[6,7].includes(member.class)?config.party.beamsStyle.healer:config.party.beamsStyle.default;}
  function despawn(marker){mod.toClient('S_DESPAWN_DROPITEM',4,{gameId:marker.id});}
  function spawn(marker){mod.toClient('S_SPAWN_DROPITEM',mod.majorPatchVersion>=99?9:8,{gameId:marker.id,loc:{...marker.loc,z:marker.loc.z-35},item:marker.item,amount:1,expiry:99999,owners:[mod.game.me.playerId],source:mod.game.me.gameId,explode:false});}
  function remove(event){const id=key(event),marker=markers.get(id);if(marker){despawn(marker);markers.delete(id);notify();}}
  function clear(send=true){if(!markers.size)return;if(send)for(const marker of markers.values())despawn(marker);markers.clear();notify();}
  function highlight(member,loc){
    if(!config.party.enabled||!loc||![loc.x,loc.y,loc.z].every(Number.isFinite))return;
    const id=key(member),current=markers.get(id),item=style(member);
    if(current&&current.item===item&&['x','y','z'].every(axis=>current.loc[axis]===loc[axis]))return;
    if(current)despawn(current);
    const marker={id:current?current.id:allocate(),member:{...member},loc:{x:loc.x,y:loc.y,z:loc.z},item};
    markers.set(id,marker);spawn(marker);notify();
  }
  function member(gameId){return party&&party.inParty()?party.getMemberData(gameId):null;}
  const observe={order:-100,filter:{fake:false,silenced:null}};
  mod.hook('S_DEAD_LOCATION',2,observe,event=>{const data=member(event.gameId);if(data)highlight(data,event.loc);});
  mod.hook('S_SPAWN_USER',mod.majorPatchVersion>=101?17:mod.majorPatchVersion>=99?16:15,observe,event=>{
    const data=member(event.gameId);if(data){if(event.alive)remove(data);else highlight(data,event.loc);}
  });
  mod.hook('S_PARTY_MEMBER_STAT_UPDATE',mod.majorPatchVersion>=108?4:3,observe,event=>{if(event.alive)remove(event);});
  mod.hook('S_DESPAWN_USER',3,observe,event=>{if(event.type!==1){const data=member(event.gameId);if(data)remove(data);}});
  mod.hook('C_TRY_LOOT_DROPITEM',4,{order:999999,filter:{fake:null,silenced:null}},event=>{for(const marker of markers.values())if(marker.id===event.gameId)return false;});
  mod.hook('S_SPAWN_DROPITEM',mod.majorPatchVersion>=99?9:8,{order:100020,filter:{fake:false,silenced:null}},event=>{
    realDrops.add(event.gameId);
    for(const marker of markers.values())if(marker.id===event.gameId){despawn(marker);marker.id=allocate();spawn(marker);}
  });
  mod.hook('S_DESPAWN_DROPITEM',4,observe,event=>{realDrops.delete(event.gameId);});
  if(party){mod.listen(party,'leave',()=>clear());for(const event of ['member_leave','member_kick'])mod.listen(party,event,remove);}
  mod.command.add('pdn',(action,argument)=>{
    if(action==='clear')return clear();
    if(action==='class'){if(argument!==undefined&&!['on','off'].includes(argument))return mod.command.message('Use pdn class [on/off].');config.party.classBasedBeams=argument===undefined?!config.party.classBasedBeams:argument==='on';return;}
    if(action!==undefined&&!['on','off'].includes(action))return mod.command.message('pdn [on|off|class|clear]');
    config.party.enabled=action===undefined?!config.party.enabled:action==='on';
    mod.command.message('Party death markers: '+(config.party.enabled?'ON':'OFF'));
  });
  return {snapshot(){return {count:markers.size,available:!!party};},refresh(){if(!config.party.enabled)return clear();for(const marker of markers.values())if(marker.item!==style(marker.member)){despawn(marker);marker.item=style(marker.member);spawn(marker);}},reset(send=false){clear(send);realDrops.clear();},close(){clear();realDrops.clear();}};
};

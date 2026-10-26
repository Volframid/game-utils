'use strict';
const catalog=require('./quick-access-catalog');
const {performance}=require('perf_hooks');
module.exports=function quickAccess(mod,config,gui,notify=()=>{}){
 const npcs=new Map(),warned=new Set();let loading=false,lastAction=-Infinity,online=typeof mod.game.me.gameId==='bigint';
 const key=(zone,id)=>zone+':'+id;
 function reset(){npcs.clear();loading=false;online=false;lastAction=-Infinity;notify();}
 function rows(){return Object.entries(config.quickAccess.commands).map(([id,command])=>{
  const entry=catalog.entries.find(row=>row.id===id)||{id,label:command.niceName||id,description:'Saved quick access action.',group:'services',icon:'M4 4h12v12H4z M7 10h6 M10 7v6'};
  const learned=!command.huntingZoneId||npcs.has(key(command.huntingZoneId,command.templateId));
  return {id,label:entry.label,description:entry.description,group:entry.group,icon:entry.icon,available:config.quickAccess.enabled&&online&&!loading&&learned,requiresNpc:!!command.huntingZoneId,learned};
 });}
 function open(id){
  const command=config.quickAccess.commands[id];
  if(!command||!Object.prototype.hasOwnProperty.call(config.quickAccess.commands,id))return false;
  if(!config.quickAccess.enabled){mod.command.message('Quick Access is OFF.');return false;}
  if(!online){mod.command.message('Enter a character before using Quick Access.');return false;}
  if(loading){mod.command.message('Wait until map loading finishes.');return false;}
  const gameId=command.huntingZoneId?npcs.get(key(command.huntingZoneId,command.templateId)):0n;
  if(command.huntingZoneId&&!gameId){mod.command.message('Visit this NPC once on this character to enable '+id+' for this login.');return false;}
  const at=performance.now();if(at-lastAction<600)return false;lastAction=at;
  try{
   if(command.type===1)return mod.toClient('S_NPC_MENU_SELECT',1,{type:command.data})!==false;
   if(command.type===2||command.type===3)return mod.toServer('C_NPC_CONTACT',2,{gameId})!==false;
   const [type,value]=command.data,data=Buffer.alloc(4);data.writeUInt32LE(value);
   // The stock v1 layout uses two adjacent int32s for this NPC's uint64,
   // followed by a zero button. Keep the known wire layout without replacing
   // any global protocol definition (the old module injected version 69).
   const result=mod.toServer('C_REQUEST_CONTRACT',1,{type,
    unk2:Number(BigInt.asIntN(32,gameId)),unk3:Number(BigInt.asIntN(32,gameId>>32n)),unk4:0,name:'',data});
   return result!==false;
  }catch(error){const text=id+': '+error.message;if(!warned.has(text)){warned.add(text);mod.warn('Quick Access '+text);}mod.command.message('This quick action is unavailable on the current server.');return false;}
 }
 mod.hook('S_SPAWN_NPC',mod.majorPatchVersion>=101?12:11,{order:-100,filter:{fake:false,modified:null,silenced:null}},event=>{
  if(typeof event.gameId!=='bigint'||event.gameId<=0n)return;
  const match=Object.values(config.quickAccess.commands).some(row=>row.huntingZoneId===event.huntingZoneId&&row.templateId===event.templateId);
  if(match){npcs.set(key(event.huntingZoneId,event.templateId),event.gameId);notify();}
 });
 mod.hook('S_DESPAWN_NPC',3,{filter:{fake:false,modified:null,silenced:null}},event=>{
  // Out-of-view NPCs remain usable remotely. Remove a positively dead target.
  if(event.type!==5)return;for(const [id,gameId]of npcs)if(gameId===event.gameId){npcs.delete(id);notify();}
 });
 mod.hook('S_LOGIN','event',()=>{reset();online=true;loading=true;});
 mod.hook('S_RETURN_TO_LOBBY','event',reset);
 mod.hook('S_LOAD_TOPO','event',()=>{loading=true;notify();});
 mod.hook('S_SPAWN_ME','event',()=>{online=typeof mod.game.me.gameId==='bigint';loading=false;notify();});
 mod.listen(mod.game,'leave_game',reset);
 for(const id of Object.keys(config.quickAccess.commands)){
  try{mod.command.add(id,()=>open(id));}
  catch(error){mod.warn('Quick Access alias '+id+' already belongs to another module; use access '+id+'.');}
 }
 mod.command.add(['access','anywhere'],(id)=>{
  if(!id||id==='gui')return gui('access');
  if(id==='list'||id==='status'){mod.command.message(rows().map(row=>row.id+(row.learned?'':' (visit NPC)')).join(', '));return;}
  if(['on','off'].includes(id)){config.quickAccess.enabled=id==='on';return;}
  if(!open(id))return;
 });
 return {snapshot:()=>({entries:rows()}),reset,refresh:notify,close(){npcs.clear();}};
};

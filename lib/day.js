'use strict';
const catalog=require('./day-catalog');
// Preserve Dynamic Day's client-only reset technique; no server requests.
module.exports=function createDay(mod,config,gui){
  let pending=null,ready=false,applied=false,native=null,signature=null,closed=false;
  function cancel(){if(pending!==null)mod.clearTimeout(pending);pending=null;}
  function reset(){cancel();ready=false;applied=false;native=null;signature=null;}
  function resetEnvironment(){
    const gameId=696969696969n;
    mod.toClient('S_SPAWN_NPC',mod.majorPatchVersion>=101?12:11,{gameId,templateId:8005000,huntingZoneId:1023,spawnScript:105,visible:true});
    mod.toClient('S_DESPAWN_NPC',3,{gameId,type:1});
  }
  function apply(blendTime=config.day.transitionTime){
    if(closed||!ready||!config.day.enabled||!catalog.valid(config.day.selectedGroup,config.day.selectedAero))return;
    resetEnvironment();
    mod.toClient('S_AERO',1,{enabled:true,blendTime,aeroSet:config.day.selectedAero});
    applied=true;signature=JSON.stringify(config.day);
  }
  function restore(){
    if(applied&&ready){resetEnvironment();mod.toClient('S_AERO',1,native||{enabled:false,blendTime:config.day.transitionTime,aeroSet:''});}
    applied=false;signature=JSON.stringify(config.day);
  }
  function schedule(){cancel();signature=JSON.stringify(config.day);if(!config.day.enabled||closed||!ready)return;pending=mod.setTimeout(()=>{pending=null;apply(1);},config.day.delayAtSpawn);}
  function refresh(){
    if(signature===JSON.stringify(config.day))return;
    cancel();if(config.day.enabled)apply();else restore();
  }
  mod.hook('S_AERO',1,{order:100000,filter:{fake:false,silenced:false}},event=>{
    native={enabled:event.enabled,blendTime:event.blendTime,aeroSet:event.aeroSet};
    if(!config.day.enabled||!ready||pending!==null)return;
    event.enabled=true;event.aeroSet=config.day.selectedAero;event.blendTime=config.day.transitionTime;applied=true;return true;
  });
  mod.hook('S_SPAWN_ME','event',{filter:{fake:false}},()=>{ready=true;schedule();});
  mod.hook('S_RETURN_TO_LOBBY','event',{filter:{fake:false}},reset);
  function show(){const group=catalog.groups.find(g=>g.id===config.day.selectedGroup);const preset=group.presets.find(p=>p.aero===config.day.selectedAero);mod.command.message('Dynamic Day: '+(config.day.enabled?'ON':'OFF')+' | '+group.title+' #'+preset.number+' · '+preset.label);}
  function command(name,...args){
    const action=String(name||'gui').toLowerCase();
    if(['gui','g'].includes(action))return gui('day');
    if(['show','status'].includes(action))return show();
    if(['on','off'].includes(action)){config.day.enabled=action==='on';refresh();return show();}
    if(action==='set'){
      const group=catalog.groups.find(g=>g.id===args[0]),number=Number(args[1]);
      if(!group||!Number.isInteger(number)||number<1||number>group.presets.length)return mod.command.message('Use: day set <group> <number>. See: day list');
      config.day.enabled=true;config.day.selectedGroup=group.id;config.day.selectedAero=group.presets[number-1].aero;refresh();return show();
    }
    if(action==='list'){
      if(!args[0])return mod.command.message(catalog.groups.map(g=>g.id+' ('+g.presets.length+')').join(', '));
      const group=catalog.groups.find(g=>g.id===args[0]);if(!group)return mod.command.message('Unknown group. Use: day list');
      for(const preset of group.presets)mod.command.message(group.id+' #'+preset.number+': '+preset.label);return;
    }
    mod.command.message('day [gui|on|off|show|list [group]|set <group> <number>]');
  }
  mod.command.add('day',command);
  return{reset,refresh,close(){cancel();restore();closed=true;},snapshot:()=>({ready,applied,pending:pending!==null})};
};

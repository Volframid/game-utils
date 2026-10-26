'use strict';
const Scope=require('./fixes/scope');
const entries=[['chat','chat-sanitizer'],['swim','swim-fix'],['privateChannel','private-channel-fix'],['gear','gear-upgrade-crash-fix']];
module.exports=function clientFixes(mod,config,gui,notify=()=>{},commands=mod.command){
 const running=new Map(),failed=new Set();let closed=false;
 function stop(key){const fix=running.get(key);if(!fix)return;if(fix.cleanup)fix.cleanup();fix.scope.destructor();running.delete(key);}
 function refresh(){
  if(closed)return;
  for(const [key,name] of entries){
   if(!config.clientFixes[key]){stop(key);failed.delete(key);continue;}
   if(running.has(key)||failed.has(key))continue;
   if(key==='privateChannel'&&(mod.majorPatchVersion<90||mod.majorPatchVersion>=97))continue;
   const scope=new Scope(mod,name);
   try{const cleanup=require('./fixes/'+name)(mod,scope);running.set(key,{scope,cleanup});}
   catch(error){scope.destructor();scope.warn('Initialization skipped: '+error.message);failed.add(key);}
  }
 }
 commands.add('fixes',(key,argument)=>{
  if(!key||key==='gui')return gui('stability');
  if(key==='status'){mod.command.message(entries.map(([key])=>key+': '+(running.has(key)?'ON':failed.has(key)?'UNAVAILABLE':key==='privateChannel'&&config.clientFixes[key]?'NOT NEEDED ON THIS PATCH':'OFF')).join(' | '));return;}
  if(!entries.some(row=>row[0]===key)||!['on','off'].includes(argument)){mod.command.message('fixes [gui|status|chat/swim/privateChannel/gear on/off]');return;}
  config.clientFixes[key]=argument==='on';refresh();notify();
 });
 refresh();
 return {refresh,snapshot:()=>({active:[...running.keys()],unavailable:[...failed],legacyRequired:mod.majorPatchVersion>=90&&mod.majorPatchVersion<97}),close(){closed=true;for(const key of [...running.keys()])stop(key);}};
};

'use strict';
module.exports=function instant(mod,config,open){
  const registered={enchant:null,upgrade:null},pending=new Map();
  const purposes=['enchant','upgrade','soulbind','merge','dismantle'];
  function key(purpose,id){return purpose+':'+id;}
  function send(purpose,id,name,payload){
    if(!Number.isInteger(id)||id<=0)return false;
    if(pending.has(key(purpose,id)))return true;
    if(mod.toServer(name,1,payload)===false)return false;
    for(const entry of [...pending.keys()])if(entry.startsWith(purpose+':'))pending.delete(entry);
    pending.set(key(purpose,id),true);return true;
  }
  function duplicate(purpose,id){if(pending.has(key(purpose,id)))return false;}
  for(const [purpose,kind,minPatch] of [['enchant','ENCHANT',61],['upgrade','EVOLUTION',79]])if(mod.majorPatchVersion>=minPatch){
    mod.hook('C_REGISTER_'+kind+'_ITEM',1,{filter:{fake:false}},event=>{registered[purpose]={contract:event.contract,dbid:event.dbid,id:event.id};pending.delete(key(purpose,event.contract));});
    mod.hook('C_START_'+kind,1,{filter:{fake:false}},event=>{
      const entry=registered[purpose];
      if(config.instant[purpose]&&entry&&entry.contract===event.contract&&send(purpose,event.contract,'C_REQUEST_'+kind,entry))return false;
    });
    mod.hook('C_REQUEST_'+kind,1,{filter:{fake:false}},event=>duplicate(purpose,event.contract));
  }
  mod.hook('C_BIND_ITEM_BEGIN_PROGRESS',1,{filter:{fake:false}},event=>{
    if(!config.instant.soulbind)return;
    if(send('soulbind',event.contractId,'C_BIND_ITEM_EXECUTE',{contractId:event.contractId}))mod.nextTick(()=>{
      if(pending.has(key('soulbind',event.contractId)))mod.toClient('S_CANCEL_CONTRACT',1,{type:32,id:event.contractId});
    });
  });
  mod.hook('C_BIND_ITEM_EXECUTE',1,{filter:{fake:false}},event=>duplicate('soulbind',event.contractId));
  mod.hook('S_REQUEST_CONTRACT',mod.majorPatchVersion>107?2:1,{filter:{fake:false}},event=>{
    if(!config.instant.merge||event.type!==33||!mod.game.me.is(event.senderId))return;
    if(send('merge',event.id,'C_MERGE_ITEM_EXECUTE',{contractId:event.id}))mod.nextTick(()=>{
      if(pending.has(key('merge',event.id)))mod.toClient('S_CANCEL_CONTRACT',1,{type:33,id:event.id});
    });
  });
  mod.hook('C_MERGE_ITEM_EXECUTE',1,{filter:{fake:false}},event=>duplicate('merge',event.contractId));
  if(mod.majorPatchVersion>=77){
    mod.hook('C_RQ_START_SOCIAL_ON_PROGRESS_DECOMPOSITION',1,{filter:{fake:false}},event=>{
      if(config.instant.dismantle&&send('dismantle',event.contract,'C_RQ_COMMIT_DECOMPOSITION_CONTRACT',{contract:event.contract}))return false;
    });
    mod.hook('C_RQ_COMMIT_DECOMPOSITION_CONTRACT',1,{filter:{fake:false}},event=>duplicate('dismantle',event.contract));
  }
  function cancel(event){for(const entry of [...pending.keys()])if(entry.endsWith(':'+event.id))pending.delete(entry);for(const purpose of Object.keys(registered))if(registered[purpose]&&registered[purpose].contract===event.id)registered[purpose]=null;}
  mod.hook('S_CANCEL_CONTRACT',1,{filter:{fake:false}},cancel);
  mod.hook('C_CANCEL_CONTRACT',1,{filter:{fake:false}},cancel);
  mod.command.add('instant',(purpose,argument)=>{
    if(!purpose||purpose==='gui')return open('inventory');
    if(!purposes.includes(purpose))return mod.command.message('instant enchant/upgrade/soulbind/merge/dismantle [on/off]');
    if(argument!==undefined&&!['on','off'].includes(argument))return mod.command.message('Use on or off.');
    config.instant[purpose]=argument===undefined?!config.instant[purpose]:argument==='on';
    mod.command.message('Instant '+purpose+': '+(config.instant[purpose]?'ON':'OFF'));
  });
  return {reset(){registered.enchant=null;registered.upgrade=null;pending.clear();}};
};

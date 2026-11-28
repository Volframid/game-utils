'use strict';

module.exports=function instant(mod,config,open){
  const registered={enchant:null,upgrade:null},pending=new Map();
  const purposes=['enchant','upgrade','soulbind','merge','dismantle','cards'];
  function key(purpose,id){return purpose+':'+id;}
  function send(purpose,id,name,payload,owner=true){
    if(!Number.isInteger(id)||id<=0)return false;
    if(pending.has(key(purpose,id)))return true;
    const forwarded=mod.toServer(name,1,payload)!==false;
    if(!forwarded)return false;
    for(const entry of [...pending.keys()])if(entry.startsWith(purpose+':'))pending.delete(entry);
    pending.set(key(purpose,id),owner);return true;
  }
  function duplicate(purpose,id){if(pending.has(key(purpose,id)))return false;}
  function sameForgeItem(entry,event){
    return entry&&entry.contract===event.contract&&entry.dbid===event.dbid&&entry.id===event.id;
  }
  function enchantOwner(){
    for(const entry of pending)if(entry[0].startsWith('enchant:'))return entry;
  }
  const visible={order:Number.MAX_SAFE_INTEGER,filter:{fake:false,modified:null,silenced:false}};
  const enchantResultHook=mod.majorPatchVersion>=79&&mod.tryHook('S_RESULT_ENCHANT',2,visible,event=>{
    const attempt=enchantOwner()?.[1];
    // The result belongs to the outstanding item instance. Its contract and
    // template can differ from the client's registered request.
    if(attempt&&attempt.dbid===event.dbid)attempt.completed=true;
  });
  const enchantUnregisterHook=enchantResultHook&&mod.tryHook('C_UNREGISTER_ENCHANT_ITEM',1,visible,event=>{
    if(sameForgeItem(registered.enchant,event))registered.enchant=null;
  });
  const tracksEnchantResult=Boolean(enchantUnregisterHook);
  if(enchantResultHook&&!tracksEnchantResult)mod.unhook(enchantResultHook);
  for(const [purpose,kind,minPatch] of [['enchant','ENCHANT',61],['upgrade','EVOLUTION',79]])if(mod.majorPatchVersion>=minPatch){
    const trackResult=purpose==='enchant'&&tracksEnchantResult;
    // Keep the native workflow if any required Enchant lifecycle hook is unavailable.
    if(purpose==='enchant'&&mod.majorPatchVersion>=79&&!trackResult)continue;
    mod.hook('C_REGISTER_'+kind+'_ITEM',1,trackResult?visible:{filter:{fake:false}},event=>{
      registered[purpose]={contract:event.contract,dbid:event.dbid,id:event.id};
      if(!trackResult)pending.delete(key(purpose,event.contract));
    });
    mod.hook('C_START_'+kind,1,{filter:{fake:false}},event=>{
      const entry=registered[purpose];
      if(trackResult){
        const [attemptKey,attempt]=enchantOwner()||[];
        if(attempt&&(attempt.contract===event.contract||
          (entry?.contract===event.contract&&attempt.dbid===entry?.dbid))){
          if(!attempt.completed)return false;
          // The next genuine click can replace the completed attempt.
          pending.delete(attemptKey);
        }
      }
      if(config.instant[purpose]&&entry&&entry.contract===event.contract){
        const {contract,dbid,id}=entry;
        if(trackResult&&(typeof dbid!=='bigint'||dbid<=0n))return;
        if(send(purpose,contract,'C_REQUEST_'+kind,{contract,dbid,id},trackResult?{...entry,completed:false}:true))return false;
      }
    });
    mod.hook('C_REQUEST_'+kind,1,{filter:{fake:false}},event=>{
      const attempt=trackResult&&enchantOwner()?.[1];
      if(attempt&&attempt.dbid===event.dbid)return false;
      return duplicate(purpose,event.contract);
    });
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
  function cancel(event,client=false){
    const selection=registered.enchant;
    if(client&&selection&&selection.contract===event.id){
      const attempt=enchantOwner()?.[1];
      // Closing a renewed contract still leaves the previous native completion to suppress.
      if(attempt&&attempt.dbid===selection.dbid)attempt.completed=true;
    }
    for(const entry of pending.keys())if(entry.endsWith(':'+event.id))pending.delete(entry);
    for(const purpose of Object.keys(registered)){
      if(registered[purpose]?.contract===event.id)registered[purpose]=null;
    }
  }
  mod.hook('S_CANCEL_CONTRACT',1,{filter:{fake:false}},event=>cancel(event));
  mod.hook('C_CANCEL_CONTRACT',1,tracksEnchantResult?visible:{filter:{fake:false}},event=>cancel(event,true));
  mod.command.add('instant',(purpose,argument)=>{
    if(!purpose||purpose==='gui')return open('inventory');
    if(!purposes.includes(purpose))return mod.command.message('instant '+purposes.join('/')+' [on/off]');
    if(argument!==undefined&&!['on','off'].includes(argument))return mod.command.message('Use on or off.');
    config.instant[purpose]=argument===undefined?!config.instant[purpose]:argument==='on';
    const restart = purpose==='cards'?' Restart TERA to apply.':'';
    mod.command.message('Instant '+purpose+': '+(config.instant[purpose]?'ON':'OFF')+restart);
  });
  return {reset(){registered.enchant=null;registered.upgrade=null;pending.clear();}};
};

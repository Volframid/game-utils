'use strict';
const stopMessages=new Set(['SMT_ITEM_MIX_NEED_METERIAL','SMT_CANT_CONVERT_NOW','SMT_GACHA_NO_MORE_ITEM_SHORT','SMT_NOTI_LEFT_LIMITED_GACHA_ITEM','SMT_GACHA_CANCEL','SMT_COMMON_NO_MORE_ITEM_TO_USE']);
module.exports=function boxes(mod,config,notify){
  let state='idle',target=null,location=null,timer=null,contract=null,pendingContract=null,waiting=false,lastAmount=0,retries=0,used=0;
  let inventory=null;
  try{mod.game.initialize('inventory');inventory=mod.game.inventory;}catch(error){mod.warn('Box opener inventory unavailable: '+error.message);}
  const available=()=>inventory&&typeof inventory.getTotalAmount==='function';
  const amount=()=>available()&&target?inventory.getTotalAmount(target.id):0;
  function snapshot(){return {state,item:target?target.id:null,used,retries,available:!!available()};}
  function changed(){notify();}
  function cancelTimer(){if(timer!==null)mod.clearTimeout(timer);timer=null;}
  function stop(reason,cancel=true){
    const previous=contract||pendingContract;cancelTimer();state='idle';target=null;contract=null;pendingContract=null;waiting=false;retries=0;
    if(previous&&cancel)try{mod.toServer('C_GACHA_CANCEL',1,{id:previous});}catch(error){mod.warn('Could not cancel gacha contract: '+error.message);}
    if(reason)mod.command.message('[Game Utils] Box opener: '+reason);changed();
  }
  function schedule(delay){cancelTimer();timer=mod.setTimeout(()=>{timer=null;use();},delay);}
  function watchdog(){
    cancelTimer();timer=mod.setTimeout(()=>{
      timer=null;if(state!=='running')return;
      if(++retries>3)return stop('No response after three retries.');
      waiting=false;use();
    },Math.max(5500,config.box.delayMs));
  }
  function use(){
    if(state!=='running'||!target||waiting)return;
    if(pendingContract&&!contract)return watchdog();
    if(amount()<=0)return stop('No matching items remain.');
    let accepted=false;
    try{
      lastAmount=amount();waiting=true;
      if(contract)accepted=mod.toServer('C_GACHA_TRY',mod.majorPatchVersion>=99?2:1,{id:contract,amount:1})!==false;
      else{
        const position=location||target;
        if(!position.loc)return stop('No valid item-use position.');
        accepted=mod.toServer('C_USE_ITEM',3,{...target,dbid:0n,loc:position.loc,w:position.w})!==false;
      }
    }catch(error){return stop('Could not use item: '+error.message);}
    if(!accepted)return stop('Item request was not sent.');
    watchdog();changed();
  }
  function confirmed(){
    if(state!=='running'||!target||!waiting)return;
    waiting=false;retries=0;used++;cancelTimer();
    schedule(config.box.delayMs);changed();
  }
  function start(){
    if(state!=='idle')return;
    if(!available())return mod.command.message('[Game Utils] Inventory data is not available.');
    used=0;retries=0;state='armed';changed();
    mod.command.message('[Game Utils] Box opener armed. Manually use the item you want to repeat.');
  }
  mod.hook('C_PLAYER_LOCATION',5,{filter:{fake:false}},event=>{location={loc:{x:event.loc.x,y:event.loc.y,z:event.loc.z},w:event.w};});
  mod.hook('C_USE_ITEM',3,{filter:{fake:false}},event=>{
    if(state==='armed'){
      if(!Number.isInteger(event.id)||event.id<=0)return;
      if(!event.loc||![event.loc.x,event.loc.y,event.loc.z,event.w].every(Number.isFinite))return stop('Invalid item-use position.');
      target={...event,loc:{x:event.loc.x,y:event.loc.y,z:event.loc.z}};
      state='running';lastAmount=amount();waiting=true;watchdog();changed();return;
    }
    if(state==='running')stop('Manual item use stopped the repeating task.');
  });
  if(available()&&typeof inventory.on==='function')mod.listen(inventory,'update',()=>{
    if(state==='running'&&waiting&&!contract&&!pendingContract&&amount()<lastAmount)confirmed();
  });
  mod.hook('S_REQUEST_CONTRACT',mod.majorPatchVersion>107?2:1,{order:-100,filter:{fake:false}},event=>{
    if(mod.majorPatchVersion<93||state!=='running'||event.type!==53||!target)return;
    pendingContract=event.id;watchdog();return false;
  });
  // Current clients can send only the packet header. Their contract ID is in
  // S_REQUEST_CONTRACT, not the obsolete S_GACHA_START body definition.
  mod.hook('S_GACHA_START','raw',{order:-100,filter:{fake:false}},(code,data)=>{
    if(state!=='running'||!target)return;
    if(mod.majorPatchVersion>=93&&!pendingContract)return contract?false:undefined;
    const id=mod.majorPatchVersion>=93?pendingContract:Buffer.isBuffer(data)&&data.length>=8?data.readUInt32LE(4):0;
    if(!id)return stop('The server did not supply a valid gacha contract.',false);
    contract=id;pendingContract=null;waiting=false;cancelTimer();use();return false;
  });
  mod.hook('S_GACHA_END','event',{filter:{fake:false}},()=>{if(state==='running'&&contract)confirmed();});
  mod.hook('S_CANCEL_CONTRACT',1,{filter:{fake:false}},event=>{if(event.type===53&&(event.id===contract||event.id===pendingContract))stop('Contract closed.',false);});
  mod.hook('C_GACHA_TRY',mod.majorPatchVersion>=99?2:1,{filter:{fake:false}},()=>{if(state==='running'&&contract)return false;});
  mod.hook('S_SYSTEM_MESSAGE',1,{order:-100,filter:{fake:false,silenced:null}},event=>{
    if(state==='idle')return;try{if(stopMessages.has(mod.parseSystemMessage(event.message).id))stop('The server refused further use.');}catch(_){}
  });
  mod.command.add('box',action=>{
    if(action==='status')return mod.command.message('[Game Utils] Box opener '+state+' | confirmed uses: '+used+(target?' | item: '+target.id:''));
    if(action==='stop')return stop('Stopped.');
    if(action==='start')return start();
    if(action!==undefined)return mod.command.message('box [start|stop|status]');
    if(state==='idle')start();else stop('Stopped.');
  });
  mod.command.add('boxdelay',value=>{
    if(value===undefined)return mod.command.message('Box minimum interval: '+config.box.delayMs+' ms.');
    if(!require('./settings').edit(config,'box.delayMs',value))return mod.command.message('Use boxdelay <0–60000> in milliseconds.');
    mod.command.message('Box minimum interval: '+config.box.delayMs+' ms.');
  });
  return {snapshot,reset(){stop(null,false);location=null;},close(){stop(null,true);}};
};

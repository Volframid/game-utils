'use strict';
// Reuses the CEM Message Filter rule model; settings now belong to Game Utils.
const groups={
  rewards:['SMT_GACHA_REWARD','SMT_MAX_ENCHANT_SUCCEED','SMT_PREMIUMCOMPOSE_REWARD'],
  items:['SMT_ITEM_USED','SMT_ITEM_DELETED','SMT_CANNOT_TAKE_EQUIPMENT_EXP'],
  upgrade:['SMT_CONVERT_EVENT_SEED_SUCCESS','SMT_CONVERT_EVENT_SEED_FAIL','SMT_ENCHANT_FAILED'],
  party:['SMT_BATTLE_PARTY_DIE','SMT_BATTLE_PARTY_RESURRECT','SMT_BAN_PARTY_PARTYPLAYER_BF_FAIL'],
  events:['SMT_HUNTINGZONE_EVENT_ANNOUNCE','SMT_GOLDENBELL_MESSAGE'],fishing:['SMT_FISHING_REWARD'],
  guild:['SMT_GQUEST_NORMAL_ACCEPT','SMT_GQUEST_NORMAL_COMPLETE','SMT_GQUEST_NORMAL_FAIL_OVERTIME','SMT_GQUEST_NORMAL_END_NOTICE','SMT_GQUEST_NORMAL_CARRYOUT','SMT_GQUEST_OCCUPY_ACCEPT','SMT_GQUEST_OCCUPY_COMPLETE','SMT_GQUEST_OCCUPY_FAIL_OVERTIME','SMT_GQUEST_NORMAL_CANCEL','SMT_GQUEST_FAIL_ACCEPT'],
  skills:['SMT_SKILL_FAIL_CATEGORY'],buffs:[],glyphs:[]
};
const lookup=new Map(Object.entries(groups).flatMap(([group,ids])=>ids.map(id=>[id,group])));
exports.groups=groups;
exports.create=function messages(mod,config,open){
  const counts=new Map();let unparsed=0;
  const message=value=>mod.command.message('[Game Utils] '+value);
  function active(fake){return config.messages.enabled&&(config.messages.includeSynthetic||!fake);}
  function hit(group){counts.set(group,(counts.get(group)||0)+1);return false;}
  const options={order:999999999,filter:{fake:null,silenced:false}};
  mod.hook('S_SYSTEM_MESSAGE',1,options,(event,fake)=>{
    if(!active(fake))return;let id;
    try{id=mod.parseSystemMessage(event.message).id;}catch(_){unparsed++;return;}
    if(config.messages.allowedMessages.includes(id))return;
    if(config.messages.blockedMessages.includes(id))return hit('custom');
    const group=lookup.get(id);if(group&&config.messages.groups[group])return hit(group);
  });
  mod.hook('S_ABNORMALITY_FAIL','raw',options,(opcode,buffer,incoming,fake)=>{if(active(fake)&&config.messages.groups.buffs)return hit('buffs');});
  mod.hook('S_CREST_MESSAGE',2,options,(event,fake)=>{if(active(fake)&&config.messages.groups.glyphs&&event.type===6)return hit('glyphs');});
  mod.command.add('filter',(action,value)=>{
    action=String(action||'').toLowerCase();value=value===undefined?undefined:String(value);
    if(action==='gui')return open('notifications');
    if(['status','state','stats'].includes(action)){
      message('Filter '+(config.messages.enabled?'ON':'OFF')+' | blocked: '+[...counts.values()].reduce((a,b)=>a+b,0)+' | malformed/unmapped passed: '+unparsed);
      if(action==='stats')message([...counts].map(([key,n])=>key+': '+n).join(' | ')||'No messages filtered yet.');return;
    }
    if(action==='list'){message(Object.entries(config.messages.groups).map(([key,on])=>key+': '+(on?'ON':'OFF')).join(' | '));message('Blocked: '+config.messages.blockedMessages.join(', ')+' | Allowed: '+config.messages.allowedMessages.join(', '));return;}
    if(action==='help')return message('filter [on/off/status/gui] | filter <group> [on/off] | filter synthetic [on/off] | filter block/allow/clear SMT_ID | filter reset');
    if(!action||['on','off'].includes(action)){config.messages.enabled=!action?!config.messages.enabled:action==='on';return message('Filter '+(config.messages.enabled?'ON':'OFF'));}
    if(action==='reset'){Object.assign(config.messages,require('./settings').normalize().messages);return message('Default filters restored.');}
    if(Object.prototype.hasOwnProperty.call(groups,action)||action==='synthetic'){
      if(value!==undefined&&!['on','off'].includes(value.toLowerCase()))return message('Use on or off.');
      const cfg=action==='synthetic'?config.messages:config.messages.groups,key=action==='synthetic'?'includeSynthetic':action;
      cfg[key]=value===undefined?!cfg[key]:value.toLowerCase()==='on';return message(action+': '+(cfg[key]?'ON':'OFF'));
    }
    if(['block','allow','clear','removeblock','removeallow'].includes(action)){
      const id=String(value||'').toUpperCase();if(!/^SMT_[A-Z0-9_]{1,100}$/.test(id))return message('Provide a valid SMT_MESSAGE_NAME.');
      if(action==='block'||action==='allow'){const list=config.messages[action==='block'?'blockedMessages':'allowedMessages'];if(list.length>=256&&!list.includes(id))return message('Maximum 256 rules per list.');}
      if(action!=='removeallow')config.messages.blockedMessages=config.messages.blockedMessages.filter(value=>value!==id);
      if(action!=='removeblock')config.messages.allowedMessages=config.messages.allowedMessages.filter(value=>value!==id);
      if(action==='block'||action==='allow')config.messages[action==='block'?'blockedMessages':'allowedMessages'].push(id);
      return message(id+': rule updated.');
    }
    message('Unknown filter command. Use filter help.');
  });
  return {stats(){return {blocked:[...counts.values()].reduce((a,b)=>a+b,0),unparsed};}};
};

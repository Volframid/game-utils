'use strict';
const catalog=require('./catalog');
module.exports=function createActions(config,exec){
  return function action(type,payload){
    if(!payload||typeof payload!=='object')return false;
    if(type==='access'){
      if(typeof payload.id!=='string'||!Object.prototype.hasOwnProperty.call(config.quickAccess.commands,payload.id)||!/^[a-z][a-z0-9-]{0,31}$/.test(payload.id))return false;
      exec('access '+payload.id);return true;
    }
    if(type==='cache'){
      const commands={refresh:'cache refresh',reset:'cache reset',stats:'cache stats reset'};
      if(!Object.prototype.hasOwnProperty.call(commands,payload.action))return false;
      exec(commands[payload.action]);return true;
    }
    if(type==='day'){
      const group=require('./day-catalog').groups.find(g=>g.id===payload.group);
      if(!group||!Number.isInteger(payload.number)||payload.number<1||payload.number>group.presets.length)return false;
      exec('day set '+group.id+' '+payload.number);return true;
    }
    if(type==='set'){
      const row=catalog.controls.find(row=>row.key===payload.key);
      if(!row||typeof payload.value!=='boolean')return false;
      if(catalog.value(config,row)!==payload.value)exec(row.command+(row.section?' '+(payload.value?'on':'off'):''));
      return true;
    }
    if(type==='number'){
      const row=catalog.numbers.find(row=>row.key===payload.key),value=payload.value;
      if(!row||!Number.isFinite(value)||value<row.min||value>row.max||row.integer&&!Number.isInteger(value))return false;
      if(catalog.value(config,row)!==value)exec('utils setting '+row.key+' '+value);return true;
    }
    if(type==='box'&&['start','stop'].includes(payload.action)){exec('box '+payload.action);return true;}
    if(type==='clear-markers'){exec('pdn clear');return true;}
    if(type==='mode'){
      if(!Number.isInteger(payload.value)||payload.value<0||payload.value>3)return false;
      exec('fps mode '+payload.value);return true;
    }
    if(type==='class'){
      if(payload.kind==='preset'&&['healers','all','none'].includes(payload.value)){exec('fps skill visible '+payload.value);return true;}
      const entry=config.fps.ClassesData[payload.id];
      if(!entry||!/^\d{1,2}$/.test(String(payload.id)))return false;
      if(payload.kind==='visibility'&&typeof payload.value==='boolean'){
        if(entry.isHidden!==payload.value)exec('fps '+(payload.value?'hide ':'show ')+entry.name);return true;
      }
      if(payload.kind==='skills'&&typeof payload.value==='boolean'){
        if(entry.CD_HideBlacklistedSkills!==payload.value)exec('fps skill class '+entry.name);return true;
      }
      if(payload.kind==='keep'&&typeof payload.value==='boolean'){
        if(entry.CD_KeepSkillEffects!==payload.value)exec('fps skill keep '+entry.name+' '+(payload.value?'on':'off'));return true;
      }
      if(payload.kind==='skill'&&typeof payload.value==='string'&&/^(?:[1-9]|[1-4][0-9])$/.test(payload.value)){
        exec('fps skill class '+entry.name+' '+payload.value);return true;
      }
      return false;
    }
    if(type==='list'){
      const row=catalog.lists.find(row=>row.key===payload.key);
      if(!row||!['add','remove'].includes(payload.operation)||typeof payload.value!=='string')return false;
      const value=payload.value.trim(),list=catalog.value(config,row);
      let exists=false,command;
      if(row.type==='message'){
        if(!/^SMT_[A-Z0-9_]{1,100}$/.test(value))return false;
        exists=list.includes(value);const blocked=row.key.endsWith('blockedMessages');
        command='filter '+(payload.operation==='add'?(blocked?'block':'allow'):(blocked?'removeblock':'removeallow'))+' '+value;
      }else if(row.type==='player'){
        if(!/^[^\s<>;"'\\/]{1,64}$/u.test(value))return false;
        exists=list.some(name=>String(name).toLowerCase()===value.toLowerCase());
        command='fps '+(payload.operation==='add'?'hide ':'show ')+value;
      }else if(row.type==='npc'){
        if(!/^\d{1,9}\s*[:, ]\s*\d{1,9}$/.test(value))return false;
        const ids=value.split(/\s*[:, ]\s*/).map(Number);
        exists=list.some(item=>Number(item.zone)===ids[0]&&Number(item.templateId)===ids[1]);
        command='fps npc hide '+ids.join(' ');
      }else{
        if(!/^\d{1,10}$/.test(value)||Number(value)>4294967295)return false;
        exists=list.includes(Number(value));
        const commands={DropBlacklist:'drops hide',OwnAbnormalsBlacklist:'screenabns hide',AbnormalitiesBlacklist:'abn blacklist '+(payload.operation==='add'?'add':'remv'),ProjectilesBlacklist:'proj blacklist '+(payload.operation==='add'?'add':'remv')};
        command='fps '+commands[row.key]+' '+Number(value);
      }
      if(exists!==(payload.operation==='add'))exec(command);
      return true;
    }
    return false;
  };
};

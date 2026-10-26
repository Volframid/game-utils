'use strict';
module.exports=function camera(mod,config,open){
  let ready=false,lastFov=null,lastDistance=null,applied=null,warned=false;
  function apply(force=false){
    if(!ready)return;
    const current=JSON.stringify(config.camera);if(!force&&current===applied)return;
    const value=config.camera,previous=applied?JSON.parse(applied):null;
    try{
      const client=mod.clientInterface;
      if(client&&typeof client.configureCameraShake==='function')client.configureCameraShake(value.enabled?value.shakeEnabled:true,value.enabled?value.shakePower:1,value.enabled?value.shakeSpeed:1);
      else if(!warned){warned=true;mod.warn('Camera shaking is unavailable without a connected Toolbox client interface.');}
    }catch(error){if(!warned){warned=true;mod.warn('Camera shaking unavailable: '+error.message);}}
    if(value.enabled&&value.fovEnabled)mod.toClient('S_STEER_DEBUG_COMMAND',1,{command:'fov '+value.fovValue});
    else if(previous&&previous.enabled&&previous.fovEnabled)mod.toClient('S_STEER_DEBUG_COMMAND',1,{command:lastFov||'fov 71'});
    if(value.enabled&&value.distanceEnabled)mod.toClient('S_DUNGEON_CAMERA_SET',1,{enabled:true,default:value.distanceValue,max:value.distanceValue});
    else if(previous&&previous.enabled&&previous.distanceEnabled)mod.toClient('S_DUNGEON_CAMERA_SET',1,lastDistance||{enabled:false,default:170,max:170});
    applied=current;
  }
  mod.hook('S_STEER_DEBUG_COMMAND',1,{filter:{fake:false}},event=>{
    if(!/^\s*fov\s+[\d.]+\s*$/i.test(event.command))return;
    lastFov=event.command;if(config.camera.enabled&&config.camera.fovEnabled)return false;
  });
  mod.hook('S_DUNGEON_CAMERA_SET',1,{filter:{fake:false}},event=>{
    lastDistance={enabled:event.enabled,default:event.default,max:event.max};
    if(config.camera.enabled&&config.camera.distanceEnabled)return false;
  });
  mod.listen(mod.game,'leave_loading_screen',()=>{ready=true;apply(true);});
  mod.command.add('camera',(action,...args)=>{
    action=String(action||'').toLowerCase();
    if(!action||action==='gui')return open('camera');
    if(action==='distance'||action==='fov'){
      const key=action==='distance'?'distance':'fov',value=args[0];
      if(value==='disable'||value==='off')config.camera[key+'Enabled']=false;
      else if(require('./settings').edit(config,'camera.'+key+'Value',value))config.camera[key+'Enabled']=true;
      else return mod.command.message('Use camera '+key+' <number> or disable.');
    }else if(action==='shake'){
      if(!['on','off'].includes(args[0]))return mod.command.message('Use camera shake on/off [power] [speed].');
      const next={...config.camera};next.shakeEnabled=args[0]==='on';
      for(const [index,key] of [[1,'shakePower'],[2,'shakeSpeed']])if(args[index]!==undefined){const value=Number(args[index]);if(!Number.isFinite(value)||value<0||value>100)return mod.command.message('Shake values must be 0–100.');next[key]=value;}
      Object.assign(config.camera,next);
    }else return mod.command.message('camera [distance <10–5000>|fov <30–120>|shake on/off [power] [speed]]');
    mod.command.message('Camera preferences updated.');
  });
  return {apply,reset(){ready=false;applied=null;lastDistance=null;lastFov=null;warned=false;}};
};

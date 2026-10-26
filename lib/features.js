'use strict';
const {performance} = require('perf_hooks');
const path = require('path');
const dialogTypes = new Set([1,2,3,4,5,51,53,54,55,56,63]);

exports.afk = function afk(mod, config, now = () => performance.now()) {
  let lastMovement = now();
  const reset = () => {lastMovement=now();};
  mod.hook('C_PLAYER_LOCATION',5,{filter:{fake:false}},event=>{if([0,1,5,6].includes(event.type))reset();});
  mod.hook('C_RETURN_TO_LOBBY','raw',{filter:{fake:false}},()=>{
    if(config.afk && Math.max(0,now()-lastMovement)>=3600000)return false;
  });
  return {reset};
};
exports.cutscenes = function cutscenes(mod, config) {
  mod.hook('S_PLAY_MOVIE',1,{filter:{fake:false}},event=>{
    if(!config.skipCutscenes||!Number.isInteger(event.movie))return;
    // Do not hide the movie if acknowledging it failed.
    try { if(mod.toServer('C_END_MOVIE',1,{movie:event.movie,unk:1})!==false)return false; }
    catch(error){mod.warn('Cutscene acknowledgement failed; leaving the original movie visible.');}
  });
};
exports.dialog = function dialog(mod, config) {
  let version='*';
  if(mod.majorPatchVersion===92){
    mod.dispatch.addDefinition('S_DIALOG',99,path.join(__dirname,'data/S_DIALOG.99.def'),true); version=99;
  }
  mod.hook('S_DIALOG',version,{filter:{fake:false}},event=>{
    if(!config.quickDialog||!Array.isArray(event.buttons))return;
    let changed=false;
    for(const button of event.buttons)if(dialogTypes.has(button.type)){button.type=43;changed=true;}
    if(changed){if(Object.prototype.hasOwnProperty.call(event,'dialogType'))event.dialogType=1;else event.type=1;return true;}
  });
};
exports.chat = function chat(mod, config) {
  for(const [name,version] of [['C_CHAT',1],['C_WHISPER',1],['S_CHAT',3],['S_WHISPER',3],['S_PRIVATE_CHAT',1]]){
    mod.hook(name,version,{order:20,filter:{fake:false}},event=>{
      if(!config.unfilteredChat||typeof event.message!=='string')return;
      const message=event.message.replace(/<FONT>([\s\S]*?)<\/FONT>/gi,(_,content)=>'<FONT></FONT>'+content);
      if(message!==event.message){event.message=message;return true;}
    });
  }
};

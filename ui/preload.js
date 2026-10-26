'use strict';
const {contextBridge,ipcRenderer}=require('electron');
const channel='cem-game-utils-panel-v1';
let presentation=0,reported=false;
ipcRenderer.on(channel,(_,type,value)=>{if(type==='presentation'){presentation=value;reported=false;}});
function interaction(event){
  if(!event.isTrusted||reported)return;
  reported=true;ipcRenderer.send(channel,'interacted',{presentation});
}
// Report one genuine interaction per explicit open, without transmitting keys.
for(const type of ['pointerdown','keydown','wheel'])window.addEventListener(type,interaction,{capture:true,passive:true});
contextBridge.exposeInMainWorld('gameUtils',{
  send(type,payload){if(['init','set','number','mode','class','list','box','day','access','cache','clear-markers','close','minimize','legacy'].includes(type))ipcRenderer.send(channel,type,payload);},
  listen(callback){const listener=(_,type,value)=>callback(type,value);ipcRenderer.on(channel,listener);return ()=>ipcRenderer.removeListener(channel,listener);}
});

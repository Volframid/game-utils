'use strict';
const path=require('path');
const fs=require('fs');
const catalog=require('./catalog');
const createActions=require('./panel-actions');
const channel='cem-game-utils-panel-v1';
module.exports=function createPanel(mod,config,events,runtime=()=>({})){
  let window=null,ipc=null,disposed=false,initialPage='overview';
  let presentation=0,interacted=false;
  const history=[];
  function record(event,target=window){
    try{
      const alive=target&&!target.isDestroyed();
      history.push({time:new Date().toISOString(),event,presentation,interacted,visible:!!(alive&&target.isVisible()),focused:!!(alive&&target.isFocused()),topmost:!!(alive&&target.isAlwaysOnTop()),minimized:!!(alive&&target.isMinimized())});
      if(history.length>24)history.shift();
      const folder=path.join(mod.info.path,'logs');fs.mkdirSync(folder,{recursive:true});
      fs.writeFileSync(path.join(folder,'panel-window.json'),JSON.stringify({version:require('../module.json').version,events:history},null,2));
    }catch(_){} // Diagnostics must never prevent opening the panel.
  }
  const action=createActions(config,command=>mod.command.exec(command));
  function snapshot(){return {settings:config,controls:catalog.controls,lists:catalog.lists,numbers:catalog.numbers,dayGroups:require('./day-catalog').groups,runtime:runtime(),page:initialPage,theme:global.TeraProxy&&global.TeraProxy.GUITheme||'black'};}
  function update(){if(window&&!window.isDestroyed())window.webContents.send(channel,'state',snapshot());}
  function notice(message){if(window&&!window.isDestroyed())window.webContents.send(channel,'notice',message);}
  function present(target){
    if(disposed||!target||target.isDestroyed())return;
    interacted=false;presentation++;
    target.webContents.send(channel,'presentation',presentation);
    if(target.isMinimized())target.restore();
    // Raise only in response to the user's open command. No focus polling.
    // Electron 11's default floating level repositions behind the taskbar on
    // Windows, which can clear native topmost state. Select an explicit level.
    target.setAlwaysOnTop(true,process.platform==='win32'?'pop-up-menu':'floating');
    target.show();
    if(typeof target.moveTop==='function')target.moveTop();
    target.focus();
    record('present',target);
  }
  function releaseTop(target){if(target&&!target.isDestroyed())target.setAlwaysOnTop(false);}
  function receive(event,type,payload){
    if(!window||event.sender!==window.webContents)return;
    if(type==='interacted'){
      if(payload&&payload.presentation===presentation&&!interacted){interacted=true;record('interaction');}
      return;
    }
    if(type==='init')return update();
    if(type==='close')return window.close();
    if(type==='minimize')return window.minimize();
    if(type==='legacy'){mod.command.exec('fps legacy help');return;}
    try{
      if(!action(type,payload))window.webContents.send(channel,'notice','Check the value and try again.');
      update();
    }catch(error){mod.warn('Settings panel: '+error.message);update();}
  }
  function detach(){record('closed');if(ipc)ipc.removeListener(channel,receive);ipc=null;window=null;interacted=false;}
  function show(page){
    if(disposed)return false;
    initialPage=typeof page==='string'?page:'overview';
    if(window&&!window.isDestroyed()){present(window);update();window.webContents.send(channel,'page',initialPage);return true;}
    try{
      const electron=require('electron');
      if(!electron.BrowserWindow)return false;
      ipc=electron.ipcMain;
      window=new electron.BrowserWindow({title:'Game Utils',width:1060,height:780,minWidth:880,minHeight:640,show:false,frame:false,backgroundColor:'#101217',autoHideMenuBar:true,
        webPreferences:{preload:path.join(__dirname,'../ui/preload.js'),nodeIntegration:false,contextIsolation:true,enableRemoteModule:false}});
      const current=window;
      ipc.on(channel,receive);
      window.webContents.on('will-navigate',event=>event.preventDefault());
      window.webContents.on('new-window',event=>event.preventDefault());
      window.once('ready-to-show',()=>{if(window===current)present(current);});
      current.on('focus',()=>record('focus',current));
      current.on('blur',()=>{
        // Windows may reject cross-process focus. Do not demote a new panel
        // before the user has had a chance to click or type in it.
        if(interacted)releaseTop(current);
        record(interacted?'blur-after-interaction':'initial-blur-retained',current);
      });
      for(const event of ['minimize','hide'])current.on(event,()=>{releaseTop(current);record(event,current);});
      window.on('closed',detach);
      window.loadFile(path.join(__dirname,'../ui/index.html')).catch(error=>{mod.warn('Could not open Game Utils panel: '+error.message);if(window)window.close();});
      return true;
    }catch(error){if(window&&!window.isDestroyed())window.destroy();detach();mod.warn('Desktop panel unavailable; using the in-game menu.');return false;}
  }
  events.on('changed',update);
  events.on('runtime',update);
  events.on('notice',notice);
  return {show,close(){disposed=true;events.removeListener('changed',update);events.removeListener('runtime',update);events.removeListener('notice',notice);if(window&&!window.isDestroyed())window.close();detach();}};
};

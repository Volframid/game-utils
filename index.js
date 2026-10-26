'use strict';
const {EventEmitter} = require('events');
const settings = require('./lib/settings');
const createScope = require('./lib/scope');
const createDrops = require('./lib/drops');
const features = require('./lib/features');
const createPanel = require('./lib/panel');

module.exports.GlobalMod = function GlobalMod(mod){this.events=new EventEmitter();this.events.setMaxListeners(0);this.store=mod?require('./lib/storage')(mod.info.path):null;this.destructor=()=>this.events.removeAllListeners();};
module.exports.NetworkMod = function GameUtils(mod) {
  const config=settings.apply(mod.settings,mod.settings),scopes=[];
  let closed=false,drops,afk,fps,panel,camera,instant,box,party,messages,day,bodyBlock,cache,fixes,access;
  const events=mod.globalMod.events;
  function persist(){if(!closed){if(mod.globalMod.store)mod.globalMod.store.save(config);else mod.saveSettings();events.emit('changed');}}
  function scope(get,active){const value=createScope(mod,{settings:get,persist,active,rollback(previous,error){settings.apply(config,get()===config?previous:{...config,fps:previous});events.emit('changed');if(error)events.emit('notice','Change was not saved: '+error.message);}});scopes.push(value);return value.api;}
  function reset(restoreVisibility=false){fps?.resetSession(restoreVisibility);instant?.reset();box?.reset();party?.reset();camera?.reset();day?.reset();bodyBlock?.pause();cache?.resetSession();for(const value of scopes)value.cancelTimers();drops.reset();afk.reset();}
  function toggle(key,argument){
    if(argument!==undefined&&!['on','off'].includes(String(argument).toLowerCase()))return mod.command.message('Use on or off.');
    config[key]=argument===undefined?!config[key]:String(argument).toLowerCase()==='on';
    if(key==='afk')afk.reset();mod.command.message(key+': '+(config[key]?'ON':'OFF'));
  }
  const labels=[['afk','AFK guard'],['hideMotes','Hide others’ motes'],['skipCutscenes','Skip cutscenes'],['quickDialog','F-key dialogs'],['unfilteredChat','Unfiltered chat']];
  function gui(page){
    if(panel&&panel.show(page))return;
    const body=labels.map(([key,label])=>'<p><a href="admincommand:/@utils '+key+';utils gui;">'+label+': '+(config[key]?'ON':'OFF')+'</a></p>').join('')+'<br><a href="admincommand:/@fps gui;">FPS settings</a><br><a href="admincommand:/@utils credits;">Credits and license</a>';
    mod.toClient('S_ANNOUNCE_UPDATE_NOTIFICATION',1,{id:0,title:'Game Utils · CEM',body});
  }
  function command(name,...args){
    const key=String(name||'gui').toLowerCase();
    const keys={afk:'afk',motes:'hideMotes',hidemotes:'hideMotes',cutscenes:'skipCutscenes',skip:'skipCutscenes',dialog:'quickDialog',jsf:'quickDialog',chat:'unfilteredChat',skipcutscenes:'skipCutscenes',quickdialog:'quickDialog',unfilteredchat:'unfilteredChat'};
    if(keys[key])return toggle(keys[key],args[0]);
    if(key==='setting'){
      if(!settings.edit(config,args[0],args[1]))return mod.command.message('Invalid setting or value. Open utils for supported controls.');
      return;
    }
    if(['camera','instant','filter','box','pdn','day','bb','cache','fixes','access','anywhere'].includes(key))return mod.command.exec([key,...args].join(' '));
    if(key==='fps')return mod.command.exec(['fps',...args].join(' '));
    if(key==='gui'||key==='g')return gui();
    if(key==='status'){mod.command.message('Game Utils · CEM | FPS mode '+config.fps.Mode);for(const [flag,label] of labels)mod.command.message(label+': '+(config[flag]?'ON':'OFF'));mod.command.message('Camera distance: '+config.camera.distanceValue+' | instant exit: '+(config.exitInstantly?'ON':'OFF')+' | death markers: '+(config.party.enabled?'ON':'OFF'));mod.command.message('Anti Body Block: '+(config.bodyBlock.enabled?'ON':'OFF')+' | Dynamic Day: '+(config.day.enabled?'ON':'OFF'));return;}
    if(key==='credits'){mod.command.message('CEM integration; original authors include Risenio and FPS contributors, TeraProxy, Menma, Tsunpot/Baldera-Mods, Snug, Pinkie Pie, Caali, m0py, beng, teralove, Owyn and SaltyMonkey. Full credits and retained licenses are in README and LICENSE.');return;}
    mod.command.message('utils [gui|status|fps|camera|instant|filter|box|pdn|day|bb|afk|motes|cutscenes|dialog|chat]');
  }
  try {
    const base=scope(()=>config);
    drops=createDrops(base,config); afk=features.afk(base,config);
    features.cutscenes(base,config);features.dialog(base,config);features.chat(base,config);
    camera=require('./lib/camera')(base,config,gui);
    instant=require('./lib/instant')(base,config,gui);
    box=require('./lib/boxes')(base,config,()=>events.emit('runtime'));
    party=require('./lib/party-markers')(base,config,()=>events.emit('runtime'));
    messages=require('./lib/messages').create(base,config,gui);
    bodyBlock=require('./lib/body-block')(base,config);
    day=require('./lib/day')(base,config,gui);
    cache=require('./lib/inventory-cache')(base,config,()=>events.emit('runtime'));
    // These fixes own their scopes: a general map reset must not cancel a
    // legacy channel watchdog while leaving its withheld packets queued.
    fixes=require('./lib/client-fixes')(mod,config,gui,()=>events.emit('runtime'),base.command);
    access=require('./lib/quick-access')(base,config,gui,()=>events.emit('runtime'));
    base.hook('S_PREPARE_EXIT',1,{filter:{fake:false}},()=>{
      if(config.exitInstantly&&base.toClient('S_EXIT',3,{category:0,code:0})!==false)return false;
    });
    const fpsScope=scope(()=>config.fps,()=>config.fpsEnabled);
    panel=createPanel(mod,config,events,()=>({box:box.snapshot(),party:party.snapshot(),messages:messages.stats(),day:day.snapshot(),bodyBlock:bodyBlock.snapshot(),cache:cache.snapshot(),fixes:fixes.snapshot(),access:access.snapshot()}));
    fps=require('./lib/fps')(fpsScope,()=>panel.show());
    base.command.add(['utils','game-utils'],command);
    for(const [alias,key] of [['afk','afk'],['hidemotes','motes'],['skip','cutscenes'],['jsf','dialog']])base.command.add(alias,arg=>command(key,arg));
    base.hook('S_LOGIN','event',{order:-1000},()=>reset(false));
    base.hook('S_LOAD_TOPO','event',{order:-1000},()=>reset(true));
    base.listen(mod.game,'leave_game',()=>reset(false));
    base.listen(events,'changed',()=>{drops.refresh();if(config.fpsEnabled)fps.reconcile();camera.apply();party.refresh();bodyBlock.refresh();day.refresh();cache.refresh();fixes.refresh();access.refresh();});
  }catch(error){closed=true;if(panel)panel.close();bodyBlock?.close();day?.close();cache?.close();fixes?.close();access?.close();for(const value of scopes)value.close();throw error;}
  this.destructor=()=>{if(closed)return;fps.resetSession(true);closed=true;panel.close();box.close();party.close();instant.reset();bodyBlock.close();day.close();cache.close();fixes.close();access.close();for(const value of scopes)value.close();drops.close();};
};

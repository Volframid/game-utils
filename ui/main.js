'use strict';
const bridge=window.gameUtils;
let data=null,page='overview',selectedClass='2',noticeTimer;
const $=selector=>document.querySelector(selector);
const pages=[['overview','Overview','Your game, refined.','Performance and everyday tools, working together.','M3 10 10 3l7 7v8H4z M8 18v-6h4v6'],['performance','Performance','Less noise. More focus.','Choose a starting mode, then fine-tune the effects you see.','M3 14a7 7 0 1 1 14 0 M10 11l4-4 M5 17h10'],['visuals','Visual filters','Keep what matters.','Control summons, appearances and floating visuals.','M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6 M10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6'],['filters','Custom filters','Make it personal.','Manage saved item, projectile, NPC and effect filters.','M3 4h14l-5 6v7l-4-2v-5z'],['classes','Classes & skills','A lighter battlefield.','Choose which classes and skill groups remain visible.','M5 3v5l5 9 5-9V3 M5 6h10 M7 11h6'],['utilities','Utilities','Small tools. Big comfort.','Five familiar helpers, together with quiet chat output.','M4 3h4v4H4z M12 3h4v4h-4z M4 11h4v4H4z M12 11h4v4h-4z']];
pages[5][3]='Everyday helpers, quick exit and party death markers.';
pages.push(['notifications','Notifications','A quieter conversation.','Choose which system notices stay visible.','M5 14V8a5 5 0 0 1 10 0v6l2 2H3z M8 18h4'],['inventory','Inventory tools','Less waiting. Same choices.','Faster item operations and a controlled repeating item opener.','M3 4h14v13H3z M3 8h14 M8 11h4'],['camera','Camera','A better point of view.','Set your distance, field of view and shake preferences.','M3 6h4l1-2h4l1 2h4v11H3z M10 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6']);
pages.push(['day','Dynamic Day','Set the atmosphere.','A sky for every mood. Choose once; keep it across your travels.','M15 2A8 8 0 1 0 18 13 7 7 0 0 1 15 2 M5 3v4 M3 5h4']);
pages.push(['stability','Client fixes','A steadier client.','Independent fixes, with clear controls and patch-aware behavior.','M10 2l7 4v5l-7 7-7-7V6z M7 10l2 2 4-4'],['access','Quick Access','Everything within reach.','Your broker, storage and merchants, one deliberate click away.','M4 3h4v4H4z M12 3h4v4h-4z M4 11h4v4H4z M12 11h4v4h-4z']);
function value(row){return row.section||row.key.includes('.')?row.key.split('.').reduce((obj,key)=>obj[key],data.settings):(row.root?data.settings:data.settings.fps)[row.key];}
function el(tag,classes,text){const node=document.createElement(tag);if(classes)node.className=classes;if(text!==undefined)node.textContent=text;return node;}
function send(type,payload){bridge.send(type,payload);}
for(const [id,label,,,path] of pages){const button=el('button','',label),svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),shape=document.createElementNS(svg.namespaceURI,'path');svg.setAttribute('viewBox','0 0 20 20');shape.setAttribute('d',path);svg.append(shape);button.prepend(svg);button.dataset.page=id;button.addEventListener('click',()=>{page=id;$('#search').value='';render();});$('#navigation').append(button);}
function section(title,detail){const heading=el('div','section-head');heading.append(el('h2','',title));if(detail)heading.append(el('span','',detail));return heading;}
function skyIcon(group){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),shape=document.createElementNS(svg.namespaceURI,'path');svg.setAttribute('viewBox','0 0 20 20');svg.setAttribute('aria-hidden','true');shape.setAttribute('d',group.icon);svg.append(shape);return svg;}
function skies(groups=data.dayGroups||[]){
  const box=document.createDocumentFragment(),current=data.settings.day;
  const selected=(data.dayGroups||[]).find(g=>g.id===current.selectedGroup);
  const preset=selected&&selected.presets.find(p=>p.aero===current.selectedAero);
  const hero=el('div','sky-summary sky-'+current.selectedGroup.split('-')[0]);
  if(selected)hero.append(skyIcon(selected));
  const caption=el('div');caption.append(el('span','eyebrow',current.enabled?'YOUR SAVED ATMOSPHERE':'ORIGINAL GAME ENVIRONMENT'),el('h2','',preset?preset.label:'Choose your sky'),el('p','',selected?selected.title+' · Preset '+preset.number:''));
  hero.append(caption);box.append(hero,section('Time & weather','Select an icon to apply its first preset'));
  const grid=el('div','sky-groups');
  for(const group of groups){const active=group.id===current.selectedGroup,button=el('button','sky-group sky-'+group.id.split('-')[0]+(active?' selected':''));button.dataset.skyGroup=group.id;button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-label',group.title);button.append(skyIcon(group),el('strong','',group.title),el('small','',group.presets.length+' presets'+(group.weather?' · ☂':'')));button.addEventListener('click',()=>send('day',{group:group.id,number:active&&preset?preset.number:1}));grid.append(button);}
  box.append(grid);
  if(selected){box.append(section(selected.title+' presets','Click to apply and save'));const variants=el('div','sky-presets');
    for(const entry of selected.presets){const active=entry.aero===current.selectedAero,button=el('button','sky-preset'+(active?' selected':''));button.dataset.skyPreset=entry.number;button.setAttribute('aria-pressed',String(active));button.append(skyIcon(selected),el('span','',entry.label),el('small','','#'+String(entry.number).padStart(2,'0')));button.addEventListener('click',()=>send('day',{group:selected.id,number:entry.number}));variants.append(button);}box.append(variants);
  }
  return box;
}
function toggle(label,description,value,onChange,disabled=false){const row=el('div','setting'),text=el('div');text.append(el('h3','',label),el('p','',description));const button=el('button','switch');button.setAttribute('role','switch');button.setAttribute('aria-checked',String(value));button.setAttribute('aria-label',label);button.disabled=disabled;button.addEventListener('click',()=>onChange(!value));row.append(text,button);return row;}
function controls(rows){const group=el('div','settings-group');for(const row of rows){const current=value(row);let disabled=row.key==='clientFixes.privateChannel'&&data.runtime&&data.runtime.fixes&&!data.runtime.fixes.legacyRequired;if(row.key==='OnlyParty'&&data.settings.fps.Mode===3)disabled=true;if(['Hit_Me','Hit_Other','Hit_Damage'].includes(row.key)&&data.settings.fps.Hit_All)disabled=true;const item=toggle(row.label,row.description,current,value=>send('set',{key:row.key,value}),disabled);item.dataset.key=row.key;group.append(item);}return group;}
function numbers(rows){const group=el('div','settings-group');for(const row of rows){const line=el('div','setting number-row'),text=el('div'),form=el('form','number-form'),input=el('input'),button=el('button','small-button','Apply');text.append(el('h3','',row.label),el('p','',row.description));input.type='number';input.min=row.min;input.max=row.max;input.step=row.integer?1:'any';input.value=value(row);input.required=true;input.dataset.number=row.key;input.setAttribute('aria-label',row.label);button.type='submit';form.append(input,button);if(row.group==='camera'){const range=el('input','number-range');range.type='range';range.min=row.min;range.max=row.max;range.step=row.step;range.value=value(row);range.setAttribute('aria-label',row.label+' slider');form.prepend(range);range.addEventListener('input',()=>{input.value=range.value;});range.addEventListener('change',()=>send('number',{key:row.key,value:Number(range.value)}));input.addEventListener('input',()=>{if(input.validity.valid)range.value=input.value;});}form.addEventListener('submit',event=>{event.preventDefault();if(input.validity.valid)send('number',{key:row.key,value:Number(input.value)});});line.append(text,form);group.append(line);}return group;}
function taskCard(){const status=data.runtime&&data.runtime.box||{state:'idle',used:0,available:true},box=el('div','settings-group'),heading=el('div','list-heading');heading.append(el('h3','','Repeat item use'),el('span','count',status.state.toUpperCase()));box.append(heading);const content=el('div','task-content');content.append(el('p','','Arm the opener, then manually use the box or item you want to repeat. It waits for confirmed results and never starts itself after login.'));const actions=el('div','task-actions'),start=el('button','small-button','Arm opener'),stop=el('button','small-button','Stop');start.disabled=status.state!=='idle'||!status.available;stop.disabled=status.state==='idle';start.addEventListener('click',()=>send('box',{action:'start'}));stop.addEventListener('click',()=>send('box',{action:'stop'}));actions.append(start,stop,el('span','',status.used+' confirmed uses'+(status.item?' · Item '+status.item:'')));content.append(actions);box.append(content);return box;}
function cacheCard(){
 const current=data.runtime&&data.runtime.cache||{},stats=current.counters||{},box=el('div','settings-group cache-card');
 const header=el('div','list-heading');header.append(el('h3','','Inventory cache'),el('span','count',current.supported===false?'UNSUPPORTED DEFINITION':data.settings.cache.enabled?'ENABLED':'PAUSED'));box.append(header);
 const grid=el('div','cache-metrics');
 for(const [label,value]of [['Lists cached',current.lists||0],['Memory used',((current.cachedBytes||0)/1024).toFixed(1)+' KiB'],['Updates filtered',stats.suppressed||0],['Net data saved',((current.netSavedBytes||0)/1024).toFixed(1)+' KiB']]){const metric=el('div');metric.append(el('span','',label),el('strong','',value));grid.append(metric);}box.append(grid);
 const detail=el('p','task-content','Changed items, equipment, money and manually requested lists always pass through. Counters update when you refresh; no background polling.');box.append(detail);
 const actions=el('div','cache-actions');for(const [action,label]of [['refresh','Refresh counters'],['reset','Clear cache'],['stats','Reset counters']]){const button=el('button','small-button',label);button.dataset.cacheAction=action;button.addEventListener('click',()=>send('cache',{action}));actions.append(button);}box.append(actions);
 if(data.settings.cache.measure){const timing=el('p','task-content','Processing: '+(stats.measured?stats.processingNs/stats.measured/1000:0).toFixed(2)+' µs average · '+((stats.peakNs||0)/1000).toFixed(2)+' µs peak. Hook time, not game FPS.');box.append(timing);}return box;
}
function quickAccess(entries){
 const fragment=document.createDocumentFragment(),all=entries||(data.runtime&&data.runtime.access&&data.runtime.access.entries)||[];
 for(const [id,title]of [['storage','Your storage'],['trade','Trade'],['merchants','Supplies & merchants'],['services','Services & travel']]){
  const rows=all.filter(row=>row.group===id);if(!rows.length)continue;
  fragment.append(section(title,rows.length+' shortcuts'));const grid=el('div','access-grid');
  for(const row of rows){const button=el('button','access-card'),icon=skyIcon(row),copy=el('div');button.dataset.access=row.id;button.disabled=!row.available;button.title=row.requiresNpc&&!row.learned?'Visit this NPC once during this login.':row.description;
   copy.append(el('strong','',row.label),el('small','',row.requiresNpc&&!row.learned?'Visit NPC to enable':row.description));button.append(icon,copy,el('span','access-arrow','↗'));button.addEventListener('click',()=>send('access',{id:row.id}));grid.append(button);
  }fragment.append(grid);
 }return fragment;
}
function modes(){const fragment=document.createDocumentFragment();fragment.append(section('Performance mode','A starting point, with your own filters on top'));const group=el('div','mode-grid');const descriptions=[['Original','Mode effects off'],['Balanced','Fewer projectile and hit effects'],['Performance','Stronger visual reduction'],['Minimal','Hide nearby players too']];descriptions.forEach(([name,description],value)=>{const button=el('button','mode'+(data.settings.fps.Mode===value?' selected':''));button.dataset.mode=value;button.setAttribute('aria-pressed',String(data.settings.fps.Mode===value));button.append(el('span','mode-num','MODE 0'+value),el('strong','',name),el('small','',description));button.addEventListener('click',()=>send('mode',{value}));group.append(button);});fragment.append(group);return fragment;}
function chips(parent,values,remove){const box=el('div','chips');for(const value of values){const chip=el('span','chip',value),button=el('button','','×');button.setAttribute('aria-label','Remove '+value);button.addEventListener('click',()=>remove(value));chip.append(button);box.append(chip);}parent.append(values.length?box:el('div','empty','No entries. Add one above.'));}
function listEditor(row){const box=el('div','settings-group'),header=el('div','list-heading'),values=value(row).map(item=>row.type==='npc'?item.zone+':'+item.templateId:String(item));header.append(el('h3','',row.label),el('span','count',values.length+' saved'));box.append(header);const form=el('form','list-form'),input=el('input');input.placeholder=row.type==='player'?'Character name':row.type==='npc'?'Hunting zone : template ID':row.type==='message'?'SMT_MESSAGE_NAME':'Numeric ID';input.setAttribute('aria-label','Add '+row.label);input.required=true;input.maxLength=row.type==='message'?104:80;const add=el('button','small-button','Add');add.type='submit';form.append(input,add);form.addEventListener('submit',event=>{event.preventDefault();send('list',{key:row.key,operation:'add',value:row.type==='message'?input.value.toUpperCase():input.value});});box.append(form);chips(box,values,value=>send('list',{key:row.key,operation:'remove',value}));return box;}
function classes(){
  const box=el('div','settings-group'),presets=el('div','class-presets');
  presets.append(el('span','count','MODE 2 PRESETS'));
  for(const [value,label] of [['healers','Healers only'],['all','Show all'],['none','Hide all']]){
    const button=el('button','small-button',label);button.dataset.classPreset=value;
    button.addEventListener('click',()=>send('class',{kind:'preset',value}));presets.append(button);
  }
  box.append(presets);
  const header=el('div','class-head'),select=el('select');select.setAttribute('aria-label','Class');
  for(const [id,item] of Object.entries(data.settings.fps.ClassesData)){const option=el('option','',item.name[0].toUpperCase()+item.name.slice(1));option.value=id;select.append(option);}
  select.value=selectedClass;select.addEventListener('change',()=>{selectedClass=select.value;render();});
  const mode2=data.settings.fps.Mode===2;
  header.append(select,el('span','count',mode2?'Mode 2 · per-class visibility':'Per-class controls'));box.append(header);
  const current=data.settings.fps.ClassesData[selectedClass];
  box.append(toggle('Hide this class','Hide the character itself, independently of skill visuals.',current.isHidden,value=>send('class',{id:selectedClass,kind:'visibility',value})));
  if(mode2)box.append(toggle('Show this class’s skill effects in Mode 2','ON shows animations, projectiles and hit effects. OFF keeps Mode 2 suppression.',!!current.CD_KeepSkillEffects,value=>send('class',{id:selectedClass,kind:'keep',value})));
  else box.append(toggle('Hide this class’s skill effects','Suppress this class’s skill animations in modes 0 and 1.',current.CD_HideBlacklistedSkills,value=>send('class',{id:selectedClass,kind:'skills',value})));
  box.append(el('p','task-content','Mode 2 presets change skill visuals only. Hidden characters and individual skill/projectile ID filters remain respected.'));
  const form=el('form','list-form'),input=el('input');input.placeholder='Skill group ID (1–49)';input.type='number';input.min='1';input.max='49';input.required=true;input.setAttribute('aria-label','Skill group ID');
  const add=el('button','small-button','Toggle ID');form.append(input,add);form.addEventListener('submit',event=>{event.preventDefault();send('class',{id:selectedClass,kind:'skill',value:input.value});});box.append(form);chips(box,current.CD_SkillsBlacklist.map(String),value=>send('class',{id:selectedClass,kind:'skill',value}));return box;
}
function render(){
  if(!data)return;
  const scroll=$('#content').scrollTop,query=$('#search').value.trim().toLowerCase(),definition=pages.find(row=>row[0]===page)||pages[0];
  $('#breadcrumb').textContent=query?'SEARCH':definition[1].toUpperCase();
  $('#heading').textContent=query?'Find your setting.':definition[2];
  $('#subtitle').textContent=query?'Matching controls from every section.':definition[3];
  document.querySelectorAll('nav button').forEach(button=>button.classList.toggle('active',button.dataset.page===page));
  const target=$('#content');target.replaceChildren();
  if(query){
    const matches=row=>(row.label+' '+row.description).toLowerCase().includes(query),rows=data.controls.filter(matches),values=data.numbers.filter(matches);
    target.append(section('Search results',rows.length+values.length+' settings'));
    if(rows.length)target.append(controls(rows));if(values.length)target.append(numbers(values));
    const skyMatches=(data.dayGroups||[]).filter(g=>(g.title+' sky weather '+g.presets.map(p=>p.label).join(' ')).toLowerCase().includes(query));
    if(skyMatches.length)target.append(skies(skyMatches));
    const accessMatches=((data.runtime&&data.runtime.access&&data.runtime.access.entries)||[]).filter(row=>(row.label+' '+row.description+' '+row.id).toLowerCase().includes(query));
    if(accessMatches.length)target.append(quickAccess(accessMatches));
    if(!rows.length&&!values.length&&!skyMatches.length&&!accessMatches.length)target.append(el('p','tip','No matching settings. Try “camera”, “motes” or “night”.'));
  }else if(page==='overview'){
    target.append(modes(),section('Everyday helpers','Your existing preferences are preserved'),controls(data.controls.filter(row=>row.root)),el('div','tip','Your settings apply immediately. Modes affect FPS visuals; individual helpers remain independent. Use the sidebar to configure camera distance, inventory tools and party markers.'));
  }else if(page==='classes'){
    target.append(classes(),el('div','tip','Skill IDs here are skill groups, not full packet skill IDs. Use the in-game command reference for the original NPC and skill search tools.'));
  }else if(page==='day'){
    target.append(skies(),section('Dynamic Day settings'),controls(data.controls.filter(row=>row.group==='day')),numbers(data.numbers.filter(row=>row.group==='day')),el('div','tip','Your selection applies immediately and is saved for future spawns. Switch Dynamic Day off to restore the last server-provided environment. Some maps may render the same preset differently.'));
  }else if(page==='access'){
    target.append(controls(data.controls.filter(row=>row.group==='access')),quickAccess(),el('div','tip','NPC shortcuts become available after you encounter that NPC during the current login. Out-of-view targets remain learned; a new login clears them. Availability and guild-bank permissions depend on your server.'));
  }else{
    const rows=data.controls.filter(row=>row.group===page),values=data.numbers.filter(row=>row.group===page);
    if(page==='performance')target.append(modes(),cacheCard());
    if(page==='inventory')target.append(taskCard());
    target.append(section(definition[1],rows.length+' controls'),controls(rows));
    if(values.length)target.append(section(page==='camera'?'Camera values':page==='inventory'?'Opening interval':'Beam styles'),numbers(values));
    if(page==='filters'||page==='notifications')for(const row of data.lists)if(row.key.startsWith('messages.')===(page==='notifications'))target.append(listEditor(row));
    if(page==='camera')target.append(el('div','tip','Type a value and press Apply, or release a slider to save. Overrides apply after loading and remain independent of performance modes.'));
    if(page==='stability'){
      const state=data.runtime&&data.runtime.fixes;target.append(el('div','tip','Each fix runs independently. The private-channel fix applies only to patches 90–96; it stays inactive on your current patch when it is not needed. Changes apply immediately.'));
      if(state&&state.unavailable.length)target.append(el('p','tip','Unavailable on this client: '+state.unavailable.join(', ')+'. See the Toolbox console for details.'));
    }
    if(page==='utilities'){
      const clear=el('button','small-button','Clear existing death markers');clear.addEventListener('click',()=>send('clear-markers',{}));target.append(clear,el('div','tip','Party beams are visual markers and cannot be looted. AFK guard blocks the client’s idle lobby request only; move once or switch it off before manually returning to character selection after a long idle period.'));
    }
  }
  target.scrollTop=scroll;
}
bridge.listen((type,payload)=>{
  if(type==='state'){
    if(!data&&pages.some(row=>row[0]===payload.page))page=payload.page;
    data=payload;document.body.className='theme-'+String(payload.theme).toLowerCase().replace(/[^a-z]/g,'');render();$('#save-status').textContent='All changes are saved automatically.';
  }else if(type==='page'&&pages.some(row=>row[0]===payload)){
    page=payload;$('#search').value='';render();
  }else if(type==='notice'){
    const notice=$('#notice');notice.textContent=payload;notice.classList.add('visible');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>notice.classList.remove('visible'),3500);
  }
});
$('#search').addEventListener('input',render);$('#close').addEventListener('click',()=>send('close'));$('#minimize').addEventListener('click',()=>send('minimize'));$('#help').addEventListener('click',()=>send('legacy'));document.addEventListener('keydown',event=>{if(event.ctrlKey&&event.key.toLowerCase()==='k'){event.preventDefault();$('#search').focus();}});send('init');

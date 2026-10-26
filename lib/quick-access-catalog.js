'use strict';
const rows=[
 ['broker','Trade broker','Browse the trade broker.','trade','M3 5h14v11H3z M6 5V3h8v2 M3 9h14',1,28],
 ['bank','Personal bank','Open your personal storage.','storage','M3 5h14v12H3z M3 9h14 M8 12h4',0,[26,1]],
 ['gbank','Guild bank','Open your guild storage.','storage','M2 8l8-5 8 5 M4 9v7 M8 9v7 M12 9v7 M16 9v7 M2 17h16',0,[26,3]],
 ['pbank','Pet bank','Open pet storage.','storage','M5 12c-4 5 14 5 10 0l-5-5z M4 6v1 M8 3v2 M12 3v2 M16 6v1',0,[26,9]],
 ['wardrobe','Wardrobe','Open wardrobe storage.','storage','M4 3h12v14H4z M10 3v14 M7 9v2 M13 9v2',0,[26,12]],
 ['vgs','Vanguard supply','Vanguard supply merchant.','merchants','M10 2l6 3v5c0 4-6 8-6 8s-6-4-6-8V5z M7 9l2 2 4-4',0,[49,609],183,2058],
 ['vgc','Vanguard crystals','Vanguard crystal merchant.','merchants','M6 3h8l4 6-8 9L2 9z M2 9h16 M6 3l4 15 4-15',0,[49,6090],183,2059],
 ['gl','Guardian Legion','Guardian Legion merchant.','merchants','M10 2l7 4v5l-7 7-7-7V6z M7 8h6 M10 5v9',0,[49,6112],63,6112],
 ['ss','Specialty store','Browse specialty supplies.','merchants','M3 7h14l-2 10H5z M6 7l4-5 4 5',0,[9,250],183,2109],
 ['dm','Development','Development merchant.','merchants','M4 16l5-5 M8 3l2 4 4 1 3-4 1 5-4 4-5-1-3 5-3-3 5-4-1-5z',0,[9,111],183,2005],
 ['merch','General merchant','Buy and sell ordinary supplies.','merchants','M3 8V4h14v4 M4 8v9h12V8 M2 8h16 M7 17v-5h6v5',0,[9,70310],183,2019],
 ['sm','Smelting','Smelting merchant.','merchants','M4 17V9h12v8z M6 9V6h8v3 M9 6l-1-3 M12 6l1-4',0,[9,190],183,2006],
 ['kaia','Kaia','Open the supported Kaia service.','services','M10 2l2 5 5 3-5 2-2 6-2-6-5-2 5-3z',0,[20,6115],411,7002],
 ['fovarth','Fovarth','Contact the learned Fovarth NPC.','services','M4 17V7l6-4 6 4v10 M7 17v-6h6v6',3,undefined,411,7002],
 ['pegasus','Pegasus','Contact the learned Pegasus NPC.','services','M10 17V7 M10 11C3 11 2 6 2 3c5 0 8 4 8 8s3-8 8-8c0 3-1 8-8 8',3,undefined,599,903]
];
exports.entries=rows.map(([id,label,description,group,icon,type,data,huntingZoneId,templateId])=>({id,label,description,group,icon,command:{type,...(data!==undefined?{data}:{}),...(huntingZoneId?{huntingZoneId,templateId}:{})}}));
exports.defaults=Object.fromEntries(exports.entries.map(row=>[row.id,row.command]));
const reserved=new Set(['utils','game-utils','fps','fps-utils','afk','hidemotes','skip','jsf','bb','day','camera','instant','filter','box','pdn','cache','fixes','access','anywhere','toolbox','proxy','constructor','prototype','list','status','gui','on','off']);
exports.normalize=function(input){
 const result={};
 for(const [id,value] of Object.entries(input&&typeof input==='object'?input:exports.defaults).slice(0,64)){
  if(!/^[a-z][a-z0-9-]{0,31}$/.test(id)||reserved.has(id)||!value||typeof value!=='object')continue;
  const type=value.type===undefined?0:value.type;if(![0,1,2,3].includes(type))continue;
  const output={type},positive=n=>Number.isInteger(n)&&n>0&&n<=2147483647;
  if(type===1){if(!positive(value.data))continue;output.data=value.data;}
  if(type===0){if(!Array.isArray(value.data)||value.data.length!==2||!value.data.every(positive))continue;output.data=value.data.slice();}
  if(type===2||type===3||value.huntingZoneId!==undefined||value.templateId!==undefined){
   const pair=type===2&&Array.isArray(value.data)?value.data:[value.huntingZoneId,value.templateId];
   if(!pair.every(positive)||pair.length!==2)continue;
   output.huntingZoneId=pair[0];output.templateId=pair[1];
  }
  if(typeof value.niceName==='string')output.niceName=value.niceName.slice(0,60);
  result[id]=output;
 }
 return result;
};

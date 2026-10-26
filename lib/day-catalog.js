'use strict';
const sets=require('./data/aero.json').enumAero;
const labels={
 MIX_PIC_Sky_Aeroset:'Soft morning',Kubel_Fotress_path02:'Fortress dawn',SPR_Dawn_Garden_01_AERO:'Dawn garden',EX_ASW_C_CE_AERO:'Union skies',Liar_AERO:'Quiet dawn',Liar_AERO_02:'Golden haze',SPR_Hookian_Swamp_AERO_FINAL:'Misty marsh',JUG_Misty_Island_02_AERO:'Misty island',
 HWC_C_DarkRift01_AERO:'Dark rift',Caliban_Ext_Boss_AERO:'Storm clouds',BF_snowBattle_renew_AERO:'Snowfall',Roundup_Hunting_AERO:'Open daylight',A_Island_02_AERO:'Island daylight',JungleCoast_AERO_c_FINAL:'Coastal sun',Basement_Outside_AERO:'Clear skies',RNC_Inside_AERO:'Deep overcast',HWC_B_ICE_Plain_OLD_b_AERO:'Frozen plains',EX01_ATW_Start_01_Rain_A_AERO:'Gentle rain',
 EX01_SWN_SD_AEROSET:'Warm sunset',EX01_ATW_Start_01_Inner_AERO:'Evening glow',A_Island_SD_AERO:'Island sunset',ICE_ICE_Plain2_renew_AERO:'Icy twilight',ASE_B_MoonCastle_AERO:'Moonlit castle',VK_DailyQuest_AERO:'Velika night',VK_DailyQuest_02_AERO:'Velika after dark',Laknan_1F_FINAL_AERO:'Deep night',Durion_01Named_AERO:'Midnight blue'
};
const titles={morning:'Morning',day:'Daylight',evening:'Evening',night:'Night'};
const icons={morning:'M2 14h16 M4 11a6 6 0 0 1 12 0 M10 2v3 M3 5l2 2 M17 5l-2 2 M2 17h16',day:'M10 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10 M10 1v2 M10 17v2 M1 10h2 M17 10h2 M3 3l2 2 M15 15l2 2 M3 17l2-2 M15 5l2-2',evening:'M2 13h16 M4 12a6 6 0 0 1 12 0 M10 1v5 M7 3l3 3 3-3 M2 16h16 M5 19h10',night:'M15 2A8 8 0 1 0 18 13 7 7 0 0 1 15 2 M5 3v4 M3 5h4'};
const groups=Object.entries(sets).map(([id,aeros])=>{const base=id.split('-')[0];return{id,title:titles[base]+(id.endsWith('-weather')?' · Weather':''),icon:icons[base],weather:id.endsWith('-weather'),presets:aeros.map((aero,index)=>({number:index+1,aero,label:labels[aero.split('.').pop()]||'Preset '+(index+1)}))};});
const valid=(group,aero)=>Object.prototype.hasOwnProperty.call(sets,group)&&sets[group].includes(aero);
module.exports={groups,sets,valid};

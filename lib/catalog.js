'use strict';
// Shared, explicit UI allowlist. The renderer never supplies executable commands.
const rows = [
 ['utilities','afk','AFK guard','Prevent the client’s idle return to character selection after one hour.','utils afk'],
 ['utilities','hideMotes','Hide others’ motes','Keep your own motes visible; hide other players’ motes.','utils motes'],
 ['utilities','skipCutscenes','Skip cutscenes','Acknowledge and skip supported movie sequences.','utils cutscenes'],
 ['utilities','quickDialog','F-key dialogs','Make supported dialog buttons accessible with F. Does not select choices for you.','utils dialog'],
 ['utilities','unfilteredChat','Unfiltered chat','Allow the original chat-filter workaround for plain FONT messages.','utils chat'],
 ['performance','OnlyParty','Only show party members','Hide nearby players outside your current party. Unavailable in mode 3.','fps party'],
 ['performance','RaidAutoChange','Raid mode switching','Use the original automatic performance mode behavior for raids.','fps raid'],
 ['performance','GuardianAutoChange','Guardian mode switching','Use automatic performance mode changes for Guardian events.','fps guardian'],
 ['performance','HideAllAbnormalities','Hide other players’ abnormality effects','Important effects retain the original exceptions.','fps abn all'],
 ['performance','HideAllProjectiles','Hide other players’ projectiles','Reduce projectile visuals; your own actions keep the original exceptions.','fps proj all'],
 ['performance','Hit_Me','Hide your hit effects','Reduce your own impact visuals. Unavailable while Hide all hit visuals is enabled.','fps hit me'],
 ['performance','Hit_Other','Hide others’ hit effects','Reduce other players’ impact visuals.','fps hit other'],
 ['performance','Hit_Damage','Hide damage numbers','Hide combat damage numbers.','fps hit damage'],
 ['performance','Hit_All','Hide all hit visuals','Suppress impact visuals and damage numbers together.','fps hit all'],
 ['visuals','HideMySummons','Hide your summons','Hide NPCs summoned by your character.','fps summons me'],
 ['visuals','HideOthersSummons','Hide others’ summons','Hide NPCs summoned by other players.','fps summons others'],
 ['visuals','HideMyServants','Hide your pets','Hide your own servants.','fps pet me'],
 ['visuals','HideOthersServants','Hide others’ pets','Hide other players’ servants.','fps pet others'],
 ['visuals','HideServantBalloons','Hide pet speech bubbles','Reduce servant chat balloons.','fps petspopup'],
 ['visuals','HideFireworks','Hide fireworks','Suppress supported firework effects.','fps fireworks'],
 ['visuals','Hideguildlogos','Hide guild logos','Refresh nearby appearances after changing this option.','fps guildlogo'],
 ['visuals','ShowStyle','Hide costumes and styles','Reduce supported appearance details.','fps style'],
 ['visuals','HideMonsterDeathAnimation','Hide monster death animations','Remove supported defeated-monster animations.','fps monsterdeathani'],
 ['visuals','HideHpNumbers','Hide HP change numbers','Suppress your floating HP change numbers.','fps hpnumbers'],
 ['visuals','HideMpNumbers','Hide MP change numbers','Suppress your floating MP change numbers.','fps mpnumbers'],
 ['visuals','MuteOthersVoice','Mute other players’ voices','Suppress supported character voice changes.','fps muteothers'],
 ['visuals','ActionScripts','Hide NPC camera zooms','Keep important action-script exceptions.','fps npczoom'],
 ['visuals','PvpTraps','Keep PvP traps visible','Preserve trap visibility when hiding projectiles.','fps pvptraps'],
 ['filters','HideOwnBlacklistedAbns','Screen effect filter','Use your saved screen abnormality IDs.','fps screenabns'],
 ['filters','HideBlacklistedAbnormalities','Abnormality filter','Hide effects matching saved abnormality IDs.','fps abn blacklist'],
 ['filters','HideBlacklistedProjectiles','Projectile filter','Hide projectiles matching saved IDs.','fps proj blacklist'],
 ['filters','HideBlacklistedNpcs','NPC filter','Hide NPCs matching saved hunting-zone and template IDs.','fps npc'],
 ['filters','HideBlacklistedSkills','Class skill filter','Use the per-class skill lists below.','fps skills blacklist'],
 ['filters','HideBlacklistedDrop','Ground item filter','Hide matching drops; your own drops remain visible.','fps drops'],
 ['utilities','StreamMode','Quiet chat output','Suppress FPS status messages in game chat.','fps stream']
];
exports.controls=rows.map(([group,key,label,description,command])=>({group,key,label,description,command,root:group==='utilities'&&key!=='StreamMode'}));
const extra=[
 ['performance','cache.enabled','Inventory cache','Skip identical unsolicited inventory lists. Changed and manually requested lists pass through.'],
 ['performance','cache.measure','Measure cache processing','Measure this filter’s processing cost. This is not an FPS measurement.'],
 ['stability','clientFixes.chat','Chat formatting guard','Remove unsupported incoming chat tags while preserving supported formatting and links.'],
 ['stability','clientFixes.swim','Swimming packet guard','Filter identical native swimming updates with a one-second heartbeat. Other movement is untouched.'],
 ['stability','clientFixes.gear','Equipment upgrade guard','Retain the targeted upgrade tooltip workaround; original results pass if the refresh fails.'],
 ['stability','clientFixes.privateChannel','Legacy chat login fix','Delay private-channel login on patches 90–96 only. Not needed on patch 100.'],
 ['access','quickAccess.enabled','Quick Access','Enable your saved broker, storage and merchant shortcuts. Nothing opens automatically.'],
 ['utilities','bodyBlock.enabled','Anti Body Block','Reduce party-member bodyblocking with client-only party-info refreshes.'],
 ['day','day.enabled','Dynamic Day','Keep your selected sky and weather across character spawns and map changes.'],
 ['utilities','exitInstantly','Instant game exit','Skip the normal exit countdown after you choose to exit.'],
 ['camera','camera.enabled','Camera control','Apply your saved camera preferences.'],
 ['camera','camera.distanceEnabled','Override camera distance','Keep the same camera distance across supported map changes.'],
 ['camera','camera.fovEnabled','Override field of view','Use your preferred field of view.'],
 ['camera','camera.shakeEnabled','Camera shake','Enable shaking with your own power and speed multipliers.'],
 ['notifications','messages.enabled','Filter notifications','Reduce repetitive system notifications.'],
 ['notifications','messages.includeSynthetic','Include module messages','Also filter compatible system messages created by other modules.'],
 ['utilities','party.enabled','Party death markers','Show a beam at the location of fallen party members.'],
 ['utilities','party.classBasedBeams','Use role-based beams','Use different marker items for tanks, healers and other classes.']
];
for(const purpose of ['enchant','upgrade','soulbind','merge','dismantle'])extra.push(['inventory','instant.'+purpose,'Instant '+purpose,'Skip the supported '+purpose+' progress animation after you initiate it.']);
const descriptions={rewards:'Gacha, maximum enchant and premium composition rewards.',items:'Item use, deletion and equipment experience notices.',upgrade:'Enchant and event-seed result notices.',party:'Party death, resurrection and removal notices. Visual death beams are separate.',events:'Hunting-zone events and Golden Bell notices.',fishing:'Fishing reward notices.',guild:'Guild quest announcements.',skills:'Skill failure category notices.',buffs:'Buff application failure notices.',glyphs:'Type-6 glyph messages only.'};
for(const [key,description] of Object.entries(descriptions))extra.push(['notifications','messages.groups.'+key,key[0].toUpperCase()+key.slice(1)+' notices',description]);
for(const [group,key,label,description] of extra)exports.controls.push({group,key,label,description,section:true,command:'utils setting '+key});
exports.numbers=[
 ['day','day.delayAtSpawn','Apply after spawn','Milliseconds to wait after your character appears.',0,30000,100,true],
 ['day','day.transitionTime','Sky transition','Seconds to blend into a newly selected environment.',0,60,1,false],
 ['camera','camera.distanceValue','Camera distance','World units. Your saved distance is retained.',10,5000,10,true],
 ['camera','camera.fovValue','Field of view','Camera angle in degrees.',30,120,1,false],
 ['camera','camera.shakePower','Shake power','0 disables movement intensity; 1 is the normal multiplier.',0,100,.25,false],
 ['camera','camera.shakeSpeed','Shake speed','Speed multiplier for camera shaking.',0,100,.25,false],
 ['inventory','box.delayMs','Minimum item-use interval','0 uses confirmed results as soon as they arrive. A watchdog retries only if a response is missing.',0,60000,100,true],
 ['utilities','party.beamsStyle.tank','Tank beam item ID','Visual marker only. It cannot be looted.',1,2147483647,1,true],
 ['utilities','party.beamsStyle.healer','Healer beam item ID','Visual marker only. It cannot be looted.',1,2147483647,1,true],
 ['utilities','party.beamsStyle.default','Default beam item ID','Used for other roles or when role-based beams are off.',1,2147483647,1,true]
].map(([group,key,label,description,min,max,step,integer])=>({group,key,label,description,min,max,step,integer}));
exports.lists=[
 ['PlayersBlacklist','Players','player'],['DropBlacklist','Ground items','id'],['OwnAbnormalsBlacklist','Screen effects','id'],
 ['AbnormalitiesBlacklist','Abnormalities','id'],['ProjectilesBlacklist','Projectiles','id'],['NpcsBlacklist','NPCs','npc']
].map(([key,label,type])=>({key,label,type}));
exports.lists.push({key:'messages.blockedMessages',label:'Always blocked messages',type:'message'},{key:'messages.allowedMessages',label:'Always visible messages',type:'message'});
exports.value=(settings,row)=>{if(row.section||row.key.includes('.'))return row.key.split('.').reduce((obj,key)=>obj[key],settings);return (row.root?settings:settings.fps)[row.key];};

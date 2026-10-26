# Game Utils

A TERA Toolbox companion maintained by **CEM**. Seventeen familiar modules share one settings panel: FPS Utils, AFKer, Hide Motes, Auto Cutscene, JustSpamF, Potty Mouth, Message Filter, Instant Everything, Exit Instantly, Generic Box Opener, Camera Control, Party Deaths Notifier, Anti Body Block, Dynamic Day, Inventory Cache, Bugfix and Anywhere.

## Screenshots

Actual Game Utils 1.2.0 panel, captured from an isolated renderer with example settings and counters. No player profiles or chat are included; the example cache counters are not a performance benchmark.

### Overview

![Performance modes and everyday helpers in the shared panel](https://raw.githubusercontent.com/Volframid/game-utils/main/docs/screenshots/overview.png)

### Dynamic Day

![Time and weather icon buttons with individual sky presets](https://raw.githubusercontent.com/Volframid/game-utils/main/docs/screenshots/dynamic-day.png)

<details>
<summary>Performance modes and inventory cache</summary>

![Performance controls and example cache counters](https://raw.githubusercontent.com/Volframid/game-utils/main/docs/screenshots/performance.png)

</details>

<details>
<summary>Per-class skill visibility</summary>

![Mode 2 presets and the Priest skill-effects exception](https://raw.githubusercontent.com/Volframid/game-utils/main/docs/screenshots/classes.png)

</details>

<details>
<summary>Camera distance, field of view and shake</summary>

![Numeric camera fields, sliders and independent overrides](https://raw.githubusercontent.com/Volframid/game-utils/main/docs/screenshots/camera.png)

</details>

<details>
<summary>Quick Access</summary>

![Storage and broker shortcuts with icons and unavailable NPC states](https://raw.githubusercontent.com/Volframid/game-utils/main/docs/screenshots/quick-access.png)

</details>

## Use

Type `/8 utils` or `/8 fps g` to open the desktop panel. `/!utils` and `/!fps g` work with Toolbox's command chat syntax as well. Search settings, choose a performance mode, or manage classes and custom filter lists. Settings save automatically. The panel follows Toolbox's Black, Grey, White or Pink theme.

Opening the panel requests foreground focus and temporarily enables topmost status using an explicit Windows window level. If Windows declines the initial focus request, the panel retains its topmost status so you can click it. Once you have interacted with it, returning to the game or switching apps releases topmost status. Minimizing or closing always dismisses it. This is a Toolbox desktop panel, not a native game overlay. Exclusive fullscreen may require switching to borderless/windowed mode. `fps legacy` remains the native in-game menu. A bounded local `logs/panel-window.json` keeps only the last 24 window events for opening diagnostics; it contains no chat, character names, settings or keyboard contents and does not log combat packets.

The in-game FPS pages and NPC/skill search remain available through explicit subpages, for example `fps gui npcsearch "Bay Kamara"` and `fps gui class lancer`. `fps legacy` opens the original in-game menu. `fps legacy help` shows the original command reference. Without Electron, `fps g` falls back to the in-game menu.

In **Classes & skills**, Mode 2 has a separate **Show this class’s skill effects in Mode 2** switch for every class. **Healers only** enables Mode 2 and keeps Priest/Mystic animations, projectiles and hit effects visible; **Show all** and **Hide all** change all class exceptions together. Your own skills keep their existing behavior. Character visibility, individual skill/projectile ID filters, damage-number filters and Mode 3 still apply independently. These exceptions are saved and remain available when switching modes.

**Dynamic Day** has its own tab with icon buttons for morning, day, evening and night, each with clear and weather variants: eight groups and 60 preset entries. Select a group, then a preset; the choice saves and applies automatically. The same tab controls the spawn delay and transition duration. **Utilities** contains the persistent Anti Body Block switch. These settings are independent of FPS mode.

| Command | Action |
| --- | --- |
| `utils` / `utils gui` | Open Game Utils |
| `utils status` | Show the current mode and helper states |
| `fps mode 0` … `fps mode 3` | Original, Balanced, Performance, Minimal |
| `fps skill visible healers/all/none` | Apply a Mode 2 class-visual preset |
| `fps skill keep <class> [on/off]` | Change one class’s saved Mode 2 visual exception |
| `utils afk [on/off]` | Toggle idle lobby protection |
| `utils motes [on/off]` | Toggle hiding other players' motes |
| `utils cutscenes [on/off]` | Toggle supported cutscene skipping |
| `utils dialog [on/off]` | Toggle F-key dialog buttons |
| `utils chat [on/off]` | Toggle the chat-filter workaround |
| `bb [on/off/status]` | Toggle or inspect Anti Body Block |
| `day` / `utils day` | Open Dynamic Day |
| `day on/off` / `day show` | Enable, disable or inspect the saved sky |
| `day list [group]` / `day set <group> <number>` | List or select a sky preset |
| `camera` | Open Camera settings |
| `camera distance <10–5000>` | Enable and set camera distance |
| `camera distance disable` | Restore the last native distance, or the standard fallback |
| `camera fov <30–120>` / `camera fov disable` | Set or disable the FOV override |
| `camera shake on/off [power] [speed]` | Change camera shake; multipliers accept 0–100 |
| `instant` | Open Inventory tools |
| `instant enchant/upgrade/soulbind/merge/dismantle [on/off]` | Change one instant operation |
| `box` / `box start` / `box stop` / `box status` | Arm, stop or inspect repeating item use |
| `boxdelay <0–60000>` | Minimum item-use interval in milliseconds |
| `filter gui` | Open notification filtering settings |
| `filter [on/off/status/list/stats]` | Manage system-message filtering |
| `filter <category> [on/off]` | Change rewards/items/upgrade/party/events/fishing/guild/skills/buffs/glyphs |
| `filter block/allow/clear SMT_MESSAGE_NAME` | Manage individual message rules |
| `filter synthetic [on/off]` / `filter reset` | Include module-generated messages or reset filter rules |
| `pdn [on/off]` / `pdn class [on/off]` / `pdn clear` | Manage party death beams |
| `utils credits` | Show attribution |

Legacy commands `afk`, `hidemotes`, `skip`, `jsf`, `fps`, `fps-utils`, `bb`, `day`, and the numeric mode commands `0`–`3` remain available. Helpers are enabled by default except Dynamic Day, which starts disabled on a fresh installation. Existing preferences are retained during the local consolidation. Modes change performance options but do not disable the helpers. Mode 0 only turns off mode-dependent reductions; individually enabled filters still apply.

## Behavior

- Mote and ground-item filters share one visibility cache. Your own drops remain visible. A fake visual despawn does not erase the actual ground-item record.
- F-key dialogs only change supported button types. They never automatically select, buy, accept or teleport.
- Idle protection blocks the client's lobby request after one hour without supported movement. It cannot prevent a server-side disconnect. After a long idle period, move once or turn it off before manually returning to character selection.
- FPS settings apply to supported packet definitions. Some appearance changes require the next native spawn or an appearance refresh; the original guild-logo/style refresh remains in place.
- Camera distance, FOV, shake power and shake speed have numeric fields. Camera values also have sliders. Release a slider or press Apply to save. The override switches control whether the saved values apply. Camera preferences are reapplied after loading without a repeating polling timer.
- The box opener never starts automatically at login. Arm it and manually use the intended item. It repeats that item only, uses confirmed inventory changes or gacha completion to advance, stops on manual item use/session changes, and limits retries when acknowledgements are missing. A zero minimum interval adds no delay after a confirmed result; missing responses use a 5.5-second watchdog, up to three retries. It does not send skill or movement packets.
- Instant operations begin only after the corresponding native user action or your own merge contract. Toggling an operation applies immediately. Already replaced operations keep duplicate-request protection until their contract closes.
- Party beams are synthetic visual markers; loot requests targeting them are blocked. Revival, party departure and disabling markers remove them. Beam styles and role-based selection are editable under Utilities. Message Filter's party-notice setting does not disable beams.
- Message filtering preserves the original categories. Allow rules take priority over block rules; unknown/malformed messages pass through. `filter buffs off` and `filter skills off` restore those failure notices. Only type-6 glyph messages are filtered.
- Anti Body Block retains the original client-side party-info technique. It refreshes after relevant party updates and every five seconds while valid online party targets and genuine party data are available. Loading, logout and disabling stop its timers. It sends no server requests. Disabling stops future refreshes; reversing an already applied collision state is not verified.
- Dynamic Day changes the local sky using the original client-side environment reset technique; it does not modify game files or send server requests. Saved choices reapply after spawning with the configured delay. Disabling restores the last native sky received for the current zone, or asks the client to use its native environment if none was received. Zones can render the same preset differently. Pending changes are cancelled on map or character changes.
- Settings are shared across clients and saved atomically to `config.json`, with the previous valid file in `config.json.bak`. A failed save rolls the changed preferences back and reports the error. Session state, pending item operations and counters are not saved. Runtime settings and backups are private local files.
- Other servers may use different protocol definitions. The current installation is validated against GF 100.2 / protocol 376012; this does not establish live compatibility with every server.

Install only `game-utils` in `mods`. Remove the seventeen replaced modules to avoid duplicate behavior. Local settings are not distributed. This version has no remote updater or telemetry.

## Credits and license

CEM maintains the integration, modern panel and fixes. Original work remains credited:

- FPS Utils: Risenio; direct contributors Saegusae, codeagon/Pentagon, SerenTera, Kyoukaya, SaltyMonkey and Leyki. Indirect credits Kasea, Caali, Bernkastel, Pinkie Pie and Meishu.
- AFKer: TeraProxy, version 1.2.6; the original GNU GPL version 3 license is retained in `LICENSE`.
- Hide Motes: Menma. The original external login-reporting code is not included.
- Auto Cutscene: Tsunpot / Baldera-Mods.
- JustSpamF: Snug.
- Potty Mouth: Pinkie Pie.
- Message Filter: CEM's rewrite of Salt Remover by SaltyMonkey.
- Camera Control: Caali.
- Instant Everything: Caali, Pinkie Pie, m0py, Snug and beng.
- Exit Instantly: teralove.
- Generic Box Opener & Item User: Owyn; original code credits spaacecats/mwa-box-opener, its fork and the rootbeer opener.
- Party Deaths Notifier: SaltyMonkey, copyright 2020; its full MIT notice is retained in `lib/licenses/party-deaths-notifier.txt`.
- Dynamic Day: SaltyMonkey, copyright 2020; its full MIT notice is retained in `lib/licenses/dynamic-day.txt`.
- Anti Body Block: original client-side party-info technique from [Fruit/soler91](https://github.com/soler91/Anti-Bodyblock); subsequent maintenance and integration by CEM.

Original attribution and license terms are retained; CEM authorship describes the integration and new work, not authorship of the original modules. No warranty.

## Inventory Cache, Client Fixes and Quick Access

**Performance** includes Inventory Cache enable/measurement controls, cached-list/memory/filtered-update/net-data counters, refresh, cache clearing and counter reset. Counters refresh on demand; there is no background panel polling. Only identical unsolicited S_ITEMLIST v4 lists are filtered. Changed inventory, money, equipment and requested/opened lists pass through. Changed multipart lists restore any withheld prefix before the changed part. Turning off, unloading or resetting the cache restores a withheld prefix where applicable. Cache limits from the existing module are preserved. Unsupported definitions pass through.

**Client fixes** has independent controls for incoming chat formatting, duplicate swimming packets, the targeted equipment-upgrade workaround and private-channel login ordering. Swimming keeps a one-second heartbeat; combat/walking packets are unaffected. Equipment results remain visible if their tooltip refresh fails. The channel-ordering fix only runs on patches 90–96, and is not needed on patch 100. Unavailable fixes fail independently and are listed in the panel/console.

**Quick Access** provides icon buttons for broker, personal/guild/pet banks, wardrobe and supported merchants/services. Only your click or command opens a window. Ordinary NPC targets must be encountered once during each character login; learned out-of-view targets remain usable, while positively dead targets are removed. Login/lobby changes clear identities; loading pauses actions. Old persisted NPC game IDs are not reused. Requests are limited to one per 600 ms. Server rules, range/instance validity and guild-bank permissions still apply. The known contract wire layout uses the stock definition; the former globally injected version 69 is not installed.

Commands retained: `cache on/off/status/reset`, `cache measure on/off`, `cache stats reset`, `cache reload` (reloads the shared in-memory cache settings). New `cache refresh` refreshes panel counters. `fixes` opens Client Fixes; `fixes status` reports which fixes are running. `access` / `anywhere` opens Quick Access; `access list` lists your configured shortcuts; `access bank` opens a named action. Existing shortcuts such as `bank`, `broker`, `gbank`, `wardrobe`, `vgs` and `sm` remain when not already owned by another module. An alias conflict preserves the other module's command; the `access <name>` route remains available. `access on/off` toggles Quick Access.

Existing Game Utils preferences and standalone cache settings/quick-action definitions are migrated once during local installation. Runtime NPC IDs, cache bytes and counters are not saved. Friendlist Fix is not integrated or changed.

Additional credits: Anywhere by nathan; Inventory Cache and local Bugfix maintenance by CEM, adapted from the existing TERA client workarounds. Existing attribution and licenses remain intact.

## Install and update

Download the ZIP from [Releases](https://github.com/Volframid/game-utils/releases/latest) and extract the `game-utils` folder into `Toolbox/mods`. Keep only one installation of this module. Toolbox downloads subsequent updates automatically when module updates are enabled. Existing private settings are preserved.

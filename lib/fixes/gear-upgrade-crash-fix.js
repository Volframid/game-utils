'use strict';

// Keep the existing workaround limited to its verified gear template IDs.

const gearIDs = new Set([
    290000, 290001, 290002, 290003, 290010, 290011, 290012, 290013, 290020, 290021, 290022, 290023, 290030, 290031, 290032, 290033,
    290040, 290041, 290042, 290043, 290050, 290051, 290052, 290053, 290060, 290061, 290062, 290063, 290070, 290071, 290072, 290073,
    290080, 290081, 290082, 290083, 290090, 290091, 290092, 290093, 290100, 290101, 290102, 290103, 290110, 290111, 290112, 290113,
    290120, 290121, 290122, 290123, 290130, 290131, 290132, 290133, 290140, 290141, 290142, 290143, 290150, 290151, 290152, 290153,
    290160, 290161, 290162, 290163, 290170, 290171, 290172, 290173, 290180, 290181, 290182, 290183, 290190, 290191, 290192, 290193,
    290200, 290201, 290202, 290203, 290210, 290211, 290212, 290213, 290220, 290221, 290222, 290223, 290230, 290231, 290232, 290233,
    290240, 290241, 290242, 290243, 290250, 290251, 290252, 290253, 290260, 290261, 290262, 290263, 290270, 290271, 290272, 290273
]);

module.exports = function GearUpgradeCrashFix(mod, scope) {
    // Resolve the known wire format before installing the interception.
    mod.dispatch.protocol.resolveIdentifier('C_SHOW_ITEM_TOOLTIP_EX', 3);
    scope.hook('S_RESULT_EQUIPMENT_INHERITANCE', 1,
        { filter: { fake: false, modified: null, silenced: false } }, event => {
        if (!gearIDs.has(event.templateId) || event.dbid == null) return;
        try {
            const owner = mod.game.me.name;
            if (typeof owner !== 'string' || !owner) return;
            const sent = mod.toServer('C_SHOW_ITEM_TOOLTIP_EX', 3, {
                type: 18, id: event.dbid, unk1: 0, unk2: 0, unk3: 0,
                serverId: 0, playerId: -1, owner
            });
            if (sent === true) return false;
        } catch (_) {}
        scope.warn('Tooltip refresh failed; original equipment result was preserved.');
    });
};

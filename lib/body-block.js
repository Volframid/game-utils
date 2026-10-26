'use strict';

// Anti Body Block by CEM. Packet versions match the local client.
module.exports = function createBodyBlock(mod, config) {
  const game = mod.game;
  game.initialize("me");
  const members = new Map();
  const hooks = [];
  const enabled = () => config.bodyBlock.enabled;
  let previousEnabled = enabled();
  let inGame = Boolean(game.isIngame);
  let loading = Boolean(game.isInLoadingScreen);
  let cachedInfo = null;
  let interval = null;
  let pending = null;
  let disposed = false;

  const validId = id => typeof id === 'bigint' && id > 0n && id <= 0xffffffffffffffffn;
  const uint = (value, max) => Number.isInteger(value) && value >= 0 && value <= max;
  const keyOf = event => uint(event.serverId, 0xffffffff) && uint(event.playerId, 0xffffffff)
    ? event.serverId + ':' + event.playerId : null;
  const targets = () => new Set(Array.from(members.values())
    .filter(member => member.online && validId(member.gameId)).map(member => member.gameId));
  const canRun = () => !disposed && enabled() && inGame && !loading && cachedInfo !== null && targets().size > 0;

  function stop() {
    if (interval !== null) mod.clearInterval(interval);
    if (pending !== null) mod.clearTimeout(pending);
    interval = pending = null;
  }

  function refresh() {
    if (!canRun()) { stop(); return; }
    for (const gameId of targets()) {
      // Retain the original technique and unk4 value. Never send a server request.
      mod.send('S_PARTY_INFO', 1, {
        leader: gameId, unk1: cachedInfo.unk1, unk2: cachedInfo.unk2,
        unk3: cachedInfo.unk3, unk4: 1
      });
    }
  }

  function update(immediate = true) {
    if (!canRun()) { stop(); return; }
    if (interval === null) interval = mod.setInterval(refresh, 5000);
    // Defer until the triggering server packet has reached the client. Coalesce a burst.
    if (immediate && pending === null) pending = mod.setTimeout(() => {
      pending = null;
      refresh();
    }, 0);
  }

  function reset() {
    stop(); members.clear(); cachedInfo = null;
  }
  function enterGame() {
    reset(); inGame = true; loading = Boolean(game.isInLoadingScreen);
  }
  function leaveGame() {
    inGame = false; loading = false; reset();
  }
  function enterLoading() {
    loading = true; stop();
    // Other players can receive new gameIds after a zone change. Keep only our known id.
    const ownId = game.me && game.me.gameId;
    for (const member of members.values()) if (member.gameId !== ownId) member.gameId = null;
  }
  function leaveLoading() {
    loading = false; update();
  }
  const listeners = [
    ['enter_game', enterGame], ['leave_game', leaveGame],
    ['enter_loading_screen', enterLoading], ['leave_loading_screen', leaveLoading]
  ];
  for (const [event, listener] of listeners) mod.listen(game, event, listener);

  function hook(name, version, callback) {
    hooks.push(mod.hook(name, version, { filter: { fake: false, incoming: true } }, callback));
  }

  hook('S_PARTY_INFO', 1, event => {
    if (!uint(event.unk1, 0xffffffff) || !uint(event.unk2, 0xffff) || !uint(event.unk3, 0xffff)) return;
    cachedInfo = { unk1: event.unk1, unk2: event.unk2, unk3: event.unk3 };
    update();
  });
  hook('S_PARTY_MEMBER_LIST', 7, event => {
    members.clear();
    for (const member of event.members) {
      const key = keyOf(member);
      if (key === null) continue;
      members.set(key, { online: Boolean(member.online),
        gameId: member.online && validId(member.gameId) ? member.gameId : null });
    }
    if (!members.size) cachedInfo = null;
    update();
  });
  hook('S_LEAVE_PARTY', 1, reset);
  const removeMember = event => {
    members.delete(keyOf(event));
    if (!members.size) cachedInfo = null;
    update();
  };
  hook('S_LEAVE_PARTY_MEMBER', 2, removeMember);
  hook('S_BAN_PARTY_MEMBER', 1, removeMember);
  hook('S_LOGOUT_PARTY_MEMBER', 1, event => {
    const member = members.get(keyOf(event));
    if (member) { member.online = false; member.gameId = null; }
    update();
  });
  const spawnVersion = mod.majorPatchVersion >= 101 ? 17 : mod.majorPatchVersion >= 99 ? 16 : 15;
  hook('S_SPAWN_USER', spawnVersion, event => {
    const member = members.get(keyOf(event));
    if (member && validId(event.gameId)) {
      member.online = true; member.gameId = event.gameId; update();
    }
  });
  hook('S_DESPAWN_USER', 3, event => {
    let changed = false;
    for (const member of members.values()) if (member.gameId === event.gameId) {
      member.gameId = null; changed = true;
    }
    if (changed) update();
  });

  mod.command.add('bb', argument => {
    const action = argument === undefined ? '' : String(argument).toLowerCase();
    if (action === 'status') {
      mod.command.message('Anti Body Block: ' + (enabled() ? 'ON' : 'OFF') + ' | tracked targets: ' + targets().size);
      return;
    }
    if (action && action !== 'on' && action !== 'off') {
      mod.command.message('Usage: bb [on|off|status]'); return;
    }
    config.bodyBlock.enabled = action ? action === 'on' : !enabled();
    previousEnabled = enabled();
    update();
    mod.command.message('Anti Body Block enabled: ' + enabled());
  });

  const close = () => {
    if (disposed) return;
    disposed = true; reset();
    for (const [event, listener] of listeners) game.removeListener(event, listener);
    for (const handle of hooks) mod.unhook(handle);
    mod.command.remove('bb');
  };
  return {pause: stop, reset, close, refresh() {if(previousEnabled!==enabled()){previousEnabled=enabled();update();}}, snapshot: () => ({enabled: enabled(), targets: targets().size})};
};

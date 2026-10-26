'use strict';

module.exports = function SwimFix(mod, scope) {
  let last = null, lastForwardedAt = 0;
  const reset = () => { last = null; lastForwardedAt = 0; };
  const options = { order: -90, filter: { fake: false, modified: null, silenced: false } };
  scope.hook('C_PLAYER_LOCATION', 5, options, event => {
    // Types 8/9 are swimming/stop swimming in the installed protocol.
    if (event.type !== 8 && event.type !== 9) { reset(); return; }
    if (!event.loc || !event.dest) { reset(); return; }
    const sample = [event.type, event.w, event.lookDirection, event.loc.x, event.loc.y, event.loc.z,
      event.dest.x, event.dest.y, event.dest.z, event.jumpDistance, event.inShuttle];
    if (!sample.slice(0, 10).every(Number.isFinite)) { reset(); return; }
    const now = Date.now(), elapsed = now - lastForwardedAt;
    // Bound suppression: forward a fresh timestamp at least once each second.
    if (last && elapsed >= 0 && elapsed < 1000 && sample.every((value, i) => value === last[i])) return false;
    last = sample; lastForwardedAt = now;
  });
  for (const name of ['S_LOGIN', 'S_LOAD_TOPO', 'S_RETURN_TO_LOBBY']) scope.hook(name, 'event', reset);
};

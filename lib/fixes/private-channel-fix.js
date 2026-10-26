'use strict';

module.exports = function PrivateChannelFix(mod, scope) {
  if (mod.majorPatchVersion < 90 || mod.majorPatchVersion >= 97) return;
  let queue = [], passthrough = false, waiting = false;
  const deliver = data => {
    try { if (mod.toClient(data) === false) scope.warn('Channel delivery failed.'); }
    catch (_) { scope.warn('Channel delivery failed.'); }
  };
  const flush = delay => {
    scope.clearTimers(); waiting = false; passthrough = true;
    const pending = queue; queue = [];
    if (delay === 0) pending.forEach(deliver);
    else pending.forEach((data, i) => scope.timeout(() => deliver(data), delay + i * 250));
  };
  const reset = () => {
    scope.clearTimers(); queue = []; passthrough = false; waiting = false;
  };
  scope.hook('S_LOGIN', 'event', reset);
  scope.hook('S_RETURN_TO_LOBBY', 'event', reset);
  scope.hook('S_JOIN_PRIVATE_CHANNEL', 'raw', { filter: { fake: false, modified: null, silenced: false } }, (_, data) => {
    if (passthrough) return;
    if (queue.length >= 32) { flush(0); return; }
    queue.push(Buffer.from(data));
    // Missing chat-options replies must not retain packets indefinitely.
    if (!waiting) { waiting = true; scope.timeout(() => flush(0), 5000); }
    return false;
  });
  scope.hook('S_REPLY_CLIENT_CHAT_OPTION_SETTING', 'event', () => {
    if (!passthrough) flush(2000);
  });
  return () => flush(0);
};

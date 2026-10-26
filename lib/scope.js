'use strict';

// Every hook, command, listener and deferred callback belongs to this instance.
module.exports = function createScope(mod, { settings, persist, rollback, active = () => true }) {
  const hooks = new Set(), timers = new Set(), names = new Set(), listeners = [];
  let closed = false, generation = 0;
  function hook(...args) {
    const callback = args.pop();
    const token = mod.hook(...args, (...values) => !closed && active() ? callback(...values) : undefined);
    hooks.add(token); return token;
  }
  function clearTimeout(token) { timers.delete(token); return mod.clearTimeout(token); }
  function cancelTimers() { generation++; for (const timer of timers) mod.clearTimeout(timer); timers.clear(); }
  function wrap(handler) {
    if (typeof handler === 'function') return (...args) => {
      if(closed)return;const before=JSON.stringify(settings());let result;
      try{result=handler(...args);}catch(error){if(rollback)rollback(JSON.parse(before),error);throw error;}
      if(JSON.stringify(settings())!==before)try{persist();}catch(error){if(rollback)rollback(JSON.parse(before),error);mod.command.message('Change was not saved: '+error.message);}
      return result;
    };
    const tree = {}; for (const key of Object.keys(handler)) tree[key] = wrap(handler[key]); return tree;
  }
  const command = {
    add(alias, handler) { const aliases = Array.isArray(alias) ? alias : [alias]; mod.command.add(alias,wrap(handler)); aliases.forEach(name=>names.add(name)); },
    remove(alias) { mod.command.remove(alias); names.delete(alias); },
    message:(...args) => mod.command.message(...args), exec:(...args) => mod.command.exec(...args)
  };
  const overrides = {
    command, hook,
    tryHook(...args) { try { return hook(...args); } catch (_) { return null; } },
    unhook(token) { hooks.delete(token); return mod.unhook(token); },
    saveSettings:persist,
    setTimeout(callback, delay, ...args) { const current = generation; const token = mod.setTimeout(() => { timers.delete(token); if (!closed && current === generation) callback(...args); },delay); timers.add(token); return token; },
    clearTimeout,
    nextTick(callback) { const current = generation; process.nextTick(() => { if (!closed && current === generation) callback(); }); },
    listen(target, name, callback) { target.on(name,callback); listeners.push([target,name,callback]); }
  };
  const api = new Proxy(mod,{get(target,key) {
    if (key === 'settings') return settings();
    if (Object.prototype.hasOwnProperty.call(overrides,key)) return overrides[key];
    const value = Reflect.get(target,key,target); return typeof value === 'function' ? value.bind(target) : value;
  }});
  function close() {
    if (closed) return; closed = true; cancelTimers();
    for (const token of hooks) mod.unhook(token); hooks.clear();
    for (const name of names) mod.command.remove(name); names.clear();
    for (const [target,name,callback] of listeners) target.removeListener(name,callback); listeners.length=0;
  }
  return {api, close, cancelTimers};
};

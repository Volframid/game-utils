'use strict';

// Each fix owns its hooks and timers, including partial initialization failures.
module.exports = class Scope {
  constructor(mod, name) {
    this.mod = mod; this.name = name;
    this.hooks = []; this.timers = new Set(); this.warnings = new Set();
  }
  hook(...args) {
    const handle = this.mod.hook(...args);
    this.hooks.push(handle);
    return handle;
  }
  timeout(callback, delay) {
    const handle = this.mod.setTimeout(() => {
      this.timers.delete(handle);
      callback();
    }, delay);
    this.timers.add(handle);
    return handle;
  }
  clearTimers() {
    for (const handle of this.timers) this.mod.clearTimeout(handle);
    this.timers.clear();
  }
  warn(message) {
    if (this.warnings.has(message)) return;
    this.warnings.add(message);
    this.mod.warn('[' + this.name + '] ' + message);
  }
  destructor() {
    this.clearTimers();
    for (const handle of this.hooks) {
      try { this.mod.unhook(handle); }
      catch (_) { this.warn('Hook cleanup failed.'); }
    }
    this.hooks.length = 0;
  }
};

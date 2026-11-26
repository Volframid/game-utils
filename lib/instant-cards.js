'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RESOURCE = 'client/S1UI_CardComposeWindow.gpk';
const EXPECTED_HASH = '812ce57e62351d84159bab36c44376bc3b78714f37f0dff8d03dfe2df5f21839';

module.exports = class InstantCardsClient {
  constructor(mod) { this.mod = mod; }

  install(installer) {
    const mod = this.mod;
    if (mod.settings.instant?.cards === false) return;

    const { arch, majorPatchVersion, minorPatchVersion } = mod.clientInterface.info;
    if (arch !== 'x64' || Number(majorPatchVersion) !== 100 || Number(minorPatchVersion) !== 2) {
      mod.warn('Instant cards requires the TERA 100.02 x64 client.');
      return;
    }

    const source = path.resolve(mod.info.path, RESOURCE);
    const hash = crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
    if (hash !== EXPECTED_HASH) throw new Error('Instant cards GPK checksum mismatch. Reinstall Game Utils.');

    // Preserve the Toolbox installer's tracking and cleanup on Windows when
    // the user's account cannot create a symlink for this package.
    const symlink = fs.symlinkSync;
    fs.symlinkSync = (from, to, type) => {
      try {
        return symlink(from, to, type);
      } catch (error) {
        if (!['EPERM', 'EACCES'].includes(error.code) ||
            typeof from !== 'string' || typeof to !== 'string' ||
            path.resolve(from) !== source || path.basename(to) !== path.basename(RESOURCE)) throw error;
        fs.copyFileSync(from, to, fs.constants.COPYFILE_EXCL);
      }
    };
    try {
      installer.gpk(RESOURCE);
    } finally {
      fs.symlinkSync = symlink;
    }
  }
};

import Phaser from 'phaser';
import assetManifest from '../assets/manifest.json';
import { t } from '../i18n/index.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    const { width, height } = this.scale;
    const art = this.add.graphics();
    const zephyr = assetManifest.fighters.zephyr;
    const bajra = assetManifest.fighters.bajra;
    art.lineStyle(1, 0x436175);
    art.strokeRect(1, 1, width - 2, height - 2);
    art.lineBetween(16, height - 32, width - 16, height - 32);
    art.fillStyle(Phaser.Display.Color.HexStringToColor(zephyr.color).color);
    art.fillRect(
      width / 4 - zephyr.width / 2,
      height - 32 - zephyr.height,
      zephyr.width,
      zephyr.height,
    );
    art.fillStyle(Phaser.Display.Color.HexStringToColor(bajra.color).color);
    art.fillRect(
      (width * 3) / 4 - bajra.width / 2,
      height - 32 - bajra.height,
      bajra.width,
      bajra.height,
    );
    this.add
      .text(width / 2, 28, t('rendererReady'), {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#e4edf5',
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, 58, t('placeholderNotice'), {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#afbdca',
      })
      .setOrigin(0.5);
    document.querySelector('#game').dataset.ready = 'true';
  }
}

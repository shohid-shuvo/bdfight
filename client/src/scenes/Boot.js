import Phaser from 'phaser';
import { t } from '../i18n/index.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    const { width, height } = this.scale;
    const art = this.add.graphics();
    art.lineStyle(1, 0x436175);
    art.strokeRect(1, 1, width - 2, height - 2);
    art.lineBetween(16, height - 32, width - 16, height - 32);
    art.fillStyle(0x39ceb3);
    art.fillRect(width / 4 - 10, height - 90, 20, 58);
    art.fillStyle(0xedac5c);
    art.fillRect((width * 3) / 4 - 15, height - 102, 30, 70);
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

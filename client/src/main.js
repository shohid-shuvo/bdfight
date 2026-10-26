import Phaser from 'phaser';
import tuning from '@neon-dojo/shared/tuning';
import { BootScene } from './scenes/Boot.js';
import { t } from './i18n/index.js';
import './style.css';

for (const element of document.querySelectorAll('[data-i18n]')) {
  element.textContent = t(element.dataset.i18n);
}

const game = new Phaser.Game({
  type: Phaser.CANVAS,
  parent: 'game',
  width: tuning.display.width,
  height: tuning.display.height,
  backgroundColor: '#101c2b',
  pixelArt: true,
  antialias: false,
  banner: false,
  scene: [BootScene],
});

const container = document.querySelector('#game');
function resizeCanvas() {
  const fit = Math.min(
    container.clientWidth / tuning.display.width,
    container.clientHeight / tuning.display.height,
  );
  // Fractional downscaling is necessary if a viewport cannot fit even 1x.
  const scale = fit >= 1 ? Math.floor(fit) : fit;
  game.scale.setZoom(scale);
}
new ResizeObserver(resizeCanvas).observe(container);

const button = document.querySelector('#check-server');
const status = document.querySelector('#server-status');
button.addEventListener('click', async () => {
  button.disabled = true;
  status.textContent = t('serverChecking');
  try {
    const response = await fetch('/health', {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok || (await response.json()).status !== 'ok')
      throw new Error('Health check failed');
    status.textContent = t('serverReady');
  } catch {
    status.textContent = t('serverUnavailable');
  } finally {
    button.disabled = false;
  }
});

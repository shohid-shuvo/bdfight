import { expect, test } from '@playwright/test';

test('boots a letterboxed Phaser canvas and reaches the health server', async ({
  page,
}) => {
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/');
  const game = page.locator('#game[data-ready="true"]');
  const canvas = game.locator('canvas');
  await expect(canvas).toBeVisible();
  await expect(game).toHaveAttribute('data-ready', 'true');

  const [gameBox, canvasBox] = await Promise.all([
    game.boundingBox(),
    canvas.boundingBox(),
  ]);
  expect(gameBox).not.toBeNull();
  expect(canvasBox).not.toBeNull();
  expect(canvasBox.width).toBeLessThanOrEqual(gameBox.width);
  expect(canvasBox.height).toBeLessThanOrEqual(gameBox.height);

  await page.getByRole('button', { name: 'Check server' }).click();
  await expect(page.getByText('Server ready')).toBeVisible();
  expect(consoleErrors).toEqual([]);
});

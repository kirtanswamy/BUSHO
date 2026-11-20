import { test, expect } from '@playwright/test';

const pages = [
  { path: '/worker.html', role: 'worker' },
  { path: '/supervisor.html', role: 'supervisor' },
  { path: '/storekeeper.html', role: 'storekeeper' }
];
const viewports = [
  { name: 'desktop 1440px', width: 1440, height: 900 },
  { name: 'tablet 768px', width: 768, height: 1024 },
  { name: 'mobile 375px', width: 375, height: 812 }
];

for (const viewport of viewports) {
  test('landing and role entry remain within the viewport at ' + viewport.name, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const path of ['/', '/signin.html', '/worker.html', '/supervisor.html', '/storekeeper.html']) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('.civic-utility-bar')).toBeVisible();
      await expect(page.locator('[data-font="up"]')).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth
      }));
      expect(dimensions.scrollWidth, path + ' horizontal overflow').toBeLessThanOrEqual(dimensions.width + 1);
    }
  });
}

test('desktop role rails are sticky and mobile navigation opens as a drawer', async ({ page }) => {
  for (const portal of pages) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(portal.path, { waitUntil: 'domcontentloaded' });
    await page.locator('#portal-app').evaluate(el => el.classList.remove('hidden'));
    const rail = page.locator(portal.role === 'storekeeper' ? '.storekeeper-sidebar' : '.portal-sidebar');
    await expect(rail).toBeVisible();
    expect(await rail.evaluate(el => getComputedStyle(el).position)).toBe('sticky');

    const menu = page.locator(portal.role === 'storekeeper' ? '#storekeeper-menu-toggle' : '.sidebar-toggle-mobile');
    for (const width of [768, 375]) {
      await page.setViewportSize({ width, height: width === 768 ? 1024 : 812 });
      const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
      expect(dimensions.scrollWidth, portal.path + ' workspace horizontal overflow at ' + width).toBeLessThanOrEqual(dimensions.width + 1);
      await expect(menu).toBeVisible();
      await menu.click();
      if (portal.role === 'storekeeper') {
        await expect(page.locator('#storekeeper-layout')).toHaveClass(/sidebar-open/);
        await menu.click();
        await expect(page.locator('#storekeeper-layout')).not.toHaveClass(/sidebar-open/);
      } else {
        await expect(page.locator('#portal-app')).toHaveClass(/sidebar-open/);
        await menu.click();
        await expect(page.locator('#portal-app')).not.toHaveClass(/sidebar-open/);
      }
    }
  }
});

test('A+ and high-contrast preferences work and persist for the page', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-font="up"]').click();
  await expect(page.locator('html')).toHaveCSS('font-size', '18.4px');
  const contrast = page.locator('[data-contrast-toggle]');
  await contrast.click();
  await expect(page.locator('html')).toHaveAttribute('data-contrast', 'high');
  await expect(contrast).toHaveAttribute('aria-pressed', 'true');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-contrast', 'high');
  await expect(page.locator('html')).toHaveCSS('font-size', '18.4px');
});

test('synthetic case preview can complete its illustrative receipt step', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Confirm sample receipt' }).click();
  await expect(page.locator('.civic-case-preview .civic-status')).toHaveText('Illustrative sample · complete');
  await expect(page.locator('#case-preview-next')).toBeDisabled();
});

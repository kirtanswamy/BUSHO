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
      const civicCssLoaded = await page.evaluate(() => [...document.styleSheets].some(sheet => sheet.href && sheet.href.includes('civic-design-system.css')));
      expect(civicCssLoaded, path + ' civic design stylesheet must load').toBeTruthy();
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
        await page.keyboard.press('Escape');
        await expect(page.locator('#storekeeper-layout')).not.toHaveClass(/sidebar-open/);
      } else {
        await expect(page.locator('#portal-app')).toHaveClass(/sidebar-open/);
        await page.keyboard.press('Escape');
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

test('hero case preview switches between both frozen fulfilment branches', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const branchOne = page.getByRole('tab', { name: /Branch 1: PHC Stock Available/ });
  const branchTwo = page.getByRole('tab', { name: /Branch 2: PHC Unavailable/ });
  await expect(branchOne).toHaveAttribute('aria-selected', 'true');
  await branchTwo.click();
  await expect(branchTwo).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.civic-case-step')).toHaveCount(6);
  await expect(page.locator('.civic-case-step').nth(2).locator('strong')).toContainText('PHC unavailable');
  await branchOne.click();
  await expect(page.locator('.civic-case-step')).toHaveCount(4);
});

test('all five pages share the civic footer and language labels', async ({ page }) => {
  for (const path of ['/', '/signin.html', '/worker.html', '/supervisor.html', '/storekeeper.html']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.civic-utility-bar .civic-env-pill')).toContainText('SYNTHETIC PILOT');
    await expect(page.locator('.civic-site-footer h2')).toHaveText('BUSHO · Workflow Freeze v1.0');
    await expect(page.locator('.civic-site-footer > section')).toHaveCount(3);
    await expect(page.locator('.civic-site-footer')).toContainText('Last updated: 20 November 2026');
    const brand = page.locator('.brand-name, .lp-brand-copy strong').first();
    await expect(brand).toHaveText('BUSHO');
    const subtitle = page.locator('.brand-subtitle, .lp-brand-copy small').first();
    await expect(subtitle).toHaveText('Frontline SHC–PHC Medicine Stockout & Replenishment Layer');
    await expect(page.locator('.civic-site-footer a[aria-label="GitHub (opens in a new tab)"]')).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(page.locator('#lang-select option[value="en"]')).toHaveText('English');
  }
});

test('Storekeeper header retains its brand lockup and account action on every view', async ({ page }) => {
  await page.goto('/storekeeper.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.civic-storekeeper-header .brand-name')).toHaveText('BUSHO');
  await expect(page.locator('.civic-storekeeper-header .brand-subtitle')).toHaveText('Frontline SHC–PHC Medicine Stockout & Replenishment Layer');
  await expect(page.locator('.civic-storekeeper-account .profile-avatar')).toHaveText('SK');
  await expect(page.locator('.civic-storekeeper-account #portal-logout')).toHaveText('Sign out');
  await page.locator('#portal-app').evaluate(el => el.classList.remove('hidden'));
  for (const view of ['overview', 'stockouts', 'requests', 'inventory', 'account']) {
    await page.locator('[data-portal-view="' + view + '"]').click();
    await expect(page.locator('.civic-storekeeper-account #portal-logout')).toBeVisible();
  }
});

test('Supervisor preferences controls sync with the civic accessibility strip', async ({ page }) => {
  await page.goto('/supervisor.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#portal-app').evaluate(el => el.classList.remove('hidden'));
  await page.locator('[data-portal-view="settings"]').click();
  await page.locator('[data-scale="1.15"]').click();
  await expect(page.locator('html')).toHaveCSS('font-size', '18.4px');
  await page.locator('[data-pref-contrast]').check();
  await expect(page.locator('[data-contrast-toggle]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-density="compact"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-density', 'compact');
  await page.locator('[data-pref-language]').selectOption('hi');
  await expect(page.locator('#lang-select')).toHaveValue('hi');
});


test('workspace A4 print view hides navigation chrome and keeps the active record printable', async ({ page }) => {
  await page.goto('/worker.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#portal-app').evaluate(el => el.classList.remove('hidden'));
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.civic-utility-bar')).toBeHidden();
  await expect(page.locator('.portal-sidebar')).toBeHidden();
  await expect(page.locator('.civic-print-header')).toBeVisible();
  const printCss = await page.locator('html').evaluate(el => [...document.styleSheets].some(sheet => {
    try { return [...sheet.cssRules].some(rule => rule.cssText.includes('A4')); } catch { return false; }
  }));
  expect(printCss, 'A4 print stylesheet should be loaded').toBeTruthy();
});

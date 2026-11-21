import { test, expect } from '@playwright/test';

const pages = [
  { path: '/worker', role: 'worker' },
  { path: '/supervisor', role: 'supervisor' },
  { path: '/storekeeper', role: 'storekeeper' }
];
const viewports = [
  { name: 'desktop 1440px', width: 1440, height: 900 },
  { name: 'tablet 768px', width: 768, height: 1024 },
  { name: 'mobile 375px', width: 375, height: 812 }
];

for (const viewport of viewports) {
  test('landing and role entry remain within the viewport at ' + viewport.name, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const path of ['/', '/signin', '/worker', '/supervisor', '/storekeeper']) {
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
  for (const path of ['/', '/signin', '/worker', '/supervisor', '/storekeeper']) {
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

test('Storekeeper auth chrome is hidden until authentication and persists across views', async ({ page }) => {
  await page.goto('/storekeeper', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.civic-storekeeper-header .brand-name')).toHaveText('BUSHO');
  await expect(page.locator('.civic-storekeeper-header .brand-subtitle')).toHaveText('Frontline SHC–PHC Medicine Stockout & Replenishment Layer');
  await expect(page.locator('.civic-storekeeper-header .profile-menu-wrap')).toBeHidden();
  await expect(page.locator('.civic-storekeeper-header #portal-logout')).toBeHidden();
  await expect(page.locator('.civic-all-workspaces')).toBeVisible();
  await page.evaluate(() => document.dispatchEvent(new CustomEvent('busho:authenticated', {detail:{profile:{role:'storekeeper',display_name:'Demo Storekeeper'}}})));
  await expect(page.locator('.civic-storekeeper-header .profile-menu-wrap')).toBeVisible();
  await expect(page.locator('.civic-storekeeper-header .profile-avatar')).toHaveText('SK');
  await expect(page.locator('.civic-storekeeper-header #portal-logout')).toHaveText('Sign out');
  await page.locator('#portal-app').evaluate(el => el.classList.remove('hidden'));
  for (const view of ['overview', 'stockouts', 'requests', 'inventory', 'account']) {
    await page.locator('[data-portal-view="' + view + '"]').click();
    await expect(page.locator('.civic-storekeeper-header #profile-trigger')).toBeVisible();
  }
  await page.locator('.civic-storekeeper-header #profile-trigger').click();
  await expect(page.locator('.civic-storekeeper-header #portal-logout')).toBeVisible();
});

test('Supervisor preferences controls sync with the civic accessibility strip', async ({ page }) => {
  await page.goto('/supervisor', { waitUntil: 'domcontentloaded' });
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
  await page.goto('/worker', { waitUntil: 'domcontentloaded' });
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


test('clean routes serve pages and legacy HTML bookmarks redirect permanently', async ({ page }) => {
  for (const [clean,legacy] of [['/','/index.html'],['/signin','/signin.html'],['/worker','/worker.html'],['/supervisor','/supervisor.html'],['/storekeeper','/storekeeper.html']]) {
    const response = await page.goto(clean, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe(clean);
    const legacyResponse = await page.goto(legacy, { waitUntil: 'domcontentloaded' });
    expect(legacyResponse?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe(clean);
  }
});

test('signed-out workspace headers never expose account chrome', async ({ page }) => {
  for (const path of ['/worker','/supervisor','/storekeeper']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.profile-menu-wrap')).toBeHidden();
    await expect(page.locator('#portal-logout')).toBeHidden();
    await expect(page.locator('.civic-all-workspaces')).toBeVisible();
  }
});

test('workspace pages boot without browser console or uncaught page errors', async ({ page }) => {
  const errors=[];
  page.on('console',msg=>{if(msg.type()==='error'){const at=msg.location();errors.push(`${at.url}:${at.lineNumber}:${at.columnNumber} ${msg.text()}`)}});
  page.on('pageerror',err=>errors.push(err.stack||err.message));
  for(const path of ['/','/signin','/worker','/supervisor','/storekeeper']){
    await page.goto(path,{waitUntil:'domcontentloaded'});
    if(path==='/storekeeper')await expect(page.locator('#portal-login')).toBeVisible();
    else await expect(page.locator('main')).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('worker tab headings and facility strip follow the active view', async ({ page }) => {
  await page.goto('/worker',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>document.dispatchEvent(new CustomEvent('busho:authenticated',{detail:{profile:{role:'worker',display_name:'Synthetic Worker'}}})));
  await page.locator('#portal-app').evaluate(el=>el.classList.remove('hidden'));
  const expected=[['overview','Operational Overview'],['stockouts','Medicine Stockout'],['new-report','New Report'],['my-reports','My Reports'],['pending','Pending Confirmation'],['facility','My Facility'],['profile','My Profile']];
  for(const [view,title] of expected){
    await page.locator('[data-portal-view="'+view+'"]').click();
    await expect(page.locator('.civic-page-intro h1')).toHaveText(title);
    await expect(page.locator('.civic-breadcrumb')).toContainText(title);
    await expect(page.locator('.civic-facility-strip')).toHaveCount(1);
  }
  const svg=page.locator('.empty-state svg').first();
  if(await svg.count())await expect(svg).toHaveCSS('width','36px');
});

test('rendered page text contains no literal backslash-n artifacts', async ({ page }) => {
  for(const path of ['/','/signin','/worker','/supervisor','/storekeeper']){
    await page.goto(path,{waitUntil:'domcontentloaded'});
    const stray=await page.evaluate(()=>{const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode()))if(node.nodeValue.includes(String.fromCharCode(92)+'n'))return node.nodeValue;return null;});
    expect(stray,path+' should not render escaped newline text').toBeNull();
  }
});


test('Supervisor tabs keep the page title and assigned-facility context in sync', async ({ page }) => {
  await page.goto('/supervisor',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>document.dispatchEvent(new CustomEvent('busho:authenticated',{detail:{profile:{role:'supervisor',display_name:'Synthetic Reviewer'}}})));
  await page.locator('#portal-app').evaluate(el=>el.classList.remove('hidden'));
  const expected=[['overview','Operational Overview'],['stockout-review','SHC Stockouts'],['reports','Reports Inbox'],['facilities','Facilities'],['workers','Health Workers'],['supply-handoff','Supply handoff'],['activity','Activity Log'],['settings','Settings']];
  for(const [view,title] of expected){
    await page.locator('[data-portal-view="'+view+'"]').click();
    await expect(page.locator('.civic-page-intro h1')).toHaveText(title);
    await expect(page.locator('.civic-breadcrumb')).toContainText(title);
    await expect(page.locator('.civic-facility-strip')).toHaveCount(1);
  }
});

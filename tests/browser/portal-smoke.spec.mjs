
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

// ------------------------------------------------------------
// 1. Portal definitions
// ------------------------------------------------------------

const portals = [
  { path: '/worker', role: 'worker' },
  { path: '/supervisor', role: 'supervisor' },
  { path: '/storekeeper', role: 'storekeeper' },
  { path: '/admin', role: 'admin' }
];

const LOCAL_API_URL = 'http://127.0.0.1:54321';
const SESSION_KEY = 'busho-auth-session-v1';

// ------------------------------------------------------------
// 2. Load and validate local synthetic credentials
// ------------------------------------------------------------

const credentials = JSON.parse(
  await readFile(
    new URL('../../.local-e2e/credentials.json', import.meta.url),
    'utf8'
  )
);

if (
  credentials.fixture !== 'a204be7a' ||
  credentials.api_url !== LOCAL_API_URL ||
  typeof credentials.password !== 'string' ||
  !credentials.password ||
  !Array.isArray(credentials.accounts)
) {
  throw new Error('Invalid local E2E credentials file.');
}

const accounts = new Map(
  credentials.accounts.map(account => [account.label, account])
);

const requiredLabels = [
  'worker-a',
  'supervisor-a',
  'worker-b',
  'supervisor-b',
  'storekeeper-a',
  'storekeeper-b'
];

for (const label of requiredLabels) {
  if (!accounts.has(label)) {
    throw new Error(`Missing local E2E account: ${label}`);
  }
}

function account(label) {
  const value = accounts.get(label);

  if (!value?.email) {
    throw new Error(`Invalid account fixture: ${label}`);
  }

  return value;
}

// ------------------------------------------------------------
// 3. Prepare a LOCAL-TEST-ONLY version of the Supabase client
//
// Production HTTPS validation remains unchanged.
// Only the intercepted test response accepts localhost HTTP.
// ------------------------------------------------------------

const originalClientSource = await readFile(
  new URL('../../supabase-client.js', import.meta.url),
  'utf8'
);

const originalGuard = String.raw`if (!/^https:\/\//i.test(baseUrl)) throw new Error('A valid Supabase HTTPS URL is required.');`;

const localOnlyGuard = String.raw`if (!/^https:\/\//i.test(baseUrl) && !/^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/i.test(baseUrl)) throw new Error('A valid Supabase HTTPS URL is required.');`;

if (!originalClientSource.includes(originalGuard)) {
  throw new Error(
    'Expected HTTPS validation guard was not found. Review supabase-client.js before running local tests.'
  );
}

const testClientSource = originalClientSource.replace(
  originalGuard,
  localOnlyGuard
);

// ------------------------------------------------------------
// 4. Browser setup and local Supabase interception
// ------------------------------------------------------------

test.beforeEach(async ({ page }) => {
  const key = process.env.BUSHO_LOCAL_PUBLISHABLE_KEY;

  if (!key || !key.startsWith('sb_publishable_')) {
    throw new Error(
      'Missing local Supabase publishable key. Run scripts/run-local-browser-e2e.ps1.'
    );
  }

  // Inject local Supabase configuration.
  await page.route('**/supabase-config.js*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'text/javascript',
      body: `
        window.BUSHO_SUPABASE_CONFIG = Object.freeze({
          url: '${LOCAL_API_URL}',
          publishableKey: ${JSON.stringify(key)}
        });
      `
    });
  });

  // Inject the test-only client with localhost HTTP support.
  await page.route('**/supabase-client.js*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'text/javascript',
      body: testClientSource
    });
  });

  // Prevent accidental requests to hosted Supabase projects.
  await page.route('https://**.supabase.co/**', async route => {
    await route.abort('blockedbyclient');
  });
});

// ------------------------------------------------------------
// 5. External request tracking
// ------------------------------------------------------------

function trackExternalSupabaseRequests(page) {
  const requests = [];

  page.on('request', request => {
    try {
      const url = new URL(request.url());

      if (
        url.protocol === 'https:' &&
        url.hostname.endsWith('.supabase.co')
      ) {
        requests.push(`${request.method()} ${url.hostname}${url.pathname}`);
      }
    } catch {
      // Ignore requests with invalid URLs.
    }
  });

  return requests;
}

// ------------------------------------------------------------
// 6. Temporary authentication diagnostics
//
// Logs request paths and status codes only.
// Never logs passwords, access tokens or response bodies.
// ------------------------------------------------------------

function attachAuthDiagnostics(page) {
  page.on('pageerror', error => {
    console.log('[BROWSER PAGE ERROR]', error.message);
  });

  page.on('console', message => {
    if (message.type() === 'error') {
      console.log('[BROWSER CONSOLE ERROR]', message.text());
    }
  });

  page.on('requestfailed', request => {
    try {
      const url = new URL(request.url());

      if (
        url.pathname.includes('/auth/v1/') ||
        url.pathname.includes('/rest/v1/')
      ) {
        console.log(
          '[API REQUEST FAILED]',
          request.method(),
          url.pathname,
          request.failure()?.errorText
        );
      }
    } catch {
      // Ignore malformed URLs.
    }
  });

  page.on('response', response => {
    try {
      const url = new URL(response.url());

      if (
        url.pathname.includes('/auth/v1/token') ||
        url.pathname.includes('/rest/v1/profiles')
      ) {
        console.log(
          '[API RESPONSE]',
          response.request().method(),
          url.pathname,
          response.status()
        );
      }
    } catch {
      // Ignore malformed URLs.
    }
  });
}

// ------------------------------------------------------------
// 7. Shared login helper
// ------------------------------------------------------------

async function login(page, portalPath, label) {
  const user = account(label);

  attachAuthDiagnostics(page);

  await page.goto(portalPath);

  await expect(
    page.locator('#portal-login-form')
  ).toBeVisible();

  await page.locator('#portal-username').fill(user.email);

  await page.locator('#portal-password').fill(
    credentials.password
  );

  // IMPORTANT:
  // #portal-login is the login SECTION, not the submit button.
  await page
    .locator('#portal-login-form button[type="submit"]')
    .click();

 // Wait until authentication either enters the portal or displays an error.
await expect.poll(async () => {
  const appVisible = await page.locator('#portal-app').isVisible();
  const errorText = await page.locator('#portal-login-error').innerText();

  return appVisible || Boolean(errorText.trim());
}, { timeout: 15000 }).toBe(true);

  const errorText = await page
    .locator('#portal-login-error')
    .innerText()
    .catch(() => '');

  const appClass = await page
    .locator('#portal-app')
    .getAttribute('class')
    .catch(() => 'not-found');

  console.log('[LOGIN RESULT]', {
    portal: portalPath,
    account: label,
    error: errorText.trim() || '(no visible login error)',
    portalClass: appClass
  });
}

// ------------------------------------------------------------
// 8. Portal initialization tests
// ------------------------------------------------------------

for (const portal of portals) {
  test(
    `${portal.role}: BUSHO client initializes and exposes required methods`,
    async ({ page }) => {
      await page.addInitScript(() => { window.__bushoUnhandledRejections=[]; window.addEventListener('unhandledrejection', event => window.__bushoUnhandledRejections.push(String(event.reason))); });
      const externalRequests =
        trackExternalSupabaseRequests(page);

      await page.goto(portal.path);

      await expect(
        page.locator('#portal-login')
      ).toBeVisible();

      await expect(
        page.locator('#portal-app')
      ).toBeHidden();

      await expect(
        page.locator('#portal-login-form')
      ).toBeVisible();

      const result = await page.evaluate(() => {
        try {
          const client =
            window.BUSHO_SUPABASE_CLIENT?.createClient(
              window.BUSHO_SUPABASE_CONFIG
            );

          const requiredMethods = [
            'signInWithPassword',
            'getSession',
            'getMyProfile',
            'signOut'
          ];

          return {
            configuredUrl:
              window.BUSHO_SUPABASE_CONFIG?.url,
            clientCreated: Boolean(client),
            methods: Object.fromEntries(
              requiredMethods.map(name => [
                name,
                typeof client?.[name]
              ])
            ),
            error: null
          };
        } catch (error) {
          return {
            configuredUrl:
              window.BUSHO_SUPABASE_CONFIG?.url,
            clientCreated: false,
            methods: {},
            error: String(error?.message || error)
          };
        }
      });

      expect(result.configuredUrl).toBe(LOCAL_API_URL);
      expect(result.clientCreated).toBe(true);

      for (const method of [
        'signInWithPassword',
        'getSession',
        'getMyProfile',
        'signOut'
      ]) {
        expect(result.methods[method]).toBe('function');
      }

      expect(result.error).toBeNull();
      expect(externalRequests).toEqual([]);
    }
  );
}

// ------------------------------------------------------------
// 9. Sign-in selection page
// ------------------------------------------------------------

test('sign-in selection page loads', async ({ page }) => {
  await page.goto('/signin');

  await expect(page.locator('main')).toBeVisible();

  await expect(
    page.getByRole('heading', { name: 'Choose your workspace' })
  ).toBeVisible();
});

// ------------------------------------------------------------
// 10. Successful authentication tests
// ------------------------------------------------------------

const successfulLogins = [
  {
    path: '/worker',
    label: 'worker-a',
    role: 'worker'
  },
  {
    path: '/supervisor',
    label: 'supervisor-a',
    role: 'supervisor'
  },
  {
    path: '/storekeeper',
    label: 'storekeeper-b',
    role: 'storekeeper'
  }
];

for (const scenario of successfulLogins) {
  test(
    `${scenario.role}: active account can authenticate into its assigned portal`,
    async ({ page }) => {
      const externalRequests =
        trackExternalSupabaseRequests(page);
      const runtimeErrors = [];
      page.on('console', message => { if (message.type() === 'error') runtimeErrors.push(message.text()); });
      page.on('pageerror', error => runtimeErrors.push(error.message));

      await login(
        page,
        scenario.path,
        scenario.label
      );

await expect(
  page.locator('#portal-app')
).toBeVisible({
  timeout: 15000
});

await expect(
  page.locator('#portal-login')
).toBeHidden();

await expect(
  page.locator('#portal-login-error')
).toBeEmpty();
      await expect(page.locator('.profile-menu-wrap')).toBeVisible();
      await expect(page.locator('.civic-all-workspaces')).toBeHidden();
      await expect(page.locator('#profile-trigger')).toBeVisible();
      if (scenario.role === 'storekeeper') {
        await expect(page.locator('#profile-trigger .profile-avatar')).toHaveText('SK');
        await page.locator('#profile-trigger').click();
        await expect(page.locator('#profile-dropdown')).toBeVisible();
        await expect(page.locator('#portal-logout')).toBeVisible();
      }

      expect(externalRequests).toEqual([]);
      expect(runtimeErrors).toEqual([]);
      expect(await page.evaluate(() => window.__bushoUnhandledRejections)).toEqual([]);
    }
  );
}

// ------------------------------------------------------------
// 11. Wrong-role authorization tests
// ------------------------------------------------------------

const rejectedLogins = [
  {
    path: '/supervisor',
    label: 'worker-a',
    message: /authorised operations role/i
  },
  {
    path: '/storekeeper',
    label: 'worker-a',
    message: /authorised operations role/i
  },
  {
    path: '/worker',
    label: 'supervisor-a',
    message: /health worker role/i
  },
  {
    path: '/storekeeper',
    label: 'supervisor-a',
    message: /authorised operations role/i
  },
  {
    path: '/worker',
    label: 'storekeeper-b',
    message: /health worker role/i
  },
  {
    path: '/supervisor',
    label: 'storekeeper-b',
    message: /authorised operations role/i
  }
];

for (const scenario of rejectedLogins) {
  test(
    `${scenario.label}: wrong portal role is rejected at ${scenario.path}`,
    async ({ page }) => {
      const externalRequests =
        trackExternalSupabaseRequests(page);

      await login(
        page,
        scenario.path,
        scenario.label
      );

      await expect(
        page.locator('#portal-login-error')
      ).toContainText(scenario.message, {
        timeout: 15000
      });

      await expect(
        page.locator('#portal-login')
      ).toBeVisible();

      await expect(
        page.locator('#portal-app')
      ).toBeHidden();

      // A rejected login must not retain an authenticated session.
      await expect.poll(
        () =>
          page.evaluate(
            () => sessionStorage.getItem(
              'busho-auth-session-v1'
            )
          ),
        { timeout: 5000 }
      ).toBeNull();

      expect(externalRequests).toEqual([]);
    }
  );
}

// ------------------------------------------------------------
// 12. Suspended account authorization test
// ------------------------------------------------------------

test(
  'storekeeper: suspended account is denied access despite valid credentials',
  async ({ page }) => {
    const externalRequests =
      trackExternalSupabaseRequests(page);

    await login(
      page,
      '/storekeeper',
      'storekeeper-a'
    );

    await expect(
      page.locator('#portal-login-error')
    ).toContainText(
      /awaiting administrator approval/i,
      { timeout: 15000 }
    );

    await expect(
      page.locator('#portal-login')
    ).toBeVisible();

    await expect(
      page.locator('#portal-app')
    ).toBeHidden();

    await expect.poll(
      () =>
        page.evaluate(
          () => sessionStorage.getItem('busho-auth-session-v1')
        ),
      { timeout: 5000 }
    ).toBeNull();

    expect(externalRequests).toEqual([]);
  }
);

async function signOutThroughProfileMenu(page) {
  const trigger = page.getByRole('button', {
    name: 'Open profile menu'
  });

  await expect(trigger).toBeVisible({ timeout: 10000 });
  await trigger.click();

  const signOut = page.locator(
    '#profile-dropdown [data-profile-action="signout"]'
  );

  await expect(signOut).toBeVisible({ timeout: 5000 });
  await signOut.click();

  await expect(page.locator('#portal-login-form')).toBeVisible({
    timeout: 10000
  });

  await expect(page.locator('#portal-app')).toBeHidden();
}
// BUSHO_WORKER_SUPERVISOR_CORRECTION_E2E
test('worker and supervisor complete a correction and verification cycle', async ({ page }) => {
  test.setTimeout(90000);

  const externalRequests = trackExternalSupabaseRequests(page);

  // 1. Worker submits a new synthetic report through the actual UI.
  await login(page, '/worker', 'worker-a');
  await expect(page.locator('#portal-app')).toBeVisible();

  // The worker may land on the dashboard after authentication.
  // Open the report-entry view before interacting with its controls.
  await page.locator('[data-portal-view="new-report"]').click();

  await expect(
    page.locator('[data-sample="routine"]')
  ).toBeVisible({ timeout: 10000 });

  await page.locator('[data-sample="routine"]').click();
  await expect(page.locator('#report-input')).not.toHaveValue('');

  await page.locator('#extract-btn').click();

  const editableNames = page.locator(
    '.clinical-edit-input[data-key="name"]'
  );

  await expect(editableNames.first()).toBeVisible({
    timeout: 15000
  });

  await page.locator('#confirm-btn').click();

  const confirmationLocator = page.locator('#post-confirm');


  // Read the transient notification text without requiring it to remain visible.
  await expect.poll(
    async () => confirmationLocator.textContent(),
    { timeout: 20000 }
  ).toMatch(/submitted for supervisor review/i);

  const initialConfirmation = (await confirmationLocator.textContent()) ?? '';
  const reportIdMatch = initialConfirmation.match(
    /Reference\s+([0-9a-f]{8}-[0-9a-f-]{27,})/i
  );

  expect(
    reportIdMatch,
    'Worker confirmation should expose the saved report UUID.'
  ).not.toBeNull();

  const reportId = reportIdMatch[1];

  // Sign out before changing roles. Do not reuse the worker session.
  await signOutThroughProfileMenu(page);
  await expect(page.locator('#portal-login-form')).toBeVisible({
    timeout: 10000
  });

  // 2. Supervisor opens the submitted report.
  await login(page, '/supervisor', 'supervisor-a');
  await expect(page.locator('#portal-app')).toBeVisible();

  await page.locator('[data-portal-view="reports"]').click();

  const supervisorReport = page.locator(
    `.report-inbox-row[data-open-report="${reportId}"]`
  );

  await expect(supervisorReport).toBeVisible({
    timeout: 20000
  });

  await supervisorReport.click();

  const reviewForm = page.locator('[data-review-form]');
  await expect(reviewForm).toBeVisible();

  // 3. The UI must reject a correction request without a reason.
  await reviewForm.locator('[name="decision"]').selectOption(
    'correction_requested'
  );

  await reviewForm.locator('button[type="submit"]').click();

  await expect(reviewForm.locator('.review-feedback')).toContainText(
    /reason is required/i
  );

  // 4. Submit a valid correction request.
  const correctionNote =
    'Synthetic E2E: please verify the extracted observation name.';

  await reviewForm.locator('[name="note"]').fill(correctionNote);
  await reviewForm.locator('button[type="submit"]').click();

  await expect(
    page.locator('#supervisor-report-detail .status-pill')
  ).toContainText(/correction requested/i, {
    timeout: 20000
  });

  await expect(
    page.locator('#supervisor-report-detail')
  ).toContainText(correctionNote);

  // Sign out before returning to the worker account.
  await signOutThroughProfileMenu(page);
  await expect(page.locator('#portal-login-form')).toBeVisible({
    timeout: 10000
  });

  // 5. Worker opens the same report from report history.
  await login(page, '/worker', 'worker-a');
  await expect(page.locator('#portal-app')).toBeVisible();

  await page.locator('[data-portal-view="my-reports"]').click();

  const workerReport = page.locator(
    `[data-open-worker-report="${reportId}"]`
  );

  await expect(workerReport).toBeVisible({
    timeout: 20000
  });

  await workerReport.click();

  const workerDetail = page.locator('.report-detail');
  await expect(workerDetail).toContainText(/correction requested/i);
  await expect(workerDetail).toContainText(correctionNote);

  await workerDetail.locator(
    `[data-resume-worker-report="${reportId}"]`
  ).click();

  // 6. Correct a structured observation, preserving the original narrative.
  const correctedName =
    `BUSHO E2E corrected observation ${Date.now()}`;

  const workerNameField = page.locator(
    '.clinical-edit-input[data-key="name"]'
  ).first();

  await expect(workerNameField).toBeVisible();
  await workerNameField.fill(correctedName);

  // Blur the field so its change handler persists the structured edit.
  await page.locator('#report-input').click();

  await expect(workerNameField).toHaveValue(correctedName);

  await page.locator('#confirm-btn').click();

  const resubmissionConfirmation = page.locator('#post-confirm');

  // The notification is transient; inspect its text without requiring visibility.
  await expect.poll(
    async () => resubmissionConfirmation.textContent(),
    { timeout: 20000 }
  ).toMatch(/resubmitted for supervisor review/i);

  const resubmissionText =
    (await resubmissionConfirmation.textContent()) ?? '';

  // The same report reference must be retained after resubmission.
  expect(resubmissionText).toContain(reportId);

  await signOutThroughProfileMenu(page);
  await expect(page.locator('#portal-login-form')).toBeVisible({
    timeout: 10000
  });

  // 7. Supervisor verifies the resubmitted report.
  await login(page, '/supervisor', 'supervisor-a');
  await expect(page.locator('#portal-app')).toBeVisible();

  await page.locator('[data-portal-view="reports"]').click();

  const resubmittedReport = page.locator(
    `.report-inbox-row[data-open-report="${reportId}"]`
  );

  await expect(resubmittedReport).toBeVisible({
    timeout: 20000
  });

  await resubmittedReport.click();

  const finalReviewForm = page.locator('[data-review-form]');
  await expect(finalReviewForm).toBeVisible();

  await expect(
    page.locator('#supervisor-report-detail')
  ).toContainText(correctedName);

  await finalReviewForm.locator('[name="decision"]').selectOption(
    'supervisor_verified'
  );

  await finalReviewForm.locator('[name="note"]').fill(
    'Synthetic E2E: corrected observation reviewed and verified.'
  );

  await finalReviewForm.locator('button[type="submit"]').click();

  await expect(
    page.locator('#supervisor-report-detail .status-pill')
  ).toContainText(/^Verified$/i, {
    timeout: 20000
  });

  // No request in this journey may reach a hosted Supabase project.
  expect(externalRequests).toEqual([]);
});


// ------------------------------------------------------------
// 13. Authenticated worker identity, assignment and navigation regressions
// ------------------------------------------------------------

async function mockAuthenticatedWorkerPresentation(page, workerRows) {
  await page.route('**/rest/v1/profiles?*', async route => {
    const response = await route.fetch();
    const rows = await response.json();
    const updated = Array.isArray(rows)
      ? rows.map(profile => ({ ...profile, display_name: 'Regression Worker' }))
      : rows;
    await route.fulfill({
      response,
      contentType: 'application/json',
      body: JSON.stringify(updated)
    });
  });

  await page.route('**/rest/v1/workers?*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(workerRows)
    });
  });
}

test('worker identity and facility views use the authenticated profile and active worker assignment', async ({ page }) => {
  const externalRequests = trackExternalSupabaseRequests(page);

  await mockAuthenticatedWorkerPresentation(page, [{
    id: 'synthetic-worker-regression',
    auth_user_id: 'synthetic-auth-regression',
    facility_id: 'synthetic-facility-regression',
    display_name: 'Regression Worker',
    role: 'worker',
    is_active: true,
    facilities: {
      name: 'Regression Health and Wellness Centre',
      district: 'Synthetic Dhamtari',
      block_lgd_code: '3625'
    }
  }]);

  await login(page, '/worker', 'worker-a');
  await expect(page.locator('#portal-app')).toBeVisible();

  await expect(page.locator('#profile-trigger .profile-trigger-copy strong'))
    .toHaveText('Regression Worker');
  await expect(page.locator('#profile-trigger .profile-avatar'))
    .toHaveText('RW');

  await page.locator('[data-portal-view="profile"]').click();
  await expect(page.locator('[data-module="profile"] [data-worker-name]'))
    .toHaveText('Regression Worker');
  await expect(page.locator('[data-module="profile"] [data-worker-initials]'))
    .toHaveText('RW');
  await expect(page.locator('[data-module="profile"] [data-worker-facility]'))
    .toHaveText('Regression Health and Wellness Centre');
  await expect(page.locator('[data-module="profile"] [data-worker-district]'))
    .toHaveText('Synthetic Dhamtari');

  await page.locator('[data-portal-view="facility"]').click();
  await expect(page.locator('[data-module="facility"] [data-assigned-facility]'))
    .toHaveText('Regression Health and Wellness Centre');
  await expect(page.locator('[data-module="facility"] [data-assigned-location]'))
    .toHaveText('Synthetic Dhamtari');
  expect(externalRequests).toEqual([]);
});

test('worker with no active assignment sees an explicit unavailable state and no fabricated facility', async ({ page }) => {
  const externalRequests = trackExternalSupabaseRequests(page);
  await mockAuthenticatedWorkerPresentation(page, []);

  await login(page, '/worker', 'worker-a');
  await expect(page.locator('#portal-app')).toBeVisible();

  await page.locator('[data-portal-view="profile"]').click();
  await expect(page.locator('[data-module="profile"] [data-worker-facility]'))
    .toHaveText('No active facility assignment');
  await expect(page.locator('[data-module="profile"] [data-worker-district]'))
    .toHaveText('Not available');

  await page.locator('[data-portal-view="facility"]').click();
  await expect(page.locator('[data-module="facility"] [data-assigned-facility]'))
    .toHaveText('No active facility assignment');
  await expect(page.locator('[data-module="facility"] [data-assigned-location]'))
    .toHaveText('Not available');
  expect(externalRequests).toEqual([]);
});

test('worker navigation exposes stable accessible relationships and focuses the selected heading', async ({ page }) => {
  await login(page, '/worker', 'worker-a');
  await expect(page.locator('#portal-app')).toBeVisible();

  const nav = page.locator('[data-portal-view="profile"]');
  const panel = page.locator('[data-module="profile"]');
  await nav.click();

  const panelId = await panel.getAttribute('id');
  expect(panelId).toBeTruthy();
  await expect(nav).toHaveAttribute('aria-controls', panelId);
  await expect(nav).toHaveAttribute('aria-current', 'page');
  await expect(panel).toBeVisible();
  await expect(panel.locator('h2')).toBeFocused();

  const otherNav = page.locator('[data-portal-view="facility"]');
  await otherNav.click();
  await expect(otherNav).toHaveAttribute('aria-current', 'page');
  await expect(nav).not.toHaveAttribute('aria-current', 'page');
  await expect(page.locator('[data-module="facility"] h2')).toBeFocused();
});


test('supervisor login enters a responsive workspace and loads secondary modules on demand', async ({ page }) => {
  await page.addInitScript(() => {
    window.__bushoErrors = [];
    window.__bushoUnhandled = [];
    window.addEventListener('error', event => window.__bushoErrors.push(event.message || 'window error'));
    window.addEventListener('unhandledrejection', event => window.__bushoUnhandled.push(String(event.reason)));
  });

  await login(page, '/supervisor', 'supervisor-a');
  await expect(page.locator('#portal-app')).toBeVisible();
  await expect(page.locator('[data-module="overview"]')).toBeVisible();
  await expect(page.locator('[data-module="overview"] h2')).toContainText(/operational overview/i);

  // Login should not eagerly fan out into every secondary data source.
  await expect.poll(async () => page.locator('#phc-stockout-list').innerText()).not.toContain('Loading PHC stockout requests');

  for (const view of ['reports', 'stockout-review', 'supply-handoff', 'facilities', 'workers', 'activity', 'settings']) {
    const tab = page.locator('[data-portal-view="' + view + '"]');
    await tab.click();
    await expect(tab).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-module].active')).toHaveCount(1);
    await expect(page.locator('[data-module].active')).toBeVisible();
  }

  await expect.poll(async () => page.evaluate(() => ({
    errors: window.__bushoErrors,
    unhandled: window.__bushoUnhandled
  }))).toEqual({ errors: [], unhandled: [] });
});

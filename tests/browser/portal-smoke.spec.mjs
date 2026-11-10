
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

// ------------------------------------------------------------
// 1. Portal definitions
// ------------------------------------------------------------

const portals = [
  { path: '/worker.html', role: 'worker' },
  { path: '/supervisor.html', role: 'supervisor' },
  { path: '/storekeeper.html', role: 'storekeeper' },
  { path: '/admin.html', role: 'admin' }
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
  await page.goto('/signin.html');

  await expect(page.locator('main')).toBeVisible();

  await expect(
    page.getByText(/sign in to the workspace/i)
  ).toBeVisible();
});

// ------------------------------------------------------------
// 10. Successful authentication tests
// ------------------------------------------------------------

const successfulLogins = [
  {
    path: '/worker.html',
    label: 'worker-a',
    role: 'worker'
  },
  {
    path: '/supervisor.html',
    label: 'supervisor-a',
    role: 'supervisor'
  },
  {
    path: '/storekeeper.html',
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

      expect(externalRequests).toEqual([]);
    }
  );
}

// ------------------------------------------------------------
// 11. Wrong-role authorization tests
// ------------------------------------------------------------

const rejectedLogins = [
  {
    path: '/supervisor.html',
    label: 'worker-a',
    message: /authorised operations role/i
  },
  {
    path: '/storekeeper.html',
    label: 'worker-a',
    message: /authorised operations role/i
  },
  {
    path: '/worker.html',
    label: 'supervisor-a',
    message: /health worker role/i
  },
  {
    path: '/storekeeper.html',
    label: 'supervisor-a',
    message: /authorised operations role/i
  },
  {
    path: '/worker.html',
    label: 'storekeeper-b',
    message: /health worker role/i
  },
  {
    path: '/supervisor.html',
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
      '/storekeeper.html',
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

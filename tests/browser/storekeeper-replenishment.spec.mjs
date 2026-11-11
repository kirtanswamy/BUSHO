import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const LOCAL_API_URL = 'http://127.0.0.1:54321';

const credentials = JSON.parse(
  await readFile(
    new URL('../../.local-e2e/credentials.json', import.meta.url),
    'utf8'
  )
);

if (
  credentials.fixture !== 'a204be7a' ||
  credentials.api_url !== LOCAL_API_URL ||
  !credentials.password ||
  !Array.isArray(credentials.accounts)
) {
  throw new Error('Invalid local E2E credentials.');
}

const accounts = new Map(
  credentials.accounts.map(account => [account.label, account])
);

for (const label of ['worker-a', 'supervisor-a', 'storekeeper-e2e']) {
  if (!accounts.get(label)?.email) {
    throw new Error(`Missing local E2E account: ${label}`);
  }
}

const originalClientSource = await readFile(
  new URL('../../supabase-client.js', import.meta.url),
  'utf8'
);

const originalGuard = String.raw`if (!/^https:\/\//i.test(baseUrl)) throw new Error('A valid Supabase HTTPS URL is required.');`;

const localOnlyGuard = String.raw`if (!/^https:\/\//i.test(baseUrl) && !/^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/i.test(baseUrl)) throw new Error('A valid Supabase HTTPS URL is required.');`;

if (!originalClientSource.includes(originalGuard)) {
  throw new Error('Supabase HTTPS guard changed; review the local test setup.');
}

const testClientSource = originalClientSource.replace(
  originalGuard,
  localOnlyGuard
);

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
      // Ignore malformed URLs.
    }
  });

  return requests;
}

test.beforeEach(async ({ page }) => {
  const key = process.env.BUSHO_LOCAL_PUBLISHABLE_KEY;

  if (!key?.startsWith('sb_publishable_')) {
    throw new Error(
      'Missing local key. Run scripts/run-local-browser-e2e.ps1.'
    );
  }

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

  await page.route('**/supabase-client.js*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'text/javascript',
      body: testClientSource
    });
  });

  await page.route('https://**.supabase.co/**', async route => {
    await route.abort('blockedbyclient');
  });
});

async function login(page, portalPath, label) {
  const user = accounts.get(label);

  await page.goto(portalPath);

  await expect(page.locator('#portal-login-form')).toBeVisible();

  await page.locator('#portal-username').fill(user.email);
  await page.locator('#portal-password').fill(credentials.password);

  await page
    .locator('#portal-login-form button[type="submit"]')
    .click();

  await expect.poll(async () => {
    const appVisible = await page.locator('#portal-app').isVisible();
    const error = await page.locator('#portal-login-error').innerText();
    return appVisible || Boolean(error.trim());
  }, { timeout: 15000 }).toBe(true);

  await expect(page.locator('#portal-app')).toBeVisible({
    timeout: 15000
  });

  await expect(page.locator('#portal-login')).toBeHidden();
}

async function signOutThroughProfileMenu(page) {
  const trigger = page.getByRole('button', {
    name: 'Open profile menu'
  });

  await expect(trigger).toBeVisible({ timeout: 10000 });
  await trigger.click();

  const signOut = page.locator(
    '#profile-dropdown [data-profile-action="signout"]'
  );

  await expect(signOut).toBeVisible();
  await signOut.click();

  await expect(page.locator('#portal-login-form')).toBeVisible({
    timeout: 10000
  });

  await expect(page.locator('#portal-app')).toBeHidden();
}

async function waitForRequestCard(page, requestId) {
  const card = page.locator(`[data-request="${requestId}"]`);
  await expect(card).toBeVisible({ timeout: 15000 });
  return card;
}

test(
  'worker, supervisor and storekeeper complete replenishment with partial and final receipts',
  async ({ page }) => {
    test.setTimeout(120000);

    const externalRequests = trackExternalSupabaseRequests(page);
    const runId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

    // --------------------------------------------------------
    // 1. Worker submits a report through the actual portal UI.
    // --------------------------------------------------------

    await login(page, '/worker.html', 'worker-a');

    await page.locator('[data-portal-view="new-report"]').click();
    await page.locator('[data-sample="routine"]').click();
    await page.locator('#extract-btn').click();

    const correctedName = `BUSHO replenishment E2E ${runId}`;

    await page
      .locator('.clinical-edit-input[data-table="disease-table"][data-key="name"]').first()
      .fill(correctedName);

    await page.locator('#confirm-btn').click();

    const confirmation = page.locator('#post-confirm');

    await expect(confirmation).toContainText(
      /submitted for supervisor review/i,
      { timeout: 20000 }
    );

    const confirmationText = await confirmation.innerText();
    const reportMatch = confirmationText.match(
      /Reference\s+([0-9a-f]{8}-[0-9a-f-]{27,})/i
    );

    expect(
      reportMatch,
      `Could not extract report UUID from: ${confirmationText}`
    ).not.toBeNull();

    const reportId = reportMatch[1];

    await signOutThroughProfileMenu(page);

    // --------------------------------------------------------
    // 2. Supervisor verifies the report.
    // --------------------------------------------------------

    await login(page, '/supervisor.html', 'supervisor-a');

    await page.locator('[data-portal-view="reports"]').click();

    const reportRow = page.locator(
      `.report-inbox-row[data-open-report="${reportId}"]`
    );

    await expect(reportRow).toBeVisible({ timeout: 15000 });
    await reportRow.click();

    const reviewForm = page.locator('[data-review-form]');

    await expect(reviewForm).toBeVisible();

    await reviewForm.locator('[name="decision"]').selectOption(
      'supervisor_verified'
    );

    await reviewForm.locator('[name="note"]').fill(
      `Synthetic E2E verification ${runId}`
    );

    await reviewForm.locator('button[type="submit"]').click();

    await expect(
      page.locator('#supervisor-report-detail .status-pill')
    ).toContainText(/^Verified$/i, { timeout: 20000 });

    // --------------------------------------------------------
    // 3. Create the recommendation through the supervisor UI.
    // --------------------------------------------------------
    await page.locator('[data-portal-view="supply-handoff"]').click();
    const recommendationForm = page.locator('#supply-recommendation-form');
    await expect(recommendationForm).toBeVisible({ timeout: 20000 });
    const sourceReportSelect = recommendationForm.locator('[name="sourceReportId"]');
    // The handoff may retain a previously selected verified report when its
    // source lists refresh. Explicitly select the report created in this run.
    const targetReportOption = sourceReportSelect.locator(`option[value="${reportId}"]`);
    await expect(targetReportOption).toHaveCount(1, { timeout: 20000 });
    await sourceReportSelect.selectOption(reportId);
    await expect(sourceReportSelect).toHaveValue(reportId);
    const itemSelect = recommendationForm.locator('[name="inventoryItemId"]');
    await expect(itemSelect.locator('option').first()).toBeAttached();
    const selectedUnit = await recommendationForm.locator('[name="unit"]').inputValue();
    expect(selectedUnit).toBeTruthy();

    // Native validation must reject a zero requested quantity.
    await recommendationForm.locator('[name="requestedQuantity"]').fill('0');
    await recommendationForm.locator('[name="onHandQuantity"]').fill('0');
    await recommendationForm.locator('button[type="submit"]').click();
    await expect(recommendationForm.locator('[name="requestedQuantity"]')).toHaveJSProperty('validity.valid', false);

    await recommendationForm.locator('[name="requestedQuantity"]').fill('10');
    await recommendationForm.locator('[name="onHandQuantity"]').fill('0');
    await recommendationForm.locator('[name="note"]').fill(`Synthetic browser E2E replenishment ${runId}`);
    await recommendationForm.locator('button[type="submit"]').click();
    await expect(page.locator('#supply-handoff-message')).toContainText(/recommendation created/i, { timeout: 20000 });
    await page.getByRole('button', { name: 'Refresh' }).click();
    const createdCard = page.locator(`[data-recommendation-note="Synthetic browser E2E replenishment ${runId}"]`);
    await expect(createdCard).toBeVisible({ timeout: 20000 });
    const requestId = await createdCard.getAttribute('data-handoff-id');
    expect(requestId).toMatch(/^[0-9a-f-]{36}$/i);

    // --------------------------------------------------------
    // 4. Supervisor approves and submits to DPDMIS.
    // --------------------------------------------------------

    await page.locator('[data-portal-view="supply-handoff"]').click();

    // The request was created after the initial authenticated-page load.
    await page.getByRole('button', { name: 'Refresh' }).click();

    const handoffCard = page.locator(
      `[data-handoff-id="${requestId}"]`
    );

    await expect(handoffCard).toBeVisible({ timeout: 20000 });

    const approvalForm = handoffCard.locator(
      'form.handoff-action[data-action="approve"]'
    );

    await expect(approvalForm).toBeVisible();

    await approvalForm.locator('[name="note"]').fill(
      `Approved for synthetic E2E ${runId}`
    );

    await approvalForm.locator('button[type="submit"]').click();

    const submissionForm = handoffCard.locator(
      'form.handoff-action[data-action="submit"]'
    );

    await expect(submissionForm).toBeVisible({ timeout: 15000 });

    const dpdmisReference = `E2E-DPDMIS-${runId}`;

    await submissionForm.locator('[name="reference"]').fill(
      dpdmisReference
    );

    await submissionForm.locator('button[type="submit"]').click();

    // --------------------------------------------------------
    // 5. Storekeeper allocates and dispatches.
    // --------------------------------------------------------

    await signOutThroughProfileMenu(page);
    await login(page, '/storekeeper.html', 'storekeeper-e2e');

    let requestCard = await waitForRequestCard(page, requestId);

    const allocationForm = requestCard.locator(
      'form.storekeeper-action[data-action="allocate"]'
    );

    await expect(allocationForm).toBeVisible();

    const allocationReference = `E2E-ALLOC-${runId}`;

    await allocationForm.locator('[name="reference"]').fill(
      allocationReference
    );

    await allocationForm.locator('button[type="submit"]').click();

    requestCard = await waitForRequestCard(page, requestId);

    const dispatchForm = requestCard.locator(
      'form.storekeeper-action[data-action="dispatch"]'
    );

    await expect(dispatchForm).toBeVisible({ timeout: 15000 });

    const dispatchReference = `E2E-CHALLAN-${runId}`;

    await dispatchForm.locator('[name="reference"]').fill(
      dispatchReference
    );

    await dispatchForm.locator('button[type="submit"]').click();

    // --------------------------------------------------------
    // 6. Storekeeper records a partial receipt of 4, then a
    //    cumulative final receipt of 10.
    // --------------------------------------------------------

    requestCard = await waitForRequestCard(page, requestId);

    const partialForm = requestCard.locator(
      'form.storekeeper-action[data-action="receive"]'
    );

    await expect(partialForm).toBeVisible({ timeout: 15000 });


const partialReceiptReference = `E2E-RECEIPT-PART-${runId}`;

await partialForm.locator('[name="reference"]').fill(
  partialReceiptReference
);

await partialForm.locator('[name="quantity"]').fill('4');

await partialForm.locator('button[type="submit"]').click();

await expect(requestCard.locator('.status-pill'))
  .toHaveText('Partially received', { timeout: 15000 });

requestCard = await waitForRequestCard(page, requestId);

const finalForm = requestCard.locator(
  'form.storekeeper-action[data-action="receive"]'
);

await expect(finalForm).toBeVisible({ timeout: 15000 });

const finalReceiptReference = `E2E-RECEIPT-FINAL-${runId}`;

await finalForm.locator('[name="reference"]').fill(
  finalReceiptReference
);

await finalForm.locator('[name="quantity"]').fill('10');

await finalForm.locator('button[type="submit"]').click();

await expect(requestCard.locator('.status-pill'))
  .toHaveText('Fully received', { timeout: 15000 });



    // --------------------------------------------------------
    // 7. Verify request state and receipt movement ledger.
    // --------------------------------------------------------

    const ledger = await page.evaluate(async requestId => {
      const client = window.BUSHO_SUPABASE_CLIENT.createClient(
        window.BUSHO_SUPABASE_CONFIG
      );

      const requests = await client.listMyReplenishments();

      const request = requests.find(item => item.id === requestId);

      if (!request) {
        throw new Error('Storekeeper cannot read the completed request.');
      }

      return {
        status: request.status,
        requestedQuantity: Number(request.requested_quantity),
        receivedQuantity: Number(request.received_quantity),
        movements: (request.inventory_movements || []).map(movement => ({
          quantityDelta: Number(movement.quantity_delta),
          externalReference: movement.external_reference
        }))
      };
    }, requestId);

    expect(ledger.status).toBe('received');
    expect(ledger.requestedQuantity).toBe(10);
    expect(ledger.receivedQuantity).toBe(10);

    expect(
      ledger.movements.map(movement => movement.quantityDelta).sort(
        (a, b) => a - b
      )
    ).toEqual([4, 6]);

    expect(
      new Set(ledger.movements.map(movement => movement.externalReference)).size
    ).toBe(2);

    expect(
      ledger.movements.map(movement => movement.externalReference)
    ).toContain(partialReceiptReference);

    expect(
      ledger.movements.map(movement => movement.externalReference)
    ).toContain(finalReceiptReference);

    // --------------------------------------------------------
    // 8. Replay the exact final receipt. This must not create
    //    another movement or increase the cumulative quantity.
    // --------------------------------------------------------

    const replay = await page.evaluate(
      async ({ requestId, finalReceiptReference }) => {
        const client = window.BUSHO_SUPABASE_CLIENT.createClient(
          window.BUSHO_SUPABASE_CONFIG
        );

        await client.transitionReplenishmentRequest({
          id: requestId,
          status: 'received',
          receivedQuantity: 10,
          receiptReference: finalReceiptReference
        });

        const requests = await client.listMyReplenishments();
        const request = requests.find(item => item.id === requestId);

        if (!request) {
          throw new Error('Request disappeared after exact receipt replay.');
        }

        return {
          status: request.status,
          receivedQuantity: Number(request.received_quantity),
          movementCount: (request.inventory_movements || []).length
        };
      },
      { requestId, finalReceiptReference }
    );

    expect(replay.status).toBe('received');
    expect(replay.receivedQuantity).toBe(10);
    expect(replay.movementCount).toBe(2);

    // No request in this test may reach a hosted Supabase project.
    expect(externalRequests).toEqual([]);
  }
);

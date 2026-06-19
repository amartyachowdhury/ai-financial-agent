import { expect, test } from '@playwright/test';

test('submits a chat message through the mocked chat API', async ({ page }) => {
  let chatRequested = false;

  await page.route('**/api/chat', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    chatRequested = true;

    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1',
      },
      body: 'd:{"finishReason":"stop","usage":{"promptTokens":1,"completionTokens":0}}',
    });
  });

  await page.goto('/');

  const input = page.getByPlaceholder(
    'Send a message...type @ to include tickers',
  );
  await input.fill('Analyze AAPL stock');
  await input.press('Enter');

  await expect.poll(() => chatRequested).toBe(true);
  await expect(input).toHaveValue('');
});

test('shows loading state while chat request is in flight', async ({ page }) => {
  await page.route('**/api/chat', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 2_000));
    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1',
      },
      body: 'd:{"finishReason":"stop","usage":{"promptTokens":1,"completionTokens":1}}',
    });
  });

  await page.goto('/');

  const input = page.getByPlaceholder(
    'Send a message...type @ to include tickers',
  );
  await input.fill('Quick question');
  await input.press('Enter');

  await expect(page.getByText('Researching')).toBeVisible();
});

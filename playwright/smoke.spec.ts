import { expect, test } from '@playwright/test';

test('home page loads the chat shell', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByPlaceholder('Send a message...type @ to include tickers'),
  ).toBeVisible();
  await expect(page.getByText('financial datasets')).toBeVisible();
  await expect(page.getByText('Educational use only')).toBeVisible();
});

import { test, expect, devices } from '@playwright/test';
import { fileReader } from './test-helper';

const testStoryJsonTxt = `${import.meta.dirname}/../../tests/events/very_long_text.txt`;
const orderSelectionValues = ["asc", "desc"];
const sortSelectionValues = ["word_prefix", "n_words_ngram", "count"];

// iPhone 13 landscape viewport
const iphone13Landscape = devices['iPhone 13 landscape'];

test.use({ ...iphone13Landscape });

test('test My Ghost Writer, iPhone 13 landscape: order/sort', async ({ page }) => {
  await page.goto('http://localhost:8000/');
  await page.getByRole('button', { name: 'Set UI' }).click();
  await page.getByRole('checkbox', { name: 'Allow Editing' }).click();
  const text = await fileReader(testStoryJsonTxt);
  let gameEditor = page.locator('#gametext');
  await gameEditor.click();
  await gameEditor.fill(text);
  await expect(gameEditor).toContainText(text.slice(0, 50), { timeout: 15000 });
  await page.waitForTimeout(100);

  // Activate text stats feature
  await page.getByRole('button', { name: 'Main Menu Options' }).click();
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('link', { name: 'Tokens' }).click();
  await page.getByRole('button', { name: 'id-expand-wordsfreqstats' }).click();
  await page.getByRole('checkbox', { name: 'id-col2-words-frequency-enable' }).check();
  await expect(page.getByRole('checkbox', { name: 'id-col2-words-frequency-enable' })).toBeChecked();
  await page.getByRole('button', { name: 'OK' }).click();
  await page.waitForTimeout(100);

  // Open mobile menu for text stats
  await page.getByRole('button', { name: 'id-navtoggler-words-freq' }).click();

  // Interact with filter/sort/order
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).click();
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).fill('th');
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).press('Enter');
  await page.waitForTimeout(100);
  await expect(page.getByLabel('id-filtered-value')).toContainText('th:');

  for (let currentOrderSelectionValue of orderSelectionValues) {
    for (let currentSortSelectionValue of sortSelectionValues) {
      await page.getByRole('button', { name: 'id-navtoggler-words-freq' }).click();
      await page.getByLabel('id-select-order-by').selectOption(currentOrderSelectionValue);
      await page.getByLabel('id-select-sort-by').selectOption(currentSortSelectionValue);
      await page.getByRole('searchbox', { name: 'filter-words-frequency' }).fill('th');
      await page.getByRole('searchbox', { name: 'filter-words-frequency' }).press('Enter');
      await page.waitForTimeout(300);
      await expect(page.getByLabel('id-list-of-words-container')).toMatchAriaSnapshot({ name: `test-classic-landscape-iphone13-1--${currentOrderSelectionValue}-${currentSortSelectionValue}.txt` });
    }
  }
  page.close();
});

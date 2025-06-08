import { test, expect, devices } from '@playwright/test';
import { fileReader } from './test-helper';

const testStoryTxt = `${import.meta.dirname}/../../tests/events/very_long_text.txt`;

test('test My Ghost Writer, iPhone 13 landscape: stemming/duplicates', async ({ page }) => {
  await page.goto('http://localhost:8000/');
  await page.getByRole('button', { name: 'Set UI' }).click();
  await page.getByRole('checkbox', { name: 'Allow Editing' }).check();
  const text = await fileReader(testStoryTxt);
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
  await page.getByRole('button', { name: 'OK' }).click();
  await page.waitForTimeout(100);

  // Open mobile menu for text stats
  await page.getByRole('button', { name: 'id-navtoggler-words-freq' }).click();

  // Interact with filter for stemming/duplicates scenario
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).click();
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).fill('the');
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).press('Enter');
  await page.waitForTimeout(100);
  await expect(page.getByLabel('id-filtered-value')).toContainText('the:');
  // Add more assertions as needed for stemming/duplicates scenario
  page.close();
});

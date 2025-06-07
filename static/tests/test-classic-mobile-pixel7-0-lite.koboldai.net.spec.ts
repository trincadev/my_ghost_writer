// @ts-check
import { test, expect } from '@playwright/test';
import { assertCellAndLink } from './test-helper'

const testStoryJsonTxt = `${import.meta.dirname}/../../tests/events/very_long_text.json`

test('test-classic-mobile-pixel7-0-lite: My Ghost Writer, Pixel 7: menu opens/closes on filter and click', async ({ page }) => {
  // Go to the app
  await page.goto('http://localhost:8000/');
  await page.getByRole('button', { name: 'Set UI' }).click();

  // Upload the story file
  await page.getByRole('link', { name: 'Save / Load' }).click();
  await page.waitForTimeout(100);
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: '📁 Open File' }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(testStoryJsonTxt);
  await page.waitForTimeout(300);

  // Open settings and enable word frequency
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('link', { name: 'Tokens' }).click();
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: 'id-expand-wordsfreqstats' }).click();
  await page.getByRole('checkbox', { name: 'id-col2-words-frequency-enable' }).check();
  await expect(page.getByRole('checkbox', { name: 'id-col2-words-frequency-enable' })).toBeChecked();
  await page.getByRole('button', { name: 'OK' }).click();
  await page.waitForTimeout(100);

  // --- Open menu before filtering ---
  await page.locator('#id-navtoggler-words-freq').click();
  await expect(page.locator('#words-freq-menu')).toBeVisible();

  // Filter/search for 'th'
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).fill('th');
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).press('Enter');
  await page.waitForTimeout(100);
  // Menu should close
  await expect(page.locator('#words-freq-menu')).not.toBeVisible();

  // --- Open menu before clicking a word in the list ---
  await page.locator('#id-navtoggler-words-freq').click();
  await expect(page.locator('#words-freq-menu')).toBeVisible();

  // Click the first word in the list
  let listOfWordsList = page.getByLabel('id-list-of-words-scrollable').locator('list');
  let listOfWordsListElNth0 = listOfWordsList.getByLabel('id-list-of-words-0-nth');
  await listOfWordsListElNth0.click();
  await page.waitForTimeout(100);
  // Menu should close
  await expect(page.locator('#words-freq-menu')).not.toBeVisible();

  // --- Open menu before clicking a row in the table ---
  await page.locator('#id-navtoggler-words-freq').click();
  await expect(page.locator('#words-freq-menu')).toBeVisible();

  // Click the first row in the table
  let tableRow = page.getByLabel('id-current-table-of-words-scrollable').locator('table').locator('tr').first();
  let tableCellLink = tableRow.locator('a');
  await tableCellLink.click();
  await page.waitForTimeout(100);
  // Menu should close
  await expect(page.locator('#words-freq-menu')).not.toBeVisible();

  // Final screenshot for visual regression
  let col2wordsFreq = page.getByLabel('id-col2-words-frequency', { exact: true });
  await expect(col2wordsFreq).toHaveScreenshot();
  page.close();
});

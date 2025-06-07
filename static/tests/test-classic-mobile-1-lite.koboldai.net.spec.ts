// @ts-check
import { test, expect } from '@playwright/test';

const testStoryJsonTxt = `${import.meta.dirname}/../../tests/events/very_long_text.json`
const orderSelectionValues = ["asc", "desc"]
const sortSelectionValues = ["word_prefix", "n_words_ngram", "count"]

test('test-classic-mobile-1-lite: My Ghost Writer, iPhone 13: menu opens/closes on filter and sort/order', async ({ page }) => {
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

  // Assert filtered value
  await expect(page.getByLabel('id-filtered-value')).toContainText('th: 1701');

  // Get the list of filtered word frequency results and assert the count
  let listOfWordsList = page.getByLabel('id-list-of-words-container').locator('list');
  let listOfWordsListChildren = listOfWordsList.getByRole('listitem');
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).press('Enter');
  await page.waitForTimeout(100);
  await expect(listOfWordsListChildren).toHaveCount(1701);

  // Loop through all combinations of order and sort, update the UI, and assert menu closes after each
  for (let currentOrderSelectionValueIdx in orderSelectionValues) {
    let currentOrderSelectionValue = orderSelectionValues[currentOrderSelectionValueIdx];
    for (let currentSortSelectionValueIdx in sortSelectionValues) {
      let currentSortSelectionValue = sortSelectionValues[currentSortSelectionValueIdx];
      // Open menu before changing order/sort
      await page.locator('#id-navtoggler-words-freq').click();
      await expect(page.locator('#words-freq-menu')).toBeVisible();
      // Select the order and sort options in the UI
      await page.getByLabel('id-select-order-by').selectOption(currentOrderSelectionValue);
      await page.getByLabel('id-select-sort-by').selectOption(currentSortSelectionValue);
      // Re-apply the filter and wait for the UI to update
      await page.getByRole('searchbox', { name: 'filter-words-frequency' }).fill('th');
      await page.getByRole('searchbox', { name: 'filter-words-frequency' }).press('Enter');
      await page.waitForTimeout(300);
      // Menu should close
      await expect(page.locator('#words-freq-menu')).not.toBeVisible();
      // Assert that the list of words container matches the expected ARIA snapshot for this combination
      await expect(page.getByLabel('id-list-of-words-container')).toMatchAriaSnapshot({ name: `test-classic-mobile-1--${currentOrderSelectionValue}-${currentSortSelectionValue}.txt` });
    }
  }
  // End of test
  console.log("end!");
  page.close();
});

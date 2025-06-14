import { test, expect } from '@playwright/test';
import { uploadFileWithPageAndFilepath } from './test-helper';

const testStoryJsonTxt = `${import.meta.dirname}/../../tests/events/very_long_text.json`
const orderSelectionValues = ["asc", "desc"]
const sortSelectionValues = ["word_prefix", "n_words_ngram", "count"]

test('test My Ghost Writer, ipad mini landscape: order/sort', async ({ page }) => {
  // 1. Connect to the local web server page
  await page.goto('http://localhost:8000/');

  // 2. Activate the required UI mode (e.g., switch to classic or advanced UI)
  await page.getByRole('button', { name: 'Set UI' }).click();

  // 3. Upload a saved JSON story file to provide long text content for analysis
  await uploadFileWithPageAndFilepath(page, testStoryJsonTxt)

  // 4. Activate "My Ghost Writer" / text stats functionality via settings
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('link', { name: 'Tokens' }).click();
  await page.waitForTimeout(100)
  await page.getByRole('button', { name: 'id-expand-wordsfreqstats' }).click();
  await page.getByRole('checkbox', { name: 'id-col2-words-frequency-enable' }).check();
  // Assert that the checkbox is checked (feature is enabled)
  await expect(page.getByRole('checkbox', { name: 'id-col2-words-frequency-enable' })).toBeChecked();

  await page.getByRole('button', { name: 'OK' }).click();
  await page.waitForTimeout(100)
  
  // 5. Interact with the text stats UI: filter, sort, and verify word frequency tables
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).fill('th');
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).press('Enter');
  await page.waitForTimeout(100)
  // Assert that the filtered value label contains the expected text and count
  await expect(page.getByLabel('id-filtered-value')).toContainText('th: 1701');
  
  // Get the list of filtered word frequency results and assert the count
  let listOfWordsList = page.getByLabel('id-list-of-words-container').locator('list')
  let listOfWordsListChildren = listOfWordsList.getByRole('listitem')
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).press('Enter');
  await page.waitForTimeout(100)
  expect(listOfWordsListChildren).toHaveCount(1701)

  // 6. Loop through all combinations of order and sort, update the UI, and assert ARIA snapshots for accessibility and regression
  for (let currentOrderSelectionValueIdx in orderSelectionValues) {
    let currentOrderSelectionValue = orderSelectionValues[currentOrderSelectionValueIdx]
    for (let currentSortSelectionValueIdx in sortSelectionValues) {
      let currentSortSelectionValue = sortSelectionValues[currentSortSelectionValueIdx]
      // Log the current combination for debugging
      console.log(`currentOrderSelectionValue:${currentOrderSelectionValue}, currentSelectionValue:${currentSortSelectionValue}.`)
      // Select the order and sort options in the UI
      await page.getByLabel('id-select-order-by').selectOption(currentOrderSelectionValue);
      await page.getByLabel('id-select-sort-by').selectOption(currentSortSelectionValue);
      // Re-apply the filter and wait for the UI to update
      await page.getByRole('searchbox', { name: 'filter-words-frequency' }).fill('th');
      await page.getByRole('searchbox', { name: 'filter-words-frequency' }).press('Enter');
      await page.waitForTimeout(300)
      // Assert that the list of words container matches the expected ARIA snapshot for this combination
      await expect(page.getByLabel('id-list-of-words-container')).toMatchAriaSnapshot({ name: `test-classic-landscape-ipad-mini-1--${currentOrderSelectionValue}-${currentSortSelectionValue}--id-list-of-words-container.txt` });
    }
  }
  // End of test
  console.log("end!")
  page.close()
});

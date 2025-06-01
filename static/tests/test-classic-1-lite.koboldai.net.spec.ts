import { test, expect } from '@playwright/test';

const testStoryJsonTxt = `${import.meta.dirname}/../../tests/events/very_long_text.json`
const orderSelectionValues = ["asc", "desc"]
const sortSelectionValues = ["word_prefix", "n_words_ngram", "count"]

test('test My Ghost Writer: order/sort', async ({ page }) => {
  await page.goto('http://localhost:8000/');
  await page.getByRole('button', { name: 'Set UI' }).click();

  console.log(`preparing uploading of file '${testStoryJsonTxt}'!`)
  await page.getByRole('link', { name: 'Save / Load' }).click();
  await page.waitForTimeout(100)
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: '📁 Open File' }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(testStoryJsonTxt);
  await page.waitForTimeout(300)
  console.log(`file '${testStoryJsonTxt}' uploaded!`)

  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('link', { name: 'Tokens' }).click();
  await page.waitForTimeout(100)
  await page.getByRole('button', { name: 'id-expand-wordsfreqstats' }).click();
  await page.getByRole('checkbox', { name: 'id-col2-words-frequency-enable' }).check();
  // assert checkbox checked
  await expect(page.getByRole('checkbox', { name: 'id-col2-words-frequency-enable' })).toBeChecked();

  await page.getByRole('button', { name: 'OK' }).click();
  await page.waitForTimeout(100)
  console.log("#")
  
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).fill('th');
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).press('Enter');
  await page.waitForTimeout(100)
  await expect(page.getByLabel('id-filtered-value')).toContainText('\'th\', 1701');
  
  let listOfWordsList = page.getByLabel('id-list-of-words-container').locator('list')
  let listOfWordsListChildren = listOfWordsList.getByRole('listitem')
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).press('Enter');
  await page.waitForTimeout(100)
  expect(listOfWordsListChildren).toHaveCount(1701)

  
  for (let currentOrderSelectionValueIdx in orderSelectionValues) {
    let currentOrderSelectionValue = orderSelectionValues[currentOrderSelectionValueIdx]
    for (let currentSortSelectionValueIdx in sortSelectionValues) {
      let currentSortSelectionValue = sortSelectionValues[currentSortSelectionValueIdx]
      console.log(`currentOrderSelectionValue:${currentOrderSelectionValue}, currentSelectionValue:${currentSortSelectionValue}.`)
    
      await page.getByLabel('id-select-order-by').selectOption(currentOrderSelectionValue);
      await page.getByLabel('id-select-sort-by').selectOption(currentSortSelectionValue);
      await page.getByRole('searchbox', { name: 'filter-words-frequency' }).fill('th');
      await page.getByRole('searchbox', { name: 'filter-words-frequency' }).press('Enter');
      await page.waitForTimeout(300)
      await expect(page.getByLabel('id-list-of-words-container')).toMatchAriaSnapshot({ name: `test-classic-1--${currentOrderSelectionValue}-${currentSortSelectionValue}.txt` });
    }
  }
  console.log("end!")
});
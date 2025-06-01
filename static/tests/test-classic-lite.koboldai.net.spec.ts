import { test, expect } from '@playwright/test';

const setupClassicContextFile = `${import.meta.dirname}/setup-classic-lite.koboldai.net.json`
const testStoryJsonTxt = `${import.meta.dirname}/../../tests/events/very_long_text.json`

test('test', async ({ page }) => {
  await page.goto('http://localhost:8000/');
  await page.getByRole('button', { name: 'Set UI' }).click();

  console.log(`preparing uploading of file '${testStoryJsonTxt}'!`)
  await page.getByRole('link', { name: 'Save / Load' }).click();
  await page.waitForTimeout(100)
  const fileChooserPromise = page.waitForEvent('filechooser');
  // filepickerawait page.getByRole('button', { name: '📁 Open File' }).click();
  await page.getByRole('button', { name: '📁 Open File' }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(testStoryJsonTxt);
  await page.waitForTimeout(300)
  // await expect(page.locator('#gametext')).toHaveScreenshot()
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
  
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).click();
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).fill('th');
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).press('Enter');
  await page.waitForTimeout(100)

  await expect(page.getByLabel('id-filtered-value')).toContainText('\'th\', 1701');

  await expect(page.getByLabel('id-current-table-of-words-title')).not.toContainText('the: 734');
  console.log("#")
  
  let listOfWordsList = page.getByLabel('id-list-of-words-container').locator('list')
  await expect(listOfWordsList.getByLabel(`id-list-of-words-${0}-nth`)).toMatchAriaSnapshot("- text: \"the: 734 repetitions\"");
  console.log("nth0:#")
  
  await page.getByText('the: 734').click();
  await page.waitForTimeout(100)

  await expect(page.getByLabel('id-current-table-of-words-title')).toContainText('the: 734');
  await expect(page.getByLabel('id-table-0-row-0-nth').getByRole('cell')).toMatchAriaSnapshot(`- cell "THE BOY WHO"`);
  await page.getByText('THE BOY WHO', { exact: true }).click();
  await page.waitForTimeout(100)
  await expect(page.locator('#gametext')).toHaveScreenshot()


  await expect(page.getByLabel('id-table-0-row-733-nth').getByRole('cell')).toMatchAriaSnapshot(`- cell "early the next"`);
  await page.getByText('early the next', { exact: true }).click();
  await page.waitForTimeout(100)
  await expect(page.locator('#gametext')).toHaveScreenshot()
  /*
  
  await page.getByLabel('order: ascend order: descend').selectOption('asc');
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).click();
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).press('Enter');
  await page.waitForTimeout(100)

  expect(listOfWordsList).toHaveCount(1701)
  await expect(listOfWordsList.nth(0)).toContainText('anything strange: 1');
  await expect(listOfWordsList.nth(1)).toContainText('because they: 1');
  await expect(listOfWordsList.nth(1701)).toContainText('the: 734');

  await page.getByText('the Dursleys:').click();
  await page.waitForTimeout(100)

  await expect(page.getByLabel('id-current-table-of-words-title')).toContainText('the Dursleys: 32');
  await expect(page.locator('#gametext')).toHaveScreenshot()

  let col2wordsFreq = page.getByLabel('id-col2-words-frequency', { exact: true })
  await expect(col2wordsFreq).toHaveScreenshot()
  await page.getByText('The Dursley s had a', { exact: true }).click();
  await page.waitForTimeout(100)
  await expect(page.locator('#gametext')).toHaveScreenshot()

  await page.getByText('that the Dursleys were', { exact: true }).click();
  await page.waitForTimeout(100)
  await expect(page.locator('#gametext')).toHaveScreenshot()

  listOfWordsList = page.getByLabel('id-list-of-words-container').locator('list')
  expect(listOfWordsList).toHaveCount(1701)
  
  await page.getByLabel('id-select-sort-by').selectOption('word_prefix');
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).click();
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).press('Enter');
  await expect(listOfWordsList.nth(0)).toMatchAriaSnapshot(`- listitem: "— with: 1 reps."`);
  await expect(listOfWordsList.nth(1701)).toMatchAriaSnapshot(`- listitem: "! The: 1 reps."`);

  await page.getByLabel('id-select-sort-by').selectOption('n_words_ngram');
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).click();
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).press('Enter');

  await expect(listOfWordsList.nth(0)).toMatchAriaSnapshot(`- listitem: "the boy: 7 reps."`);
  await expect(listOfWordsList.nth(1701)).toMatchAriaSnapshot(`- listitem: "third: 1 reps."`);
  
  fileWriter(filepath, data)
  fileReader(filepath)
  */
  console.log("end!")
});
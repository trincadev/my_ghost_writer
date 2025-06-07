import { test, expect } from '@playwright/test';
import { assertCellAndLink } from './test-helper'

const testStoryJsonTxt = `${import.meta.dirname}/../../tests/events/very_long_text.json`

test('test My Ghost Writer, ipad mini landscape: navigate between the value list/tables', async ({ page }) => {
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
  
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).fill('th');
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).press('Enter');
  await page.waitForTimeout(100)

  await expect(page.getByLabel('id-filtered-value')).toContainText('th: 1701');
  let currentTitleTableOfWords = page.getByLabel('id-current-table-of-words-title')
  await expect(currentTitleTableOfWords).not.toContainText('the: 734');
  
  let listOfWordsList = page.getByLabel('id-list-of-words-container').locator('list')
  let listOfWordsListElNth0 = listOfWordsList.getByLabel(`id-list-of-words-${0}-nth`)
  await expect(listOfWordsListElNth0).toMatchAriaSnapshot("- text: \"the: 734 reps.\"");
  await expect(listOfWordsListElNth0).toHaveAttribute("title", "stem: 'the'")
  
  let gameEditor = page.locator('#gametext')
  await page.getByText('the: 734').click();
  await page.waitForTimeout(100)
  
  await expect(currentTitleTableOfWords).toContainText('the : 734 ');
  await expect(currentTitleTableOfWords).toHaveAttribute("title", "stem: 'the'")

  await assertCellAndLink(page, gameEditor, 'id-table-0-row-0-nth', "THE BOY WHO");
  await assertCellAndLink(page, gameEditor, 'id-table-0-row-733-nth', "early the next");
  await assertCellAndLink(page, gameEditor, 'id-table-0-row-1-nth', " were the last");

  await page.getByText('the Dursleys:').click();
  await page.waitForTimeout(100)
  await expect(page.getByLabel('id-current-table-of-words-title')).toContainText('the Dursleys : 32 ');
  
  await page.getByLabel('id-list-of-words-11-nth').click();
  await page.waitForTimeout(100)
  
  await assertCellAndLink(page, gameEditor, 'id-table-11-row-2-nth', "to be. The Dursleys", false);

  let col2wordsFreq = page.getByLabel('id-col2-words-frequency', { exact: true })
  await expect(col2wordsFreq).toHaveScreenshot()
  console.log("end!")
  page.close()
});

// Playwright E2E test for My Ghost Writer "Text Stats" feature on high/narrow window (550x550)
import { test, expect } from '@playwright/test';
import { assertCellAndLink, fileReader } from './test-helper'

const testStoryTxt = `${import.meta.dirname}/../../tests/events/very_long_text.txt`

test('test My Ghost Writer, high/narrow window (width 550 x height 1270): navigate between the value list/tables with mobile menu', async ({ page }) => {
  await page.setViewportSize({ width: 550, height: 1270 });
  await page.goto('http://localhost:8000/');
  await page.getByRole('button', { name: 'Set UI' }).click();

  // 3. Enable editing and fill the editor with long text content
  await page.getByRole("checkbox", { name: "Allow Editing" }).check();
  const text = await fileReader(testStoryTxt);
  let gameEditor = page.locator('#gametext');
  await gameEditor.click();
  await gameEditor.fill(text);
  await expect(gameEditor).toContainText(text.slice(0, 50), { timeout: 15000 });
  await page.waitForTimeout(100);

  await page.getByRole('button', { name: 'Main Menu Options' }).click();
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('link', { name: 'Tokens' }).click();
  await page.waitForTimeout(100)
  await page.getByRole('button', { name: 'id-expand-wordsfreqstats' }).click();
  await page.getByRole('checkbox', { name: 'id-col2-words-frequency-enable' }).check();
  await expect(page.getByRole('checkbox', { name: 'id-col2-words-frequency-enable' })).toBeChecked();
  await page.getByRole('button', { name: 'OK' }).click();
  await page.waitForTimeout(100)

  // Open mobile menu for text stats
  await page.getByRole('button', { name: 'id-navtoggler-words-freq' }).click();

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

  // let gameEditor = page.locator('#gametext')
  await page.getByText('the: 734').click();
  await page.waitForTimeout(100)

  await expect(currentTitleTableOfWords).toContainText('the : 734 ');
  await expect(currentTitleTableOfWords).toHaveAttribute("title", "stem: 'the'")

  await assertCellAndLink(page, gameEditor, 'id-table-0-row-0-nth', "THE BOY WHO");
  await assertCellAndLink(page, gameEditor, 'id-table-0-row-733-nth', "early the next");
  await assertCellAndLink(page, gameEditor, 'id-table-0-row-1-nth', " were the last");

  await page.getByLabel('id-current-table-of-words-btn').click();
  await page.getByText('the Dursleys:').click();
  await page.waitForTimeout(100)
  await expect(page.getByLabel('id-current-table-of-words-title')).toContainText('the Dursleys : 32 ');

  await page.getByLabel('id-current-table-of-words-btn').click();
  await page.getByLabel('id-list-of-words-11-nth').click();
  await page.waitForTimeout(100)

  await assertCellAndLink(page, gameEditor, 'id-table-11-row-2-nth', "to be. The Dursleys", false);

  let col2wordsFreq = page.getByLabel('id-col2-words-frequency', { exact: true })
  await expect(col2wordsFreq).toHaveScreenshot()
  await expect(col2wordsFreq).toMatchAriaSnapshot({ name: `test-classic-responsive-1270x650.txt` });
  page.close()
});

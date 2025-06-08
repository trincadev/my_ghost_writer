import { test, expect, devices } from '@playwright/test';
import { expectOnlyVisibleTextInElement, fileReader, uploadFileWithPageAndFilepath } from './test-helper';

const testStoryJsonTxt = `${import.meta.dirname}/../../tests/events/very_long_text.json`;
const expectedTextArray = [
  `He took off his thick black coat and threw it to Harry."You can kip under that," he said. "Don' mind if it wriggles a bit, I think I still got a couple o' dormice in one o' the pockets."Harry woke early the next morning. Although he could`
];

const iphone13Landscape = devices['iPhone 13 landscape'];
test.use({ ...iphone13Landscape });

test('My Ghost Writer, iPhone 13 landscape: Aesthetic UI to Corpo UI and Raw Editor', async ({ page }) => {
  const text = await fileReader(testStoryJsonTxt);
  await page.goto('http://localhost:8000/');
  await page.locator('#welcomecontainer div').filter({ hasText: 'Aesthetic UI' }).nth(3).click();
  await page.getByRole('button', { name: 'Set UI' }).click();
  await page.getByRole('button', { name: 'Toggle Action Menu' }).click();
  await page.getByRole('button', { name: 'Edit' }).click();
  
  await page.getByRole('button', { name: 'id-mobile-main-menu-options' }).click();
  await uploadFileWithPageAndFilepath(page, testStoryJsonTxt)
  
  await expectOnlyVisibleTextInElement(page, 'gametext', expectedTextArray[0]);
  await page.waitForTimeout(100);

  await page.getByRole('button', { name: 'id-mobile-main-menu-options' }).click();
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('link', { name: 'Tokens' }).click();
  await page.getByRole('button', { name: 'id-expand-wordsfreqstats' }).click();
  await page.getByRole('checkbox', { name: 'id-col2-words-frequency-enable' }).check();
  await expect(page.getByRole('checkbox', { name: 'id-col2-words-frequency-enable' })).toBeChecked();
  await page.getByRole('button', { name: 'OK' }).click();

  await expect(page.getByRole('checkbox', { name: 'Allow Editing' })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Allow Editing' }).check();
  
  await expect(page.getByLabel('id-words-frequency-description')).toBeVisible();
  await expect(page.getByLabel('id-words-frequency-description')).toContainText('My Ghost Writer will analyze your text and report in this section some statistics and a list of words grouped into stems.');
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: 'id-navtoggler-words-freq' }).click();
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).click();
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).fill('th');
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).press('Enter');
});

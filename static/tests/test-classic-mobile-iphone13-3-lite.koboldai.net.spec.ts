// @ts-check
/**
 * Playwright E2E test for My Ghost Writer "Text Stats" feature on iPhone 13 (mobile).
 *
 * This test case mirrors the desktop and iPad Mini -3- test, but runs in iPhone 13 viewport.
 * It covers:
 * 1. Connecting to the local web server.
 * 2. Starting from Aesthetic UI, activating it.
 * 3. Uploading a long JSON story file.
 * 4. Enabling the "My Ghost Writer" text stats feature.
 * 5. Filtering and interacting with the word frequency UI.
 * 6. Switching to Corpo UI and opening the Raw Editor.
 * 7. Navigating between value list and tables, and asserting correct UI updates.
 * 8. Verifying ARIA/accessibility and content.
 */
import { test, expect } from '@playwright/test';
import { expectOnlyVisibleTextInElement, fileReader, uploadFileWithPageAndFilepath } from './test-helper'

const testStoryJsonTxt = `${import.meta.dirname}/../../tests/events/very_long_text.json`;

const expectedTextArray = [
  `"Why aren't you supposed to do magic?" asked Harry.\n"Oh, well — I was at Hogwarts meself but I — er — got expelled, ter tell yeh the truth. In me third year. They snapped me wand in half an' everything. But Dumbledore let me stay on as gamekeeper. Great man, Dumbledore."
"Why were you expelled?"

"It's gettin' late and we've got lots ter do tomorrow," said Hagrid loudly. "Gotta get up ter town, get all yer books an' that."
He took off his thick black coat and threw it to Harry.
"You can kip under that," he said. "Don' mind if it wriggles a bit, I think I still got a couple o' dormice in one o' the pockets."
Harry woke early the next morning. Although he could`,

  `"The Potters, that's right, that's what I heard — "" — yes, their son, Harry — "Mr. Dursley stopped dead. Fear flooded him. He looked back at the whisperers as if he wanted to say something to them, but thought better of it.He dashed back across the road, hurried up to his office, snapped at his secretary not to disturb him, seized his telephone, and had almost finished dialing his home number when he changed his mind. He put the receiver back down and stroked his mustache, thinking ... no, he was being stupid. Potter wasn't such an unusual name. He was sure there were lots of people called Potter who had a son called Harry. Come to think of it, he wasn't even sure his nephew was called Harry. He'd never even seen the boy. It might have been Harvey. Or Harold. There was no point in worrying Mrs. Dursley; she always got so upset at any mention of her sister. He didn't blame her — if he'd had a sister like that ... but all the same, those people in cloaks ...`
]

test('My Ghost Writer, iPhone 13: Aesthetic UI to Corpo UI and Raw Editor', async ({ page }) => {
  // 1. Connect to the local web server page
  await page.goto('http://localhost:8000/');

  // 2. Start from Aesthetic UI: select the UI and activate it
  await page.locator('#welcomecontainer div').filter({ hasText: 'Aesthetic UI' }).nth(3).click();
  await page.getByRole('button', { name: 'Set UI' }).click();

  // 3. Enable editing and fill the editor with long text content
  await page.getByRole('button', { name: 'Toggle Action Menu' }).click();
  await page.getByRole('button', { name: 'Edit' }).click();

  await page.getByRole('button', { name: 'id-mobile-main-menu-options' }).click();
  await uploadFileWithPageAndFilepath(page, testStoryJsonTxt)

  // 4. Activate "My Ghost Writer" / text stats functionality via settings
  await page.getByRole('button', { name: 'id-mobile-main-menu-options' }).click();
  await page.getByRole("link", { name: "Settings" }).click();

  // 4. Open settings and enable the "My Ghost Writer" text stats feature
  await page.getByRole('link', { name: 'Tokens' }).click();
  await page.getByRole('button', { name: 'id-expand-wordsfreqstats' }).click();
  await page.getByRole('checkbox', { name: 'id-col2-words-frequency-enable' }).check();
  await page.getByRole('button', { name: 'OK' }).click();

  await expect(page.getByRole('checkbox', { name: 'Allow Editing' })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Allow Editing' }).check();
  // 5. Assert that the description for the text stats feature is visible and correct
  await expect(page.getByLabel('id-words-frequency-description')).toBeVisible();
  await expect(page.getByLabel('id-words-frequency-description')).toContainText('My Ghost Writer will analyze your text and report in this section some statistics and a list of words grouped into stems.');

  await page.waitForTimeout(100);
  // 6. Filter the word frequency list using the search box and assert results (first open the mobile menù)
  await page.getByRole('button', { name: 'id-navtoggler-words-freq' }).click();
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).click();
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).fill('th');
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).press('Enter');

  // Assert filtered value and that "the: 734" is present in the list
  await expect(page.getByLabel('id-filtered-value')).toContainText('th: 1701');
  await expect(page.locator('list')).toContainText('the: 734');

  // 7. Switch to Corpo UI via settings and open the Raw Editor
  await page.getByRole('button', { name: 'id-mobile-main-menu-options' }).click();
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('link', { name: 'Format' }).click();
  await page.locator('#gui_type').selectOption('3');
  await page.getByRole('button', { name: 'OK' }).click();

  await page.getByRole('button', { name: 'Show Corpo Side Panel' }).click();
  await page.getByText('Raw Editor', { exact: true }).click();

  // Assert that the Raw Editor is open and the filtered value is visible
  await expect(page.getByRole('button', { name: 'X', exact: true })).toBeVisible();

  await expect(page.getByLabel('id-filtered-value')).toBeVisible();
  await expect(page.locator('list')).toContainText('the: 734');
  await expect(page.getByLabel('id-list-of-words-0-nth')).toContainText('the: 734');

  // 8. Re-open settings and re-apply Corpo UI to ensure persistence
  await page.getByRole('button', { name: 'id-mobile-main-menu-options' }).click();
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('link', { name: 'Tokens' }).click();
  await page.getByRole('link', { name: 'Format' }).click();
  await page.locator('#gui_type').selectOption('3');
  await page.getByRole('button', { name: 'OK' }).click();
  await page.getByText('Raw Editor', { exact: true }).click();

  // 9. Filter again, this time with "ha", and check the results (first open the mobile menù)
  await page.getByRole('button', { name: 'id-navtoggler-words-freq' }).click();
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).click();
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).fill('ha');
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).press('Enter');
  await page.getByLabel('id-filtered-value').click();
  await expect(page.getByLabel('id-filtered-value')).toContainText('ha: 987');
  await expect(page.getByLabel('id-list-of-words-0-nth')).toContainText('Harry: 216');

  // 10. Simulate right-click and open the table for "Harry"
  await page.locator('#normalinterface').click({
    button: 'right'
  });
  await page.getByLabel('id-list-of-words-0-nth').click();

  // Assert that the table for "Harry" is visible and correct
  await expect(page.getByLabel('id-current-table-of-words-title')).toBeVisible();
  await expect(page.getByLabel('id-current-table-of-words-title')).toContainText('Harry : 216');
  await expect(page.getByLabel('id-table-0-row-0-nth', { exact: true }).getByRole('cell')).toContainText('son, Harry —');

  // 11. Click the first row link and assert the visible text in the editor matches the expected content
  await page.getByLabel('id-table-0-row-0-nth-link').click();
  await expectOnlyVisibleTextInElement(page, "gametext", expectedTextArray[1])

  // 12. Close the Raw Editor and assert it is hidden, then re-open and assert it is visible again
  await expect(page.getByText('Raw Editor', { exact: true })).not.toBeVisible();
  await page.getByRole('button', { name: 'X', exact: true }).click();
  await expect(page.getByText('Raw Editor', { exact: true })).toBeVisible();

  // 13. Close the page to end the test
  page.close();
});

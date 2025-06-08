/**
 * Playwright E2E test for My Ghost Writer "Text Stats" feature on iPhone 13 (mobile).
 *
 * Test scenario:
 * 1. Connect to the local web server (http://localhost:8000).
 * 2. Activate the UI mode required for testing (e.g., "Set UI").
 * 3. Enable editing and fill the editor with long text content.
 * 4. Activate the "My Ghost Writer" / text stats functionality via settings.
 * 5. Open the mobile menu and interact with the floating dropdown menu content for text stats.
 * 6. Interact with the text stats UI: filter, sort, and verify word frequency tables.
 * 7. Assert correct UI updates and ARIA snapshots for accessibility.
 */
import { test, expect } from '@playwright/test';
import { uploadFileWithPageAndFilepath } from './test-helper';

const testStoryJsonTxt = `${import.meta.dirname}/../../tests/events/very_long_text.json`;
const orderSelectionValues = ["asc", "desc"];
const sortSelectionValues = ["word_prefix", "n_words_ngram", "count"];
const expectedTextArray = [
  `"Why aren't you supposed to do magic?" asked Harry.\n"Oh, well — I was at Hogwarts meself but I — er — got expelled, ter tell yeh the truth. In me third year. They snapped me wand in half an' everything. But Dumbledore let me stay on as gamekeeper. Great man, Dumbledore."
"Why were you expelled?"

"It's gettin' late and we've got lots ter do tomorrow," said Hagrid loudly. "Gotta get up ter town, get all yer books an' that."
He took off his thick black coat and threw it to Harry.
"You can kip under that," he said. "Don' mind if it wriggles a bit, I think I still got a couple o' dormice in one o' the pockets."
Harry woke early the next morning. Although he could`,

  `Mr. and Mrs. Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal, thank you very much. ` +
    `They were the last people you'd expect to be involved in anything strange or mysterious, because they just didn't hold with ` +
    `such nonsense.Mr. Dursley was the director of a firm called Grunnings, which made drills. He was a big, beefy man with hardly` +
    ` any neck, although he did have a very large mustache. Mrs. Dursley was thin and blonde and had nearly twice the usual ` +
    `amount of neck, which came in very useful as she spent so much of her time craning over garden fences, spying on the neighbors.` +
    ` The Dursley s had a small son called Dudley and in their opinion there was no finer boy anywhere.`,
  `"Oh, well — I was at Hogwarts meself but I — er — got expelled, ter tell yeh the truth. In me third year. They snapped me wand in half an' everything. But Dumbledore let me stay on as gamekeeper. Great man, Dumbledore.""Why were you expelled?""It's gettin' late and we've got lots ter do tomorrow," said Hagrid loudly. "Gotta get up ter town, get all yer books an' that."He took off his thick black coat and threw it to Harry."You can kip under that," he said. "Don' mind if it wriggles a bit, I think I still got a couple o' dormice in one o' the pockets."Harry woke early the next morning. Although he could`,
]

test('test My Ghost Writer, iphone 13: order/sort', async ({ page }) => {
  // 1. Connect to the local web server page
  await page.goto('http://localhost:8000/');
  await expect(page.locator('#welcomecontainer')).toContainText('Set UI');

  // 2. Activate the required UI mode (e.g., switch to classic or advanced UI)
  await page.getByRole('button', { name: 'Set UI' }).click();

  // 3. Enable editing and fill the editor with long text content
  await page.getByRole('checkbox', { name: 'Allow Editing' }).check();
  // Use the JSON file for consistency with desktop test
  await page.getByRole('button', { name: 'id-mobile-main-menu-options' }).click();
  await uploadFileWithPageAndFilepath(page, testStoryJsonTxt)

  // 4. Activate "My Ghost Writer" / text stats functionality via settings
  await page.getByRole('button', { name: 'id-mobile-main-menu-options' }).click();
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('link', { name: 'Tokens' }).click();
  await page.getByRole('button', { name: 'id-expand-wordsfreqstats' }).click();
  await page.getByRole('checkbox', { name: 'id-col2-words-frequency-enable' }).click();
  await expect(page.getByRole('checkbox', { name: 'id-col2-words-frequency-enable' })).toBeChecked();
  await page.getByRole('button', { name: 'OK' }).click();
  await page.waitForTimeout(100);

  // 5. Open the mobile menu and interact with the floating dropdown menu content for text stats
  await page.getByRole('button', { name: 'id-navtoggler-words-freq' }).click(); // Open mobile floating menu

  // 6. Interact with the text stats UI: filter, sort, and verify word frequency tables
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).click();
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).fill('th');
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).press('Enter');
  await page.waitForTimeout(100);
  await expect(page.getByLabel('id-filtered-value')).toContainText('th: 1701');

  let listOfWordsList = page.getByLabel('id-list-of-words-container').locator('list');
  let listOfWordsListChildren = listOfWordsList.getByRole('listitem');

  await page.getByRole('button', { name: 'id-navtoggler-words-freq' }).click(); // Open mobile floating menu
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).press('Enter');
  await page.waitForTimeout(100);
  await expect(listOfWordsListChildren).toHaveCount(1701);

  // 7. Loop through all combinations of order and sort, update the UI, and assert ARIA snapshots for accessibility and regression
  for (let currentOrderSelectionValueIdx in orderSelectionValues) {
    let currentOrderSelectionValue = orderSelectionValues[currentOrderSelectionValueIdx];
    for (let currentSortSelectionValueIdx in sortSelectionValues) {
      let currentSortSelectionValue = sortSelectionValues[currentSortSelectionValueIdx];
      // Log the current combination for debugging
      console.log(`currentOrderSelectionValue:${currentOrderSelectionValue}, currentSelectionValue:${currentSortSelectionValue}.`);
      // Select the order and sort options in the UI
      await page.getByRole('button', { name: 'id-navtoggler-words-freq' }).click(); // Open mobile floating menu
      await page.getByLabel('id-select-order-by').selectOption(currentOrderSelectionValue);
      await page.getByLabel('id-select-sort-by').selectOption(currentSortSelectionValue);
      // Re-apply the filter and wait for the UI to update
      await page.getByRole('searchbox', { name: 'filter-words-frequency' }).fill('th');
      await page.getByRole('searchbox', { name: 'filter-words-frequency' }).press('Enter');
      await page.waitForTimeout(300);
      // Assert that the list of words container matches the expected ARIA snapshot for this combination
      await expect(page.getByLabel('id-list-of-words-container')).toMatchAriaSnapshot({ name: `test-classic-mobile-iphone13-1--${currentOrderSelectionValue}-${currentSortSelectionValue}--id-list-of-words-container.txt` });
    }
  }
  // End of test
  console.log('end!');
  page.close();
});

/**
 * Playwright E2E test for My Ghost Writer "Text Stats" feature on iPad Mini landscape (Classic UI).
 *
 * This test case mirrors the desktop -3- test, but runs in iPad Mini landscape viewport.
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
import { test, expect, Page } from '@playwright/test';
import { assertCellAndLink, expectOnlyVisibleTextInElement } from './test-helper'

const testStoryJsonTxt = `${import.meta.dirname}/../../tests/events/very_long_text.json`

const expectedContentGametext2 = `He'd forgotten all about the people in cloaks until he passed a group of them next to the baker's. He eyed them angrily as he passed. He didn't know why, but they made him uneasy. This bunch were whispering excitedly, too, and he couldn't see a single collecting tin. It was on his way back past them, clutching a large doughnut in a bag, that he caught a few words of what they were saying."The Potters, that's right, that's what I heard — "" — yes, their son, Harry — "Mr. Dursley stopped dead. Fear flooded him. He looked back at the whisperers as if he wanted to say something to them, but thought better of it.He dashed back across the road, hurried up to his office, snapped at his secretary not to disturb him, seized his telephone, and had almost finished dialing his home number when he changed his mind. He put the receiver back down and stroked his mustache, thinking ... no, he was being stupid. Potter wasn't such an unusual name. He was sure there were lots of people called Potter who had a son called Harry. Come to think of it, he wasn't even sure his nephew was called Harry. He'd never even seen the boy. It might have been Harvey. Or Harold. There was no point in worrying Mrs. Dursley; she always got so upset at any mention of her sister. He didn't blame her — if he'd had a sister like that ... but all the same, those people in cloaks ...He found it a lot harder to concentrate on drills that afternoon and when he left the building at five o'clock, he was still so worried that he walked straight into someone just outside the door."Sorry," he grunted, as the tiny old man stumbled and almost fell. It was a few seconds before Mr. Dursley realized that the man was wearing a violet cloak. He didn't seem at all upset at being almost knocked to the ground. On the contrary, his face split into a wide smile and he said in a squeaky voice that made passersby stare, "Don't be sorry, my dear sir, for nothing could upset me today! Rejoice, for You- Know-Who has gone at last! Even Muggles like yourself should be celebrating, this happy, happy day!"`

const expectedContentGametext = expectedContentGametext2+`Mr. Dursley stood rooted to the spot. He had been hugged by a complete stranger. He also thought he had been called a Muggle, whatever that was. He was rattled. He hurried to his car and set off for home, hoping he was imagining things, which he had never hoped before, because he didn't approve of imagination.As he pulled into the driveway of number four, the first thing he saw — and it didn't improve his mood — was the tabby cat he'd spotted that morning. It was now sitting on his garden wall. He was sure it was the same one; it had the same markings around its eyes."Shoo!" said Mr. Dursley loudly.The cat didn't move. It just gave him a stern look.Was this normal cat behavior? Mr. Dursley wondered. Trying to pull himself together, he let himself into thehouse. He was still determined not to mention anything to his wife.Mrs. Dursley had had a nice, normal day. She told him over dinner all about Mrs. Next Door's problems with her daughter and how Dudley had learned a new word ("Won't!"). Mr. Dursley tried to act normally. When Dudley had been put to bed, he went into the living room in time to catch the last report on the evening news:"And finally, bird-watchers everywhere have reported that the nation's owls have been behaving very unusually today. Although owls normally hunt at night and are hardly ever seen in daylight, there have been hundreds of sightings of these birds flying in every direction since sunrise. Experts are unable to explain why the owls have suddenly changed their sleeping pattern." The newscaster allowed himself a grin. "Most mysterious. And now, over to Jim McGuffin with the weather. Going to be any more showers of owls tonight, Jim?""Well, Ted," said the weatherman, "I don't know about that, but it's not only the owls that have been acting oddly today. Viewers as far apart as Kent, Yorkshire, and Dundee have been phoning in to tell me that instead of the rain I promised yesterday, they've had a downpour of shooting stars! Perhaps people have been celebrating Bonfire Night early — it's not until next week, folks! But I can promise a wet night tonight."Mr. Dursley sat frozen in his armchair. Shooting stars all over Britain? Owls flying by daylight? Mysterious people in cloaks all over the place? And a whisper, a whisper about the Potters . . .Mrs. Dursley came into the living room carrying two cups of tea. It was no good. He'd have to say something to her. He cleared his throat nervously. "Er — Petunia, dear — you haven't heard from your sister lately, have you?"As he had expected, Mrs. Dursley looked shocked and angry. After all, they normally pretended she didn't have a sister.`

test('test My Ghost Writer, ipad mini landscape: try using My Ghost Writer with Aesthetic UI then with Corpo UI', async ({ page }: { page: Page }) => {
  // 1. Connect to the local web server page
  await page.goto('http://localhost:8000/');

  // 2. Start from Aesthetic UI: select the UI and activate it
  await page.locator('#welcomecontainer div').filter({ hasText: 'Aesthetic UI' }).nth(3).click();
  await page.getByRole('button', { name: 'Set UI' }).click();

  // 3. Upload a saved JSON story file to provide long text content for analysis
  console.log(`preparing uploading of file '${testStoryJsonTxt}'!`)
  await page.getByRole('link', { name: 'Save / Load' }).click();
  await page.waitForTimeout(100)
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: '📁 Open File' }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(testStoryJsonTxt);
  await page.waitForTimeout(300)
  console.log(`file '${testStoryJsonTxt}' uploaded!`)

  // 4. Open settings and enable the "My Ghost Writer" text stats feature
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('link', { name: 'Tokens' }).click();
  await page.getByRole('button', { name: 'id-expand-wordsfreqstats' }).click();
  await page.getByRole('checkbox', { name: 'id-col2-words-frequency-enable' }).check();
  await page.getByRole('button', { name: 'OK' }).click();

  // 5. Assert that the description for the text stats feature is visible and correct
  await expect(page.getByLabel('id-words-frequency-description')).toBeVisible();
  await expect(page.getByLabel('id-words-frequency-description')).toContainText('My Ghost Writer will analyze your text and report in this section some statistics and a list of words grouped into stems.');

  // 6. Filter the word frequency list using the search box and assert results
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).click();
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).fill('th');
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).press('Enter');

  // Assert filtered value and that "the: 734" is present in the list
  await expect(page.getByLabel('id-filtered-value')).toContainText('th: 1701');
  await expect(page.locator('list')).toContainText('the: 734');

  // 7. Switch to Corpo UI via settings and open the Raw Editor
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('link', { name: 'Format' }).click();
  await page.locator('#gui_type').selectOption('3');
  await page.getByRole('button', { name: 'OK' }).click();

  await page.getByText('Raw Editor', { exact: true }).click();

  // Assert that the Raw Editor is open and the filtered value is visible
  await expect(page.getByRole('button', { name: 'X', exact: true })).toBeVisible();

  await expect(page.getByLabel('id-filtered-value')).toBeVisible();
  await expect(page.locator('list')).toContainText('the: 734');
  await expect(page.getByLabel('id-list-of-words-0-nth')).toContainText('the: 734');

  // 8. Re-open settings and re-apply Corpo UI to ensure persistence
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('link', { name: 'Tokens' }).click();
  await page.getByRole('link', { name: 'Format' }).click();
  await page.locator('#gui_type').selectOption('3');
  await page.getByRole('button', { name: 'OK' }).click();
  await page.getByText('Raw Editor', { exact: true }).click();

  // 9. Filter again, this time with "ha", and check the results
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
  // await expect(page.getByLabel('id-table-0-row-0-nth', { exact: true }).getByRole('cell')).toContainText('their son, Harry —');
  await expect(page.getByLabel('id-table-0-row-0-nth-link')).toContainText('son, Harry —');
await expect(page.getByLabel('id-table-0-row-0-nth-link')).toContainText('son, Harry —');
  // 11. Click the first row link and assert the visible text in the editor matches the expected content
  await page.getByLabel('id-table-0-row-0-nth-link').click();
  await expectOnlyVisibleTextInElement(page, "gametext", expectedContentGametext2)

  // 12. Close the Raw Editor and assert it is hidden, then re-open and assert it is visible again
  await expect(page.getByText('Raw Editor', { exact: true })).not.toBeVisible();
  await page.getByRole('button', { name: 'X', exact: true }).click();
  await expect(page.getByText('Raw Editor', { exact: true })).toBeVisible();

  // 13. Close the page to end the test
  page.close()
});

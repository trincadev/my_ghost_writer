import { test, expect } from '@playwright/test';
import { assertCellAndLink, assertCellAndLinkAriaSnapshot } from './test-helper'

const testStoryJsonTxt = `${import.meta.dirname}/../../tests/events/very_long_text.json`

const expectedStringArray = [
  "THE BOY WHO LIVEDMr. and Mrs. Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal, thank you very much. They were the last people you'd expect to be involved in anything strange or mysterious, because they just didn't hold with such nonsense.Mr. Dursley was the director of a firm called Grunnings, which made drills. He was a big, beefy man with hardly any neck, although he did have a very large mustache. Mrs. Dursley was thin and blonde and had nearly twice the usual amount of neck, which came in very useful as she spent so much of her time craning over garden fences, spying on the neighbors. The Dursley s had a small son called Dudley and in their opinion there was no finer boy anywhere.The Dursleys had everything they wanted, but they also had a secret, and their greatest fear was that somebody would discover it. They didn't think they could bear it if anyone found out about the Potters. Mrs. Potter was Mrs. Dursley's sister, but they hadn'tmet for several years; in fact, Mrs. Dursley pretended she didn't have a sister, because her sister and her good-for-nothing husband were as unDursleyish as it was possible to be. The Dursleys shuddered to think what the neighbors would say if the Potters arrived in the street. The Dursleys knew that the Potters had a small son, too, but they had never even seen him.",
  "Hagrid looked down at his umbrella and stroked his beard.\"Shouldn'ta lost me temper,\" he said ruefully, \"but it didn't work anyway. Meant ter turn him into a pig, but I suppose he was so much like a pig anyway there wasn't much left ter do.\"He cast a sideways look at Harry under his bushy eyebrows.\"Be grateful if yeh didn't mention that ter anyone at Hogwarts,\" he said. \"I'm — er — not supposed ter do magic, strictly speakin'. I was allowed ter do a bit ter follow yeh an' get yer letters to yeh an' stuff — one o' the reasons I was so keen ter take on the job — \"\"Why aren't you supposed to do magic?\" asked Harry.\"Oh, well — I was at Hogwarts meself but I — er — got expelled, ter tell yeh the truth. In me third year. They snapped me wand in half an' everything. But Dumbledore let me stay on as gamekeeper. Great man, Dumbledore.\"\"Why were you expelled?\"\"It's gettin' late and we've got lots ter do tomorrow,\" said Hagrid loudly. \"Gotta get up ter town, get all yer books an' that.\"He took off his thick black coat and threw it to Harry.\"You can kip under that,\" he said. \"Don' mind if it wriggles a bit, I think I still got a couple o' dormice in one o' the pockets.\"Harry woke early the next morning. Although he could",
  "Mr. and Mrs. Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal, thank you very much. They were the last people you'd expect to be involved in anything strange or mysterious, because they just didn't hold with such nonsense.Mr. Dursley was the director of a firm called Grunnings, which made drills. He was a big, beefy man with hardly any neck, although he did have a very large mustache. Mrs. Dursley was thin and blonde and had nearly twice the usual amount of neck, which came in very useful as she spent so much of her time craning over garden fences, spying on the neighbors. The Dursley s had a small son called Dudley and in their opinion there was no finer boy anywhere.The Dursleys had everything they wanted, but they also had a secret, and their greatest fear was that somebody would discover it. They didn't think they could bear it if anyone found out about the Potters. Mrs. Potter was Mrs. Dursley's sister, but they hadn'tmet for several years; in fact, Mrs. Dursley pretended she didn't have a sister, because her sister and her good-for-nothing husband were as unDursleyish as it was possible to be. The Dursleys shuddered to think what the neighbors would say if the Potters arrived in the street. The Dursleys knew that the Potters had a small son, too, but they had never even seen him."
]

test('test My Ghost Writer, ipad mini landscape: navigate between the value list/tables', async ({ page }, testInfo) => {
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

  await assertCellAndLinkAriaSnapshot(page, 'id-table-0-row-0-nth', "THE BOY WHO", "gametext", expectedStringArray[0]);
  await assertCellAndLinkAriaSnapshot(page, 'id-table-0-row-733-nth', "early the next", "gametext", expectedStringArray[1]);
  await assertCellAndLinkAriaSnapshot(page, 'id-table-0-row-1-nth', " were the last", "gametext", expectedStringArray[2]);

  await page.getByText('the Dursleys:').click();
  await page.waitForTimeout(100)
  await expect(page.getByLabel('id-current-table-of-words-title')).toContainText('the Dursleys : 32 ');
  
  await page.getByLabel('id-list-of-words-11-nth').click();
  await page.waitForTimeout(100)
  
  await assertCellAndLink(page, gameEditor, 'id-table-11-row-2-nth', "to be. The Dursleys", false);

  let col2wordsFreq = page.getByLabel('id-col2-words-frequency', { exact: true })
  await expect(col2wordsFreq).toMatchAriaSnapshot({ name: `test-classic-landscape-ipad-mini-0--end.txt` });
  console.log("end!")
  page.close()
});

// Playwright E2E test for My Ghost Writer "Text Stats" feature on high/narrow window (550x550)
import { test, expect } from '@playwright/test';
import { assertCellAndLinkAriaSnapshot, uploadFileWithPageAndFilepath } from './test-helper'

const testStoryJsonTxt = `${import.meta.dirname}/../../tests/events/very_long_text.json`
const expectedStringArray = [
  "THE BOY WHO LIVEDMr. and Mrs. Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal, thank you very much. They were the last people you'd expect to be involved in anything strange or mysterious, because they just didn't hold with such nonsense.Mr. Dursley was the director of a firm called Grunnings, which made drills. He was a big, beefy man with hardly any neck, although he did have a very large mustache. Mrs. Dursley was thin and blonde and had nearly twice the usual amount of neck, which came in very useful as she spent so much of her time craning over garden fences, spying on the neighbors. The Dursley s had a small son called Dudley and in their opinion there was no finer boy anywhere.The Dursleys had everything they wanted, but they also had a secret, and their greatest fear was that somebody would discover it. They didn't think they could bear it if anyone found out about the Potters. Mrs. Potter was Mrs. Dursley's sister, but they hadn'tmet for several years; in fact, Mrs. Dursley pretended she didn't have a sister, because her sister and her good-for-nothing husband were as unDursleyish as it was possible to be. The Dursleys shuddered to think what the neighbors would say if the Potters arrived in the street. The Dursleys knew that the Potters had a small son, too, but they had never even seen him.This boy was another good reason for keeping the Potters away; they didn't want Dudley mixing with a child like that.When Mr. and Mrs. Dursley woke up on the dull, gray Tuesday our story starts, there was nothing about the cloudy sky outside to suggest that strange and mysterious things would soon be happening all over the country. Mr. Dursley hummed as he picked out his most boring tie for work, and Mrs. Dursley gossiped away happily as she wrestled a screaming Dudley into his high chair.",
  "the next second, Dudley was dancing on the spot with his hands clasped over his fat bottom, howling in pain. When he turned his back on them, Harry saw a curly pig's tail poking through a hole in his trousers.Uncle Vernon roared. Pulling Aunt Petunia and Dudley into the other room, he cast one last terrified look at Hagrid and slammed the door behind them.Hagrid looked down at his umbrella and stroked his beard.\"Shouldn'ta lost me temper,\" he said ruefully, \"but it didn't work anyway. Meant ter turn him into a pig, but I suppose he was so much like a pig anyway there wasn't much left ter do.\"He cast a sideways look at Harry under his bushy eyebrows.\"Be grateful if yeh didn't mention that ter anyone at Hogwarts,\" he said. \"I'm — er — not supposed ter do magic, strictly speakin'. I was allowed ter do a bit ter follow yeh an' get yer letters to yeh an' stuff — one o' the reasons I was so keen ter take on the job — \"\"Why aren't you supposed to do magic?\" asked Harry.\"Oh, well — I was at Hogwarts meself but I — er — got expelled, ter tell yeh the truth. In me third year. They snapped me wand in half an' everything. But Dumbledore let me stay on as gamekeeper. Great man, Dumbledore.\"\"Why were you expelled?\"\"It's gettin' late and we've got lots ter do tomorrow,\" said Hagrid loudly. \"Gotta get up ter town, get all yer books an' that.\"He took off his thick black coat and threw it to Harry.\"You can kip under that,\" he said. \"Don' mind if it wriggles a bit, I think I still got a couple o' dormice in one o' the pockets.\"Harry woke early the next morning. Although he could",
  "Mr. and Mrs. Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal, thank you very much. They were the last people you'd expect to be involved in anything strange or mysterious, because they just didn't hold with such nonsense.Mr. Dursley was the director of a firm called Grunnings, which made drills. He was a big, beefy man with hardly any neck, although he did have a very large mustache. Mrs. Dursley was thin and blonde and had nearly twice the usual amount of neck, which came in very useful as she spent so much of her time craning over garden fences, spying on the neighbors. The Dursley s had a small son called Dudley and in their opinion there was no finer boy anywhere.The Dursleys had everything they wanted, but they also had a secret, and their greatest fear was that somebody would discover it. They didn't think they could bear it if anyone found out about the Potters. Mrs. Potter was Mrs. Dursley's sister, but they hadn'tmet for several years; in fact, Mrs. Dursley pretended she didn't have a sister, because her sister and her good-for-nothing husband were as unDursleyish as it was possible to be. The Dursleys shuddered to think what the neighbors would say if the Potters arrived in the street. The Dursleys knew that the Potters had a small son, too, but they had never even seen him.This boy was another good reason for keeping the Potters away; they didn't want Dudley mixing with a child like that.When Mr. and Mrs. Dursley woke up on the dull, gray Tuesday our story starts, there was nothing about the cloudy sky outside to suggest that strange and mysterious things would soon be happening all over the country. Mr. Dursley hummed as he picked out his most boring tie for work, and Mrs. Dursley gossiped away happily as she wrestled a screaming Dudley into his high chair.",
  "met for several years; in fact, Mrs. Dursley pretended she didn't have a sister, because her sister and her good-for-nothing husband were as unDursleyish as it was possible to be. The Dursleys shuddered to think what the neighbors would say if the Potters arrived in the street. The Dursleys knew that the Potters had a small son, too, but they had never even seen him.This boy was another good reason for keeping the Potters away; they didn't want Dudley mixing with a child like that.When Mr. and Mrs. Dursley woke up on the dull, gray Tuesday our story starts, there was nothing about the cloudy sky outside to suggest that strange and mysterious things would soon be happening all over the country. Mr. Dursley hummed as he picked out his most boring tie for work, and Mrs. Dursley gossiped away happily as she wrestled a screaming Dudley into his high chair.None of them noticed a large, tawny owl flutter past the window.At half past eight, Mr. Dursley picked up his briefcase, pecked Mrs. Dursley on the cheek, and tried to kiss Dudley good-bye but missed, because Dudley was now having a tantrum and throwing his cereal at the walls. \"Little tyke,\" chortled Mr. Dursley as he left the house. He got into his car and backed out of number four's drive.It was on the corner of the street that he noticed the first sign of something peculiar — a cat reading a map. For a second, Mr. Dursley didn't realize what he had seen — then he jerked his head around to look again. There was a tabby cat standing on the corner of Privet Drive, but there wasn't a map in sight. What could he have been thinking of? It must have been a trick of the light. Mr. Dursley blinked and stared atthe cat. It stared back. As Mr. Dursley drove around the corner and up the road, he watched the cat in his mirror. It was now reading the sign that said Privet Drive — no, looking at the sign; cats couldn't read maps or signs. Mr. Dursley gave himself a little shake and put the cat out of his mind. As he drove toward town he thought of nothing except a large order of drills he was hoping to get that day."
]

test('test My Ghost Writer, high/narrow window (width 550 x height 1270): navigate between the value list/tables with mobile menu', async ({ page }) => {
  await page.setViewportSize({ width: 550, height: 1270 });
  await page.goto('http://localhost:8000/');
  await page.getByRole('button', { name: 'Set UI' }).click();

  // 3. Enable editing and fill the editor with long text content
  await page.getByRole('button', { name: 'id-mobile-main-menu-options' }).click();
  await uploadFileWithPageAndFilepath(page, testStoryJsonTxt)

  await page.getByRole('button', { name: 'id-mobile-main-menu-options' }).click();
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

  await assertCellAndLinkAriaSnapshot(page, 'id-table-0-row-0-nth', "THE BOY WHO", "gametext", expectedStringArray[0]);
  await assertCellAndLinkAriaSnapshot(page, 'id-table-0-row-733-nth', "early the next", "gametext", expectedStringArray[1]);
  await assertCellAndLinkAriaSnapshot(page, 'id-table-0-row-1-nth', " were the last", "gametext", expectedStringArray[2]);

  await page.getByLabel('id-current-table-of-words-btn').click();
  await page.getByText('the Dursleys:').click();
  await page.waitForTimeout(100)
  await expect(page.getByLabel('id-current-table-of-words-title')).toContainText('the Dursleys : 32 ');

  await page.getByLabel('id-current-table-of-words-btn').click();
  await page.getByLabel('id-list-of-words-11-nth').click();
  await page.waitForTimeout(100)

  await assertCellAndLinkAriaSnapshot(page, 'id-table-11-row-2-nth', "to be. The Dursleys", "gametext", expectedStringArray[3]);

  let col2wordsFreq = page.getByLabel('id-col2-words-frequency', { exact: true })
  await expect(col2wordsFreq).toMatchAriaSnapshot({ name: `test-classic-responsive-1270x650--col2wordsFreq.txt` });
  page.close()
});

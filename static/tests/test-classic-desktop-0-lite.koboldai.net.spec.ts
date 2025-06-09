/**
 * Playwright E2E test for My Ghost Writer "Text Stats" feature.
 *
 * Test scenario:
 * 1. Connect to the local web server (http://localhost:8000).
 * 2. Activate the UI mode required for testing (e.g., "Set UI").
 * 3. Upload a saved JSON story file to populate the editor with long text content.
 * 4. Activate the "My Ghost Writer" / text stats functionality.
 * 5. Interact with the text stats UI: filter, open value list, and verify word frequency tables.
 * 6. Navigate between value list and tables, and assert correct UI updates and ARIA snapshots for accessibility.
 */
import { test, expect, Page } from '@playwright/test';
import {
  assertCellAndLinkAriaSnapshot,
  scrollToBottomById,
  scrollToTopById,
  uploadFileWithPageAndFilepath
} from './test-helper'

const testStoryJsonTxt = `${import.meta.dirname}/../../tests/events/very_long_text.json`
const expectedStringArray = [
  "THE BOY WHO LIVEDMr. and Mrs. Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal, thank you very much. They were the last people you'd expect to be involved in anything strange or mysterious, because they just didn't hold with such nonsense.Mr. Dursley was the director of a firm called Grunnings, which made drills. He was a big, beefy man with hardly any neck, although he did have a very large mustache. Mrs. Dursley was thin and blonde and had nearly twice the usual amount of neck, which came in very useful as she spent so much of her time craning over garden fences, spying on the neighbors. The Dursley s had a small son called Dudley and in their opinion there was no finer boy anywhere.The Dursleys had everything they wanted, but they also had a secret, and their greatest fear was that somebody would discover it. They didn't think they could bear it if anyone found out about the Potters. Mrs. Potter was Mrs. Dursley's sister, but they hadn'tmet for several years; in fact, Mrs. Dursley pretended she didn't have a sister, because her sister and her good-for-nothing husband were as unDursleyish as it was possible to be. The Dursleys shuddered to think what the neighbors would say if the Potters arrived in the street. The Dursleys knew that the Potters had a small son, too, but they had never even seen him.This boy was another good reason for keeping the Potters away; they didn't want Dudley mixing with a child like that.When Mr. and Mrs. Dursley woke up on the dull, gray Tuesday our story starts, there was nothing about the cloudy sky outside to suggest that strange and mysterious things would soon be happening all over the country. Mr. Dursley hummed as he picked out his most boring tie for work, and Mrs. Dursley gossiped away happily as she wrestled a screaming Dudley into his high chair.None of them noticed a large, tawny owl flutter past the window.At half past eight, Mr. Dursley picked up his briefcase, pecked Mrs. Dursley on the cheek, and tried to kiss Dudley good-bye but missed, because Dudley was now having a tantrum and throwing his cereal at the walls. \"Little tyke,\" chortled Mr. Dursley as he left the house. He got into his car and backed out of number four's drive.It was on the corner of the street that he noticed the first sign of something peculiar — a cat reading a map. For a second, Mr. Dursley didn't realize what he had seen — then he jerked his head around to look again. There was a tabby cat standing on the corner of Privet Drive, but there wasn't a map in sight. What could he have been thinking of? It must have been a trick of the light. Mr. Dursley blinked and stared atthe cat. It stared back. As Mr. Dursley drove around the corner and up the road, he watched the cat in his mirror. It was now reading the sign that said Privet Drive — no, looking at the sign; cats couldn't read maps or signs. Mr. Dursley gave himself a little shake and put the cat out of his mind. As he drove toward town he thought of nothing except a large order of drills he was hoping to get that day.",
  "Harry looked back at Hagrid, smiling, and saw that Hagrid was positively beaming at him.\"See?\" said Hagrid. \"Harry Potter, not a wizard — you wait, you'll be right famous at Hogwarts.\"But Uncle Vernon wasn't going to give in without a fight.\"Haven't I told you he's not going?\" he hissed. \"He's going to Stonewall High and he'll be grateful for it. I've read those letters and he needs all sorts of rubbish — spell books and wands and — \"\"If he wants ter go, a great Muggle like you won't stop him,\" growled Hagrid. \"Stop Lily an' James Potter's son goin' ter Hogwarts! Yer mad. His name's been down ever since he was born. He's off ter the finest school of witchcraft and wizardry in the world. Seven years there and he won't know himself. He'll be with youngsters of his own sort, fer a change, an' he'll be under the greatest headmaster Hogwarts ever had, Albus Dumbled — \"\"I AM NOT PAYING FOR SOME CRACKPOT OLD FOOL TO TEACH HIM MAGIC TRICKS!\" yelled Uncle Vernon.But he had finally gone too far. Hagrid seized his umbrella and whirled it over his head, \"NEVER — \" he thundered, \"— INSULT — ALBUS — DUMBLEDORE — IN — FRONT — OF — ME!\"He brought the umbrella swishing down through the air to point at Dudley — there was a flash of violet light, a sound like a firecracker, a sharp squeal, andthe next second, Dudley was dancing on the spot with his hands clasped over his fat bottom, howling in pain. When he turned his back on them, Harry saw a curly pig's tail poking through a hole in his trousers.Uncle Vernon roared. Pulling Aunt Petunia and Dudley into the other room, he cast one last terrified look at Hagrid and slammed the door behind them.Hagrid looked down at his umbrella and stroked his beard.\"Shouldn'ta lost me temper,\" he said ruefully, \"but it didn't work anyway. Meant ter turn him into a pig, but I suppose he was so much like a pig anyway there wasn't much left ter do.\"He cast a sideways look at Harry under his bushy eyebrows.\"Be grateful if yeh didn't mention that ter anyone at Hogwarts,\" he said. \"I'm — er — not supposed ter do magic, strictly speakin'. I was allowed ter do a bit ter follow yeh an' get yer letters to yeh an' stuff — one o' the reasons I was so keen ter take on the job — \"\"Why aren't you supposed to do magic?\" asked Harry.\"Oh, well — I was at Hogwarts meself but I — er — got expelled, ter tell yeh the truth. In me third year. They snapped me wand in half an' everything. But Dumbledore let me stay on as gamekeeper. Great man, Dumbledore.\"\"Why were you expelled?\"\"It's gettin' late and we've got lots ter do tomorrow,\" said Hagrid loudly. \"Gotta get up ter town, get all yer books an' that.\"He took off his thick black coat and threw it to Harry.\"You can kip under that,\" he said. \"Don' mind if it wriggles a bit, I think I still got a couple o' dormice in one o' the pockets.\"Harry woke early the next morning. Although he could",
  "Mr. and Mrs. Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal, thank you very much. They were the last people you'd expect to be involved in anything strange or mysterious, because they just didn't hold with such nonsense.Mr. Dursley was the director of a firm called Grunnings, which made drills. He was a big, beefy man with hardly any neck, although he did have a very large mustache. Mrs. Dursley was thin and blonde and had nearly twice the usual amount of neck, which came in very useful as she spent so much of her time craning over garden fences, spying on the neighbors. The Dursley s had a small son called Dudley and in their opinion there was no finer boy anywhere.The Dursleys had everything they wanted, but they also had a secret, and their greatest fear was that somebody would discover it. They didn't think they could bear it if anyone found out about the Potters. Mrs. Potter was Mrs. Dursley's sister, but they hadn'tmet for several years; in fact, Mrs. Dursley pretended she didn't have a sister, because her sister and her good-for-nothing husband were as unDursleyish as it was possible to be. The Dursleys shuddered to think what the neighbors would say if the Potters arrived in the street. The Dursleys knew that the Potters had a small son, too, but they had never even seen him.This boy was another good reason for keeping the Potters away; they didn't want Dudley mixing with a child like that.When Mr. and Mrs. Dursley woke up on the dull, gray Tuesday our story starts, there was nothing about the cloudy sky outside to suggest that strange and mysterious things would soon be happening all over the country. Mr. Dursley hummed as he picked out his most boring tie for work, and Mrs. Dursley gossiped away happily as she wrestled a screaming Dudley into his high chair.None of them noticed a large, tawny owl flutter past the window.At half past eight, Mr. Dursley picked up his briefcase, pecked Mrs. Dursley on the cheek, and tried to kiss Dudley good-bye but missed, because Dudley was now having a tantrum and throwing his cereal at the walls. \"Little tyke,\" chortled Mr. Dursley as he left the house. He got into his car and backed out of number four's drive.It was on the corner of the street that he noticed the first sign of something peculiar — a cat reading a map. For a second, Mr. Dursley didn't realize what he had seen — then he jerked his head around to look again. There was a tabby cat standing on the corner of Privet Drive, but there wasn't a map in sight. What could he have been thinking of? It must have been a trick of the light. Mr. Dursley blinked and stared atthe cat. It stared back. As Mr. Dursley drove around the corner and up the road, he watched the cat in his mirror. It was now reading the sign that said Privet Drive — no, looking at the sign; cats couldn't read maps or signs. Mr. Dursley gave himself a little shake and put the cat out of his mind. As he drove toward town he thought of nothing except a large order of drills he was hoping to get that day.",
  "The Dursleys had everything they wanted, but they also had a secret, and their greatest fear was that somebody would discover it. They didn't think they could bear it if anyone found out about the Potters. Mrs. Potter was Mrs. Dursley's sister, but they hadn'tmet for several years; in fact, Mrs. Dursley pretended she didn't have a sister, because her sister and her good-for-nothing husband were as unDursleyish as it was possible to be. The Dursleys shuddered to think what the neighbors would say if the Potters arrived in the street. The Dursleys knew that the Potters had a small son, too, but they had never even seen him.This boy was another good reason for keeping the Potters away; they didn't want Dudley mixing with a child like that.When Mr. and Mrs. Dursley woke up on the dull, gray Tuesday our story starts, there was nothing about the cloudy sky outside to suggest that strange and mysterious things would soon be happening all over the country. Mr. Dursley hummed as he picked out his most boring tie for work, and Mrs. Dursley gossiped away happily as she wrestled a screaming Dudley into his high chair.None of them noticed a large, tawny owl flutter past the window.At half past eight, Mr. Dursley picked up his briefcase, pecked Mrs. Dursley on the cheek, and tried to kiss Dudley good-bye but missed, because Dudley was now having a tantrum and throwing his cereal at the walls. \"Little tyke,\" chortled Mr. Dursley as he left the house. He got into his car and backed out of number four's drive.It was on the corner of the street that he noticed the first sign of something peculiar — a cat reading a map. For a second, Mr. Dursley didn't realize what he had seen — then he jerked his head around to look again. There was a tabby cat standing on the corner of Privet Drive, but there wasn't a map in sight. What could he have been thinking of? It must have been a trick of the light. Mr. Dursley blinked and stared atthe cat. It stared back. As Mr. Dursley drove around the corner and up the road, he watched the cat in his mirror. It was now reading the sign that said Privet Drive — no, looking at the sign; cats couldn't read maps or signs. Mr. Dursley gave himself a little shake and put the cat out of his mind. As he drove toward town he thought of nothing except a large order of drills he was hoping to get that day.But on the edge of town, drills were driven out of his mind by something else. As he sat in the usual morning traffic jam, he couldn't help noticing that there seemed to be a lot of strangely dressed people about. People in cloaks. Mr. Dursley couldn't bear people who dressed in funny clothes — the getups you saw on young people! He supposed this was some stupid new fashion. He drummed his fingers on the steering wheel and his eyes fell on a huddle of these weirdos standing quite close by. They were whispering excitedly together. Mr. Dursley was enraged to see that a couple of them weren't young at all; why, that man had to be older than he was, and wearing an emerald-green cloak! The nerve of him! But then it struck Mr. Dursley that this was probably some silly stunt — these people were obviously collecting for something ... yes, that would be it. The traffic moved on and a few minutes later, Mr. Dursley arrived in the Grunnings parking lot, his mind back on drills.Mr. Dursley always sat with his back to the window in his office on the ninth floor. If he hadn't, he might have found it harder to concentrate on drills that morning. He didn't see the owls swooping past in broad daylight, though people down in the street did; they pointed and gazed open-mouthed as owl after owl sped overhead. Most of them had never seen an owl even at nighttime. Mr. Dursley, however, had a perfectly normal, owl-free morning. He yelled at five different people. He made several important telephone"
]

test('test My Ghost Writer, desktop: navigate between the list/tables containing the stemming and the duplicated words', async ({ page }: { page: Page }) => {
  // 1. Connect to the local web server page
  await page.goto('http://localhost:8000/');
  // 2. Activate the required UI mode (e.g., switch to classic or advanced UI)
  await page.getByRole('button', { name: 'Set UI' }).click();

  // 3. Upload a saved JSON story file to provide long text content for analysis
  await uploadFileWithPageAndFilepath(page, testStoryJsonTxt)

  // 4. Activate "My Ghost Writer" / text stats functionality via settings
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('link', { name: 'Tokens' }).click();
  await page.waitForTimeout(100)
  await page.getByRole('button', { name: 'id-expand-wordsfreqstats' }).click();
  await page.getByRole('checkbox', { name: 'id-col2-words-frequency-enable' }).check();
  // Assert that the checkbox is checked (feature is enabled)
  await expect(page.getByRole('checkbox', { name: 'id-col2-words-frequency-enable' })).toBeChecked();

  await page.getByRole('button', { name: 'OK' }).click();
  await page.waitForTimeout(100)
  
  // 5. Interact with the text stats UI: filter, open value list, and verify word frequency tables
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).fill('th');
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).press('Enter');
  await page.waitForTimeout(100)

  await expect(page.getByLabel('id-filtered-value')).toContainText('th: 1701');
  let currentTitleTableOfWords = page.getByLabel('id-current-table-of-words-title')
  await expect(currentTitleTableOfWords).not.toContainText('the: 734');
  
  let listOfWordsList = page.getByLabel('id-list-of-words-container').locator('list')
  let listOfWordsListElNth0 = listOfWordsList.getByLabel(`id-list-of-words-${0}-nth`)
  await expect(listOfWordsListElNth0).toMatchAriaSnapshot("- text: \"the: 734 repetitions\"");
  await expect(listOfWordsListElNth0).toHaveAttribute("title", "stem: 'the'")
  
  // 6. Navigate between value list and tables, and assert correct UI updates and ARIA snapshots
  await page.getByText('the: 734').click();
  await page.waitForTimeout(100)
  
  await expect(currentTitleTableOfWords).toContainText('the : 734 ');
  await expect(currentTitleTableOfWords).toHaveAttribute("title", "stem: 'the'")

  // scroll #gametext to top to test that setCaret() still work correctly
  await scrollToTopById(page, "gametext")

  await scrollToBottomById(page, "id-current-table-of-words-scrollable");
  const gameEditor = page.locator("#gametext")

  const lastTableElement = page.getByLabel("id-table-0-row-733-nth-link")
  await lastTableElement.click()
  // only here assert screenshot to check for correct selection
  await expect(gameEditor).toHaveScreenshot()
  /**/

  await assertCellAndLinkAriaSnapshot(page, 'id-table-0-row-0-nth', "THE BOY WHO", "gametext", expectedStringArray[0]);
  await assertCellAndLinkAriaSnapshot(page, 'id-table-0-row-733-nth', "early the next", "gametext", expectedStringArray[1]);
  await assertCellAndLinkAriaSnapshot(page, 'id-table-0-row-1-nth', "They were the last", "gametext", expectedStringArray[2]);

  await page.getByText('the Dursleys:').click();
  await page.waitForTimeout(100)
  await expect(page.getByLabel('id-current-table-of-words-title')).toContainText('the Dursleys : 32 ');
  
  await page.getByLabel('id-list-of-words-11-nth').click();
  await page.waitForTimeout(100)
  
  await assertCellAndLinkAriaSnapshot(page, 'id-table-11-row-2-nth', "to be. The Dursleys shuddered", "gametext", expectedStringArray[3]);
  
  let col2wordsFreq = page.getByLabel('id-col2-words-frequency', { exact: true })
  await expect(col2wordsFreq).toMatchAriaSnapshot({ name: `test-classic-desktop-0--end-col2wordsFreq.txt` });
  console.log("end!")
  page.close()
});

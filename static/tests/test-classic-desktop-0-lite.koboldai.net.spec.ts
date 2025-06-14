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
  expectOnlyVisibleTextInElement,
  scrollToBottomById,
  scrollToTopById,
  uploadFileWithPageAndFilepath
} from './test-helper'

const testStoryJsonTxt = `${import.meta.dirname}/../../tests/events/very_long_text.json`
const expectedStringArray = [
  "THE BOY WHO LIVEDMr. and Mrs. Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal, thank you very much. They were the last people you'd expect to be involved in anything strange or mysterious, because they just didn't hold with such nonsense.Mr. Dursley was the director of a firm called Grunnings, which made drills. He was a big, beefy man with hardly any neck, although he did have a very large mustache. Mrs. Dursley was thin and blonde and had nearly twice the usual amount of neck, which came in very useful as she spent so much of her time craning over garden fences, spying on the neighbors. The Dursley s had a small son called Dudley and in their opinion there was no finer boy anywhere.The Dursleys had everything they wanted, but they also had a secret, and their greatest fear was that somebody would discover it. They didn't think they could bear it if anyone found out about the Potters. Mrs. Potter was Mrs. Dursley's sister, but they hadn'tmet for several years; in fact, Mrs. Dursley pretended she didn't have a sister, because her sister and her good-for-nothing husband were as unDursleyish as it was possible to be. The Dursleys shuddered to think what the neighbors would say if the Potters arrived in the street. The Dursleys knew that the Potters had a small son, too, but they had never even seen him.This boy was another good reason for keeping the Potters away; they didn't want Dudley mixing with a child like that.When Mr. and Mrs. Dursley woke up on the dull, gray Tuesday our story starts, there was nothing about the cloudy sky outside to suggest that strange and mysterious things would soon be happening all over the country. Mr. Dursley hummed as he picked out his most boring tie for work, and Mrs. Dursley gossiped away happily as she wrestled a screaming Dudley into his high chair.None of them noticed a large, tawny owl flutter past the window.At half past eight, Mr. Dursley picked up his briefcase, pecked Mrs. Dursley on the cheek, and tried to kiss Dudley good-bye but missed, because Dudley was now having a tantrum and throwing his cereal at the walls. \"Little tyke,\" chortled Mr. Dursley as he left the house. He got into his car and backed out of number four's drive.It was on the corner of the street that he noticed the first sign of something peculiar — a cat reading a map. For a second, Mr. Dursley didn't realize what he had seen — then he jerked his head around to look again. There was a tabby cat standing on the corner of Privet Drive, but there wasn't a map in sight. What could he have been thinking of? It must have been a trick of the light. Mr. Dursley blinked and stared atthe cat. It stared back. As Mr. Dursley drove around the corner and up the road, he watched the cat in his mirror. It was now reading the sign that said Privet Drive — no, looking at the sign; cats couldn't read maps or signs. Mr. Dursley gave himself a little shake and put the cat out of his mind. As he drove toward town he thought of nothing except a large order of drills he was hoping to get that day.But on the edge of town, drills were driven out of his mind by something else. As he sat in the usual morning traffic jam, he couldn't help noticing that there seemed to be a lot of strangely dressed people about. People in cloaks. Mr. Dursley couldn't bear people who dressed in funny clothes — the getups you saw on young people! He supposed this was some stupid new fashion. He drummed his fingers on the steering wheel and his eyes fell on a huddle of these weirdos standing quite close by. They were whispering excitedly together. Mr. Dursley was enraged to see that a couple of them weren't young at all; why, that man had to be older than he was, and wearing an emerald-green cloak! The nerve of him! But then it struck Mr. Dursley that this was probably some silly stunt — these people were obviously collecting for something ... yes, that would be it. The traffic moved on and a few minutes later, Mr. Dursley arrived in the Grunnings parking lot, his mind back on drills.",
  "\"I suppose so,\" said Mrs. Dursley stiffly.\"What's his name again? Howard, isn't it?\"\"Harry. Nasty, common name, if you ask me.\"\"Oh, yes,\" said Mr. Dursley, his heart sinking horribly. \"Yes, I quite agree.\"He didn't say another word on the subject as they went upstairs to bed. While Mrs. Dursley was in the bathroom, Mr. Dursley crept to the bedroom windowand peered down into the front garden. The cat was still there. It was staring down Privet Drive as though it were waiting for something.Was he imagining things? Could all this have anything to do with the Potters? If it did ... if it got out that they were related to a pair of — well, he didn't think he could bear it.The Dursleys got into bed. Mrs. Dursley fell asleep quickly but Mr. Dursley lay awake, turning it all over in his mind. His last, comforting thought before he fell asleep was that even if the Potters were involved, there was no reason for them to come near him and Mrs. Dursley. The Potters knew very well what he and Petunia thought about them and their kind. ... He couldn't see how he and Petunia could get mixed up in anything that might be going on — he yawned and turned over — it couldn't affect them. ...How very wrong he was.Mr. Dursley might have been drifting into an uneasy sleep, but the cat on the wall outside was showing no sign of sleepiness. It was sitting as still as a statue, its eyes fixed unblinkingly on the far corner of Privet Drive. It didn't so much as quiver when a car door slammed on the next street, nor when two owls swooped overhead. In fact, it was nearly midnight before the cat moved at all.A man appeared on the corner the cat had been watching, appeared so suddenly and silently you'd have thought he'd just popped out of the ground. The cat's tail twitched and its eyes narrowed.Nothing like this man had ever been seen on Privet Drive. He was tall, thin, and very old, judging by the silver of his hair and beard, which were both longenough to tuck into his belt. He was wearing long robes, a purple cloak that swept the ground, and high-heeled, buckled boots. His blue eyes were light, bright, and sparkling behind half-moon spectacles and his nose was very long and crooked, as though it had been broken at least twice. This man's name was Albus Dumbledore.Albus Dumbledore didn't seem to realize that he had just arrived in a street where everything from his name to his boots was unwelcome. He was busy rummaging in his cloak, looking for something. But he did seem to realize he was being watched, because he looked up suddenly at the cat, which was still staring at him from the other end of the street. For some reason, the sight of the cat seemed to amuse him. He chuckled and muttered, \"I should have known.\"He found what he was looking for in his inside pocket. It seemed to be a silver cigarette lighter. He flicked it open, held it up in the air, and clicked it. The nearest street lamp went out with a little pop. He clicked it again — the next lamp flickered into darkness. Twelve times he clicked the Put-Outer, until the only lights left on the whole street were two tiny pinpricks in the distance, which were the eyes of the cat watching him. If anyone looked out of their window now, even beady-eyed Mrs. Dursley, they wouldn't be able to see anything that was happening down on the pavement. Dumbledore slipped the Put- Outer back inside his cloak and set off down the street toward number four, where he sat down on the wall next to the cat. He didn't look at it, but after a moment he spoke to it.\"Fancy seeing you here, Professor McGonagall.\"He turned to smile at the tabby, but it had gone. Instead he was smiling at a rather severe-looking woman who was wearing square glasses exactly the shape of the markings the cat had had around its eyes. She, too, was wearing a cloak, an emerald one. Her black hair was drawn into a tight bun. She looked distinctly ruffled."
]

test('test My Ghost Writer, desktop: navigate between the list/tables containing the stemming and the duplicated words', async ({ page }: { page: Page }) => {
  // 1. Connect to the local web server page
  await page.goto('http://localhost:8000/');
  // 2. Activate the required UI mode (e.g., switch to classic or advanced UI)
  await page.getByRole('button', { name: 'Set UI' }).click();

  // 3. Upload a saved JSON story file to provide long text content for analysis
  await uploadFileWithPageAndFilepath(page, testStoryJsonTxt)
  // activate wordsearch
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('checkbox', { name: 'WordSearch Tool' }).check();
  await page.getByRole('button', { name: 'OK' }).click();

  await page.getByRole('searchbox', { name: 'Word Search Input' }).click();
  await page.getByRole('searchbox', { name: 'Word Search Input' }).press('Enter');
  await page.waitForTimeout(400)

  await expect(page.getByLabel('wordsearch_candidates_count')).toContainText('29306 result(s) found');
  const wordsearch_results = page.getByLabel("wordsearch_results")
  await expect(wordsearch_results).toMatchAriaSnapshot({ name: `test-classic-desktop-0-wordsearch_results-0.txt` });
  // scroll to bottom
  // await scrollToBottomById(page, "wordsearch_results");
  await expect(page.getByLabel('wordsearch_results')).not.toContainText('404 results');
  await page.getByLabel('id-div-candidate-1-nth').click();
  await page.waitForTimeout(200)
  await expect(page.getByLabel('wordsearch_results')).toContainText('404 results');
  await expect(wordsearch_results).toMatchAriaSnapshot({ name: `test-classic-desktop-0-wordsearch_results-1.txt` });

  await scrollToTopById(page, "gametext")
  await page.getByLabel('id-div-1-range-0-nth').click();
  await page.waitForTimeout(200)
  await expectOnlyVisibleTextInElement(page, "gametext", expectedStringArray[0])

  await scrollToTopById(page, "gametext")
  await page.getByLabel('id-div-1-range-403-nth').click();
  await page.waitForTimeout(200)
  await expectOnlyVisibleTextInElement(page, "gametext", expectedStringArray[1])
  
  await page.locator('#wordsearch_sort').selectOption('1');
  await expect(wordsearch_results).toMatchAriaSnapshot({ name: `test-classic-desktop-0-wordsearch_results-2.txt` });
  
  await page.locator('#wordsearch_sort').selectOption('0');
  await expect(wordsearch_results).toMatchAriaSnapshot({ name: `test-classic-desktop-0-wordsearch_results-3.txt` });

  await page.getByRole('button', { name: '🔎' }).click();
  await expect(page.getByLabel('wordsearch_candidates_count')).toContainText('29304 result(s) found');
  await expect(wordsearch_results).toMatchAriaSnapshot({ name: `test-classic-desktop-0-wordsearch_results-4.txt` });  

  console.log("end!")
  page.close()
});

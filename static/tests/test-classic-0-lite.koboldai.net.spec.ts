
import { test, expect, Page, TestInfo } from '@playwright/test';
import {
  expectVisibleTextWithWalker, fillInputFieldWithString, PrepareTestWithOpenRightPanelArg, 
  initTest,
  scrollToBottomById,
  scrollToTopById,
  ensureThesaurusPanelClosed,
  ensureThesaurusPanelOpen
} from './test-helper'

async function prepareTestWithOpenRightPanel(args:PrepareTestWithOpenRightPanelArg) {
    let {page, expectedFirstAriaSnapshot, projectName, state, idWordRange, idText, candidateMatch, countCandidates, wordRangeText} = args;
    if (state === "editable") {
      const toggleEditing = page.getByRole('checkbox', { name: 'Allow Editing' })
      await toggleEditing.click()
      await page.waitForTimeout(300)
      await expect(toggleEditing).toBeChecked()
      console.log("# editable...")
    }
    await ensureThesaurusPanelClosed(page);
    await scrollToBottomById(page, "gametext")

    await expect(page.getByLabel('wordsearch_results')).not.toMatchAriaSnapshot(expectedFirstAriaSnapshot);
    const candidateElement = page.getByLabel('id-div-candidate-0-nth')
    await expect(candidateElement).toMatchAriaSnapshot(`
      - link /id-a-candidate-\\d+-nth/:
        - /url: "#"
      `);
    await expect(candidateElement).toContainText(`${candidateMatch} (${countCandidates})`);    
    await candidateElement.click();
    await page.waitForTimeout(200)

    await expect(page.getByLabel(idWordRange)).toContainText(wordRangeText);
    
    await page.waitForTimeout(200)
    await page.getByRole('link', { name: 'id-0-range-0-nth' }).click();
    await ensureThesaurusPanelOpen(page)
    
    const synonymContainer = page.getByLabel('content-inflated-synonyms-container')
    await page.getByLabel('content-inflated-synonyms-container').click();
    await expect(synonymContainer).toMatchAriaSnapshot({ name: `test-classic-0-${idText}-wordsearch_results-0-${projectName}-${state}.txt` });
}

const testStoryJsonTxt = `${import.meta.dirname}/../../tests/events/very_long_text.json`
const expectedStringArray = [
  "Mr. Dursley was the director of a firm called Grunnings, which made drills. He was a big, beefy man with hardly any neck, although he did have a very large mustache.",
  `"Shouldn'ta lost me temper," he said ruefully, "but it didn't work anyway. Meant ter turn him into a pig, but I suppose he was so much like a pig anyway there wasn't much left ter do."`,
  `He brought the umbrella swishing down through the air to point at Dudley — there was a flash of violet light, a sound like a firecracker,`
]
const editState = [
  { state: "read-only", expectedFirstAriaSnapshot: `- text: /40\\d results/` },
  { state: "editable", expectedFirstAriaSnapshot: `- text: /40\\d results/` }
]

test('test My Ghost Writer/0: navigate between the list/tables containing the stemming; check for sentences sorrounding the clicked words/0', async ({ page }: { page: Page }, workerInfo: TestInfo) => {
  const projectName = await initTest({page, workerInfo, filepath:testStoryJsonTxt})
  await fillInputFieldWithString(page, '');
  await page.waitForTimeout(200)
  await ensureThesaurusPanelClosed(page);

  await expect(page.getByLabel('wordsearch_candidates_count')).toMatchAriaSnapshot(`- text: /2\\d\\d\\d\\d result\\(s\\) found/`);
  const wordsearch_results = page.getByLabel("wordsearch_results")
  await expect(wordsearch_results).toMatchAriaSnapshot({ name: `test-classic-0-0-wordsearch_results-0-${projectName}.txt` });

  await expect(page.getByLabel('wordsearch_results')).not.toMatchAriaSnapshot(`- text: /40\\d results/`);
  await page.getByLabel('id-div-candidate-1-nth').click();
  await page.waitForTimeout(200)
  await expect(page.getByLabel('wordsearch_results')).toMatchAriaSnapshot(`- text: /40\\d results/`);
  await expect(wordsearch_results).toMatchAriaSnapshot({ name: `test-classic-0-0-wordsearch_results-1-${projectName}.txt` });

  console.log("end!")
  await page.close()
})

test('test My Ghost Writer/1: READ-ONLY navigation, 1 click, assert thesaurus right panel opens; check for sentences sorrounding the clicked words', async ({ page }: { page: Page }, workerInfo: TestInfo) => {
  const projectName = await initTest({page, workerInfo, filepath:testStoryJsonTxt})
    await fillInputFieldWithString(page, 'look');
    await page.waitForTimeout(200)
    const state = "read-only"
    const expectedFirstAriaSnapshot = editState[0].expectedFirstAriaSnapshot
    console.log(state, expectedFirstAriaSnapshot)
    // Ensure the right panel is closed before toggling editing
    const idWordRange = 'id-div-0-range-0-nth'
    const idText = 1
    const candidateMatch = "look"
    const countCandidates = 79
    const wordRangeText = 'around to look again. There'
    await prepareTestWithOpenRightPanel({page, expectedFirstAriaSnapshot, projectName, state, idWordRange, idText, candidateMatch, countCandidates, wordRangeText})

    await expect(page.getByRole('searchbox', { name: 'synonym mod Input' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'thesaurus-synonym-mod-confirm' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'synonym-button-0-0-0' })).toBeDisabled();
    await page.getByRole('button', { name: 'id-rightpanel-thesaurus-close' }).click();
    await page.waitForTimeout(200)
    await ensureThesaurusPanelClosed(page);
    console.log("###############")
    console.log(`clicked on id ${idWordRange}, check for the expected string within #gametext...`)

    await expectVisibleTextWithWalker(page, "gametext", `It was on the corner of the street that he noticed the first sign of something peculiar — a cat reading a map. For a second, Mr. Dursley didn't realize what he had seen — then he jerked his head around to look again. There was a tabby cat standing on the corner of Privet Drive, but there wasn't a map in sight. What could he have been thinking of? It must have been a trick of the light. Mr. Dursley blinked and stared at`)
    console.log(`${projectName}, state ${state} done.`)
  
  console.log("end!")
  await page.close()
})

test('test My Ghost Writer/2: EDITABLE, like READ-ONLY plus single synonym substitution', async ({ page }: { page: Page }, workerInfo: TestInfo) => {
    const projectName = await initTest({page, workerInfo, filepath:testStoryJsonTxt})
    await fillInputFieldWithString(page, 'look');
    await page.waitForTimeout(200)
    const state = "editable"
    const expectedFirstAriaSnapshot = editState[1].expectedFirstAriaSnapshot
    console.log(state, expectedFirstAriaSnapshot)
    // Ensure the right panel is closed before toggling editing
    const idWordRange = 'id-div-0-range-0-nth'
    const idText = 2
    const candidateMatch = "look"
    const countCandidates = 79
    const wordRangeText = 'around to look again. There'
    await prepareTestWithOpenRightPanel({page, expectedFirstAriaSnapshot, projectName, state, idWordRange, idText, candidateMatch, countCandidates, wordRangeText})

    await expect(page.getByRole('searchbox', { name: 'synonym mod Input' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'thesaurus-synonym-mod-confirm' })).toBeEnabled();
    const synonymButton000 = page.getByRole('button', { name: 'synonym-button-0-0-0' })
    await expect(synonymButton000).toBeEnabled();
    await synonymButton000.click();
    await page.waitForTimeout(200)
    await expect(synonymButton000).toHaveClass("inflated-synonym-option synonym-selected")
    await page.getByRole('button', { name: 'thesaurus-synonym-mod-confirm' }).click();
    await page.waitForTimeout(200)

    await ensureThesaurusPanelClosed(page);
    console.log("###############")
    console.log(`clicked on id ${idWordRange}, check for the expected string within #gametext...`)

    await expectVisibleTextWithWalker(page, "gametext", `It was on the corner of the street that he noticed the first sign of something peculiar — a cat reading a map. For a second, Mr. Dursley didn't realize what he had seen — then he jerked his head around to appear again. There was a tabby cat standing on the corner of Privet Drive, but there wasn't a map in sight. What could he have been thinking of? It must have been a trick of the light. Mr. Dursley blinked and stared at`)
    console.log(`${projectName}, state ${state} done.`)
  
  console.log("end!")
  await page.close()
})

test('test My Ghost Writer/3: EDITABLE, like READ-ONLY plus multi-word synonym substitution, multiple times', async ({ page }: { page: Page }, workerInfo: TestInfo) => {
  const projectName = await initTest({page, workerInfo, filepath:testStoryJsonTxt})
    await fillInputFieldWithString(page, 'rather severe-looking woman');
    await page.waitForTimeout(200)
    const state = "editable"
    const expectedFirstAriaSnapshot = editState[1].expectedFirstAriaSnapshot
    console.log(state, expectedFirstAriaSnapshot)
    // Ensure the right panel is closed before toggling editing
    const idWordRange = 'id-div-0-range-0-nth'
    const idText = 3
    const candidateMatch = "rather severe-looking woman"
    const countCandidates = 1
    const wordRangeText = " smiling at a rather severe-looking woman who was"
    await prepareTestWithOpenRightPanel({page, expectedFirstAriaSnapshot, projectName, state, idWordRange, idText, candidateMatch, countCandidates, wordRangeText})

    await page.waitForTimeout(200)

    await ensureThesaurusPanelOpen(page)
    await expect(page.getByRole('searchbox', { name: 'synonym mod Input' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'thesaurus-synonym-mod-confirm' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'synonym-button-0-0-0' })).toBeEnabled();
    
    await page.getByRole('button', { name: 'synonym-button-0-0-0' }).click();
    await page.getByRole('button', { name: 'thesaurus-synonym-mod-confirm' }).click();
    await expect(page.getByLabel('wordsearch_candidates_count')).toContainText('0 result(s) found');
    await page.waitForTimeout(200)

    await ensureThesaurusPanelClosed(page);
    await fillInputFieldWithString(page, 'rather severe-appearing woman');

    await page.getByRole('link', { name: 'id-a-candidate-0-nth' }).click();
    await page.getByRole('link', { name: 'id-0-range-0-nth' }).click();
    await page.waitForTimeout(200)
    
    await ensureThesaurusPanelOpen(page)
    await page.getByRole('button', { name: 'synonym-button-0-0-1' }).click();
    await page.getByRole('button', { name: 'synonym-button-1-1-0' }).click();
    await page.getByRole('button', { name: 'thesaurus-synonym-mod-confirm' }).click();
    
    await expect(page.getByLabel('wordsearch_candidates_count')).toContainText('0 result(s) found');
    await fillInputFieldWithString(page, 'rather severe-seeming char ');
    await expect(page.getByLabel('wordsearch_candidates_count')).toContainText('1 result(s) found');
    await page.waitForTimeout(200)

    await page.getByRole('link', { name: 'id-a-candidate-0-nth' }).click();
    await page.getByRole('link', { name: 'id-0-range-0-nth' }).click();
    await page.getByRole('button', { name: 'synonym-button-0-0-0' }).click();
    await page.getByRole('button', { name: 'thesaurus-synonym-mod-confirm' }).click();
    await page.waitForTimeout(200)

    await page.getByRole('button', { name: 'id-perform-wordsearch' }).click();
    await fillInputFieldWithString(page, 'rather severe-seeming charwoman');
    await expect(page.getByLabel('wordsearch_candidates_count')).toContainText('1 result(s) found');

    await ensureThesaurusPanelClosed(page);
    await page.waitForTimeout(200)

    await ensureThesaurusPanelClosed(page);
    console.log(`${projectName}, state ${state} done.`)
  
  console.log("end!")
  await page.close()
})

test('test My Ghost Writer/4: navigate between the list/tables containing the stemming; check for sentences sorrounding the clicked words', async ({ page }: { page: Page }, workerInfo: TestInfo) => {
  const projectName = await initTest({page, workerInfo, filepath:testStoryJsonTxt})
  await fillInputFieldWithString(page, 'look');
  await page.waitForTimeout(200)
  await expect(page.getByLabel('wordsearch_results')).not.toMatchAriaSnapshot(`- text: /40\\d results/`);

  await ensureThesaurusPanelClosed(page);

  await page.getByLabel('id-div-candidate-1-nth').click();
  await page.waitForTimeout(200)

  await scrollToTopById(page, "gametext")
  await scrollToBottomById(page, "wordsearch_results")
  await page.waitForTimeout(100)
  const id1 = 'id-div-1-range-14-nth'
  const clickedElement = page.getByLabel(id1)
  await expect(clickedElement).not.toHaveClass("background-border-clicked")
  await expect(clickedElement).toMatchAriaSnapshot({ name: `test-classic-0-4-wordsearch_results-0-${projectName}.txt` });
  await clickedElement.click();
  await page.waitForTimeout(200)

  await expect(page.getByRole('searchbox', { name: 'synonym mod Input' })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'synonym mod Input' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'thesaurus-synonym-mod-confirm' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'thesaurus-synonym-mod-confirm' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'synonym-button-0-0-0' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'synonym-button-0-0-0' })).toBeDisabled();
  await page.getByRole('button', { name: 'id-rightpanel-thesaurus-close' }).click();
  console.log("###############")
  // await expect(clickedElement).toHaveClass("background-border-clicked")
  const idx = projectName.toLocaleLowerCase().includes("landscape") || projectName.toLocaleLowerCase().includes("mobile") ? 2 : 1
  console.log(`clicked on id ${id1}, check for the expected string with idx:${idx}: '${expectedStringArray[idx]}'...`)
  await expectVisibleTextWithWalker(page, "gametext", expectedStringArray[idx])
  await page.waitForTimeout(100)
  console.log("gametext size:", await page.locator("#gametext").boundingBox(), "@#")
  await expect(page.locator("#gametext")).toHaveScreenshot({maxDiffPixelRatio: 0.05})
  
  console.log("end!")
  await page.close()
})

test('test My Ghost Writer/5: sort by frequency and alphabetically', async ({ page }: { page: Page }, workerInfo: TestInfo) => {
  const projectName = await initTest({page, workerInfo, filepath:testStoryJsonTxt})
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('spinbutton', { name: 'wordsearch_n_max_words_duplicated' }).fill('2');
  await page.getByRole('button', { name: 'OK' }).click();
  await fillInputFieldWithString(page, '');
  await page.waitForTimeout(200)

  const wordsearch_results = page.getByLabel("wordsearch_results")

  await page.locator('#wordsearch_sort').selectOption('1');
  await page.getByRole('button', { name: 'id-perform-wordsearch' }).click();
  await expect(wordsearch_results).toMatchAriaSnapshot({ name: `test-classic-0-5-wordsearch_results-0-${projectName}.txt` });

  await page.locator('#wordsearch_sort').selectOption('0');
  await page.getByRole('button', { name: 'id-perform-wordsearch' }).click();
  await expect(page.getByLabel('wordsearch_candidates_count')).toMatchAriaSnapshot(`- text: /12\\d\\d\\d result\\(s\\) found/`);
  await expect(wordsearch_results).toMatchAriaSnapshot({ name: `test-classic-0-5-wordsearch_results-1-${projectName}.txt` });

  console.log("end!")
  await page.close()
});

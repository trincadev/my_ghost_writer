import { test, expect, Page, TestInfo } from '@playwright/test';
import {
  expectVisibleTextWithWalker, fillInputFieldWithString,
  initTest,
  scrollToBottomById,
  scrollToTopById,
} from './test-helper'

const testStoryJsonTxt = `${import.meta.dirname}/../../tests/events/very_long_text.json`
const expectedStringArray = [
  "Mr. Dursley was the director of a firm called Grunnings, which made drills. He was a big, beefy man with hardly any neck, although he did have a very large mustache.",
  `"Shouldn'ta lost me temper," he said ruefully, "but it didn't work anyway. Meant ter turn him into a pig, but I suppose he was so much like a pig anyway there wasn't much left ter do."`
]
const editState = [
  { state: "read-only", expectedFirstAriaSnapshot: `- text: /40\\d results/` },
  { state: "editable", expectedFirstAriaSnapshot: `- text: /40\\d results/` }
]

test('test My Ghost Writer: navigate between the list/tables containing the stemming; check for sentences sorrounding the clicked words/0', async ({ page }: { page: Page }, workerInfo: TestInfo) => {
  const projectName = await initTest({page, workerInfo, filepath:testStoryJsonTxt})
  await fillInputFieldWithString(page, '');
  await page.waitForTimeout(200)

  await expect(page.getByLabel('wordsearch_candidates_count')).toMatchAriaSnapshot(`- text: /2\\d\\d\\d\\d result\\(s\\) found/`);
  const wordsearch_results = page.getByLabel("wordsearch_results")
  await expect(wordsearch_results).toMatchAriaSnapshot({ name: `test-classic-0-wordsearch_results-0-${projectName}.txt` });

  await expect(page.getByLabel('wordsearch_results')).not.toMatchAriaSnapshot(`- text: /40\\d results/`);
  await page.getByLabel('id-div-candidate-1-nth').click();
  await page.waitForTimeout(200)
  await expect(page.getByLabel('wordsearch_results')).toMatchAriaSnapshot(`- text: /40\\d results/`);
  await expect(wordsearch_results).toMatchAriaSnapshot({ name: `test-classic-0-wordsearch_results-1-${projectName}.txt` });

  console.log("end!")
  await page.close()
})

test('test My Ghost Writer: navigate between the list/tables containing the stemming; check for sentences sorrounding the clicked words/1', async ({ page }: { page: Page }, workerInfo: TestInfo) => {
  const projectName = await initTest({page, workerInfo, filepath:testStoryJsonTxt})
  await fillInputFieldWithString(page, '');
  await page.waitForTimeout(200)
  for (let { state, expectedFirstAriaSnapshot } of Object.values(editState)) {
    console.log(state, expectedFirstAriaSnapshot)
    if (state === "editable") {
      const toggleEditing = page.getByRole('checkbox', { name: 'Allow Editing' })
      await toggleEditing.click()
      await page.waitForTimeout(300)
      await expect(toggleEditing).toBeChecked()
    }

    await expect(page.getByLabel('wordsearch_results')).not.toMatchAriaSnapshot(expectedFirstAriaSnapshot);
    await page.getByLabel('id-div-candidate-1-nth').click();
    await page.waitForTimeout(200)
    await expect(page.getByLabel('wordsearch_results')).toMatchAriaSnapshot(expectedFirstAriaSnapshot);
    ///
    await scrollToBottomById(page, "gametext")
    await scrollToTopById(page, "wordsearch_results")
    const id0 = 'id-div-1-range-0-nth'
    let clickedElement = page.getByLabel(id0)
    await expect(clickedElement).toMatchAriaSnapshot({ name: `test-classic-0-wordsearch_results-2-${projectName}-${state}.txt` });
    await expect(clickedElement).not.toHaveClass("background-border-clicked")
    await clickedElement.click();
    await page.waitForTimeout(200)
    await expect(clickedElement).toHaveClass("background-border-clicked")
    console.log(`clicked on id ${id0}, check for the expected string...`)
    await expectVisibleTextWithWalker(page, "gametext", expectedStringArray[0])
    console.log(`${projectName}, state ${state} done.`)
  }
  console.log("end!")
  await page.close()
})


test('test My Ghost Writer: navigate between the list/tables containing the stemming; check for sentences sorrounding the clicked words/2', async ({ page }: { page: Page }, workerInfo: TestInfo) => {
  const projectName = await initTest({page, workerInfo, filepath:testStoryJsonTxt})
  await fillInputFieldWithString(page, '');
  await page.waitForTimeout(200)
  await expect(page.getByLabel('wordsearch_results')).not.toMatchAriaSnapshot(`- text: /40\\d results/`);
  await page.getByLabel('id-div-candidate-1-nth').click();
  await page.waitForTimeout(200)

  await scrollToTopById(page, "gametext")
  await scrollToBottomById(page, "wordsearch_results")
  await page.waitForTimeout(100)
  const id1 = 'id-div-1-range-398-nth'
  const clickedElement = page.getByLabel(id1)
  await expect(clickedElement).not.toHaveClass("background-border-clicked")
  await expect(clickedElement).toMatchAriaSnapshot({ name: `test-classic-0-wordsearch_results-3-${projectName}.txt` });
  await clickedElement.click();
  await page.waitForTimeout(200)
  await expect(clickedElement).toHaveClass("background-border-clicked")
  console.log(`clicked on id ${id1}, check for the expected string...`)
  await expectVisibleTextWithWalker(page, "gametext", expectedStringArray[1])
  await expect(page.locator("#gametext")).toHaveScreenshot()
})

test('test My Ghost Writer: sort by frequency and alphabetically', async ({ page }: { page: Page }, workerInfo: TestInfo) => {
  const projectName = await initTest({page, workerInfo, filepath:testStoryJsonTxt})
  await fillInputFieldWithString(page, '');
  await page.waitForTimeout(200)

  const wordsearch_results = page.getByLabel("wordsearch_results")

  await page.locator('#wordsearch_sort').selectOption('1');
  await page.getByRole('button', { name: 'id-perform-wordsearch' }).click();
  await expect(wordsearch_results).toMatchAriaSnapshot({ name: `test-classic-0-wordsearch_results-4-${projectName}.txt` });

  await page.locator('#wordsearch_sort').selectOption('0');
  await page.getByRole('button', { name: 'id-perform-wordsearch' }).click();
  await expect(page.getByLabel('wordsearch_candidates_count')).toMatchAriaSnapshot(`- text: /2\\d\\d\\d\\d result\\(s\\) found/`);
  await expect(wordsearch_results).toMatchAriaSnapshot({ name: `test-classic-0-wordsearch_results-5-${projectName}.txt` });

  console.log("end!")
  await page.close()
});

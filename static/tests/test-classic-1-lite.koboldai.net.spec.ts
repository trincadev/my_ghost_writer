/**
 * Playwright E2E test for My Ghost Writer "Text Stats" feature.
 *
 * Test scenario:
 * 1. Connect to the local web server (http://localhost:8000).
 * 2. Activate the UI mode required for testing (e.g., "Set UI").
 * 3. Upload a saved JSON story file to populate the editor with long text content.
 * 4. Activate the "My Ghost Writer" / text stats functionality.
 * 5. Interact with the text stats UI: filter, sort, and verify word frequency tables.
 * 6. Assert correct UI updates and ARIA snapshots for accessibility.
 */
import { test, expect, Page } from '@playwright/test';
import {
  assertVisibleTextAfterNavigation,
  fillInputFieldWithString, initTest
} from './test-helper';

const expectedAriaSnapshotOnly10moreOrLess = `- text: /\\d result\\(s\\) found/`
const testStoryJsonTxt = `${import.meta.dirname}/../../tests/events/short_text_markdown.json`
const expectedStringArray = [
  'Pack my box with five dozen liquor jugs - sphinx of black quartz, judge my vow (title)',
  "Like my mother-in-law's B2B.",
  "Mrs. Dursley was thin and blonde and had nearly twice the usual amount of neck, which came in very useful as she spent so much of her time craning over garden fences, spying on the neighbors. The Dursley s had a small son called Dudley and in their opinion there was no finer boy anywhere.",

  "Øyvind’s café-restaurant served 12 exquisite dishes, blending flavors from à la carte menus",
  "Like my mother-in-law's B2B.",
  "Like my mother-in-law's B2B.",
  
  "Combined emphasis’s text with **asterisks and _underscores_**.",
  "Pack my box with five dozen liquor jugs - sphinx of black quartz, judge my vow (no title)",
  "Pack my box with five dozen liquor jugs - sphinx of black quartz, judge my vow! (bold)",
  
  "Pack my box with five dozen liquor jugs - sphinx of black quartz, judge my vow (table code)!",
  "Pack my box with five dozen liquor jugs - sphinx of black quartz, judge my vow (table, no code)!",
  "Pack my box with five dozen liquor bottles for the first time (second list, nested)!"
]

// test(`test My Ghost Writer: assert that's still working the switch edit mode and search for multi words, with apostrophes, hyphens, digits, diacritics, within complex/nested html elements. NO match for queries with new lines`, async ({ page }: { page: Page }, workerInfo) => {
test(`test My Ghost Writer: first assertions`, async ({ page }: { page: Page }, workerInfo) => {
  const projectName = await initTest(page, workerInfo, testStoryJsonTxt)

  await page.getByRole('button', {name: 'id-perform-wordsearch'}).click();
  await page.waitForTimeout(200)

  await expect(page.getByLabel('wordsearch_candidates_count')).toMatchAriaSnapshot(`- text: /1\\d\\d\\d result\\(s\\) found/`);
  await expect(page.getByLabel('id-div-candidate-1-nth')).toMatchAriaSnapshot({name: `test-classic-1-wordsearch_results-0-${projectName}.txt`});
  const wordsearch_results = page.getByLabel("wordsearch_results")
  await expect(wordsearch_results).toMatchAriaSnapshot({name: `test-classic-1-wordsearch_results-1-${projectName}.txt`});
  await page.waitForTimeout(200)

  await page.getByLabel('id-div-candidate-1-nth').click();
  await assertVisibleTextAfterNavigation(page, 'id-div-1-range-1-nth', expectedStringArray[0], "bottom", "gametext");
  await page.waitForTimeout(200)

  await assertVisibleTextAfterNavigation(page, 'id-div-1-range-23-nth', expectedStringArray[1], "top", "gametext");

  console.log("end!")
  await page.close()
})

test(`test My Ghost Writer: search for multi words, with apostrophes, hyphens, digits, diacritics, within complex/nested html elements. NO match for queries with new lines`, async ({ page }: { page: Page }, workerInfo) => {
  const projectName = await initTest(page, workerInfo, testStoryJsonTxt)

  await page.getByRole('button', {name: 'id-perform-wordsearch'}).click();
  const wordsearch_results = page.getByLabel("wordsearch_results")

  console.log("# pre filling 'the du'")
  await fillInputFieldWithString(page, `the du`);
  await page.waitForTimeout(200)

  await expect(page.getByLabel('wordsearch_candidates_count')).toMatchAriaSnapshot(expectedAriaSnapshotOnly10moreOrLess);
  await expect(page.getByLabel('id-div-candidate-1-nth')).toMatchAriaSnapshot({name: `test-classic-1-wordsearch_results-2-${projectName}.txt`});
  await expect(wordsearch_results).toMatchAriaSnapshot({name: `test-classic-1-wordsearch_results-3-${projectName}.txt`});

  await page.getByLabel('id-div-candidate-1-nth').click();
  await page.waitForTimeout(200)
  await assertVisibleTextAfterNavigation(page, 'id-div-1-range-0-nth', expectedStringArray[2], "bottom", "gametext");

  // needed to assert correct text selection, we have faith only one screenshot is enough =)
  await expect(page.locator("#gametext")).toHaveScreenshot()
  await page.waitForTimeout(200)
  console.log("end!")
  await page.close()
})

test(`test My Ghost Writer: search for words with apostrophes, hyphens, digits, diacritics`, async ({ page }: { page: Page }, workerInfo) => {
  const projectName = await initTest(page, workerInfo, testStoryJsonTxt)
  await fillInputFieldWithString(page, `Øyvind`);
  await page.waitForTimeout(200)

  await expect(page.getByLabel('wordsearch_candidates_count')).toMatchAriaSnapshot(expectedAriaSnapshotOnly10moreOrLess);
  await expect(page.getByLabel('id-div-candidate-1-nth')).toMatchAriaSnapshot({name: `test-classic-1-wordsearch_results-4-${projectName}.txt`});

  await page.getByRole('link', {name: 'id-a-candidate-1-nth'}).click();
  await assertVisibleTextAfterNavigation(page, 'id-div-1-range-0-nth', expectedStringArray[3], "top", "gametext");
  console.log(`# pre-filling "my mother-in-law's"`)
  await page.waitForTimeout(200)

  await fillInputFieldWithString(page, `my mother-in-law's`);
  await expect(page.getByLabel('wordsearch_candidates_count')).toMatchAriaSnapshot(expectedAriaSnapshotOnly10moreOrLess);
  await page.waitForTimeout(200)
  await page.getByLabel('id-div-candidate-1-nth').click();
  await page.waitForTimeout(200)
  await expect(page.getByLabel('id-div-1-range-0-nth')).toMatchAriaSnapshot({name: `test-classic-1-wordsearch_results-5-${projectName}.txt`});
  await assertVisibleTextAfterNavigation(page, 'id-div-1-range-0-nth', expectedStringArray[4], "top", "gametext");
})

test(`test My Ghost Writer: search for words with apostrophes, digits, within complex/nested html elements. NO match for queries with new lines`, async ({ page }: { page: Page }, workerInfo) => {
  const projectName = await initTest(page, workerInfo, testStoryJsonTxt)

  await fillInputFieldWithString(page, 'B2B');
  await page.waitForTimeout(200)
  await expect(page.getByLabel('wordsearch_candidates_count')).toMatchAriaSnapshot(expectedAriaSnapshotOnly10moreOrLess);

  await page.waitForTimeout(200)
  await expect(page.getByLabel('id-div-candidate-2-nth')).toMatchAriaSnapshot({name: `test-classic-1-wordsearch_results-6-${projectName}.txt`});
  await page.waitForTimeout(200)
  await page.getByLabel('id-div-candidate-2-nth').click();
  await assertVisibleTextAfterNavigation(page, 'id-div-2-range-0-nth', expectedStringArray[5], "top", "gametext");

  // TODO: find a way to avoid matching html element text like buttons (find in markdown-generated CODE snippet)
  await fillInputFieldWithString(page, 'emphasis’s text');

  await page.getByLabel('id-div-candidate-0-nth').click();
  await assertVisibleTextAfterNavigation(page, 'id-div-0-range-0-nth', expectedStringArray[6], "top", "gametext");

  await fillInputFieldWithString(page, '', "click");
  await page.waitForTimeout(200)
  // 1000+ results
  await expect(page.getByLabel('wordsearch_candidates_count')).toMatchAriaSnapshot(`- text: /1\\d\\d\\d result\\(s\\) found/`);

  await fillInputFieldWithString(page, 'pack my box');
  await page.getByLabel('id-div-candidate-0-nth').click();
  await assertVisibleTextAfterNavigation(page, 'id-div-0-range-1-nth', expectedStringArray[7], "bottom", "gametext");
  await assertVisibleTextAfterNavigation(page, 'id-div-0-range-2-nth', expectedStringArray[8], "bottom", "gametext");
  await assertVisibleTextAfterNavigation(page, 'id-div-0-range-8-nth', expectedStringArray[9], "top", "gametext");
  await assertVisibleTextAfterNavigation(page, 'id-div-0-range-9-nth', expectedStringArray[10], "top", "gametext");
  // at the moment this assertion always fails on MobileSafariLandscape ('iPhone 13 Pro Max landscape')
  // re-check it in the future, especially when safari mobile will support a fullscreen mode
  if (projectName !== "MobileSafariLandscape") {
    await assertVisibleTextAfterNavigation(page, 'id-div-0-range-6-nth', expectedStringArray[11], "top", "gametext");
  }

  // assert for queries spanning over new lines: will found nothing, assert 0 results found!
  await fillInputFieldWithString(page, 'details. Þórir');
  await expect(page.getByLabel('wordsearch_results')).toMatchAriaSnapshot(`- text: 0 result(s) found`);
  await page.close()
});
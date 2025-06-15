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
  expectVisibleTextWithWalker,
  scrollToBottomById,
  scrollToTopById,
  uploadFileWithPageAndFilepath
} from './test-helper'

const testStoryJsonTxt = `${import.meta.dirname}/../../tests/events/very_long_text.json`
const expectedStringArray = [
  "Mr. Dursley was the director of a firm called Grunnings, which made drills. He was a big, beefy man with hardly any neck, although he did have a very large mustache. Mrs. Dursley was thin and blonde and had nearly twice the usual amount of neck, which came in very useful as she spent so much of her time craning over garden fences, spying on the neighbors. The Dursley s had a small son called Dudley and in their opinion there was no finer boy anywhere.",
  `"Shouldn'ta lost me temper," he said ruefully, "but it didn't work anyway. Meant ter turn him into a pig, but I suppose he was so much like a pig anyway there wasn't much left ter do."`
]

test('test My Ghost Writer, desktop: navigate between the list/tables containing the stemming and the duplicated words, sorting results at the end', async ({ page }: { page: Page }) => {
  // 1. Connect to the local web server page
  await page.goto('http://localhost:8000/');
  // 2. Activate the required UI mode (e.g., switch to classic or advanced UI)
  await page.getByRole('button', { name: 'Set UI' }).click();

  // 3. Upload a saved JSON story file to provide long text content for analysis
  await uploadFileWithPageAndFilepath(page, testStoryJsonTxt)
  // activate wordsearch
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('checkbox', { name: 'wordsearch_toggle' }).check();
  await page.getByRole('button', { name: 'OK' }).click();

  await page.getByRole('searchbox', { name: 'Word Search Input' }).click();
  await page.getByRole('searchbox', { name: 'Word Search Input' }).press('Enter');
  await page.waitForTimeout(200)

  await expect(page.getByLabel('wordsearch_candidates_count')).toMatchAriaSnapshot(`- text: /\\d+ result\\(s\\) found/`);
  const wordsearch_results = page.getByLabel("wordsearch_results")
  await expect(wordsearch_results).toMatchAriaSnapshot({ name: `test-classic-desktop-0-wordsearch_results-0.txt` });

  await expect(page.getByLabel('wordsearch_results')).not.toContainText('404 results');
  await page.getByLabel('id-div-candidate-1-nth').click();
  await page.waitForTimeout(200)
  await expect(page.getByLabel('wordsearch_results')).toContainText('404 results');
  await expect(wordsearch_results).toMatchAriaSnapshot({ name: `test-classic-desktop-0-wordsearch_results-1.txt` });

  await scrollToBottomById(page, "gametext")
  await scrollToTopById(page, "wordsearch_results")
  const id0 = 'id-div-1-range-0-nth'
  let clickedElement = page.getByLabel(id0)
  await expect(clickedElement).toMatchAriaSnapshot(`
    - link "id-1-range-0-nth":
      - /url: "#"
      - text: drills. He was a big,
    `);
  await expect(clickedElement).not.toHaveClass("background-border-clicked")
  await clickedElement.click();
  await page.waitForTimeout(200)
  await expect(clickedElement).toHaveClass("background-border-clicked")
  console.log(`clicked on id ${id0}, check for the expected string...`)
  await expectVisibleTextWithWalker(page, "gametext", expectedStringArray[0])

  await scrollToTopById(page, "gametext")
  await scrollToBottomById(page, "wordsearch_results")
  await page.waitForTimeout(100)
  const id1 = 'id-div-1-range-398-nth'
  clickedElement = page.getByLabel(id1)
  await expect(clickedElement).not.toHaveClass("background-border-clicked")
  await expect(clickedElement).toMatchAriaSnapshot(`
    - link "id-1-range-398-nth":
      - /url: "#"
      - text: suppose he was so much
    `);
  await clickedElement.click();
  await page.waitForTimeout(200)
  await expect(clickedElement).toHaveClass("background-border-clicked")
  console.log(`clicked on id ${id1}, check for the expected string...`)
  await expectVisibleTextWithWalker(page, "gametext", expectedStringArray[1])
  await expect(page.locator("#gametext")).toHaveScreenshot()

  await page.locator('#wordsearch_sort').selectOption('1');
  await expect(wordsearch_results).toMatchAriaSnapshot({ name: `test-classic-desktop-0-wordsearch_results-2.txt` });
  
  await page.locator('#wordsearch_sort').selectOption('0');
  await expect(wordsearch_results).toMatchAriaSnapshot({ name: `test-classic-desktop-0-wordsearch_results-3.txt` });

  await page.getByRole('button', { name: '🔎' }).click();
  await expect(page.getByLabel('wordsearch_candidates_count')).toMatchAriaSnapshot(`- text: /\\d+ result\\(s\\) found/`);
  await expect(wordsearch_results).toMatchAriaSnapshot({ name: `test-classic-desktop-0-wordsearch_results-4.txt` });  

  console.log("end!")
  await page.close()
});

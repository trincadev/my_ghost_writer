import { test, expect, Page, TestInfo, chromium, devices } from '@playwright/test';
import { ensureThesaurusPanelClosed, ensureThesaurusPanelOpen, initTest } from './test-helper';

const testStoryJsonTxt = `${import.meta.dirname}/../../tests/events/very_long_text.json`

test(`test My Ghost Writer: assert no wrong DOM dynamic construction within the div "wordsearch_results"
  by trigger_wordsearch_candidates() after click on div elements created by trigger_wordsearch_results(),
  both in read-only and editable mode. No query`, async ({ page }: { page: Page }, workerInfo: TestInfo) => {

  test.slow()
  const projectName = await initTest({ page, workerInfo, filepath: testStoryJsonTxt })

  for (let idx = 0; idx < 2; idx++) {
    if (idx > 0) {
      await page.getByRole('checkbox', { name: 'Allow Editing' }).check();
      await page.waitForTimeout(100)
      await expect(page.getByRole('checkbox', { name: 'Allow Editing' })).toBeChecked()
      await page.getByRole('searchbox', { name: 'Word Search Input' }).click();
      await page.getByRole('searchbox', { name: 'Word Search Input' }).fill('');
      await page.getByRole('searchbox', { name: 'Word Search Input' }).press('Enter');
      await page.waitForTimeout(100)
      console.log(`projectName:${projectName}:toggled editable mode.`)
    }
    await page.waitForTimeout(100)
    for (let step = 0; step < 2; step++) {
      console.log(`projectName:${projectName}:first loop:${idx},${step}, no query...`);
      await page.getByRole('searchbox', { name: 'Word Search Input' }).click();
      await page.getByRole('searchbox', { name: 'Word Search Input' }).press('Enter');
      await page.waitForTimeout(100)
      await expect(page.getByLabel('wordsearch_candidates_count')).toMatchAriaSnapshot(`- text: 25942 result(s) found`);
      await page.waitForTimeout(100)
      await page.locator('#wordsearch_results div').first().click();
      await page.waitForTimeout(100)
      await ensureThesaurusPanelClosed(page);
      await page.getByLabel('id-div-0-range-0-nth').click();
      await ensureThesaurusPanelOpen(page);

      await page.getByRole('button', { name: 'id-rightpanel-thesaurus-close' }).click();
      await page.waitForTimeout(100)
      await ensureThesaurusPanelClosed(page);

      await page.getByLabel('id-div-candidate-10-nth').click();
      await page.waitForTimeout(100)
      const idDiv0range1 = page.getByLabel('id-div-10-range-1-nth')
      await expect(idDiv0range1).toMatchAriaSnapshot({ name: `test-classic-3-0-wordsearch_results-${idx}-${step}-${projectName}.txt` });
      await idDiv0range1.click();
      await ensureThesaurusPanelOpen(page);

      await page.getByRole('button', { name: 'id-rightpanel-thesaurus-close' }).click();
      await ensureThesaurusPanelClosed(page);
      await page.waitForTimeout(100)
    }
  }
  await page.close()
})

test(`test My Ghost Writer: assert no wrong DOM dynamic construction within the div "wordsearch_results"
  by trigger_wordsearch_candidates() after click on div elements created by trigger_wordsearch_results(),
  both in read-only and editable mode. Using query 'good-for-'`,
  async ({ page }: { page: Page }, workerInfo: TestInfo) => {
    if (workerInfo.project.name === "MobileChromeLandscape") {
      const browser = await chromium.launch();
      const context = await browser.newContext({
        ...devices['Samsung Galaxy Tab S4'],
        isMobile: true,
      });
      page = await context.newPage();
    }
    const projectName = await initTest({ page, workerInfo, filepath: testStoryJsonTxt })

    for (let idx = 0; idx < 2; idx++) {
      for (let step = 0; step < 2; step++) {
        const query = 'good-for-'
        console.log(`projectName:${projectName}, second loop:${idx},${step}, with the query '${query}'`);
        await page.waitForTimeout(100)
        await page.getByRole('searchbox', { name: 'Word Search Input' }).click();
        await page.getByRole('searchbox', { name: 'Word Search Input' }).fill(query);
        await page.getByRole('searchbox', { name: 'Word Search Input' }).press('Enter');
        await page.waitForTimeout(100)
        await expect(page.getByLabel('wordsearch_candidates_count')).toMatchAriaSnapshot(`- text: 6 result(s) found`);
        await expect(page.getByLabel('wordsearch_results')).toMatchAriaSnapshot(`
        - text: 6 result(s) found
        - link "id-a-candidate-0-nth":
          - /url: "#"
          - text: good-for-nothing (1)
        - link "id-a-candidate-1-nth":
          - /url: "#"
          - text: her good-for-nothing (1)
        - link "id-a-candidate-2-nth":
          - /url: "#"
          - text: good-for-nothing husband (1)
        - link "id-a-candidate-3-nth":
          - /url: "#"
          - text: and her good-for-nothing (1)
        - link "id-a-candidate-4-nth":
          - /url: "#"
          - text: her good-for-nothing husband (1)
        - link "id-a-candidate-5-nth":
          - /url: "#"
          - text: good-for-nothing husband were (1)
        `);
        await page.waitForTimeout(100)
        await page.locator('#wordsearch_results div').first().click();
        await page.waitForTimeout(100)
        await ensureThesaurusPanelClosed(page);
        if (projectName === "MobileChromeLandscape") {
          await page.getByRole("link", {name: "id-0-range-0-nth"}).click()
        } else {
          await page.getByLabel('id-div-0-range-0-nth').click(); 
        }
        await ensureThesaurusPanelOpen(page);
        await page.waitForTimeout(100)

        await page.getByRole('button', { name: 'id-rightpanel-thesaurus-close' }).click();
        await ensureThesaurusPanelClosed(page);
        await page.waitForTimeout(100)
      }
    }
    await page.close()
  })
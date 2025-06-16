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
import { test, expect, Page, TestInfo } from '@playwright/test';
import { initTest, openMobileMenu, standardCheck } from './test-helper'

const testStoryJsonTxt = `${import.meta.dirname}/../../tests/events/short_text_markdown.json`
const expectedStringArray = ['Pack my box with five dozen liquor jugs - sphinx of black quartz, judge my vow (title)']


test('test My Ghost Writer: try using My Ghost Writer with Aesthetic UI then with Corpo UI', async ({ page }: { page: Page }, workerInfo: TestInfo) => {
  await page.goto('http://localhost:8000/');
  await page.locator('#welcomecontainer div').filter({ hasText: 'Aesthetic UI' }).nth(3).click();
  await page.getByRole('button', { name: 'Set UI' }).click();
  const projectName = await initTest({page, workerInfo, filepath:testStoryJsonTxt, targetUrl:"", setUi:false})
  await standardCheck(page, projectName, expectedStringArray[0], `test-classic-2-aesthetic-ui`)
  await openMobileMenu(page, "# prepare UI change")
  // 8. Re-open settings and re-apply Corpo UI to ensure persistence
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('link', { name: 'Tokens' }).click();
  await page.getByRole('link', { name: 'Format' }).click();
  await page.locator('#gui_type').selectOption('3');
  await page.getByRole('button', { name: 'OK' }).click();
  const mobileCorpoMenu = page.getByRole('button', { name: 'Show Corpo Side Panel' })
  if (await mobileCorpoMenu.isVisible()) {
    await page.getByRole('button', { name: 'Show Corpo Side Panel' }).click();
  }
  await page.getByText('Raw Editor', { exact: true }).click();
  await standardCheck(page, projectName, expectedStringArray[0], `test-classic-2-corpo-ui`, false)

  // 12. Close the Raw Editor and assert it is hidden, then re-open and assert it is visible again
  await expect(page.getByText('Raw Editor', { exact: true })).not.toBeVisible();
  await page.getByRole('button', { name: 'X', exact: true }).click();
  await expect(page.getByText('Raw Editor', { exact: true })).toBeVisible();
  // 13. Close the page to end the test
  page.close()
});
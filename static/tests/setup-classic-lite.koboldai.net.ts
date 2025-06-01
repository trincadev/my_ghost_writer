import { test as setup, expect } from '@playwright/test';

const setupClassicContextFile = `${import.meta.dirname}/setup-classic-lite.koboldai.net.json`
const testStoryJsonTxt = `${import.meta.dirname}/../../tests/events/very_long_text.json`

/**
 * Author Testers Talk
 */
setup('classic UI setup for lite.koboldai.net', async ({ page }) => {
  console.log('classic UI setup for lite.koboldai.net: starting...');
  console.log("filename:", testStoryJsonTxt, "#")

  await page.goto('http://localhost:8000/');
  await page.getByRole('button', { name: 'Set UI' }).click();

  console.log(`preparing uploading of file '${testStoryJsonTxt}'!`)
  await page.getByRole('link', { name: 'Save / Load' }).click();
  await page.waitForTimeout(100)
  const fileChooserPromise = page.waitForEvent('filechooser');
  // filepickerawait page.getByRole('button', { name: '📁 Open File' }).click();
  await page.getByRole('button', { name: '📁 Open File' }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(testStoryJsonTxt);
  await page.waitForTimeout(300)
  // await expect(page.locator('#gametext')).toHaveScreenshot()
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

  await page.context().storageState({ path: setupClassicContextFile });
  console.log('classic UI setup for lite.koboldai.net: done!');
});
import {test, expect, Page, TestInfo} from '@playwright/test';
import {
    deleteCustomSynonym,
    ensureThesaurusPanelClosed,
    ensureThesaurusPanelOpen,
    fillInputFieldWithString,
    initTest,
    openMobileMenu
} from './test-helper';

const testStoryJsonTxt = `${import.meta.dirname}/../../tests/events/very_long_text_test4.json`

test(`test My Ghost Writer: test the notification center wqith ok and not ok fetch`, async ({ page }: { page: Page }, workerInfo: TestInfo) => {
    console.log("process.env.DOMAIN_PORT_BACKEND:", process.env.DOMAIN_PORT_BACKEND, "#")
    const backendDomain = `${process.env.DOMAIN_PORT_BACKEND}` ?? "http://localhost:7860"
    console.log("thesaurusDomain:", backendDomain, "#")
    const projectName = await initTest({ page, workerInfo, filepath: testStoryJsonTxt })
    console.log("projectNameGlobal.projectName:", projectName, "#")
    if (projectName === "MobileChromeLandscape") {
        test.skip()
        await page.close()
    }
    const word = ("happy"+projectName).replace(/\s/g,'').replace(/\(/g,'').replace(/\)/g,'')
    console.log("word:", word, "#")
    let responseData = null;
    try {
        responseData = await deleteCustomSynonym(word)
        console.log("message:", responseData.message, "#")
    } catch {}
    const state = "editable"
    // search the word 'happy'
    await fillInputFieldWithString(page, word);
    await page.getByRole('checkbox', { name: 'Allow Editing' }).check();
    await page.waitForTimeout(200)

    // re-open the thesaurus custom form, from the external button this time
    await page.getByRole('button', { name: 'thesaurus-custom-button-' }).click();
    await page.waitForTimeout(200)
    // compile the forms for the submission of the 'happy' synonyms
    await page.getByRole('textbox', { name: 'thesaurus-custom-word' }).click();
    await page.getByRole('textbox', { name: 'thesaurus-custom-word' }).fill(word);
    await page.getByRole('textbox', { name: 'thesaurus-custom-related-words-0nth' }).click();
    await page.getByRole('textbox', { name: 'thesaurus-custom-related-words-0nth' }).fill('cheerful,joy');
    await page.getByRole('button', { name: 'thesaurus-custom-related-btn-' }).click();
    await page.getByLabel('thesaurus-custom-related-type-1nth', { exact: true }).selectOption('antonym');

    await page.getByRole('textbox', { name: 'thesaurus-custom-related-words-1nth' }).click();
    await page.getByRole('textbox', { name: 'thesaurus-custom-related-words-1nth' }).fill('sad,sadness');
    await page.getByRole('textbox', { name: 'thesaurus-custom-related-definition-1nth' }).click();
    await page.getByRole('textbox', { name: 'thesaurus-custom-related-definition-1nth' }).fill('I\'m a sad person');
    await page.getByRole('button', { name: 'thesaurus-custom-related-btn-add-0nth' }).click();
    await page.getByRole('button', { name: 'thesaurus-custom-related-btn-del-2nth' }).click(); // delete an entry
    console.log("projectName:", projectName, ", state: ", state, "#")
    await expect(page.getByLabel('thesaurus-custom-form-content')).toMatchAriaSnapshot({ name: `test-classic-5-0-wordsearch_results-1-${projectName}-${state}.txt` });
    await page.getByRole('button', { name: 'thesaurus-custom-related-btn-add-0nth' }).click();
    await expect(page.getByLabel('thesaurus-custom-form-content')).toMatchAriaSnapshot({ name: `test-classic-5-0-wordsearch_results-2-${projectName}-${state}.txt` });
    await page.getByRole('textbox', { name: 'thesaurus-custom-related-words-2nth' }).click();
    await page.getByRole('textbox', { name: 'thesaurus-custom-related-words-2nth' }).fill('joyful,happyness,content');

    const thesaurusCustomSubmitBtn = page.getByRole('button', { name: 'thesaurus-custom-submit' })
    await thesaurusCustomSubmitBtn.click()

    // await handleDialogWithExpectedMessage({page, locator: thesaurusCustomSubmitBtn, expectedText: "Thesaurus entry added successfully!"})
    await page.waitForTimeout(200)
    await ensureThesaurusPanelClosed(page);

    await expect(page.getByLabel('notification-banner')).toBeVisible();
    await expect(page.getByLabel('notification-banner')).toMatchAriaSnapshot(`
      - text: /✅ POST http:\\/\\/localhost:\\d+\\/thesaurus-custom completed/
      - button "notification-close"
      `);
    await page.getByLabel('notification-toggle').click();
    await expect(page.getByLabel('notification-center')).toMatchAriaSnapshot({ name: `test-classic-5-0-wordsearch_results-3-${projectName}-${state}.txt` });
    await page.getByRole('button', { name: 'notification-history-close' }).click();
    await expect(page.getByLabel('notification-toggle')).toMatchAriaSnapshot(`- text: 📋 1`);
    

    await openMobileMenu(page, "#found mobile button for global menu, open it to toggle word search!")
    await page.getByRole('link', { name: 'Settings' }).click();
    
    const thesaurusEndpoint = page.getByRole('textbox', { name: 'wordsearch_thesaurus_endpoint' })
    await thesaurusEndpoint.fill("http://localhost:666")
    await page.getByRole('button', { name: 'OK' }).click();
    console.log("###")
    await page.evaluate(() => {
        window.NotificationCenter.setDefaultTimeout(200); // 0.2 seconds
    });

    await page.getByRole('button', { name: 'thesaurus-custom-button-' }).click();
    await page.getByTestId('thesaurus-custom-word').click();
    await page.getByTestId('thesaurus-custom-word').fill('happychromium');
    await page.getByTestId('thesaurus-custom-related-words-0nth').click();
    await page.getByTestId('thesaurus-custom-related-words-0nth').fill('xxx');
    await page.getByTestId('thesaurus-custom-submit').click({timeout: 500});
    await page.waitForTimeout(300)
    console.log("###")

    await expect(page.getByLabel('notification-banner')).toBeVisible();
    await expect(page.getByLabel('notification-banner')).toMatchAriaSnapshot(`
      - text: /❌ POST http:\\/\\/localhost:\\d+\\/thesaurus-custom failed/
      - button "notification-close"
      `);
    console.log("###")

    // delete the synonyms group(s) for 'happy' to ensure we can repeat this test
    responseData = await deleteCustomSynonym(word)
    expect(responseData.message).toContain(`Synonyms for '${word}' deleted successfully`)

    await page.close()
})

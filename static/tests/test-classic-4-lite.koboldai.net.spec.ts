import {test, expect, WorkerInfo, Page, TestInfo} from '@playwright/test';
import {
    deleteCustomSynonym,
    ensureThesaurusPanelClosed,
    ensureThesaurusPanelOpen,
    fillInputFieldWithString,
    handleDialogWithExpectedMessage,
    initTest
} from './test-helper';

const testStoryJsonTxt = `${import.meta.dirname}/../../tests/events/very_long_text_test4.json`

test(`test My Ghost Writer: backend request - word with no synonyms, then add a custom entry`, async ({ page }: { page: Page }, workerInfo: TestInfo) => {
    console.log("process.env.DOMAIN_PORT_BACKEND:", process.env.DOMAIN_PORT_BACKEND, "#")
    const backendDomain = `${process.env.DOMAIN_PORT_BACKEND}` ?? "http://localhost:7860"
    console.log("thesaurusDomain:", backendDomain, "#")
    const projectName = await initTest({ page, workerInfo, filepath: testStoryJsonTxt })
    console.log("projectNameGlobal.projectName:", projectName, "#")
    if (projectName === "MobileChromeLandscape") {
        test.skip()
        await page.close()
    }
    if (projectName === "iPad (gen 11)") {
        test.fixme()
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

    await ensureThesaurusPanelClosed(page);
    // open the right panel with the thesaurus result: the word 'happy+projectName', initially, doesn't have any synonyms
    await page.getByRole('link', { name: 'id-a-candidate-0-nth' }).click();
    await page.getByRole('link', { name: 'id-0-range-0-nth' }).click();
    await page.waitForTimeout(200)

    await ensureThesaurusPanelOpen(page);
    // assert that the title of the thesaurus right panel is what we expect
    await expect(page.getByLabel('id-content-inflated-synonyms-')).toContainText('Original phrase: '+word);
    await expect(page.getByRole("heading", {name: "id-content-inflated-synonyms-container-h1-original-phrase"})).toContainText('Original phrase: '+word);
    // assert that the page content is what we expect
    await expect(page.locator('#id-rightpanel-thesaurus-content-parent')).toMatchAriaSnapshot({ name: `test-classic-4-0-wordsearch_results-0-${projectName}-${state}.txt` });
    // open the thesaurus custom form using the internal button
    await page.getByRole('button', { name: 'thesaurus-custom-button-internal0' }).click();
    // try to submit immediately, we'll get an error because we didn't fill the forms
    const thesaurusCustomSubmitBtn = page.getByRole('button', { name: 'thesaurus-custom-submit' })
    await handleDialogWithExpectedMessage({page, locator: thesaurusCustomSubmitBtn, expectedText: "Please enter a word."})
    await page.waitForTimeout(200)

    await page.getByRole('button', { name: 'thesaurus-custom-cancel' }).click(); // close the thesaurus custom form
    await page.getByRole('button', { name: 'id-rightpanel-thesaurus-close' }).click(); // close the thesaurus result right panel
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
    console.log("#")
    await page.getByLabel('thesaurus-custom-related-type-1nth').selectOption('Antonym');
    await page.getByRole('textbox', { name: 'thesaurus-custom-related-words-1nth' }).click();
    await page.getByRole('textbox', { name: 'thesaurus-custom-related-words-1nth' }).fill('sad,sadness');
    await page.getByRole('textbox', { name: 'thesaurus-custom-related-definition-1nth' }).click();
    await page.getByRole('textbox', { name: 'thesaurus-custom-related-definition-1nth' }).fill('I\'m a sad person');
    await page.getByRole('button', { name: 'thesaurus-custom-related-btn-add-0nth' }).click();
    await page.getByRole('button', { name: 'thesaurus-custom-related-btn-del-2nth' }).click(); // delete an entry
    await expect(page.getByLabel('thesaurus-custom-form-content')).toMatchAriaSnapshot({ name: `test-classic-4-0-wordsearch_results-1-${projectName}-${state}.txt` });
    await page.getByRole('button', { name: 'thesaurus-custom-related-btn-add-0nth' }).click();
    await expect(page.getByLabel('thesaurus-custom-form-content')).toMatchAriaSnapshot({ name: `test-classic-4-0-wordsearch_results-2-${projectName}-${state}.txt` });
    await page.getByRole('textbox', { name: 'thesaurus-custom-related-words-2nth' }).click();
    await page.getByRole('textbox', { name: 'thesaurus-custom-related-words-2nth' }).fill('joyful,happyness,content');

    await handleDialogWithExpectedMessage({page, locator: thesaurusCustomSubmitBtn, expectedText: "Thesaurus entry added successfully!"})
    await page.waitForTimeout(200)

    await ensureThesaurusPanelClosed(page);
    // re-open the right panel with the thesaurus results for 'happy': this time we'll find the synonynms we submitted before (WIP: only the first group right now)
    await page.getByRole('link', { name: 'id-a-candidate-0-nth' }).click();
    await page.getByRole('link', { name: 'id-0-range-0-nth' }).click();
    await page.waitForTimeout(200)
    await ensureThesaurusPanelOpen(page);

    await expect(page.getByLabel('definition-div-0nth')).toBeVisible();
    await expect(page.getByLabel('content-inflated-synonyms-0nth')).toMatchAriaSnapshot({ name: `test-classic-4-0-wordsearch_results-3-${projectName}-${state}.txt` });
    await page.getByRole('button', { name: 'id-rightpanel-thesaurus-close' }).click();
    await page.waitForTimeout(200)
    await ensureThesaurusPanelClosed(page);

    // delete the synonyms group(s) for 'happy' to ensure we can repeat this test
    responseData = await deleteCustomSynonym(word)
    expect(responseData.message).toContain(`Synonyms for '${word}' deleted successfully`)

    await page.close()
})

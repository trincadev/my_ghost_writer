import 'dotenv/config'
import {test, expect} from '@playwright/test';
import {fileReader, loopOverTablesAndClickOnUrls, testWithLoop} from './test-helper'

test.describe(`Words Frequency - embedded stemmer:`, () => {
  test.beforeEach(`open the page and choose the embedded...`, async ({ page }) => {
    await page.goto(process.env.DOMAIN_PORT ?? "/");
    await page.getByRole('checkbox', { name: 'id-stemmer-embedded' }).check();
  })
  test(`short, mono line text input`, async ({ page }) => {
    const WordsFreqTable0AriaSnapshot1FilePath = `${import.meta.dirname}/test-words-frequency-1-table0-aria-snapshot.txt`
    const WordsFreqTable13AriaSnapshot1FilePath = `${import.meta.dirname}/test-words-frequency-1-table13-aria-snapshot.txt`
    await page.goto(process.env.DOMAIN_PORT ?? "/");
    console.log(page.url())

    await page.getByRole('button', { name: 'btn4-get-words-frequency' }).click();
    let table0 = page.getByRole('table', { name: 'id-table-0-nth' })
    let dataTable0 = await fileReader(WordsFreqTable0AriaSnapshot1FilePath)
    let table13 = page.getByRole('table', { name: 'id-table-13-nth' })
    let dataTableLast = await fileReader(WordsFreqTable13AriaSnapshot1FilePath)
    await expect(table0).toMatchAriaSnapshot(dataTable0)
    await expect(table13).toMatchAriaSnapshot(dataTableLast)

    let cellArray1 = [
      { table: 0, row: 0, word: "there" }, { table: 0, row: 1, word: "There" },
      { table: 5, row: 0, word: "pasties" }, { table: 13, row: 0, word: "table" }
    ]
    // short, mono line text input
    const wordsFreqTableTitle = page.getByLabel('id-words-frequency-table-title')
    await expect(wordsFreqTableTitle).toContainText('Words Frequency Table (14 word groups, 1 rows)');
    for (let idx in cellArray1) {
      await loopOverTablesAndClickOnUrls(page, cellArray1[idx], 0)
    }
    console.log("end!")
  });

  test(`short, multi line text input`, async ({ page }) => {
    const testLLMTextFilePath = `${import.meta.dirname}/../../tests/events/llm_generated_story_2.txt`
    let cellArray_short_multiline = [
      { table: 1, row: 1, word: "upon" }, { table: 2, row: 0, word: "time" },
      { table: 0, row: 0, word: "Once" }, { table: 96, row: 0, word: "soft" }
    ]
    await testWithLoop(page, testLLMTextFilePath, cellArray_short_multiline, 'Words Frequency Table (98 word groups, 4 rows)');
  });

  test(`long, multi line text input`, async ({ page }) => {
    const testLLMTextFilePath = `${import.meta.dirname}/../../tests/events/llm_generated_story_1.txt`
    let cellArray_long_multiline = [
      { table: 1, row: 1, word: "upon" }, { table: 1, row: 2, word: "upon" }, { table: 1, row: 3, word: "upon" },
      { table: 2, row: 0, word: "time" }, { table: 2, row: 1, word: "time" }, { table: 2, row: 2, word: "time" },
      { table: 0, row: 1, word: "Once" }, { table: 8, row: 1, word: "young" }, { table: 8, row: 4, word: "young" },
      { table: 739, row: 1, word: "Isst" }, { table: 739, row: 3, word: "Isst" }
    ]
    await testWithLoop(page, testLLMTextFilePath, cellArray_long_multiline, "Words Frequency Table (751 word groups, 98 rows)");
  });  
})
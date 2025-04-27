import 'dotenv/config'
import { test, expect } from '@playwright/test';
import { fileReader, loopOverTablesAndClickOnUrls } from './test-helper'

test(`test: words frequency (short text input)`, async ({ page }) => {
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
  for (let idx in cellArray1) {
    await loopOverTablesAndClickOnUrls(page, cellArray1[idx], 0)
  }
  console.log("end!")
});

test(`test: words frequency (long, multi line text input)`, async ({ page }) => {
  const testLLMTextFilePath = `${import.meta.dirname}/../../tests/events/llm_generated_story_1.txt`
  await page.goto(process.env.DOMAIN_PORT ?? "/");
  console.log(page.url())

  console.log("Let's try with a much longer, multiline text while scrolling the conteditable div on click")
  console.log("first upload a new, longer, multiline text then populate again the words frequency tables and re-try again the word links")

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'id-input-file-selector' }).click();
  await page.waitForTimeout(200)
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(testLLMTextFilePath);
  await page.waitForTimeout(200)

  await page.getByRole('button', { name: 'btn4-get-words-frequency' }).click();
  
  console.log("try with a new array of tables/rows...")
  let cellArray2 = [
    { table: 1, row: 1, word: "upon" }, { table: 1, row: 2, word: "upon" }, { table: 1, row: 3, word: "upon" },
    { table: 2, row: 0, word: "time" }, { table: 2, row: 1, word: "time" }, { table: 2, row: 2, word: "time" },
    { table: 0, row: 1, word: "Once" }, { table: 8, row: 1, word: "young" }, { table: 8, row: 4, word: "young" },
    { table: 737, row: 1, word: "Isst" }, { table: 737, row: 3, word: "Isst" }
  ]
  for (let idx in cellArray2) {
    await loopOverTablesAndClickOnUrls(page, cellArray2[idx], 100)
  }
  console.log("end!")
});
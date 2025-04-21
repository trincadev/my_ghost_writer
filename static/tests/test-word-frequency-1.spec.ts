import 'dotenv/config'
import { test, expect } from '@playwright/test';
import { fileReader, loopOverTablesAndClickOnUrls } from './test-helper'

test(`test: word frequency (short text input)`, async ({ page }) => {
  const wordFreqTable0AriaSnapshot1FilePath = `${import.meta.dirname}/test-word-frequency-1-table0-aria-snapshot.txt`
  const wordFreqTable13AriaSnapshot1FilePath = `${import.meta.dirname}/test-word-frequency-1-table13-aria-snapshot.txt`
  await page.goto(process.env.DOMAIN ?? "http://localhost:7860/");
  console.log(page.url())

  await page.getByRole('button', { name: 'btn4-getWordFrequency' }).click();
  let table0 = page.getByRole('table', { name: 'id-table-0-nth' })
  let dataTable0 = await fileReader(wordFreqTable0AriaSnapshot1FilePath)
  let table13 = page.getByRole('table', { name: 'id-table-13-nth' })
  let dataTableLast = await fileReader(wordFreqTable13AriaSnapshot1FilePath)
  await expect(table0).toMatchAriaSnapshot(dataTable0)
  await expect(table13).toMatchAriaSnapshot(dataTableLast)

  let cellArray1 = [{ table: 0, row: 0 }, { table: 0, row: 1 }, { table: 5, row: 0 }, { table: 13, row: 0 }]
  for (let idx in cellArray1) {
    await loopOverTablesAndClickOnUrls(page, cellArray1[idx], 0)
  }
  console.log("end!")
});

test(`test: word frequency (long, multi line text input)`, async ({ page }) => {
  const testLLMTextFilePath = `${import.meta.dirname}/../../tests/events/llm_generated_story_1.txt`
  await page.goto(process.env.DOMAIN ?? "http://localhost:7860/");
  console.log(page.url())

  console.log("Let's try with a much longer, multiline text while scrolling the conteditable div on click")
  console.log("first upload a new, longer, multiline text then populate again the words frequency tables and re-try again the word links")

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'id-input-file-selector' }).click();
  await page.waitForTimeout(200)
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(testLLMTextFilePath);
  await page.waitForTimeout(200)

  await page.getByRole('button', { name: 'btn4-getWordFrequency' }).click();
  
  console.log("try with a new array of tables/rows...")
  let cellArray2 = [
    { table: 1, row: 1 }, { table: 1, row: 2 }, { table: 1, row: 3 }, { table: 2, row: 0 }, { table: 2, row: 1 },
    { table: 2, row: 2 }, { table: 0, row: 1 }, { table: 8, row: 1 }, { table: 8, row: 4 }, { table: 737, row: 1 },
    { table: 737, row: 3 }
  ]
  for (let idx in cellArray2) {
    await loopOverTablesAndClickOnUrls(page, cellArray2[idx], 100)
  }
  console.log("end!")
});
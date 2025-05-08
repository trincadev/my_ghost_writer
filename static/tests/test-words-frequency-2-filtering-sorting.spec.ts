import 'dotenv/config'
import { expect, test } from '@playwright/test';
import { assertTableStap } from './test-helper'

const sortOrder = "count_asc";
const expectedInitialCount = 14;
[
    {count: 2, filter: "th", testIdx: 0},
    {count: 2, filter: "re", testIdx: 1},
    {count: expectedInitialCount, filter: "", testIdx: 2},
].forEach(({ count, filter, testIdx }) => {
    test(`words frequency: filtering, ordering and sorting - ${testIdx}, sort/order ${sortOrder}.`, async ({ page }) => {
        await page.goto(process.env.DOMAIN_PORT ?? "/");
        await page.getByRole('button', { name: 'btn4-get-words-frequency' }).click();
        let containerTable = page.getByLabel('words-frequency', { exact: true })
        await page.waitForTimeout(100)
        let initialCount = await containerTable.getByRole("table").count()
        console.log(`test:${testIdx}, initialCount:${initialCount}.`)
        console.log(`test:${testIdx}, initialCount:${initialCount}.`)
        expect(initialCount).toBe(expectedInitialCount)

        console.log(`words frequency table (${testIdx}, sort/order ${sortOrder}), got output with ${expectedInitialCount} tables (click on button)...`)
        await page.waitForTimeout(100)
        await page.getByRole('textbox', { name: 'filter-words-frequency' }).fill(filter);
        await page.getByRole('button', { name: 'btn-filter-words-frequency' }).click();
        await page.waitForTimeout(100)
        console.log(`words frequency table (${testIdx}, sort/order ${sortOrder}) filtered by '${filter}', checking for assertions...`)
        await assertTableStap(page, count, sortOrder, testIdx, "test-words-frequency-2-filtering-sorting-snapshots", "read")
    })
});


[
    {count: 2, filter: "th", testIdx: 0},
    {count: 2, filter: "re", testIdx: 1},
    {count: expectedInitialCount, filter: "", testIdx: 2},
].forEach(({ count, filter, testIdx }) => {
    test(`words frequency: filtering, ordering and sorting - ${testIdx}, sort/order ${sortOrder}, press ENTER!`, async ({ page }) => {
        await page.goto(process.env.DOMAIN_PORT ?? "/");
        await page.getByRole('button', { name: 'btn4-get-words-frequency' }).click();
        let containerTable = page.getByLabel('words-frequency', { exact: true })
        await page.waitForTimeout(100)
        let initialCount = await containerTable.getByRole("table").count()
        console.log(`test:${testIdx}, initialCount:${initialCount}.`)
        console.log(`test:${testIdx}, initialCount:${initialCount}.`)
        expect(initialCount).toBe(expectedInitialCount)

        console.log(`words frequency table (${testIdx}, sort/order ${sortOrder}), got output with ${expectedInitialCount} tables (press enter within input field)...`)
        await page.waitForTimeout(100)
        await page.getByRole('textbox', { name: 'filter-words-frequency' }).fill(filter);
        console.log("filtering by pressing Enter...")
        await page.getByRole('textbox', { name: 'filter-words-frequency' }).press('Enter');
        await page.waitForTimeout(100)
        console.log(`words frequency table (${testIdx}, sort/order ${sortOrder}) filtered by '${filter}', checking for assertions...`)
        await assertTableStap(page, count, sortOrder, testIdx, "test-words-frequency-2-filtering-sorting-snapshots", "read")
    })
});

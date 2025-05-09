import 'dotenv/config'
import { test } from '@playwright/test';
import { assertTableStap } from './test-helper'

const count = 14
test.describe(`words frequency: sorting output with ${14} tables`, () => {
    test.beforeEach(async({page}) => {
        await page.goto(process.env.DOMAIN_PORT ?? "/");
        await page.getByRole('button', { name: 'btn4-get-words-frequency' }).click();
    });
    
    [
        {sortOrder: "null,desc", testIdx: 0},
        {sortOrder: "name,desc", testIdx: 1},
        {sortOrder: "count,desc", testIdx: 2},
        {sortOrder: "name,asc", testIdx: 3},
        {sortOrder: "count,asc", testIdx: 4}
    ].forEach(({sortOrder, testIdx}) => {
        test(`test ${testIdx} - ${sortOrder}.`, async({page}) => {
            if (sortOrder !== "null,desc") {
                let options = sortOrder.split(",")
                let sortName = `sort-by-${options[0]}`
                let orderName = `order-by-${options[1]}`
                console.log(`test${testIdx}, options: ${sortName}, ${orderName}.`)
                await page.getByRole('radio', { name: sortName }).check();
                await page.getByRole('radio', { name: orderName }).check();
                await page.waitForTimeout(100)
            }
            await page.getByRole('button', { name: 'btn-filter-words-frequency' }).click();
            await page.waitForTimeout(100)
            console.log(`test${testIdx}, sortOrder:${sortOrder}.`)
            // decomment to manually update the aria snapshot, since the automatic creation and update doesn't work
            // await assertTableStap(page, count, sortOrder, testIdx, "test-words-frequency-3-sorting-snapshots", "write")
            await assertTableStap(page, count, sortOrder, testIdx, "test-words-frequency-3-sorting-snapshots", "read")
        })
    });

})

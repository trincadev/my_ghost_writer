import fs from 'node:fs'
import { Page, expect } from '@playwright/test';
 
interface CellObject {
  table: number
  row: number
}

 export const fileReader = async (filePath: string) => {
    try {
        const data = fs.readFileSync(filePath, { encoding: 'utf8' });
        console.log("data length:", data.length, "#");
        return data
      } catch (err) {
        console.error(err);
        throw err
      }
}

export const loopOverTablesAndClickOnUrls = async (page: Page, cellObj: CellObject, timeout=50) => {
    let cellLabel = `id-table-${cellObj["table"]}-row-${cellObj["row"]}-nth`
    console.log(`current aria-label:${cellLabel}...`)
    console.log(`current cell content: '${cellLabel}'...`)
    let currentCellElement = page.getByLabel(cellLabel).locator('a')
    console.log("currentCellElement:", currentCellElement, "#")
    await currentCellElement.click();
    await page.waitForTimeout(timeout)
    await expect(page.getByLabel('editor')).toHaveScreenshot(/** {stylePath: `${import.meta.dirname}/../index.css`} */);
}
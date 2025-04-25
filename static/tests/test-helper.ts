import fs from 'node:fs'
import { Page, expect } from '@playwright/test';
 
interface CellObject {
  table: number
  row: number,
  word: string
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
    try {
      console.log(`current aria-label:${cellLabel}...`)
      console.log(`current cell content: '${cellLabel}'...`)
      let currentCellElement = page.getByLabel(cellLabel).locator('a')
      console.log("currentCellElement:", currentCellElement, "#")
      let currentInnerText = await currentCellElement.innerText()
      console.log(`currentCellElement::innerText: '${currentInnerText}'`)
      expect(currentInnerText).toBe(cellObj.word)
      await currentCellElement.click({timeout: 1000});
      await page.waitForTimeout(timeout)
      await expect(page.getByLabel('editor')).toHaveScreenshot(/** {stylePath: `${import.meta.dirname}/../index.css`} */);
    } catch (err) {
      console.log("cellLabel:", cellLabel, "#")
      console.log("err:", err, "#")
      throw err
    }
}
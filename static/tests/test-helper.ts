import fs from 'node:fs'
import { Locator, Page, expect } from '@playwright/test';
 
interface CellObject {
  table: number
  row: number,
  word: string
}
interface CurrentTableContent {
  count: number,
  word_prefix: string
}
export interface ArrayTables {
  sort_order: string,
  array: CurrentTableContent[] 
}
export type role = "alert"|"alertdialog"|"application"|"article"|"banner"|"blockquote"|"button"|"caption"|"cell"|"checkbox"|"code"|"columnheader"|"combobox"|"complementary"|"contentinfo"|"definition"|"deletion"|"dialog"|"directory"|"document"|"emphasis"|"feed"|"figure"|"form"|"generic"|"grid"|"gridcell"|"group"|"heading"|"img"|"insertion"|"link"|"list"|"listbox"|"listitem"|"log"|"main"|"marquee"|"math"|"meter"|"menu"|"menubar"|"menuitem"|"menuitemcheckbox"|"menuitemradio"|"navigation"|"none"|"note"|"option"|"paragraph"|"presentation"|"progressbar"|"radio"|"radiogroup"|"region"|"row"|"rowgroup"|"rowheader"|"scrollbar"|"search"|"searchbox"|"separator"|"slider"|"spinbutton"|"status"|"strong"|"subscript"|"superscript"|"switch"|"tab"|"table"|"tablist"|"tabpanel"|"term"|"textbox"|"time"|"timer"|"toolbar"|"tooltip"|"tree"|"treegrid"|"treeitem"
interface CellArray {
  table: number;
  row: number;
  word: string;
}

export const fileReader = async (filePath: string): Promise<string> => {
    try {
        const data = fs.readFileSync(filePath, { encoding: 'utf8' });
        console.log(`fileReader::data length:", '${data.length}'`);
        return data
      } catch (err) {
        console.error("fileReader::err:", err, "#");
        throw err
      }
}

export const fileWriter = async (filePath: string, data: string): Promise<void> => {
  try {
    fs.writeFileSync(filePath, data, "utf8");
    console.log(`fileWriter::File written to ${filePath}...`);
  } catch (err) {
    console.error("fileWriter::err:", err, "#");
    throw err;
  }
}

export const loopOverTablesAndClickOnUrls = async (page: Page, cellObj: CellObject, timeout=50, ariaSnapshotName: string) => {
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
      await expect(page.getByLabel('editor')).toMatchAriaSnapshot({ name: ariaSnapshotName });
    } catch (err) {
      console.log("cellLabel:", cellLabel, "#")
      console.log("err:", err, "#")
      throw err
    }
}

export const assertTableStap = async (page: Page, count: number, sortOrder: string, testIdx: number, subFolderName: string, action: string) => {     
  let containerTables = page.getByLabel('words-frequency', { exact: true })
  let tablesArray = containerTables.getByRole("table")
  let tablesArrayLen = await tablesArray.count()
  console.log("tablesArrayLen:", tablesArrayLen, "#")
  await expect(tablesArray).toHaveCount(count)

  let containerTablesAriaSnap = await containerTables.ariaSnapshot()
  if (action === "read") {
    const ariaSnapshot = await fileReader(`${import.meta.dirname}/${subFolderName}/test-${testIdx}-${sortOrder}.txt`)
    expect(containerTablesAriaSnap).toBe(ariaSnapshot)
  } else if (action === "write") {
    // the automatic aria snapshot test save system doesn't work, we save it manually test-words-frequency-2-filtering-sorting-snapshots
    fileWriter(`${import.meta.dirname}/${subFolderName}/test-${testIdx}-${sortOrder}.txt`, containerTablesAriaSnap)
  } else {
    throw Error(`Wrong condition: '${action}'`)
  }
}

export async function testWithLoop(page: Page, testLLMTextFilePath: string, cellArray2: CellArray[], assertTitleString: string) {
  // await page.goto(process.env.DOMAIN_PORT ?? "/");
  console.log(page.url())

  console.log("Let's try with a much longer, multiline text while scrolling the conteditable div on click")
  console.log("first upload a new, longer, multiline text then populate again the words frequency tables and re-try again the word links")

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', {name: 'id-input-file-selector'}).click();
  await page.waitForTimeout(200)
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(testLLMTextFilePath);
  await page.waitForTimeout(200)

  await page.getByRole('button', {name: 'btn4-get-words-frequency'}).click();

  const wordsFreqTableTitle = page.getByLabel('id-words-frequency-table-title')
  console.log("assertTitleString:", assertTitleString, "#")
  await expect(wordsFreqTableTitle).toContainText(assertTitleString);
  const editor = page.getByLabel("editor");
  // avoid snapshot differences due to spellcheck
  editor.evaluate((el: HTMLDivElement) => el.setAttribute("spellcheck", "false"))
  await page.waitForTimeout(100)

  console.log("try with a new array of tables/rows...")
  for (let idx in cellArray2) {
    await loopOverTablesAndClickOnUrls(page, cellArray2[idx], 100, `test-loop-${assertTitleString}-${idx}.txt`)
  }
  console.log("end!")
}

export async function assertCellAndLink(page: Page, gameEditor: Locator, idCell: string, expectedCellString: string, assertScreenshot: boolean = true) {
  let tableOfWordsElNth0 = page.getByLabel(idCell).getByRole('cell');
  await expect(tableOfWordsElNth0).toMatchAriaSnapshot(`- cell "${idCell}-link": "${expectedCellString}"`);
  await page.getByLabel(`${idCell}-link`).click();
  await page.waitForTimeout(100);
  if (assertScreenshot) {
    await expect(gameEditor).toHaveScreenshot();
  }
}

export async function assertCellAndLinkAriaSnapshot(page: Page, idCell: string, expectedCellString: string, idElementSnapshot: string, expectedSnapshotString: string) {
  // await assertCellAndLink(page, page.locator("not_used"), idCell, expectedCellString, false)
  let tableOfWordsElNth0 = page.getByLabel(idCell).getByRole('cell');
  await expect(tableOfWordsElNth0).toMatchAriaSnapshot(`- cell "${idCell}-link": "${expectedCellString}"`);
  await page.getByLabel(`${idCell}-link`).click();
  await page.waitForTimeout(100);

  await expectOnlyVisibleTextInElement(page, idElementSnapshot, expectedSnapshotString)
}

/**
 * @param page Playwright Page object
 * @param idElement The id of the element to check
 * @param expectedVisible The exact string expected to be visible in the viewport
 */
export async function expectOnlyVisibleTextInElement(
  page: Page,
  idElement: string,
  expectedVisible: string
) {
  // Use bounding rects to get visible text for complex HTML
  const visibleText = await page.evaluate((id) => {
    const el = document.getElementById(id);
    if (!el) {
      throw Error(`HTML element with id '${id}' not found!`)
    }
    const parentRect = el.getBoundingClientRect();
    let visible = '';
    function getVisibleText(node: Node): string {
      if (node.nodeType === Node.TEXT_NODE) {
        const range = document.createRange();
        range.selectNode(node);
        const rects = range.getClientRects();
        for (const rect of rects) {
          if (
            rect.bottom > parentRect.top &&
            rect.top < parentRect.bottom &&
            rect.right > parentRect.left &&
            rect.left < parentRect.right
          ) {
            return node.textContent || '';
          }
        }
        return '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        let text = '';
        for (const child of (node as Element).childNodes) {
          text += getVisibleText(child);
        }
        return text;
      }
      return '';
    }
    visible = getVisibleText(el);
    return visible.trim();
  }, idElement);
  expect(visibleText).not.toBe(expectedVisible + " - error!");
  expect(visibleText).toBe(expectedVisible);
}

/**
 * Scrolls the element with the given id to the bottom.
 * @param page Playwright Page object
 * @param idElement The id of the scrollable element
 */
export async function scrollToBottomById(page: Page, idElement: string) {
  await page.evaluate((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, idElement);
}

export async function scrollToTopById(page: Page, idElement: string) {
  await page.evaluate((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollTop = 0;
    }
  }, idElement);
}

export async function uploadFileWithPageAndFilepath(page: Page, filepath: string) {
    console.log(`preparing uploading of file '${filepath}'!`)
    await page.getByRole('link', { name: 'Save / Load' }).click();
    await page.waitForTimeout(100)
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: '📁 Open File' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filepath);
    await page.waitForTimeout(300)
    console.log(`file '${filepath}' uploaded!!`)
}
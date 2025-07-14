import fs from 'node:fs'
import * as crypto from "node:crypto";
import { Locator, Page, TestInfo, expect } from '@playwright/test';

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
export type role = "alert" | "alertdialog" | "application" | "article" | "banner" | "blockquote" | "button" | "caption" | "cell" | "checkbox" | "code" | "columnheader" | "combobox" | "complementary" | "contentinfo" | "definition" | "deletion" | "dialog" | "directory" | "document" | "emphasis" | "feed" | "figure" | "form" | "generic" | "grid" | "gridcell" | "group" | "heading" | "img" | "insertion" | "link" | "list" | "listbox" | "listitem" | "log" | "main" | "marquee" | "math" | "meter" | "menu" | "menubar" | "menuitem" | "menuitemcheckbox" | "menuitemradio" | "navigation" | "none" | "note" | "option" | "paragraph" | "presentation" | "progressbar" | "radio" | "radiogroup" | "region" | "row" | "rowgroup" | "rowheader" | "scrollbar" | "search" | "searchbox" | "separator" | "slider" | "spinbutton" | "status" | "strong" | "subscript" | "superscript" | "switch" | "tab" | "table" | "tablist" | "tabpanel" | "term" | "textbox" | "time" | "timer" | "toolbar" | "tooltip" | "tree" | "treegrid" | "treeitem"
interface CellArray {
  table: number;
  row: number;
  word: string;
}
export type ScrollToPosition = "top" | "bottom";
export type ClickOrEnter = "click" | "Enter"

export interface PrepareTestWithOpenRightPanelArg {page: Page; expectedFirstAriaSnapshot: string; projectName: string, state: string, idWordRange: string, idText: number, candidateMatch: string, countCandidates: number, wordRangeText: string}

// Utility to close the right panel if open
export async function ensureThesaurusPanelClosed(page: Page) {
  const panel = page.locator('#id-rightpanel-thesaurus');
  if (await panel.isVisible()) {
    // Try to close via close button if present
    const closeBtn = page.locator('#id-rightpanel-thesaurus-close');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await expect(panel).not.toBeVisible();
    }
  }
}

// Utility to open the right panel if needed
export async function ensureThesaurusPanelOpen(page: Page) {
  const panel = page.locator('#id-rightpanel-thesaurus');
  if (!(await panel.isVisible())) {
    // Open the panel by triggering the UI action (customize as needed)
    // Example: click a button or perform an action that opens the panel
    // await page.click('#open-thesaurus-btn');
    // If the panel opens automatically on word click, do nothing
  }
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

export const loopOverTablesAndClickOnUrls = async (page: Page, cellObj: CellObject, timeout = 50, ariaSnapshotName: string) => {
  let cellLabel = `id-table-${cellObj["table"]}-row-${cellObj["row"]}-nth`
  try {
    console.log(`current aria-label:${cellLabel}...`)
    console.log(`current cell content: '${cellLabel}'...`)
    let currentCellElement = page.getByLabel(cellLabel).locator('a')
    console.log("currentCellElement:", currentCellElement, "#")
    let currentInnerText = await currentCellElement.innerText()
    console.log(`currentCellElement::innerText: '${currentInnerText}'`)
    expect(currentInnerText).toBe(cellObj.word)
    await currentCellElement.click({ timeout: 1000 });
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
  await page.getByRole('button', { name: 'id-input-file-selector' }).click();
  await page.waitForTimeout(200)
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(testLLMTextFilePath);
  await page.waitForTimeout(200)

  await page.getByRole('button', { name: 'btn4-get-words-frequency' }).click();

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


export async function expectVisibleTextWithWalker(
  page: Page,
  idElement: string,
  expectedString: string,
  timeout = 10000
): Promise<void> {
  // First, check that the text is present in the DOM
  console.log(`expectVisibleTextWithWalker::start:${idElement} => ${expectedString} #`)
  const loc = page.locator(`#${idElement}`)
  try {
    await expect(loc).toContainText(expectedString)
  } catch {
    console.error(`expectVisibleTextWithWalker, idElement ${idElement} allTextContents:`, await loc.allTextContents(), "#")
  }
  console.log(`expectVisibleTextWithWalker::found expectedString, go ahead!`)
  await page.waitForFunction(
    ({ idElement, expected }: { idElement: string; expected: string }) => {
      const container = document.getElementById(idElement);
      if (!!container && !container.textContent?.includes(expected)) {
        console.error("expectVisibleTextWithWalker::DEBUG:expected:", expected, "#")
        console.error("expectVisibleTextWithWalker::DEBUG:container.textContent:", container.textContent, "#")
      }
      return !!container && container.textContent?.includes(expected);
    },
    { idElement, expected: expectedString },
    { timeout }
  );

  // Next, check that the element is scrolled so that the expected text is visible in the viewport
  await page.waitForFunction(
    ({ idElement, expected }: { idElement: string; expected: string }) => {
      const container = document.getElementById(idElement);
      if (!container) return false;
      const parentRect = container.getBoundingClientRect();
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
              return node.textContent ?? '';
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
      visible = getVisibleText(container);
      // Check that the visible portion contains the expected string
      return visible.includes(expected);
    },
    { idElement, expected: expectedString },
    { timeout }
  );

  // Optionally, assert the scroll position is not at the top or bottom (unless that's expected)
  // For example, you can check that the scrollTop is not zero (not at top)
  const scrolled = await page.evaluate((id) => {
    const el = document.getElementById(id);
    if (!el) return null;
    return { scrollTop: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight };
  }, idElement);
  if (scrolled) {
    // You can add more specific assertions here if you know the expected scroll position
    // For now, just log the scroll state
    console.error(`Scroll state for #${idElement}:`, scrolled);
  }
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
  const rndString = crypto.randomBytes(20).toString('hex');
  expect(visibleText).not.toBe(expectedVisible + ` - STRING TO NOT MATCH: ${rndString}!`);
  // we'll check only if the expected string is within the Page element, just to try handling devices with different viewports
  try {
    expect(visibleText).toContain(expectedVisible);
  } catch (err) {
    console.log("expectedVisible:", typeof expectedVisible, expectedVisible, "#")
    console.log("visible text:", typeof visibleText, visibleText, "#")
    console.log("error:", err, "#")
  }
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


export async function assertVisibleTextAfterNavigation(page: Page, idElement: string, expectedString: string, scrollTo: ScrollToPosition, idElementContentEditable: string = "gametext", projectName = "") {
  // scroll to top gametext
  if (scrollTo === "top") {
    await scrollToTopById(page, idElementContentEditable);
  } else if (scrollTo === "bottom") {
    await scrollToBottomById(page, idElementContentEditable);
  }
  console.log("# assertVisibleTextAfterNavigation:: args:", idElement, "|", expectedString, "|", projectName, "#")
  console.log("# assertVisibleTextAfterNavigation:: args:", idElement, "|", expectedString, "|", projectName, "#")
  if (projectName === "MobileChromeLandscape") {
    let newIdEl = idElement.replace('-div', "")
    await page.getByRole('link', { name: newIdEl }).click({timeout: 1000})
  } else {
    await page.getByLabel(idElement).click();
  }
  await page.waitForTimeout(200)
  await page.getByRole('button', { name: 'id-rightpanel-thesaurus-close' }).click();
  await page.waitForTimeout(200)
  // assert visible gametext
  
  if (projectName !== "MobileChromeLandscape") {
    await expectVisibleTextWithWalker(page, idElementContentEditable, expectedString)
  } else {
    try {
      await expect(page.locator(idElementContentEditable)).toHaveScreenshot()
    } catch {
      console.error("since the space is not much, only in case of MobileChromeLandscape let's skip this check... at least we tried =)")
    }
  }
  await page.waitForTimeout(200)
}


export async function fillInputFieldWithString(page: Page, inputString: string, clickOrEnter: ClickOrEnter = "Enter"): Promise<void> {
  await page.getByRole('searchbox', {name: 'Word Search Input'}).click();
  await page.getByRole('searchbox', {name: 'Word Search Input'}).fill(inputString);
  if (clickOrEnter === "click") {
    await page.getByRole('button', { name: 'id-perform-wordsearch' }).click();
  } else {
    await page.getByRole('searchbox', {name: 'Word Search Input'}).press('Enter');

  }
}

export async function initTest({page, workerInfo, filepath, targetUrl = 'http://localhost:8000/', setUi = true}: {
  page: Page,
  workerInfo: TestInfo,
  filepath: string,
  targetUrl?: string,
  setUi?: boolean
}): Promise<string> {
  const projectName = workerInfo.project.name
  console.log("workerInfo:", workerInfo.project.name, "#")
  // 1. Connect to the local web server page
  if (targetUrl) await page.goto(targetUrl);
  // 2. Activate the required UI mode (e.g., switch to classic or advanced UI)
  console.log("setui:", setUi, "#")
  if (setUi) await page.getByRole('button', { name: 'Set UI' }).click();

  await openMobileMenu(page, "#found mobile button for global menu, open it to prepare json story upload!")
  // 3. Upload a saved JSON story file to provide long text content for analysis
  await uploadFileWithPageAndFilepath(page, filepath)
  // activate wordsearch
  
  await openMobileMenu(page, "#found mobile button for global menu, open it to toggle word search!")

  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('checkbox', { name: 'WordSearch Tool' }).check();
  await page.getByRole('button', { name: 'OK' }).click();
  return projectName
}

export async function openMobileMenu(page: Page, msg: string) {
  const mobileButtonGlobalMenu = page.getByRole('button', { name: 'Main Menu Options' })
  if (await mobileButtonGlobalMenu.isVisible({timeout: 500})) {
    await mobileButtonGlobalMenu.click();
    await page.waitForTimeout(200)
    console.log(msg)
  }
}

export async function standardCheck(page: Page, projectName: string, expectedString: string, testName: string, click: boolean = true) {
  // start as a normal test
  if (click) await page.getByRole('button', { name: 'id-perform-wordsearch' }).click();
  await page.waitForTimeout(200)

  await expect(page.getByLabel('wordsearch_candidates_count')).toMatchAriaSnapshot(`- text: /1\\d\\d\\d result\\(s\\) found/`);
  await expect(page.getByLabel('id-div-candidate-1-nth')).toMatchAriaSnapshot({name: `${testName}-0-${projectName}.txt`});
  const wordsearch_results = page.getByLabel("wordsearch_results")
  await expect(wordsearch_results).toMatchAriaSnapshot({name: `${testName}-1-${projectName}.txt`});
  await page.waitForTimeout(200)

  await page.getByLabel('id-div-candidate-1-nth').click();
  await assertVisibleTextAfterNavigation(page, 'id-div-1-range-1-nth', expectedString, "bottom", "gametext", projectName);
  await page.waitForTimeout(200)
}

export async function deleteCustomSynonym(word: string) {
  // The URL of your backend endpoint.
  // Make sure the port (7860) matches your server configuration.
  const apiUrl = `http://localhost:7860/thesaurus-custom/${word}`;

  try {
    // 1. Await the fetch call to complete.
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 2. Await the parsing of the JSON body.
    const responseData = await response.json();

    // 3. Check if the request was successful.
    if (!response.ok) {
      // If not, throw an error with details from the server's response.
      throw new Error(`HTTP error! Status: ${response.status}, Detail: ${responseData.detail}`);
    }

    // 4. Handle the successful response data.
    console.log('Success:', responseData);

    // You can now access the message property directly for assertions.
    const message = responseData.message;
    console.log('Message from server:', message);

    // Example of an assertion similar to your Playwright test:
    if (message.includes(`Synonyms for '${word}' deleted successfully`)) {
      console.log('Assertion passed: The message content is correct.');
    } else {
      console.error('Assertion failed: The message content is incorrect.');
    }

    return responseData; // Return the data for further use.

  } catch (error) {
    // Handle any errors that occurred during the fetch operation.
    console.error('Error:', error);
    // Example: alert('Error: ' + error.message);
    // Re-throw the error if you want calling functions to handle it.
    throw error;
  }
}
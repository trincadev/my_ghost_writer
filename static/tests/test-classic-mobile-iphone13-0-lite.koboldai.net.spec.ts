/**
 * Playwright E2E test for My Ghost Writer "Text Stats" feature on mobile (iPhone 13).
 *
 * Test scenario:
 * 1. Connect to the local web server (http://localhost:8000).
 * 2. Activate the UI mode required for testing (e.g., "Set UI").
 * 3. Enable editing and fill the editor with long text content.
 * 4. Activate the "My Ghost Writer" / text stats functionality via settings.
 * 5. Open the mobile menu and interact with the floating dropdown menu content for text stats.
 * 6. Interact with the text stats UI: filter, sort, and verify word frequency tables.
 * 7. Assert correct UI updates and ARIA snapshots for accessibility.
 */
import { test, expect, devices, Page } from "@playwright/test";
import { expectOnlyVisibleTextInElement, scrollToBottomById, uploadFileWithPageAndFilepath } from "./test-helper";

export function scrollToBottom(idElement: string) {
  const element = document.getElementById(idElement);
  if (element !== null) {
    element.scrollTop = element.scrollHeight;
  } else {
    console.error(
      `scrollToBottom::element with id '${idElement}' is null, can't scroll over it!`
    );
  }
}

const testStoryJsonTxt = `${import.meta.dirname}/../../tests/events/very_long_text.json`
/*
test.use({
  ...devices['iPhone 13'],
});*/
const expectedTextArray = [
  `"Why aren't you supposed to do magic?" asked Harry.\n"Oh, well — I was at Hogwarts meself but I — er — got expelled, ter tell yeh the truth. In me third year. They snapped me wand in half an' everything. But Dumbledore let me stay on as gamekeeper. Great man, Dumbledore."
"Why were you expelled?"

"It's gettin' late and we've got lots ter do tomorrow," said Hagrid loudly. "Gotta get up ter town, get all yer books an' that."
He took off his thick black coat and threw it to Harry.
"You can kip under that," he said. "Don' mind if it wriggles a bit, I think I still got a couple o' dormice in one o' the pockets."
Harry woke early the next morning. Although he could`,

  `Mr. and Mrs. Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal, thank you very much. ` +
    `They were the last people you'd expect to be involved in anything strange or mysterious, because they just didn't hold with ` +
    `such nonsense.Mr. Dursley was the director of a firm called Grunnings, which made drills. He was a big, beefy man with hardly` +
    ` any neck, although he did have a very large mustache. Mrs. Dursley was thin and blonde and had nearly twice the usual ` +
    `amount of neck, which came in very useful as she spent so much of her time craning over garden fences, spying on the neighbors.` +
    ` The Dursley s had a small son called Dudley and in their opinion there was no finer boy anywhere.`,
  `"Oh, well — I was at Hogwarts meself but I — er — got expelled, ter tell yeh the truth. In me third year. They snapped me wand in half an' everything. But Dumbledore let me stay on as gamekeeper. Great man, Dumbledore.""Why were you expelled?""It's gettin' late and we've got lots ter do tomorrow," said Hagrid loudly. "Gotta get up ter town, get all yer books an' that."He took off his thick black coat and threw it to Harry."You can kip under that," he said. "Don' mind if it wriggles a bit, I think I still got a couple o' dormice in one o' the pockets."Harry woke early the next morning. Although he could`,
]

test("test My Ghost Writer, iphone 13: navigate between the list/tables containing the stemming and the duplicated words", async ({ page }: { page: Page }) => {
  // 1. Connect to the local web server page
  await page.goto("http://localhost:8000/");
  await expect(page.locator("#welcomecontainer")).toContainText("Set UI");

  // 2. Activate the required UI mode (e.g., switch to classic or advanced UI)
  await page.getByRole("button", { name: "Set UI" }).click();

  // 3. Enable editing and fill the editor with long text content
  await page.getByRole("checkbox", { name: "Allow Editing" }).click();

  // 4. Activate "My Ghost Writer" / text stats functionality via settings
  await page.getByRole('button', { name: 'id-mobile-main-menu-options' }).click();
  await uploadFileWithPageAndFilepath(page, testStoryJsonTxt)
  
  await page.getByRole('button', { name: 'id-mobile-main-menu-options' }).click();
  await page.getByRole("link", { name: "Settings" }).click();
  await page.getByRole("link", { name: "Tokens" }).click();
  await page.getByRole("button", { name: "id-expand-wordsfreqstats" }).click();
  await page
    .getByRole("checkbox", { name: "id-col2-words-frequency-enable" })
    .check();
  await page.getByRole("button", { name: "OK" }).click();
  await page.waitForTimeout(100);

  // 5. Open the mobile menu and interact with the floating dropdown menu content for text stats
  await page.getByRole("button", { name: "id-navtoggler-words-freq" }).click(); // Open mobile floating menu
  await page.getByRole("searchbox", { name: "filter-words-frequency" }).click(); // Focus filter input in floating menu
  await page
    .getByRole("searchbox", { name: "filter-words-frequency" })
    .fill("th"); // Filter for 'th'
  await page
    .getByRole("searchbox", { name: "filter-words-frequency" })
    .press("Enter"); // Apply filter
  // First set of assertions
  // await page.getByLabel('id-current-table-of-words-btn').click();
  await expect(page.getByLabel("id-list-of-words-1-nth")).toContainText(
    "that: 157"
  );
  await page.getByLabel("id-list-of-words-1-nth").click();
  await expect(page.getByLabel("id-table-1-row-0-nth-link")).toContainText(
    "to say that they"
  );
  await page.getByLabel("id-table-1-row-0-nth-link").click();
  // visual snapshot
  await expectOnlyVisibleTextInElement(page, "gametext", expectedTextArray[1]);

  await expect(page.getByLabel("id-current-table-of-words-btn")).toBeVisible();
  await page.getByLabel("id-current-table-of-words-btn").click();
  await expect(page.getByLabel("id-filtered-value")).toContainText("th: 1701");

  // First set of assertions
  await expect(page.getByLabel("id-list-of-words-0-nth")).toContainText(
    "the: 734 "
  );
  await page.getByLabel("id-list-of-words-0-nth").click();
  await expect(page.getByLabel("id-table-0-row-0-nth-link")).toContainText(
    "THE BOY WHO"
  );

  await scrollToBottomById(page, "id-current-table-of-words-scrollable");

  await expect(page.getByLabel("id-table-0-row-733-nth-link")).toBeVisible();
  await expect(page.getByLabel("id-table-0-row-733-nth-link")).toContainText(
    "early the next"
  );
  await page.waitForTimeout(100);

  // 6. Interact with the text stats UI: sort and verify word frequency tables (still within floating menu)
  await page.getByRole("button", { name: "id-navtoggler-words-freq" }).click(); // Reopen floating menu if needed
  await page.getByLabel("id-select-order-by").selectOption("asc"); // Change sort order
  await page.getByRole("searchbox", { name: "filter-words-frequency" }).click();
  await page
    .getByRole("searchbox", { name: "filter-words-frequency" })
    .press("Enter"); // Re-apply filter
  await page.waitForTimeout(100);

  // Second set of assertions
  await expect(page.getByLabel("id-list-of-words-0-nth")).toContainText(
    "anything strange: 1"
  );
  await expect(page.getByLabel("id-list-of-words-1700-nth")).toContainText(
    "the: 734"
  );

  await page.getByLabel("id-list-of-words-1700-nth").click(); // Open word frequency table
  await expect(page.getByLabel("id-table-1700-row-0-nth-link")).toContainText(
    "THE BOY WHO"
  );
  
  await scrollToBottomById(page, "id-current-table-of-words-scrollable");
  const lastTableElement = page.getByLabel("id-table-1700-row-733-nth-link")
  await lastTableElement.click()
  await expect(lastTableElement).toBeVisible();
  await expect(lastTableElement).toContainText(
    "early the next"
  );
  await page.waitForTimeout(100);

  // Edit mode, asserting that there is a single child node containing some short sentences
  await expectOnlyVisibleTextInElement(page, "gametext", expectedTextArray[2]);

  // 7. Assert correct UI updates and ARIA snapshots for accessibility
  // Deactivate edit mode
  await page.getByRole("checkbox", { name: "Allow Editing" }).uncheck();
  await page.waitForTimeout(100);

  await expect(page.getByLabel('id-current-table-of-words-btn')).toBeVisible();
  await page.getByLabel('id-current-table-of-words-btn').click();
  await scrollToBottomById(page, "id-current-table-of-words-scrollable");

  await expect(page.getByLabel("id-list-of-words-1699-nth")).toMatchAriaSnapshot(
    `- text: "that: 157 reps."`
  );

  page.close();
});

import { test, expect } from '@playwright/test';
import { expectOnlyVisibleTextInElement, scrollToBottomById, scrollToTopById, uploadFileWithPageAndFilepath } from './test-helper';

const testStoryJsonTxt = `${import.meta.dirname}/../../tests/events/very_long_text.json`;
const expectedTextArray = [
  `Mr. and Mrs. Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal, thank you very much. They were the last people you'd expect to be involved in anything strange or mysterious, because they just didn't hold with such nonsense.`,
  `\"You can kip under that,\" he said. \"Don' mind if it wriggles a bit, I think I still got a couple o' dormice in one o' the pockets.\"Harry woke early the next morning. Although he could`
]

test('test My Ghost Writer, iPhone 13 landscape: stemming/duplicates', async ({ page }) => {
  await page.goto('http://localhost:8000/');
  await page.getByRole('button', { name: 'Set UI' }).click();
  await page.getByRole('button', { name: 'id-mobile-main-menu-options' }).click();
  await uploadFileWithPageAndFilepath(page, testStoryJsonTxt)
  
  // Activate text stats feature
  await page.getByRole('button', { name: 'id-mobile-main-menu-options' }).click();
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('link', { name: 'Tokens' }).click();
  await page.getByRole('button', { name: 'id-expand-wordsfreqstats' }).click();
  await page.getByRole('checkbox', { name: 'id-col2-words-frequency-enable' }).check();
  await expect(page.getByRole('checkbox', { name: 'id-col2-words-frequency-enable' })).toBeChecked();
  await page.getByRole('button', { name: 'OK' }).click();
  await page.waitForTimeout(100);

  // Open mobile menu for text stats
  await page.getByRole('button', { name: 'id-navtoggler-words-freq' }).click();

  // Interact with filter for stemming/duplicates scenario
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).click();
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).fill('th');
  await page.getByRole('searchbox', { name: 'filter-words-frequency' }).press('Enter');
  await page.waitForTimeout(100);
  await expect(page.getByLabel('id-filtered-value')).toContainText('th:');


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
  await expectOnlyVisibleTextInElement(page, "gametext", expectedTextArray[0]);

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

  console.log("#")
  await scrollToTopById(page, "gametext")
  const gameEditor = page.locator("#gametext")
  await lastTableElement.click()
  // only here assert screenshot to check for correct selection
  await expect(gameEditor).toHaveScreenshot()

  await expect(lastTableElement).toBeVisible();
  await expect(lastTableElement).toContainText(
    "early the next"
  );
  await page.waitForTimeout(100);

  // Edit mode, asserting that there is a single child node containing some short sentences
  await expectOnlyVisibleTextInElement(page, "gametext", expectedTextArray[1]);

  // 7. Assert correct UI updates and ARIA snapshots for accessibility
  // Deactivate edit mode
  await page.getByRole("checkbox", { name: "Allow Editing" }).uncheck();
  await page.waitForTimeout(200);

  await expect(page.getByLabel('id-current-table-of-words-btn')).toBeVisible();
  await page.getByLabel('id-current-table-of-words-btn').click();
  await scrollToBottomById(page, "id-list-of-words-scrollable");
  await expect(page.getByLabel("id-list-of-words-1699-nth")).toMatchAriaSnapshot(
    `- text: "that: 157 reps."`
  );

  page.close();
});

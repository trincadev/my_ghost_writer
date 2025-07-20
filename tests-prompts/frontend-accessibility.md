# Improve the frontend accessibility, also for writing better playwright tests

You are tasked with incrementally improving the accessibility and maintainability of a vanilla HTML/JS/CSS codebase. Follow these guidelines:

## Code deduplication

- there are some functions like `createButtonById()`, `createSelectWithOptListById()`, `createElementById()`

## Semantic HTML, ARIA, and Data Attributes

- Prefer semantic HTML elements (e.g., `<button>`, `<a>`, `<header>`, `<nav>`, etc.) for structure and interactivity.
- Use ARIA attributes to enhance or clarify accessibility, especially when semantic HTML alone is not sufficient. Semantic HTML and ARIA can be used together.
- If neither semantic HTML nor ARIA attributes are suitable for identification or testing, use custom data-* attributes (e.g., `data-testid`, `data-label`), especially to support Playwright test selectors and avoid breaking the test suite.

## Accessibility Best Practices

- Ensure all interactive elements are keyboard-accessible.
- Provide visible focus indicators for interactive elements.
- Use sufficient color contrast for text and UI elements.
- Ensure form elements have associated labels.
- Use descriptive link/button text.
- Add alt text to images and icons.
- Refactor duplicated code into reusable functions or components.

## Incremental Changes

- Make one small, focused change at a time.
- After each change, update the Playwright test suite to reflect the modification and verify accessibility improvements.
- Never break the Playwright test suite; preserve or update `data-*` attributes as needed for selectors.

## Test Suite Updates

- After every code change, review and update Playwright tests to match the new code and cover new accessibility features.
- Ask the user for review and approval.

## General Guidance

- Do not distort the original JS/HTML/CSS logic or design.
- Suggest other accessibility and code quality best practices as you proceed.

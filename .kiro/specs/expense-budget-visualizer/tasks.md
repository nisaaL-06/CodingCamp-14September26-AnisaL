# Implementation Plan: Expense & Budget Visualizer

## Overview

The core application already runs. This plan covers six targeted fixes to close known requirement deviations in `js/script.js` and `index.html`, followed by a full test suite (property-based tests with fast-check, example-based unit tests, and a manual smoke-test checklist). All implementation is in vanilla JavaScript with no build step; tests run via a Node.js + fast-check setup loaded through a `<script type="module">` test harness.

---

## Tasks

- [x] 1. Fix localStorage storage key to match requirement
  - [x] 1.1 Change `STORAGE_KEY` constant in `js/script.js` from `'budget_expenses'` to `'transactions'`
    - Update the constant declaration at the top of the file
    - Verify `saveExpenses()` and `loadExpenses()` reference `STORAGE_KEY` (no hard-coded strings)
    - _Requirements: 9.1_

- [x] 2. Add upper-bound amount validation
  - [~] 2.1 Extend the amount validation block in `addExpense()` to reject values greater than 999,999,999.99
    - Change the guard from `Number(rawAmt) <= 0` to `Number(rawAmt) <= 0 || Number(rawAmt) > 999999999.99`
    - Update the error message to read: `'Please enter a valid amount (Rp 1 – Rp 999,999,999.99).'`
    - _Requirements: 2.3_

- [x] 3. Add per-field inline error messages
  - [~] 3.1 Add individual error `<p>` elements in `index.html` adjacent to `#itemName` and `#amount` inputs, replacing the single shared `#errorMsg`
    - Add `<p class="error-msg field-error" id="errorName"></p>` immediately after the `#itemName` input
    - Add `<p class="error-msg field-error" id="errorAmount"></p>` immediately after the `#amount` input
    - Remove (or repurpose) the existing shared `#errorMsg` element
    - _Requirements: 2.5_
  - [x] 3.2 Update `js/script.js` to target per-field error elements
    - Add DOM references: `errorNameEl`, `errorAmountEl`
    - Replace `showError()` / `clearError()` calls with field-specific helpers: `showNameError(msg)`, `showAmountError(msg)`, `clearErrors()`
    - `clearErrors()` must clear both field error elements
    - On name validation failure: call `showNameError(...)`, focus `#itemName`, return
    - On amount validation failure: call `showAmountError(...)`, focus `#amount`, return
    - On success: call `clearErrors()` before creating the transaction
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 4. Add transaction count to Clear All confirmation dialog
  - [x] 4.1 Update the `clearAllBtn` click handler in `js/script.js` to embed the transaction count in the `confirm()` string
    - Change message to: `` `Delete all ${expenses.length} expense${expenses.length !== 1 ? 's' : ''}? This cannot be undone.` ``
    - _Requirements: 6.2_

- [x] 5. Add Storage write rollback on mutation failure
  - [x] 5.1 Add rollback logic to `deleteExpense()` for storage failure
    - Save a snapshot of `expenses` before filtering: `const prev = expenses`
    - Wrap `saveExpenses()` return value or detect failure; update `saveExpenses()` to return `true` on success and `false` on failure
    - If `saveExpenses()` returns `false`, restore `expenses = prev`, call `render()`, and display an error via `showAmountError` or a dedicated status message indicating the deletion could not be saved
    - _Requirements: 5.3_
  - [x] 5.2 Add rollback logic to `addExpense()` for storage failure
    - After `expenses.unshift(expense)`, if `saveExpenses()` returns `false`, call `expenses.shift()` to undo the prepend, call `render()`, and display a storage error message
    - _Requirements: 3.5_

- [ ] 6. Checkpoint — verify deviation fixes
  - Ensure all six deviation fixes work correctly end-to-end; confirm the app still loads, adds, deletes, and clears transactions without error. Ask the user if questions arise.

- [x] 7. Add `Array.isArray()` guard in `loadExpenses()`
  - [x] 7.1 Update `loadExpenses()` in `js/script.js` to validate the parsed value is an array
    - After `JSON.parse(raw)`, add: `if (!Array.isArray(parsed)) { console.warn('LocalStorage data is not an array; resetting.'); return []; }`
    - _Requirements: 9.3_

- [ ] 8. Set up fast-check property-based test harness
  - [ ] 8.1 Create `tests/setup.js` that imports fast-check via CDN-compatible ESM shim or installs fast-check as a dev dependency via npm, and exports a `runTests()` entry point
    - Create `tests/` directory
    - Add `package.json` at workspace root (if absent) with `"type": "module"` and `"devDependencies": { "fast-check": "3.15.0" }`
    - Create `tests/helpers.js` exporting: `arbitraryTransaction()` fast-check arbitrary, `makeMockStorage()` (returns a mock localStorage object), and `isolateModule()` (re-imports a fresh copy of script logic for each test run)
    - _Requirements: 11.4_
  - [ ]* 8.2 Write property test for Property 1 — whitespace-only names are always rejected
    - **Property 1: Whitespace-only names are always rejected**
    - **Validates: Requirements 2.1, 1.6**
    - Use `fc.string().filter(s => s.trim() === '')` as generator
    - Assert `expenses.length` is unchanged after each attempt
  - [ ]* 8.3 Write property test for Property 2 — invalid amounts are always rejected
    - **Property 2: Invalid amounts are always rejected**
    - **Validates: Requirements 2.2, 2.3, 1.6**
    - Use `fc.oneof(fc.constant(''), fc.constant('abc'), fc.float({ max: 0 }), fc.float({ min: 1000000000 }))` as generator
    - Assert `expenses.length` is unchanged after each attempt
  - [ ]* 8.4 Write property test for Property 3 — valid add creates correctly shaped transaction and prepends it
    - **Property 3: Adding a valid expense creates a correctly shaped transaction and prepends it**
    - **Validates: Requirements 3.1, 3.2, 1.1, 1.2, 1.3**
    - Use `fc.string({ minLength: 1 }).filter(s => s.trim().length > 0)`, `fc.float({ min: 0.01, max: 999999999 })`, `fc.constantFrom('Food', 'Transport', 'Fun')`
    - Assert result is at index 0, length increased by 1, all fields correctly shaped

- [ ] 9. Write property tests for storage and data integrity
  - [ ]* 9.1 Write property test for Property 4 — localStorage round-trip preserves all transaction data
    - **Property 4: localStorage round-trip preserves all transaction data**
    - **Validates: Requirements 3.4, 9.1, 9.2**
    - Use `fc.array(arbitraryTransaction())` as generator
    - Assert every `name`, `amount`, `category`, `date` field is identical after save+load and order is preserved
  - [ ]* 9.2 Write property test for Property 5 — deleting a transaction removes exactly that entry
    - **Property 5: Deleting a transaction removes exactly that entry**
    - **Validates: Requirements 5.2**
    - Use `fc.array(arbitraryTransaction(), { minLength: 1 })` + `fc.integer()` (random index)
    - Assert no entry with deleted `id` remains, length is exactly one less
  - [ ]* 9.3 Write property test for Property 6 — total display always equals the exact sum
    - **Property 6: Total display always equals the exact sum of all transaction amounts**
    - **Validates: Requirements 7.1, 7.2**
    - Use `fc.array(fc.float({ min: 0.01, max: 999999999 }))`
    - Assert `renderTotal()` output equals `'Rp ' + total.toLocaleString('id-ID')`; empty array produces `'Rp 0'`

- [ ] 10. Write property tests for rendering correctness
  - [ ]* 10.1 Write property test for Property 7 — list renders all fields with correct category colours newest-first
    - **Property 7: Rendering the transaction list shows all required fields with correct category colors in newest-first order**
    - **Validates: Requirements 4.1, 4.2, 4.3, 5.1**
    - Use `fc.array(arbitraryTransaction(), { minLength: 1 })`
    - Assert each item has icon, name, category label, date, amount with "−" prefix, delete button, and `data-category` attribute; items in same order as `expenses[]`
  - [ ]* 10.2 Write property test for Property 8 — chart segments reflect current category totals and colors
    - **Property 8: Chart segments reflect current category totals and colors**
    - **Validates: Requirements 8.2, 8.5**
    - Use `fc.array(arbitraryTransaction(), { minLength: 1 })`
    - Assert `data.labels` equals categories with positive totals; `data.datasets[0].data` values match sums; `backgroundColor` values match `CATEGORY_META` colors
  - [ ]* 10.3 Write property test for Property 9 — tooltip callback formats amount and percentage correctly
    - **Property 9: Tooltip callback formats amount and percentage correctly for any value/total pair**
    - **Validates: Requirements 8.3**
    - Use `fc.float({ min: 0, max: 10000 })`, `fc.float({ min: 0.01, max: 100000 })`
    - Assert returned string contains `formatCurrency(val)` and `(val / total * 100).toFixed(1) + '%'`
  - [ ]* 10.4 Write property test for Property 10 — clear-all on any non-empty list results in completely empty state
    - **Property 10: Clear-all on any non-empty list results in completely empty state**
    - **Validates: Requirements 6.3**
    - Use `fc.array(arbitraryTransaction(), { minLength: 1 })`
    - Assert `expenses.length === 0`, storage reflects empty array, `#emptyMsg` and `#noDataMsg` are visible
  - [ ]* 10.5 Write property test for Property 11 — `escapeHTML` neutralises all HTML-special characters
    - **Property 11: escapeHTML neutralises all HTML-special characters**
    - **Validates: Requirements 11.2**
    - Use `fc.string()` (any string)
    - Assert result contains no unescaped `&`, `<`, `>`, `"`, `'` characters

- [ ] 11. Checkpoint — ensure all property tests pass
  - Run all fast-check property tests (minimum 100 iterations each). Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Write example-based unit tests
  - [ ]* 12.1 Write unit tests for initial state on page load
    - Assert `#totalBalance` displays `Rp 0`, empty-state messages are visible, all form fields present with correct attributes
    - _Requirements: 7.2, 4.4, 1.1, 1.2, 1.3, 1.4_
  - [ ]* 12.2 Write unit tests for Enter key submission
    - Assert pressing Enter on `#itemName` and `#amount` triggers `addExpense()` identically to clicking `#addBtn`
    - _Requirements: 1.5_
  - [ ]* 12.3 Write unit tests for form reset after successful add
    - Assert `#itemName` and `#amount` are empty and focus is on `#itemName` after adding any transaction
    - _Requirements: 1.7, 3.3_
  - [ ]* 12.4 Write unit tests for field error persistence until resubmit
    - Assert that after triggering a validation error, the error message element remains populated until the next form submission attempt
    - _Requirements: 2.5_
  - [ ]* 12.5 Write unit tests for Clear All cancel behaviour
    - Assert clicking "Clear All" then cancelling leaves `expenses[]` and the rendered UI unchanged
    - _Requirements: 6.4_
  - [ ]* 12.6 Write unit tests for Clear All on empty list
    - Assert clicking "Clear All" when `expenses.length === 0` shows no dialog and makes no changes
    - _Requirements: 6.5_
  - [ ]* 12.7 Write unit tests for unknown category fallback rendering
    - Assert a transaction with category `'Other'` renders with grey border (`#aaa`) and 💸 icon
    - _Requirements: 4.3_
  - [ ]* 12.8 Write unit tests for `loadExpenses()` with absent key
    - Assert `localStorage.getItem` returning `null` causes `loadExpenses()` to return `[]` without error
    - _Requirements: 9.3_
  - [ ]* 12.9 Write unit tests for `loadExpenses()` with invalid JSON
    - Assert corrupted JSON in storage causes `loadExpenses()` to return `[]` and call `console.warn`
    - _Requirements: 9.3_
  - [ ]* 12.10 Write unit tests for chart hidden when expense list is empty
    - Assert that after `expenses = []`, `renderChart()` hides the `<canvas>` element and shows `#noDataMsg`
    - _Requirements: 8.4_
  - [ ]* 12.11 Write unit tests for chart update-in-place on second transaction
    - Assert that adding a second transaction calls `pieChart.update()` rather than creating a new `Chart` instance
    - _Requirements: 8.5_

- [ ] 13. Create manual smoke test checklist document
  - [ ] 13.1 Create `tests/smoke-tests.md` with the six manual/browser smoke test scenarios from `design.md`
    - Scenario 1: Page refresh persistence — add transactions, refresh, verify they reappear
    - Scenario 2: Delete last transaction — add one, delete it, verify empty-state messages appear
    - Scenario 3: All three categories — add Food, Transport, Fun, verify three doughnut segments
    - Scenario 4: Narrow viewport (< 400 px) — chart ≤ 200 px wide, interactive elements ≥ 44×44 px
    - Scenario 5: localStorage blocked — mock `setItem` to throw, verify app initialises with `[]`, shows `console.warn`, does not crash
    - Scenario 6: Long item name — 100-character name truncates with `text-overflow: ellipsis`
    - _Requirements: 9.2, 5.2, 8.2, 10.2, 10.4, 9.3_

- [ ] 14. Final checkpoint — full test pass
  - Run all property-based and unit tests. Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; all six deviation-fix tasks (1–5, 7) are mandatory
- Each task references specific requirements for full traceability
- `saveExpenses()` must be updated to return a boolean (`true` = success, `false` = failure) before tasks 5.1 and 5.2 are implemented
- The fast-check test harness (task 8.1) is a prerequisite for all `8.*`–`10.*` property test tasks
- Property tests use a minimum of 100 iterations per property as specified in the design
- All user-supplied text must continue to be inserted via `escapeHTML()` or text nodes — never raw `innerHTML` with untrusted data (Req 11.2)
- Adding a new category in future requires only: updating `CATEGORY_META` in `js/script.js` and adding an `<option>` in `index.html` (Req 11.3)

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "7.1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "4.1"] },
    { "id": 2, "tasks": ["3.2", "5.1", "5.2"] },
    { "id": 3, "tasks": ["8.1"] },
    { "id": 4, "tasks": ["8.2", "8.3", "8.4", "9.1", "9.2", "9.3", "10.5"] },
    { "id": 5, "tasks": ["10.1", "10.2", "10.3", "10.4"] },
    { "id": 6, "tasks": ["12.1", "12.2", "12.3", "12.4", "12.5", "12.6", "12.7", "12.8", "12.9", "12.10", "12.11"] },
    { "id": 7, "tasks": ["13.1"] }
  ]
}
```

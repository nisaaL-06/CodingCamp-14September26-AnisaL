# Requirements Document

## Introduction

The Expense & Budget Visualizer is a mobile-friendly, single-page web application that enables users to track their personal spending. Users can add expense transactions with a name, amount, and category; view a running total of all spending; browse a scrollable transaction history; delete individual entries; and see a doughnut chart that breaks down spending by category. All data is persisted in the browser's Local Storage so it survives page refreshes. The application is built with HTML, CSS, and vanilla JavaScript only — no frameworks, no backend.

---

## Glossary

- **App**: The Expense & Budget Visualizer single-page web application.
- **Transaction**: A single expense record containing an item name, a monetary amount, a category, and a timestamp.
- **Transaction_List**: The scrollable `<ul>` element that displays all saved Transactions.
- **Form**: The input section that collects item name, amount, and category before a Transaction is created.
- **Validator**: The client-side logic that checks Form inputs before a Transaction is created.
- **Storage**: The browser's `localStorage` API used to persist Transaction data.
- **Chart**: The doughnut chart rendered by Chart.js that visualises spending distribution by category.
- **Total_Display**: The UI element that shows the sum of all Transaction amounts.
- **Category**: One of the three fixed spending labels — Food, Transport, or Fun.

---

## Requirements

### Requirement 1: Expense Input Form

**User Story:** As a user, I want to fill in an item name, amount, and category so that I can record a new expense.

#### Acceptance Criteria

1. THE Form SHALL provide a text input field for the item name, accepting up to 100 characters.
2. THE Form SHALL provide a numeric input field for the expense amount in Indonesian Rupiah (Rp), accepting values from Rp 1 to Rp 999,999,999.
3. THE Form SHALL provide a dropdown selector with exactly three options: Food, Transport, and Fun.
4. THE Form SHALL provide a submit button labelled "Add Expense".
5. WHEN the user presses the Enter key while focused on any Form field and all fields contain valid values, THE Form SHALL submit the expense entry.
6. WHEN the user submits the Form with invalid or empty values, THE Form SHALL NOT submit and SHALL display appropriate error messages without clearing valid field values.
7. WHEN a Transaction is successfully created, THE Form SHALL clear the item name and amount fields and reset the category to its default option.

---

### Requirement 2: Input Validation

**User Story:** As a user, I want the app to tell me when I have entered invalid data so that I do not accidentally add incomplete transactions.

#### Acceptance Criteria

1. WHEN the user submits the Form with an item name field that is empty or contains only whitespace characters, THE Validator SHALL display an error message indicating the item name is required, move focus to the item name field, and not create a Transaction.
2. WHEN the user submits the Form with an empty amount field, THE Validator SHALL display an error message indicating the amount is required, move focus to the amount field, and not create a Transaction.
3. WHEN the user submits the Form with an amount value that is not a number or is less than or equal to zero or is greater than 999,999,999.99, THE Validator SHALL display an error message indicating the amount must be a positive number up to 999,999,999.99, move focus to the amount field, and not create a Transaction.
4. WHEN all Form fields contain valid values — item name is at least 1 non-whitespace character and amount is a number between 0.01 and 999,999,999.99 inclusive — THE Validator SHALL clear all existing field error messages before creating the Transaction.
5. IF a field-level error message is displayed, THEN THE Validator SHALL render that error message adjacent to its corresponding field and keep it visible until the user resubmits the Form.

---

### Requirement 3: Transaction Creation

**User Story:** As a user, I want valid expense entries to be saved and displayed immediately so that I can see my spending history update in real time.

#### Acceptance Criteria

1. WHEN the Form is submitted with a non-empty item name (1–100 characters), an amount greater than 0 and at most 999,999,999.99, and a selected Category, THE App SHALL create a Transaction record containing: a unique identifier, the item name, the amount rounded to two decimal places, the selected Category, and the system date at submission time formatted as `DD Mon YYYY` in the `id-ID` locale.
2. WHEN a Transaction is created, THE App SHALL prepend it to the Transaction_List so the newest entry appears at the top.
3. WHEN a Transaction is created, THE App SHALL clear the item name and amount fields, reset the Category selection to its default option, and return focus to the item name field.
4. WHEN a Transaction is created, THE App SHALL save the updated Transaction_List to Storage.
5. IF saving to Storage fails, THEN THE App SHALL display an error message indicating the transaction was not saved and preserve the Transaction_List in its current in-memory state.

---

### Requirement 4: Transaction List Display

**User Story:** As a user, I want to see all my recorded expenses in a list so that I can review my spending history.

#### Acceptance Criteria

1. THE Transaction_List SHALL display each Transaction as a list item showing the category icon, item name, category label with date, and formatted amount, ordered from most recent to oldest by date.
2. THE Transaction_List SHALL display the amount for each Transaction prefixed with "−" (minus sign) and formatted using the `id-ID` locale currency style (e.g., `Rp 1.000` for 1000, `Rp 1.000.000` for 1000000).
3. THE Transaction_List SHALL display each list item with a left border colour corresponding to the Transaction's Category: red (`#ff6384`) for Food, blue (`#36a2eb`) for Transport, and yellow (`#ffce56`) for Fun; IF the Transaction's Category does not match any defined Category, THEN THE Transaction_List SHALL display that list item with a neutral grey left border.
4. WHEN the Transaction_List contains no Transactions, THE App SHALL display a text message indicating that no transactions have been recorded, in place of the list.
5. THE Transaction_List SHALL be contained within a vertically scrollable region so that all list items are reachable by scrolling when the total list height exceeds the height of the visible container.

---

### Requirement 5: Delete Individual Transactions

**User Story:** As a user, I want to remove a specific transaction so that I can correct mistakes.

#### Acceptance Criteria

1. THE Transaction_List SHALL render a delete button on each list item, uniquely associated with that Transaction's identifier.
2. WHEN the user activates a delete button, THE App SHALL remove the Transaction identified by that button from the in-memory list, update Storage, and re-render the Transaction_List, Total_Display, and Chart.
3. IF updating Storage fails after a delete action, THEN THE App SHALL revert the in-memory Transaction_List to its previous state and display an error message indicating the deletion could not be saved.
4. WHEN all Transactions are deleted individually and the Transaction_List becomes empty, THE App SHALL display a message indicating there are no transactions to show.

---

### Requirement 6: Clear All Transactions

**User Story:** As a user, I want to delete all transactions at once so that I can reset my expense history quickly.

#### Acceptance Criteria

1. THE App SHALL display a "Clear All" button in the transaction list section header.
2. WHEN the user activates the "Clear All" button and at least one Transaction exists, THE App SHALL display a confirmation dialog showing the number of transactions to be deleted and offering two explicit actions: confirm deletion or cancel.
3. WHEN the user confirms the clear-all action, THE App SHALL remove all Transactions from the in-memory list, clear Storage, and re-render the Transaction_List, Total_Display, and Chart.
4. WHEN the user cancels the clear-all confirmation dialog, THE App SHALL close the dialog and make no changes to the Transaction_List or Storage.
5. IF the Transaction_List is empty when the user activates the "Clear All" button, THEN THE App SHALL take no action.

---

### Requirement 7: Total Spending Display

**User Story:** As a user, I want to see my total spending at the top of the page so that I can understand my overall budget situation at a glance.

#### Acceptance Criteria

1. THE Total_Display SHALL show the sum of all Transaction amounts formatted using the `id-ID` locale currency style (e.g., `Rp 1.000` for 1000).
2. THE Total_Display SHALL show `Rp 0` when no Transactions exist.
3. WHEN a Transaction is added or deleted, THE App SHALL recalculate and update the Total_Display within 100 milliseconds without requiring a page reload.

---

### Requirement 8: Spending Distribution Chart

**User Story:** As a user, I want to see a chart of my spending by category so that I understand where my money is going.

#### Acceptance Criteria

1. THE Chart SHALL be a doughnut chart rendered by Chart.js inside a `<canvas>` element.
2. THE Chart SHALL display one segment per Category that has at least one Transaction, using the colours: red (`#ff6384`) for Food, blue (`#36a2eb`) for Transport, and yellow (`#ffce56`) for Fun.
3. WHEN the user hovers over a Chart segment, THE Chart SHALL display a tooltip showing the total amount formatted in `id-ID` locale and the percentage of that Category's spending rounded to one decimal place.
4. WHEN all Transactions are removed and no Category has a positive total, THE App SHALL hide the Chart canvas and display a "No expense data yet" message.
5. WHEN a Transaction is added or deleted and at least one Category has a positive total, THE App SHALL update the Chart data and re-render it within 100 milliseconds.

---

### Requirement 9: Data Persistence

**User Story:** As a user, I want my transactions to be saved locally so that my data is not lost when I refresh the page.

#### Acceptance Criteria

1. WHEN a Transaction is created or deleted, THE Storage SHALL be updated with the current serialised transaction array under the key `"transactions"`.
2. WHEN the App initialises on page load, THE App SHALL read the transaction array from Storage under the key `"transactions"` and render the Transaction_List, Total_Display, and Chart using the loaded data.
3. IF Storage is unavailable, contains invalid JSON, or contains valid JSON that is not an array, THEN THE App SHALL log a warning to the browser console and initialise with an empty transaction list without throwing an unhandled error.

---

### Requirement 10: Responsive and Mobile-Friendly Layout

**User Story:** As a user, I want to use the app comfortably on my mobile phone so that I can track expenses anywhere.

#### Acceptance Criteria

1. THE App SHALL render a single-column layout with a maximum content width of 520 px, centred horizontally on wider viewports.
2. THE App SHALL apply a minimum font size of 14 px and ensure all interactive elements have a minimum tap target size of 44×44 px on viewports narrower than 400 px.
3. THE App SHALL NOT use any CSS or JavaScript framework; all styles SHALL be contained in a single file at `css/style.css` and all logic in a single file at `js/script.js`.
4. THE Chart SHALL maintain a square aspect ratio and SHALL NOT exceed 260 px in width on viewports 400 px wide or wider, and SHALL NOT exceed 200 px in width on viewports narrower than 400 px.

---

### Requirement 11: Code Quality and Structure

**User Story:** As a developer, I want the codebase to be clean and maintainable so that future changes are easy to make.

#### Acceptance Criteria

1. THE App SHALL use semantic HTML5 elements (`<header>`, `<section>`, `<ul>`, `<li>`, `<button>`) to structure the page.
2. THE App SHALL insert all user-supplied text into the DOM using text node creation or equivalent DOM-safe methods to prevent cross-site scripting.
3. THE App SHALL define category metadata (icon, colour) in a single JavaScript object so that adding a new category requires a change in only one place.
4. THE App SHALL define at least four clearly named functions covering these distinct concerns: input reading and validation, transaction mutation, Storage access, and rendering.

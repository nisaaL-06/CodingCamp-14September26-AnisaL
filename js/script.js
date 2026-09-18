/* ===========================
   Expense & Budget Visualizer
   Vanilla JS + Chart.js + LocalStorage
=========================== */

// ─── State ───────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'transactions';
let expenses = loadExpenses();
let pieChart  = null;

// ─── Category helpers ─────────────────────────────────────────────────────────
const CATEGORY_META = {
  Food:      { icon: '🍔', color: '#ff6384' },
  Transport: { icon: '🚌', color: '#36a2eb' },
  Fun:       { icon: '🎮', color: '#ffce56' },
};

// ─── DOM references ───────────────────────────────────────────────────────────
const itemNameEl      = document.getElementById('itemName');
const amountEl        = document.getElementById('amount');
const categoryEl      = document.getElementById('category');
const addBtn          = document.getElementById('addBtn');
const clearAllBtn     = document.getElementById('clearAllBtn');
const errorNameEl     = document.getElementById('errorName');
const errorAmountEl   = document.getElementById('errorAmount');
const transactionList = document.getElementById('transactionList');
const emptyMsg        = document.getElementById('emptyMsg');
const totalBalanceEl  = document.getElementById('totalBalance');
const noDataMsg       = document.getElementById('noDataMsg');

// ─── Add expense ──────────────────────────────────────────────────────────────
addBtn.addEventListener('click', addExpense);

[itemNameEl, amountEl].forEach(el =>
  el.addEventListener('keydown', e => { if (e.key === 'Enter') addExpense(); })
);

function addExpense() {
  const name     = itemNameEl.value.trim();
  const rawAmt   = amountEl.value.trim();
  const category = categoryEl.value;

  // Validation
  if (!name) {
    showNameError('Please enter an item name.');
    itemNameEl.focus();
    return;
  }
  if (!rawAmt || isNaN(rawAmt) || Number(rawAmt) <= 0 || Number(rawAmt) > 999999999.99) {
    showAmountError('Please enter a valid amount (Rp 1 – Rp 999,999,999.99).');
    amountEl.focus();
    return;
  }

  clearErrors();

  const expense = {
    id:       Date.now(),
    name,
    amount:   parseFloat(Number(rawAmt).toFixed(2)),
    category,
    date:     new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
  };

  expenses.unshift(expense); // newest first

  if (!saveExpenses()) {
    expenses.shift(); // undo the prepend
    render();
    showAmountError('Storage error: transaction could not be saved.');
    return;
  }

  render();

  // Reset form
  itemNameEl.value = '';
  amountEl.value   = '';
  itemNameEl.focus();
}

// ─── Delete expense ───────────────────────────────────────────────────────────
function deleteExpense(id) {
  const prev = expenses;
  expenses = expenses.filter(e => e.id !== id);
  if (!saveExpenses()) {
    expenses = prev;
    render();
    showAmountError('Could not save deletion. Please try again.');
    return;
  }
  render();
}

// ─── Clear all ────────────────────────────────────────────────────────────────
clearAllBtn.addEventListener('click', () => {
  if (expenses.length === 0) return;
  if (confirm(`Delete all ${expenses.length} expense${expenses.length !== 1 ? 's' : ''}? This cannot be undone.`)) {
    expenses = [];
    saveExpenses();
    render();
  }
});

// ─── Render ───────────────────────────────────────────────────────────────────
function render() {
  renderTotal();
  renderList();
  renderChart();
}

function renderTotal() {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  totalBalanceEl.textContent = formatCurrency(total);
}

function renderList() {
  transactionList.innerHTML = '';

  if (expenses.length === 0) {
    emptyMsg.style.display = 'block';
    return;
  }

  emptyMsg.style.display = 'none';

  expenses.forEach(e => {
    const meta = CATEGORY_META[e.category] || { icon: '💸', color: '#aaa' };

    const li = document.createElement('li');
    li.className = 'transaction-item';
    li.dataset.category = e.category;
    li.innerHTML = `
      <span class="tx-icon">${meta.icon}</span>
      <div class="tx-info">
        <div class="tx-name">${escapeHTML(e.name)}</div>
        <div class="tx-meta">${e.category} • ${e.date}</div>
      </div>
      <span class="tx-amount">− ${formatCurrency(e.amount)}</span>
      <button class="tx-delete" aria-label="Delete ${escapeHTML(e.name)}">🗑️</button>
    `;

    li.querySelector('.tx-delete').addEventListener('click', () => deleteExpense(e.id));
    transactionList.appendChild(li);
  });
}

function renderChart() {
  const totals = { Food: 0, Transport: 0, Fun: 0 };
  expenses.forEach(e => { totals[e.category] += e.amount; });

  const categories = Object.keys(totals).filter(c => totals[c] > 0);
  const data       = categories.map(c => totals[c]);
  const colors     = categories.map(c => CATEGORY_META[c].color);

  const hasData = data.length > 0;
  noDataMsg.style.display = hasData ? 'none' : 'block';

  if (pieChart) {
    pieChart.data.labels                      = categories;
    pieChart.data.datasets[0].data            = data;
    pieChart.data.datasets[0].backgroundColor = colors;
    pieChart.data.datasets[0].borderColor     = colors.map(() => '#ffffff');
    pieChart.update();
  } else {
    const ctx = document.getElementById('pieChart').getContext('2d');
    pieChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [{
          data,
          backgroundColor: colors,
          borderColor:     colors.map(() => '#ffffff'),
          borderWidth:     3,
          hoverOffset:     8,
        }],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: true,
        cutout:              '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding:   16,
              font:      { size: 13 },
              boxWidth:  14,
              boxHeight: 14,
            },
          },
          tooltip: {
            callbacks: {
              label: ctx => {
                const val   = ctx.parsed;
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct   = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                return ` ${formatCurrency(val)}  (${pct}%)`;
              },
            },
          },
        },
      },
    });
  }
}

function saveExpenses() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    return true;
  } catch (e) {
    console.warn('LocalStorage write failed:', e);
    return false;
  }
}

function loadExpenses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn('LocalStorage data is not an array; resetting.');
      return [];
    }
    return parsed;
  } catch (e) {
    console.warn('LocalStorage read failed:', e);
    return [];
  }
}

function formatCurrency(amount) {
  return 'Rp ' + amount.toLocaleString('id-ID');
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showNameError(msg) {
  errorNameEl.textContent = msg;
}

function showAmountError(msg) {
  errorAmountEl.textContent = msg;
}

function clearErrors() {
  errorNameEl.textContent   = '';
  errorAmountEl.textContent = '';
}

render();

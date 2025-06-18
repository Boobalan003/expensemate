// 🌟 Element Selections
const form = document.getElementById('expense-form');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const dateInput = document.getElementById('date');
const noteInput = document.getElementById('note');
const expenseList = document.getElementById('expense-list');
const totalAmount = document.getElementById('total-amount');

let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let editingId = null;
let chart;

// 🌟 Initial Setup
renderExpenses();     // Show saved expenses on load
updateTotal();        // Show total spent
updateSummary();      // Show monthly and yearly summaries
updateChart();        // Build the pie chart

// ✅ When the form is submitted
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const newExpense = {
    id: editingId || Date.now(),
    amount: parseFloat(amountInput.value),
    category: categoryInput.value.trim(),
    date: dateInput.value,
    note: noteInput.value.trim() || "No note"
  };

  if (editingId) {
    expenses = expenses.filter(exp => exp.id !== editingId);
    editingId = null;
  }

  expenses.push(newExpense);
  saveExpenses();
  renderExpenses();
  updateTotal();
  updateSummary();
  updateChart();
  form.reset();
});

function renderExpenses(list = expenses) {
  expenseList.innerHTML = '';

  if (list.length === 0) {
    expenseList.innerHTML = `<p class="text-gray-400 text-center">No expenses yet.</p>`;
    return;
  }

  list.forEach(exp => {
    const div = document.createElement('div');
    div.className = 'bg-gray-800 p-3 rounded flex justify-between items-center shadow';
    div.innerHTML = `
      <div>
        <p class="text-lg font-semibold">₹${exp.amount} - ${exp.category}</p>
        <p class="text-sm text-gray-400">${exp.date} | ${exp.note}</p>
      </div>
      <div class="flex gap-2">
        <button onclick="editExpense(${exp.id})" class="text-blue-400 hover:text-blue-600">✏️</button>
        <button onclick="deleteExpense(${exp.id})" class="text-red-400 hover:text-red-600">🗑️</button>
      </div>
    `;
    expenseList.appendChild(div);
  });
}

function editExpense(id) {
  const exp = expenses.find(e => e.id === id);
  if (!exp) return;

  amountInput.value = exp.amount;
  categoryInput.value = exp.category;
  dateInput.value = exp.date;
  noteInput.value = exp.note;

  editingId = id;
}

function deleteExpense(id) {
  expenses = expenses.filter(exp => exp.id !== id);
  saveExpenses();
  renderExpenses();
  updateTotal();
  updateSummary();
  updateChart();
}

function updateTotal(list = expenses) {
  const total = list.reduce((sum, exp) => sum + exp.amount, 0);
  totalAmount.textContent = `₹${total.toFixed(2)}`;
}

function updateSummary() {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  let monthlyTotal = 0;
  let yearlyTotal = 0;

  expenses.forEach(exp => {
    const expDate = new Date(exp.date);
    if (expDate.getFullYear() === thisYear) {
      yearlyTotal += exp.amount;
      if (expDate.getMonth() === thisMonth) {
        monthlyTotal += exp.amount;
      }
    }
  });

  document.getElementById('monthly-total').textContent = `₹${monthlyTotal.toFixed(2)}`;
  document.getElementById('yearly-total').textContent = `₹${yearlyTotal.toFixed(2)}`;
}

function saveExpenses() {
  localStorage.setItem('expenses', JSON.stringify(expenses));
}

function exportToCSV() {
  if (expenses.length === 0) {
    alert('No data to export.');
    return;
  }

  const headers = ['Amount', 'Category', 'Date', 'Note'];
  const rows = expenses.map(exp => [exp.amount, exp.category, exp.date, exp.note || '']);

  let csv = 'data:text/csv;charset=utf-8,';
  csv += headers.join(',') + '\n';
  rows.forEach(row => {
    csv += row.join(',') + '\n';
  });

  const encodedUri = encodeURI(csv);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'expenses.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportToPDF() {
  if (expenses.length === 0) {
    alert('No data to export.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const headers = [['Amount', 'Category', 'Date', 'Note']];
  const rows = expenses.map(exp => [
    `₹${exp.amount.toFixed(2)}`,
    exp.category,
    exp.date,
    exp.note || ''
  ]);

  doc.text('Expense Report', 14, 15);
  doc.autoTable({
    head: headers,
    body: rows,
    startY: 20,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [55, 65, 81] }
  });

  doc.save('expenses.pdf');
}

function updateChart(list = expenses) {
  const canvas = document.getElementById('categoryChart');
  if (!canvas) return;

  const categoryTotals = {};
  list.forEach(exp => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  const backgroundColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#22D3EE', '#F43F5E'
  ];

  if (chart) chart.destroy();

  const ctx = canvas.getContext('2d');
  chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: backgroundColors.slice(0, labels.length),
        borderColor: '#1F2937',
        borderWidth: 1
      }]
    },
    options: {
      plugins: {
        legend: {
          labels: { color: '#fff' }
        }
      }
    }
  });
}

document.getElementById('sort-select').addEventListener('change', (e) => {
  const sortBy = e.target.value;
  let sorted = [...expenses];

  switch (sortBy) {
    case 'date-desc':
      sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
      break;
    case 'date-asc':
      sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
      break;
    case 'amount-desc':
      sorted.sort((a, b) => b.amount - a.amount);
      break;
    case 'amount-asc':
      sorted.sort((a, b) => a.amount - b.amount);
      break;
    case 'category-asc':
      sorted.sort((a, b) => a.category.localeCompare(b.category));
      break;
  }

  renderExpenses(sorted);
  updateTotal(sorted);
  updateChart(sorted);
});

function filterExpenses() {
  const start = new Date(document.getElementById('start-date').value);
  const end = new Date(document.getElementById('end-date').value);

  const filtered = expenses.filter(exp => {
    const expDate = new Date(exp.date);
    return (!isNaN(start) ? expDate >= start : true) &&
           (!isNaN(end) ? expDate <= end : true);
  });

  renderExpenses(filtered);
  updateTotal(filtered);
  updateChart(filtered);
}

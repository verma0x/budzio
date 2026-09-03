/* =====================================
   BUDZIO V2 - Personal Student Finance
===================================== */

const STORAGE = {
    settings: "budzioSettings",
    expenses: "budzioExpenses",
    bills: "budzioBills",
    goals: "budzioGoals"
};

/* =====================================
   STATE MANAGEMENT
===================================== */

let settings = JSON.parse(localStorage.getItem(STORAGE.settings)) || {
    startingBalance: 0,
    monthlyIncome: 0
};

let expenses = JSON.parse(localStorage.getItem(STORAGE.expenses)) || [];
let bills = JSON.parse(localStorage.getItem(STORAGE.bills)) || [];
let goals = JSON.parse(localStorage.getItem(STORAGE.goals)) || [];

/* =====================================
   HELPERS
===================================== */

const $ = id => document.getElementById(id);

function money(amount) {
    return "₹" + Number(amount || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });
}

function formatDate(date) {
    if (!date) return "N/A";
    const d = new Date(date);
    return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function escapeHTML(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function getLocalDateString() {
    const today = new Date();
    return new Date(today.getTime() - today.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0];
}

function saveAll() {
    localStorage.setItem(STORAGE.settings, JSON.stringify(settings));
    localStorage.setItem(STORAGE.expenses, JSON.stringify(expenses));
    localStorage.setItem(STORAGE.bills, JSON.stringify(bills));
    localStorage.setItem(STORAGE.goals, JSON.stringify(goals));
}

/* =====================================
   UI UPDATES & DASHBOARD
===================================== */

function updateGreeting() {
    const hour = new Date().getHours();
    let text = "GOOD EVENING";
    if (hour < 12) text = "GOOD MORNING";
    else if (hour < 18) text = "GOOD AFTERNOON";

    const el = $("greetingText");
    if (el) el.textContent = text;
}

function categoryIcon(category) {
    const icons = {
        Food: "🍔",
        Travel: "🚌",
        Education: "📚",
        Shopping: "🛍️",
        Entertainment: "🎮",
        Bills: "🧾",
        Other: "📦"
    };
    return icons[category] || "📦";
}

function getMonthlyExpenses() {
    const now = new Date();
    return expenses.filter(expense => {
        const date = new Date(expense.date);
        return (
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
        );
    });
}

function updateDashboard() {
    const monthlyExpenses = getMonthlyExpenses();
    const expenseTotal = monthlyExpenses.reduce(
        (sum, expense) => sum + Number(expense.amount || 0),
        0
    );

    const balance = Number(settings.startingBalance) + Number(settings.monthlyIncome) - expenseTotal;

    if ($("balance")) $("balance").textContent = money(balance);
    if ($("income")) $("income").textContent = money(settings.monthlyIncome);
    if ($("expenses")) $("expenses").textContent = money(expenseTotal);
    if ($("monthlyChange")) $("monthlyChange").textContent = (balance >= 0 ? "+" : "") + money(balance);
}

/* =====================================
   EXPENSES
===================================== */

function expenseHTML(expense) {
    return `
        <div class="expense-card">
            <div class="expense-left">
                <div class="expense-icon">${categoryIcon(expense.category)}</div>
                <div>
                    <div class="expense-name">${escapeHTML(expense.name)}</div>
                    <div class="expense-date">${formatDate(expense.date)} · ${escapeHTML(expense.category)}</div>
                </div>
            </div>
            <div>
                <div class="expense-amount">− ${money(expense.amount)}</div>
                <div class="card-actions">
                    <button class="card-action" onclick="editExpense('${expense.id}')">Edit</button>
                    <button class="card-action delete" onclick="deleteExpense('${expense.id}')">Delete</button>
                </div>
            </div>
        </div>
    `;
}

function renderRecentExpenses() {
    const container = $("recentExpenses");
    if (!container) return;

    if (!expenses.length) {
        container.innerHTML = `<div class="empty-state">No expenses yet.<br>Tap + to add one.</div>`;
        return;
    }

    const recent = [...expenses]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    container.innerHTML = recent.map(expenseHTML).join("");
}

function renderAllExpenses() {
    const container = $("allExpenses");
    if (!container) return;

    if (!expenses.length) {
        container.innerHTML = `<div class="empty-state">No expenses recorded.</div>`;
        return;
    }

    container.innerHTML = [...expenses]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(expenseHTML)
        .join("");
}

function openExpenseModal(expense = null) {
    $("expenseModal")?.classList.add("show");

    if (expense) {
        $("editingExpenseId").value = expense.id;
        $("expenseAmount").value = expense.amount;
        $("expenseName").value = expense.name;
        $("expenseCategory").value = expense.category;
        $("expenseDate").value = expense.date;
    } else {
        $("expenseForm")?.reset();
        $("editingExpenseId").value = "";
        $("expenseDate").value = getLocalDateString();
    }
}

function editExpense(id) {
    const expense = expenses.find(e => e.id === id);
    if (expense) openExpenseModal(expense);
}

function deleteExpense(id) {
    if (!confirm("Delete this expense?")) return;
    expenses = expenses.filter(e => e.id !== id);
    saveAll();
    renderAllExpenses();
    renderRecentExpenses();
    updateDashboard();
}

$("expenseForm")?.addEventListener("submit", function(e) {
    e.preventDefault();
    const id = $("editingExpenseId").value;
    const expenseData = {
        amount: Number($("expenseAmount").value),
        name: $("expenseName").value.trim(),
        category: $("expenseCategory").value,
        date: $("expenseDate").value
    };

    if (!expenseData.amount || !expenseData.name || !expenseData.date) {
        alert("Please fill all fields.");
        return;
    }

    if (id) {
        const index = expenses.findIndex(e => e.id === id);
        if (index !== -1) expenses[index] = { ...expenses[index], ...expenseData };
    } else {
        expenses.push({ id: Date.now().toString(), ...expenseData });
    }

    saveAll();
    closeModal("expenseModal");
    renderAllExpenses();
    renderRecentExpenses();
    updateDashboard();
});

/* =====================================
   BILLS
===================================== */

function renderBills() {
    const container = $("allBills");
    if (!container) return;

    if (!bills.length) {
        container.innerHTML = `<div class="empty-state">No recurring bills yet.</div>`;
        return;
    }

    container.innerHTML = [...bills]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(bill => `
            <div class="bill-card">
                <div class="bill-left">
                    <div class="bill-icon">🧾</div>
                    <div>
                        <div class="bill-name">${escapeHTML(bill.name)}</div>
                        <div class="bill-due">${escapeHTML(bill.frequency)} · Due ${formatDate(bill.date)}</div>
                    </div>
                </div>
                <div>
                    <div class="bill-amount">${money(bill.amount)}</div>
                    <div class="card-actions">
                        <button class="card-action" onclick="editBill('${bill.id}')">Edit</button>
                        <button class="card-action delete" onclick="deleteBill('${bill.id}')">Delete</button>
                    </div>
                </div>
            </div>
        `).join("");
}

function renderBillPreview() {
    const container = $("billPreview");
    if (!container) return;

    if (!bills.length) {
        container.innerHTML = `<div class="empty-state">No upcoming bills.</div>`;
        return;
    }

    const bill = [...bills].sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    container.innerHTML = `
        <div class="bill-card">
            <div class="bill-left">
                <div class="bill-icon">🧾</div>
                <div>
                    <div class="bill-name">${escapeHTML(bill.name)}</div>
                    <div class="bill-due">${escapeHTML(bill.frequency)} · ${formatDate(bill.date)}</div>
                </div>
            </div>
            <div class="bill-amount">${money(bill.amount)}</div>
        </div>
    `;
}

function openBillModal(bill = null) {
    $("billModal")?.classList.add("show");
    if (bill) {
        $("editingBillId").value = bill.id;
        $("billName").value = bill.name;
        $("billAmount").value = bill.amount;
        $("billDate").value = bill.date;
        $("billFrequency").value = bill.frequency;
    } else {
        $("billForm")?.reset();
        $("editingBillId").value = "";
    }
}

function editBill(id) {
    const bill = bills.find(b => b.id === id);
    if (bill) openBillModal(bill);
}

function deleteBill(id) {
    if (!confirm("Delete this bill?")) return;
    bills = bills.filter(b => b.id !== id);
    saveAll();
    renderBills();
    renderBillPreview();
}

$("billForm")?.addEventListener("submit", function(e) {
    e.preventDefault();
    const id = $("editingBillId").value;
    const data = {
        name: $("billName").value.trim(),
        amount: Number($("billAmount").value),
        date: $("billDate").value,
        frequency: $("billFrequency").value
    };

    if (!data.name || !data.amount || !data.date) {
        alert("Please fill all fields.");
        return;
    }

    if (id) {
        const index = bills.findIndex(b => b.id === id);
        if (index !== -1) bills[index] = { ...bills[index], ...data };
    } else {
        bills.push({ id: Date.now().toString(), ...data });
    }

    saveAll();
    closeModal("billModal");
    renderBills();
    renderBillPreview();
});

/* =====================================
   GOALS
===================================== */

function goalHTML(goal) {
    const percent = goal.target > 0 ? Math.min(100, Math.round((goal.saved / goal.target) * 100)) : 0;
    return `
        <div class="goal-card">
            <div class="goal-top">
                <div class="goal-name">${escapeHTML(goal.name)}</div>
                <div class="goal-percent">${percent}%</div>
            </div>
            <div class="goal-amount">${money(goal.saved)} / ${money(goal.target)}</div>
            <div class="progress">
                <div class="progress-fill" style="width:${percent}%"></div>
            </div>
            <div class="card-actions">
                <button class="card-action" onclick="addGoalMoney('${goal.id}')">+ Add money</button>
                <button class="card-action" onclick="editGoal('${goal.id}')">Edit</button>
                <button class="card-action delete" onclick="deleteGoal('${goal.id}')">Delete</button>
            </div>
        </div>
    `;
}

function renderGoals() {
    const container = $("allGoals");
    if (!container) return;
    if (!goals.length) {
        container.innerHTML = `<div class="empty-state">No saving goals yet.</div>`;
        return;
    }
    container.innerHTML = goals.map(goalHTML).join("");
}

function renderGoalPreview() {
    const container = $("goalPreview");
    if (!container) return;
    if (!goals.length) {
        container.innerHTML = `<div class="empty-state">No saving goal yet.</div>`;
        return;
    }
    container.innerHTML = goalHTML(goals[0]);
}

function openGoalModal(goal = null) {
    $("goalModal")?.classList.add("show");
    if (goal) {
        $("editingGoalId").value = goal.id;
        $("goalName").value = goal.name;
        $("goalTarget").value = goal.target;
        $("goalSaved").value = goal.saved;
    } else {
        $("goalForm")?.reset();
        $("editingGoalId").value = "";
        $("goalSaved").value = 0;
    }
}

function editGoal(id) {
    const goal = goals.find(g => g.id === id);
    if (goal) openGoalModal(goal);
}

function deleteGoal(id) {
    if (!confirm("Delete this saving goal?")) return;
    goals = goals.filter(g => g.id !== id);
    saveAll();
    renderGoals();
    renderGoalPreview();
}

function addGoalMoney(id) {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    const amount = Number(prompt("How much did you save?"));
    if (!amount || amount <= 0) return;

    goal.saved += amount;
    saveAll();
    renderGoals();
    renderGoalPreview();
}

$("goalForm")?.addEventListener("submit", function(e) {
    e.preventDefault();
    const id = $("editingGoalId").value;
    const data = {
        name: $("goalName").value.trim(),
        target: Number($("goalTarget").value),
        saved: Number($("goalSaved").value) || 0
    };

    if (!data.name || !data.target) {
        alert("Please fill all fields.");
        return;
    }

    if (id) {
        const index = goals.findIndex(g => g.id === id);
        if (index !== -1) goals[index] = { ...goals[index], ...data };
    } else {
        goals.push({ id: Date.now().toString(), ...data });
    }

    saveAll();
    closeModal("goalModal");
    renderGoals();
    renderGoalPreview();
});

/* =====================================
   SETTINGS & DATA IMPORT/EXPORT
===================================== */

function loadSettings() {
    if ($("startingBalance")) $("startingBalance").value = settings.startingBalance;
    if ($("monthlyIncome")) $("monthlyIncome").value = settings.monthlyIncome;
}

$("saveSettings")?.addEventListener("click", function() {
    settings.startingBalance = Number($("startingBalance").value) || 0;
    settings.monthlyIncome = Number($("monthlyIncome").value) || 0;
    saveAll();
    updateDashboard();
    alert("Settings saved ✓");
});

$("exportData")?.addEventListener("click", function() {
    const data = { settings, expenses, bills, goals };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `budzio-backup-${getLocalDateString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
});

$("importDataButton")?.addEventListener("click", () => $("importFile")?.click());

$("importFile")?.addEventListener("change", function() {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            settings = data.settings || settings;
            expenses = data.expenses || [];
            bills = data.bills || [];
            goals = data.goals || [];
            saveAll();
            loadEverything();
            alert("Budzio data imported ✓");
        } catch {
            alert("Invalid backup file.");
        }
    };
    reader.readAsText(file);
});

$("resetData")?.addEventListener("click", function() {
    if (!confirm("This will permanently delete your Budzio data. Continue?")) return;

    Object.values(STORAGE).forEach(key => localStorage.removeItem(key));
    settings = { startingBalance: 0, monthlyIncome: 0 };
    expenses = [];
    bills = [];
    goals = [];

    loadEverything();
    alert("All Budzio data has been cleared.");
});

/* =====================================
   NAVIGATION
===================================== */

const pages = {
    overview: $("overviewPage"),
    expenses: $("expensesPage"),
    bills: $("billsPage"),
    goals: $("goalsPage"),
    settings: $("settingsPage")
};

function showPage(page) {
    Object.keys(pages).forEach(p => {
        if (pages[p]) pages[p].style.display = p === page ? "block" : "none";
    });

    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.toggle("active", item.dataset.page === page);
    });

    if ($("addButton")) {
        $("addButton").style.display = ["overview", "expenses", "bills", "goals"].includes(page) ? "block" : "none";
    }
}

document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", function() {
        showPage(this.dataset.page);
    });
});

$("settingsButton")?.addEventListener("click", () => showPage("settings"));
$("viewExpenses")?.addEventListener("click", () => showPage("expenses"));
$("viewBills")?.addEventListener("click", () => showPage("bills"));
$("viewGoals")?.addEventListener("click", () => showPage("goals"));

/* =====================================
   ADD BUTTON & MODAL CONTROL
===================================== */

$("addButton")?.addEventListener("click", function() {
    const current = document.querySelector(".nav-item.active")?.dataset.page;
    if (current === "bills") openBillModal();
    else if (current === "goals") openGoalModal();
    else openExpenseModal();
});

$("expenseAddButton")?.addEventListener("click", () => openExpenseModal());
$("billAddButton")?.addEventListener("click", () => openBillModal());
$("goalAddButton")?.addEventListener("click", () => openGoalModal());

function closeModal(id) {
    $(id)?.classList.remove("show");
}

document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", function() {
        closeModal(this.dataset.close);
    });
});

document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", function(e) {
        if (e.target === overlay) closeModal(overlay.id);
    });
});

/* =====================================
   INITIALIZATION
===================================== */

function loadEverything() {
    updateGreeting();
    loadSettings();
    updateDashboard();
    renderRecentExpenses();
    renderAllExpenses();
    renderBills();
    renderBillPreview();
    renderGoals();
    renderGoalPreview();
}

loadEverything();
showPage("overview");

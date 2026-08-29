/* =========================================
   BUDZIO
   Expense Management System
========================================= */


/* =========================================
   STORAGE
========================================= */

const EXPENSE_KEY = "budzioExpenses";

const BILL_KEY = "budzioBills";

const GOAL_KEY = "budzioGoals";


/* =========================================
   DATA
========================================= */

let expenses =
    JSON.parse(
        localStorage.getItem(
            EXPENSE_KEY
        ) || "[]"
    );


let bills =
    JSON.parse(
        localStorage.getItem(
            BILL_KEY
        ) || "[]"
    );


let goals =
    JSON.parse(
        localStorage.getItem(
            GOAL_KEY
        ) || "[]"
    );


/* =========================================
   HELPERS
========================================= */

function $(id) {

    return document.getElementById(id);

}


function saveExpenses() {

    localStorage.setItem(
        EXPENSE_KEY,
        JSON.stringify(expenses)
    );

}


function saveBills() {

    localStorage.setItem(
        BILL_KEY,
        JSON.stringify(bills)
    );

}


function saveGoals() {

    localStorage.setItem(
        GOAL_KEY,
        JSON.stringify(goals)
    );

}


function formatMoney(amount) {

    return (
        "₹" +
        Number(amount)
            .toLocaleString(
                "en-IN",
                {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                }
            )
    );

}


function formatDate(date) {

    const d =
        new Date(date);

    return d.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================
   GREETING
========================================= */

function updateGreeting() {

    const hour =
        new Date().getHours();


    let greeting;


    if (hour < 12) {

        greeting =
            "GOOD MORNING";

    }

    else if (hour < 18) {

        greeting =
            "GOOD AFTERNOON";

    }

    else {

        greeting =
            "GOOD EVENING";

    }


    $("greetingText")
        .textContent =
        greeting;

}


/* =========================================
   CURRENT MONTH EXPENSES
========================================= */

function getMonthlyExpenses() {

    const now =
        new Date();


    return expenses.filter(
        expense => {

            const date =
                new Date(
                    expense.date
                );

            return (

                date.getMonth() ===
                now.getMonth()

                &&

                date.getFullYear() ===
                now.getFullYear()

            );

        }
    );

}


/* =========================================
   UPDATE OVERVIEW
========================================= */

function updateOverview() {


    const monthly =
        getMonthlyExpenses();


    const total =
        monthly.reduce(
            (sum, expense) =>
                sum +
                Number(expense.amount),
            0
        );


    /*
       For now we assume the student's
       starting monthly income is ₹5000.

       Later we'll make Income fully
       editable.
    */

    const income = 5000;


    const balance =
        income - total;


    $("income")
        .textContent =
        formatMoney(income);


    $("expenses")
        .textContent =
        formatMoney(total);


    $("balance")
        .innerHTML =
        formatMoney(balance)
        + "<span>.00</span>";


    $("monthlyChange")
        .textContent =
        (balance >= 0 ? "+" : "")
        +
        formatMoney(balance);

}


/* =========================================
   CATEGORY ICON
========================================= */

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


    return (
        icons[category] ||
        "📦"
    );

}


/* =========================================
   RENDER RECENT EXPENSES
========================================= */

function renderExpenses() {


    const list =
        $("expenseList");


    if (
        expenses.length === 0
    ) {

        list.innerHTML = `

            <div class="empty-state">

                No expenses yet.<br>

                Tap + to add your
                first expense.

            </div>

        `;

        return;

    }


    const sorted =
        [...expenses]
        .sort(
            (a,b) =>
                new Date(b.date)
                -
                new Date(a.date)
        )
        .slice(0,5);


    list.innerHTML =
        sorted.map(
            expense => `

            <div class="expense-card">

                <div class="expense-left">

                    <div class="expense-icon">

                        ${categoryIcon(
                            expense.category
                        )}

                    </div>

                    <div>

                        <div class="expense-name">

                            ${escapeHTML(
                                expense.name
                            )}

                        </div>

                        <div class="expense-date">

                            ${formatDate(
                                expense.date
                            )}

                            ·

                            ${expense.category}

                        </div>

                    </div>

                </div>


                <div>

                    <span class="expense-amount">

                        − ${formatMoney(
                            expense.amount
                        )}

                    </span>

                    <button
                        class="delete-expense"
                        onclick="deleteExpense('${expense.id}')">

                        ×

                    </button>

                </div>

            </div>

        `
        )
        .join("");

}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        text;

    return div.innerHTML;

}


/* =========================================
   ADD EXPENSE
========================================= */

function addExpense(event) {

    event.preventDefault();


    const amount =
        Number(
            $("expenseAmount")
                .value
        );


    const name =
        $("expenseName")
            .value
            .trim();


    const category =
        $("expenseCategory")
            .value;


    const date =
        $("expenseDate")
            .value;


    if (
        !amount ||
        amount <= 0 ||
        !name ||
        !date
    ) {

        alert(
            "Please fill all fields."
        );

        return;

    }


    const expense = {

        id:
            Date.now()
            .toString(),

        amount:

            amount,

        name:

            name,

        category:

            category,

        date:

            date

    };


    expenses.push(
        expense
    );


    saveExpenses();


    $("expenseForm")
        .reset();


    closeExpenseModal();


    renderExpenses();


    updateOverview();

}


/* =========================================
   DELETE EXPENSE
========================================= */

function deleteExpense(id) {


    const confirmed =
        confirm(
            "Delete this expense?"
        );


    if (!confirmed) {

        return;

    }


    expenses =
        expenses.filter(
            expense =>
                expense.id !== id
        );


    saveExpenses();


    renderExpenses();


    renderAllExpenses();


    updateOverview();

}


/* =========================================
   OPEN EXPENSE MODAL
========================================= */

function openExpenseModal() {

    $("expenseModal")
        .classList
        .add("show");


    const today =
        new Date()
        .toISOString()
        .split("T")[0];


    $("expenseDate")
        .value =
        today;


    setTimeout(
        () => {

            $("expenseAmount")
                .focus();

        },
        200
    );

}


/* =========================================
   CLOSE EXPENSE MODAL
========================================= */

function closeExpenseModal() {

    $("expenseModal")
        .classList
        .remove("show");

}


/* =========================================
   ALL EXPENSES
========================================= */

function renderAllExpenses() {


    const list =
        $("allExpenseList");


    if (
        expenses.length === 0
    ) {

        list.innerHTML = `

            <div class="empty-state">

                No expenses recorded yet.

            </div>

        `;

        return;

    }


    const sorted =
        [...expenses]
        .sort(
            (a,b) =>
                new Date(b.date)
                -
                new Date(a.date)
        );


    list.innerHTML =
        sorted.map(
            expense => `

            <div class="expense-card">

                <div class="expense-left">

                    <div class="expense-icon">

                        ${categoryIcon(
                            expense.category
                        )}

                    </div>

                    <div>

                        <div class="expense-name">

                            ${escapeHTML(
                                expense.name
                            )}

                        </div>

                        <div class="expense-date">

                            ${formatDate(
                                expense.date
                            )}

                            ·

                            ${expense.category}

                        </div>

                    </div>

                </div>


                <div>

                    <span class="expense-amount">

                        − ${formatMoney(
                            expense.amount
                        )}

                    </span>

                    <button
                        class="delete-expense"
                        onclick="deleteExpense('${expense.id}')">

                        ×

                    </button>

                </div>

            </div>

        `
        )
        .join("");

}


/* =========================================
   MODAL EVENTS
========================================= */

$("addButton")
    .addEventListener(
        "click",
        openExpenseModal
    );


$("closeModal")
    .addEventListener(
        "click",
        closeExpenseModal
    );


$("expenseModal")
    .addEventListener(
        "click",
        function(event) {

            if (
                event.target ===
                $("expenseModal")
            ) {

                closeExpenseModal();

            }

        }
    );


$("expenseForm")
    .addEventListener(
        "submit",
        addExpense
    );


/* =========================================
   VIEW ALL
========================================= */

$("viewAll")
    .addEventListener(
        "click",
        function() {

            renderAllExpenses();

            $("allExpensesModal")
                .classList
                .add("show");

        }
    );


$("closeAllExpenses")
    .addEventListener(
        "click",
        function() {

            $("allExpensesModal")
                .classList
                .remove("show");

        }
    );


/* =========================================
   NAVIGATION
========================================= */

document
    .querySelectorAll(
        ".nav-item"
    )
    .forEach(
        item => {

            item.addEventListener(
                "click",
                function() {

                    document
                        .querySelectorAll(
                            ".nav-item"
                        )
                        .forEach(
                            nav =>
                                nav.classList
                                .remove(
                                    "active"
                                )
                        );


                    this.classList.add(
                        "active"
                    );


                    const page =
                        this.dataset.page;


                    /*
                       Expenses currently opens
                       the expense history.

                       Bills and Goals will be
                       connected in the next stage.
                    */

                    if (
                        page ===
                        "expenses"
                    ) {

                        renderAllExpenses();

                        $("allExpensesModal")
                            .classList
                            .add("show");

                    }

                    else if (
                        page ===
                        "bills"
                    ) {

                        alert(
                            "Bills section coming next 🚀"
                        );

                    }

                    else if (
                        page ===
                        "goals"
                    ) {

                        alert(
                            "Saving Goals section coming next 🎯"
                        );

                    }

                }
            );

        }
    );


/* =========================================
   INITIALIZE
========================================= */

updateGreeting();

renderExpenses();

updateOverview();

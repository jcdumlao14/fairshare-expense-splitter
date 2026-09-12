import { useEffect, useMemo, useState } from "react"
import "./App.css"
import type { Expense } from "./types"
import {
  createExpense,
  deleteExpense as deleteExpenseApi,
  getBalances,
  getExpenses,
  getSettlements,
  type Balance,
  type Settlement,
} from "./api/fairshareApi"

type Member = {
  id: string
  name: string
  initials: string
}

const MEMBERS: Member[] = [
  { id: "jocelyn", name: "Jocelyn", initials: "JD" },
  { id: "ana", name: "Ana", initials: "AN" },
  { id: "mark", name: "Mark", initials: "MK" },
  { id: "brynt", name: "Brynt", initials: "BR" },
]

const INITIAL_EXPENSES: Expense[] = [
  {
    id: "demo-1",
    description: "Dinner at Riverside",
    amount: 1850,
    paidBy: "Jocelyn",
    participants: ["Jocelyn", "Ana", "Mark"],
    date: "Today",
    category: "Food",
  },
  {
    id: "demo-2",
    description: "Taxi to airport",
    amount: 920,
    paidBy: "Mark",
    participants: ["Jocelyn", "Mark"],
    date: "Yesterday",
    category: "Transport",
  },
  {
    id: "demo-3",
    description: "Weekend groceries",
    amount: 2460,
    paidBy: "Ana",
    participants: ["Jocelyn", "Ana", "Mark", "Brynt"],
    date: "Sep 10",
    category: "Groceries",
  },
]

const STORAGE_KEY = "fairshare-expenses"

function formatCurrency(amount: number | string) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(Number(amount))
}

function formatExpenseDate(date: string) {
  if (!date) return "—"

  if (date === "Today" || date === "Yesterday") {
    return date
  }

  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) {
    return date
  }

  return parsed.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function getGreeting(): string {
  const hour = new Date().getHours()

  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}
function App() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [balances, setBalances] = useState<Balance[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [activeView, setActiveView] = useState<
    "dashboard" | "expenses" | "balances" | "settlements"
  >("dashboard")

  const [showAddExpense, setShowAddExpense] = useState(false)
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [paidBy, setPaidBy] = useState("Jocelyn")
  const [participants, setParticipants] = useState<string[]>(
    MEMBERS.map((member) => member.name),
  )
  const [category, setCategory] = useState("Food")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const loadData = async () => {
    setLoading(true)
    setError("")

    try {
      const [expenseData, balanceData, settlementData] =
        await Promise.all([
          getExpenses(),
          getBalances(),
          getSettlements(),
        ])

      setExpenses(expenseData)
      setBalances(balanceData)
      setSettlements(settlementData)

      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenseData))
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load FairShare data."

      setError(message)

      const cached = localStorage.getItem(STORAGE_KEY)

      if (cached) {
        try {
          setExpenses(JSON.parse(cached))
        } catch {
          setExpenses([])
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses],
  )

  const yourBalance = useMemo(() => {
    const balance = balances.find((item) => item.member === "Jocelyn")
    return Number(balance?.balance ?? 0)
  }, [balances])

  const groupBalance = useMemo(
    () =>
      balances.reduce(
        (sum, item) => sum + Number(item.balance),
        0,
      ),
    [balances],
  )

  const recentExpenses = expenses.slice(0, 5)

  const toggleParticipant = (memberName: string) => {
    setParticipants((current) => {
      if (current.includes(memberName)) {
        if (current.length === 1) {
          return current
        }

        return current.filter((name) => name !== memberName)
      }

      return [...current, memberName]
    })
  }

  const resetForm = () => {
    setDescription("")
    setAmount("")
    setPaidBy("Jocelyn")
    setParticipants(MEMBERS.map((member) => member.name))
    setCategory("Food")
  }

  const addExpense = async () => {
    if (!description.trim()) {
      setError("Please enter an expense description.")
      return
    }

    const numericAmount = Number(amount)

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid amount greater than zero.")
      return
    }

    if (participants.length === 0) {
      setError("Select at least one participant.")
      return
    }

    if (!participants.includes(paidBy)) {
      setError("The payer must be included in the participants.")
      return
    }

    setSaving(true)
    setError("")

    try {
      const createdExpense = await createExpense({
        description: description.trim(),
        amount: numericAmount.toFixed(2),
        paid_by: paidBy,
        participants,
        category,
        expense_date: new Date().toISOString().slice(0, 10),
      })

      setExpenses((current) => [createdExpense, ...current])

      const [balanceData, settlementData] = await Promise.all([
        getBalances(),
        getSettlements(),
      ])

      setBalances(balanceData)
      setSettlements(settlementData)

      setShowAddExpense(false)
      resetForm()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to create expense."

      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const resetDemoData = async () => {
    setLoading(true)
    setError("")

    try {
      const existingExpenses = await getExpenses()

      for (const expense of existingExpenses) {
        await deleteExpenseApi(Number(expense.id))
      }

      for (const expense of INITIAL_EXPENSES) {
        await createExpense({
          description: expense.description,
          amount: expense.amount.toFixed(2),
          paid_by: expense.paidBy,
          participants: expense.participants,
          category: expense.category,
        })
      }

      localStorage.removeItem(STORAGE_KEY)
      await loadData()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to reset demo data."

      setError(message)
      setLoading(false)
    }
  }

  const navigation = [
    { id: "dashboard", label: "Dashboard", icon: "⌂" },
    { id: "expenses", label: "Expenses", icon: "◫" },
    { id: "balances", label: "Balances", icon: "⇄" },
    { id: "settlements", label: "Settlements", icon: "✓" },
  ] as const

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">F</div>
          <div>
            <div className="brand-name">FairShare</div>
            <div className="brand-subtitle">AI Expense Splitter</div>
          </div>
        </div>

        <nav className="nav-menu">
          {navigation.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${
                activeView === item.id ? "active" : ""
              }`}
              onClick={() => setActiveView(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="ai-badge">
            <span>✦</span>
            <div>
              <strong>AI-assisted</strong>
              <small>Built for smarter splitting</small>
            </div>
          </div>

          <button
            className="reset-button"
            onClick={() => void resetDemoData()}
            disabled={loading}
          >
            Reset demo data
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="eyebrow">FAIRSHARE GROUP</div>
            <h1>
              {activeView === "dashboard" && (<>{getGreeting()}, Jocelyn! Ready to keep your expenses on track?</>)}
              {activeView === "expenses" && "Expenses"}
              {activeView === "balances" && "Balances"}
              {activeView === "settlements" && "Settlements"}
            </h1>
          </div>

          <button
            className="primary-button"
            onClick={() => {
              setError("")
              setShowAddExpense(true)
            }}
          >
            + Add expense
          </button>
        </header>

        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        {loading ? (
          <section className="loading-state">
            <div className="loading-spinner" />
            <h2>Loading FairShare...</h2>
            <p>Connecting to your FastAPI backend.</p>
          </section>
        ) : (
          <>
            {activeView === "dashboard" && (
              <section className="page-section">
                <div className="stats-grid">
                  <div className="stat-card">
                    <span className="stat-label">TOTAL EXPENSES</span>
                    <strong>{formatCurrency(totalExpenses)}</strong>
                    <span className="stat-note">
                      {expenses.length} recorded expense
                      {expenses.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="stat-card">
                    <span className="stat-label">YOUR BALANCE</span>
                    <strong
                      className={
                        yourBalance >= 0 ? "positive" : "negative"
                      }
                    >
                      {yourBalance >= 0 ? "+" : ""}
                      {formatCurrency(yourBalance)}
                    </strong>
                    <span className="stat-note">
                      {yourBalance >= 0
                        ? "You are owed"
                        : "You owe the group"}
                    </span>
                  </div>

                  <div className="stat-card">
                    <span className="stat-label">GROUP BALANCE</span>
                    <strong>{formatCurrency(groupBalance)}</strong>
                    <span className="stat-note">
                      Should settle to ₱0.00
                    </span>
                  </div>
                </div>

                <div className="content-grid">
                  <div className="panel">
                    <div className="panel-header">
                      <div>
                        <span className="panel-kicker">RECENT ACTIVITY</span>
                        <h2>Recent expenses</h2>
                      </div>

                      <button
                        className="text-button"
                        onClick={() => setActiveView("expenses")}
                      >
                        View all →
                      </button>
                    </div>

                    {recentExpenses.length === 0 ? (
                      <div className="empty-state">
                        <h3>No expenses yet</h3>
                        <p>Add your first shared expense to get started.</p>
                      </div>
                    ) : (
                      <div className="expense-list">
                        {recentExpenses.map((expense) => {
                          const perPerson =
                            expense.amount / expense.participants.length

                          return (
                            <div className="expense-row" key={expense.id}>
                              <div className="expense-icon">
                                {expense.category === "Food"
                                  ? "🍴"
                                  : expense.category === "Transport"
                                    ? "🚕"
                                    : expense.category === "Groceries"
                                      ? "🛒"
                                      : "•"}
                              </div>

                              <div className="expense-main">
                                <strong>{expense.description}</strong>
                                <span>
                                  {expense.paidBy} paid ·{" "}
                                  {expense.participants.length} people
                                </span>
                              </div>

                              <div className="expense-amount">
                                <strong>
                                  {formatCurrency(expense.amount)}
                                </strong>
                                <span>
                                  {formatCurrency(perPerson)} / person
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="panel balance-panel">
                    <div className="panel-header">
                      <div>
                        <span className="panel-kicker">WHO OWES WHO</span>
                        <h2>Balances</h2>
                      </div>

                      <button
                        className="text-button"
                        onClick={() => setActiveView("balances")}
                      >
                        Details →
                      </button>
                    </div>

                    {balances.length === 0 ? (
                      <div className="empty-state">
                        <p>No balances yet.</p>
                      </div>
                    ) : (
                      <div className="balance-list">
                        {balances.map((item) => (
                          <div className="balance-row" key={item.member}>
                            <div className="member-avatar">
                              {item.member
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>

                            <div className="member-name">
                              <strong>{item.member}</strong>
                            </div>

                            <div
                              className={`balance-value ${
                                Number(item.balance) >= 0
                                  ? "positive"
                                  : "negative"
                              }`}
                            >
                              {Number(item.balance) >= 0 ? "+" : ""}
                              {formatCurrency(item.balance)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="ai-card">
                  <div className="ai-card-icon">✦</div>
                  <div className="ai-card-content">
                    <span className="panel-kicker">AI-ASSISTED ENTRY</span>
                    <h2>Describe an expense naturally</h2>
                    <p>
                      Example: “Jocelyn paid ₱1,200 for dinner for
                      Jocelyn, Ana, and Mark.”
                    </p>
                  </div>
                  <button
                    className="secondary-button"
                    onClick={() => setShowAddExpense(true)}
                  >
                    Try it
                  </button>
                </div>
              </section>
            )}

            {activeView === "expenses" && (
              <section className="page-section">
                <div className="panel full-panel">
                  <div className="panel-header">
                    <div>
                      <span className="panel-kicker">ALL TRANSACTIONS</span>
                      <h2>Expense history</h2>
                    </div>
                    <span className="count-badge">
                      {expenses.length} expense
                      {expenses.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {expenses.length === 0 ? (
                    <div className="empty-state">
                      <h3>No expenses yet</h3>
                      <p>
                        Add an expense to start tracking your shared
                        spending.
                      </p>
                    </div>
                  ) : (
                    <div className="expense-history">
                      {expenses.map((expense) => {
                        const perPerson =
                          expense.amount / expense.participants.length

                        return (
                          <div
                            className="history-card"
                            key={expense.id}
                          >
                            <div className="expense-icon">
                              {expense.category === "Food"
                                ? "🍴"
                                : expense.category === "Transport"
                                  ? "🚕"
                                  : expense.category === "Groceries"
                                    ? "🛒"
                                    : "•"}
                            </div>

                            <div className="history-main">
                              <h3>{expense.description}</h3>
                              <p>
                                {expense.paidBy} paid ·{" "}
                                {formatExpenseDate(expense.date)}
                              </p>
                              <div className="participant-pills">
                                {expense.participants.map(
                                  (participant) => (
                                    <span key={participant}>
                                      {participant}
                                    </span>
                                  ),
                                )}
                              </div>
                            </div>

                            <div className="history-amount">
                              <strong>
                                {formatCurrency(expense.amount)}
                              </strong>
                              <span>
                                {formatCurrency(perPerson)} each
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeView === "balances" && (
              <section className="page-section">
                <div className="content-grid single-column">
                  <div className="panel full-panel">
                    <div className="panel-header">
                      <div>
                        <span className="panel-kicker">
                          NET POSITIONS
                        </span>
                        <h2>Group balances</h2>
                      </div>
                    </div>

                    <div className="balance-detail-grid">
                      {balances.map((item) => {
                        const value = Number(item.balance)

                        return (
                          <div
                            className="balance-detail-card"
                            key={item.member}
                          >
                            <div className="member-avatar large">
                              {item.member
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div>
                              <span className="stat-label">
                                MEMBER
                              </span>
                              <h3>{item.member}</h3>
                              <strong
                                className={
                                  value >= 0
                                    ? "positive"
                                    : "negative"
                                }
                              >
                                {value >= 0 ? "+" : ""}
                                {formatCurrency(value)}
                              </strong>
                              <p>
                                {value > 0
                                  ? "Should receive"
                                  : value < 0
                                    ? "Needs to pay"
                                    : "Settled"}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeView === "settlements" && (
              <section className="page-section">
                <div className="panel full-panel">
                  <div className="panel-header">
                    <div>
                      <span className="panel-kicker">
                        SUGGESTED PAYMENTS
                      </span>
                      <h2>Settlement plan</h2>
                    </div>
                  </div>

                  {settlements.length === 0 ? (
                    <div className="empty-state">
                      <div className="success-icon">✓</div>
                      <h3>Everyone is settled</h3>
                      <p>
                        There are no outstanding payments between
                        group members.
                      </p>
                    </div>
                  ) : (
                    <div className="settlement-list">
                      {settlements.map((settlement, index) => (
                        <div
                          className="settlement-row"
                          key={`${settlement.from_member}-${settlement.to_member}-${index}`}
                        >
                          <div className="settlement-person">
                            <div className="member-avatar">
                              {settlement.from_member
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <strong>
                              {settlement.from_member}
                            </strong>
                          </div>

                          <div className="settlement-arrow">→</div>

                          <div className="settlement-person">
                            <div className="member-avatar">
                              {settlement.to_member
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <strong>
                              {settlement.to_member}
                            </strong>
                          </div>

                          <div className="settlement-amount">
                            {formatCurrency(settlement.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {showAddExpense && (
        <div
          className="modal-backdrop"
          onClick={() => {
            if (!saving) {
              setShowAddExpense(false)
            }
          }}
        >
          <div
            className="modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="panel-kicker">NEW EXPENSE</span>
                <h2>Add expense</h2>
              </div>

              <button
                className="modal-close"
                onClick={() => setShowAddExpense(false)}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <div className="form-group">
              <label>Description</label>
              <input
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="e.g. Dinner at Riverside"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) =>
                    setAmount(event.target.value)
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                >
                  <option>Food</option>
                  <option>Transport</option>
                  <option>Groceries</option>
                  <option>Entertainment</option>
                  <option>Utilities</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Paid by</label>
              <select
                value={paidBy}
                onChange={(event) => setPaidBy(event.target.value)}
              >
                {MEMBERS.map((member) => (
                  <option key={member.id} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Participants</label>
              <div className="participant-selector">
                {MEMBERS.map((member) => (
                  <button
                    type="button"
                    key={member.id}
                    className={`participant-option ${
                      participants.includes(member.name)
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => toggleParticipant(member.name)}
                  >
                    <span className="member-avatar">
                      {member.initials}
                    </span>
                    <span>{member.name}</span>
                    {participants.includes(member.name) && (
                      <span className="checkmark">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {amount && participants.length > 0 && (
              <div className="split-preview">
                <span>Equal split</span>
                <strong>
                  {formatCurrency(
                    Number(amount) / participants.length,
                  )}{" "}
                  per person
                </strong>
              </div>
            )}

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setShowAddExpense(false)}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={() => void addExpense()}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save expense"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
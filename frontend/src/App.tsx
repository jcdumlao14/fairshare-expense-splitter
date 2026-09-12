import { useEffect, useMemo, useState } from 'react'
import './App.css'
import type { Expense, Member } from './types'

const MEMBERS: Member[] = [
  { id: 'jocelyn', name: 'Jocelyn', initials: 'JD' },
  { id: 'ana', name: 'Ana', initials: 'AN' },
  { id: 'mark', name: 'Mark', initials: 'MK' },
  { id: 'brynt', name: 'Brynt', initials: 'BR' },
]

const INITIAL_EXPENSES: Expense[] = [
  {
    id: '1',
    description: 'Dinner at Riverside',
    amount: 1850,
    paidBy: 'Jocelyn',
    participants: ['Jocelyn', 'Ana', 'Mark'],
    date: 'Today',
    category: 'Food',
  },
  {
    id: '2',
    description: 'Taxi to airport',
    amount: 920,
    paidBy: 'Mark',
    participants: ['Jocelyn', 'Mark'],
    date: 'Yesterday',
    category: 'Transport',
  },
  {
    id: '3',
    description: 'Weekend groceries',
    amount: 2460,
    paidBy: 'Ana',
    participants: ['Jocelyn', 'Ana', 'Mark', 'Brynt'],
    date: 'Sep 10',
    category: 'Groceries',
  },
]

const STORAGE_KEY = 'fairshare-expenses'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format(value)
}

function App() {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES
  })

  const [activeView, setActiveView] = useState('dashboard')
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState('Jocelyn')
  const [participants, setParticipants] = useState<string[]>([
    'Jocelyn',
    'Ana',
    'Mark',
  ])
  const [category, setCategory] = useState('Food')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses))
  }, [expenses])

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses],
  )

  const jocelynPaid = useMemo(
    () =>
      expenses
        .filter((expense) => expense.paidBy === 'Jocelyn')
        .reduce((sum, expense) => sum + expense.amount, 0),
    [expenses],
  )

  const jocelynShare = useMemo(
    () =>
      expenses.reduce((sum, expense) => {
        if (!expense.participants.includes('Jocelyn')) return sum
        return sum + expense.amount / expense.participants.length
      }, 0),
    [expenses],
  )

  const yourBalance = jocelynPaid - jocelynShare

  const balances = useMemo(() => {
    return MEMBERS.map((member) => {
      const paid = expenses
        .filter((expense) => expense.paidBy === member.name)
        .reduce((sum, expense) => sum + expense.amount, 0)

      const share = expenses.reduce((sum, expense) => {
        if (!expense.participants.includes(member.name)) return sum
        return sum + expense.amount / expense.participants.length
      }, 0)

      return {
        member: member.name,
        balance: paid - share,
      }
    })
  }, [expenses])

  function toggleParticipant(name: string) {
    setParticipants((current) =>
      current.includes(name)
        ? current.filter((participant) => participant !== name)
        : [...current, name],
    )
  }

  function addExpense() {
    const numericAmount = Number(amount)

    if (
      !description.trim() ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      participants.length === 0
    ) {
      return
    }

    const newExpense: Expense = {
      id: crypto.randomUUID(),
      description: description.trim(),
      amount: numericAmount,
      paidBy,
      participants,
      date: 'Just now',
      category,
    }

    setExpenses((current) => [newExpense, ...current])
    setDescription('')
    setAmount('')
    setPaidBy('Jocelyn')
    setParticipants(['Jocelyn', 'Ana', 'Mark'])
    setCategory('Food')
    setShowExpenseForm(false)
  }

  function resetDemoData() {
    setExpenses(INITIAL_EXPENSES)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">F</div>
          <div>
            <strong>FairShare</strong>
            <span>Expense splitter</span>
          </div>
        </div>

        <nav className="nav">
          <button
            className={activeView === 'dashboard' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveView('dashboard')}
          >
            <span>�</span>
            Dashboard
          </button>

          <button
            className={activeView === 'expenses' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveView('expenses')}
          >
            <span>?</span>
            Expenses
          </button>

          <button
            className={activeView === 'balances' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveView('balances')}
          >
            <span>?</span>
            Balances
          </button>

          <button
            className={activeView === 'settlements' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveView('settlements')}
          >
            <span>?</span>
            Settlements
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="group-card">
            <div className="group-icon">??</div>
            <div>
              <strong>Weekend Group</strong>
              <span>{MEMBERS.length} members</span>
            </div>
          </div>

          <button className="reset-button" onClick={resetDemoData}>
            Reset demo data
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Weekend Group</p>
            <h1>
              {activeView === 'dashboard'
                ? 'Good afternoon, Jocelyn'
                : activeView.charAt(0).toUpperCase() + activeView.slice(1)}
            </h1>
          </div>

          <div className="topbar-actions">
            <button className="icon-button" aria-label="Notifications">
              ?
            </button>
            <div className="user-avatar">JD</div>
          </div>
        </header>

        {activeView === 'dashboard' && (
          <>
            <section className="hero-card">
              <div>
                <span className="hero-label">Your current balance</span>
                <strong className={yourBalance >= 0 ? 'positive' : 'negative'}>
                  {yourBalance >= 0 ? '+' : ''}
                  {formatCurrency(yourBalance)}
                </strong>
                <p>
                  {yourBalance >= 0
                    ? 'You are owed this amount by the group.'
                    : 'You owe this amount to the group.'}
                </p>
              </div>
              <div className="hero-decoration">
                <span>?</span>
              </div>
            </section>

            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon purple">?</div>
                <div>
                  <span>Total expenses</span>
                  <strong>{formatCurrency(totalExpenses)}</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon green">?</div>
                <div>
                  <span>You paid</span>
                  <strong>{formatCurrency(jocelynPaid)}</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon orange">�</div>
                <div>
                  <span>Your share</span>
                  <strong>{formatCurrency(jocelynShare)}</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon blue">?</div>
                <div>
                  <span>Expenses</span>
                  <strong>{expenses.length}</strong>
                </div>
              </div>
            </section>

            <section className="content-grid">
              <div className="panel expenses-panel">
                <div className="panel-header">
                  <div>
                    <h2>Recent expenses</h2>
                    <p>Latest group activity</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setActiveView('expenses')}
                  >
                    View all ?
                  </button>
                </div>

                <ExpenseList expenses={expenses.slice(0, 5)} />
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Group balances</h2>
                    <p>Current standing</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setActiveView('balances')}
                  >
                    Details ?
                  </button>
                </div>

                <div className="balance-list">
                  {balances.map((item) => (
                    <div className="balance-row" key={item.member}>
                      <div className="member-info">
                        <div className="small-avatar">
                          {MEMBERS.find((member) => member.name === item.member)
                            ?.initials}
                        </div>
                        <span>{item.member}</span>
                      </div>
                      <strong className={item.balance >= 0 ? 'positive' : 'negative'}>
                        {item.balance >= 0 ? '+' : ''}
                        {formatCurrency(item.balance)}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="ai-card">
              <div className="ai-icon">?</div>
              <div className="ai-copy">
                <span>AI-assisted entry</span>
                <h2>Describe an expense naturally</h2>
                <p>
                  Later, you can type something like �I paid ?1,500 for dinner
                  for me, Ana and Mark� and FairShare will structure it for you.
                </p>
              </div>
              <button className="secondary-button" onClick={() => setShowExpenseForm(true)}>
                Try expense entry
              </button>
            </section>
          </>
        )}

        {activeView === 'expenses' && (
          <section className="page-panel">
            <div className="page-heading">
              <div>
                <p className="eyebrow">Group activity</p>
                <h2>All expenses</h2>
              </div>
              <button className="primary-button" onClick={() => setShowExpenseForm(true)}>
                + Add expense
              </button>
            </div>

            <ExpenseList expenses={expenses} large />
          </section>
        )}

        {activeView === 'balances' && (
          <section className="page-panel">
            <div className="page-heading">
              <div>
                <p className="eyebrow">Fair accounting</p>
                <h2>Balances</h2>
              </div>
            </div>

            <div className="balance-summary">
              {balances.map((item) => (
                <div className="balance-summary-card" key={item.member}>
                  <div className="small-avatar">
                    {MEMBERS.find((member) => member.name === item.member)?.initials}
                  </div>
                  <span>{item.member}</span>
                  <strong className={item.balance >= 0 ? 'positive' : 'negative'}>
                    {item.balance >= 0 ? '+' : ''}
                    {formatCurrency(item.balance)}
                  </strong>
                  <small>
                    {item.balance > 0
                      ? 'should receive'
                      : item.balance < 0
                        ? 'should pay'
                        : 'settled'}
                  </small>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeView === 'settlements' && (
          <section className="page-panel">
            <div className="page-heading">
              <div>
                <p className="eyebrow">Simplify payments</p>
                <h2>Settlements</h2>
              </div>
            </div>

            <div className="settlement-empty">
              <div className="settlement-icon">?</div>
              <h3>Settlement suggestions</h3>
              <p>
                FairShare will calculate the simplest way for everyone to settle
                their balances once expenses are finalized.
              </p>
              <div className="settlement-note">
                <strong>Current group total</strong>
                <span>{formatCurrency(totalExpenses)}</span>
              </div>
            </div>
          </section>
        )}
      </main>

      {showExpenseForm && (
        <div className="modal-backdrop" onClick={() => setShowExpenseForm(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">New transaction</p>
                <h2>Add expense</h2>
              </div>
              <button
                className="close-button"
                onClick={() => setShowExpenseForm(false)}
                aria-label="Close"
              >
                �
              </button>
            </div>

            <label>
              Description
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="e.g. Dinner at Riverside"
              />
            </label>

            <label>
              Amount
              <div className="currency-input">
                <span>?</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                />
              </div>
            </label>

            <label>
              Category
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option>Food</option>
                <option>Transport</option>
                <option>Groceries</option>
                <option>Entertainment</option>
                <option>Other</option>
              </select>
            </label>

            <label>
              Paid by
              <select value={paidBy} onChange={(event) => setPaidBy(event.target.value)}>
                {MEMBERS.map((member) => (
                  <option key={member.id}>{member.name}</option>
                ))}
              </select>
            </label>

            <div className="participants-field">
              <span>Split between</span>
              <div className="participant-grid">
                {MEMBERS.map((member) => (
                  <button
                    type="button"
                    key={member.id}
                    className={
                      participants.includes(member.name)
                        ? 'participant selected'
                        : 'participant'
                    }
                    onClick={() => toggleParticipant(member.name)}
                  >
                    <span>{member.initials}</span>
                    {member.name}
                  </button>
                ))}
              </div>
            </div>

            {amount && participants.length > 0 && (
              <div className="split-preview">
                <span>Equal split</span>
                <strong>
                  {formatCurrency(Number(amount) / participants.length)} each
                </strong>
              </div>
            )}

            <button className="primary-button full-width" onClick={addExpense}>
              Add expense
            </button>
          </div>
        </div>
      )}

      <button
        className="floating-add"
        onClick={() => setShowExpenseForm(true)}
        aria-label="Add expense"
      >
        +
      </button>
    </div>
  )
}

function ExpenseList({
  expenses,
  large = false,
}: {
  expenses: Expense[]
  large?: boolean
}) {
  return (
    <div className={large ? 'expense-list large' : 'expense-list'}>
      {expenses.length === 0 ? (
        <div className="empty-state">
          <span>?</span>
          <p>No expenses yet.</p>
        </div>
      ) : (
        expenses.map((expense) => {
          const share = expense.amount / expense.participants.length

          return (
            <div className="expense-row" key={expense.id}>
              <div className="expense-category">
                {expense.category === 'Food'
                  ? '??'
                  : expense.category === 'Transport'
                    ? '??'
                    : expense.category === 'Groceries'
                      ? '??'
                      : '?'}
              </div>

              <div className="expense-main">
                <strong>{expense.description}</strong>
                <span>
                  {expense.paidBy} paid � {expense.participants.length} people �{' '}
                  {expense.date}
                </span>
              </div>

              <div className="expense-values">
                <strong>{formatCurrency(expense.amount)}</strong>
                <span>{formatCurrency(share)} / person</span>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

export default App

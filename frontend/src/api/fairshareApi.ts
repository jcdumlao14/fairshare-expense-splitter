import type { Expense } from "../types"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"

type ApiExpense = {
  id: number
  description: string
  amount: number | string
  paid_by: string
  participants: string[]
  category: string
  expense_date?: string | null
  split_amount: number | string
  created_at: string
}

export type ExpenseCreate = {
  description: string
  amount: string
  paid_by: string
  participants: string[]
  category: string
  expense_date?: string | null
}

export type Balance = {
  member: string
  balance: string
}

export type Settlement = {
  from_member: string
  to_member: string
  amount: string
}

function mapExpense(api: ApiExpense): Expense {
  return {
    id: String(api.id),
    description: api.description,
    amount: Number(api.amount),
    paidBy: api.paid_by,
    participants: api.participants,
    date: api.expense_date ?? api.created_at,
    category: api.category,
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `API request failed: ${response.status}`

    try {
      const error = await response.json()

      if (error?.detail) {
        message = error.detail
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export async function getExpenses(): Promise<Expense[]> {
  const response = await fetch(`${API_BASE_URL}/expenses`)
  const data = await handleResponse<ApiExpense[]>(response)

  return data.map(mapExpense)
}

export async function createExpense(
  expense: ExpenseCreate,
): Promise<Expense> {
  const response = await fetch(`${API_BASE_URL}/expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(expense),
  })

  const data = await handleResponse<ApiExpense>(response)

  return mapExpense(data)
}

export async function getExpense(id: number): Promise<Expense> {
  const response = await fetch(`${API_BASE_URL}/expenses/${id}`)
  const data = await handleResponse<ApiExpense>(response)

  return mapExpense(data)
}

export async function deleteExpense(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
    method: "DELETE",
  })

  return handleResponse<void>(response)
}

export async function getBalances(): Promise<Balance[]> {
  const response = await fetch(`${API_BASE_URL}/balances`)
  return handleResponse<Balance[]>(response)
}

export async function getSettlements(): Promise<Settlement[]> {
  const response = await fetch(`${API_BASE_URL}/settlements`)
  return handleResponse<Settlement[]>(response)
}
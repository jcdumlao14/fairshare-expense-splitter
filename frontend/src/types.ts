export type Member = {
  id: string
  name: string
  initials: string
}

export type Expense = {
  id: string
  description: string
  amount: number
  paidBy: string
  participants: string[]
  date: string
  category: string
}

export type Balance = {
  member: string
  amount: number
}
